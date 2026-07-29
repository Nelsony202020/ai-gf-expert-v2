// Single source of truth for turning a numeric score (0-10) into a band,
// label, range, and the Tailwind classes used everywhere it is rendered.

export type ScoreBand = 'good' | 'fair' | 'poor';

export interface ScoreVisual {
  band: ScoreBand | 'pending';
  label: string;
  range: string;
  /** solid background chip, e.g. the sidebar pills / big badge */
  bg: string;
  /** matching text color for outlined / ghost treatments */
  text: string;
  /** matching border color for outlined treatments */
  border: string;
  /** soft callout background */
  softBg: string;
  softBorder: string;
  softText: string;
  dot: string;
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 7.0) return 'good';
  if (score >= 5.5) return 'fair';
  return 'poor';
}

export function isScoreCalculated(score: number | null | undefined): score is number {
  return score != null && !Number.isNaN(score);
}

const PENDING_VISUAL: ScoreVisual = {
  band: 'pending',
  label: 'Pending',
  range: '—',
  bg: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  text: 'text-slate-500',
  border: 'border-slate-300',
  softBg: 'bg-slate-50',
  softBorder: 'border-slate-200',
  softText: 'text-slate-600',
  dot: 'bg-slate-400',
};

const VISUALS: Record<ScoreBand, ScoreVisual> = {
  good: {
    band: 'good',
    label: 'Good',
    range: '7.0 – 10.0',
    bg: 'bg-green-600 text-white',
    text: 'text-green-600',
    border: 'border-green-600',
    softBg: 'bg-green-50',
    softBorder: 'border-green-200',
    softText: 'text-green-800',
    dot: 'bg-green-500',
  },
  fair: {
    band: 'fair',
    label: 'Fair',
    range: '5.5 – 6.9',
    bg: 'bg-orange-500 text-white',
    text: 'text-orange-500',
    border: 'border-orange-500',
    softBg: 'bg-orange-50',
    softBorder: 'border-orange-200',
    softText: 'text-orange-900',
    dot: 'bg-orange-500',
  },
  poor: {
    band: 'poor',
    label: 'Poor',
    range: '0 – 5.4',
    bg: 'bg-red-600 text-white',
    text: 'text-red-600',
    border: 'border-red-600',
    softBg: 'bg-red-50',
    softBorder: 'border-red-200',
    softText: 'text-red-800',
    dot: 'bg-red-500',
  },
};

export function getScoreVisual(score: number | null | undefined): ScoreVisual {
  if (!isScoreCalculated(score)) return PENDING_VISUAL;
  return VISUALS[getScoreBand(score)];
}

/** CSS class for tooltip score chips (number-only colored box). */
export function getScoreChipClass(score: number | null | undefined): string {
  if (!isScoreCalculated(score)) return 'rt-score-chip--pending';
  const band = getScoreBand(score);
  if (band === 'good') return 'rt-score-chip--good';
  if (band === 'fair') return 'rt-score-chip--fair';
  return 'rt-score-chip--poor';
}

/** Format a score to one decimal place, or "-" when not calculated yet. */
export function fmtScore(score: number | null | undefined): string {
  if (!isScoreCalculated(score)) return '-';
  return score.toFixed(1);
}

/** Weighted contribution of a subscore to its category (score * weight%). */
export function weightedValue(score: number, weightPct: number): number {
  return (score * weightPct) / 100;
}

/** Distribute 100% weight evenly across n items. */
export function equalWeights(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(100 / count);
  const extra = 100 - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface WeightedScoreItem {
  score: number | null;
  weight: number;
}

export interface RedistributedCalcItem extends WeightedScoreItem {
  name: string;
  contribution: number | null;
  excluded: boolean;
}

/** Re-scale nominal weights so only scored items share 100%. */
export function redistributeWeightedScores<T extends WeightedScoreItem>(
  items: T[],
): (T & { effectiveWeight: number; contribution: number | null })[] {
  const scorable = items.filter((i): i is T & { score: number } => i.score != null);
  const weightTotal = scorable.reduce((sum, i) => sum + i.weight, 0);

  return items.map((item) => {
    if (item.score == null) {
      return { ...item, effectiveWeight: 0, contribution: null };
    }
    const effectiveWeight =
      weightTotal > 0
        ? round2((item.weight / weightTotal) * 100)
        : round2(100 / scorable.length);
    return {
      ...item,
      effectiveWeight,
      contribution: round2(weightedValue(item.score, effectiveWeight)),
    };
  });
}

/** Build calc-table rows with effective weights; unscored rows are excluded (no penalty). */
export function buildRedistributedCalcItems(
  items: Array<{ name: string; score: number | null; nominalWeight: number }>,
): { rows: RedistributedCalcItem[]; excludedNames: string[] } {
  const redistributed = redistributeWeightedScores(
    items.map((i) => ({ score: i.score, weight: i.nominalWeight })),
  );
  const rows: RedistributedCalcItem[] = items.map((item, index) => ({
    name: item.name,
    score: item.score,
    weight: redistributed[index]?.effectiveWeight ?? 0,
    contribution: redistributed[index]?.contribution ?? null,
    excluded: item.score == null,
  }));
  const excludedNames = rows.filter((r) => r.excluded).map((r) => r.name);
  return { rows, excludedNames };
}

/** Compute a category score from its subscores (weighted average, NA subscores excluded). */
export function computeCategoryScore(subscores: { score: number | null; weight: number }[]): number {
  const scored = subscores.filter(
    (sub): sub is { score: number; weight: number } => sub.score != null,
  );
  const weightTotal = scored.reduce((sum, sub) => sum + sub.weight, 0);
  if (weightTotal <= 0) return 0;
  const raw = scored.reduce((sum, sub) => sum + (sub.score * sub.weight) / weightTotal, 0);
  return Math.round(raw * 10) / 10;
}

/** Compute overall product score from category scores and weights (NA categories excluded). */
export function computeOverallScore(categories: { score: number | null; weight: number }[]): number {
  const scored = categories.filter(
    (cat): cat is { score: number; weight: number } => cat.score != null,
  );
  const weightTotal = scored.reduce((sum, cat) => sum + cat.weight, 0);
  if (weightTotal <= 0) return 0;
  const raw = scored.reduce((sum, cat) => sum + (cat.score * cat.weight) / weightTotal, 0);
  return Math.round(raw * 10) / 10;
}
