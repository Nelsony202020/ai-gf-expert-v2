import { describe, expect, it } from 'vitest';
import {
  buildRedistributedCalcItems,
  computeCategoryScore,
  computeOverallScore,
  redistributeWeightedScores,
} from './scores';

describe('redistributeWeightedScores', () => {
  it('re-scales weights among scored items only', () => {
    const out = redistributeWeightedScores([
      { score: 10, weight: 20 },
      { score: null, weight: 15 },
      { score: 8, weight: 25 },
      { score: null, weight: 40 },
    ]);
    expect(out[0]?.effectiveWeight).toBe(44.44);
    expect(out[0]?.contribution).toBe(4.44);
    expect(out[1]?.contribution).toBeNull();
    expect(out[2]?.effectiveWeight).toBe(55.56);
    expect(out[2]?.contribution).toBe(4.44);
    expect(out[3]?.contribution).toBeNull();
  });
});

describe('buildRedistributedCalcItems', () => {
  it('lists excluded evidence names separately', () => {
    const { rows, excludedNames } = buildRedistributedCalcItems([
      { name: 'Plan limits', score: 10, nominalWeight: 14 },
      { name: 'Annual price', score: null, nominalWeight: 14 },
      { name: 'Included credits', score: null, nominalWeight: 14 },
    ]);
    expect(excludedNames).toEqual(['Annual price', 'Included credits']);
    expect(rows[0]?.weight).toBe(100);
    expect(rows[0]?.contribution).toBe(10);
  });
});

describe('computeCategoryScore', () => {
  it('excludes null subscores and redistributes weight', () => {
    const score = computeCategoryScore([
      { score: 10, weight: 30 },
      { score: null, weight: 35 },
      { score: null, weight: 20 },
      { score: null, weight: 15 },
    ]);
    expect(score).toBe(10);
  });
});

describe('computeOverallScore', () => {
  it('excludes null categories and redistributes weight', () => {
    const score = computeOverallScore([
      { score: 8, weight: 10 },
      { score: null, weight: 10 },
      { score: null, weight: 10 },
    ]);
    expect(score).toBe(8);
  });
});
