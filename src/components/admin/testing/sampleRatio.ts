/** Auto denominator for ratio questions when sample size is set once at session top. */

import type { EntityRow } from '../api';
import { controlKind } from './presentation';

const CHECKS_PER_CHARACTER = 5;

/** Denominator derived from session sample size, or undefined if tester enters both fields. */
export function ratioDenominatorFromSample(slug: string, sampleSize: number): number | undefined {
  switch (slug) {
    case 'duplicates':
    case 'originality':
      return sampleSize;
    case 'profile-quality':
    case 'visual-quality':
      return sampleSize * CHECKS_PER_CHARACTER;
    default:
      return undefined;
  }
}

export function ratioNumeratorLabel(slug: string, def: EntityRow): string {
  const map: Record<string, string> = {
    duplicates: 'Duplicates found',
    originality: 'Characters that passed',
    'profile-quality': 'Profile checks passed',
    'visual-quality': 'Image checks passed',
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
