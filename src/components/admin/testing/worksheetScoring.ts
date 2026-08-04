/** Shared worksheet row scoring helpers (defects, usable, tri-state). */

import type { DerivedColumn, WorksheetColumn, WorksheetConfig, WorksheetRow } from './worksheets';

export const IMAGE_DEFECTS = [
  'Bad hands or fingers',
  'Face distortion',
  'Extra or missing limbs',
  'Body distortion',
  'Clothing errors',
  'Duplicate objects',
  'Background errors',
  'Text artifacts',
  'Character inconsistency',
  'Other',
] as const;

export const VIDEO_DEFECTS = [
  'Face distortion',
  'Body or limb warping',
  'Flickering',
  'Character identity changed',
  'Background changed unexpectedly',
  'Objects disappeared or duplicated',
  'Broken camera movement',
  'Motion froze or jumped',
  'Other',
] as const;

const SEVERE_IMAGE = new Set([
  'Face distortion',
  'Extra or missing limbs',
  'Body distortion',
]);

const SEVERE_VIDEO = new Set([
  'Face distortion',
  'Body or limb warping',
  'Character identity changed',
]);

export type TriValue = 'yes' | 'mostly' | 'no';

export function triToScore(v: TriValue | undefined): number | undefined {
  if (v === 'yes') return 1;
  if (v === 'mostly') return 0.5;
  if (v === 'no') return 0;
  return undefined;
}

export function readDefects(row: WorksheetRow): string[] {
  const d = row._defects;
  return Array.isArray(d) ? (d as string[]) : [];
}

export function imageUsable(row: WorksheetRow): boolean | null {
  const vq = row.realism;
  if (typeof vq !== 'number') return null;
  if (vq <= 2) return false;
  const defects = readDefects(row);
  if (defects.some((d) => SEVERE_IMAGE.has(d))) return false;
  return true;
}

export function videoUsable(row: WorksheetRow): boolean | null {
  const motion = row.motion;
  const character = row['character-consistency'];
  const stability = row['frame-consistency'];
  if ([motion, character, stability].some((v) => typeof v === 'number' && v <= 2)) return false;
  if ([motion, character, stability].some((v) => v === undefined)) {
    if (motion === undefined && character === undefined && stability === undefined) return null;
  }
  const defects = readDefects(row);
  if (defects.some((d) => SEVERE_VIDEO.has(d))) return false;
  return true;
}

export function syncDerivedRowFields(row: WorksheetRow, sessionId: string): WorksheetRow {
  const next = { ...row };
  if (sessionId === 'image-batch-review') {
    const usable = imageUsable(next);
    if (usable !== null) next['visual-errors'] = !usable;
  }
  if (sessionId === 'video-batch-review') {
    const usable = videoUsable(next);
    if (usable !== null) next['visual-errors'] = !usable;
  }
  if (sessionId === 'image-consistency') {
    const face = triToScore(next['face-consistency'] as TriValue | undefined);
    const body = triToScore(next['body-consistency'] as TriValue | undefined);
    const style = triToScore(next['style-consistency'] as TriValue | undefined);
    const parts = [face, body, style].filter((x): x is number => x !== undefined);
    if (parts.length === 3) {
      const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
      next['character-consistency'] = Math.round(avg * 5 * 10) / 10;
    }
  }
  return next;
}

export function deriveWorksheetExtended(
  config: WorksheetConfig,
  rows: WorksheetRow[],
  sessionId: string,
) {
  const synced = rows.map((r) => syncDerivedRowFields(r, sessionId));
  return config.columns.map((col) => {
    let numerator = 0;
    let filledRows = 0;
    const skipRow0 = sessionId === 'image-consistency' && col.kind !== 'reference';

    for (let i = 0; i < synced.length; i++) {
      if (skipRow0 && i === 0 && col.kind === 'tri') continue;
      const row = synced[i];
      const cell = row?.[col.defSlug];

      if (col.kind === 'avg_tri') {
        const slugs = col.avgOf ?? [];
        const scores = slugs
          .map((s) => triToScore(row[s] as TriValue | undefined))
          .filter((x): x is number => x !== undefined);
        if (scores.length === slugs.length) {
          filledRows++;
          numerator += (scores.reduce((a, b) => a + b, 0) / scores.length) * (col.max ?? 5);
        }
        continue;
      }

      if (cell === undefined) continue;
      filledRows++;
      if (col.kind === 'pass') numerator += cell ? 1 : 0;
      else if (col.kind === 'tri') numerator += triToScore(cell as TriValue) ?? 0;
      else numerator += Number(cell) || 0;
    }

    const effectiveRows = Math.max(config.rowCount, synced.length);
    const rowDenom =
      skipRow0 && (col.kind === 'tri' || col.kind === 'avg_tri')
        ? Math.max(0, effectiveRows - 1)
        : effectiveRows;

    const denominator =
      col.kind === 'pass'
        ? rowDenom
        : col.kind === 'tri'
          ? rowDenom
          : col.kind === 'avg_tri'
            ? rowDenom * (col.max ?? 5)
            : rowDenom * (col.max ?? 1);

    const pct = denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
    return { defSlug: col.defSlug, numerator, denominator, pct, filledRows };
  });
}

