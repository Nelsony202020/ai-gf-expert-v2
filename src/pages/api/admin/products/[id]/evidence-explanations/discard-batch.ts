export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../../lib/api';
import { requirePermission } from '../../../../../../lib/db/auth';
import { discardAllExplanations } from '../../../../../../lib/ai-explanations/generate';

export const POST: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'testing.edit');
  const result = await discardAllExplanations(String(params.id), identity);
  return json(result);
});
