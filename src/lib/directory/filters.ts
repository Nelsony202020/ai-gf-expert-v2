/**
 * Simplified directory filters — price buckets, minimum rating, best-at category scores.
 */

export const DIRECTORY_STRONG_SCORE_THRESHOLD = 8.5;

export function isStrongCategoryScore(score: number): boolean {
  return Number.isFinite(score) && score >= DIRECTORY_STRONG_SCORE_THRESHOLD;
}

export interface DirectoryPriceBucket {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const DIRECTORY_PRICE_BUCKETS: DirectoryPriceBucket[] = [
  { id: 'budget-free', label: 'Free', min: 0, max: 0 },
  { id: 'budget-under-15', label: 'Under $15', min: 0, max: 14.99 },
  { id: 'budget-15-25', label: '$15–25', min: 15, max: 25 },
  { id: 'budget-over-25', label: '$25+', min: 25, max: Infinity },
];

export const DIRECTORY_PRICE_BUCKET_BY_ID: Record<string, DirectoryPriceBucket> = Object.fromEntries(
  DIRECTORY_PRICE_BUCKETS.map((b) => [b.id, b]),
);

export interface DirectoryRatingOption {
  id: string;
  label: string;
  min: number;
}

export const DIRECTORY_RATING_OPTIONS: DirectoryRatingOption[] = [
  { id: 'rating-any', label: 'Any', min: 0 },
  { id: 'rating-8', label: '8.0+', min: 8 },
  { id: 'rating-85', label: '8.5+', min: 8.5 },
  { id: 'rating-9', label: '9.0+', min: 9 },
];

export const DIRECTORY_RATING_BY_ID: Record<string, DirectoryRatingOption> = Object.fromEntries(
  DIRECTORY_RATING_OPTIONS.map((o) => [o.id, o]),
);

/** Best-at filters use category score keys from data-category-scores. */
export interface DirectoryBestAtOption {
  id: string;
  label: string;
  scoreKey: string;
}

export const DIRECTORY_BEST_AT_OPTIONS: DirectoryBestAtOption[] = [
  { id: 'chat', label: 'Chat', scoreKey: 'chat' },
  { id: 'customization', label: 'Customization', scoreKey: 'customization' },
  { id: 'images', label: 'Images', scoreKey: 'images' },
  { id: 'video', label: 'Video', scoreKey: 'video' },
  { id: 'privacy', label: 'Privacy', scoreKey: 'privacy' },
  { id: 'pricing', label: 'Value', scoreKey: 'pricing' },
];

export const DIRECTORY_BEST_AT_BY_ID: Record<string, DirectoryBestAtOption> = Object.fromEntries(
  DIRECTORY_BEST_AT_OPTIONS.map((o) => [o.id, o]),
);

export const DIRECTORY_BEST_AT_LABELS: Record<string, string> = Object.fromEntries(
  DIRECTORY_BEST_AT_OPTIONS.map((o) => [o.id, o.label]),
);

export function priceMatchesBucket(price: number, bucketId: string | null, maxPriceFallback: number): boolean {
  if (!bucketId) return true;
  const bucket = DIRECTORY_PRICE_BUCKET_BY_ID[bucketId];
  if (!bucket) return true;
  const max = bucket.max === Infinity ? maxPriceFallback : bucket.max;
  return price >= bucket.min && price <= max;
}

export function ratingMatchesMin(overallScore: number, minRatingId: string): boolean {
  const min = DIRECTORY_RATING_BY_ID[minRatingId]?.min ?? 0;
  return overallScore >= min;
}

export function bestAtMatches(
  categoryScores: Record<string, number>,
  bestAtId: string | null,
): boolean {
  if (!bestAtId) return true;
  const option = DIRECTORY_BEST_AT_BY_ID[bestAtId];
  if (!option) return true;
  const score = categoryScores[option.scoreKey] ?? 0;
  return isStrongCategoryScore(score);
}
