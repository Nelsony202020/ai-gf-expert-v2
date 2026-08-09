import type { Product } from '../../data/products';
import { ROUNDUP_CATEGORY_KEYS } from '../../data/roundups/ai-girlfriend';
import { COMPARISON_CATEGORY_KEYS } from '../../data/product-alternatives-config';

export function categoryScoreMap(product: Product): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const key of COMPARISON_CATEGORY_KEYS) {
    const cat = product.categories.find((c) => c.key === key);
    out[key] = cat?.score ?? null;
  }
  return out;
}

/**
 * Provisional similarity from normalized category-score distance.
 * 100 = identical profile; lower when category scores diverge.
 */
export function computeSimilarityScore(source: Product, targetScores: Record<string, number | null>): number {
  const diffs: number[] = [];
  for (const key of ROUNDUP_CATEGORY_KEYS) {
    const a = source.categories.find((c) => c.key === key)?.score;
    const b = targetScores[key];
    if (a == null || b == null) continue;
    diffs.push(Math.abs(a - b));
  }
  if (diffs.length === 0) return 0;
  const avgDiff = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
  return Math.round(Math.max(0, Math.min(100, 100 - avgDiff * 12)));
}

export function beatsThreshold(sourceScore: number | null, targetScore: number | null, threshold: number): boolean {
  if (sourceScore == null || targetScore == null) return false;
  return targetScore >= sourceScore + threshold;
}

export function sourceBeatsThreshold(sourceScore: number | null, targetScore: number | null, threshold: number): boolean {
  if (sourceScore == null || targetScore == null) return false;
  return sourceScore >= targetScore + threshold;
}
