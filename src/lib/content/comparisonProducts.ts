import type { Product } from '../../data/products';
import { loadPublishedProducts } from './store';

export interface ScorePoint {
  slug: string;
  name: string;
  score: number;
}

let cachedProducts: Product[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

/** Published products for score distribution charts and cross-app comparisons. */
export async function loadComparisonProducts(): Promise<Product[]> {
  const now = Date.now();
  if (cachedProducts && now - cachedAt < CACHE_TTL_MS) {
    return cachedProducts;
  }

  const { products: fileProducts } = await import('../../data/products');
  cachedProducts = await loadPublishedProducts(fileProducts);
  cachedAt = now;
  return cachedProducts;
}

export function overallScorePoints(products: Product[]): ScorePoint[] {
  return products
    .map((p) => ({ slug: p.slug, name: p.name, score: p.overallScore }))
    .filter(
      (x): x is ScorePoint =>
        x.score != null && Number.isFinite(x.score),
    );
}

export function categoryScorePoints(products: Product[], categoryKey: string): ScorePoint[] {
  return products
    .map((p) => {
      const cat = p.categories.find((c) => c.key === categoryKey);
      return cat && cat.score != null ? { slug: p.slug, name: p.name, score: cat.score } : null;
    })
    .filter((x): x is ScorePoint => !!x);
}

export function subscoreScorePoints(
  products: Product[],
  categoryKey: string,
  subName: string,
): ScorePoint[] {
  return products
    .map((p) => {
      const cat = p.categories.find((c) => c.key === categoryKey);
      const matchSub = cat?.subscores.find((s) => s.name === subName);
      return matchSub ? { slug: p.slug, name: p.name, score: matchSub.score } : null;
    })
    .filter((x): x is ScorePoint => !!x);
}
