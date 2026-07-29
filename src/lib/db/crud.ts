// Generic CRUD operations for registered entities. Validation, uniqueness,
// linking, timestamps, soft deletes, and audit logging are handled uniformly.

import { getDb, id as newId } from './server';
import { HttpError, type AdminIdentity } from './auth';
import { auditTx, diffRecords } from './audit';
import { getEntityConfig, type EntityConfig } from './registry';
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

export async function listEntities(entity: string, includeDeleted = false) {
  const cfg = config(entity);
  const db = getDb();
  const linkIncludes: Record<string, object> = {};
  for (const label of Object.keys(cfg.links ?? {})) linkIncludes[label] = {};
  const result = await (db.query as any)({ [cfg.namespace]: { ...linkIncludes } });
  let rows = (result as any)[cfg.namespace] as any[];
  if (cfg.softDelete && !includeDeleted) rows = rows.filter((r) => !r.deletedAt);
  return rows;
}

export async function getEntity(entity: string, recordId: string) {
  const cfg = config(entity);
  const db = getDb();
  const linkIncludes: Record<string, object> = {};
  for (const label of Object.keys(cfg.links ?? {})) linkIncludes[label] = {};
  const result = await (db.query as any)({
    [cfg.namespace]: { $: { where: { id: recordId } }, ...linkIncludes },
  });
  const row = (result as any)[cfg.namespace]?.[0];
  if (!row) throw new HttpError(404, `${entity} not found`);
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

async function transact(chunks: unknown[]) {
  const db = getDb();
  try {
    await db.transact(chunks as any);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('missing in your schema')) {
      throw new HttpError(
        400,
        'Database schema is out of date. Run `npm run db:push` in the project root, confirm the push, then try again.',
      );
    }
    throw e;
  }
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

  const db = getDb();
  let chunk = (db.tx as any)[cfg.namespace][recordId].update(fields);
  const linkMap: Record<string, string> = {};
  const unlinkMap: Record<string, string> = {};
  for (const [label, target] of Object.entries(payload.links ?? {})) {
    if (target) {
      linkMap[label] = target;
    } else if (existing[label]?.id) {
      unlinkMap[label] = existing[label].id;
    }
  }
  if (Object.keys(linkMap).length > 0) chunk = chunk.link(linkMap);
  if (Object.keys(unlinkMap).length > 0) chunk = chunk.unlink(unlinkMap);

  const { oldValue, newValue } = diffRecords(existing, fields);

  await transact([
    chunk,
    auditTx({
      actorEmail: identity.email,
      action: 'update',
      recordType: cfg.namespace,
      recordId,
      oldValue,
      newValue,
    }),
  ]);

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
