import { env } from '../env';
import {
  formatTraffic,
  formatTrafficValue,
  MARKET_BAR_COLORS,
  type MarketCompetitorRow,
  type MarketTrafficColumn,
} from './external-market-data';
import { filterRelevantCompetitors } from './market-competitor-filter';
import { buildKeywordOverlapSegments, estimateKeywordTotals } from './keyword-overlap';

const AHREFS_BASE = 'https://api.ahrefs.com/v3/site-explorer';

interface OrganicCompetitorRow {
  competitor_domain: string | null;
  domain_rating: number;
  keywords_common: number;
  keywords_competitor?: number | null;
  keywords_target?: number | null;
  share: number;
  traffic: number | null;
  traffic_prev?: number | null;
  traffic_diff?: number | null;
  value?: number | null;
  value_prev?: number | null;
  value_diff?: number | null;
}

interface OrganicCompetitorsResponse {
  competitors?: OrganicCompetitorRow[];
}

interface MetricsResponse {
  metrics?: {
    org_traffic?: number | null;
  };
}

const DOMAIN_LABELS: Record<string, string> = {
  'secrets.ai': 'Secrets AI',
  'candy.ai': 'Candy AI',
  'myanima.ai': 'MyAnima',
  'kindroid.ai': 'Kindroid',
  'nastia.ai': 'Nastia AI',
  'ourdream.ai': 'OurDream AI',
  'replika.ai': 'Replika',
  'romanticai.com': 'Romantic AI',
  'aura.ai': 'Aura AI',
  'kupid.ai': 'Kupid AI',
  'girlfriendgpt.com': 'GirlfriendGPT',
};

const TESTED_DOMAINS = new Set([
  'candy.ai',
  'kindroid.ai',
  'ourdream.ai',
  'aura.ai',
  'girlfriendgpt.com',
]);

