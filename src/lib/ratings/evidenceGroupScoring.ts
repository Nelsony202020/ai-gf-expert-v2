import { getTestSubscoreMethodology } from '../../data/test-subscore-methodology';
import {
  getPublicEvidenceGroupDisplay,
  listPublicEvidenceSubscoreKeys,
  type PublicEvidenceGroupDisplay,
} from '../test-subscore-public-evidence';
import {
  buildApportionedGroupShares,
  buildExactCalculationData,
} from '../test-subscore-exact-calculation';
import { buildRedistributedCalcItems, equalWeights } from '../scores';

/** Display slugs that map to a different DB evidence-definition slug. */
export const EVIDENCE_DISPLAY_TO_DB_SLUG: Record<string, string> = {
  'other-extras': 'platform-extras-list',
};

export function resolveDbEvidenceSlug(displaySlug: string): string {
  return EVIDENCE_DISPLAY_TO_DB_SLUG[displaySlug] ?? displaySlug;
}

export function resolveDbEvidenceSlugs(displaySlugs: string[]): string[] {
  return displaySlugs.map(resolveDbEvidenceSlug);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function groupsForWeightCalc(
  groups: PublicEvidenceGroupDisplay[],
): { label: string; memberSectionIds: string[] }[] {
  return groups.map((group) => ({
    label: group.label,
    memberSectionIds: group.memberSectionIds.map(resolveDbEvidenceSlug),
  }));
}

export function getMethodologyEvidenceWeights(
  categorySlug: string,
  subscoreSlug: string,
): { label: string; weight: number }[] {
  return (
    getTestSubscoreMethodology(categorySlug, subscoreSlug)?.weightedCalculation?.evidenceWeights ??
    []
  );
}

export function buildSubscoreNominalWeights(
  categorySlug: string,
  subscoreSlug: string,
  groupNames: string[],
): number[] {
  const evidenceWeights = getMethodologyEvidenceWeights(categorySlug, subscoreSlug);
  if (evidenceWeights.length === 0) {
    return equalWeights(groupNames.length);
  }
  const weightByLabel = new Map(evidenceWeights.map((item) => [item.label, item.weight]));
  return groupNames.map((name) => weightByLabel.get(name) ?? 0);
}

export function buildSubscoreCalcItems(
  categorySlug: string,
  subscoreSlug: string,
  items: Array<{ name: string; score: number | null }>,
): ReturnType<typeof buildRedistributedCalcItems> {
  const nominalWeights = buildSubscoreNominalWeights(
    categorySlug,
    subscoreSlug,
    items.map((item) => item.name),
  );
  return buildRedistributedCalcItems(
    items.map((item, i) => ({
      name: item.name,
      score: item.score,
      nominalWeight: nominalWeights[i] ?? 0,
    })),
  );
}

/**
 * Within-group weights for drawer calculation tables — apportioned by methodology
 * test weights, normalized to sum to 100% inside the group.
 */
export function buildMemberWeightsInGroup(
  categorySlug: string,
  subscoreSlug: string,
  groupLabel: string,
  memberSlugs: string[],
): number[] {
  if (memberSlugs.length <= 1) return [100];

  const groups = getPublicEvidenceGroupDisplay(categorySlug, subscoreSlug) ?? [];
  const evidenceWeights = getMethodologyEvidenceWeights(categorySlug, subscoreSlug);
  const calcData = buildExactCalculationData(categorySlug, subscoreSlug);
  const group = groups.find((g) => g.label === groupLabel || g.slug === groupLabel);
  const groupWeight = group
    ? evidenceWeights.find((item) => item.label === group.label)?.weight
    : evidenceWeights.find((item) => item.label === groupLabel)?.weight;

  if (group && groupWeight && groupWeight > 0 && calcData?.rows.length) {
    const shares = buildApportionedGroupShares(
      groupsForWeightCalc(groups),
      calcData.rows,
      evidenceWeights,
    );
    return memberSlugs.map((slug) => {
      const dbSlug = resolveDbEvidenceSlug(slug);
      const share = shares.get(dbSlug)?.sharePercent ?? shares.get(slug)?.sharePercent ?? 0;
      return round2((share / groupWeight) * 100);
    });
  }

  return equalWeights(memberSlugs.length);
}

export function buildSubscoreCalcDrawer(
  categorySlug: string,
  subscoreSlug: string,
  evidenceCategories: Array<{ name: string; score: number | null }>,
  opts?: { deferScores?: boolean },
): {
  rows: ReturnType<typeof buildRedistributedCalcItems>['rows'];
  excludedNames: string[];
  computedScore: number | null;
} {
  const { rows, excludedNames } = buildSubscoreCalcItems(
    categorySlug,
    subscoreSlug,
    evidenceCategories.map((ec) => ({
      name: ec.name,
      score: opts?.deferScores ? null : ec.score,
    })),
  );
  const total = rows.reduce((sum, row) => sum + (row.contribution ?? 0), 0);
  const computedScore = total > 0 ? Math.round(total * 10) / 10 : null;
  return { rows, excludedNames, computedScore };
}

export function listMethodologyAlignedSubscoreKeys(): string[] {
  return listPublicEvidenceSubscoreKeys();
}
