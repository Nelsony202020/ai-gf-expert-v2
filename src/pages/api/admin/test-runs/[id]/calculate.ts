export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission } from '../../../../../lib/db/auth';
import { calculateRun } from '../../../../../lib/scoring/testRuns';

/** Score preview: full tree + blocking errors + warnings. */
export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const { tree } = await calculateRun(params.id!);
  return json({ tree });
});
