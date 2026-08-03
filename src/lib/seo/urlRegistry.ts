// Central URL registry: every known URL on the site (DB content, hard-coded
// routes, generated pages, redirects, drafts, admin, API) assembled into one
// list with indexing status, SEO fields, and detected issues.
//
// Powers the admin SEO control center (/admin/seo/*) and the offline export
// script (scripts/export-site-urls.ts).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { publicSiteOrigin } from '../siteOrigin';
import { getAllSitemapEntries, childSitemapFor } from '../sitemap';
import { getPageOverrides, normalizeOverridePath } from './pageOverrides';
import { pathMatchKey, publicPagePath } from '../urls';
import { getTestCategories } from '../test-framework';
import { loadPublishedProducts, loadPublishedRoundupSummaries } from '../content/store';
import { isDbConfigured, getDb } from '../db/server';
import { isSanityConfigured, sanityQuery } from '../sanity/client';
import { authors } from '../../data/authors';
import { products as fileProducts } from '../../data/products';
import { buyingGuideSlug } from '../../data/buying-guide-content';
import type {
  RegistryIssue,
  RegistryUrl,
  RegistryView,
  UrlRegistry,
  IssueGroup,
  RegistrySummary,
  SuggestedRedirect,
} from './urlRegistryTypes';

// ---------------------------------------------------------------------------
// Types (shared with the admin client via urlRegistryTypes.ts)
// ---------------------------------------------------------------------------

export type {
  RegistrySource,
  RegistryStatus,
  RegistryIndexing,
  RegistryView,
  IssueSeverity,
  RegistryIssue,
  RegistryUrl,
  SuggestedRedirect,
  RegistrySummary,
  IssueGroup,
  UrlRegistry,
} from './urlRegistryTypes';

// ---------------------------------------------------------------------------
// Static route data (code-managed)
// ---------------------------------------------------------------------------

interface StaticPageDef {
  path: string;
  title: string;
  contentType: string;
  sourceFile: string;
  notes?: string;
}

const STATIC_PAGES: StaticPageDef[] = [
  { path: '/', title: 'Home', contentType: 'home', sourceFile: 'src/pages/index.astro', notes: 'SSR at runtime' },
  { path: '/about/', title: 'About Us', contentType: 'company', sourceFile: 'src/pages/about.astro' },
  { path: '/contact/', title: 'Contact Us', contentType: 'company', sourceFile: 'src/pages/contact.astro' },
  { path: '/editorial-guidelines/', title: 'Editorial Guidelines', contentType: 'methodology', sourceFile: 'src/pages/editorial-guidelines.astro' },
  { path: '/ai-girlfriend-apps/', title: 'App Directory', contentType: 'directory', sourceFile: 'src/pages/ai-girlfriend-apps.astro', notes: 'Supports ?page= and ?sort= query params' },
  { path: '/reviews/', title: 'All Reviews', contentType: 'hub', sourceFile: 'src/pages/reviews/index.astro' },
  { path: '/guides/', title: 'All Guides', contentType: 'hub', sourceFile: 'src/pages/guides/index.astro' },
  { path: `/guides/${buyingGuideSlug}/`, title: 'How to Choose an AI Girlfriend App', contentType: 'guide', sourceFile: 'src/pages/guides/how-to-choose-an-ai-girlfriend-app.astro' },
  { path: '/legal/', title: 'Legal Pages', contentType: 'hub', sourceFile: 'src/pages/legal/index.astro' },
  { path: '/legal/privacy/', title: 'Privacy Policy', contentType: 'legal', sourceFile: 'src/pages/legal/privacy.astro' },
  { path: '/legal/terms/', title: 'Terms of Service', contentType: 'legal', sourceFile: 'src/pages/legal/terms.astro' },
  { path: '/legal/accessibility/', title: 'Accessibility', contentType: 'legal', sourceFile: 'src/pages/legal/accessibility.astro' },
  { path: '/legal/copyright/', title: 'Copyright Policy', contentType: 'legal', sourceFile: 'src/pages/legal/copyright.astro' },
  { path: '/legal/disclaimer/', title: 'Disclaimer', contentType: 'legal', sourceFile: 'src/pages/legal/disclaimer.astro' },
  { path: '/legal/affiliate-disclosure/', title: 'Affiliate Disclosure', contentType: 'legal', sourceFile: 'src/pages/legal/affiliate-disclosure.astro' },
  { path: '/sitemap/', title: 'HTML Sitemap', contentType: 'utility', sourceFile: 'src/pages/sitemap.astro' },
  { path: '/sitemap.xml', title: 'XML Sitemap', contentType: 'utility', sourceFile: 'src/pages/sitemap.xml.ts' },
  { path: '/test/', title: 'How We Test', contentType: 'test-hub', sourceFile: 'src/pages/test/index.astro' },
  { path: '/test/all/', title: 'All Tests Directory', contentType: 'test-archive', sourceFile: 'src/pages/test/all/index.astro' },
  { path: '/test/tooltips/', title: 'How Score Tooltips Work', contentType: 'methodology', sourceFile: 'src/pages/test/tooltips/index.astro' },
  { path: '/test/market-data/', title: 'Market Data Methodology', contentType: 'methodology', sourceFile: 'src/pages/test/market-data.astro' },
  { path: '/best/ai-girlfriend/', title: 'Best AI Girlfriend Apps', contentType: 'roundup', sourceFile: 'src/pages/best/ai-girlfriend.astro', notes: 'Only roundup with a public page file' },
];

