/** Evidence slugs removed from testing — never block progress or scoring. */
export const RETIRED_EVIDENCE_SLUGS = new Set(['restrictions']);

export function isRetiredEvidenceSlug(slug: string): boolean {
  return RETIRED_EVIDENCE_SLUGS.has(slug);
}
