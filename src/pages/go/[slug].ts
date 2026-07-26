export const prerender = false;

import type { APIRoute } from 'astro';
import { getDb, isDbConfigured } from '../../lib/db/server';

/**
 * Cloaked affiliate redirect: /go/[cloakedSlug] -> destination URL.
 * Destinations are managed centrally in the admin; changing one updates
 * every CTA sitewide instantly. Click counts are recorded (future-ready).
 */
export const GET: APIRoute = async ({ params, redirect }) => {
  const slug = params.slug!;
  if (!isDbConfigured()) return redirect('/', 302);

  const db = getDb();
  const { affiliateLinks } = await db.query({
    affiliateLinks: { $: { where: { cloakedSlug: slug } } },
  });
  const link = affiliateLinks[0];

  const now = Date.now();
  const isLive =
    link &&
    link.active &&
    (!link.startAt || Number(link.startAt) <= now) &&
    (!link.endAt || Number(link.endAt) >= now);

  if (!isLive) {
    // Expired or unknown link: send to homepage rather than 404 (keeps old
    // shared/indexed /go/ URLs useful).
    return redirect('/', 302);
  }

  // Fire-and-forget click counter.
  db.transact(
    db.tx.affiliateLinks[link.id].update({ clickCount: (link.clickCount ?? 0) + 1 }),
  ).catch(() => {});

  return new Response(null, {
    status: 302,
    headers: {
      Location: link.destinationUrl,
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
};
