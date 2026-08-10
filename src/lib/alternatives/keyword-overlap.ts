/** Ahrefs-style keyword overlap bar segments. */

export interface KeywordOverlapSegments {
  competitorUnique: number;
  common: number;
  targetUnique: number;
  competitorPct: number;
  commonPct: number;
  targetPct: number;
}

export function buildKeywordOverlapSegments(
  common: number,
  competitorKeywords: number,
  targetKeywords: number,
): KeywordOverlapSegments {
  const safeCommon = Math.max(0, common);
  const competitorUnique = Math.max(0, competitorKeywords - safeCommon);
  const targetUnique = Math.max(0, targetKeywords - safeCommon);
  const total = competitorUnique + safeCommon + targetUnique || 1;

  return {
    competitorUnique,
    common: safeCommon,
    targetUnique,
    competitorPct: (competitorUnique / total) * 100,
    commonPct: (safeCommon / total) * 100,
    targetPct: (targetUnique / total) * 100,
  };
}

export function estimateKeywordTotals(common: number, sharePct: number, targetDefault = 938): {
  competitorKeywords: number;
  targetKeywords: number;
} {
  const safeCommon = Math.max(1, common);
  const share = Math.max(0.1, sharePct);
  // Rough estimate: common / share ≈ union size; derive competitor total from overlap share.
  const competitorKeywords = Math.round(safeCommon / (share / 100) + safeCommon * 8);
  return {
    competitorKeywords: Math.max(competitorKeywords, safeCommon + 100),
    targetKeywords: targetDefault,
  };
}
