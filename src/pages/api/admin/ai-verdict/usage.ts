export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { getUsageSummary } from '../../../../lib/ai-verdict/generate';

export const GET: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'audit.view');
  const usage = await getUsageSummary();
  return json({ usage });
});
