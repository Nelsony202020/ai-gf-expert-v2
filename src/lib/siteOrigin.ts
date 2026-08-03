// Canonical public site origin for sitemaps, canonical URLs, and SEO exports.
// Never emit localhost — builds and dev often set Astro.site to :4321.

import { env } from './env';
import { publicPagePath } from './urls';

export const PRODUCTION_SITE_ORIGIN = 'https://aigirlfriend.expert';

function isLocalHost(host: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(host);
}

/** True when a URL or origin string points at localhost / loopback. */
export function isLocalUrl(url: string): boolean {
  return isLocalHost(url);
}

/** Production origin for absolute URLs in XML sitemaps and the SEO registry. */
export function publicSiteOrigin(astroSite?: URL | string | null): string {
  if (astroSite) {
    const fromAstro = String(astroSite).replace(/\/$/, '');
    if (fromAstro && !isLocalHost(fromAstro)) return fromAstro;
  }

  const fromEnv = env('PUBLIC_SITE_URL')?.trim().replace(/\/$/, '');
  if (fromEnv && !isLocalHost(fromEnv)) return fromEnv;

  return PRODUCTION_SITE_ORIGIN;
}

/** Fail production builds that would ship localhost in SEO metadata. */
export function assertProductionCanonical(url: string, context = 'canonical'): void {
  if (!import.meta.env.PROD) return;
  if (isLocalUrl(url)) {
    throw new Error(
      `[${context}] Production build would emit a localhost URL: ${url}. ` +
        'Use https://aigirlfriend.expert and remove localhost values from canonicalUrl fields.',
    );
  }
}

/** Absolute HTTPS canonical for a public page path (trailing slash on HTML routes). */
export function canonicalPublicUrl(
  pathname: string,
  astroSite?: URL | string | null,
): string {
  const origin = publicSiteOrigin(astroSite);
  const path = publicPagePath(pathname.startsWith('/') ? pathname : `/${pathname}`);
  const url = new URL(path, origin).toString();
  assertProductionCanonical(url);
  return url;
}

/**
 * Prefer an explicit canonical override when it is a valid production URL;
 * ignore localhost overrides saved during local testing.
 */
export function resolveCanonicalUrl(
  pathname: string,
  override?: string | null,
  astroSite?: URL | string | null,
): string {
  const trimmed = String(override ?? '').trim();
  const origin = publicSiteOrigin(astroSite);

  if (trimmed && !isLocalUrl(trimmed)) {
    try {
      if (/^https?:\/\//i.test(trimmed)) {
        const parsed = new URL(trimmed);
        const allowedOrigins = new Set([origin.replace(/\/$/, ''), PRODUCTION_SITE_ORIGIN]);
        const parsedOrigin = `${parsed.protocol}//${parsed.host}`;
        if (allowedOrigins.has(parsedOrigin)) {
          const path = publicPagePath(parsed.pathname + parsed.search + parsed.hash);
          const url = `${parsedOrigin}${path}`;
          assertProductionCanonical(url);
          return url;
        }
      } else {
        return canonicalPublicUrl(trimmed, astroSite);
      }
    } catch {
      // fall through to default
    }
  }

  return canonicalPublicUrl(pathname, astroSite);
}
