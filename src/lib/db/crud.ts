// Generic CRUD operations for registered entities. Validation, uniqueness,
// linking, timestamps, soft deletes, and audit logging are handled uniformly.

import { getDb, id as newId } from './server';
import { HttpError, type AdminIdentity } from './auth';
import { auditTx, diffRecords } from './audit';
import { getEntityConfig, type EntityConfig } from './registry';
import { isPermanentCdnUrl } from '../media/permanentUrl';
import { formatValidationError } from '../validation/formatError';
import { schemaForPartialUpdate } from '../validation/partialUpdate';
import { deleteAffiliateLinkCascade, deleteProductCascade } from './cascade-delete';
import {
  onHomepageSlotRemoved,
  syncCharacterHomepageSlot,
  syncHomepageSlotToCharacter,
} from '../homepage/featuredCharacters';

export interface WritePayload {
  fields: Record<string, unknown>;
  links?: Record<string, string | null>;
}

function config(entity: string): EntityConfig {
  const cfg = getEntityConfig(entity);
  if (!cfg) throw new HttpError(404, `Unknown entity: ${entity}`);
  return cfg;
}

/**
 * Link includes for reads. Media rows cache a signed storage URL in `url`
 * that expires, so any media link (and the media namespace itself) must also
 * include the `file` link — its `url` is re-signed by InstantDB on each query.
 */
function readLinkIncludes(cfg: EntityConfig): Record<string, object> {
  const linkIncludes: Record<string, object> = {};
  for (const [label, target] of Object.entries(cfg.links ?? {})) {
    linkIncludes[label] = target === 'media' ? { file: {} } : {};
  }
  if (cfg.namespace === 'media') linkIncludes.file = {};
  return linkIncludes;
}

/** Refresh expiring InstantDB signed URLs; leave permanent CDN URLs untouched. */
function refreshMediaUrl(mediaRow: any) {
  if (!mediaRow || typeof mediaRow !== 'object') return;
  const cached = mediaRow.url ? String(mediaRow.url) : '';
  if (isPermanentCdnUrl(cached)) return;
  if (mediaRow.file?.url) {
    mediaRow.url = mediaRow.file.url;
  }
}

function refreshRowMediaUrls(row: any, cfg: EntityConfig) {
  if (cfg.namespace === 'media') refreshMediaUrl(row);
  for (const [label, target] of Object.entries(cfg.links ?? {})) {
    if (target !== 'media') continue;
    const linked = row?.[label];
    if (Array.isArray(linked)) linked.forEach(refreshMediaUrl);
    else refreshMediaUrl(linked);
  }
}

export async function listEntities(entity: string, includeDeleted = false) {
  const cfg = config(entity);
  const db = getDb();
  const result = await (db.query as any)({ [cfg.namespace]: { ...readLinkIncludes(cfg) } });
  let rows = (result as any)[cfg.namespace] as any[];
  if (cfg.softDelete && !includeDeleted) rows = rows.filter((r) => !r.deletedAt);
  for (const row of rows) refreshRowMediaUrls(row, cfg);
  return rows;
}

export async function getEntity(entity: string, recordId: string) {
  const cfg = config(entity);
  const db = getDb();
  const result = await (db.query as any)({
    [cfg.namespace]: { $: { where: { id: recordId } }, ...readLinkIncludes(cfg) },
  });
  const row = (result as any)[cfg.namespace]?.[0];
  if (!row) throw new HttpError(404, `${entity} not found`);
  refreshRowMediaUrls(row, cfg);
  return row;
}

async function assertUnique(
  cfg: EntityConfig,
  fields: Record<string, unknown>,
  excludeId?: string,
) {
  const db = getDb();
  for (const field of cfg.uniqueFields ?? []) {
    const value = fields[field];
    if (value === undefined || value === null) continue;
    const result = await (db.query as any)({
      [cfg.namespace]: { $: { where: { [field]: value } } },
    });
    const rows = (result as any)[cfg.namespace] as any[];
    const conflict = rows.find((r) => r.id !== excludeId && !r.deletedAt);
    if (conflict) {
      throw new HttpError(
        409,
        `A ${cfg.namespace} record with ${field}="${value}" already exists`,
      );
    }
    // InstantDB unique indexes ignore deletedAt — block re-use while a soft-deleted row exists.
    const softDeleted = rows.find((r) => r.id !== excludeId && r.deletedAt);
    if (softDeleted && cfg.softDelete) {
      throw new HttpError(
        409,
        `A deleted ${cfg.namespace} record still holds ${field}="${value}". Delete it permanently from the admin or restore it before reusing this value.`,
      );
    }
  }
}

