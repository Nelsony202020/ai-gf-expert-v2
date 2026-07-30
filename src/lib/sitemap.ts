import type { HtmlSitemapFullPage, HtmlSitemapLink, HtmlSitemapSection, SitemapEntry } from '../types/sitemap';
import type { Product } from '../data/products';
import { authors } from '../data/authors';
import { guides } from '../data/guides';
import { megaMenuColumns } from '../data/nav-mega-menu';
import { products } from '../data/products';
import { getTestCategories } from './test-framework';
import { buyingGuideSlug } from '../data/buying-guide-content';
import { testHubUrl } from './slugs';

const HTML_PREVIEW_LIMIT = 5;

function isLiveHref(href: string): boolean {
  return Boolean(href && href !== '#' && !href.startsWith('#'));
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

/** All site pages derived from structured content — single source of truth. */
export function getAllSitemapEntries(publishedProducts: Product[] = products): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  let order = 0;

  const push = (e: Parameters<typeof entry>[0]) => {
    entries.push(entry({ ...e, sitemapOrder: e.sitemapOrder ?? order++ }));
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
    showInHtmlSitemap: false,
  });

  push({
    title: 'Reviews',
    url: '/reviews/',
    contentType: 'hub',
    sitemapSection: 'reviews',
    showInHtmlSitemap: false,
  });

  push({
    title: 'Legal',
    url: '/legal/',
    contentType: 'hub',
    sitemapSection: 'legal',
    showInHtmlSitemap: false,
  });

  for (const product of publishedProducts) {
    push({
      title: `${product.name} Review`,
      url: `/reviews/${product.slug}`,
      contentType: 'review',
      sitemapSection: 'reviews',
      parentCategory: 'reviews',
    });
  }

  for (const col of megaMenuColumns) {
    const section = col.id === 'reviews'
      ? 'reviews'
      : col.id === 'best-picks'
        ? 'roundups'
        : 'guides';
    const contentType = col.id === 'reviews'
      ? 'review'
      : col.id === 'best-picks'
        ? 'roundup'
        : 'guide';

    for (const link of col.links) {
      if (!isLiveHref(link.href)) continue;
      push({
        title: link.label,
        url: link.href,
        contentType,
        sitemapSection: section,
        parentCategory: col.id,
      });
    }

    if (isLiveHref(col.viewAll.href)) {
      push({
        title: col.viewAll.label,
        url: col.viewAll.href,
        contentType,
        sitemapSection: section,
        parentCategory: col.id,
        showInHtmlSitemap: false,
      });
    }
  }

  // Guides from Sanity (empty until the CMS has published guides)
  push({
    title: 'How to Choose an AI Girlfriend App',
    url: `/guides/${buyingGuideSlug}`,
    contentType: 'guide',
    sitemapSection: 'guides',
    parentCategory: 'guides',
  });

  if (guides.length > 0) {
    push({
      title: 'Guides',
      url: '/guides',
      contentType: 'guide',
      sitemapSection: 'guides',
      showInHtmlSitemap: false,
    });
    for (const guide of guides) {
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

export function getXmlSitemapEntries(publishedProducts: Product[] = products): SitemapEntry[] {
  return getAllSitemapEntries(publishedProducts).filter((e) => e.includeInXmlSitemap);
}

function dedupeLinks(items: HtmlSitemapLink[]): HtmlSitemapLink[] {
  return [...new Map(items.map((l) => [l.href, l])).values()];
}

function entriesToLinks(items: SitemapEntry[]): HtmlSitemapLink[] {
  return items.map((e) => ({ label: e.title, href: e.url }));
}

/** Drop mega-menu "View all …" rows from the HTML sitemap lists. */
function filterNavLinks(links: HtmlSitemapLink[]): HtmlSitemapLink[] {
  return links.filter((l) => !/^view all/i.test(l.label));
}

/** Distribute test categories across methodology columns (col 0 holds fewer cats). */
export function distributeTestCategoryColumns(categories: ReturnType<typeof getTestCategories>) {
  const cols: (typeof categories)[] = [[], [], [], [], []];

  if (categories.length === 0) return cols;

  cols[0].push(categories[0]);
  const remaining = categories.slice(1);
  const bucketCount = cols.length - 1;
  const perCol = Math.ceil(remaining.length / bucketCount);

  for (let c = 1; c < cols.length; c++) {
    const start = (c - 1) * perCol;
    cols[c] = remaining.slice(start, start + perCol);
  }

  return cols;
}

export const testMainMethodologyLinks: HtmlSitemapLink[] = [
  { label: 'How We Test AI Girlfriend Apps', href: testHubUrl() },
  { label: 'Scoring System', href: `${testHubUrl()}#how-scores-work` },
  { label: 'Testing Process Overview', href: `${testHubUrl()}#in-practice` },
];

export const testSupportingLinks: HtmlSitemapLink[] = [
  { label: 'How Score Tooltips Work', href: '/test/tooltips/' },
  { label: 'Market Data Methodology', href: '/test/market-data/' },
  { label: 'Editorial Guidelines', href: '/editorial-guidelines/' },
];

/** Full HTML sitemap page data — every published link, no truncation. */
export function buildFullHtmlSitemapPage(publishedProducts: Product[] = products): HtmlSitemapFullPage {
  const all = getAllSitemapEntries(publishedProducts);

  const reviews = dedupeLinks(
    filterNavLinks(
      entriesToLinks(all.filter((e) => e.sitemapSection === 'reviews' && e.contentType === 'review')),
    ),
  );

  const roundups = dedupeLinks(filterNavLinks(entriesToLinks(all.filter((e) => e.sitemapSection === 'roundups'))));
  const guides = dedupeLinks(filterNavLinks(entriesToLinks(all.filter((e) => e.sitemapSection === 'guides'))));
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
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
  ]);

  const testCount = all.filter((e) => e.sitemapSection === 'tests').length;

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

/** Curated HTML sitemap card sections — not every deep URL. */
export function buildHtmlSitemapSections(): HtmlSitemapSection[] {
  const all = getAllSitemapEntries();

  const reviews = all.filter((e) => e.sitemapSection === 'reviews' && e.contentType === 'review');
  const uniqueReviews = [...new Map(reviews.map((e) => [e.url, e])).values()];

  const roundups = all.filter((e) => e.sitemapSection === 'roundups');
  const guides = all.filter((e) => e.sitemapSection === 'guides');
  const authorEntries = all.filter((e) => e.sitemapSection === 'authors');
  const resources = all.filter(
    (e) =>
      e.sitemapSection === 'resources'
      && e.showInHtmlSitemap
      && e.contentType !== 'test-hub',
  );
  const legal = all.filter((e) => e.sitemapSection === 'legal');
  const company = all.filter(
    (e) => e.sitemapSection === 'company' && e.showInHtmlSitemap && e.url !== '/',
  );

  const testCategories = getTestCategories();
  const testCount = all.filter((e) => e.sitemapSection === 'tests').length;

  const testLinks: HtmlSitemapSection['links'] = [
    { label: 'How We Test AI Girlfriend Apps', href: testHubUrl() },
    ...testCategories.map((cat) => ({ label: cat.name, href: cat.href })),
    { label: 'How Score Tooltips Work', href: '/test/tooltips/' },
    { label: 'Market Data Methodology', href: '/test/market-data/' },
    { label: 'Editorial Guidelines', href: '/editorial-guidelines/' },
  ];

  const resourceLinks: HtmlSitemapSection['links'] = [
    { label: 'How We Test', href: testHubUrl() },
    { label: 'Editorial Guidelines', href: '/editorial-guidelines/' },
    { label: 'Market Data Methodology', href: '/test/market-data/' },
    ...resources.map((e) => ({ label: e.title, href: e.url })),
  ];

  const uniqueResourceLinks = [...new Map(resourceLinks.map((l) => [l.href, l])).values()].slice(0, 8);

  return [
    {
      id: 'reviews',
      title: 'Reviews',
      count: uniqueReviews.length,
      icon: 'star',
      tone: 'amber',
      links: uniqueReviews.slice(0, HTML_PREVIEW_LIMIT).map((e) => ({ label: e.title, href: e.url })),
      viewAll: uniqueReviews.length > HTML_PREVIEW_LIMIT
        ? { label: 'View all reviews', href: '/reviews/' }
        : null,
    },
    {
      id: 'roundups',
      title: 'Roundups',
      count: roundups.length,
      icon: 'checklist',
      tone: 'lime',
      links: roundups.slice(0, HTML_PREVIEW_LIMIT).map((e) => ({ label: e.title, href: e.url })),
      viewAll: roundups.length > 0
        ? { label: 'View all roundups', href: '/best/ai-girlfriend' }
        : null,
    },
    {
      id: 'guides',
      title: 'Guides',
      count: guides.length,
      icon: 'menu_book',
      tone: 'green',
      links: guides.slice(0, HTML_PREVIEW_LIMIT).map((e) => ({ label: e.title, href: e.url })),
      viewAll: guides.length > HTML_PREVIEW_LIMIT
        ? { label: 'View all guides', href: '/guides/how-to-choose-an-ai-girlfriend-app' }
        : null,
    },
    {
      id: 'tests',
      title: 'Tests & Methodology',
      count: testCount,
      icon: 'science',
      tone: 'green',
      links: testLinks,
      viewAll: { label: 'View all tests', href: '/test/all/' },
    },
    {
      id: 'authors',
      title: 'Authors',
      count: authorEntries.length,
      icon: 'person',
      tone: 'amber',
      links: authorEntries.map((e) => ({ label: e.title, href: e.url })),
      viewAll: authorEntries.length > 1
        ? { label: 'View all authors', href: authorEntries[0]?.url ?? '/author/herman-carter' }
        : null,
    },
    {
      id: 'resources',
      title: 'Resources',
      count: uniqueResourceLinks.length,
      icon: 'folder',
      tone: 'lime',
      links: uniqueResourceLinks,
      viewAll: { label: 'View all resources', href: testHubUrl() },
    },
    {
      id: 'legal',
      title: 'Legal & Info',
      count: legal.length,
      icon: 'shield',
      tone: 'lime',
      links: legal.slice(0, 8).map((e) => ({ label: e.title, href: e.url })),
      viewAll: legal.length > 0
        ? { label: 'View all legal pages', href: '/legal/' }
        : null,
    },
    {
      id: 'company',
      title: 'Company',
      count: company.length + 1,
      icon: 'apartment',
      tone: 'green',
      links: [
        ...company.map((e) => ({ label: e.title, href: e.url })),
        { label: 'HTML Sitemap', href: '/sitemap' },
      ],
      viewAll: null,
    },
  ];
}

export function buildXmlSitemap(siteOrigin: string, publishedProducts: Product[] = products): string {
  const urls = getXmlSitemapEntries(publishedProducts);
  const origin = siteOrigin.replace(/\/$/, '');

  const urlNodes = urls
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
