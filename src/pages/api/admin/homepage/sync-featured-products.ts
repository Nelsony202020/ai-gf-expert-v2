export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { reconcileFeaturedProductSlots } from '../../../../lib/homepage/featuredProducts';

/** Backfill homepage top_pick slots for products already marked homepageFeatured. */
export const POST: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'homepage.edit');
  const synced = await reconcileFeaturedProductSlots();
  return json({ ok: true, synced });
});
