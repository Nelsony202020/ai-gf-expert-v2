import {
  getPublicEvidenceGroupDisplay,
  listPublicEvidenceSubscoreKeys,
} from '../test-subscore-public-evidence';

/** Matches public review page category order (see draft-ratings/testGroupMapping). */
const REVIEW_COPY_CATEGORY_ORDER = [
  'characters',
  'customization',
  'chat',
  'chat-features',
  'images',
  'video',
  'privacy',
  'pricing',
] as const;

const categoryOrderIndex = new Map<string, number>(
  REVIEW_COPY_CATEGORY_ORDER.map((slug, index) => [slug, index]),
);

const subscoreOrderByCategory = new Map<string, Map<string, number>>();
const groupOrderBySubscore = new Map<string, Map<string, number>>();

for (const key of listPublicEvidenceSubscoreKeys()) {
  const [categorySlug, subscoreSlug] = key.split('/');
  if (!subscoreOrderByCategory.has(categorySlug)) {
    subscoreOrderByCategory.set(categorySlug, new Map());
  }
  const subMap = subscoreOrderByCategory.get(categorySlug)!;
  subMap.set(subscoreSlug, subMap.size);

  const groups = getPublicEvidenceGroupDisplay(categorySlug, subscoreSlug) ?? [];
  const groupMap = new Map<string, number>();
  groups.forEach((group, index) => {
    groupMap.set(group.slug, index);
  });
  groupOrderBySubscore.set(key, groupMap);
}

export function compareReviewCopyCategories(aSlug: string, bSlug: string): number {
  const a = categoryOrderIndex.get(aSlug) ?? 999;
  const b = categoryOrderIndex.get(bSlug) ?? 999;
  if (a !== b) return a - b;
  return aSlug.localeCompare(bSlug);
}

export function compareReviewCopySubscores(
  categorySlug: string,
  aSubscoreSlug: string,
  bSubscoreSlug: string,
): number {
  const catCmp = compareReviewCopyCategories(categorySlug, categorySlug);
  if (catCmp !== 0) return catCmp;
  const order = subscoreOrderByCategory.get(categorySlug);
  const a = order?.get(aSubscoreSlug) ?? 999;
  const b = order?.get(bSubscoreSlug) ?? 999;
  if (a !== b) return a - b;
  return aSubscoreSlug.localeCompare(bSubscoreSlug);
}

export function compareReviewCopyGroups(
  categorySlug: string,
  subscoreSlug: string,
  aGroupSlug: string,
  bGroupSlug: string,
): number {
  const subCmp = compareReviewCopySubscores(categorySlug, subscoreSlug, subscoreSlug);
  if (subCmp !== 0) return subCmp;
  const key = `${categorySlug}/${subscoreSlug}`;
  const order = groupOrderBySubscore.get(key);
  const a = order?.get(aGroupSlug) ?? 999;
  const b = order?.get(bGroupSlug) ?? 999;
  if (a !== b) return a - b;
  return aGroupSlug.localeCompare(bGroupSlug);
}

export function sortReviewCopySubscoreRows<T extends { categorySlug: string; subscoreSlug: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const cat = compareReviewCopyCategories(a.categorySlug, b.categorySlug);
    if (cat !== 0) return cat;
    return compareReviewCopySubscores(a.categorySlug, a.subscoreSlug, b.subscoreSlug);
  });
}

export function sortReviewCopyExplanationRows<
  T extends { categorySlug: string; subscoreSlug: string; groupSlug: string },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const cat = compareReviewCopyCategories(a.categorySlug, b.categorySlug);
    if (cat !== 0) return cat;
    const sub = compareReviewCopySubscores(a.categorySlug, a.subscoreSlug, b.subscoreSlug);
    if (sub !== 0) return sub;
    return compareReviewCopyGroups(a.categorySlug, a.subscoreSlug, a.groupSlug, b.groupSlug);
  });
}

export function sortReviewCopyCategoryEntries<T extends { slug: string; name: string }>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => compareReviewCopyCategories(a.slug, b.slug));
}

/** Preserve methodology group order when building sidebar trees. */
export function orderedGroupsForSubscore(categorySlug: string, subscoreSlug: string) {
  return getPublicEvidenceGroupDisplay(categorySlug, subscoreSlug) ?? [];
}
