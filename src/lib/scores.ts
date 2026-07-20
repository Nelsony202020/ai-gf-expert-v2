// Single source of truth for turning a numeric score (0-10) into a band,
// label, range, and the Tailwind classes used everywhere it is rendered.

export type ScoreBand = 'excellent' | 'great' | 'good' | 'fair' | 'poor';

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
  if (score >= 9) return 'excellent';
  if (score >= 8) return 'great';
  if (score >= 7) return 'good';
  if (score >= 6) return 'fair';
  return 'poor';
}

const VISUALS: Record<ScoreBand, ScoreVisual> = {
  excellent: {
    band: 'excellent',
    label: 'Excellent',
    range: '9.0 – 10.0',
    bg: 'bg-green-600 text-white',
    text: 'text-green-600',
    border: 'border-green-600',
    softBg: 'bg-green-50',
    softBorder: 'border-green-200',
    softText: 'text-green-800',
    dot: 'bg-green-500',
  },
  great: {
    band: 'great',
    label: 'Great',
    range: '8.0 – 8.9',
    bg: 'bg-green-600 text-white',
    text: 'text-green-600',
    border: 'border-green-600',
    softBg: 'bg-green-50',
    softBorder: 'border-green-200',
    softText: 'text-green-800',
    dot: 'bg-green-500',
  },
  good: {
    band: 'good',
    label: 'Good',
    range: '7.0 – 7.9',
    bg: 'bg-primary-container text-white',
    text: 'text-primary-container',
    border: 'border-primary-container',
    softBg: 'bg-orange-50',
    softBorder: 'border-orange-200',
    softText: 'text-on-primary-container',
    dot: 'bg-primary-container',
  },
  fair: {
    band: 'fair',
    label: 'Fair',
    range: '6.0 – 6.9',
    bg: 'bg-amber-500 text-white',
    text: 'text-amber-600',
    border: 'border-amber-500',
    softBg: 'bg-amber-50',
    softBorder: 'border-amber-200',
    softText: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  poor: {
    band: 'poor',
    label: 'Poor',
    range: '0 – 5.9',
    bg: 'bg-error text-white',
    text: 'text-error',
    border: 'border-error',
    softBg: 'bg-red-50',
    softBorder: 'border-red-200',
    softText: 'text-on-error-container',
    dot: 'bg-error',
  },
};

export function getScoreVisual(score: number): ScoreVisual {
  return VISUALS[getScoreBand(score)];
}

/** Format a score to one decimal place (e.g. 9 -> "9.0"). */
export function fmtScore(score: number): string {
  return score.toFixed(1);
}

/** Weighted contribution of a subscore to its category (score * weight%). */
export function weightedValue(score: number, weightPct: number): number {
  return (score * weightPct) / 100;
}
