import type {
  HtmlSitemapExploreColumn,
  HtmlSitemapFullPage,
  HtmlSitemapLink,
  HtmlSitemapMethodologyLink,
  HtmlSitemapSearchHit,
  HtmlSitemapTestCategory,
  SitemapEntry,
} from '../types/sitemap';
import type { Product } from '../data/products';
import { getAllAuthors } from '../data/authors';
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
    title: 'OurDream AI Guides',
    url: '/guides/ourdream-ai',
    contentType: 'hub',
    sitemapSection: 'guides',
    parentCategory: 'guides',
  });

  push({
    title: 'How to Choose an AI Girlfriend App',
    url: `/guides/${buyingGuideSlug}`,
    contentType: 'guide',
    sitemapSection: 'guides',
    parentCategory: 'guides',
  });

  push({
    title: 'OurDream AI Comics: How to Use the Comic Generator',
    url: '/guides/ourdream-ai-comics',
    contentType: 'guide',
    sitemapSection: 'guides',
    parentCategory: 'guides',
  });

  push({
    title: 'How to Use OurDream AI Image Generator',
    url: '/guides/how-to-use-ourdream-ai-image-generator',
    contentType: 'guide',
    sitemapSection: 'guides',
    parentCategory: 'guides',
  });

  push({
    title: 'OurDream AI Image Prompt Guide',
    url: '/guides/ourdream-ai-image-prompt',
    contentType: 'guide',
    sitemapSection: 'guides',
    parentCategory: 'guides',
  });

  push({
    title: 'OurDream AI Prompt Guide',
    url: '/guides/ourdream-ai-prompt',
    contentType: 'guide',
    sitemapSection: 'guides',
    parentCategory: 'guides',
  });

  const hardcodedGuideSlugs = new Set([
    buyingGuideSlug,
    'ourdream-ai-comics',
    'how-to-use-ourdream-ai-image-generator',
    'ourdream-ai-image-prompt',
    'ourdream-ai-prompt',
  ]);

  // Guides from Sanity (empty until the CMS has published guides)
  for (const guide of guides) {
    if (hardcodedGuideSlugs.has(guide.slug)) continue;
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

  for (const author of getAllAuthors()) {
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

function dedupeLinks(items: HtmlSitemapLink[]): HtmlSitemapLink[] {
  return [...new Map(items.map((link) => [normalizePath(link.href), link])).values()];
}

function entriesToLinks(items: SitemapEntry[]): HtmlSitemapLink[] {
  return items.map((entry) => ({ label: entry.title, href: entry.url }));
}

function toColumn(heading: string, links: HtmlSitemapLink[]): HtmlSitemapExploreColumn {
  return { heading, count: links.length, links };
}

/** Destinations match the live Site Index at /sitemap/ — never inferred from labels. */
export const testMainMethodologyLinks: HtmlSitemapMethodologyLink[] = [
  {
    label: 'How We Test AI Girlfriend Apps',
    href: testHubUrl(),
    description: 'The full testing process, category by category.',
  },
  {
    label: 'Scoring System',
    href: `${testHubUrl()}#how-scores-work`,
    description: 'How the 1–10 score and the eight categories are built.',
  },
  {
    label: 'Testing Process Overview',
    href: `${testHubUrl()}#in-practice`,
    description: 'What happens from signing up to the final score.',
  },
];

export const testSupportingLinks: HtmlSitemapLink[] = [
  { label: 'All Tests Directory', href: '/test/all/' },
  { label: 'How Score Tooltips Work', href: '/test/tooltips/' },
  { label: 'Market Data Methodology', href: '/test/market-data/' },
  { label: 'Editorial Guidelines', href: '/editorial-guidelines/' },
];

/** Distribute test categories across methodology columns (col 0 holds fewer cats). */
export function distributeTestCategoryColumns(categories: ReturnType<typeof getTestCategories>) {
  const cols: (typeof categories)[] = [[], [], [], [], []];
  if (categories.length === 0) return cols;
  const bucketCount = cols.length - 1;
  const perCol = Math.ceil(categories.length / bucketCount);
  for (let c = 1; c < cols.length; c++) {
    const start = (c - 1) * perCol;
    cols[c] = categories.slice(start, start + perCol);
  }
  return cols;
}

function htmlSitemapTestCategories(): HtmlSitemapTestCategory[] {
  return getTestCategories().map((category) => {
    const subcategories = category.subscores.map((subscore) => ({
      href: subscore.href,
      label: subscore.name,
      slug: subscore.slug,
      testCount: subscore.contributors.length,
      tests: subscore.contributors.map((test) => ({ href: test.href, label: test.label })),
    }));

    return {
      slug: category.key,
      href: category.href,
      label: category.name,
      testCount: subcategories.reduce((sum, item) => sum + item.testCount, 0),
      subcategoryCount: subcategories.length,
      subcategories,
    };
  });
}

function extraSearchHits(): HtmlSitemapSearchHit[] {
  return [
    { href: '/sitemap/', title: 'Site Index', kind: 'page', location: 'PAGE' },
    { href: '/ai-girlfriend-apps/', title: 'AI Girlfriend Apps', kind: 'page', location: 'DIRECTORY' },
    { href: '/glossary/', title: 'AI Girlfriend Glossary', kind: 'page', location: 'RESOURCE' },
    { href: '/about/', title: 'About Us', kind: 'page', location: 'COMPANY' },
    { href: '/contact/', title: 'Contact Us', kind: 'page', location: 'COMPANY' },
    { href: '/legal/', title: 'Legal', kind: 'page', location: 'LEGAL' },
  ];
}

/**
 * Full HTML sitemap page data — destinations come from published sitemap
 * entries and the live /test/ URL system, not from title-derived slugs.
 */
export function buildFullHtmlSitemapPage(inputs: SitemapInputs = {}): HtmlSitemapFullPage {
  const excludePaths = inputs.excludePaths;
  const everyEntry = getAllSitemapEntries(inputs).filter(
    (entry) => !excludePaths?.has(normalizePath(entry.url)),
  );
  const testsCount = everyEntry.filter((entry) => entry.sitemapSection === 'tests').length;
  const all = everyEntry.filter((entry) => entry.showInHtmlSitemap);

  const reviews = toColumn(
    'Reviews',
    dedupeLinks(entriesToLinks(all.filter((entry) => entry.sitemapSection === 'reviews'))),
  );
  const roundups = toColumn(
    'Roundups',
    dedupeLinks(entriesToLinks(all.filter((entry) => entry.sitemapSection === 'roundups'))),
  );
  const guidesColumn = toColumn(
    'Guides',
    dedupeLinks(entriesToLinks(all.filter((entry) => entry.sitemapSection === 'guides'))),
  );
  const authors = toColumn(
    'Authors',
    dedupeLinks(entriesToLinks(all.filter((entry) => entry.sitemapSection === 'authors'))),
  );

  const resources = toColumn(
    'Resources',
    dedupeLinks([
      { label: 'How We Test', href: testHubUrl() },
      { label: 'How Score Tooltips Work', href: '/test/tooltips/' },
      { label: 'App Directory', href: '/ai-girlfriend-apps/' },
      { label: 'AI Girlfriend Glossary', href: '/glossary/' },
    ]),
  );

  const company = toColumn(
    'Company',
    dedupeLinks(entriesToLinks(all.filter((entry) => entry.sitemapSection === 'company' && entry.url !== '/'))),
  );

  const legal = dedupeLinks([
    { label: 'Legal', href: '/legal/' },
    ...entriesToLinks(all.filter((entry) => entry.sitemapSection === 'legal')),
  ]);

  const methodology = testMainMethodologyLinks;
  const supporting = testSupportingLinks;
  const testCategories = htmlSitemapTestCategories();
  const scoredTestsCount = testCategories.reduce((sum, category) => sum + category.testCount, 0);
  const subcategoryCount = testCategories.reduce((sum, category) => sum + category.subcategoryCount, 0);

  return {
    seoTitle: 'Site Index — AI Girlfriend Expert',
    seoDescription: 'Find every review, guide, test and resource we publish.',
    reviews,
    roundups,
    guides: guidesColumn,
    authors,
    methodology,
    testCategories,
    supporting,
    resources,
    company,
    legal,
    reviewsCount: reviews.count,
    roundupsCount: roundups.count,
    guidesCount: guidesColumn.count,
    authorsCount: authors.count,
    testsCount,
    methodologyPagesCount: testsCount,
    categoryCount: testCategories.length,
    subcategoryCount,
    scoredTestsCount,
    mainMethodology: methodology,
    supportingMethodology: supporting,
    rankingsCount: roundups.count,
    testingPagesCount: testsCount,
    testingCategoriesCount: testCategories.length,
    testingSubcategoriesCount: subcategoryCount,
    resourcesCount: resources.count,
  };
}

export function getHtmlSitemapPage(inputs: SitemapInputs = {}): HtmlSitemapFullPage {
  return buildFullHtmlSitemapPage(inputs);
}

export function getSiteIndexPage(inputs: SitemapInputs = {}): HtmlSitemapFullPage {
  const page = buildFullHtmlSitemapPage(inputs);
  return {
    ...page,
    searchHits: buildSitemapPageSearchIndex(page),
  };
}

export function buildSitemapPageSearchIndex(
  page: HtmlSitemapFullPage = getHtmlSitemapPage(),
): HtmlSitemapSearchHit[] {
  const hits: HtmlSitemapSearchHit[] = extraSearchHits();

  for (const column of [page.reviews, page.roundups, page.guides, page.authors]) {
    hits.push({
      href: column.links[0]?.href ?? '/',
      title: column.heading,
      kind: 'section',
      location: 'SECTION',
    });
    for (const link of column.links) {
      hits.push({
        href: link.href,
        title: link.label,
        kind: column.heading === 'Guides' ? 'guide' : 'page',
        location: column.heading.toUpperCase(),
      });
    }
  }

  for (const item of page.methodology) {
    hits.push({
      href: item.href,
      title: item.label,
      kind: 'page',
      location: 'METHODOLOGY',
    });
  }

  for (const category of page.testCategories) {
    hits.push({
      href: category.href,
      title: category.label,
      kind: 'test-category',
      location: 'TEST CATEGORY',
    });
    for (const subcategory of category.subcategories) {
      hits.push({
        href: subcategory.href,
        title: subcategory.label,
        kind: 'test',
        location: `TEST · ${category.label.toUpperCase()}`,
      });
      for (const test of subcategory.tests) {
        hits.push({
          href: test.href,
          title: test.label,
          kind: 'test',
          location: `TEST · ${category.label.toUpperCase()} · ${subcategory.label.toUpperCase()}`,
        });
      }
    }
  }

  for (const link of [...page.supporting, ...page.resources.links, ...page.company.links, ...page.legal]) {
    hits.push({
      href: link.href,
      title: link.label,
      kind: 'page',
      location: 'PAGE',
    });
  }

  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = `${hit.href}::${hit.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function filterHtmlSitemapSearchHits(
  hits: HtmlSitemapSearchHit[],
  query: string,
): HtmlSitemapSearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return hits;
  return hits.filter((hit) => `${hit.title} ${hit.location} ${hit.kind}`.toLowerCase().includes(needle));
}

export const filterSitemapSearchHits = filterHtmlSitemapSearchHits;
