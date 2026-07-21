import { products } from './products';
import { megaMenuColumns } from './nav-mega-menu';

export type SearchResultType = 'review' | 'roundup' | 'guide' | 'page';

export interface SearchResult {
  label: string;
  href: string;
  type: SearchResultType;
  meta?: string;
}

const staticPages: SearchResult[] = [
  { label: 'Contact Us', href: '/contact', type: 'page', meta: 'Company' },
  { label: 'HTML Sitemap', href: '/sitemap', type: 'page', meta: 'Company' },
  { label: 'FAQ', href: '/faq', type: 'page', meta: 'Resources' },
  { label: 'Affiliate Disclosure', href: '/legal/affiliate-disclosure', type: 'page', meta: 'Legal' },
  { label: 'Privacy Policy', href: '/legal/privacy', type: 'page', meta: 'Legal' },
  { label: 'Herman Carter', href: '/author/herman-carter', type: 'page', meta: 'Author' },
];

function typeFromColumnId(id: string): SearchResultType {
  if (id === 'reviews') return 'review';
  if (id === 'best-picks') return 'roundup';
  return 'guide';
}

/** Flat index for client-side header search. */
export function buildSearchIndex(): SearchResult[] {
  const fromMega = megaMenuColumns.flatMap((col) => {
    const type = typeFromColumnId(col.id);
    const items: SearchResult[] = col.links.map((link) => ({
      label: link.label,
      href: link.href,
      type,
      meta: col.title,
    }));
    items.push({
      label: col.viewAll.label,
      href: col.viewAll.href,
      type,
      meta: col.title,
    });
    return items;
  });

  const fromProducts = products.map((p) => ({
    label: `${p.name} Review`,
    href: `/reviews/${p.slug}`,
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
