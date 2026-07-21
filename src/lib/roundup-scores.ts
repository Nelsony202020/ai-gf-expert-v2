import { getScoreBand } from './scores';

/** Each of 5 bar segments represents 2 points on the 0–10 scale. */
export function getSegmentFill(
  score: number,
  index: number,
): { state: 'empty' | 'full' | 'partial'; partialPct: number } {
  const segStart = index * 2;
  const segEnd = (index + 1) * 2;
  if (score >= segEnd) return { state: 'full', partialPct: 100 };
  if (score <= segStart) return { state: 'empty', partialPct: 0 };
  return { state: 'partial', partialPct: ((score - segStart) / 2) * 100 };
}

export function getSegmentFillClass(score: number): string {
  const band = getScoreBand(score);
  if (band === 'good') return 'is-filled-good';
  if (band === 'fair') return 'is-filled-fair';
  return 'is-filled-poor';
}

export function getScoreFillRatio(score: number): number {
  return Math.min(Math.max(score / 10, 0), 1);
}
