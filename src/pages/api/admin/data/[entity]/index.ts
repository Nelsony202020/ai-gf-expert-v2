export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../../lib/api';
import { requirePermission, HttpError } from '../../../../../lib/db/auth';
import { getEntityConfig } from '../../../../../lib/db/registry';
import { listEntities, createEntity, type WritePayload } from '../../../../../lib/db/crud';
import { normalizeInstantId } from '../../../../../lib/db/listTestRunsForProduct';

export const GET: APIRoute = handler(async ({ request, params, url }) => {
  const entity = params.entity!;
  const cfg = getEntityConfig(entity);
  if (!cfg) throw new HttpError(404, `Unknown entity: ${entity}`);
  await requirePermission(request, cfg.readPermission);
  const includeDeleted = url.searchParams.get('deleted') === '1';
  const productRaw = url.searchParams.get('productId');
  const productId = productRaw ? normalizeInstantId(productRaw) : undefined;
  const rows = await listEntities(entity, includeDeleted, { productId });
  return json({ rows });
});

export const POST: APIRoute = handler(async ({ request, params }) => {
  const entity = params.entity!;
  const cfg = getEntityConfig(entity);
  if (!cfg) throw new HttpError(404, `Unknown entity: ${entity}`);
  const identity = await requirePermission(request, cfg.writePermission);
  const payload = await readJson<WritePayload>(request);
  if (!payload?.fields) throw new HttpError(400, 'Missing "fields"');
  const result = await createEntity(entity, payload, identity);
  return json(result, 201);
});
