import type { Product } from '../../data/products';
import { PRODUCT_ALTERNATIVES } from '../../data/product-alternatives-config';
import { loadComparisonProducts } from '../content/comparisonProducts';
import {
  ahrefsGet,
  ahrefsKeywordsGet,
  AHREFS_MARKET_DATA_BASE_CALLS,
  compareDate12M,
  historyDateFrom24M,
  metricsDate,
} from '../ahrefs/client';
import { getAuraAiDraftMarketData } from './aura-ai-draft';
import { marketOk } from './format';
import {
  getMarketReviewPeers,
  parseReviewPrice,
  resolveReviewDomain,
} from './review-peers';
import type {
  MarketCompetitorRow,
  MarketDataViewModel,
  MarketRankItem,
  MarketTrendSeries,
} from './types';

const ok = marketOk;
const CATEGORY_KEYWORD = 'ai girlfriend';

interface MetricsResponse {
  metrics?: { org_traffic?: number | null };
}

interface MetricsHistoryRow {
  date: string;
  org_traffic: number;
}

interface MetricsHistoryResponse {
  metrics?: MetricsHistoryRow[];
}

interface KeywordVolumeRow {
  date: string;
  volume: number;
}

interface KeywordVolumeResponse {
  metrics?: KeywordVolumeRow[];
}

interface OrganicCompetitorRow {
  competitor_domain: string | null;
  traffic: number | null;
  traffic_prev?: number | null;
}

interface OrganicCompetitorsResponse {
  competitors?: OrganicCompetitorRow[];
}

function trafficChangePct(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function toInterest(traffic: number, maxTraffic: number): number {
  if (traffic <= 0 || maxTraffic <= 0) return 0;
  // Log scale so smaller sites still show a meaningful index vs. category leaders.
  const logT = Math.log10(traffic + 1);
  const logMax = Math.log10(maxTraffic + 1);
  return Math.min(100, Math.max(1, Math.round((logT / logMax) * 100)));
}

function toInterestFromVolumes(values: number[], maxVolume: number): number[] {
  return values.map((v) => (v <= 0 ? 0 : toInterest(v, maxVolume)));
}

function sliceTrendWindow<T>(dates: string[], rows: T[], months: number): { dates: string[]; rows: T[] } {
  if (dates.length <= months) return { dates, rows };
  const start = dates.length - months;
  return {
    dates: dates.slice(start),
    rows: rows.slice(start),
  };
}

function buildTrendSeries(
  sourceDates: string[],
  historyRows: MetricsHistoryRow[],
  keywordRows: KeywordVolumeRow[],
  reviewPeers: ReturnType<typeof getMarketReviewPeers>,
  peerHistories: Record<string, MetricsHistoryRow[]>,
  maxTraffic: number,
): MarketTrendSeries {
  const rawProductSeries = alignHistorySeries(sourceDates, historyRows);
  const rawKeyword = alignKeywordVolume(sourceDates, keywordRows);
  const keywordMax = Math.max(...rawKeyword, ...rawProductSeries, 1);

  const trendPeers = reviewPeers.map((peer) => {
    const raw = alignHistorySeries(sourceDates, peerHistories[peer.slug] ?? []);
    return {
      name: peer.name,
      color: peer.color,
      values: toInterestFromVolumes(raw, maxTraffic),
    };
  });

  const globalTrendMax = Math.max(
    ...rawProductSeries,
    ...trendPeers.flatMap((p) => p.values),
    ...toInterestFromVolumes(rawKeyword, keywordMax),
    1,
  );

  return {
    product: rawProductSeries.map((v) => toInterest(v, globalTrendMax)),
    categoryKeyword: toInterestFromVolumes(rawKeyword, keywordMax),
    peers: trendPeers.map((p) => ({
      ...p,
      values: p.values.map((v) => toInterest(v, globalTrendMax)),
    })),
  };
}

function monthLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-US', { month: 'short' });
}

function alignHistorySeries(sourceDates: string[], rows: MetricsHistoryRow[]): number[] {
  const byDate = Object.fromEntries(rows.map((r) => [r.date.slice(0, 10), r.org_traffic ?? 0]));
  return sourceDates.map((d) => byDate[d.slice(0, 10)] ?? 0);
}

function alignKeywordVolume(sourceDates: string[], rows: KeywordVolumeRow[]): number[] {
  const byDate = Object.fromEntries(rows.map((r) => [r.date.slice(0, 10), r.volume ?? 0]));
  return sourceDates.map((d) => byDate[d.slice(0, 10)] ?? 0);
}

function medalForRank(i: number): MarketRankItem['medal'] {
  if (i === 0) return 'gold';
  if (i === 1) return 'silver';
  if (i === 2) return 'bronze';
  return null;
}

async function ensureTrendData(vm: MarketDataViewModel, product: Product): Promise<MarketDataViewModel> {
  if (vm.trendSeries.product.length >= 2) return vm;
  const draft = await getAuraAiDraftMarketData(product);
  return {
    ...vm,
    trendMonths: draft.trendMonths,
    trendSeries: draft.trendSeries,
    trendMonths24: draft.trendMonths24,
    trendSeries24: draft.trendSeries24,
  };
}

