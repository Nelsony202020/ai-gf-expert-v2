import type { Product } from '../../data/products';
import { getAuraAiDraftMarketData } from './aura-ai-draft';
import { buildAuraAiMarketDataFromAhrefs } from './buildFromAhrefs';
import { marketOk } from './format';
import type { MarketDataViewModel } from './types';

export async function loadMarketDataViewModel(product: Product): Promise<MarketDataViewModel> {
  if (product.slug === 'aura-ai') {
    const live = await buildAuraAiMarketDataFromAhrefs(product);
    if (live) return live.vm;
    return await getAuraAiDraftMarketData(product);
  }

  const st = product.overview.searchTrends;
  const hasInterest = st.currentInterest > 0 || st.popularityRank > 0;

  if (!hasInterest) {
    return emptyMarketData(product);
  }

  return await getAuraAiDraftMarketData(product);
}

function emptyMarketData(product: Product): MarketDataViewModel {
  const unavailable = marketOk<number>(null);
  return {
    productSlug: product.slug,
    updatedLabel: 'Data unavailable',
    sources: ['Our review & pricing database'],
    isDraft: false,
    categoryAvgPrice: unavailable,
    productPrice: unavailable,
    valueRank: unavailable,
    categoryPositionLabel: marketOk<string>(null),
    searchInterest: unavailable,
    growth12m: unavailable,
    marketRank: unavailable,
    totalTracked: unavailable,
    rankList: [],
    marketComparison: [],
    trendMonths: [],
    trendSeries: { product: [], categoryKeyword: [], peers: [] },
    trendMonths24: [],
    trendSeries24: { product: [], categoryKeyword: [], peers: [] },
    priceBars: [],
    scatterPoints: [],
    takeaways: [],
    expertAnalysis: ['Market data is not yet available for this product.'],
  };
}

/** Ahrefs API calls per Market Data tab build when the API key is set (aura-ai). */
export { AHREFS_MARKET_DATA_BASE_CALLS as AHREFS_MARKET_DATA_CALLS_PER_REFRESH } from '../ahrefs/client';