const PREVIEW_PAGES: StaticPageDef[] = [
  { path: '/guides/preview/', title: 'Guide draft preview', contentType: 'guide-preview', sourceFile: 'src/pages/guides/preview.astro', notes: 'Requires ?secret= and ?slug= query params' },
];

const ADMIN_STATIC = [
  '/admin/',
  '/admin/homepage',
  '/admin/products',
  '/admin/products/new',
  '/admin/testing/runs',
  '/admin/testing/evidence-definitions',
  '/admin/testing/categories',
  '/admin/testing/subscores',
  '/admin/testing/methodology-versions',
  '/admin/content/authors',
  '/admin/seo/overview',
  '/admin/seo/pages',
  '/admin/seo/redirects',
  '/admin/seo/indexing',
  '/admin/seo/sitemaps',
  '/admin/monetization/affiliate-links',
  '/admin/administration/users',
  '/admin/administration/roles',
  '/admin/administration/audit',
];

const API_ROUTES = [
  '/api/engage',
  '/api/cron/scheduled-publish',
  '/api/cron/notifications',
  '/api/webhooks/sanity',
  '/api/admin/me',
  '/api/admin/dashboard',
  '/api/admin/audit',
  '/api/admin/notifications',
  '/api/admin/media/upload',
  '/api/admin/redirects/validate',
  '/api/admin/seo/urls',
  '/api/admin/seo/page-status',
  '/api/admin/homepage/sync-featured-characters',
  '/api/admin/ai-verdict/generate',
  '/api/admin/ai-verdict/usage',
  '/api/admin/ai-verdict/notes',
  '/api/admin/ai-pricing/extract',
  '/api/admin/ai-alt-text/generate',
  '/api/admin/affiliate-links/check',
];

const API_PATTERNS = [
  '/api/admin/products/{id}/publish',
  '/api/admin/products/{id}/slug',
  '/api/admin/products/{id}/score-history',
  '/api/admin/test-runs/{id}/publish',
  '/api/admin/test-runs/{id}/calculate',
  '/api/admin/test-runs/{id}/impact',
  '/api/admin/test-runs/{id}/export',
  '/api/admin/test-runs/{id}/structure',
  '/api/admin/roundups/{id}/rank',
  '/api/admin/affiliate-links/{id}/destination',
  '/api/admin/data/{entity}',
  '/api/admin/data/{entity}/{id}',
  '/api/admin/data/{entity}/{id}/restore',
  '/api/admin/ai-verdict/suggestions/{id}',
  '/api/admin/ai-verdict/suggestions/{id}/insert',
  '/api/admin/ai-verdict/suggestions/{id}/reject',
];

// ---------------------------------------------------------------------------
// Issue catalog
// ---------------------------------------------------------------------------

const ISSUE_LABELS: Record<string, { label: string; severity: IssueSeverity }> = {
  'missing-title': { label: 'Missing SEO title', severity: 'error' },
  'missing-description': { label: 'Missing meta description', severity: 'error' },
  'title-too-long': { label: 'SEO title over 60 characters', severity: 'warning' },
  'title-too-short': { label: 'SEO title under 30 characters', severity: 'warning' },
  'duplicate-title': { label: 'Duplicate SEO title', severity: 'warning' },
  'canonical-points-to-redirect': { label: 'Canonical points to a redirect', severity: 'error' },
  'canonical-target-unknown': { label: 'Canonical target is not a known page', severity: 'warning' },
  'canonical-trailing-slash': { label: 'Canonical differs only by trailing slash', severity: 'warning' },
  'redirect-in-sitemap': { label: 'Redirect submitted to Google', severity: 'error' },
  'draft-in-sitemap': { label: 'Draft page submitted to Google', severity: 'error' },
  'noindex-in-sitemap': { label: 'Hidden page submitted to Google', severity: 'error' },
  'no-page-file': { label: 'Published record has no public page route', severity: 'warning' },
  'redirect-self': { label: 'Redirect source equals destination', severity: 'error' },
  'redirect-loop': { label: 'Redirect loop', severity: 'error' },
  'redirect-chain': { label: 'Redirect chain (destination is redirected again)', severity: 'warning' },
  'redirect-dest-unknown': { label: 'Redirect destination is not a known page', severity: 'warning' },
  'redirect-to-home': { label: 'Redirect may be unrelated', severity: 'warning' },
  'redirect-duplicate': { label: 'Duplicate redirect rules for the same source', severity: 'error' },
  'redirect-temporary': { label: '302 used for an internal move (should be 301?)', severity: 'warning' },
  'duplicate-url-variant': { label: 'Duplicate URL version', severity: 'warning' },
};

