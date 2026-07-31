export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission } from '../../../../../lib/db/auth';
import { loadRunMethodologyStructure } from '../../../../../lib/scoring/testRuns';

/** Methodology tree for a test run (categories → subscores → evidence definitions). */
export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const structure = await loadRunMethodologyStructure(params.id!);
  return json(structure);
});
