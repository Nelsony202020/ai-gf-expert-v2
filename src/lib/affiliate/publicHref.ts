import { isGoAffiliateHref } from './rel';

const PLACEHOLDER_AFFILIATE_RE = /example\.com/i;

/** Dev/file fallback URLs that must never ship in public HTML. */
export function isPlaceholderAffiliateHref(href: string | undefined | null): boolean {
  const raw = href?.trim();
  if (!raw) return false;
  try {
    const url = new URL(raw, 'https://aigirlfriend.expert');
    return PLACEHOLDER_AFFILIATE_RE.test(url.hostname);
  } catch {
    return PLACEHOLDER_AFFILIATE_RE.test(raw);
  }
}

/** Normalize to a site-relative /go/{slug} path when possible. */
export function toRelativeGoHref(href: string): string | null {
  const raw = href.trim();
  if (!raw) return null;
  if (raw.startsWith('/go/') || raw === '/go') return raw;
  try {
    const url = new URL(raw, 'https://aigirlfriend.expert');
    if (url.pathname === '/go' || url.pathname.startsWith('/go/')) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Public affiliate CTA href for ranked products.
 * Prefer live `/go/…` from InstantDB; never return example.com placeholders.
 */
export function publicAffiliateHref(
  slug: string,
  href: string | undefined | null,
): string | null {
  const productSlug = slug.trim();
  if (!productSlug) return null;

  const raw = href?.trim() ?? '';
  if (raw && !isPlaceholderAffiliateHref(raw)) {
    const relativeGo = toRelativeGoHref(raw);
    if (relativeGo) return relativeGo;
    if (isGoAffiliateHref(raw)) return raw;
  }

  if (isPlaceholderAffiliateHref(raw) || !raw) {
    return `/go/${productSlug}`;
  }

  return null;
}
