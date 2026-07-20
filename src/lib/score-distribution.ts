export interface ScorePoint {
  slug: string;
  name: string;
  score: number;
}

export interface ScoreBin {
  start: number;
  end: number;
  apps: ScorePoint[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Every histogram bucket from 0.1–9.7 (step 0.4, width 0.3). */
export function buildAllScoreBins(scorePoints: ScorePoint[]): ScoreBin[] {
  const bins: ScoreBin[] = [];

  for (let s = 0.1; s <= 9.7 + 1e-9; s += 0.4) {
    bins.push({ start: round1(s), end: round1(s + 0.3), apps: [] });
  }

  for (const app of scorePoints) {
    const found = bins.find((b) => app.score >= b.start && app.score <= b.end);
    found?.apps.push(app);
  }

  return bins;
}

/** Legacy helper — prefer buildAllScoreBins for charts. */
export function buildScoreBins(
  scorePoints: ScorePoint[],
  currentScore: number,
  avgScore: number
): ScoreBin[] {
  const bins = buildAllScoreBins(scorePoints);
  const includes = (value: number, bin: ScoreBin) => value >= bin.start && value <= bin.end;
  return bins.filter(
    (b) => b.apps.length > 0 || includes(currentScore, b) || includes(avgScore, b)
  );
}

export function activeBinIndex(bins: ScoreBin[], score: number): number {
  const idx = bins.findIndex((b) => score >= b.start && score <= b.end);
  return idx >= 0 ? idx : 0;
}
