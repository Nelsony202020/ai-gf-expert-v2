import type { Product } from '../../data/products';
import {
  ALTERNATIVE_BEAT_THRESHOLD,
  PRODUCT_ALTERNATIVES,
  COMPARISON_CATEGORY_KEYS,
  COMPARISON_CATEGORY_LABELS,
  type AlternativeEditorial,
} from '../../data/product-alternatives-config';
import { loadComparisonProducts } from '../content/comparisonProducts';
import {
  beatsThreshold,
  categoryScoreMap,
  computeSimilarityScore,
  sourceBeatsThreshold,
} from './similarity';
import { popularitySnapshotFromProducts, resolveAlternativeProduct } from './profiles';
import {
  getExternalMarketCompetitors,
  getMarketTrafficChart,
  getMarketMetricsTable,
  type MarketCompetitorRow,
  type MarketTrafficColumn,
} from './external-market-data';
import { fetchAhrefsMarketData } from './ahrefs';
import { syncMarketSnapshots, type MarketSnapshotMonth } from './market-snapshots';
import { buildRadarChartModel, type RadarChartModel } from './radar-chart';
import {
  buildBiggestDifferences,
  compactPeerBullets,
  type BiggestDifferencesModel,
  type CompactPeerBullets,
} from './comparison-insights';
import {
  buildComparisonTableRows,
  buildComparisonTableTakeaway,
  type ComparisonTableRow,
  type ComparisonTableTakeaway,
} from './comparison-table';

export const DEFAULT_ALTERNATIVE_DISPLAY_COUNT = 3;
export const MAX_ALTERNATIVE_DISPLAY_COUNT = 5;

export interface QuickPickView {
  label: string;
  peer: AlternativePeerView;
}

export type SummaryStatTone = 'default' | 'better' | 'worse' | 'neutral';

export interface SummaryStatRow {
  label: string;
  value: string;
  unit?: string;
  valueTone: SummaryStatTone;
  sourceValue?: string;
  sourceShortName?: string;
}

export interface SummaryFeatured {
  productName: string;
  bestFor: string;
  similarity: number;
  score: number;
  price: string;
  thumb?: string;
  reviewUrl: string | null;
}

export interface AlternativePeerView {
  product: Product;
  similarity: number;
  editorial: AlternativeEditorial;
  categoryScores: Record<string, number | null>;
  priceMonthly: number | null;
  reviewUrl: string | null;
  winsOverSource: Array<{ label: string; peerScore: number; sourceScore: number }>;
  sourceWinsOver: Array<{ label: string; sourceScore: number; peerScore: number }>;
}

export interface WinLossRow {
  categoryLabel: string;
  leaderName: string;
  leaderScore: number;
  trailingName: string;
  trailingScore: number;
}

export interface AlternativesViewModel {
  source: Product;
  updatedLabel: string;
  intro: string;
  summaryFeatured: SummaryFeatured | null;
  summaryListStats: SummaryStatRow[];
  appsCompared: number;
  peers: AlternativePeerView[];
  testingPeers: AlternativePeerView[];
  quickPicks: QuickPickView[];
  tablePeers: AlternativePeerView[];
  bestOverall: AlternativePeerView | null;
  otherPeers: AlternativePeerView[];
  alternativeWins: WinLossRow[];
  sourceWins: WinLossRow[];
  popularity: Array<{ name: string; slug: string; searchInterest: number | null; highlight?: boolean }>;
  showPopularity: boolean;
  popularitySource: string;
  marketCompetitors: MarketCompetitorRow[];
  marketTrafficChart: MarketTrafficColumn[];
  marketMetricsTable: MarketCompetitorRow[];
  marketSnapshotMonths: MarketSnapshotMonth[];
  marketSnapshotDefaultKey: string;
  marketDataSource: 'ahrefs' | 'mock' | 'unavailable';
  marketSourceDomain: string | null;
  radarChart: RadarChartModel;
  biggestDifferences: BiggestDifferencesModel;
  compactBullets: Record<string, CompactPeerBullets>;
  comparisonTableRows: ComparisonTableRow[];
  comparisonTableExtraRows: ComparisonTableRow[];
  comparisonTableTakeaway: ComparisonTableTakeaway | null;
  stickWithSourceIf: string;
  stickWithDecisionHook: string;
  stickWithDecisionIcon: string;
}

