export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission } from '../../../../../lib/db/auth';
import { getSuggestion } from '../../../../../lib/ai-verdict/generate';

export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const suggestion = await getSuggestion(params.id!);
  return json({ suggestion });
});
