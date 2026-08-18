function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface ReviewRatingsDeepLink {
  tab: 'ratings';
  categoryKey?: string;
  subscoreSlug?: string;
}

/** Hash fragment for a review ratings deep link (no leading #). */
export function buildReviewRatingsHash(categoryKey?: string, subscoreName?: string): string {
  const category = categoryKey?.trim();
  if (!category) return 'ratings';
  const base = `ratings--${category}`;
  const sub = subscoreName?.trim();
  if (!sub) return base;
  return `${base}--${slugify(sub)}`;
}

export function parseReviewRatingsHash(hash: string): ReviewRatingsDeepLink | null {
  const cleaned = hash.replace(/^#/, '').trim();
  if (!cleaned) return null;
  if (cleaned === 'ratings') return { tab: 'ratings' };
  if (!cleaned.startsWith('ratings--')) return null;

  const rest = cleaned.slice('ratings--'.length);
  if (!rest) return { tab: 'ratings' };

  const sep = rest.indexOf('--');
  if (sep === -1) return { tab: 'ratings', categoryKey: rest };

  return {
    tab: 'ratings',
    categoryKey: rest.slice(0, sep),
    subscoreSlug: rest.slice(sep + 2) || undefined,
  };
}

export function reviewRatingsSectionUrl(
  productSlug: string,
  categoryKey?: string,
  subscoreName?: string,
): string {
  return `/reviews/${productSlug}/#${buildReviewRatingsHash(categoryKey, subscoreName)}`;
}

/** Match a subscore nav item by slugified label. */
export function subscoreSlugFromLabel(label: string): string {
  return slugify(label);
}
