import { buildKeywordOverlapSegments, estimateKeywordTotals } from './keyword-overlap';

export interface MarketTrafficColumn {
  name: string;
  domain: string;
  traffic: number;
  trafficLabel: string;
  isSource: boolean;
  tested?: boolean;
  barColor: string;
}

export interface MarketCompetitorRow {
  name: string;
  domain: string;
  organicTraffic: string;
  organicTrafficNum: number;
  sharedKeywords: number;
  /** Absolute 12M organic traffic change (Ahrefs traffic_diff). */
  trafficChangeAbs: number | null;
  /** Legacy percent change — kept for snapshots compatibility. */
  trafficChangePct: number | null;
  trafficValue: number;
  trafficValueLabel: string;
  /** Absolute 12M traffic value change (USD). */
  trafficValueChangeAbs: number | null;
  domainRating: number;
  /** Keyword overlap share 0–100. */
  keywordOverlap: number;
  competitorKeywords: number;
  targetKeywords: number;
  overlap: {
    competitorUnique: number;
    common: number;
    targetUnique: number;
    competitorPct: number;
    commonPct: number;
    targetPct: number;
  };
  isSource?: boolean;
  tested?: boolean;
}

export const MARKET_BAR_COLORS = [
  '#c4b5fd',
  '#7c3aed',
  '#2dd4bf',
  '#a3e635',
  '#60a5fa',
  '#f472b6',
  '#fb923c',
  '#94a3b8',
] as const;

export function formatTraffic(n: number): string {
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val >= 10 ? `${Math.round(val)}M` : `${val.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val >= 100 ? `${Math.round(val)}K` : `${val.toFixed(0)}K`;
  }
  return String(n);
}

export function formatTrafficChangeAbs(diff: number | null): string {
  if (diff == null || !Number.isFinite(diff)) return '—';
  if (Math.abs(diff) < 1) return '0';
  const sign = diff > 0 ? '+' : '-';
  const abs = Math.abs(diff);
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    return `${sign}${val >= 10 ? Math.round(val) : val.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const val = abs / 1_000;
    return `${sign}${val >= 100 ? Math.round(val) : val.toFixed(1)}K`;
  }
  return `${sign}${Math.round(abs)}`;
}

export function formatValueChangeAbs(diff: number | null): string {
  if (diff == null || !Number.isFinite(diff)) return '—';
  if (Math.abs(diff) < 1) return '$0';
  const sign = diff > 0 ? '+' : '-';
  const abs = Math.abs(diff);
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    return `${sign}$${val >= 10 ? Math.round(val) : val.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const val = abs / 1_000;
    return `${sign}$${val >= 100 ? Math.round(val) : val.toFixed(1)}K`;
  }
  return `${sign}$${Math.round(abs)}`;
}

export function formatTrafficChangePct(pct: number | null): string {
  if (pct == null || !Number.isFinite(pct)) return '—';
  if (Math.abs(pct) < 0.5) return '0%';
  const rounded = Math.round(pct);
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

export function formatTrafficValue(n: number): string {
  if (n <= 0) return '—';
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val >= 10 ? `$${Math.round(val)}M` : `$${val.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val >= 100 ? `$${Math.round(val)}K` : `$${Math.round(val)}K`;
  }
  return `$${Math.round(n)}`;
}

function row(
  name: string,
  domain: string,
  traffic: number,
  sharedKeywords: number,
  trafficChangeAbs: number | null,
  domainRating: number,
  keywordOverlap: number,
  trafficValue: number,
  trafficValueChangeAbs: number | null,
  competitorKeywords?: number,
  targetKeywords = 938,
  tested = false,
  isSource = false,
): MarketCompetitorRow & { traffic: number; trafficLabel: string; barColor: string } {
  const totals =
    competitorKeywords != null
      ? { competitorKeywords, targetKeywords }
      : estimateKeywordTotals(sharedKeywords, keywordOverlap, targetKeywords);
  const overlap = buildKeywordOverlapSegments(
    sharedKeywords,
    totals.competitorKeywords,
    totals.targetKeywords,
  );
  const trafficChangePct =
    trafficChangeAbs != null && traffic > 0
      ? Math.round((trafficChangeAbs / (traffic - trafficChangeAbs)) * 100)
      : null;

  return {
    name,
    domain,
    organicTraffic: formatTraffic(traffic),
    organicTrafficNum: traffic,
    sharedKeywords,
    trafficChangeAbs,
    trafficChangePct,
    trafficValue,
    trafficValueLabel: formatTrafficValue(trafficValue),
    trafficValueChangeAbs,
    domainRating,
    keywordOverlap,
    competitorKeywords: totals.competitorKeywords,
    targetKeywords: totals.targetKeywords,
    overlap,
    tested,
    isSource,
    traffic,
    trafficLabel: formatTraffic(traffic),
    barColor: isSource ? MARKET_BAR_COLORS[0] : MARKET_BAR_COLORS[1],
  };
}

