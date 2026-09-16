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

/** Preferred order for the header “Popular brands” list. Hubs not in this list still appear after. */
export const POPULAR_BRAND_SLUGS = ['candy-ai', 'ourdream-ai', 'spicychat', 'girlfriendgpt'] as const;

/** Existing app directory — used as “View all brands” until a dedicated brands index exists. */
export const BRAND_DIRECTORY_HREF = '/ai-girlfriend-apps/';

function displayName(slug: string, productName?: string) {
  if (productName) return productName;
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
  for (const slug of Object.keys(BRAND_HUB_BY_SLUG)) pushHub(slug);

  return {
    popular,
    viewAll: null,
  };
}
