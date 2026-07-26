export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../../../lib/api';
import { requirePermission, HttpError } from '../../../../../../lib/db/auth';
import { getEntityConfig } from '../../../../../../lib/db/registry';
import {
  getEntity,
  updateEntity,
  deleteEntity,
  type WritePayload,
} from '../../../../../../lib/db/crud';

export const GET: APIRoute = handler(async ({ request, params }) => {
  const entity = params.entity!;
  const cfg = getEntityConfig(entity);
  if (!cfg) throw new HttpError(404, `Unknown entity: ${entity}`);
  await requirePermission(request, cfg.readPermission);
  const row = await getEntity(entity, params.id!);
  return json({ row });
});

export const PATCH: APIRoute = handler(async ({ request, params }) => {
  const entity = params.entity!;
  const cfg = getEntityConfig(entity);
  if (!cfg) throw new HttpError(404, `Unknown entity: ${entity}`);
  const identity = await requirePermission(request, cfg.writePermission);
  const payload = await readJson<WritePayload>(request);
  if (!payload?.fields && !payload?.links) throw new HttpError(400, 'Missing "fields" or "links"');
  await updateEntity(entity, params.id!, { fields: payload.fields ?? {}, links: payload.links }, identity);
  return json({ ok: true });
});

export const DELETE: APIRoute = handler(async ({ request, params, url }) => {
  const entity = params.entity!;
  const cfg = getEntityConfig(entity);
  if (!cfg) throw new HttpError(404, `Unknown entity: ${entity}`);
  const permanent = url.searchParams.get('permanent') === '1';
  // Soft delete needs records.delete; permanent deletion is owner-only.
  const identity = await requirePermission(request, 'records.delete');
  if (permanent && identity.role !== 'owner') {
    throw new HttpError(403, 'Permanent deletion is restricted to the owner');
  }
  await deleteEntity(entity, params.id!, identity, { permanent });
  return json({ ok: true });
});
