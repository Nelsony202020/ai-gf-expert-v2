import { resolveDbEvidenceSlug } from './evidenceGroupScoring';

/** Slugs reused across category/subscore — never resolve by slug alone. */
export const DUPLICATE_EVIDENCE_SLUGS = new Set([
  'speed',
  'visual-errors',
  'character-consistency',
  'custom-prompts',
  'chat-video',
  'failures',
  'maximum-resolution',
]);

/** Legacy aggregate defs replaced by member-level slugs — hidden from public, not deleted. */
export const LEGACY_AGGREGATE_EVIDENCE_SLUGS = new Set([
  'amount',
  'genders',
  'gender',
  'face',
  'hair',
  'body',
  'clothing',
  'free-trial',
  'free-plan',
]);

export function evidenceCompositeKey(
  categorySlug: string,
  subscoreSlug: string,
  slug: string,
): string {
  return `${categorySlug}/${subscoreSlug}/${slug}`;
}

export interface EvidenceIndex<T> {
  byComposite: Map<string, T>;
  bySlug: Map<string, T>;
  get(
    categorySlug: string | undefined,
    subscoreSlug: string | undefined,
    slug: string,
  ): T | undefined;
}

export function buildEvidenceIndex<
  T extends { slug: string; categorySlug?: string; subscoreSlug?: string },
>(rows: T[]): EvidenceIndex<T> {
  const byComposite = new Map<string, T>();
  const bySlug = new Map<string, T>();

  for (const row of rows) {
    if (row.categorySlug && row.subscoreSlug && row.slug) {
      byComposite.set(evidenceCompositeKey(row.categorySlug, row.subscoreSlug, row.slug), row);
      const dbSlug = resolveDbEvidenceSlug(row.slug);
      if (dbSlug !== row.slug) {
        byComposite.set(evidenceCompositeKey(row.categorySlug, row.subscoreSlug, dbSlug), row);
      }
    }
    if (row.slug) bySlug.set(row.slug, row);
  }

  function get(
    categorySlug: string | undefined,
    subscoreSlug: string | undefined,
    slug: string,
  ): T | undefined {
    const dbSlug = resolveDbEvidenceSlug(slug);
    if (categorySlug && subscoreSlug) {
      const composite =
        byComposite.get(evidenceCompositeKey(categorySlug, subscoreSlug, slug)) ??
        (dbSlug !== slug
          ? byComposite.get(evidenceCompositeKey(categorySlug, subscoreSlug, dbSlug))
          : undefined);
      if (composite) return composite;
    }
    if (DUPLICATE_EVIDENCE_SLUGS.has(slug) || DUPLICATE_EVIDENCE_SLUGS.has(dbSlug)) {
      return undefined;
    }
    return bySlug.get(slug) ?? bySlug.get(dbSlug);
  }

  return { byComposite, bySlug, get };
}
