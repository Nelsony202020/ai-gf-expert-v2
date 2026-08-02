import type { ExplanationListRowDto } from '../../../../lib/ai-explanations/types';
import {
  compareReviewCopyCategories,
  compareReviewCopyGroups,
  compareReviewCopySubscores,
  sortReviewCopyCategoryEntries,
} from '../../../../lib/admin/reviewCopyOrder';

export interface ExplanationListCategory {
  slug: string;
  name: string;
  approved: number;
  total: number;
  subscores: ExplanationListSubscore[];
}

export interface ExplanationListSubscore {
  slug: string;
  name: string;
  rows: ExplanationListRowDto[];
}

export function buildExplanationListTree(
  rows: ExplanationListRowDto[],
  filters: { categorySlug?: string; status?: string },
): ExplanationListCategory[] {
  const filtered = rows.filter((r) => {
    if (filters.categorySlug && filters.categorySlug !== 'all' && r.categorySlug !== filters.categorySlug) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && r.explanationStatus !== filters.status) {
      return false;
    }
    return true;
  });

  const catMap = new Map<string, ExplanationListCategory>();

  for (const row of filtered) {
    let cat = catMap.get(row.categorySlug);
    if (!cat) {
      cat = {
        slug: row.categorySlug,
        name: row.categoryName,
        approved: 0,
        total: 0,
        subscores: [],
      };
      catMap.set(row.categorySlug, cat);
    }
    cat.total += 1;
    if (row.explanationStatus === 'approved') cat.approved += 1;

    let sub = cat.subscores.find((s) => s.slug === row.subscoreSlug);
    if (!sub) {
      sub = { slug: row.subscoreSlug, name: row.subscoreName, rows: [] };
      cat.subscores.push(sub);
    }
    sub.rows.push(row);
  }

  return sortReviewCopyCategoryEntries([...catMap.values()]).map((cat) => ({
    ...cat,
    subscores: [...cat.subscores]
      .sort((a, b) => compareReviewCopySubscores(cat.slug, a.slug, b.slug))
      .map((sub) => ({
        ...sub,
        rows: [...sub.rows].sort((a, b) =>
          compareReviewCopyGroups(cat.slug, sub.slug, a.groupSlug, b.groupSlug),
        ),
      })),
  }));
}
