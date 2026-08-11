/** Slugs kept reachable on localhost when draft — editor test reviews. */
export const DEV_REVIEW_SLUGS = ['aura-ai'] as const;
export const DEV_REVIEW_SLUG_SET = new Set<string>(DEV_REVIEW_SLUGS);

/** Review pages that include the Market Data tab (test pages only). */
export const MARKET_DATA_TAB_SLUGS = new Set(['aura-ai']);

/** Review pages that include the Alternatives tab (test pages only). */
export const ALTERNATIVES_TAB_SLUGS = new Set(['aura-ai']);

/** Slugs that show the full Photos & Videos gallery (draft test page only). */
export const PHOTOS_VIDEOS_TAB_SLUGS = new Set(['aura-ai']);

/** Review pages that include the full Pricing tab (test pages only). */
export const PRICING_TAB_SLUGS = new Set(['aura-ai']);

export function isDevReviewSlug(slug: string): boolean {
  return DEV_REVIEW_SLUG_SET.has(slug);
}

export function hasMarketDataTab(slug: string): boolean {
  return MARKET_DATA_TAB_SLUGS.has(slug);
}

export function hasAlternativesTab(slug: string): boolean {
  return ALTERNATIVES_TAB_SLUGS.has(slug);
}

export function hasPhotosVideosTab(slug: string): boolean {
  return PHOTOS_VIDEOS_TAB_SLUGS.has(slug);
}

export function hasPricingTab(slug: string): boolean {
  return PRICING_TAB_SLUGS.has(slug);
}
