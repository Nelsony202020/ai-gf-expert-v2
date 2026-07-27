export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../../lib/api';
import { requirePermission } from '../../../../../../lib/db/auth';
import { markSuggestionRejected } from '../../../../../../lib/ai-verdict/generate';

export const POST: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'content.edit');
  const suggestion = await markSuggestionRejected(params.id!, identity);
  return json({ suggestion });
});
