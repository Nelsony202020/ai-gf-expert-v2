/** Visual score bands from the Ratings & Tests Figma (Score component). */
export type FigmaScoreTone = 'high' | 'mid' | 'low' | 'pending';

export function getFigmaScoreTone(score: number | null | undefined): FigmaScoreTone {
  if (score == null || Number.isNaN(score)) return 'pending';
  if (score >= 8) return 'high';
  if (score >= 5) return 'mid';
  return 'low';
}

export function figmaScoreBarWidth(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return '0%';
  return `${Math.max(0, Math.min(100, (score / 10) * 100))}%`;
}
