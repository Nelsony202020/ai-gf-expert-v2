export const prerender = false;
export const maxDuration = 60;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission, HttpError } from '../../../../../lib/db/auth';
import { normalizeInstantId } from '../../../../../lib/db/listTestRunsForProduct';
import { loadProductWorkspaceRelated } from '../../../../../lib/db/loadProductWorkspace';

/** InstantDB product + reverse-linked records for the admin workspace. */
export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const productId = params.id ? normalizeInstantId(params.id) : '';
  if (!productId) throw new HttpError(400, 'Missing product id');

  const related = await loadProductWorkspaceRelated(productId);
  return json({ related });
});
