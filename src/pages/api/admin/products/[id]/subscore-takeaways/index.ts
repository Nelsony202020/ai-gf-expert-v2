export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../../lib/api';
import { requirePermission } from '../../../../../../lib/db/auth';
import { listProductTakeawaysSlim } from '../../../../../../lib/subscore-takeaways/listSubscores';

export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const data = await listProductTakeawaysSlim(String(params.id));
  return json(data);
});
