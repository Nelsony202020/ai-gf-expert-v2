import type { TakeawayListRowDto, TakeawayRowDto, TakeawayStatus } from '../../../../lib/subscore-takeaways/types';
import {
  compareReviewCopyCategories,
  compareReviewCopySubscores,
} from '../../../../lib/admin/reviewCopyOrder';

type NavRow = TakeawayListRowDto | TakeawayRowDto;

export function subscoreKeysInReviewOrder(rows: NavRow[]): string[] {
  const statusRank: Record<TakeawayStatus, number> = {
    needs_review: 0,
    outdated: 1,
    draft: 2,
    error: 3,
    not_generated: 4,
    approved: 5,
  };
  return [...rows]
    .sort((a, b) => {
      const sa = statusRank[a.takeawayStatus] ?? 9;
      const sb = statusRank[b.takeawayStatus] ?? 9;
      if (sa !== sb) return sa - sb;
      const cat = compareReviewCopyCategories(a.categorySlug, b.categorySlug);
      if (cat !== 0) return cat;
      return compareReviewCopySubscores(a.categorySlug, a.subscoreSlug, b.subscoreSlug);
    })
    .map((r) => r.subscoreKey);
}

export function nextTakeawayKey(
  rows: NavRow[],
  currentKey: string,
  filter?: TakeawayStatus | 'all',
): string | null {
  const ordered = subscoreKeysInReviewOrder(
    filter && filter !== 'all'
      ? rows.filter((r) => r.takeawayStatus === filter)
      : rows.filter((r) => r.takeawayStatus !== 'approved'),
  );
  const idx = ordered.indexOf(currentKey);
  if (idx < 0) return ordered[0] ?? null;
  return ordered[idx + 1] ?? null;
}

export function prevTakeawayKey(rows: NavRow[], currentKey: string): string | null {
  const ordered = subscoreKeysInReviewOrder(rows);
  const idx = ordered.indexOf(currentKey);
  if (idx <= 0) return null;
  return ordered[idx - 1] ?? null;
}

export function takeawayApiPath(productId: string, subscoreKey: string): string {
  return `/api/admin/products/${productId}/subscore-takeaways/${subscoreKey}`;
}
