export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission, HttpError } from '../../../../../lib/db/auth';
import {
  listTestRunsForProduct,
  normalizeInstantId,
} from '../../../../../lib/db/listTestRunsForProduct';

/** Test runs for one product (InstantDB). */
export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const productId = params.id ? normalizeInstantId(params.id) : '';
  if (!productId) throw new HttpError(400, 'Missing product id');

  const rows = await listTestRunsForProduct(productId);
  return json({ rows });
});