function validateLinks(cfg: EntityConfig, links?: Record<string, string | null>) {
  if (!links) return;
  for (const label of Object.keys(links)) {
    if (!cfg.links?.[label]) {
      throw new HttpError(400, `Unknown link "${label}" for ${cfg.namespace}`);
    }
  }
}

function applyTimestampFields(
  cfg: EntityConfig,
  fields: Record<string, unknown>,
  mode: 'create' | 'update',
) {
  const stampFields = cfg.timestampFields;
  if (!stampFields?.length) return;
  const now = Date.now();
  if (mode === 'create' && stampFields.includes('createdAt')) {
    fields.createdAt = fields.createdAt ?? now;
  }
  if (stampFields.includes('updatedAt')) {
    fields.updatedAt = now;
  }
}

function isSchemaMismatchError(error: unknown): boolean {
  const parts: string[] = [];
  if (error instanceof Error) parts.push(error.message);
  if (error && typeof error === 'object') {
    const body = (error as { body?: { message?: string } }).body?.message;
    if (body) parts.push(body);
  }
  parts.push(String(error));
  const msg = parts.join(' ');
  return msg.includes('missing in your schema') || msg.includes('Attributes are missing');
}

/** Fields added locally that may not exist on InstantDB until `npm run db:push`. */
const MEDIA_FIELDS_PENDING_SCHEMA = ['mediaTags', 'heroSortOrder'] as const;

function stripMediaFieldsPendingSchema(fields: Record<string, unknown>): Record<string, unknown> {
  const out = { ...fields };
  for (const key of MEDIA_FIELDS_PENDING_SCHEMA) delete out[key];
  return out;
}

async function rawTransact(chunks: unknown[]) {
  const db = getDb();
  await db.transact(chunks as any);
}

async function transact(chunks: unknown[]) {
  try {
    await rawTransact(chunks);
  } catch (e: unknown) {
    if (isSchemaMismatchError(e)) {
      throw new HttpError(
        400,
        'Database schema is out of date. Run `npm run db:push` in the project root, confirm the push, then try again.',
      );
    }
    throw e;
  }
}

function buildUpdateChunk(
  cfg: EntityConfig,
  recordId: string,
  fields: Record<string, unknown>,
  payload: WritePayload,
  existing: Record<string, unknown>,
) {
  const db = getDb();
  let chunk = (db.tx as any)[cfg.namespace][recordId].update(fields);
  const linkMap: Record<string, string> = {};
  const unlinkMap: Record<string, string> = {};
  for (const [label, target] of Object.entries(payload.links ?? {})) {
    if (target) {
      linkMap[label] = target;
    } else if ((existing as any)[label]?.id) {
      unlinkMap[label] = (existing as any)[label].id;
    }
  }
  if (Object.keys(linkMap).length > 0) chunk = chunk.link(linkMap);
  if (Object.keys(unlinkMap).length > 0) chunk = chunk.unlink(unlinkMap);
  return chunk;
}

export async function createEntity(
  entity: string,
  payload: WritePayload,
  identity: AdminIdentity,
): Promise<{ id: string }> {
  const cfg = config(entity);
  const parsed = cfg.schema.safeParse(payload.fields);
  if (!parsed.success) {
    throw new HttpError(400, formatValidationError(parsed.error));
  }
  const fields = { ...(cfg.createDefaults?.() ?? {}), ...(parsed.data as Record<string, unknown>) };
  validateLinks(cfg, payload.links);
  await assertUnique(cfg, fields);

  applyTimestampFields(cfg, fields, 'create');

  const db = getDb();
  const recordId = newId();
  let chunk = (db.tx as any)[cfg.namespace][recordId].update(fields);
  const linkMap: Record<string, string> = {};
  for (const [label, target] of Object.entries(payload.links ?? {})) {
    if (target) linkMap[label] = target;
  }
  if (Object.keys(linkMap).length > 0) chunk = chunk.link(linkMap);

  await transact([
    chunk,
    auditTx({
      actorEmail: identity.email,
      action: 'create',
      recordType: cfg.namespace,
      recordId,
      newValue: fields,
    }),
  ]);

  if (entity === 'characters' && fields.featured === true) {
    await syncCharacterHomepageSlot(
      recordId,
      true,
      typeof fields.homepageOrder === 'number' ? fields.homepageOrder : null,
    );
  }
  if (entity === 'homepageSlots' && fields.kind === 'featured_character' && payload.links?.character) {
    await syncHomepageSlotToCharacter(
      recordId,
      'featured_character',
      fields.active !== false,
      payload.links.character,
    );
  }

  return { id: recordId };
}

