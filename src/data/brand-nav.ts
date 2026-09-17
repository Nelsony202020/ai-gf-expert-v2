import { publicPagePath } from '../lib/urls';

export interface BrandNavItem {
  slug: string;
  name: string;
  href: string;
}

export interface BrandNav {
  popular: BrandNavItem[];
  viewAll: { label: string; href: string } | null;
}

/**
 * Brand hub routes that exist in this repo.
 * Add a slug → hub path here when a new brand hub ships.
 * Do not point these at review URLs.
 */
export const BRAND_HUB_BY_SLUG: Record<string, string> = {
  'candy-ai': '/guides/candy-ai/',
  'girlfriendgpt': '/guides/girlfriendgpt/',
  'juicychat-ai': '/guides/juicychat-ai/',
  'nectar-ai': '/guides/nectar-ai/',
  'ourdream-ai': '/guides/ourdream-ai/',
};

/**
 * Brands shown in the header dropdown. Other hubs stay in BRAND_HUB_BY_SLUG
 * (and on the site) — they are just not listed in this menu yet.
 */
export const POPULAR_BRAND_SLUGS = ['ourdream-ai'] as const;

const BRAND_MENU_NAMES: Record<string, string> = {
  'ourdream-ai': 'OurDream AI',
  'candy-ai': 'Candy AI',
  'nectar-ai': 'Nectar AI',
  'girlfriendgpt': 'GirlfriendGPT',
  'juicychat-ai': 'JuicyChat AI',
};

function displayName(slug: string, productName?: string) {
  if (productName) return productName;
  if (BRAND_MENU_NAMES[slug]) return BRAND_MENU_NAMES[slug];
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildBrandNav(
  products: { slug: string; name: string }[],
): BrandNav {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const seen = new Set<string>();
  const popular: BrandNavItem[] = [];

  const pushHub = (slug: string) => {
    const href = BRAND_HUB_BY_SLUG[slug];
    if (!href || seen.has(slug)) return;
    seen.add(slug);
    popular.push({
      slug,
      name: displayName(slug, bySlug.get(slug)?.name),
      href: publicPagePath(href),
    });
  };

  for (const slug of POPULAR_BRAND_SLUGS) pushHub(slug);

  return {
    popular,
    viewAll: null,
  };
}
