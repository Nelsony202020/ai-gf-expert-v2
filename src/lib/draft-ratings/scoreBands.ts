import type { ScoreVisual } from '../scores';
import { isScoreCalculated } from '../scores';

/** Draft-only score bands — do not change shared `scores.ts`. */
function getDraftScoreBand(score: number): 'good' | 'fair' | 'poor' {
  if (score >= 6.5) return 'good';
  if (score >= 5.5) return 'fair';
  return 'poor';
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

const VISUALS: Record<'good' | 'fair' | 'poor', ScoreVisual> = {
  good: {
    band: 'good',
    label: 'Good',
    range: '6.5 – 10.0',
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
    range: '5.5 – 6.4',
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

export function getDraftScoreVisual(score: number | null | undefined): ScoreVisual {
  if (!isScoreCalculated(score)) return PENDING_VISUAL;
  return VISUALS[getDraftScoreBand(score)];
}

/** CSS class for ratings-tab score chips (draft bands only). */
export function getDraftScoreChipClass(score: number | null | undefined): string {
  if (!isScoreCalculated(score)) return 'rt-score-chip--pending';
  const band = getDraftScoreBand(score);
  if (band === 'good') return 'rt-score-chip--good';
  if (band === 'fair') return 'rt-score-chip--fair';
  return 'rt-score-chip--poor';
}
