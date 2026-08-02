import type { ExplanationListRowDto, ExplanationRowDto, ExplanationStatus } from '../../../../lib/ai-explanations/types';
import {
  compareReviewCopyCategories,
  compareReviewCopyGroups,
  compareReviewCopySubscores,
} from '../../../../lib/admin/reviewCopyOrder';

type NavRow = ExplanationListRowDto | ExplanationRowDto;

export function groupKeysInReviewOrder(rows: NavRow[]): string[] {
  const statusRank: Record<ExplanationStatus, number> = {
    needs_review: 0,
    outdated: 1,
    draft: 2,
    error: 3,
    not_generated: 4,
    approved: 5,
  };
  return [...rows]
    .sort((a, b) => {
      const sa = statusRank[a.explanationStatus] ?? 9;
      const sb = statusRank[b.explanationStatus] ?? 9;
      if (sa !== sb) return sa - sb;
      const cat = compareReviewCopyCategories(a.categorySlug, b.categorySlug);
      if (cat !== 0) return cat;
      const sub = compareReviewCopySubscores(a.categorySlug, a.subscoreSlug, b.subscoreSlug);
      if (sub !== 0) return sub;
      return compareReviewCopyGroups(
        a.categorySlug,
        a.subscoreSlug,
        a.groupSlug,
        b.groupSlug,
      );
    })
    .map((r) => r.groupKey);
}

export function nextReviewKey(
  rows: NavRow[],
  currentKey: string,
  filter?: ExplanationStatus | 'all',
): string | null {
  const ordered = groupKeysInReviewOrder(
    filter && filter !== 'all'
      ? rows.filter((r) => r.explanationStatus === filter)
      : rows.filter((r) => r.explanationStatus !== 'approved'),
  );
  const idx = ordered.indexOf(currentKey);
  if (idx < 0) return ordered[0] ?? null;
  return ordered[idx + 1] ?? null;
}

export function prevReviewKey(rows: NavRow[], currentKey: string): string | null {
  const ordered = groupKeysInReviewOrder(rows);
  const idx = ordered.indexOf(currentKey);
  if (idx <= 0) return null;
  return ordered[idx - 1] ?? null;
}

export function explanationApiPath(productId: string, groupKey: string): string {
  return `/api/admin/products/${productId}/evidence-explanations/${groupKey}`;
}
