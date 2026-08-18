import { publicPagePath } from '../lib/urls';
import type { Product } from './products';
import { megaMenuColumns, type MegaMenuColumn } from './nav-mega-menu';
import { legalPages } from './legal-pages';

export type SearchResultType = 'review' | 'roundup' | 'guide' | 'page';

export interface SearchResult {
  label: string;
  href: string;
  type: SearchResultType;
  meta?: string;
}

const staticPages: SearchResult[] = [
  { label: 'About Us', href: '/about/', type: 'page', meta: 'Company' },
  { label: 'Contact Us', href: '/contact/', type: 'page', meta: 'Company' },
  { label: 'HTML Sitemap', href: '/sitemap/', type: 'page', meta: 'Company' },
  { label: 'Reviews Hub', href: '/reviews/', type: 'page', meta: 'Reviews' },
  { label: 'Legal Hub', href: '/legal/', type: 'page', meta: 'Legal' },
  { label: 'App Directory', href: '/ai-girlfriend-apps/', type: 'page', meta: 'Tools' },
  { label: 'How We Test', href: '/test/', type: 'page', meta: 'Resources' },
  { label: 'How Score Tooltips Work', href: '/test/tooltips/', type: 'page', meta: 'Resources' },
  {
    label: 'How to Choose an AI Girlfriend App',
    href: '/guides/how-to-choose-an-ai-girlfriend-app/',
    type: 'guide',
    meta: 'Guides',
  },
  ...legalPages.map((page) => ({
    label: page.title,
    href: page.href,
    type: 'page' as const,
    meta: 'Legal',
  })),
  { label: 'Herman Carter', href: '/author/herman-carter/', type: 'page', meta: 'Author' },
  { label: 'Ajit', href: '/author/ajit/', type: 'page', meta: 'Author' },
];

function typeFromColumnId(id: string): SearchResultType {
  if (id === 'reviews') return 'review';
  if (id === 'best-picks') return 'roundup';
  return 'guide';
}

/** Flat index for client-side header search. */
export function buildSearchIndex(
  publishedProducts: Pick<Product, 'slug' | 'name'>[] = [],
  columns: MegaMenuColumn[] = megaMenuColumns,
): SearchResult[] {
  const fromMega = columns.flatMap((col) => {
    const type = typeFromColumnId(col.id);
    const items: SearchResult[] = col.links
      .filter((link) => link.href && link.href !== '#' && !link.href.startsWith('#'))
      .map((link) => ({
        label: link.label,
        href: link.href,
        type,
        meta: col.title,
      }));
    if (col.viewAll.href && col.viewAll.href !== '#' && !col.viewAll.href.startsWith('#')) {
      items.push({
        label: col.viewAll.label,
        href: col.viewAll.href,
        type,
        meta: col.title,
      });
    }
    return items;
  });

  const fromProducts = publishedProducts.map((p) => ({
    label: `${p.name} Review`,
    href: publicPagePath(`/reviews/${p.slug}`),
    type: 'review' as const,
    meta: 'Reviews',
  }));

  const merged = [...fromProducts, ...fromMega, ...staticPages];
  const seen = new Set<string>();

  return merged.filter((item) => {
    const key = `${item.href}|${item.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function filterSearchIndex(index: SearchResult[], query: string, limit = 8): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return index
    .filter((item) => {
      const hay = `${item.label} ${item.meta ?? ''}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);
}
