export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission } from '../../../../../lib/db/auth';
import { publishRun } from '../../../../../lib/scoring/testRuns';

export const POST: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'content.publish');
  const result = await publishRun(params.id!, identity);
  return json(result);
});
