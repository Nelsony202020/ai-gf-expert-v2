import type { MarketValue } from './format';

export interface MarketTrendSeries {
  product: number[];
  /** Ahrefs volume index for keyword "ai girlfriend" (0–100). */
  categoryKeyword: number[];
  peers: Array<{ name: string; color: string; values: number[] }>;
}

export interface MarketCompetitorRow {
  name: string;
  slug?: string;
  interest: MarketValue<number>;
  growth: MarketValue<number>;
  marketRank: MarketValue<number>;
  highlight?: boolean;
}

export interface MarketRankItem {
  name: string;
  interest: MarketValue<number>;
  medal: 'gold' | 'silver' | 'bronze' | null;
  highlight?: boolean;
}

export interface MarketDataViewModel {
  productSlug: string;
  updatedLabel: string;
  sources: string[];
  isDraft: boolean;
  categoryAvgPrice: MarketValue<number>;
  productPrice: MarketValue<number>;
  valueRank: MarketValue<number>;
  categoryPositionLabel: MarketValue<string>;
  searchInterest: MarketValue<number>;
  growth12m: MarketValue<number>;
  marketRank: MarketValue<number>;
  totalTracked: MarketValue<number>;
  rankList: MarketRankItem[];
  marketComparison: MarketCompetitorRow[];
  trendMonths: string[];
  trendSeries: MarketTrendSeries;
  /** Same shape as trendSeries but 24 months of Ahrefs history. */
  trendMonths24: string[];
  trendSeries24: MarketTrendSeries;
  priceBars: Array<{ label: string; price: MarketValue<number>; color: string; highlight?: boolean }>;
  scatterPoints: Array<{ name: string; price: MarketValue<number>; score: MarketValue<number>; color: string; highlight?: boolean }>;
  takeaways: Array<{ icon: string; tone: string; text: string }>;
  expertAnalysis: string[];
}
