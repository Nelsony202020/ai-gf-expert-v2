export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../../lib/api';
import { requirePermission, HttpError } from '../../../../../../lib/db/auth';
import { getEntityConfig } from '../../../../../../lib/db/registry';
import { restoreEntity } from '../../../../../../lib/db/crud';

export const POST: APIRoute = handler(async ({ request, params }) => {
  const entity = params.entity!;
  const cfg = getEntityConfig(entity);
  if (!cfg) throw new HttpError(404, `Unknown entity: ${entity}`);
  const identity = await requirePermission(request, 'records.delete');
  await restoreEntity(entity, params.id!, identity);
  return json({ ok: true });
});
