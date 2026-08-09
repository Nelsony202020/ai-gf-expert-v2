import type { Product } from '../../data/products';
import { getAuraAiDraftMarketData } from './aura-ai-draft';
import { marketOk } from './format';
import type { MarketDataViewModel } from './types';

export async function loadMarketDataViewModel(product: Product): Promise<MarketDataViewModel> {
  if (product.slug === 'aura-ai') {
    return getAuraAiDraftMarketData(product);
  }

  const st = product.overview.searchTrends;
  const hasInterest = st.currentInterest > 0 || st.popularityRank > 0;

  if (!hasInterest) {
    return emptyMarketData(product);
  }

  return getAuraAiDraftMarketData(product);
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
    trendSeries: { product: [], candy: [], kindroid: [], avg: [] },
    priceBars: [],
    scatterPoints: [],
    takeaways: [],
    expertAnalysis: ['Market data is not yet available for this product.'],
  };
}
