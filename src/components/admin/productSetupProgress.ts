/** Recommended editorial content fields (product setup). */
export const EDITORIAL_RECOMMENDED = [
  'oneLineVerdict',
  'ourTake',
  'directoryDescription',
  'mainStrength',
  'mainLimitation',
  'pros',
  'cons',
] as const;

const IDENTITY_SETUP_REQUIRED = ['name', 'slug', 'logo'] as const;
const SETUP_RECOMMENDED = [
  'tagline',
  'websiteUrl',
  'youtubeReviewUrl',
  'featuredImage',
  'minMonthlyPrice',
  ...EDITORIAL_RECOMMENDED,
  'seoTitle',
  'seoDescription',
  'ogTitle',
  'ogDescription',
] as const;

function fieldFilled(
  fields: Record<string, unknown>,
  links: Record<string, string | null>,
  key: string,
): boolean {
  if (key === 'logo' || key === 'featuredImage') return Boolean(links[key]);
  if (key === 'author') return Boolean(links.author);
  if (key === 'pros' || key === 'cons') {
    const v = fields[key];
    return Array.isArray(v) && v.length > 0;
  }
  const v = fields[key];
  return v !== undefined && v !== null && v !== '';
}

export function computeProductSetupProgress(
  fields: Record<string, unknown>,
  links: Record<string, string | null>,
): {
  pct: number;
  missingRequired: number;
  missingRecommended: number;
  statusMissingCount: number;
  statusMissingKind: 'required' | 'recommended';
  filled: number;
  total: number;
} {
  const requiredKeys = [...IDENTITY_SETUP_REQUIRED, 'author'] as const;
  const allKeys = [...requiredKeys, ...SETUP_RECOMMENDED];

  let filled = 0;
  for (const key of allKeys) {
    if (fieldFilled(fields, links, key)) filled++;
  }

  const missingRequired = requiredKeys.filter((k) => !fieldFilled(fields, links, k)).length;
  const missingRecommended = SETUP_RECOMMENDED.filter((k) => !fieldFilled(fields, links, k)).length;
  const total = allKeys.length;
  const pct = Math.round((filled / total) * 100);

  const statusMissingCount = missingRequired > 0 ? missingRequired : missingRecommended;
  const statusMissingKind = missingRequired > 0 ? 'required' : 'recommended';

  return { pct, missingRequired, missingRecommended, statusMissingCount, statusMissingKind, filled, total };
}

/** SEO-tab-specific recommended gaps (for local hints if needed). */
export const SEO_RECOMMENDED = ['seoTitle', 'seoDescription'] as const;

export function computeSeoRecommendedMissing(fields: Record<string, unknown>): number {
  return SEO_RECOMMENDED.filter((k) => !fieldFilled(fields, {}, k)).length;
}