export async function updateEntity(
  entity: string,
  recordId: string,
  payload: WritePayload,
  identity: AdminIdentity,
): Promise<void> {
  const cfg = config(entity);
  const partialSchema = schemaForPartialUpdate(cfg.schema);
  const parsed = partialSchema.safeParse(payload.fields);
  if (!parsed.success) {
    throw new HttpError(400, formatValidationError(parsed.error));
  }
  const fields = parsed.data as Record<string, unknown>;
  validateLinks(cfg, payload.links);

  const existing = await getEntity(entity, recordId);
  await assertUnique(cfg, fields, recordId);

  applyTimestampFields(cfg, fields, 'update');

  const chunk = buildUpdateChunk(cfg, recordId, fields, payload, existing);
  const { oldValue, newValue } = diffRecords(existing, fields);
  const auditChunk = auditTx({
    actorEmail: identity.email,
    action: 'update',
    recordType: cfg.namespace,
    recordId,
    oldValue,
    newValue,
  });
  const chunks = [chunk, auditChunk];

  try {
    await rawTransact(chunks);
  } catch (e: unknown) {
    if (
      entity === 'media' &&
      isSchemaMismatchError(e) &&
      MEDIA_FIELDS_PENDING_SCHEMA.some((key) => key in fields)
    ) {
      const stripped = stripMediaFieldsPendingSchema(fields);
      const fallbackChunk = buildUpdateChunk(cfg, recordId, stripped, payload, existing);
      const { oldValue: old2, newValue: new2 } = diffRecords(existing, stripped);
      await transact([
        fallbackChunk,
        auditTx({
          actorEmail: identity.email,
          action: 'update',
          recordType: cfg.namespace,
          recordId,
          oldValue: old2,
          newValue: new2,
        }),
      ]);
    } else if (isSchemaMismatchError(e)) {
      throw new HttpError(
        400,
        'Database schema is out of date. Run `npm run db:push` in the project root, confirm the push, then try again.',
      );
    } else {
      throw e;
    }
  }

  if (entity === 'characters' && 'featured' in fields) {
    await syncCharacterHomepageSlot(
      recordId,
      Boolean(fields.featured),
      typeof fields.homepageOrder === 'number' ? fields.homepageOrder : null,
    );
  }
  if (entity === 'homepageSlots') {
    const kind = String(fields.kind ?? existing.kind ?? '');
    const characterId =
      payload.links?.character ??
      existing.character?.id ??
      null;
    const active =
      'active' in fields ? fields.active !== false : existing.active !== false;
    if (kind === 'featured_character' && characterId) {
      await syncHomepageSlotToCharacter(recordId, kind, active, characterId);
    }
  }
}

export async function deleteEntity(
  entity: string,
  recordId: string,
  identity: AdminIdentity,
  opts: { permanent?: boolean } = {},
): Promise<void> {
  if (entity === 'products') {
    await deleteProductCascade(recordId, identity);
    return;
  }
  if (entity === 'affiliateLinks') {
    await deleteAffiliateLinkCascade(recordId, identity);
    return;
  }

  const cfg = config(entity);
  const existing = await getEntity(entity, recordId);
  const db = getDb();

  if (entity === 'characters') {
    await syncCharacterHomepageSlot(recordId, false);
  }

  if (entity === 'homepageSlots') {
    await onHomepageSlotRemoved(existing);
  }

  if (cfg.softDelete && !opts.permanent) {
    await db.transact([
      (db.tx as any)[cfg.namespace][recordId].update({ deletedAt: Date.now() }),
      auditTx({
        actorEmail: identity.email,
        action: 'delete',
        recordType: cfg.namespace,
        recordId,
        oldValue: existing,
        reason: 'soft delete',
      }),
    ]);
    return;
  }

  // Permanent deletion is restricted to owners (checked by caller route).
  await db.transact([
    (db.tx as any)[cfg.namespace][recordId].delete(),
    auditTx({
      actorEmail: identity.email,
      action: 'delete',
      recordType: cfg.namespace,
      recordId,
      oldValue: existing,
      reason: opts.permanent ? 'permanent delete' : undefined,
    }),
  ]);
}

export async function restoreEntity(
  entity: string,
  recordId: string,
  identity: AdminIdentity,
): Promise<void> {
  const cfg = config(entity);
  if (!cfg.softDelete) throw new HttpError(400, `${entity} does not support restore`);
  const db = getDb();
  await db.transact([
    (db.tx as any)[cfg.namespace][recordId].update({ deletedAt: null }),
    auditTx({
      actorEmail: identity.email,
      action: 'restore',
      recordType: cfg.namespace,
      recordId,
    }),
  ]);
}
