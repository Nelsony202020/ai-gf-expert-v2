export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../lib/api';
import { HttpError } from '../../lib/db/auth';
import { getDb, isDbConfigured } from '../../lib/db/server';

/**
 * Public engagement endpoint: saves and upvotes from site visitors.
 * Popularity metrics NEVER affect the editorial score — they only feed the
 * cached popularityScore used for directory "popularity" sorting.
 */
export const POST: APIRoute = handler(async ({ request }) => {
  if (!isDbConfigured()) throw new HttpError(503, 'Not available');

  const body = (await request.json().catch(() => ({}))) as { slug?: string; action?: string };
  const { slug, action } = body;
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) throw new HttpError(400, 'Invalid slug');
  if (action !== 'save' && action !== 'upvote') throw new HttpError(400, 'Invalid action');

  const db = getDb();
  const { products } = await db.query({
    products: { $: { where: { slug, status: 'published' } } },
  });
  const product = (products as any[])[0];
  if (!product) throw new HttpError(404, 'Product not found');

  const saveCount = Number(product.saveCount ?? 0) + (action === 'save' ? 1 : 0);
  const upvoteCount = Number(product.upvoteCount ?? 0) + (action === 'upvote' ? 1 : 0);
  // Popularity: engagement-weighted, capped contribution from any one signal.
  const popularityScore = Math.round((saveCount * 2 + upvoteCount) * 100) / 100;

  await db.transact([
    db.tx.products[product.id].update({ saveCount, upvoteCount, popularityScore }),
  ]);

  return json({ ok: true, saveCount, upvoteCount });
});
