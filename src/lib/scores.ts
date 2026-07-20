// Single source of truth for turning a numeric score (0-10) into a band,
// label, range, and the Tailwind classes used everywhere it is rendered.

export type ScoreBand = 'good' | 'fair' | 'poor';

export interface ScoreVisual {
  band: ScoreBand;
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
  if (score >= 7.6) return 'good';
  if (score >= 5.1) return 'fair';
  return 'poor';
}

const VISUALS: Record<ScoreBand, ScoreVisual> = {
  good: {
    band: 'good',
    label: 'Good',
    range: '7.6 – 10.0',
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
    range: '5.1 – 7.5',
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
    range: '0 – 5.0',
    bg: 'bg-red-600 text-white',
    text: 'text-red-600',
    border: 'border-red-600',
    softBg: 'bg-red-50',
    softBorder: 'border-red-200',
    softText: 'text-red-800',
    dot: 'bg-red-500',
  },
};

export function getScoreVisual(score: number): ScoreVisual {
  return VISUALS[getScoreBand(score)];
}

/** CSS class for tooltip score chips (number-only colored box). */
export function getScoreChipClass(score: number): string {
  const band = getScoreBand(score);
  if (band === 'good') return 'rt-score-chip--good';
  if (band === 'fair') return 'rt-score-chip--fair';
  return 'rt-score-chip--poor';
}

/** Format a score to one decimal place (e.g. 9 -> "9.0"). */
export function fmtScore(score: number): string {
  return score.toFixed(1);
}

/** One short line comparing a score to the site average (for tooltips). */
export function getScoreMeaningLine(score: number, avg: number): string {
  const a = fmtScore(avg);
  const diff = score - avg;
  if (Math.abs(diff) < 0.15) return `Matches the ${a} site avg.`;
  if (diff >= 0.5) return `Well above the ${a} site avg.`;
  if (diff > 0) return `Above the ${a} site avg.`;
  if (diff <= -0.5) return `Well below the ${a} site avg.`;
  return `Below the ${a} site avg.`;
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

/** Compute a category score from its subscores (weighted average). */
export function computeCategoryScore(subscores: { score: number; weight: number }[]): number {
  const raw = subscores.reduce((sum, sub) => sum + weightedValue(sub.score, sub.weight), 0);
  return Math.round(raw * 10) / 10;
}

/** Compute overall product score from category scores and weights. */
export function computeOverallScore(categories: { score: number; weight: number }[]): number {
  const raw = categories.reduce((sum, cat) => sum + weightedValue(cat.score, cat.weight), 0);
  return Math.round(raw * 10) / 10;
}
