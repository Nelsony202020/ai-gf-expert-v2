import type { AssembledEvidenceItem, AssembledPayload, AssembledScore } from './assembleEvidence';

export type BreakdownNote = 'best' | 'limitation' | 'unavailable';

export interface CategoryBreakdownRow {
  label: string;
  slug: string;
  subscoreSlug?: string;
  subscoreName?: string;
  score: number | null;
  rawResult: string | null;
  notApplicable: boolean;
  /** @deprecated use note */
  highlight?: 'best' | 'worst';
  note?: BreakdownNote;
}

export interface CategorySubscoreGroup {
  slug: string;
  name: string;
  score: number | null;
  rows: CategoryBreakdownRow[];
}

export interface CategoryPerformanceDto {
  categoryName: string;
  categorySlug: string;
  categoryScore: number | null;
  overallProductScore: number | null;
  siteAverage: number | null;
  difference: number | null;
  /** Flat list — kept for compatibility. */
  breakdown: CategoryBreakdownRow[];
  /** Subscore groups for compact collapsible breakdown UI. */
  subscoreGroups: CategorySubscoreGroup[];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function rawResultLabel(item: AssembledEvidenceItem): string | null {
  if (item.notApplicable) return 'Not applicable';
  if (item.isUnknown) return 'Unknown';
  const result = String(item.publicResult ?? '').trim();
  return result || null;
}

/** Build methodology-ordered breakdown with one global best + one main limitation. */
export function buildCategoryBreakdown(evidence: AssembledEvidenceItem[]): CategoryBreakdownRow[] {
  const rows: CategoryBreakdownRow[] = evidence.map((item) => ({
    label: item.name,
    slug: item.slug,
    subscoreSlug: item.subscoreSlug,
    subscoreName: item.subscoreName,
    score: item.notApplicable ? null : item.normalizedScore,
    rawResult: rawResultLabel(item),
    notApplicable: item.notApplicable,
  }));

  for (const row of rows) {
    if (row.notApplicable) row.note = 'unavailable';
  }

  const scored = rows.filter((r) => r.score != null && !r.notApplicable);
  if (scored.length >= 2) {
    const best = Math.max(...scored.map((r) => r.score!));
    const worst = Math.min(...scored.map((r) => r.score!));
    if (best !== worst) {
      let bestMarked = false;
      let worstMarked = false;
      for (const row of rows) {
        if (!bestMarked && row.score === best) {
          row.note = 'best';
          row.highlight = 'best';
          bestMarked = true;
        }
        if (!worstMarked && row.score === worst) {
          row.note = 'limitation';
          row.highlight = 'worst';
          worstMarked = true;
        }
      }
    }
  } else if (scored.length === 1) {
    scored[0].note = 'best';
    scored[0].highlight = 'best';
  }

  return rows;
}

export function buildSubscoreGroups(
  rows: CategoryBreakdownRow[],
  scores: AssembledScore[],
): CategorySubscoreGroup[] {
  const order: string[] = [];
  const map = new Map<string, { name: string; rows: CategoryBreakdownRow[] }>();

  for (const row of rows) {
    const slug = row.subscoreSlug || '_other';
    if (!map.has(slug)) {
      map.set(slug, { name: row.subscoreName ?? slug, rows: [] });
      order.push(slug);
    }
    map.get(slug)!.rows.push(row);
  }

  return order.map((slug) => ({
    slug,
    name: map.get(slug)!.name,
    score: scores.find((s) => s.kind === 'subscore' && s.refSlug === slug)?.score ?? null,
    rows: map.get(slug)!.rows,
  }));
}

/** Slugs to expand by default: highest- and lowest-scoring subscore groups. */
export function defaultExpandedSubscoreSlugs(groups: CategorySubscoreGroup[]): Set<string> {
  if (groups.length === 0) return new Set();
  if (groups.length === 1) return new Set([groups[0]!.slug]);

  const scored = groups.filter((g) => g.score != null);
  if (scored.length === 0) return new Set([groups[0]!.slug]);

  const sorted = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const highest = sorted[0]!.slug;
  const lowest = sorted[sorted.length - 1]!.slug;
  if (highest === lowest) return new Set([highest]);
  return new Set([highest, lowest]);
}

export function buildCategoryPerformance(
  payload: AssembledPayload,
  categoryName: string,
  overallProductScore: number | null,
): CategoryPerformanceDto | null {
  if (!payload.categorySlug) return null;

  const categoryScore =
    payload.scores.find((s) => s.kind === 'category' && s.refSlug === payload.categorySlug)?.score ??
    payload.overallScore;

  const bench = payload.benchmarks.find(
    (b) => b.kind === 'category' && b.refSlug === payload.categorySlug,
  );
  const siteAverage = bench?.siteAverage ?? null;
  const difference =
    categoryScore != null && siteAverage != null ? round1(categoryScore - siteAverage) : null;

  const breakdown = buildCategoryBreakdown(payload.evidence);
  const subscoreScores = payload.scores.filter((s) => s.kind === 'subscore');

  return {
    categoryName,
    categorySlug: payload.categorySlug,
    categoryScore: categoryScore ?? null,
    overallProductScore,
    siteAverage,
    difference,
    breakdown,
    subscoreGroups: buildSubscoreGroups(breakdown, subscoreScores),
  };
}

/** Client-side fallback when full payload is unavailable. */
export function buildCategoryPerformanceFromEvidence(opts: {
  categoryName: string;
  categorySlug: string;
  categoryScore: number | null;
  overallProductScore: number | null;
  siteAverage?: number | null;
  entries: {
    name: string;
    slug: string;
    publicResult: string | null;
    normalizedScore: number | null;
    complete: boolean;
  }[];
}): CategoryPerformanceDto {
  const evidence: AssembledEvidenceItem[] = opts.entries.map((e) => ({
    id: e.slug,
    slug: e.slug,
    name: e.name,
    categorySlug: opts.categorySlug,
    subscoreSlug: '',
    subscoreName: undefined,
    required: true,
    weight: 1,
    publicResult: e.publicResult,
    publicExplanation: null,
    normalizedScore: e.normalizedScore,
    verificationStatus: null,
    confidence: null,
    notApplicable: false,
    isUnknown: !e.complete && e.normalizedScore == null,
  }));

  const siteAverage = opts.siteAverage ?? null;
  const difference =
    opts.categoryScore != null && siteAverage != null
      ? round1(opts.categoryScore - siteAverage)
      : null;

  const breakdown = buildCategoryBreakdown(evidence);

  return {
    categoryName: opts.categoryName,
    categorySlug: opts.categorySlug,
    categoryScore: opts.categoryScore,
    overallProductScore: opts.overallProductScore,
    siteAverage,
    difference,
    breakdown,
    subscoreGroups: breakdown.length
      ? [{ slug: '_all', name: opts.categoryName, score: opts.categoryScore, rows: breakdown }]
      : [],
  };
}
