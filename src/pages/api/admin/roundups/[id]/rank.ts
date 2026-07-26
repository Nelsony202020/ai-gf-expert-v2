export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission } from '../../../../../lib/db/auth';
import { computeRoundupRanking, applyCalculatedRanking } from '../../../../../lib/db/ranking';

/** GET = preview calculated ranking; POST = persist calculated positions. */
export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const result = await computeRoundupRanking(params.id!);
  return json(result);
});

export const POST: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'content.edit');
  const entries = await applyCalculatedRanking(params.id!, identity);
  return json({ entries });
});