function domainLabel(domain: string): string {
  return (
    DOMAIN_LABELS[domain] ??
    domain
      .replace(/^www\./, '')
      .replace(/\.\w+$/, '')
      .replace(/[-.]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function metricsDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function compareDate12M(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  return d.toISOString().slice(0, 10);
}

function trafficChangePct(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

async function ahrefsGet<T>(path: string, params: Record<string, string | number>): Promise<T | null> {
  const apiKey = env('AHREFS_API_KEY');
  if (!apiKey) return null;

  const url = new URL(`${AHREFS_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      console.warn(`[ahrefs] ${path} failed: ${res.status} ${res.statusText}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn('[ahrefs] request error:', err);
    return null;
  }
}

async function fetchSourceTraffic(sourceDomain: string): Promise<number> {
  const data = await ahrefsGet<MetricsResponse>('/metrics', {
    target: sourceDomain,
    country: 'us',
    date: metricsDate(),
    select: 'org_traffic',
  });
  return data?.metrics?.org_traffic ?? 0;
}

async function fetchCompetitors(sourceDomain: string): Promise<OrganicCompetitorRow[]> {
  const data = await ahrefsGet<OrganicCompetitorsResponse>('/organic-competitors', {
    target: sourceDomain,
    country: 'us',
    date: metricsDate(),
    date_compared: compareDate12M(),
    select:
      'competitor_domain,domain_rating,keywords_common,keywords_competitor,keywords_target,share,traffic,traffic_prev,traffic_diff,value,value_prev,value_diff',
    limit: 50,
    order_by: 'keywords_common:desc',
  });
  return data?.competitors?.filter((r) => r.competitor_domain) ?? [];
}

function estimateTrafficValue(traffic: number): number {
  if (traffic <= 0) return 0;
  return Math.round(traffic * 1.25);
}

function toMarketRow(
  domain: string,
  row: OrganicCompetitorRow,
  isSource = false,
  targetKeywordsFallback = 938,
): MarketCompetitorRow {
  const traffic = row.traffic ?? 0;
  const prev = row.traffic_prev ?? null;
  const trafficChangeAbs =
    row.traffic_diff ?? (prev != null ? traffic - prev : null);
  const trafficValue = row.value ?? estimateTrafficValue(traffic);
  const valuePrev = row.value_prev ?? null;
  const trafficValueChangeAbs =
    row.value_diff ?? (valuePrev != null ? trafficValue - valuePrev : null);
  const sharePct = Math.max(0, Math.round(row.share));
  const common = row.keywords_common ?? 0;
  const competitorKeywords =
    row.keywords_competitor ??
    estimateKeywordTotals(common, sharePct, targetKeywordsFallback).competitorKeywords;
  const targetKeywords = row.keywords_target ?? targetKeywordsFallback;
  const overlap = buildKeywordOverlapSegments(common, competitorKeywords, targetKeywords);

  return {
    name: domainLabel(domain),
    domain,
    organicTraffic: formatTraffic(traffic),
    organicTrafficNum: traffic,
    sharedKeywords: common,
    trafficChangeAbs,
    trafficChangePct: trafficChangePct(traffic, prev),
    trafficValue,
    trafficValueLabel: formatTrafficValue(trafficValue),
    trafficValueChangeAbs,
    domainRating: Math.round(row.domain_rating),
    keywordOverlap: Math.max(1, sharePct),
    competitorKeywords,
    targetKeywords,
    overlap,
    isSource,
    tested: TESTED_DOMAINS.has(domain),
  };
}

function buildTrafficChart(
  sourceDomain: string,
  sourceName: string,
  sourceTraffic: number,
  competitors: MarketCompetitorRow[],
  limit = 8,
): MarketTrafficColumn[] {
  const sourceCol: MarketTrafficColumn = {
    name: sourceName,
    domain: sourceDomain,
    traffic: sourceTraffic,
    trafficLabel: formatTraffic(sourceTraffic),
    isSource: true,
    tested: TESTED_DOMAINS.has(sourceDomain),
    barColor: MARKET_BAR_COLORS[0],
  };

  const topCompetitors = [...competitors]
    .filter((r) => !r.isSource)
    .sort((a, b) => b.organicTrafficNum - a.organicTrafficNum)
    .slice(0, limit - 1);

  let colorIdx = 1;
  const compCols = topCompetitors.map((r) => ({
    name: r.name,
    domain: r.domain,
    traffic: r.organicTrafficNum,
    trafficLabel: r.organicTraffic,
    isSource: false,
    tested: r.tested,
    barColor: MARKET_BAR_COLORS[colorIdx++ % MARKET_BAR_COLORS.length],
  }));

  return [sourceCol, ...compCols];
}

export interface AhrefsMarketData {
  trafficChart: MarketTrafficColumn[];
  metricsTable: MarketCompetitorRow[];
  competitors: MarketCompetitorRow[];
  source: 'ahrefs' | 'mock';
}

export async function fetchAhrefsMarketData(
  sourceDomain: string,
  sourceName?: string,
  limit = 8,
): Promise<AhrefsMarketData | null> {
  const [sourceTraffic, currentRows] = await Promise.all([
    fetchSourceTraffic(sourceDomain),
    fetchCompetitors(sourceDomain),
  ]);

  if (!currentRows.length) return null;

  let competitors = filterRelevantCompetitors(
    currentRows.map((r) => toMarketRow(r.competitor_domain!, r)),
    limit - 1,
  );

  if (!competitors.length) {
    competitors = currentRows
      .slice(0, limit - 1)
      .map((r) => toMarketRow(r.competitor_domain!, r));
  }

  if (!competitors.length) return null;

  const sourceRow: MarketCompetitorRow = {
    name: sourceName ?? domainLabel(sourceDomain),
    domain: sourceDomain,
    organicTraffic: formatTraffic(sourceTraffic),
    organicTrafficNum: sourceTraffic,
    sharedKeywords: 0,
    trafficChangeAbs: null,
    trafficChangePct: null,
    trafficValue: 0,
    trafficValueLabel: formatTrafficValue(0),
    trafficValueChangeAbs: null,
    domainRating: 0,
    keywordOverlap: 0,
    competitorKeywords: 0,
    targetKeywords: 938,
    overlap: buildKeywordOverlapSegments(0, 0, 938),
    isSource: true,
    tested: TESTED_DOMAINS.has(sourceDomain),
  };

  const trafficChart = buildTrafficChart(
    sourceDomain,
    sourceRow.name,
    sourceTraffic,
    competitors,
    limit,
  );
  // Table: organic search competitors for the source domain only (not editorial review peers).
  const metricsTable = [...competitors]
    .filter((r) => !r.isSource && r.domain !== sourceDomain)
    .sort((a, b) => b.sharedKeywords - a.sharedKeywords)
    .slice(0, 10);

  return {
    trafficChart,
    metricsTable,
    competitors: [sourceRow, ...competitors],
    source: 'ahrefs',
  };
}

export function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}
