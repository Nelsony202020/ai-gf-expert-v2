import type { DataRow } from '../../data/products';
import {
  evidenceGroupsForSubscore,
  iconForContributor,
} from './evidenceCategoryMapping';
import { DUPLICATE_EVIDENCE_SLUGS } from './evidenceIndex';
import { resolveDbEvidenceSlug } from './evidenceGroupScoring';
import { deferPayAsYouGoScores, iconForEvidenceDef } from './evidenceIcons';

type StoredEvidenceResult = {
  publicResult?: string | null;
  normalizedScore?: number | null;
  notApplicable?: boolean;
  evidenceDefinition?: { slug?: string; name?: string };
};

function isStoredNotApplicable(result: StoredEvidenceResult | undefined): boolean {
  if (!result) return false;
  if (result.notApplicable) return true;
  return result.publicResult?.trim().toLowerCase() === 'not applicable';
}

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

const GENDER_COUNT_LABELS: Record<string, string> = {
  'female-count': 'female',
  'male-count': 'male',
  'anime-female-count': 'anime female',
  'anime-male-count': 'anime male',
  'transgender-count': 'transgender',
  'non-binary-count': 'non-binary',
  'other-count': 'other',
};

function storedResult(
  slug: string,
  categorySlug: string,
  subscoreSlug: string,
  resultBySlug: Map<string, StoredEvidenceResult>,
): StoredEvidenceResult | undefined {
  const dbSlug = resolveDbEvidenceSlug(slug);
  return (
    resultBySlug.get(`${categorySlug}/${subscoreSlug}/${slug}`) ??
    resultBySlug.get(`${categorySlug}/${subscoreSlug}/${dbSlug}`) ??
    (!DUPLICATE_EVIDENCE_SLUGS.has(slug) && !DUPLICATE_EVIDENCE_SLUGS.has(dbSlug)
      ? resultBySlug.get(slug) ?? resultBySlug.get(dbSlug)
      : undefined)
  );
}

function formatGroupValue(
  groupSlug: string,
  memberSlugs: string[],
  categorySlug: string,
  subscoreSlug: string,
  resultBySlug: Map<string, StoredEvidenceResult>,
  fileRow?: DataRow,
): string {
  if (fileRow?.value?.trim() && fileRow.value !== '—') {
    return fileRow.value.trim();
  }

  if (groupSlug === 'genders') {
    const parts = memberSlugs
      .map((slug) => {
        const result = storedResult(slug, categorySlug, subscoreSlug, resultBySlug);
        const val = parseCount(result?.publicResult);
        if (val == null) return null;
        const label = GENDER_COUNT_LABELS[slug] ?? slug;
        return `${val} ${label}`;
      })
      .filter((part): part is string => part != null);
    if (parts.length > 0) return parts.join(' · ');
  }

  if (memberSlugs.length === 1) {
    const result = storedResult(memberSlugs[0], categorySlug, subscoreSlug, resultBySlug);
    return result?.publicResult?.trim() || '—';
  }

  const memberResults = memberSlugs
    .map((slug) => storedResult(slug, categorySlug, subscoreSlug, resultBySlug))
    .filter((result): result is StoredEvidenceResult => Boolean(result?.publicResult?.trim()));

  if (memberResults.length === 0) return '—';

  if (groupSlug === 'amount') {
    const nums = memberSlugs
      .map((slug) =>
        parseCount(storedResult(slug, categorySlug, subscoreSlug, resultBySlug)?.publicResult),
      )
      .filter((num): num is number => num != null);
    if (nums.length > 0) {
      return nums.reduce((sum, num) => sum + num, 0).toLocaleString();
    }
  }

  return memberResults[0].publicResult!.trim();
}

function groupHasData(memberSlugs: string[], contributorSlugs: string[]): boolean {
  return memberSlugs.some(
    (slug) =>
      contributorSlugs.includes(slug) ||
      contributorSlugs.includes(resolveDbEvidenceSlug(slug)),
  );
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
          internalScore:
            hideScores || isStoredNotApplicable(result)
              ? undefined
              : result.normalizedScore ?? fileMatch?.internalScore,
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
        .map((slug) => {
          const result = storedResult(slug, categorySlug, subscoreSlug, resultBySlug);
          if (isStoredNotApplicable(result)) return null;
          return result?.normalizedScore ?? null;
        })
        .filter((score): score is number => score != null);

      const allNotApplicable = group.memberSlugs.every((slug) =>
        isStoredNotApplicable(storedResult(slug, categorySlug, subscoreSlug, resultBySlug)),
      );

      return {
        label: group.name,
        value: formatGroupValue(
          group.slug,
          group.memberSlugs,
          categorySlug,
          subscoreSlug,
          resultBySlug,
          fileRow,
        ),
        icon: fileRow?.icon ?? iconForContributor(group.slug, group.name),
        internalScore: hideScores || allNotApplicable
          ? undefined
          : averageScore(memberScores) ?? fileRow?.internalScore,
      } satisfies DataRow;
    })
    .filter((row): row is DataRow => row != null);
}
