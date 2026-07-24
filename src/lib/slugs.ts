/** Lowercase slug for URLs, e.g. "Chat Features" → "chat-features". */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Main testing methodology hub */
export function testHubUrl(): string {
  return '/test/';
}

export function testTooltipsUrl(): string {
  return '/test/tooltips/';
}

export function testCategoryUrl(categoryKey: string): string {
  return `/test/${toSlug(categoryKey)}/`;
}

export function testSubscoreUrl(category: string, subscore: string): string {
  return `/test/${toSlug(category)}/${toSlug(subscore)}/`;
}

/** Evidence points anchor on the subscore methodology page */
export function testContributorUrl(category: string, subscore: string, contributor: string): string {
  return `${testSubscoreUrl(category, subscore)}#${toSlug(contributor)}`;
}

export function reviewRatingsUrl(productSlug: string): string {
  return `/reviews/${productSlug}#ratings`;
}

export function categoryMethodologyUrl(categoryKey: string): string {
  return testCategoryUrl(categoryKey);
}
