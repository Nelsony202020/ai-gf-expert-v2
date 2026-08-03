// Canonical public site origin for sitemaps, canonical URLs, and SEO exports.
// Never emit localhost — builds and dev often set Astro.site to :4321.

import { env } from './env';

const DEFAULT_ORIGIN = 'https://aigirlfriend.expert';

function isLocalOrigin(origin: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(origin);
}

/** Production origin for absolute URLs in XML sitemaps and the SEO registry. */
export function publicSiteOrigin(astroSite?: URL | string | null): string {
  if (astroSite) {
    const fromAstro = String(astroSite).replace(/\/$/, '');
    if (fromAstro && !isLocalOrigin(fromAstro)) return fromAstro;
  }

  const fromEnv = env('PUBLIC_SITE_URL')?.trim().replace(/\/$/, '');
  if (fromEnv && !isLocalOrigin(fromEnv)) return fromEnv;

  return DEFAULT_ORIGIN;
}
