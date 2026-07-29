/** Minimum published apps with regular-use cost before peer comparison runs. */
export const CATEGORY_COMPARISON_MIN_SAMPLE = 10;

export function extractRegularUseCost(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object' || !('value' in raw)) return null;
  const num = Number((raw as { value: unknown }).value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/** % above (+) or below (−) category average regular-use cost. */
export function categoryComparisonPercent(productCost: number, peerCosts: number[]): number | null {
  if (!Number.isFinite(productCost) || productCost <= 0 || peerCosts.length < CATEGORY_COMPARISON_MIN_SAMPLE) {
    return null;
  }
  const avg = peerCosts.reduce((sum, n) => sum + n, 0) / peerCosts.length;
  if (!Number.isFinite(avg) || avg <= 0) return null;
  return Math.round(((productCost - avg) / avg) * 1000) / 10;
}

export function categoryComparisonNote(pct: number, sampleSize: number): string {
  const dir = pct < 0 ? 'below' : pct > 0 ? 'above' : 'at';
  return `Regular-use cost is ${Math.abs(pct).toFixed(1)}% ${dir} the average of ${sampleSize} reviewed apps (auto-calculated).`;
}
