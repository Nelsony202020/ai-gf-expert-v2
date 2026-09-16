export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission, HttpError } from '../../../../../lib/db/auth';
import { getDb } from '../../../../../lib/db/server';

/** Test runs for one product — avoids loading every testRun in the admin workspace. */
export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const productId = params.id?.trim();
  if (!productId) throw new HttpError(400, 'Missing product id');

  const db = getDb();
  const { products } = await (db.query as any)({
    products: {
      $: { where: { id: productId } },
      testRuns: { methodologyVersion: {} },
    },
  });

  const product = (products as any[])?.find((p) => !p.deletedAt);
  if (!product) throw new HttpError(404, 'Product not found');

  const rows = ((product.testRuns ?? []) as any[]).filter((r) => !r.deletedAt);
  rows.sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0));

  return json({ rows });
});