const AURA_MARKET_DATA: Array<
  MarketCompetitorRow & { traffic: number; trafficLabel: string; barColor: string }
> = [
  row('Aura AI', 'aura.ai', 380_000, 0, 0, 56, 0, 420_000, 0, 1200, 938, true, true),
  row('Candy AI', 'candy.ai', 1_800_000, 1840, 280_000, 61, 42, 2_100_000, 320_000, 125_899, 938, true),
  row('Kindroid', 'kindroid.ai', 820_000, 920, 54_000, 54, 31, 960_000, 62_000, 88_400, 938, true),
  row('OurDream AI', 'ourdream.ai', 510_000, 610, -22_000, 47, 24, 580_000, -28_000, 52_800, 938, true),
  row('Secrets AI', 'secrets.ai', 7_680_000, 1204, 820_000, 71, 18, 8_900_000, 950_000, 980_000, 938),
  row('MyAnima', 'myanima.ai', 1_240_000, 842, -38_000, 67, 19, 1_450_000, -44_000, 210_000, 938),
  row('Nastia AI', 'nastia.ai', 890_000, 614, 42_000, 58, 15, 1_020_000, 48_000, 145_000, 938),
  row('Replika', 'replika.ai', 430_000, 480, -9_600, 59, 12, 510_000, -11_000, 68_000, 938),
  row('Romantic AI', 'romanticai.com', 720_000, 531, 58_000, 55, 14, 840_000, 67_000, 92_000, 938),
  row('Kupid AI', 'kupid.ai', 540_000, 489, -33_000, 52, 11, 620_000, -38_000, 78_000, 938),
];

function assignBarColors(
  rows: Array<MarketCompetitorRow & { traffic: number; trafficLabel: string; barColor?: string }>,
): MarketTrafficColumn[] {
  let colorIdx = 1;
  return rows.map((r) => ({
    name: r.name,
    domain: r.domain,
    traffic: r.traffic,
    trafficLabel: r.trafficLabel,
    isSource: Boolean(r.isSource),
    tested: r.tested,
    barColor: r.isSource ? MARKET_BAR_COLORS[0] : MARKET_BAR_COLORS[colorIdx++ % MARKET_BAR_COLORS.length],
  }));
}

export function getMarketTrafficChart(productSlug: string, limit = 8): MarketTrafficColumn[] {
  if (productSlug !== 'aura-ai') return [];
  const source = AURA_MARKET_DATA.find((r) => r.isSource)!;
  const competitors = [...AURA_MARKET_DATA]
    .filter((r) => !r.isSource)
    .sort((a, b) => b.traffic - a.traffic)
    .slice(0, limit - 1);
  return assignBarColors([source, ...competitors]);
}

export function getExternalMarketCompetitors(productSlug: string): MarketCompetitorRow[] {
  if (productSlug !== 'aura-ai') return [];
  return AURA_MARKET_DATA.map(({ traffic, trafficLabel, barColor, ...rest }) => rest);
}

export function getMarketMetricsTable(productSlug: string, limit = 7): MarketCompetitorRow[] {
  if (productSlug !== 'aura-ai') return [];
  return [...AURA_MARKET_DATA]
    .filter((r) => !r.isSource)
    .sort((a, b) => b.sharedKeywords - a.sharedKeywords)
    .slice(0, limit)
    .map(({ traffic, trafficLabel, barColor, ...rest }) => rest);
}

/** @deprecated Use getMarketTrafficChart */
export type TrafficBarRow = MarketTrafficColumn;

/** @deprecated Use getMarketTrafficChart */
export function getOrganicTrafficBars(productSlug: string, limit = 6): MarketTrafficColumn[] {
  return getMarketTrafficChart(productSlug, limit + 1);
}