function buildWinRows(
  source: Product,
  sourceScores: Record<string, number | null>,
  peers: AlternativePeerView[],
): { alternativeWins: WinLossRow[]; sourceWins: WinLossRow[] } {
  const alternativeWins: WinLossRow[] = [];
  const sourceWins: WinLossRow[] = [];

  for (const key of COMPARISON_CATEGORY_KEYS) {
    const src = sourceScores[key];
    if (src == null) continue;

    let bestPeer: AlternativePeerView | null = null;
    let bestPeerScore = -Infinity;
    for (const peer of peers) {
      const ps = peer.categoryScores[key];
      if (ps == null) continue;
      if (ps > bestPeerScore) {
        bestPeerScore = ps;
        bestPeer = peer;
      }
    }
    if (!bestPeer || bestPeerScore === -Infinity) continue;

    if (beatsThreshold(src, bestPeerScore, ALTERNATIVE_BEAT_THRESHOLD)) {
      alternativeWins.push({
        categoryLabel: COMPARISON_CATEGORY_LABELS[key],
        leaderName: bestPeer.product.name,
        leaderScore: bestPeerScore,
        trailingName: source.name,
        trailingScore: src,
      });
    } else if (sourceBeatsThreshold(src, bestPeerScore, ALTERNATIVE_BEAT_THRESHOLD)) {
      sourceWins.push({
        categoryLabel: COMPARISON_CATEGORY_LABELS[key],
        leaderName: source.name,
        leaderScore: src,
        trailingName: bestPeer.product.name,
        trailingScore: bestPeerScore,
      });
    }
  }

  return {
    alternativeWins: alternativeWins.slice(0, 5),
    sourceWins: sourceWins.slice(0, 5),
  };
}

function peerCategoryWins(
  sourceScores: Record<string, number | null>,
  peerScores: Record<string, number | null>,
): Array<{ label: string; peerScore: number; sourceScore: number }> {
  const out: Array<{ label: string; peerScore: number; sourceScore: number }> = [];
  for (const key of COMPARISON_CATEGORY_KEYS) {
    const src = sourceScores[key];
    const tgt = peerScores[key];
    if (!beatsThreshold(src, tgt, ALTERNATIVE_BEAT_THRESHOLD) || tgt == null || src == null) continue;
    out.push({
      label: COMPARISON_CATEGORY_LABELS[key],
      peerScore: tgt,
      sourceScore: src,
    });
  }
  return out.slice(0, 4);
}

function sourceCategoryWins(
  sourceScores: Record<string, number | null>,
  peerScores: Record<string, number | null>,
): Array<{ label: string; sourceScore: number; peerScore: number }> {
  const out: Array<{ label: string; sourceScore: number; peerScore: number }> = [];
  for (const key of COMPARISON_CATEGORY_KEYS) {
    const src = sourceScores[key];
    const tgt = peerScores[key];
    if (!sourceBeatsThreshold(src, tgt, ALTERNATIVE_BEAT_THRESHOLD) || tgt == null || src == null) continue;
    out.push({
      label: COMPARISON_CATEGORY_LABELS[key],
      sourceScore: src,
      peerScore: tgt,
    });
  }
  return out.slice(0, 4);
}

function formatPeerPrice(peer: AlternativePeerView): string {
  if (peer.priceMonthly != null) return `$${peer.priceMonthly.toFixed(2)}`;
  const raw = peer.product.overview.highlights.startingPrice;
  return raw.replace(/\s*\/\s*mo(nth)?/i, '').trim() || '—';
}

function productThumb(p: Product): string | undefined {
  return p.logo ?? p.gallery[0]?.full ?? p.gallery[0]?.thumb;
}

