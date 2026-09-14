import type { HtmlSitemapFullPage } from '../types/sitemap';
import type { TestCategoryNode } from './test-framework';
import type { SearchResult } from '../data/site-search';

function pushUnique(seen: Set<string>, out: SearchResult[], item: SearchResult) {
  const key = `${item.href}|${item.label}`;
  if (seen.has(key)) return;
  seen.add(key);
  out.push(item);
}

/** Client-side search index for the Site Index page (all indexed links on this route). */
export function buildSitemapPageSearchIndex(
  page: HtmlSitemapFullPage,
  categories: TestCategoryNode[],
): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];

  const linkGroups: { links: { label: string; href: string }[]; meta: string; type: SearchResult['type'] }[] = [
    { links: page.reviews, meta: 'Reviews', type: 'review' },
    { links: page.roundups, meta: 'Roundups', type: 'roundup' },
    { links: page.guides, meta: 'Guides', type: 'guide' },
    { links: page.authors, meta: 'Authors', type: 'page' },
    { links: page.resources, meta: 'Resources', type: 'page' },
    { links: page.legal, meta: 'Legal', type: 'page' },
  ];

  for (const group of linkGroups) {
    for (const link of group.links) {
      pushUnique(seen, out, { label: link.label, href: link.href, type: group.type, meta: group.meta });
    }
  }

  for (const cat of categories) {
    pushUnique(seen, out, {
      label: cat.name,
      href: cat.href,
      type: 'page',
      meta: 'Testing',
    });
    for (const sub of cat.subscores) {
      pushUnique(seen, out, {
        label: sub.name,
        href: sub.href,
        type: 'page',
        meta: cat.name,
      });
      for (const c of sub.contributors) {
        pushUnique(seen, out, {
          label: c.label,
          href: c.href,
          type: 'page',
          meta: `${cat.name} · ${sub.name}`,
        });
      }
    }
  }

  return out;
}
