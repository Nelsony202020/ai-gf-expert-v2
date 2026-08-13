/** Evidence slugs removed from testing — never block progress or scoring. */
export const RETIRED_EVIDENCE_SLUGS = new Set([
  'restrictions',
  /** Folded into `duplicates` (0–25 count). */
  'originality',
  /** Overlaps included-features; removed from billing session. */
  'paywalls',
]);

export function isRetiredEvidenceSlug(slug: string): boolean {
  return RETIRED_EVIDENCE_SLUGS.has(slug);
}
