export const prerender = false;

import type { APIRoute } from 'astro';
import { getDb, isDbConfigured } from '../../lib/db/server';
import { affiliateRel } from '../../lib/affiliate/rel';
import { ensureOurdreamYtAffiliateLink } from '../../lib/affiliate/ourdreamYtLink';
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
  'candy-ai-yt': 'candy-ai-youtube',
  'girlfriendgpt-yt': 'girlfriendgpt-youtube',
  'spicychat-ai-yt': 'spicychat-ai-youtube',
  'nectar-ai-yt': 'nectar-ai-youtube',
  'kupid-ai-yt': 'kupid-ai-2-youtube',
  'kupid-ai-youtube': 'kupid-ai-2-youtube',
  'ourdream-ai-youtube': 'ourdream-ai-yt',
};

const OURDREAM_AI_HUB = 'https://aigirlfriend.expert/guides/ourdream-ai/';

const BRAND_HUB_YOUTUBE_DESTINATIONS: Record<string, string> = {
  'candy-ai-youtube': 'https://aigirlfriend.expert/guides/candy-ai/',
  'nectar-ai-youtube': 'https://aigirlfriend.expert/guides/nectar-ai/',
  'girlfriendgpt-youtube': 'https://aigirlfriend.expert/guides/girlfriendgpt/',
};

/** YouTube /go slugs still routed to the OurDream hub (editable in admin). */
const OURDREAM_HUB_YOUTUBE_SLUGS = new Set([
  'spicychat-ai-youtube',
  'kupid-ai-2-youtube',
]);

function normalizeRedirectUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.protocol}//${parsed.host}${path}${parsed.search}`;
  } catch {
    return url.trim().replace(/\/+$/, '');
  }
}

function resolveForcedYoutubeHubDestination(
  slug: string,
  link: { id: string; destinationUrl?: string | null },
  db: ReturnType<typeof getDb>,
): string {
  const raw = String(link.destinationUrl ?? '');
  const forced =
    BRAND_HUB_YOUTUBE_DESTINATIONS[slug] ??
    (OURDREAM_HUB_YOUTUBE_SLUGS.has(slug) ? OURDREAM_AI_HUB : null);
  if (!forced) return raw;
  if (normalizeRedirectUrl(raw) === normalizeRedirectUrl(forced)) return raw;
  db.transact(
    db.tx.affiliateLinks[link.id].update({
      destinationUrl: forced,
      ageGate: false,
    }),
  ).catch(() => {});
  return forced;
}

export const GET: APIRoute = async ({ params, url }) => {
  try {
    return await handleGo(params.slug!, url);
  } catch {
    /* Every `return` below carries NOINDEX, but a throw does not: an unhandled
       error here becomes Astro's 500 page, which ships no X-Robots-Tag at all.
       Now that /go/ is crawlable, a transient DB failure while Googlebot is
       fetching would hand it an indexable response. Fail closed instead. */
    return redirectTo('/');
  }
};

async function handleGo(rawSlug: string, url: URL): Promise<Response> {
  const slug = SLUG_ALIASES[rawSlug] ?? rawSlug;
  if (!isDbConfigured()) return redirectTo('/');

  const db = getDb();
  const { affiliateLinks } = await db.query({
    affiliateLinks: { $: { where: { cloakedSlug: slug } }, product: {} },
  });
  let link = (await ensureOurdreamYtAffiliateLink(
    db,
    slug,
    affiliateLinks[0] as Parameters<typeof ensureOurdreamYtAffiliateLink>[2],
  ) ?? affiliateLinks[0]) as (typeof affiliateLinks)[0] & {
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

  const destinationUrl = resolveForcedYoutubeHubDestination(slug, link, db);
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
}
