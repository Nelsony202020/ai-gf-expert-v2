/** Lowercase slug for URLs, e.g. "Chat Features" → "chat-features". */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function testContributorUrl(category: string, subscore: string, contributor: string): string {
  return `/tests/${toSlug(category)}/${toSlug(subscore)}/${toSlug(contributor)}`;
}

export function testSubscoreUrl(category: string, subscore: string): string {
  return `/tests/${toSlug(category)}/${toSlug(subscore)}`;
}

export function reviewRatingsUrl(productSlug: string): string {
  return `/reviews/${productSlug}#ratings`;
}

export function categoryMethodologyUrl(categoryKey: string): string {
  return `/tests/${toSlug(categoryKey)}`;
}
