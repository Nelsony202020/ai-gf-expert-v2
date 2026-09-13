/** Homepage / Figma score bands: High ≥ 8.0, Mid 5.0–7.9, Low < 5.0. */

export type FigmaScoreTone = 'high' | 'mid' | 'low';

export function figmaScoreTone(score: number): FigmaScoreTone {
  if (score >= 8) return 'high';
  if (score >= 5) return 'mid';
  return 'low';
}

export function figmaScoreWord(score: number): string {
  if (score >= 8) return 'Strong';
  if (score >= 5) return 'Average';
  return 'Weak';
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function scoreBarWidth(score: number): string {
  const clamped = Math.max(0, Math.min(10, score));
  return `${clamped * 10}%`;
}

export function scoreRingDegrees(score: number): number {
  return Math.max(0, Math.min(10, score)) * 36;
}
