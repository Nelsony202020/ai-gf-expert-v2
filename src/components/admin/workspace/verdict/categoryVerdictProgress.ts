import type { CategoryVerdict } from './types';

export type CategoryVerdictStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'needs_review'
  | 'missing_test_data';

export const CATEGORY_REQUIRED_FIELDS = [
  { key: 'headline' as const, label: 'Verdict headline' },
  { key: 'verdict' as const, label: 'Verdict paragraph' },
  { key: 'mainStrength' as const, label: 'Primary strength' },
  { key: 'mainWeakness' as const, label: 'Primary limitation' },
  { key: 'pros' as const, label: 'At least one pro' },
  { key: 'cons' as const, label: 'At least one con' },
];

function fieldComplete(v: CategoryVerdict | undefined, key: (typeof CATEGORY_REQUIRED_FIELDS)[number]['key']): boolean {
  if (!v) return false;
  switch (key) {
    case 'headline':
      return Boolean(v.headline?.trim());
    case 'verdict':
      return Boolean(v.verdict?.trim());
    case 'mainStrength':
      return Boolean(v.mainStrength?.trim());
    case 'mainWeakness':
      return Boolean(v.mainWeakness?.trim());
    case 'pros':
      return Boolean(v.pros?.some((p) => p.trim()));
    case 'cons':
      return Boolean(v.cons?.some((c) => c.trim()));
  }
}

export interface CategoryVerdictProgress {
  status: CategoryVerdictStatus;
  completedRequired: number;
  totalRequired: number;
  missingLabels: string[];
  statusLabel: string;
}

export function computeCategoryVerdictProgress(
  v: CategoryVerdict | undefined,
  opts?: { hasScore?: boolean; remainingRequiredTests?: number | null },
): CategoryVerdictProgress {
  const completedRequired = CATEGORY_REQUIRED_FIELDS.filter((f) => fieldComplete(v, f.key)).length;
  const missingLabels = CATEGORY_REQUIRED_FIELDS.filter((f) => !fieldComplete(v, f.key)).map((f) => f.label);
  const totalRequired = CATEGORY_REQUIRED_FIELDS.length;

  let status: CategoryVerdictStatus;
  if (opts?.hasScore === false) {
    status = 'missing_test_data';
  } else if (completedRequired === 0) {
    status = 'not_started';
  } else if (completedRequired >= totalRequired) {
    status = 'complete';
  } else if (opts?.remainingRequiredTests != null && opts.remainingRequiredTests > 0 && completedRequired >= 4) {
    status = 'needs_review';
  } else {
    status = 'in_progress';
  }

  const statusLabel = (() => {
    switch (status) {
      case 'not_started':
        return 'Not started';
      case 'complete':
        return 'Complete';
      case 'needs_review':
        return 'Needs review';
      case 'missing_test_data':
        return 'Missing test data';
      case 'in_progress':
        if (missingLabels.length === 1) return `Missing: ${missingLabels[0]}`;
        return `${totalRequired - completedRequired} field${totalRequired - completedRequired === 1 ? '' : 's'} missing`;
    }
  })();

  return {
    status,
    completedRequired,
    totalRequired,
    missingLabels,
    statusLabel,
  };
}

export function isCategoryVerdictComplete(v: CategoryVerdict | undefined): boolean {
  return computeCategoryVerdictProgress(v).status === 'complete';
}

/** Short label for drawer header (e.g. "In progress", "Complete"). */
export function categoryHeaderStatusLabel(status: CategoryVerdictStatus): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'in_progress':
      return 'In progress';
    case 'complete':
      return 'Complete';
    case 'needs_review':
      return 'Needs review';
    case 'missing_test_data':
      return 'Missing test data';
  }
}

/** User-facing labels for the live missing-fields summary. */
export const CATEGORY_MISSING_SUMMARY_LABELS: Record<
  (typeof CATEGORY_REQUIRED_FIELDS)[number]['key'],
  string
> = {
  headline: 'Category verdict headline',
  verdict: 'Verdict',
  mainStrength: 'Primary strength',
  mainWeakness: 'Primary limitation',
  pros: 'At least one pro',
  cons: 'At least one con',
};

export function sanitizeCategoryVerdictDraft(v: CategoryVerdict): CategoryVerdict {
  return {
    ...v,
    headline: v.headline?.trim() || undefined,
    verdict: v.verdict?.trim() || undefined,
    mainStrength: v.mainStrength?.trim() || undefined,
    mainWeakness: v.mainWeakness?.trim() || undefined,
    pros: v.pros?.map((p) => p.trim()).filter(Boolean),
    cons: v.cons?.map((c) => c.trim()).filter(Boolean),
  };
}

export function countCompleteCategories(
  slugs: string[],
  categoryVerdicts: Record<string, CategoryVerdict>,
): number {
  return slugs.filter((slug) => isCategoryVerdictComplete(categoryVerdicts[slug])).length;
}

export function nextIncompleteCategorySlug(
  slugs: string[],
  categoryVerdicts: Record<string, CategoryVerdict>,
): string | null {
  return slugs.find((slug) => !isCategoryVerdictComplete(categoryVerdicts[slug])) ?? null;
}
