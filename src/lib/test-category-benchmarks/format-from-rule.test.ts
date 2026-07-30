import { describe, expect, it } from 'vitest';
import {
  bandIndexForCount,
  formatScoringBandsTableRows,
  scoreFromBandsRule,
} from './format-from-rule';

const ethnicitiesRule = {
  kind: 'bands' as const,
  bands: [
    { upTo: 3, score: 1 },
    { upTo: 5, score: 2 },
    { upTo: 7, score: 3 },
    { upTo: 10, score: 5 },
    { upTo: 15, score: 7 },
    { upTo: 999999, score: 10 },
  ],
};

const femaleCountRule = {
  kind: 'bands' as const,
  bands: [
    { upTo: 10, score: 2 },
    { upTo: 30, score: 4 },
    { upTo: 80, score: 6 },
    { upTo: 120, score: 8 },
    { upTo: 999999, score: 10 },
  ],
};

describe('formatScoringBandsTableRows', () => {
  it('labels open-ended bands without an off-by-one gap', () => {
    const rows = formatScoringBandsTableRows(ethnicitiesRule);
    expect(rows.map((row) => row.range)).toEqual(['3 or fewer', '4–5', '6–7', '8–10', '11–15', '16+']);
  });

  it('highlights the band that matches an example count', () => {
    const rows = formatScoringBandsTableRows(ethnicitiesRule, { matchBandIndex: 5 });
    expect(rows.find((row) => row.isMatch)).toEqual({ range: '16+', score: 10, isMatch: true });
  });

  it('maps female-count example 82 to the 81–120 band', () => {
    const matchBandIndex = bandIndexForCount(82, femaleCountRule);
    const rows = formatScoringBandsTableRows(femaleCountRule, { matchBandIndex });
    const matched = rows.find((row) => row.isMatch);
    expect(matched?.range).toBe('81–120');
    expect(matched?.score).toBe(8);
    expect(scoreFromBandsRule(82, femaleCountRule)).toBe(8);
  });
});
