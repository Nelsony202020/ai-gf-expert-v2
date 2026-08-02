export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../../lib/api';
import { requirePermission } from '../../../../../../lib/db/auth';
import { listProductExplanationsSlim } from '../../../../../../lib/ai-explanations/listGroups';

export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const data = await listProductExplanationsSlim(String(params.id));
  return json(data);
});
