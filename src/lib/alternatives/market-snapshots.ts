import fs from 'node:fs';
import path from 'node:path';
import type { MarketCompetitorRow } from './external-market-data';
import { formatTraffic, formatTrafficValue } from './external-market-data';
import { buildKeywordOverlapSegments, estimateKeywordTotals } from './keyword-overlap';

export interface MarketSnapshotMonth {
  key: string;
  label: string;
  rows: MarketCompetitorRow[];
}

interface SnapshotStore {
  snapshots: Record<string, MarketCompetitorRow[]>;
}

function snapshotPath(productSlug: string): string {
  return path.join(process.cwd(), 'src/data/market-snapshots', `${productSlug}.json`);
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabelFromKey(key: string): string {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function readStore(productSlug: string): SnapshotStore {
  const file = snapshotPath(productSlug);
  if (!fs.existsSync(file)) return { snapshots: {} };
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as SnapshotStore;
  } catch {
    return { snapshots: {} };
  }
}

function writeStore(productSlug: string, store: SnapshotStore): void {
  const file = snapshotPath(productSlug);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(store, null, 2)}\n`, 'utf-8');
}

export function normalizeMarketRow(row: MarketCompetitorRow | Record<string, unknown>): MarketCompetitorRow {
  const r = row as MarketCompetitorRow;
  if (r.overlap?.commonPct != null) return r;

  const common = r.sharedKeywords ?? 0;
  const share = r.keywordOverlap ?? 1;
  const targetKeywords = r.targetKeywords ?? 938;
  const competitorKeywords =
    r.competitorKeywords ?? estimateKeywordTotals(common, share, targetKeywords).competitorKeywords;
  const traffic = r.organicTrafficNum ?? 0;
  const trafficValue = r.trafficValue ?? 0;

  return {
    ...r,
    competitorKeywords,
    targetKeywords,
    trafficChangeAbs: r.trafficChangeAbs ?? null,
    trafficValueChangeAbs: r.trafficValueChangeAbs ?? null,
    trafficValueLabel: r.trafficValueLabel ?? formatTrafficValue(trafficValue),
    organicTraffic: r.organicTraffic ?? formatTraffic(traffic),
    overlap: buildKeywordOverlapSegments(common, competitorKeywords, targetKeywords),
  };
}

/** Persist current month rows and return all available months (newest first). */
export function syncMarketSnapshots(
  productSlug: string,
  rows: MarketCompetitorRow[],
): { months: MarketSnapshotMonth[]; defaultKey: string } {
  const store = readStore(productSlug);
  const defaultKey = currentMonthKey();
  store.snapshots[defaultKey] = rows.map(normalizeMarketRow);
  writeStore(productSlug, store);

  const months = Object.keys(store.snapshots)
    .sort()
    .reverse()
    .map((key) => ({
      key,
      label: monthLabelFromKey(key),
      rows: (store.snapshots[key] ?? []).map(normalizeMarketRow),
    }));

  return { months, defaultKey };
}

export function loadMarketSnapshots(productSlug: string): MarketSnapshotMonth[] {
  const store = readStore(productSlug);
  return Object.keys(store.snapshots)
    .sort()
    .reverse()
    .map((key) => ({
      key,
      label: monthLabelFromKey(key),
      rows: (store.snapshots[key] ?? []).map(normalizeMarketRow),
    }));
}