export function defectCounts(rows: WorksheetRow[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    for (const d of readDefects(row)) map.set(d, (map.get(d) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function batchSummaryStats(
  rows: WorksheetRow[],
  numericSlugs: string[],
  usableFn: (row: WorksheetRow) => boolean | null,
) {
  const avgs: Record<string, number | null> = {};
  for (const slug of numericSlugs) {
    const vals = rows.map((r) => r[slug]).filter((v): v is number => typeof v === 'number');
    avgs[slug] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  }
  const usable = rows.filter((r) => usableFn(r) === true).length;
  const rated = rows.filter((r) => usableFn(r) !== null).length;
  const failureRate = rated > 0 ? Math.round(((rated - usable) / rated) * 100) : null;
  return { avgs, usable, rated, failureRate };
}

const RELIABILITY_BAND_COUNTS = new Set(['repetition', 'refusals', 'errors']);

function median(nums: number[]): number | undefined {
  if (nums.length === 0) return undefined;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function worksheetColumnFooter(
  col: WorksheetColumn,
  derived: DerivedColumn | undefined,
  rows: WorksheetRow[],
): string {
  if (!derived || derived.filledRows === 0) return '—';
  if (col.footer === 'seconds') {
    const vals = rows
      .map((r) => r[col.defSlug])
      .filter((v): v is number => typeof v === 'number');
    const med = median(vals);
    return med === undefined ? '—' : `${med}s`;
  }
  const pct = col.invert ? Math.round((100 - derived.pct) * 10) / 10 : derived.pct;
  return `${pct}%`;
}

/** Map chat-reliability worksheet columns to scored raw values. */
export function reliabilityWorksheetRaw(
  slug: string,
  col: DerivedColumn,
  rows: WorksheetRow[],
): { value: number; detail: Record<string, unknown> } {
  const detail = {
    numerator: col.numerator,
    denominator: col.denominator,
    worksheetRows: rows,
  };
  if (slug === 'reply-speed') {
    const seconds = rows
      .map((r) => r['reply-speed'])
      .filter((v): v is number => typeof v === 'number');
    const med = median(seconds);
    return { value: med ?? 0, detail: { ...detail, medianSeconds: med } };
  }
  if (RELIABILITY_BAND_COUNTS.has(slug)) {
    return { value: col.numerator, detail };
  }
  return { value: col.pct, detail };
}

/** Live partial summary for character consistency (variation rows only). */
export function consistencySummaryStats(rows: WorksheetRow[]) {
  const variations = rows.slice(1);
  const total = variations.length;
  let rated = 0;
  let faceYes = 0;
  let bodyYes = 0;
  let styleYes = 0;
  let overallSum = 0;
  let overallCount = 0;

  for (const row of variations) {
    const face = row['face-consistency'] as TriValue | undefined;
    const body = row['body-consistency'] as TriValue | undefined;
    const style = row['style-consistency'] as TriValue | undefined;
    if (!face && !body && !style) continue;
    rated++;
    if (face === 'yes') faceYes++;
    if (body === 'yes') bodyYes++;
    if (style === 'yes') styleYes++;
    const overall = row['character-consistency'];
    if (typeof overall === 'number') {
      overallSum += overall;
      overallCount++;
    }
  }

  return {
    total,
    rated,
    faceYes,
    bodyYes,
    styleYes,
    avgOverall: overallCount > 0 ? Math.round((overallSum / overallCount) * 10) / 10 : null,
  };
}

export type { WorksheetColumn };