export function issueMeta(code: string): { label: string; severity: IssueSeverity } {
  return ISSUE_LABELS[code] ?? { label: code, severity: 'warning' };
}


function makeIssue(code: string, detail?: string): RegistryIssue {
  const { label, severity } = issueMeta(code);
  return { code, label, severity, detail };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(path: string): string {
  return pathMatchKey(path);
}

/** Canonical registry path — trailing slash on public HTML routes. */
function registryPath(path: string, status: RegistryStatus): string {
  if (path.includes('?')) return path;
  if (status === 'api' || status === 'admin' || status === 'affiliate') return path;
  return publicPagePath(path);
}

function isExternal(url: string): boolean {
  return /^https?:\/\//.test(url);
}

/** Beginner-friendly page type label ("no vague words like Hub"). */
function friendlyPageType(row: Pick<RegistryUrl, 'path' | 'contentType' | 'status'>): string {
  if (row.status === 'redirect' || row.status === 'legacy') return 'Redirect';
  if (row.status === 'affiliate') return 'Affiliate link';
  if (row.status === 'api') return 'API route';
  if (row.status === 'admin') return 'Admin page';
  if (row.contentType === 'review-preview' || row.contentType === 'guide-preview') return 'Preview page';

  const p = normalize(row.path.split('#')[0].split('?')[0]);
  const BY_PATH: Record<string, string> = {
    '/': 'Homepage',
    '/ai-girlfriend-apps/': 'App Directory',
    '/reviews/': 'Reviews page',
    '/guides/': 'Guides page',
    '/test/': 'Testing page',
    '/test/all/': 'All Tests page',
    '/legal/': 'Legal',
    '/editorial-guidelines/': 'Editorial Guidelines',
    '/about/': 'About',
    '/contact/': 'Contact',
    '/sitemap/': 'HTML Sitemap',
    '/sitemap.xml': 'XML Sitemap',
  };
  if (BY_PATH[p]) return BY_PATH[p];

  switch (row.contentType) {
    case 'review':
      return 'Review';
    case 'guide':
      return 'Guide';
    case 'roundup':
      return 'Roundup';
    case 'test-category':
    case 'test-subscore':
    case 'test-hub':
    case 'test-archive':
    case 'methodology':
      return 'Methodology';
    case 'author':
      return 'Author';
    case 'legal':
      return 'Legal';
    case 'company':
      return 'Company page';
    case 'directory':
      return 'App Directory';
    case 'home':
      return 'Homepage';
    case 'utility':
      return 'HTML Sitemap';
    default:
      return 'Page';
  }
}

function viewFor(row: Pick<RegistryUrl, 'path' | 'contentType' | 'status' | 'pageType'>): RegistryView {
  if (row.status === 'redirect' || row.status === 'legacy') return 'redirects';
  if (row.status === 'admin' || row.status === 'api' || row.status === 'affiliate') return 'technical';
  if (row.status === 'preview' || row.pageType === 'Preview page') return 'technical';
  if (row.pageType === 'XML Sitemap') return 'technical';
  if (row.path.includes('{')) return 'technical';
  return 'search';
}

function accessFor(row: Pick<RegistryUrl, 'path' | 'status'>): 'public' | 'authenticated' {
  if (row.status === 'admin') return 'authenticated';
  if (row.path.startsWith('/api/admin')) return 'authenticated';
  return 'public';
}

// ---------------------------------------------------------------------------
// Registry builder
// ---------------------------------------------------------------------------

interface DbProduct {
  id: string;
  slug: string;
  name?: string;
  status?: string;
  deletedAt?: number | null;
  updatedAt?: number;
  seoTitle?: string;
  seoDescription?: string;
  h1Override?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

interface DbRoundup {
  id: string;
  slug: string;
  title?: string;
  status?: string;
  updatedAt?: number;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

interface DbAffiliateLink {
  id: string;
  cloakedSlug?: string;
  label?: string;
  active?: boolean;
}

interface DbRedirect {
  id: string;
  sourcePath: string;
  destinationPath: string;
  active?: boolean;
  redirectType?: number;
  createdAt?: number;
  notes?: string;
}

interface DbTestRun {
  id: string;
  status?: string;
}

export async function buildUrlRegistry(): Promise<UrlRegistry> {
  const siteOrigin = publicSiteOrigin();

  const rows: RegistryUrl[] = [];
  const byPath = new Map<string, RegistryUrl>();

  type AddRow = Omit<RegistryUrl, 'indexing' | 'issues' | 'pageType' | 'view' | 'access'> & {
    indexing?: RegistryIndexing;
  };

  /**
   * Dedupe key: trailing-slash variants of the same page collapse into one row
   * (Astro serves both). Redirect rows are keyed separately so a redirect
   * source never merges with a real page.
   */
  function keyFor(path: string, status: RegistryStatus): string {
    const isRedirect = status === 'redirect' || status === 'legacy';
    const base = path.includes('?') ? path : normalize(path);
    return isRedirect ? `r:${base}` : base;
  }

  function add(row: AddRow) {
    const path = registryPath(row.path, row.status);
    const rowCanon = { ...row, path };
    const key = keyFor(path, row.status);
    const existing = byPath.get(key);
    if (existing) {
      // Merge enrichment onto the first-seen row.
      if (rowCanon.recordStatus && !existing.recordStatus) existing.recordStatus = rowCanon.recordStatus;
      if (rowCanon.destination && !existing.destination) existing.destination = rowCanon.destination;
      if (rowCanon.notes && !existing.notes) existing.notes = rowCanon.notes;
      if (rowCanon.inXmlSitemap !== undefined && existing.inXmlSitemap === undefined) {
        existing.inXmlSitemap = rowCanon.inXmlSitemap;
      }
      if (rowCanon.sitemapSection && !existing.sitemapSection) existing.sitemapSection = rowCanon.sitemapSection;
      if (rowCanon.sourceFile && !existing.sourceFile) existing.sourceFile = rowCanon.sourceFile;
      if (rowCanon.sections?.length && !existing.sections?.length) existing.sections = rowCanon.sections;
      return;
    }
    const partial = { ...rowCanon, indexing: rowCanon.indexing ?? ('unknown' as RegistryIndexing) };
    const pageType = friendlyPageType(partial);
    const full: RegistryUrl = {
      ...partial,
      pageType,
      view: viewFor({ ...partial, pageType }),
      access: accessFor(partial),
      issues: [],
    };
    byPath.set(key, full);
    rows.push(full);
  }

  // --- Static filesystem routes ---------------------------------------------
  for (const page of STATIC_PAGES) {
    add({
      path: page.path,
      title: page.title,
      contentType: page.contentType,
      source: 'code',
      sourceDetail: 'filesystem',
      sourceFile: page.sourceFile,
      status: 'published',
      notes: page.notes,
    });
  }
  for (const page of PREVIEW_PAGES) {
    add({
      path: page.path,
      title: page.title,
      contentType: page.contentType,
      source: 'code',
      sourceDetail: 'filesystem',
      sourceFile: page.sourceFile,
      status: 'preview',
      notes: page.notes,
    });
  }

  // Authors (file-based)
  for (const author of Object.values(authors)) {
    add({
      path: author.profileUrl,
      title: author.name,
      contentType: 'author',
      source: 'code',
      sourceDetail: 'src/data/authors.ts',
      sourceFile: 'src/pages/author/[slug].astro',
      status: 'published',
    });
  }

  // Test methodology tree (generated from file data)
  for (const cat of getTestCategories()) {
    add({
      path: cat.href,
      title: `${cat.name} Testing Methodology`,
      contentType: 'test-category',
      source: 'generated',
      sourceDetail: 'src/data/aura-ai-categories.ts',
      sourceFile: 'src/pages/test/[category]/index.astro',
      status: 'published',
    });

    for (const sub of cat.subscores) {
      // Contributor jump links are sections of the subscore page, not URLs.
      const sectionAnchors = sub.contributors
        .map((c) => {
          const hash = c.href.split('#')[1];
          return hash ? `#${hash}` : null;
        })
        .filter((s): s is string => Boolean(s));

      add({
        path: sub.href,
        title: `${sub.name} — ${cat.name}`,
        contentType: 'test-subscore',
        source: 'generated',
        sourceDetail: 'src/data/aura-ai-categories.ts',
        sourceFile: 'src/pages/test/[category]/[subscore]/index.astro',
        status: 'published',
        sections: sectionAnchors,
      });
    }
  }

  // --- InstantDB content ------------------------------------------------------
  const suggestedRedirects: SuggestedRedirect[] = [];
  let dbRedirects: DbRedirect[] = [];
  let dbProducts: DbProduct[] = [];

  if (isDbConfigured()) {
    const db = getDb();

    try {
      const result = await (db.query as any)({ products: { $: { where: {} } } });
      dbProducts = result.products as DbProduct[];

      for (const product of dbProducts) {
        if (product.deletedAt) continue;
        const slug = product.slug;
        const name = product.name ?? slug;
        const status = product.status ?? 'unknown';
        const isPublished = status === 'published';

        add({
          path: `/reviews/${slug}`,
          title: `${name} Review`,
          contentType: 'review',
          source: 'instantdb',
          sourceDetail: 'instantdb:products',
          status: isPublished ? 'published' : 'draft',
          recordStatus: status,
          // Review tab bar — jump links within the same page, not separate URLs.
          sections: ['#overview', '#ratings', '#review', '#photos', '#pricing'],
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          h1Override: product.h1Override,
          canonicalUrl: product.canonicalUrl,
          noindexFlag: product.noindex,
          nofollowFlag: product.nofollow,
          ogTitle: product.ogTitle,
          ogDescription: product.ogDescription,
          ogImage: product.ogImageUrl,
          updatedAt: product.updatedAt,
          entity: 'products',
          recordId: product.id,
          editHref: `/products/${product.id}/seo`,
          notes: isPublished ? 'Live review page' : 'Returns 404 on live route until published',
        });

        add({
          path: `/reviews/preview/${slug}`,
          title: `${name} Preview`,
          contentType: 'review-preview',
          source: 'instantdb',
          sourceDetail: 'instantdb:products',
          sourceFile: 'src/pages/reviews/preview/[slug].astro',
          status: 'preview',
          recordStatus: status,
          entity: 'products',
          recordId: product.id,
          editHref: `/products/${product.id}/seo`,
          notes: 'Editor preview — any product status, forced noindex',
        });

        for (const tab of ['setup', 'pricing', 'testing', 'verdict', 'review', 'media', 'characters', 'seo', 'publish'] as const) {
          add({
            path: `/admin/products/${product.id}/${tab}`,
            title: `${name} — ${tab}`,
            contentType: 'admin-product-workspace',
            source: 'instantdb',
            sourceDetail: 'instantdb:products',
            status: 'admin',
            recordStatus: status,
          });
        }
        add({
          path: `/admin/products/${product.id}`,
          title: `${name} workspace`,
          contentType: 'admin-product-workspace',
          source: 'instantdb',
          sourceDetail: 'instantdb:products',
          status: 'admin',
          recordStatus: status,
        });
      }

      // Deleted products with no redirect → suggested redirects (Phase 1 source)
      const liveSlugs = new Set(dbProducts.filter((p) => !p.deletedAt).map((p) => p.slug));
      for (const product of dbProducts) {
        if (!product.deletedAt || !product.slug || liveSlugs.has(product.slug)) continue;
        suggestedRedirects.push({
          sourcePath: `/reviews/${product.slug}`,
          suggestedDestination: '/ai-girlfriend-apps',
          reason: `Product "${product.name ?? product.slug}" was deleted — old review URL now 404s`,
        });
      }
    } catch (error) {
      console.warn('[urlRegistry] products query failed:', error);
    }

    try {
      const { roundups } = await (db.query as any)({ roundups: { $: { where: {} } } });
      for (const roundup of roundups as DbRoundup[]) {
        const slug = roundup.slug;
        const title = roundup.title ?? slug;
        const status = roundup.status ?? 'unknown';
        const isPublished = status === 'published';
        const hasPageFile = slug === 'ai-girlfriend';

        add({
          path: `/best/${slug}`,
          title,
          contentType: 'roundup',
          source: 'instantdb',
          sourceDetail: 'instantdb:roundups',
          sourceFile: hasPageFile ? 'src/pages/best/ai-girlfriend.astro' : undefined,
          status: isPublished && hasPageFile ? 'published' : 'draft',
          recordStatus: status,
          seoTitle: roundup.seoTitle,
          seoDescription: roundup.seoDescription,
          canonicalUrl: roundup.canonicalUrl,
          noindexFlag: roundup.noindex,
          ogTitle: roundup.ogTitle,
          ogDescription: roundup.ogDescription,
          ogImage: roundup.ogImageUrl,
          updatedAt: roundup.updatedAt,
          entity: 'roundups',
          recordId: roundup.id,
          editHref: `/content/roundups/${roundup.id}`,
          notes: hasPageFile
            ? 'Public page exists'
            : 'No public page file — only /best/ai-girlfriend.astro exists today',
        });
      }
    } catch (error) {
      console.warn('[urlRegistry] roundups query failed:', error);
    }

    try {
      const { affiliateLinks } = await (db.query as any)({ affiliateLinks: { $: { where: {} } } });
      for (const link of affiliateLinks as DbAffiliateLink[]) {
        if (!link.cloakedSlug) continue;
        add({
          path: `/go/${link.cloakedSlug}`,
          title: link.label ?? link.cloakedSlug,
          contentType: 'affiliate-cloak',
          source: 'instantdb',
          sourceDetail: 'instantdb:affiliateLinks',
          sourceFile: 'src/pages/go/[slug].ts',
          status: 'affiliate',
          recordStatus: link.active ? 'active' : 'inactive',
          entity: 'affiliateLinks',
          recordId: link.id,
          notes: '302 outbound redirect, noindex',
        });
      }
    } catch (error) {
      console.warn('[urlRegistry] affiliateLinks query failed:', error);
    }

    try {
      const result = await (db.query as any)({ redirects: { $: { where: {} } } });
      dbRedirects = result.redirects as DbRedirect[];
      for (const redirect of dbRedirects) {
        add({
          path: redirect.sourcePath.startsWith('/') ? redirect.sourcePath : `/${redirect.sourcePath}`,
          title: `Redirect: ${redirect.sourcePath}`,
          contentType: 'redirect',
          source: 'redirect-map',
          sourceDetail: 'instantdb:redirects',
          status: 'redirect',
          recordStatus: redirect.active ? 'active' : 'inactive',
          destination: redirect.destinationPath,
          redirectType: redirect.redirectType ?? 301,
          redirectActive: redirect.active,
          updatedAt: redirect.createdAt,
          entity: 'redirects',
          recordId: redirect.id,
          editHref: '/seo/redirects',
          notes: `${redirect.redirectType ?? 301} via [...fallback].ts`,
        });
      }
    } catch (error) {
      console.warn('[urlRegistry] redirects query failed:', error);
    }

    try {
      const { testRuns } = await (db.query as any)({ testRuns: { $: { where: {} } } });
      for (const run of testRuns as DbTestRun[]) {
        add({
          path: `/admin/testing/runs/${run.id}`,
          title: `Test run ${run.id.slice(0, 8)}…`,
          contentType: 'admin-test-run',
          source: 'instantdb',
          sourceDetail: 'instantdb:testRuns',
          status: 'admin',
          recordStatus: run.status,
        });
      }
    } catch (error) {
      console.warn('[urlRegistry] testRuns query failed:', error);
    }
  } else {
    for (const product of fileProducts) {
      add({
        path: `/reviews/${product.slug}`,
        title: `${product.name} Review`,
        contentType: 'review',
        source: 'code',
        sourceDetail: 'src/data/products.ts (file fallback)',
        status: 'published',
      });
      add({
        path: `/reviews/preview/${product.slug}`,
        title: `${product.name} Preview`,
        contentType: 'review-preview',
        source: 'code',
        sourceDetail: 'src/data/products.ts (file fallback)',
        status: 'preview',
      });
    }
  }

  // --- Sitemap registry (fills gaps + marks sitemap membership) --------------
  const publishedProducts = await loadPublishedProducts(fileProducts);
  const publishedRoundups = await loadPublishedRoundupSummaries();
  const sitemapEntries = getAllSitemapEntries({
    products: publishedProducts,
    roundups: publishedRoundups,
  });

  for (const entry of sitemapEntries) {
    add({
      path: entry.url,
      title: entry.title,
      contentType: entry.contentType,
      source: 'code',
      sourceDetail: 'src/lib/sitemap.ts',
      status: entry.includeInXmlSitemap ? 'published' : 'noindex',
      inXmlSitemap: entry.includeInXmlSitemap,
      sitemapSection: entry.includeInXmlSitemap ? childSitemapFor(entry) : undefined,
    });
  }

  // --- Sanity guides ----------------------------------------------------------
  if (isSanityConfigured()) {
    try {
      const publishedGuides = await sanityQuery<{ title: string; slug: string; noindex?: boolean }[]>(
        `*[_type == "guide" && defined(slug.current)]{ title, "slug": slug.current, noindex }`,
      );
      for (const guide of publishedGuides) {
        add({
          path: `/guides/${guide.slug}`,
          title: guide.title,
          contentType: 'guide',
          source: 'sanity',
          sourceDetail: 'sanity:published',
          sourceFile: 'src/pages/guides/[slug].astro',
          status: guide.noindex ? 'noindex' : 'published',
          noindexFlag: guide.noindex,
          inXmlSitemap: !guide.noindex,
        });
      }
    } catch (error) {
      console.warn('[urlRegistry] Sanity published guides failed:', error);
    }

    if (process.env.SANITY_API_READ_TOKEN) {
      try {
        const draftGuides = await sanityQuery<{ title: string; slug: string }[]>(
          `*[_type == "guide" && defined(slug.current)]{ title, "slug": slug.current }`,
          {},
          { drafts: true },
        );
        for (const guide of draftGuides) {
          add({
            path: `/guides/preview?slug=${guide.slug}`,
            title: `${guide.title} (draft preview)`,
            contentType: 'guide-preview',
            source: 'sanity',
            sourceDetail: 'sanity:drafts',
            status: 'preview',
            notes: 'Requires SANITY_PREVIEW_SECRET query param',
          });
        }
      } catch (error) {
        console.warn('[urlRegistry] Sanity draft guides failed:', error);
      }
    }
  }

  // --- Admin static + API routes -----------------------------------------------
  for (const path of ADMIN_STATIC) {
    add({
      path,
      title: path.replace('/admin/', '').replace(/\//g, ' › ') || 'Admin dashboard',
      contentType: 'admin',
      source: 'code',
      sourceDetail: 'src/components/admin/Layout.tsx',
      sourceFile: 'src/components/admin/Layout.tsx',
      status: 'admin',
      notes: 'SPA route — noindex',
    });
  }
  for (const path of API_ROUTES) {
    add({
      path,
      title: path.replace('/api/', ''),
      contentType: 'api',
      source: 'code',
      sourceDetail: 'src/pages/api',
      status: 'api',
    });
  }
  for (const path of API_PATTERNS) {
    add({
      path,
      title: path,
      contentType: 'api-pattern',
      source: 'code',
      sourceDetail: 'src/pages/api',
      status: 'api',
      notes: 'Route template — expand per entity ID in migration tooling',
    });
  }

  // ---------------------------------------------------------------------------
  // Apply admin page overrides (draft = served as 404, out of the sitemap)
  // ---------------------------------------------------------------------------
  const pageOverrides = await getPageOverrides(true);
  for (const row of rows) {
    if (row.view !== 'search') continue;
    const override = pageOverrides[normalizeOverridePath(row.path)];
    if (override?.status === 'draft') {
      row.status = 'draft';
      row.draftOverride = true;
      row.inXmlSitemap = false;
      row.sitemapSection = undefined;
      row.notes = 'Set to draft in the admin — served as 404, excluded from sitemaps';
      row.updatedAt = override.updatedAt;
    }
  }

  // ---------------------------------------------------------------------------
  // Derive indexing + detect issues
  // ---------------------------------------------------------------------------

  // Known "real page" paths (non-redirect rows), normalized without trailing slash.
  const pagePaths = new Set<string>();
  for (const row of rows) {
    if (row.status === 'redirect' || row.status === 'legacy') continue;
    pagePaths.add(normalize(row.path.split('#')[0]));
  }

  // Active redirect map (normalized source → destination) for chain/loop checks.
  const redirectMap = new Map<string, string>();
  for (const row of rows) {
    if ((row.status === 'redirect' || row.status === 'legacy') && row.destination && row.redirectActive !== false) {
      redirectMap.set(normalize(row.path), row.destination);
    }
  }

  function canonicalPath(canonicalUrl: string): string | null {
    if (!canonicalUrl) return null;
    if (isExternal(canonicalUrl)) {
      try {
        const u = new URL(canonicalUrl);
        if (`${u.protocol}//${u.host}` !== siteOrigin) return null; // external canonical — not checkable
        return u.pathname;
      } catch {
        return null;
      }
    }
    return canonicalUrl;
  }

  for (const row of rows) {
    // Indexing derivation
    if (row.status === 'admin' || row.status === 'api') {
      row.indexing = 'blocked';
    } else if (
      row.status === 'redirect' ||
      row.status === 'legacy' ||
      row.status === 'affiliate' ||
      row.status === 'draft' ||
      row.status === 'preview' ||
      row.status === 'noindex' ||
      row.noindexFlag
    ) {
      row.indexing = 'noindex';
    } else if (row.canonicalUrl) {
      const cp = canonicalPath(row.canonicalUrl);
      if (cp !== null && normalize(cp) !== normalize(row.path)) {
        row.indexing = 'canonicalized';
      } else if (cp === null) {
        row.indexing = 'canonicalized'; // external canonical
      } else {
        row.indexing = 'index';
      }
    } else {
      row.indexing = 'index';
    }

    // Two registered URL versions of the same page (with/without trailing slash)
    // — eliminated by registryPath() canonicalization; no issue emitted.

    // Content checks (only for editable DB pages with public routes)
    if (row.status === 'published' && (row.entity === 'products' || row.entity === 'roundups')) {
      if (!row.seoTitle) row.issues.push(makeIssue('missing-title'));
      else {
        if (row.seoTitle.length > 60) row.issues.push(makeIssue('title-too-long'));
        if (row.seoTitle.length < 30) row.issues.push(makeIssue('title-too-short'));
      }
      if (!row.seoDescription) row.issues.push(makeIssue('missing-description'));

      if (row.canonicalUrl) {
        const cp = canonicalPath(row.canonicalUrl);
        if (cp !== null) {
          const np = normalize(cp);
          if (redirectMap.has(np)) {
            row.issues.push(makeIssue('canonical-points-to-redirect'));
          } else if (!pagePaths.has(np)) {
            row.issues.push(makeIssue('canonical-target-unknown'));
          }
        }
      }
    }

    // Roundup without a public page route
    if (row.entity === 'roundups' && row.recordStatus === 'published' && !row.sourceFile) {
      row.issues.push(makeIssue('no-page-file'));
    }

    // Sitemap consistency
    if (row.inXmlSitemap) {
      if (row.status === 'redirect' || row.status === 'legacy') row.issues.push(makeIssue('redirect-in-sitemap'));
      if (row.status === 'draft' || row.status === 'preview') row.issues.push(makeIssue('draft-in-sitemap'));
      if (row.indexing === 'noindex' && row.status === 'published') {
        row.issues.push(
          makeIssue(
            'noindex-in-sitemap',
            `${row.path} tells Google not to index it, but it is still submitted in the sitemap. Publish it properly or it will be dropped from the sitemap automatically.`,
          ),
        );
      }
    }

    // Redirect checks
    if ((row.status === 'redirect' || row.status === 'legacy') && row.destination) {
      const source = normalize(row.path);
      const destExternal = isExternal(row.destination);
      const dest = destExternal ? row.destination : normalize(row.destination.split('#')[0]);

      if (!destExternal && source === dest) {
        row.issues.push(makeIssue('redirect-self'));
      } else if (!destExternal) {
        // Follow the chain to detect loops/chains
        const seen = new Set<string>([source]);
        let cursor = dest;
        let hops = 0;
        let looped = false;
        while (redirectMap.has(cursor)) {
          const nextRaw = redirectMap.get(cursor)!;
          if (isExternal(nextRaw)) break;
          const next = normalize(nextRaw.split('#')[0]);
          hops += 1;
          if (seen.has(next) || hops > 10) {
            looped = true;
            break;
          }
          seen.add(next);
          cursor = next;
        }
        if (looped) row.issues.push(makeIssue('redirect-loop'));
        else if (hops > 0) row.issues.push(makeIssue('redirect-chain'));

        if (!looped && !pagePaths.has(cursor)) {
          row.issues.push(makeIssue('redirect-dest-unknown'));
        }
        if (dest === '/') {
          row.issues.push(
            makeIssue(
              'redirect-to-home',
              `${row.path} redirects to the homepage, which may not answer the original request.`,
            ),
          );
        }
      }

      if (row.entity === 'redirects' && row.redirectType === 302 && !destExternal) {
        row.issues.push(makeIssue('redirect-temporary'));
      }
    }
  }

  // Duplicate redirect sources ('/x' vs '/x/' after normalization)
  const redirectSources = new Map<string, RegistryUrl[]>();
  for (const row of rows) {
    if (row.status !== 'redirect' || row.redirectActive === false) continue;
    const key = normalize(row.path);
    const list = redirectSources.get(key) ?? [];
    list.push(row);
    redirectSources.set(key, list);
  }
  for (const list of redirectSources.values()) {
    if (list.length > 1) {
      for (const row of list) row.issues.push(makeIssue('redirect-duplicate'));
    }
  }

  // Duplicate SEO titles across indexable published pages
  const titleMap = new Map<string, RegistryUrl[]>();
  for (const row of rows) {
    if (row.indexing !== 'index' || !row.seoTitle) continue;
    const key = row.seoTitle.trim().toLowerCase();
    const list = titleMap.get(key) ?? [];
    list.push(row);
    titleMap.set(key, list);
  }
  for (const list of titleMap.values()) {
    if (list.length > 1) {
      for (const row of list) row.issues.push(makeIssue('duplicate-title'));
    }
  }

  // ---------------------------------------------------------------------------
  // Summary + issue groups
  // ---------------------------------------------------------------------------

  const searchRows = rows.filter((r) => r.view === 'search');
  const summary: RegistrySummary = {
    searchPages: searchRows.length,
    indexable: searchRows.filter((r) => r.indexing === 'index').length,
    noindex: searchRows.filter((r) => r.indexing === 'noindex').length,
    needsAttention: rows.filter((r) => r.issues.length > 0).length,
    redirects: rows.filter((r) => r.view === 'redirects').length,
    notFound: rows.filter((r) => r.issues.some((i) => i.code === 'redirect-dest-unknown')).length,
    totalUrls: rows.length,
  };

  const groupMap = new Map<string, IssueGroup & { viewCounts: Record<RegistryView, number> }>();
  for (const row of rows) {
    for (const issue of row.issues) {
      const group = groupMap.get(issue.code) ?? {
        code: issue.code,
        label: issue.label,
        severity: issue.severity,
        count: 0,
        paths: [],
        view: 'search' as RegistryView,
        viewCounts: { search: 0, redirects: 0, technical: 0 },
      };
      group.count += 1;
      group.viewCounts[row.view] += 1;
      if (group.paths.length < 50) group.paths.push(row.path);
      groupMap.set(issue.code, group);
    }
  }
  const issueGroups: IssueGroup[] = [...groupMap.values()]
    .map(({ viewCounts, ...group }) => ({
      ...group,
      view: (Object.entries(viewCounts).sort((a, b) => b[1] - a[1])[0][0] as RegistryView) ?? 'search',
    }))
    .sort((a, b) =>
      a.severity === b.severity ? b.count - a.count : a.severity === 'error' ? -1 : 1,
    );

  // Drop suggestions already covered by an active redirect
  const activeSources = new Set([...redirectMap.keys()]);
  const filteredSuggestions = suggestedRedirects.filter((s) => !activeSources.has(normalize(s.sourcePath)));

  // robots.txt (best-effort read; static file)
  let robotsTxt: string | null = null;
  try {
    robotsTxt = readFileSync(resolve(process.cwd(), 'public/robots.txt'), 'utf8');
  } catch {
    robotsTxt = null;
  }

  const STATUS_RANK: Record<RegistryStatus, number> = {
    published: 0,
    noindex: 1,
    draft: 2,
    preview: 3,
    redirect: 4,
    legacy: 5,
    affiliate: 6,
    admin: 7,
    api: 8,
  };
  rows.sort((a, b) => {
    const s = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (s !== 0) return s;
    return a.path.localeCompare(b.path);
  });

  return {
    generatedAt: new Date().toISOString(),
    siteOrigin,
    urls: rows,
    summary,
    issueGroups,
    suggestedRedirects: filteredSuggestions,
    robotsTxt,
  };
}