function buildSummaryData(
  source: Product,
  sourceScores: Record<string, number | null>,
  peers: AlternativePeerView[],
  config: (typeof PRODUCT_ALTERNATIVES)[string],
): { featured: SummaryFeatured | null; listStats: SummaryStatRow[] } {
  const peerBySlug = Object.fromEntries(peers.map((p) => [p.product.slug, p]));
  const closest = peers[0];
  const sourceShortName = source.name.split(/\s+/)[0] ?? source.name;

  const featured: SummaryFeatured | null = closest
    ? {
        productName: closest.product.name,
        bestFor: closest.editorial.bestFor,
        similarity: closest.similarity,
        score: closest.product.overallScore,
        price: formatPeerPrice(closest),
        thumb: productThumb(closest.product),
        reviewUrl: closest.reviewUrl,
      }
    : null;

  function sourcePrice(): number | null {
    const match = source.overview.highlights.startingPrice.match(/\$([\d.]+)/);
    return match ? Number(match[1]) : null;
  }

  function scoreTone(peerVal: number, sourceVal: number): SummaryStatTone {
    const diff = peerVal - sourceVal;
    if (Math.abs(diff) < 0.05) return 'neutral';
    return diff > 0 ? 'better' : 'worse';
  }

  function priceTone(peerVal: number, sourceVal: number): SummaryStatTone {
    const diff = peerVal - sourceVal;
    if (Math.abs(diff) < 0.05) return 'neutral';
    return diff < 0 ? 'better' : 'worse';
  }

  const listStats: SummaryStatRow[] = [];
  const slots = config.summarySlots ?? [];
  for (const slot of slots) {
    const peer = peerBySlug[slot.slug];
    if (!peer) continue;

    const metric = slot.compareMetric ?? (slot.valueKind === 'price' ? 'price' : 'overall');

    if (metric === 'price') {
      const peerPrice = peer.priceMonthly;
      const srcPrice = sourcePrice();
      const value = formatPeerPrice(peer);
      const sourceValue = srcPrice != null ? `$${srcPrice.toFixed(2)}` : undefined;
      const valueTone =
        peerPrice != null && srcPrice != null ? priceTone(peerPrice, srcPrice) : 'default';

      listStats.push({
        label: slot.label,
        value,
        unit: '/mo',
        valueTone,
        sourceValue,
        sourceShortName,
      });
      continue;
    }

    const peerScore =
      metric === 'chat'
        ? peer.categoryScores.chat
        : peer.product.overallScore;
    const sourceScore =
      metric === 'chat' ? sourceScores.chat : source.overallScore;

    const value =
      peerScore != null ? peerScore.toFixed(1) : peer.product.overallScore.toFixed(1);
    const sourceValue = sourceScore != null ? sourceScore.toFixed(1) : undefined;
    const valueTone =
      peerScore != null && sourceScore != null ? scoreTone(peerScore, sourceScore) : 'default';

    listStats.push({
      label: slot.label,
      value,
      valueTone,
      sourceValue,
      sourceShortName,
    });
  }

  return { featured, listStats: listStats.slice(0, 3) };
}

async function loadMarketData(
  productSlug: string,
  sourceName: string,
  config: (typeof PRODUCT_ALTERNATIVES)[string],
): Promise<{
  marketCompetitors: MarketCompetitorRow[];
  marketTrafficChart: MarketTrafficColumn[];
  marketMetricsTable: MarketCompetitorRow[];
  marketSnapshotMonths: MarketSnapshotMonth[];
  marketSnapshotDefaultKey: string;
  marketDataSource: 'ahrefs' | 'mock' | 'unavailable';
  marketSourceDomain: string | null;
}> {
  const sourceDomain = config.marketSourceDomain ?? null;
  let metricsTable: MarketCompetitorRow[] = [];
  let marketDataSource: 'ahrefs' | 'mock' | 'unavailable' = 'mock';
  let marketCompetitors: MarketCompetitorRow[] = [];
  let marketTrafficChart: MarketTrafficColumn[] = [];

  if (sourceDomain) {
    const allowLive =
      !import.meta.env.DEV || process.env.AHREFS_LIVE_IN_DEV === '1';
    if (allowLive) {
      const live = await fetchAhrefsMarketData(sourceDomain, sourceName);
      if (live) {
        marketCompetitors = live.competitors;
        marketTrafficChart = live.trafficChart;
        metricsTable = live.metricsTable;
        marketDataSource = 'ahrefs';
      }
    }
  }

  if (metricsTable.length === 0) {
    marketCompetitors = getExternalMarketCompetitors(productSlug);
    marketTrafficChart = getMarketTrafficChart(productSlug);
    metricsTable = getMarketMetricsTable(productSlug);
    marketDataSource = 'mock';
  }

  const { months, defaultKey } = syncMarketSnapshots(productSlug, metricsTable);

  return {
    marketCompetitors,
    marketTrafficChart,
    marketMetricsTable: metricsTable,
    marketSnapshotMonths: months,
    marketSnapshotDefaultKey: defaultKey,
    marketDataSource,
    marketSourceDomain: sourceDomain,
  };
}