export async function buildAuraAiMarketDataFromAhrefs(
  product: Product,
): Promise<{ vm: MarketDataViewModel; apiCallCount: number } | null> {
  const config = PRODUCT_ALTERNATIVES['aura-ai'];
  const sourceDomain = config?.marketSourceDomain ?? resolveReviewDomain(product.slug, product) ?? 'aura.ai';
  let apiCallCount = 0;

  const comparisonProducts = await loadComparisonProducts();
  const productBySlug = Object.fromEntries(comparisonProducts.map((p) => [p.slug, p]));
  productBySlug[product.slug] = product;

  const reviewPeers = getMarketReviewPeers(product.slug, productBySlug);
  const productPrice = parseReviewPrice(product);

  const peerPrices = reviewPeers
    .map((p) => parseReviewPrice(p.product))
    .filter((p): p is number => p != null && p > 0);
  const categoryAvgPrice =
    peerPrices.length > 0 ? peerPrices.reduce((a, b) => a + b, 0) / peerPrices.length : null;

  const valueEntries = [product, ...reviewPeers.map((p) => p.product)]
    .map((p) => {
      const price = parseReviewPrice(p);
      if (price == null || price <= 0) return null;
      return { slug: p.slug, ratio: p.overallScore / price };
    })
    .filter(Boolean) as Array<{ slug: string; ratio: number }>;
  valueEntries.sort((a, b) => b.ratio - a.ratio);
  const valueRankIdx = valueEntries.findIndex((e) => e.slug === product.slug);
  const valueRank = valueRankIdx >= 0 ? valueRankIdx + 1 : null;

  const { data: sourceMetrics, called: c1 } = await ahrefsGet<MetricsResponse>('/metrics', {
    target: sourceDomain,
    country: 'us',
    date: metricsDate(),
    select: 'org_traffic',
  });
  if (c1) apiCallCount++;

  const { data: sourceHistory, called: c2 } = await ahrefsGet<MetricsHistoryResponse>('/metrics-history', {
    target: sourceDomain,
    country: 'us',
    date_from: historyDateFrom24M(),
    date_to: metricsDate(),
    history_grouping: 'monthly',
    select: 'date,org_traffic',
  });
  if (c2) apiCallCount++;

  const peerHistories: Record<string, MetricsHistoryRow[]> = {};
  for (const peer of reviewPeers) {
    const { data, called } = await ahrefsGet<MetricsHistoryResponse>('/metrics-history', {
      target: peer.domain,
      country: 'us',
      date_from: historyDateFrom24M(),
      date_to: metricsDate(),
      history_grouping: 'monthly',
      select: 'date,org_traffic',
    });
    if (called) apiCallCount++;
    peerHistories[peer.slug] = data?.metrics ?? [];
  }

  const { data: keywordHistory, called: cKw } = await ahrefsKeywordsGet<KeywordVolumeResponse>(
    '/volume-history',
    {
      keyword: CATEGORY_KEYWORD,
      country: 'us',
      date_from: historyDateFrom24M(),
      date_to: metricsDate(),
    },
  );
  if (cKw) apiCallCount++;

  const { data: competitorsData, called: c5 } = await ahrefsGet<OrganicCompetitorsResponse>(
    '/organic-competitors',
    {
      target: sourceDomain,
      country: 'us',
      date: metricsDate(),
      date_compared: compareDate12M(),
      select: 'competitor_domain,traffic,traffic_prev',
      limit: 50,
      order_by: 'traffic:desc',
    },
  );
  if (c5) apiCallCount++;

  if (!c1 && !c2 && !c5 && !cKw) return null;

  const historyRows = sourceHistory?.metrics ?? [];
  const sourceDates =
    historyRows.length > 0
      ? historyRows.map((r) => r.date)
      : (keywordHistory?.metrics ?? []).map((r) => r.date);

  if (sourceDates.length < 2) {
    return null;
  }

  const trafficByDomain = Object.fromEntries(
    (competitorsData?.competitors ?? [])
      .filter((r) => r.competitor_domain)
      .map((r) => [r.competitor_domain!, { traffic: r.traffic ?? 0, prev: r.traffic_prev ?? null }]),
  );

  const sourceTraffic =
    sourceMetrics?.metrics?.org_traffic ??
    historyRows.at(-1)?.org_traffic ??
    trafficByDomain[sourceDomain]?.traffic ??
    0;

  const peerTrafficValues = reviewPeers.map((p) => {
    const hist = peerHistories[p.slug];
    const fromHist = hist?.at(-1)?.org_traffic;
    const fromOrganic = trafficByDomain[p.domain]?.traffic;
    return fromHist ?? fromOrganic ?? 0;
  });

  const allTraffics = [sourceTraffic, ...peerTrafficValues].filter((t) => t > 0);
  const maxTraffic = Math.max(...allTraffics, sourceTraffic, 1);
  const searchInterestValue = sourceTraffic > 0 ? toInterest(sourceTraffic, maxTraffic) : null;
  const searchInterest = ok(searchInterestValue);

  const firstMonthTraffic = historyRows[0]?.org_traffic ?? null;
  const sourceGrowth = trafficChangePct(sourceTraffic, firstMonthTraffic);

  const allDates = historyRows.map((r) => r.date);
  const dates12 = sliceTrendWindow(allDates, historyRows, 12).dates;
  const dates24 = allDates;

  const keywordMetrics = keywordHistory?.metrics ?? [];
  const trendSeries24 = buildTrendSeries(
    dates24,
    historyRows,
    keywordMetrics,
    reviewPeers,
    peerHistories,
    maxTraffic,
  );
  const trendSeries12 = buildTrendSeries(
    dates12,
    sliceTrendWindow(allDates, historyRows, 12).rows,
    sliceTrendWindow(allDates, keywordMetrics, 12).rows,
    reviewPeers,
    Object.fromEntries(
      reviewPeers.map((p) => [
        p.slug,
        sliceTrendWindow(allDates, peerHistories[p.slug] ?? [], 12).rows,
      ]),
    ),
    maxTraffic,
  );

  const rankCandidates = [
    { name: product.name, interest: searchInterest.status === 'ok' ? searchInterest.value : 0, highlight: true },
    ...reviewPeers.map((p, i) => ({
      name: p.name,
      interest: toInterest(peerTrafficValues[i], maxTraffic),
      highlight: false,
    })),
  ]
    .sort((a, b) => b.interest - a.interest)
    .slice(0, 5);

  const sourceRankIdx = rankCandidates.findIndex((item) => item.highlight);
  const marketRankValue = sourceRankIdx >= 0 ? sourceRankIdx + 1 : null;

  const rankList: MarketRankItem[] = rankCandidates.map((item, i) => ({
    name: item.name,
    interest: ok(item.interest),
    medal: medalForRank(i),
    highlight: item.highlight,
  }));

  const marketComparison: MarketCompetitorRow[] = [
    {
      name: product.name,
      slug: product.slug,
      interest: searchInterest,
      growth: sourceGrowth != null ? ok(sourceGrowth) : ok<number>(null),
      marketRank: ok(marketRankValue),
      highlight: true,
    },
    ...reviewPeers.map((p, i) => {
      const peerRankIdx = rankCandidates.findIndex((c) => c.name === p.name);
      return {
        name: p.name,
        slug: p.slug,
        interest: ok(toInterest(peerTrafficValues[i], maxTraffic)),
        growth: ok(
          trafficChangePct(
            peerTrafficValues[i],
            peerHistories[p.slug]?.[0]?.org_traffic ?? trafficByDomain[p.domain]?.prev ?? null,
          ),
        ),
        marketRank: ok(peerRankIdx >= 0 ? peerRankIdx + 1 : null),
      };
    }),
  ];

  const priceBars = [
    ...reviewPeers.map((p) => ({
      label: p.name,
      price: ok(parseReviewPrice(p.product)),
      color: p.scatterColor,
    })),
    {
      label: product.name,
      price: ok(productPrice),
      color: '#db2777',
      highlight: true,
    },
  ];

  const scatterPoints = [
    {
      name: product.name,
      price: ok(productPrice),
      score: ok(product.overallScore),
      color: '#db2777',
      highlight: true,
    },
    ...reviewPeers.map((p) => ({
      name: p.name,
      price: ok(parseReviewPrice(p.product)),
      score: ok(p.product.overallScore),
      color: p.scatterColor,
    })),
  ];

  let vm: MarketDataViewModel = {
    productSlug: product.slug,
    updatedLabel: config?.updatedLabel ?? 'August 2026',
    sources: ['Ahrefs (organic search traffic & keyword volume)', 'Our review & pricing database'],
    isDraft: false,
    categoryAvgPrice: ok(categoryAvgPrice),
    productPrice: ok(productPrice),
    valueRank: ok(valueRank),
    categoryPositionLabel: ok<string>(null),
    searchInterest,
    growth12m: sourceGrowth != null ? ok(sourceGrowth) : ok<number>(null),
    marketRank: ok(marketRankValue),
    totalTracked: ok(rankCandidates.length),
    rankList,
    marketComparison,
    trendMonths: dates12.map(monthLabel),
    trendSeries: trendSeries12,
    trendMonths24: dates24.map(monthLabel),
    trendSeries24,
    priceBars,
    scatterPoints,
    takeaways: [],
    expertAnalysis: [
      searchInterest.status === 'ok'
        ? `${product.name} shows an Ahrefs search interest index of ${searchInterest.value}/100 versus reviewed AI companion competitors (log-scaled organic traffic).`
        : `${product.name} has insufficient Ahrefs organic traffic data for a search interest index.`,
      `Category trend line uses Ahrefs search volume for "${CATEGORY_KEYWORD}". Pricing and value rank come from our review database.`,
    ],
  };

  vm = await ensureTrendData(vm, product);
  return { vm, apiCallCount: apiCallCount || AHREFS_MARKET_DATA_BASE_CALLS + reviewPeers.length };
}
