import type { Product } from '../../data/products';
import { marketOk, type MarketValue } from './format';
import { getMarketReviewPeers, parseReviewPrice } from './review-peers';
import type { MarketDataViewModel } from './types';
import { loadComparisonProducts } from '../content/comparisonProducts';

const ok = marketOk;

/** Draft/test market dataset — used when Ahrefs is unavailable or returns insufficient history. */
export async function getAuraAiDraftMarketData(product: Product): Promise<MarketDataViewModel> {
  const st = product.overview.searchTrends;
  const comparisonProducts = await loadComparisonProducts();
  const productBySlug = Object.fromEntries(comparisonProducts.map((p) => [p.slug, p]));
  productBySlug[product.slug] = product;

  const reviewPeers = getMarketReviewPeers(product.slug, productBySlug);
  const productPrice = parseReviewPrice(product) ?? 12.99;

  const peerPrices = reviewPeers
    .map((p) => parseReviewPrice(p.product))
    .filter((p): p is number => p != null && p > 0);
  const categoryAvgPrice =
    peerPrices.length > 0 ? peerPrices.reduce((a, b) => a + b, 0) / peerPrices.length : 15.8;

  const valueEntries = [product, ...reviewPeers.map((p) => p.product)]
    .map((p) => {
      const price = parseReviewPrice(p);
      if (price == null || price <= 0) return null;
      return { slug: p.slug, ratio: p.overallScore / price };
    })
    .filter(Boolean) as Array<{ slug: string; ratio: number }>;
  valueEntries.sort((a, b) => b.ratio - a.ratio);
  const valueRank = valueEntries.findIndex((e) => e.slug === product.slug) + 1;

  const peerInterests: Record<string, number> = {
    'candy-ai': 85,
    'ourdream-ai': 68,
    girlfriendgpt: 61,
  };

  const rankCandidates = [
    { name: product.name, interest: st.currentInterest, highlight: true },
    ...reviewPeers.map((p) => ({
      name: p.name,
      interest: peerInterests[p.slug] ?? 55,
      highlight: false,
    })),
  ].sort((a, b) => b.interest - a.interest);

  return {
    productSlug: product.slug,
    updatedLabel: 'August 2026',
    sources: ['Our review & pricing database', 'Draft benchmarks (Ahrefs unavailable)'],
    isDraft: true,
    categoryAvgPrice: ok(categoryAvgPrice),
    productPrice: ok(productPrice),
    valueRank: ok(valueRank > 0 ? valueRank : null),
    categoryPositionLabel: ok<string>(null),
    searchInterest: ok(st.currentInterest),
    growth12m: ok(st.changePercent),
    marketRank: ok<number>(null),
    totalTracked: ok<number>(null),
    rankList: rankCandidates.slice(0, 5).map((item, i) => ({
      name: item.name,
      interest: ok(item.interest),
      medal: i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : null,
      highlight: item.highlight,
    })),
    marketComparison: [
      {
        name: product.name,
        slug: product.slug,
        interest: ok(st.currentInterest),
        growth: ok(st.changePercent),
        marketRank: ok<number>(null),
        highlight: true,
      },
      ...reviewPeers.map((p) => ({
        name: p.name,
        slug: p.slug,
        interest: ok(peerInterests[p.slug] ?? 55),
        growth: ok(p.slug === 'candy-ai' ? 12 : p.slug === 'ourdream-ai' ? -4 : 6),
        marketRank: ok<number>(null),
      })),
    ],
    trendMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    trendSeries: {
      product: [58, 60, 62, 61, 64, 66, 67, 68, 69, 70, 71, st.currentInterest],
      categoryKeyword: [62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
      peers: reviewPeers.map((p) => ({
        name: p.name,
        color: p.color,
        values:
          p.slug === 'candy-ai'
            ? [72, 74, 76, 75, 78, 80, 81, 82, 83, 84, 84, 85]
            : p.slug === 'ourdream-ai'
              ? [52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63]
              : [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, peerInterests[p.slug] ?? 55],
      })),
    },
    trendMonths24: [
      'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'Jan', 'Feb',
    ],
    trendSeries24: {
      product: [52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 64, 66, 67, 68, 67, 68, 69, 70, 71, 71, st.currentInterest],
      categoryKeyword: [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81],
      peers: reviewPeers.map((p) => ({
        name: p.name,
        color: p.color,
        values:
          p.slug === 'candy-ai'
            ? [65, 67, 68, 70, 71, 72, 74, 75, 76, 77, 78, 79, 80, 79, 81, 82, 83, 82, 83, 84, 84, 85, 85, 85]
            : p.slug === 'ourdream-ai'
              ? [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 60, 61, 62, 62, 63, 63, 63]
              : [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 55, 56, 57, 57, 58, 58, peerInterests[p.slug] ?? 55],
      })),
    },
    priceBars: [
      ...reviewPeers.map((p) => ({
        label: p.name,
        price: ok(parseReviewPrice(p.product)),
        color: p.scatterColor,
      })),
      { label: product.name, price: ok(productPrice), color: '#db2777', highlight: true },
    ],
    scatterPoints: [
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
    ],
    takeaways: [
      {
        icon: 'trending_up',
        tone: 'pink',
        text: `Search interest index ${st.currentInterest}/100 with ${st.changePercent >= 0 ? '+' : ''}${st.changePercent}% 12-month change (draft data).`,
      },
      {
        icon: 'sell',
        tone: 'green',
        text: `Monthly pricing ($${productPrice.toFixed(2)}) vs. category average ($${categoryAvgPrice.toFixed(2)}).`,
      },
    ],
    expertAnalysis: [
      `${product.name} market data uses draft benchmarks when Ahrefs is unavailable. Connect AHREFS_API_KEY for live organic traffic and keyword trends.`,
    ],
  };
}

export function unwrapPrice(v: MarketValue<number>, fallback = 0): number {
  return v.status === 'ok' ? v.value : fallback;
}
