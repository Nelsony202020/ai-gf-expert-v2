import type { DataRow } from '../../data/products';
import {
  evidenceGroupsForSubscore,
  iconForContributor,
} from './evidenceCategoryMapping';
import { deferPayAsYouGoScores, iconForEvidenceDef } from './evidenceIcons';

type StoredEvidenceResult = {
  publicResult?: string | null;
  normalizedScore?: number | null;
  evidenceDefinition?: { slug?: string; name?: string };
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function averageScore(scores: number[]): number | undefined {
  if (scores.length === 0) return undefined;
  return round1(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function parseCount(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const num = Number.parseInt(value.replace(/,/g, ''), 10);
  return Number.isNaN(num) ? null : num;
}

function formatGroupValue(
  groupSlug: string,
  memberSlugs: string[],
  resultBySlug: Map<string, StoredEvidenceResult>,
  fileRow?: DataRow,
): string {
  if (fileRow?.value?.trim() && fileRow.value !== '—') {
    return fileRow.value.trim();
  }

  if (memberSlugs.length === 1) {
    const result = resultBySlug.get(memberSlugs[0]);
    return result?.publicResult?.trim() || '—';
  }

  const memberResults = memberSlugs
    .map((slug) => resultBySlug.get(slug))
    .filter((result): result is StoredEvidenceResult => Boolean(result?.publicResult?.trim()));

  if (memberResults.length === 0) return '—';

  if (groupSlug === 'amount') {
    const nonAnimeSlugs = new Set([
      'female-count',
      'male-count',
      'transgender-count',
      'non-binary-count',
      'other-count',
    ]);
    const countSlugs = memberSlugs.filter((slug) => nonAnimeSlugs.has(slug) || !slug.includes('anime'));
    const nums = countSlugs
      .map((slug) => parseCount(resultBySlug.get(slug)?.publicResult))
      .filter((num): num is number => num != null);
    if (nums.length > 0) {
      return nums.reduce((sum, num) => sum + num, 0).toLocaleString();
    }
  }

  return memberResults[0].publicResult!.trim();
}

function groupHasData(memberSlugs: string[], contributorSlugs: string[]): boolean {
  return memberSlugs.some((slug) => contributorSlugs.includes(slug));
}

/**
 * Collapse raw measurement slugs into public evidence categories
 * (Amount, Styles, Genders, etc.) for Ratings & Specs tables.
 */
export function buildGroupedContributors(
  categorySlug: string,
  subscoreSlug: string,
  contributorSlugs: string[],
  resultBySlug: Map<string, StoredEvidenceResult>,
  fileContributors: DataRow[] = [],
  productSlug?: string,
): DataRow[] {
  const groups = evidenceGroupsForSubscore(categorySlug, subscoreSlug);
  const fileByLabel = new Map(fileContributors.map((row) => [row.label.toLowerCase(), row]));

  const hideScores = productSlug ? deferPayAsYouGoScores(productSlug, subscoreSlug) : false;

  if (!groups?.length) {
    return contributorSlugs.flatMap((slug) => {
      const result = resultBySlug.get(slug);
      if (!result) return [];
      const label = result.evidenceDefinition?.name ?? slug;
      const fileMatch = fileContributors.find(
        (row) => row.label.toLowerCase() === label.toLowerCase(),
      );
      return [
        {
          label,
          value: result.publicResult ?? '—',
          internalScore: hideScores ? undefined : result.normalizedScore ?? fileMatch?.internalScore,
          icon: fileMatch?.icon ?? iconForEvidenceDef(slug, label),
        },
      ];
    });
  }

  return groups
    .map((group) => {
      if (!groupHasData(group.memberSlugs, contributorSlugs)) return null;

      const fileRow = fileByLabel.get(group.name.toLowerCase());
      const memberScores = group.memberSlugs
        .map((slug) => resultBySlug.get(slug)?.normalizedScore)
        .filter((score): score is number => score != null);

      return {
        label: group.name,
        value: formatGroupValue(group.slug, group.memberSlugs, resultBySlug, fileRow),
        icon: fileRow?.icon ?? iconForContributor(group.slug, group.name),
        internalScore: hideScores
          ? undefined
          : averageScore(memberScores) ?? fileRow?.internalScore,
      } satisfies DataRow;
    })
    .filter((row): row is DataRow => row != null);
}
