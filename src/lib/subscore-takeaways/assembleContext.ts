import { inputHash } from '../ai-verdict/hash';
import { loadExplanationProductBundle } from '../ai-explanations/assembleContext';
import { HttpError } from '../db/auth';
import { deferPayAsYouGoScores } from '../ratings/evidenceIcons';
import { evidenceGroupsForSubscore } from '../ratings/evidenceCategoryMapping';
import { fmtScore } from '../scores';
import { findSubscore, parseSubscoreKey } from './subscores';
import type { AssembledSubscoreTakeawayContext, BreakdownItem } from './types';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function averageMemberScore(
  memberSlugs: string[],
  categorySlug: string,
  subscoreSlug: string,
  index: import('../ratings/evidenceIndex').EvidenceIndex<unknown>,
): number | null {
  const scores: number[] = [];
  for (const slug of memberSlugs) {
    const row = index.get(categorySlug, subscoreSlug, slug) as any;
    if (row?.normalizedScore != null && !row.notApplicable && !row.isUnknown) {
      scores.push(Number(row.normalizedScore));
    }
  }
  if (scores.length === 0) return null;
  return round1(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function buildBreakdown(
  categorySlug: string,
  subscoreSlug: string,
  productSlug: string,
  index: import('../ratings/evidenceIndex').EvidenceIndex<unknown>,
): BreakdownItem[] {
  const groupDefs = evidenceGroupsForSubscore(categorySlug, subscoreSlug) ?? [];
  if (deferPayAsYouGoScores(productSlug, subscoreSlug)) {
    return groupDefs.map((g) => ({ name: g.name, score: null }));
  }

  return groupDefs.map((group) => ({
    name: group.name,
    score: averageMemberScore(group.memberSlugs, categorySlug, subscoreSlug, index),
  }));
}

function computeFinalScore(
  categorySlug: string,
  subscoreSlug: string,
  breakdown: BreakdownItem[],
): number | null {
  const scored = breakdown.filter((b) => b.score != null);
  if (scored.length === 0) return null;
  const { rows } = buildSubscoreCalcItems(
    categorySlug,
    subscoreSlug,
    breakdown.map((b) => ({ name: b.name, score: b.score })),
  );
  const total = rows.reduce((sum, r) => sum + (r.contribution ?? 0), 0);
  return total > 0 ? round1(total) : null;
}

function formatBreakdownText(breakdown: BreakdownItem[]): string {
  return breakdown
    .map((b) => `${b.name}: ${b.score != null ? b.score.toFixed(1) : '—'}`)
    .join('\n');
}

function buildScoreFingerprint(
  subscoreKey: string,
  finalScore: number | null,
  breakdown: BreakdownItem[],
  methodologyVersion: string | null,
): unknown {
  return {
    subscoreKey,
    methodologyVersion,
    finalScore,
    breakdown: breakdown.map((b) => ({ name: b.name, score: b.score })),
  };
}

export function assembleSubscoreTakeawayFromBundle(
  bundle: Awaited<ReturnType<typeof loadExplanationProductBundle>>,
  subscoreKey: string,
  opts?: { reviewerNote?: string },
): AssembledSubscoreTakeawayContext {
  const subscore = findSubscore(subscoreKey);
  if (!subscore) throw new HttpError(404, `Unknown subscore: ${subscoreKey}`);

  const breakdown = buildBreakdown(
    subscore.categorySlug,
    subscore.subscoreSlug,
    bundle.product.slug,
    bundle.resultIndex,
  );
  const finalScore = computeFinalScore(subscore.categorySlug, subscore.subscoreSlug, breakdown);
  const hasUsableScores = breakdown.some((b) => b.score != null);

  return {
    product: bundle.product,
    subscore,
    finalScore,
    breakdown,
    scoreBreakdownText: formatBreakdownText(breakdown),
    inputHash: inputHash(
      buildScoreFingerprint(subscoreKey, finalScore, breakdown, bundle.methodologyVersion),
    ),
    hasUsableScores,
    ...(opts?.reviewerNote ? { reviewerNote: opts.reviewerNote } : {}),
  } as AssembledSubscoreTakeawayContext & { reviewerNote?: string };
}

export async function assembleSubscoreTakeawayContext(
  productId: string,
  subscoreKey: string,
  opts?: { testRunId?: string; reviewerNote?: string },
): Promise<AssembledSubscoreTakeawayContext> {
  const bundle = await loadExplanationProductBundle(productId, opts);
  return assembleSubscoreTakeawayFromBundle(bundle, subscoreKey, opts);
}

export { parseSubscoreKey, fmtScore };
