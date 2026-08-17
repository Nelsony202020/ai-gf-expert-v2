import type { HtmlSitemapFullPage, HtmlSitemapLink, SitemapEntry } from '../types/sitemap';
import type { Product } from '../data/products';
import { authors } from '../data/authors';
import { guides } from '../data/guides';
import { products } from '../data/products';
import { getTestCategories } from './test-framework';
import { buyingGuideSlug } from '../data/buying-guide-content';
import { testHubUrl } from './slugs';
import { pathMatchKey, publicPagePath } from './urls';

export interface RoundupSummary {
  title: string;
  slug: string;
}

/** Roundups shown when the DB list isn't loaded (file fallback). */
const DEFAULT_ROUNDUPS: RoundupSummary[] = [
  { title: 'Best AI Girlfriend Apps', slug: 'ai-girlfriend' },
];

/**
 * Dynamic content feeding the sitemaps. Pages pass DB-loaded products and
 * roundups; defaults keep build-time callers (no DB) working from file data.
 */
export interface SitemapInputs {
  products?: Product[];
  roundups?: RoundupSummary[];
  /** Normalized paths set to draft from the admin (page overrides). */
  excludePaths?: Set<string>;
}

function entry(
  partial: Omit<SitemapEntry, 'isPublished' | 'showInHtmlSitemap' | 'includeInXmlSitemap'> & {
    isPublished?: boolean;
    showInHtmlSitemap?: boolean;
    includeInXmlSitemap?: boolean;
  },
): SitemapEntry {
  const isPublished = partial.isPublished ?? true;
  return {
    ...partial,
    isPublished,
    showInHtmlSitemap: partial.showInHtmlSitemap ?? isPublished,
    includeInXmlSitemap: partial.includeInXmlSitemap ?? isPublished,
  };
}

function canonicalSitemapUrl(url: string): string {
  const hashIdx = url.indexOf('#');
  if (hashIdx >= 0) {
    return publicPagePath(url.slice(0, hashIdx)) + url.slice(hashIdx);
  }
  return publicPagePath(url);
}

/** All site pages derived from structured content — single source of truth. */
export function getAllSitemapEntries(inputs: SitemapInputs = {}): SitemapEntry[] {
  const publishedProducts = inputs.products ?? products;
  const publishedRoundups = inputs.roundups ?? DEFAULT_ROUNDUPS;
  const entries: SitemapEntry[] = [];
  let order = 0;

  const push = (e: Omit<Parameters<typeof entry>[0], 'sitemapOrder'> & { sitemapOrder?: number }) => {
    entries.push(entry({ ...e, url: canonicalSitemapUrl(e.url), sitemapOrder: e.sitemapOrder ?? order++ }));
  };

  push({
    title: 'Home',
    url: '/',
    contentType: 'home',
    sitemapSection: 'company',
    showInHtmlSitemap: false,
  });

  push({
    title: 'App Directory',
    url: '/ai-girlfriend-apps',
    contentType: 'directory',
    sitemapSection: 'resources',
  });

  push({
    title: 'All Reviews',
    url: '/reviews/',
    contentType: 'hub',
    sitemapSection: 'reviews',
  });

  push({
    title: 'Legal',
    url: '/legal/',
    contentType: 'hub',
    sitemapSection: 'legal',
  });

  for (const product of publishedProducts) {
    push({
      title: `${product.name} Review`,
      url: `/reviews/${product.slug}`,
      contentType: 'review',
      sitemapSection: 'reviews',
      parentCategory: 'reviews',
      // Never submit noindex pages to Google.
      includeInXmlSitemap: !product.seo?.noindex,
    });
  }

  // Roundups from InstantDB (published, with a live route). File fallback
  // covers builds without DB access.
  for (const roundup of publishedRoundups) {
    push({
      title: roundup.title,
      url: `/best/${roundup.slug}`,
      contentType: 'roundup',
      sitemapSection: 'roundups',
      parentCategory: 'best-picks',
    });
  }

  push({
    title: 'All Guides',
    url: '/guides',
    contentType: 'hub',
    sitemapSection: 'guides',
  });

  push({
    title: 'How to Choose an AI Girlfriend App',
    url: `/guides/${buyingGuideSlug}`,
    contentType: 'guide',
    sitemapSection: 'guides',
    parentCategory: 'guides',
  });

  // Guides from Sanity (empty until the CMS has published guides)
  for (const guide of guides) {
    if (guide.slug === buyingGuideSlug) continue;
    push({
      title: guide.title,
      url: `/guides/${guide.slug}`,
      contentType: 'guide',
      sitemapSection: 'guides',
      parentCategory: 'guides',
      includeInXmlSitemap: !guide.noindex,
      showInHtmlSitemap: !guide.noindex,
    });
  }

  push({
    title: 'How We Test AI Girlfriend Apps',
    url: testHubUrl(),
    contentType: 'test-hub',
    sitemapSection: 'tests',
  });

  for (const cat of getTestCategories()) {
    push({
      title: `${cat.name} Testing Methodology`,
      url: cat.href,
      contentType: 'test-category',
      sitemapSection: 'tests',
      parentCategory: cat.key,
    });

    for (const sub of cat.subscores) {
      push({
        title: `${sub.name} — ${cat.name}`,
        url: sub.href,
        contentType: 'test-subscore',
        sitemapSection: 'tests',
        parentCategory: cat.key,
        showInHtmlSitemap: false,
        includeInXmlSitemap: true,
      });
    }
  }

  push({
    title: 'All Tests Directory',
    url: '/test/all/',
    contentType: 'test-archive',
    sitemapSection: 'tests',
    showInHtmlSitemap: false,
  });

  push({
    title: 'Market Data Methodology',
    url: '/test/market-data/',
    contentType: 'methodology',
    sitemapSection: 'tests',
  });

  push({
    title: 'How Score Tooltips Work',
    url: '/test/tooltips/',
    contentType: 'methodology',
    sitemapSection: 'tests',
  });

  push({
    title: 'Editorial Guidelines',
    url: '/editorial-guidelines/',
    contentType: 'methodology',
    sitemapSection: 'resources',
  });

  push({
    title: 'AI Girlfriend Glossary',
    url: '/glossary/',
    contentType: 'glossary',
    sitemapSection: 'resources',
  });

  for (const author of Object.values(authors)) {
    push({
      title: author.name,
      url: author.profileUrl,
      contentType: 'author',
      sitemapSection: 'authors',
    });
  }

  const resourcePages: { title: string; url: string; section: 'resources' | 'company' }[] = [
    { title: 'About Us', url: '/about', section: 'company' },
    { title: 'Contact Us', url: '/contact', section: 'company' },
  ];

  for (const page of resourcePages) {
    push({
      title: page.title,
      url: page.url,
      contentType: 'company',
      sitemapSection: page.section,
    });
  }

  const legalPages: { title: string; url: string }[] = [
    { title: 'Privacy Policy', url: '/legal/privacy' },
    { title: 'Terms of Service', url: '/legal/terms' },
    { title: 'Accessibility', url: '/legal/accessibility' },
    { title: 'Copyright Policy', url: '/legal/copyright' },
    { title: 'Disclaimer', url: '/legal/disclaimer' },
    { title: 'Affiliate Disclosure', url: '/legal/affiliate-disclosure' },
  ];

  for (const page of legalPages) {
    push({
      title: page.title,
      url: page.url,
      contentType: 'legal',
      sitemapSection: 'legal',
    });
  }

  push({
    title: 'HTML Sitemap',
    url: '/sitemap',
    contentType: 'utility',
    sitemapSection: 'company',
    showInHtmlSitemap: false,
  });

  return entries
    .filter((e) => e.isPublished)
    .sort((a, b) => a.sitemapOrder - b.sitemapOrder);
}

