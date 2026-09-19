/** Explore mega menu — review links are filled from published DB products at render time. */

import { publicPagePath } from '../lib/urls';
import type { Product } from './products';
import {
  GUIDE_BRAND_NAMES,
  GUIDE_BRAND_ORDER,
  crossBrandGuides,
  guidesForBrand,
} from './guides';

export interface MegaMenuLink {
  label: string;
  href: string;
}

export interface MegaMenuColumn {
  id: string;
  title: string;
  icon: string;
  description: string;
  links: MegaMenuLink[];
  viewAll: { label: string; href: string };
}

/*
 * The Guides column is derived, never hardcoded — src/data/guides.ts is the one
 * place a guide title lives. Shape is unchanged: the cross-brand guides first,
 * then each brand hub that actually has guides, then that brand's articles in
 * reading order, capped so the column keeps its current height.
 */
const MEGA_MENU_GUIDE_LINK_CAP = 4;

function buildGuideColumnLinks(): MegaMenuLink[] {
  const links: MegaMenuLink[] = crossBrandGuides().map((guide) => ({
    label: guide.title,
    href: publicPagePath(`/guides/${guide.slug}`),
  }));

  for (const brand of GUIDE_BRAND_ORDER) {
    const guides = guidesForBrand(brand);
    if (!guides.length) continue;
    links.push({
      label: `${GUIDE_BRAND_NAMES[brand]} Guides`,
      href: publicPagePath(`/guides/${brand}`),
    });
    for (const guide of guides) {
      links.push({ label: guide.title, href: publicPagePath(`/guides/${guide.slug}`) });
    }
  }

  return links.slice(0, MEGA_MENU_GUIDE_LINK_CAP);
}

export const megaMenuColumns: MegaMenuColumn[] = [
  {
    id: 'reviews',
    title: 'Reviews',
    icon: 'star',
    description: 'In-depth reviews and ratings of AI girlfriend platforms.',
    links: [],
    viewAll: { label: 'View all reviews', href: '/reviews/' },
  },
  {
    id: 'best-picks',
    title: 'Best Picks',
    icon: 'emoji_events',
    description: 'Curated lists to help you find the best AI girlfriend apps.',
    links: [
      { label: 'Best AI Girlfriend Apps', href: '/best/ai-girlfriend/' },
    ],
    viewAll: { label: 'View all best picks', href: '/best/ai-girlfriend/' },
  },
  {
    id: 'guides',
    title: 'Guides',
    icon: 'menu_book',
    description: 'Practical guides to choosing and using AI girlfriend apps.',
    links: buildGuideColumnLinks(),
    viewAll: { label: 'View all guides', href: '/guides/' },
  },
];

/** Mega menu with live review links from published products. */
export function buildMegaMenuColumns(publishedProducts: Pick<Product, 'slug' | 'name'>[]): MegaMenuColumn[] {
  const reviewLinks = [...publishedProducts]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((product) => ({
      label: `${product.name} Review`,
      href: publicPagePath(`/reviews/${product.slug}`),
    }));

  return megaMenuColumns.map((column) =>
    column.id === 'reviews' ? { ...column, links: reviewLinks } : column,
  );
}
