/** Explore mega menu — review links are filled from published DB products at render time. */

import { buyingGuideSlug } from './buying-guide-content';
import type { Product } from './products';

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
      { label: 'Best AI Girlfriend Apps', href: '/best/ai-girlfriend' },
    ],
    viewAll: { label: 'View all best picks', href: '/best/ai-girlfriend' },
  },
  {
    id: 'guides',
    title: 'Guides',
    icon: 'menu_book',
    description: 'Practical guides to choosing and using AI girlfriend apps.',
    links: [
      {
        label: 'How to Choose an AI Girlfriend App',
        href: `/guides/${buyingGuideSlug}`,
      },
    ],
    viewAll: { label: 'View all guides', href: '/guides' },
  },
];

/** Mega menu with live review links from published products. */
export function buildMegaMenuColumns(publishedProducts: Pick<Product, 'slug' | 'name'>[]): MegaMenuColumn[] {
  const reviewLinks = [...publishedProducts]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((product) => ({
      label: `${product.name} Review`,
      href: `/reviews/${product.slug}`,
    }));

  return megaMenuColumns.map((column) =>
    column.id === 'reviews' ? { ...column, links: reviewLinks } : column,
  );
}
