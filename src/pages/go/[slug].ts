export const prerender = false;

import type { APIRoute } from 'astro';
import { getDb, isDbConfigured } from '../../lib/db/server';
import { affiliateRel } from '../../lib/affiliate/rel';
import {
  isSafeHttpUrl,
  isSameSiteDestination,
  linkedProduct,
  needsYoutubeAgeGate,
  renderYoutubeAgeGateHtml,
  youtubeAgeGateBackUrl,
} from '../../lib/affiliate/youtubeAgeGate';

const NOINDEX = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
} as const;

function redirectTo(location: string, extra?: HeadersInit) {
  return new Response(null, {
    status: 302,
    headers: { Location: location, ...NOINDEX, ...extra },
  });
}

/**
 * Cloaked affiliate redirect: /go/[cloakedSlug] -> destination URL.
 * YouTube campaign links show a fast 18+ interstitial first.
 * Destinations are managed in admin; changing one updates every CTA instantly.
 */
/** Slugs shared publicly that differ from the cloakedSlug stored in the DB. */
const SLUG_ALIASES: Record<string, string> = {
  'kupid-ai-youtube': 'kupid-ai-2-youtube',
  'ourdream-ai-youtube': 'ourdream-ai-yt',
};

export const GET: APIRoute = async ({ params, url }) => {
  const rawSlug = params.slug!;
  const slug = SLUG_ALIASES[rawSlug] ?? rawSlug;
  if (!isDbConfigured()) return redirectTo('/');

  const db = getDb();
  const { affiliateLinks } = await db.query({
    affiliateLinks: { $: { where: { cloakedSlug: slug } }, product: {} },
  });
  const link = affiliateLinks[0] as (typeof affiliateLinks)[0] & {
    product?: { youtubeReviewUrl?: string | null } | { youtubeReviewUrl?: string | null }[];
  };

  const now = Date.now();
  const isLive =
    link &&
    link.active &&
    (!link.startAt || Number(link.startAt) <= now) &&
    (!link.endAt || Number(link.endAt) >= now);

  if (!isLive) {
    return redirectTo('/');
  }

  const destinationUrl = String(link.destinationUrl ?? '');
  if (!isSafeHttpUrl(destinationUrl)) {
    return redirectTo('/');
  }

  db.transact(
    db.tx.affiliateLinks[link.id].update({ clickCount: (link.clickCount ?? 0) + 1 }),
  ).catch(() => {});

  if (
    needsYoutubeAgeGate(link) &&
    !isSameSiteDestination(destinationUrl, url.hostname)
  ) {
    const product = linkedProduct(link.product);
    return new Response(
      renderYoutubeAgeGateHtml({
        destinationUrl,
        backUrl: youtubeAgeGateBackUrl(product?.youtubeReviewUrl),
        relTags: affiliateRel(link.relTags),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...NOINDEX,
        },
      },
    );
  }

  return redirectTo(destinationUrl);
};
