import type { Product } from '../../data/products';
import { PRODUCT_ALTERNATIVES } from '../../data/product-alternatives-config';

export const REVIEW_PRODUCT_DOMAINS: Record<string, string> = {
  'aura-ai': 'aura.ai',
  'candy-ai': 'candy.ai',
  'kindroid': 'kindroid.ai',
  'ourdream-ai': 'ourdream.ai',
  'girlfriendgpt': 'girlfriendgpt.com',
  'nastia-ai': 'nastia.ai',
  'replika': 'replika.ai',
};

const PEER_CHART_COLORS = ['#a855f7', '#22c55e', '#94a3b8', '#f97316', '#3b82f6', '#14b8a6'];

const PEER_SCATTER_COLORS: Record<string, string> = {
  'candy-ai': '#a855f7',
  'ourdream-ai': '#22c55e',
  girlfriendgpt: '#94a3b8',
  'nastia-ai': '#f97316',
  kindroid: '#3b82f6',
};

const MARKET_EXCLUDE_SLUGS = new Set(['kindroid']);

export interface MarketReviewPeer {
  slug: string;
  domain: string;
  name: string;
  color: string;
  scatterColor: string;
  product: Product;
}

export function resolveReviewDomain(slug: string, product?: Product): string | null {
  if (REVIEW_PRODUCT_DOMAINS[slug]) return REVIEW_PRODUCT_DOMAINS[slug];
  const url = product?.websiteUrl;
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('example.com')) return null;
    return host;
  } catch {
    return null;
  }
}

export function getMarketReviewPeers(
  sourceSlug: string,
  productBySlug: Record<string, Product>,
): MarketReviewPeer[] {
  const config = PRODUCT_ALTERNATIVES[sourceSlug];
  const slugs = (config?.slugs ?? []).filter((s) => s !== sourceSlug && !MARKET_EXCLUDE_SLUGS.has(s));

  return slugs
    .map((slug, i) => {
      const product = productBySlug[slug];
      const domain = resolveReviewDomain(slug, product);
      if (!domain || !product) return null;
      return {
        slug,
        domain,
        name: product.name,
        color: PEER_CHART_COLORS[i % PEER_CHART_COLORS.length],
        scatterColor: PEER_SCATTER_COLORS[slug] ?? PEER_CHART_COLORS[i % PEER_CHART_COLORS.length],
        product,
      };
    })
    .filter(Boolean) as MarketReviewPeer[];
}

export function parseReviewPrice(product: Product): number | null {
  const match = product.overview.highlights.startingPrice.match(/\$([\d.]+)/);
  return match ? Number(match[1]) : null;
}
