export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { reconcileFeaturedCharacterSlots } from '../../../../lib/homepage/featuredCharacters';

/** Backfill homepage slots for characters already marked featured on homepage. */
export const POST: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'homepage.edit');
  const synced = await reconcileFeaturedCharacterSlots();
  return json({ ok: true, synced });
});