export function getXmlSitemapEntries(inputs: SitemapInputs = {}): SitemapEntry[] {
  return getAllSitemapEntries(inputs).filter((e) => e.includeInXmlSitemap);
}

// ---------------------------------------------------------------------------
// Child sitemaps: /sitemap.xml is a sitemap index pointing at one child
// sitemap per content group. Google is given the index URL only.
// ---------------------------------------------------------------------------

export type ChildSitemapKey = 'pages' | 'reviews' | 'methodology' | 'guides' | 'roundups';

export const CHILD_SITEMAPS: { key: ChildSitemapKey; path: string; label: string }[] = [
  { key: 'pages', path: '/sitemap-pages.xml', label: 'General pages' },
  { key: 'reviews', path: '/sitemap-reviews.xml', label: 'Reviews' },
  { key: 'methodology', path: '/sitemap-methodology.xml', label: 'Methodology' },
  { key: 'guides', path: '/sitemap-guides.xml', label: 'Guides' },
  { key: 'roundups', path: '/sitemap-roundups.xml', label: 'Roundups' },
];

/** Which child sitemap a URL belongs to. */
export function childSitemapFor(e: SitemapEntry): ChildSitemapKey {
  const url = e.url !== '/' ? e.url.replace(/\/$/, '') : '/';
  // Archives (/reviews/, /guides) belong to the general pages sitemap.
  if (e.contentType === 'review' && url !== '/reviews') return 'reviews';
  if (e.sitemapSection === 'tests') return 'methodology';
  if (e.sitemapSection === 'roundups' && url !== '/best') return 'roundups';
  if (e.contentType === 'guide' && url !== '/guides') return 'guides';
  return 'pages';
}

function normalizePath(path: string): string {
  return pathMatchKey(path);
}

/**
 * XML entries for one child sitemap, deduped by URL. `inputs.excludePaths`
 * holds normalized paths set to draft from the admin (page overrides).
 */
