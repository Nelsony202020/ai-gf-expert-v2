/** Default rel tokens for outbound affiliate / cloaked /go/ links (Google disclosure). */
export const DEFAULT_AFFILIATE_REL = 'nofollow sponsored noopener';

/** Normalize stored rel tags or fall back to the site default. */
export function affiliateRel(tags?: string | null): string {
  const trimmed = tags?.trim();
  return trimmed || DEFAULT_AFFILIATE_REL;
}

/** True when href is an external affiliate-style outbound link (not in-site). */
export function isExternalAffiliateHref(href: string | undefined | null): boolean {
  if (!href?.trim() || href === '#') return false;
  return /^https?:\/\//i.test(href) || href.startsWith('/go/');
}
