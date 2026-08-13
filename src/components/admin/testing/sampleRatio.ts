/** Auto denominator for ratio questions when sample size is set once at session top. */

import type { EntityRow } from '../api';
import { controlKind } from './presentation';

/** Denominator derived from session sample size, or undefined if tester enters both fields. */
export function ratioDenominatorFromSample(_slug: string, _sampleSize: number): number | undefined {
  // Character quality no longer uses ratio inputs (duplicates = count; profiles/photos = Likert).
  return undefined;
}

/** Max allowed for duplicate-count questions (0 = best). */
export function duplicateCountMax(sampleSize?: number): number {
  if (sampleSize && sampleSize > 0) return Math.min(25, sampleSize);
  return 25;
}

export function ratioNumeratorLabel(slug: string, def: EntityRow): string {
  const map: Record<string, string> = {
    duplicates: 'Duplicate profiles found',
  };
  return map[slug] ?? String(def.name ?? 'Count');
}

export function usesSessionSampleDenominator(def: EntityRow, sampleSize?: number): boolean {
  if (!sampleSize || sampleSize < 1) return false;
  if (controlKind(def) !== 'ratio') return false;
  return ratioDenominatorFromSample(String(def.slug ?? ''), sampleSize) !== undefined;
}

export function pctFromRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}
