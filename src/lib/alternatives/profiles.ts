import type { Product } from '../../data/products';
import { fileAiGirlfriendRoundup } from '../../data/roundups/ai-girlfriend';
import { ROUNDUP_CATEGORY_KEYS } from '../../data/roundups/ai-girlfriend';

/** Fallback profiles when a slug is not yet published in the DB. */
const FALLBACK_PROFILES: Record<
  string,
  {
    name: string;
    overallScore: number;
    priceMonthly: number;
    searchInterest: number;
    galleryThumb?: string;
    reviewUrl?: string;
    affiliateUrl?: string;
    categoryScores: number[];
  }
> = {
  'ourdream-ai': {
    name: 'OurDream AI',
    overallScore: 8.8,
    priceMonthly: 19.99,
    searchInterest: 70,
    reviewUrl: '/reviews/ourdream-ai/',
    affiliateUrl: 'https://example.com/go/ourdream-ai',
    categoryScores: [8.5, 8.6, 8.7, 8.8, 8.9, 9.0, 8.4, 8.0],
  },
  'candy-ai': {
    name: 'Candy AI',
    overallScore: 9.3,
    priceMonthly: 12.99,
    searchInterest: 85,
    reviewUrl: '/reviews/candy-ai/',
    affiliateUrl: 'https://example.com/go/candy-ai',
    categoryScores: [9.3, 9.1, 9.4, 9.0, 9.2, 8.6, 8.8, 8.5],
  },
  kindroid: {
    name: 'Kindroid',
    overallScore: 8.1,
    priceMonthly: 13.99,
    searchInterest: 68,
    categoryScores: [8.0, 8.2, 8.9, 8.5, 7.8, 7.2, 8.4, 8.0],
  },
  girlfriendgpt: {
    name: 'GirlfriendGPT',
    overallScore: 7.7,
    priceMonthly: 15.0,
    searchInterest: 58,
    reviewUrl: '/reviews/girlfriendgpt/',
    affiliateUrl: 'https://example.com/go/girlfriendgpt',
    categoryScores: [8.0, 7.8, 8.5, 8.2, 7.5, 6.8, 7.8, 7.6],
  },
  'nectar-ai': {
    name: 'Nectar AI',
    overallScore: 7.6,
    priceMonthly: 14.99,
    searchInterest: 55,
    categoryScores: [7.5, 7.4, 7.8, 7.6, 7.4, 6.9, 7.5, 7.3],
  },
};

function scoresToMap(values: number[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  ROUNDUP_CATEGORY_KEYS.forEach((key, i) => {
    out[key] = values[i] ?? null;
  });
  return out;
}

function productFromFallback(slug: string): Product | null {
  const fb = FALLBACK_PROFILES[slug];
  if (!fb) return null;

  const pick = fileAiGirlfriendRoundup.picks.find((p) => p.slug === slug);

  return {
    slug,
    name: fb.name,
    tagline: '',
    reviewedDate: '',
    modifiedDate: '',
    methodology: '',
    authors: [],
    websiteUrl: '#',
    affiliateUrl: fb.affiliateUrl ?? pick?.affiliateUrl ?? '#',
    gallery: pick?.gallery ?? [],
    overallScore: fb.overallScore,
    overallSummary: pick?.overallSummary ?? '',
    ourTake: pick?.ourTake ?? '',
    safetyAudit: [],
    featureSpecs: pick?.specs?.map((s) => ({ name: s.label, value: s.value, icon: 'info', available: true })) ?? [],
    categories: ROUNDUP_CATEGORY_KEYS.map((key, i) => ({
      key,
      name: key,
      weight: 12,
      score: fb.categoryScores[i] ?? null,
      description: '',
      subscores: [],
      evidence: [],
    })),
    overview: {
      highlights: {
        bestFor: pick?.ribbon ?? '',
        standout: '',
        drawback: '',
        startingPrice: `$${fb.priceMonthly.toFixed(2)} / mo`,
      },
      characters: [],
      comparisonMetrics: [],
      searchTrends: {
        productName: fb.name,
        currentInterest: fb.searchInterest,
        peakInterest: 100,
        changePercent: 0,
        changeDirection: 'up',
        popularityRank: 0,
        totalReviewed: 0,
      },
      featureCards: [],
      bestForList: pick?.pros ?? [],
      notIdealList: pick?.cons ?? [],
    },
    verdicts: [],
    ratingChangelog: [],
  } as Product;
}

export async function resolveAlternativeProduct(
  slug: string,
  comparisonProducts: Product[],
): Promise<Product | null> {
  const fromDb = comparisonProducts.find((p) => p.slug === slug);
  if (fromDb) return fromDb;
  return productFromFallback(slug);
}

export function popularitySnapshotFromProducts(
  source: Product,
  alternatives: Product[],
): Array<{ name: string; slug: string; searchInterest: number | null; highlight?: boolean }> {
  return [
    ...alternatives.map((a) => ({
      name: a.name,
      slug: a.slug,
      searchInterest: a.overview.searchTrends.currentInterest || null,
    })),
    {
      name: source.name,
      slug: source.slug,
      searchInterest: source.overview.searchTrends.currentInterest || null,
      highlight: true,
    },
  ].sort((a, b) => (b.searchInterest ?? 0) - (a.searchInterest ?? 0));
}

export { scoresToMap };