export function getChildSitemapEntries(
  key: ChildSitemapKey,
  inputs: SitemapInputs = {},
): SitemapEntry[] {
  const seen = new Set<string>();
  const result: SitemapEntry[] = [];
  for (const e of getXmlSitemapEntries(inputs)) {
    if (childSitemapFor(e) !== key) continue;
    const norm = normalizePath(e.url);
    if (seen.has(norm)) continue;
    if (inputs.excludePaths?.has(norm)) continue;
    seen.add(norm);
    result.push(e);
  }
  return result;
}

function dedupeLinks(items: HtmlSitemapLink[]): HtmlSitemapLink[] {
  return [...new Map(items.map((l) => [normalizePath(l.href), l])).values()];
}

function entriesToLinks(items: SitemapEntry[]): HtmlSitemapLink[] {
  return items.map((e) => ({ label: e.title, href: e.url }));
}

/** Distribute test categories across methodology columns (col 0 holds fewer cats). */
export function distributeTestCategoryColumns(categories: ReturnType<typeof getTestCategories>) {
  const cols: (typeof categories)[] = [[], [], [], [], []];

  if (categories.length === 0) return cols;

  // Column 0 is reserved for main methodology links only — categories start in column 1.
  const bucketCount = cols.length - 1;
  const perCol = Math.ceil(categories.length / bucketCount);

  for (let c = 1; c < cols.length; c++) {
    const start = (c - 1) * perCol;
    cols[c] = categories.slice(start, start + perCol);
  }

  return cols;
}

export const testMainMethodologyLinks: HtmlSitemapLink[] = [
  { label: 'How We Test AI Girlfriend Apps', href: testHubUrl() },
  { label: 'Scoring System', href: `${testHubUrl()}#how-scores-work` },
  { label: 'Testing Process Overview', href: `${testHubUrl()}#in-practice` },
];

export const testSupportingLinks: HtmlSitemapLink[] = [
  { label: 'All Tests Directory', href: '/test/all/' },
  { label: 'How Score Tooltips Work', href: '/test/tooltips/' },
  { label: 'Market Data Methodology', href: '/test/market-data/' },
  { label: 'Editorial Guidelines', href: '/editorial-guidelines/' },
];

/**
 * Full HTML sitemap page data — every published, HTML-visible link. Pages set
 * to draft from the admin (inputs.excludePaths) are dropped, matching the XML
 * sitemaps.
 */
export function buildFullHtmlSitemapPage(inputs: SitemapInputs = {}): HtmlSitemapFullPage {
  const excludePaths = inputs.excludePaths;
  const everyEntry = getAllSitemapEntries(inputs).filter(
    (e) => !excludePaths?.has(normalizePath(e.url)),
  );
  // Card counts include deep pages (e.g. test subscores) even when the card
  // itself only links to the parent level.
  const testCount = everyEntry.filter((e) => e.sitemapSection === 'tests').length;
  const all = everyEntry.filter((e) => e.showInHtmlSitemap);

  const reviews = dedupeLinks(entriesToLinks(all.filter((e) => e.sitemapSection === 'reviews')));
  const roundups = dedupeLinks(entriesToLinks(all.filter((e) => e.sitemapSection === 'roundups')));
  const guides = dedupeLinks(entriesToLinks(all.filter((e) => e.sitemapSection === 'guides')));
  const authors = dedupeLinks(entriesToLinks(all.filter((e) => e.sitemapSection === 'authors')));

  const resources = dedupeLinks([
    { label: 'How We Test', href: testHubUrl() },
    { label: 'How Score Tooltips Work', href: '/test/tooltips/' },
    ...entriesToLinks(
      all.filter(
        (e) =>
          e.sitemapSection === 'resources'
          && e.contentType !== 'test-hub'
          && e.url !== '/editorial-guidelines/',
      ),
    ),
  ]);

  const legal = dedupeLinks([
    ...entriesToLinks(all.filter((e) => e.sitemapSection === 'legal')),
    ...entriesToLinks(all.filter((e) => e.sitemapSection === 'company' && e.url !== '/')),
  ]);

  return {
    reviews,
    roundups,
    guides,
    authors,
    testCount,
    resourcesLegalCount: resources.length + legal.length,
    resources,
    legal,
  };
}

/** The sitemap index served at /sitemap.xml — the only URL submitted to Google. */
export function buildXmlSitemapIndex(siteOrigin: string): string {
  const origin = siteOrigin.replace(/\/$/, '');
  const nodes = CHILD_SITEMAPS
    .map((s) => `  <sitemap>\n    <loc>${escapeXml(`${origin}${s.path}`)}</loc>\n  </sitemap>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes}\n</sitemapindex>\n`;
}

/** One child sitemap (urlset) — e.g. /sitemap-reviews.xml. */
export function buildChildXmlSitemap(
  siteOrigin: string,
  key: ChildSitemapKey,
  inputs: SitemapInputs = {},
): string {
  const origin = siteOrigin.replace(/\/$/, '');
  const urlNodes = getChildSitemapEntries(key, inputs)
    .map((entry) => {
      const loc = `${origin}${entry.url.startsWith('/') ? entry.url : `/${entry.url}`}`;
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>\n`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
