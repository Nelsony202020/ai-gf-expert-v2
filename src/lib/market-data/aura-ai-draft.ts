import type { Product } from '../../data/products';
import { marketOk, type MarketValue } from './format';
import type { MarketDataViewModel } from './types';

const ok = marketOk;

/** Draft/test market dataset for Aura AI — replace with DB/API when available. */
export function getAuraAiDraftMarketData(product: Product): MarketDataViewModel {
  const st = product.overview.searchTrends;
  const productPrice = ok(12.99);
  const categoryAvgPrice = ok(15.8);
  const valueRank = ok(2);
  const categoryPositionLabel = ok('Top 15%');

  return {
    productSlug: product.slug,
    updatedLabel: 'August 2026',
    sources: [
      'Our review & pricing database',
      'Google Trends (search interest)',
      'Draft competitor benchmarks (local test)',
    ],
    isDraft: true,
    categoryAvgPrice,
    productPrice,
    valueRank,
    categoryPositionLabel,
    searchInterest: ok(st.currentInterest),
    growth12m: ok(st.changePercent),
    marketRank: ok(st.popularityRank),
    totalTracked: ok(st.totalReviewed),
    rankList: [
      { name: 'Candy AI', interest: ok(85), medal: 'gold' },
      { name: 'Kindroid', interest: ok(74), medal: 'silver' },
      { name: product.name, interest: ok(st.currentInterest), medal: 'bronze', highlight: true },
      { name: 'Nastia AI', interest: ok(61), medal: null },
      { name: 'DreamGF', interest: ok(54), medal: null },
    ],
    marketComparison: [
      {
        name: product.name,
        slug: product.slug,
        interest: ok(st.currentInterest),
        growth: ok(st.changePercent),
        marketRank: ok(3),
        highlight: true,
      },
      { name: 'Candy AI', slug: 'candy-ai', interest: ok(85), growth: ok(12), marketRank: ok(1) },
      { name: 'Kindroid', slug: 'kindroid', interest: ok(68), growth: ok(-4), marketRank: ok(2) },
      { name: 'Nastia AI', slug: 'nastia-ai', interest: ok(61), growth: ok(6), marketRank: ok(4) },
      { name: 'DreamGF', slug: 'dreamgf', interest: ok(54), growth: ok(-8), marketRank: ok(5) },
    ],
    trendMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    trendSeries: {
      product: [58, 60, 62, 61, 64, 66, 67, 68, 69, 70, 71, st.currentInterest],
      candy: [72, 74, 76, 75, 78, 80, 81, 82, 83, 84, 84, 85],
      kindroid: [62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51],
      avg: [60, 61, 62, 62, 63, 64, 64, 65, 65, 66, 66, 67],
    },
    priceBars: [
      { label: 'Candy AI', price: ok(19.99), color: '#a855f7' },
      { label: 'Kindroid', price: ok(13.99), color: '#3b82f6' },
      { label: product.name, price: productPrice, color: '#db2777', highlight: true },
      { label: 'Nastia AI', price: ok(14.99), color: '#f97316' },
      { label: 'DreamGF', price: ok(9.99), color: '#22c55e' },
    ],
    scatterPoints: [
      {
        name: product.name,
        price: productPrice,
        score: ok(product.overallScore),
        color: '#db2777',
        highlight: true,
      },
      { name: 'Candy AI', price: ok(19.99), score: ok(8.4), color: '#a855f7' },
      { name: 'Kindroid', price: ok(13.99), score: ok(8.1), color: '#3b82f6' },
      { name: 'Nastia AI', price: ok(14.99), score: ok(7.9), color: '#f97316' },
      { name: 'DreamGF', price: ok(9.99), score: ok(7.4), color: '#22c55e' },
    ],
    takeaways: [
      {
        icon: 'trending_up',
        tone: 'pink',
        text: 'Search interest rose 18% over 12 months — above the category average on Google Trends.',
      },
      {
        icon: 'sell',
        tone: 'green',
        text: 'Monthly pricing ($12.99) is about 18% below the tracked category average ($15.80).',
      },
      {
        icon: 'emoji_events',
        tone: 'amber',
        text: 'Aura AI ranks #3 among tracked apps by relative search interest.',
      },
      {
        icon: 'star',
        tone: 'purple',
        text: 'Its score-to-price ratio places it #2 for value among the top five tracked competitors.',
      },
      {
        icon: 'groups',
        tone: 'blue',
        text: 'Search popularity remains below Candy AI and Kindroid — interest ≠ test performance.',
      },
    ],
    expertAnalysis: [
      `${product.name} is priced below the category average while maintaining an above-average testing score in our database, which supports a strong value position on paper. Search interest is still lower than Candy AI and Kindroid, so it appears less established in brand search volume despite competitive test results.`,
      `These market signals describe visibility and pricing context only — they do not change our hands-on ratings. If popularity matters to you, Candy AI leads relative search interest; if value per dollar matters more, the price-position data here aligns with our testing.`,
    ],
  };
}

export function unwrapPrice(v: MarketValue<number>, fallback = 0): number {
  return v.status === 'ok' ? v.value : fallback;
}
