export const prerender = false;

import type { APIRoute } from 'astro';

const NOINDEX = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
} as const;

/**
 * Legacy WordPress Pretty Links still live in YouTube descriptions.
 * Map /recommends/[slug] → /go/[slug]-youtube so traffic hits the
 * cloaked affiliate route (and the 18+ interstitial).
 */
const GO_SLUG_OVERRIDES: Record<string, string> = {
  'candy-ai': 'candy-ai-youtube',
  'spicychat-ai-youtube': 'spicychat-ai-youtube',
  'nectar-ai-youtube': 'nectar-ai-youtube',
  'nectar-ai-2': 'nectar-ai-youtube',
  // The old Kupid pretty links appeared with and without the "-2" and with a C.
  'kupid-ai': 'kupid-ai-2-youtube',
  'kupid-ai-2': 'kupid-ai-2-youtube',
  'cupid-ai': 'kupid-ai-2-youtube',
};

function toGoSlug(recommendsSlug: string): string {
  const override = GO_SLUG_OVERRIDES[recommendsSlug];
  if (override) return override;
  if (recommendsSlug.endsWith('-youtube') || recommendsSlug.includes('-youtube-')) {
    return recommendsSlug;
  }
  // Quiz/short variants of a brand link never got their own /go/ slug — the DB
  // only holds `<brand>-youtube` — so strip the variant suffix before mapping.
  // (The old override sent girlfriendgpt-quiz to girlfriendgpt-quiz-youtube,
  // which doesn't exist, and /go/ bounced those visitors to the homepage.)
  const base = recommendsSlug.replace(/-(quiz|yt)$/, '');
  return `${base}-youtube`;
}

export const GET: APIRoute = async ({ params }) => {
  const raw = params.slug;
  const slug = (Array.isArray(raw) ? raw.join('/') : String(raw ?? ''))
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();

  if (!slug || slug.includes('..') || /[^a-z0-9/_-]/.test(slug)) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/', ...NOINDEX },
    });
  }

  const goSlug = toGoSlug(slug);
  return new Response(null, {
    status: 302,
    headers: { Location: `/go/${goSlug}`, ...NOINDEX },
  });
};