export async function loadAlternativesViewModel(source: Product): Promise<AlternativesViewModel | null> {
  const config = PRODUCT_ALTERNATIVES[source.slug];
  if (!config) return null;

  const comparisonProducts = await loadComparisonProducts();
  const sourceScores = categoryScoreMap(source);

  const peers: AlternativePeerView[] = [];
  for (const slug of config.slugs) {
    const product = await resolveAlternativeProduct(slug, comparisonProducts);
    if (!product) continue;

    const categoryScores = categoryScoreMap(product);
    const editorialBase = config.editorials[slug];
    if (!editorialBase) continue;

    const priceMatch = product.overview.highlights.startingPrice.match(/\$([\d.]+)/);
    peers.push({
      product,
      similarity: computeSimilarityScore(source, categoryScores),
      editorial: { slug, ...editorialBase },
      categoryScores,
      priceMonthly: priceMatch ? Number(priceMatch[1]) : null,
      reviewUrl: product.slug ? `/reviews/${product.slug}/` : null,
      winsOverSource: peerCategoryWins(sourceScores, categoryScores),
      sourceWinsOver: sourceCategoryWins(sourceScores, categoryScores),
    });
  }

  peers.sort((a, b) => b.similarity - a.similarity);

  const peerBySlug = Object.fromEntries(peers.map((p) => [p.product.slug, p]));
  const configuredSlugs = config.tablePeerSlugs ?? peers.slice(0, DEFAULT_ALTERNATIVE_DISPLAY_COUNT).map((p) => p.product.slug);
  const displayPeers = configuredSlugs
    .map((slug) => peerBySlug[slug])
    .filter(Boolean)
    .slice(0, DEFAULT_ALTERNATIVE_DISPLAY_COUNT) as AlternativePeerView[];
  const displaySlugSet = new Set(displayPeers.map((p) => p.product.slug));
  const expandablePeers = peers
    .filter((p) => !displaySlugSet.has(p.product.slug))
    .slice(0, MAX_ALTERNATIVE_DISPLAY_COUNT - DEFAULT_ALTERNATIVE_DISPLAY_COUNT);
  const testingPeers = displayPeers;
  const tablePeers = displayPeers;
  const quickPicks = config.quickPicks
    .map((slot) => {
      const peer = peerBySlug[slot.slug];
      return peer ? { label: slot.label, peer } : null;
    })
    .filter(Boolean) as QuickPickView[];

  const bestOverall = peers[0] ?? null;
  const otherPeers = peers.slice(1);
  const { alternativeWins, sourceWins } = buildWinRows(source, sourceScores, peers);

  const popularity = popularitySnapshotFromProducts(source, peers.map((p) => p.product));
  const popularityWithData = popularity.filter((p) => p.searchInterest != null && p.searchInterest > 0);
  const { featured, listStats } = buildSummaryData(source, sourceScores, peers, config);
  const marketData = await loadMarketData(source.slug, source.name, config);
  const radarChart = buildRadarChartModel(
    source.name,
    sourceScores,
    tablePeers.map((p) => ({ name: p.product.name, scores: p.categoryScores })),
  );
  const biggestDifferences = buildBiggestDifferences(source, sourceScores, tablePeers);
  const compactBullets = Object.fromEntries(
    displayPeers.map((p) => [p.product.slug, compactPeerBullets(p)]),
  );
  const comparisonTableRows = buildComparisonTableRows(source, sourceScores, tablePeers);
  const comparisonTableExtraRows = buildComparisonTableRows(source, sourceScores, expandablePeers).slice(1);
  const comparisonTableTakeaway = buildComparisonTableTakeaway(source, sourceScores, tablePeers[0] ?? null);

  return {
    source,
    updatedLabel: config.updatedLabel,
    intro: `We compared ${source.name} with the closest AI companion apps we've tested. The alternatives below are based on our hands-on scores, pricing, features, and overall similarity.`,
    summaryFeatured: featured,
    summaryListStats: listStats,
    appsCompared: peers.length,
    peers,
    testingPeers,
    quickPicks,
    tablePeers,
    bestOverall,
    otherPeers,
    alternativeWins,
    sourceWins,
    popularity,
    showPopularity: popularityWithData.length >= 3,
    popularitySource: 'Google Trends relative search interest',
    marketCompetitors: marketData.marketCompetitors,
    marketTrafficChart: marketData.marketTrafficChart,
    marketMetricsTable: marketData.marketMetricsTable,
    marketSnapshotMonths: marketData.marketSnapshotMonths,
    marketSnapshotDefaultKey: marketData.marketSnapshotDefaultKey,
    marketDataSource: marketData.marketDataSource,
    marketSourceDomain: marketData.marketSourceDomain,
    radarChart,
    biggestDifferences,
    compactBullets,
    comparisonTableRows,
    comparisonTableExtraRows,
    comparisonTableTakeaway,
    stickWithSourceIf:
      'You prioritize chat realism and video generation in one app, and you are comfortable with slower image generation speeds.',
    stickWithDecisionHook: config.stickWithDecisionHook,
    stickWithDecisionIcon: config.stickWithDecisionIcon,
  };
}

export { COMPARISON_CATEGORY_KEYS, COMPARISON_CATEGORY_LABELS };
