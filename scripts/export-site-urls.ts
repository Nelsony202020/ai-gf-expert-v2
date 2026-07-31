#!/usr/bin/env npx tsx
/**
 * Full site URL export for migration planning.
 *
 * Includes published pages, drafts/previews, redirects, affiliate cloaks,
 * admin routes, API endpoints, legacy paths, and test methodology URLs.
 *
 * Usage:
 *   npx tsx scripts/export-site-urls.ts
 *   npm run export:urls
 *
 * Outputs (project root):
 *   site-url-export.json
 *   site-url-export.csv
 *   site-url-export.md
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getAllSitemapEntries } from '../src/lib/sitemap';
import { getTestCategories } from '../src/lib/test-framework';
import { loadPublishedProducts } from '../src/lib/content/store';
import { isDbConfigured, getDb } from '../src/lib/db/server';
import { isSanityConfigured, sanityQuery } from '../src/lib/sanity/client';
import { authors } from '../src/data/authors';
import { products as fileProducts } from '../src/data/products';
import { buyingGuideSlug } from '../src/data/buying-guide-content';

type Visibility =
  | 'published'
  | 'draft'
  | 'preview'
  | 'redirect'
  | 'affiliate'
  | 'admin'
  | 'api'
  | 'noindex'
  | 'legacy';

type MigrationCategory =
  | 'public-live'
  | 'public-noindex'
  | 'preview-draft'
  | 'redirect'
  | 'affiliate'
  | 'admin'
  | 'api'
  | 'legacy';

interface UrlRow {
  path: string;
  title: string;
  migrationCategory: MigrationCategory;
  contentType: string;
  visibility: Visibility;
  source: string;
  status?: string;
  destination?: string;
  inXmlSitemap?: boolean;
  notes?: string;
}

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const rawOrigin = process.env.PUBLIC_SITE_URL || 'https://aigirlfriend.expert';
const SITE_ORIGIN = (
  rawOrigin.includes('localhost') ? 'https://aigirlfriend.expert' : rawOrigin
).replace(/\/$/, '');

const rows: UrlRow[] = [];
const seen = new Set<string>();

function add(row: UrlRow) {
  const existing = rows.find((r) => r.path === row.path);
  if (existing) {
    if (row.status && !existing.status) existing.status = row.status;
    if (row.destination && !existing.destination) existing.destination = row.destination;
    if (row.notes && !existing.notes) existing.notes = row.notes;
    if (row.migrationCategory === 'preview-draft' && existing.migrationCategory === 'public-live') {
      // Keep public-live for published; preview rows are separate paths
    }
    return;
  }
  seen.add(row.path);
  rows.push(row);
}

function addMany(items: UrlRow[]) {
  for (const item of items) add(item);
}

// ---------------------------------------------------------------------------
// Astro config redirects
// ---------------------------------------------------------------------------

const ASTRO_REDIRECTS: Record<string, string> = {
  '/terms-of-service': '/legal/terms',
  '/terms-of-service/privacy-policy': '/legal/privacy',
  '/terms-of-service/affiliate-disclosure': '/legal/affiliate-disclosure',
  '/terms-of-service/accessibility': '/legal/accessibility',
  '/guides/how-to-choos-an-ai-girlfriend-app': `/guides/${buyingGuideSlug}`,
  '/faq': '/',
  '/editorial-process': '/editorial-guidelines',
};

for (const [source, destination] of Object.entries(ASTRO_REDIRECTS)) {
  add({
    path: source,
    title: `Redirect: ${source}`,
    migrationCategory: 'redirect',
    contentType: 'redirect',
    visibility: 'redirect',
    source: 'astro.config.mjs',
    destination,
    notes: '301 redirect configured in Astro',
  });
}

// Page-level redirects
for (const [source, destination] of [
  ['/how-we-test', '/test/'],
  ['/apps', '/ai-girlfriend-apps'],
] as const) {
  add({
    path: source,
    title: `Redirect: ${source}`,
    migrationCategory: 'redirect',
    contentType: 'redirect',
    visibility: 'redirect',
    source: 'src/pages',
    destination,
    notes: '301 redirect page',
  });
}

// ---------------------------------------------------------------------------
// Static filesystem routes (always exist)
// ---------------------------------------------------------------------------

const STATIC_PAGES: { path: string; title: string; contentType: string; notes?: string }[] = [
  { path: '/', title: 'Home', contentType: 'home', notes: 'SSR at runtime' },
  { path: '/about', title: 'About Us', contentType: 'company' },
  { path: '/contact', title: 'Contact Us', contentType: 'company' },
  { path: '/editorial-guidelines', title: 'Editorial Guidelines', contentType: 'methodology' },
  { path: '/editorial-guidelines/', title: 'Editorial Guidelines', contentType: 'methodology' },
  { path: '/ai-girlfriend-apps', title: 'App Directory', contentType: 'directory', notes: 'Supports ?page= and ?sort= query params' },
  { path: '/reviews/', title: 'Reviews hub', contentType: 'hub' },
  { path: '/guides', title: 'Guides hub', contentType: 'hub' },
  { path: '/guides/', title: 'Guides hub', contentType: 'hub' },
  { path: `/guides/${buyingGuideSlug}`, title: 'How to Choose an AI Girlfriend App', contentType: 'guide' },
  { path: `/guides/${buyingGuideSlug}/`, title: 'How to Choose an AI Girlfriend App', contentType: 'guide' },
  { path: '/legal/', title: 'Legal hub', contentType: 'hub' },
  { path: '/legal/privacy', title: 'Privacy Policy', contentType: 'legal' },
  { path: '/legal/terms', title: 'Terms of Service', contentType: 'legal' },
  { path: '/legal/accessibility', title: 'Accessibility', contentType: 'legal' },
  { path: '/legal/copyright', title: 'Copyright Policy', contentType: 'legal' },
  { path: '/legal/disclaimer', title: 'Disclaimer', contentType: 'legal' },
  { path: '/legal/affiliate-disclosure', title: 'Affiliate Disclosure', contentType: 'legal' },
  { path: '/sitemap', title: 'HTML Sitemap', contentType: 'utility' },
  { path: '/sitemap.xml', title: 'XML Sitemap', contentType: 'utility' },
  { path: '/test/', title: 'How We Test', contentType: 'test-hub' },
  { path: '/test/all/', title: 'All Tests Directory', contentType: 'test-archive' },
  { path: '/test/tooltips/', title: 'How Score Tooltips Work', contentType: 'methodology' },
  { path: '/test/market-data/', title: 'Market Data Methodology', contentType: 'methodology' },
  { path: '/best/ai-girlfriend', title: 'Best AI Girlfriend Apps', contentType: 'roundup', notes: 'Only roundup with a public page file' },
  { path: '/guides/preview', title: 'Guide draft preview', contentType: 'guide-preview', notes: 'Requires ?secret= and ?slug= query params' },
];

for (const page of STATIC_PAGES) {
  add({
    path: page.path,
    title: page.title,
    migrationCategory: page.contentType.includes('preview') ? 'preview-draft' : 'public-live',
    contentType: page.contentType,
    visibility: page.contentType.includes('preview') ? 'preview' : 'published',
    source: 'filesystem',
    notes: page.notes,
  });
}

// Authors (file-based)
for (const author of Object.values(authors)) {
  add({
    path: author.profileUrl,
    title: author.name,
    migrationCategory: 'public-live',
    contentType: 'author',
    visibility: 'published',
    source: 'src/data/authors.ts',
  });
}

// Test methodology — categories, subscores, contributor anchors
for (const cat of getTestCategories()) {
  add({
    path: cat.href,
    title: `${cat.name} Testing Methodology`,
    migrationCategory: 'public-live',
    contentType: 'test-category',
    visibility: 'published',
    source: 'src/data/aura-ai-categories.ts',
  });

  for (const sub of cat.subscores) {
    add({
      path: sub.href,
      title: `${sub.name} — ${cat.name}`,
      migrationCategory: 'public-live',
      contentType: 'test-subscore',
      visibility: 'published',
      source: 'src/data/aura-ai-categories.ts',
    });

    for (const contributor of sub.contributors) {
      add({
        path: contributor.href,
        title: `${contributor.label} — ${sub.name}`,
        migrationCategory: 'public-live',
        contentType: 'test-contributor-anchor',
        visibility: 'published',
        source: 'src/lib/slugs.ts',
        notes: 'Hash anchor on subscore page',
      });

      // Legacy contributor URLs (redirect to anchor)
      const legacyBase = `/test/${cat.key}/${sub.slug}/${contributor.slug}`;
      for (const legacyPath of [legacyBase, `${legacyBase}/`, `/tests/${cat.key}/${sub.slug}/${contributor.slug}`, `/tests/${cat.key}/${sub.slug}/${contributor.slug}/`]) {
        add({
          path: legacyPath,
          title: `Legacy redirect: ${contributor.label}`,
          migrationCategory: 'legacy',
          contentType: 'test-contributor-legacy',
          visibility: 'legacy',
          source: 'src/pages/test/.../contributor.astro',
          destination: contributor.href,
          notes: '301 redirect to subscore anchor',
        });
      }
    }
  }

  // Legacy /tests/ prefix
  for (const suffix of [`${cat.key}/`, cat.key, `${cat.key}/${cat.subscores[0]?.slug}/`, `${cat.key}/${cat.subscores[0]?.slug}`]) {
    for (const prefix of ['/tests/', '/tests']) {
      const legacyPath = prefix === '/tests' ? `/tests/${suffix}`.replace(/\/$/, '') : `/tests/${suffix}`;
      add({
        path: legacyPath,
        title: `Legacy /tests/ redirect`,
        migrationCategory: 'legacy',
        contentType: 'test-legacy',
        visibility: 'legacy',
        source: 'src/pages/tests/[...path].astro',
        destination: `/test/${suffix}`.replace(/\/$/, '') + (suffix.endsWith('/') ? '/' : ''),
        notes: '301 redirect /tests → /test',
      });
    }
  }
}

// ---------------------------------------------------------------------------
// InstantDB — products, roundups, affiliates, redirects, admin entities
// ---------------------------------------------------------------------------

interface DbProduct {
  id: string;
  slug: string;
  name?: string;
  status?: string;
  deletedAt?: number | null;
}

interface DbRoundup {
  id: string;
  slug: string;
  title?: string;
  status?: string;
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
  statusCode?: number;
}

interface DbTestRun {
  id: string;
  status?: string;
}

if (isDbConfigured()) {
  const db = getDb();

  try {
    const { products: dbProducts } = await (db.query as any)({
      products: { $: { where: {} } },
    });

    for (const product of dbProducts as DbProduct[]) {
      if (product.deletedAt) continue;
      const slug = product.slug;
      const name = product.name ?? slug;
      const status = product.status ?? 'unknown';
      const isPublished = status === 'published';

      add({
        path: `/reviews/${slug}`,
        title: `${name} Review`,
        migrationCategory: isPublished ? 'public-live' : 'preview-draft',
        contentType: 'review',
        visibility: isPublished ? 'published' : 'draft',
        source: 'instantdb:products',
        status,
        notes: isPublished ? 'Live review page' : 'Returns 404 on live route until published',
      });

      add({
        path: `/reviews/preview/${slug}`,
        title: `${name} Preview`,
        migrationCategory: 'preview-draft',
        contentType: 'review-preview',
        visibility: 'preview',
        source: 'instantdb:products',
        status,
        notes: 'Editor preview — any product status',
      });

      // Admin workspace URLs per product
      for (const tab of ['setup', 'pricing', 'testing', 'verdict', 'review', 'media', 'characters', 'seo', 'publish'] as const) {
        add({
          path: `/admin/products/${product.id}/${tab}`,
          title: `${name} — ${tab}`,
          migrationCategory: 'admin',
          contentType: 'admin-product-workspace',
          visibility: 'admin',
          source: 'instantdb:products',
          status,
        });
      }
      add({
        path: `/admin/products/${product.id}`,
        title: `${name} workspace`,
        migrationCategory: 'admin',
        contentType: 'admin-product-workspace',
        visibility: 'admin',
        source: 'instantdb:products',
        status,
      });
    }
  } catch (error) {
    console.warn('[export] products query failed:', error);
  }

  try {
    const { roundups: dbRoundups } = await (db.query as any)({
      roundups: { $: { where: {} } },
    });

    for (const roundup of dbRoundups as DbRoundup[]) {
      const slug = roundup.slug;
      const title = roundup.title ?? slug;
      const status = roundup.status ?? 'unknown';
      const isPublished = status === 'published';
      const hasPageFile = slug === 'ai-girlfriend';

      add({
        path: `/best/${slug}`,
        title,
        migrationCategory: isPublished && hasPageFile ? 'public-live' : 'preview-draft',
        contentType: 'roundup',
        visibility: isPublished ? (hasPageFile ? 'published' : 'draft') : 'draft',
        source: 'instantdb:roundups',
        status,
        notes: hasPageFile
          ? 'Public page exists'
          : 'No public page file — only /best/ai-girlfriend.astro exists today',
      });

      add({
        path: `/admin/content/roundups/${roundup.id}`,
        title: `${title} (admin)`,
        migrationCategory: 'admin',
        contentType: 'admin-roundup',
        visibility: 'admin',
        source: 'instantdb:roundups',
        status,
        notes: 'Admin route redirects to dashboard — listed for completeness',
      });
    }
  } catch (error) {
    console.warn('[export] roundups query failed:', error);
  }

  try {
    const { affiliateLinks } = await (db.query as any)({
      affiliateLinks: { $: { where: {} } },
    });

    for (const link of affiliateLinks as DbAffiliateLink[]) {
      if (!link.cloakedSlug) continue;
      add({
        path: `/go/${link.cloakedSlug}`,
        title: link.label ?? link.cloakedSlug,
        migrationCategory: 'affiliate',
        contentType: 'affiliate-cloak',
        visibility: 'affiliate',
        source: 'instantdb:affiliateLinks',
        status: link.active ? 'active' : 'inactive',
        notes: '302 outbound redirect, noindex',
      });
    }
  } catch (error) {
    console.warn('[export] affiliateLinks query failed:', error);
  }

  try {
    const { redirects } = await (db.query as any)({
      redirects: { $: { where: {} } },
    });

    for (const redirect of redirects as DbRedirect[]) {
      add({
        path: redirect.sourcePath.startsWith('/') ? redirect.sourcePath : `/${redirect.sourcePath}`,
        title: `Redirect: ${redirect.sourcePath}`,
        migrationCategory: 'redirect',
        contentType: 'redirect',
        visibility: 'redirect',
        source: 'instantdb:redirects',
        status: redirect.active ? 'active' : 'inactive',
        destination: redirect.destinationPath,
        notes: `${redirect.statusCode ?? 301} via [...fallback].ts`,
      });
    }
  } catch (error) {
    console.warn('[export] redirects query failed:', error);
  }

  try {
    const { testRuns } = await (db.query as any)({
      testRuns: { $: { where: {} } },
    });

    for (const run of testRuns as DbTestRun[]) {
      add({
        path: `/admin/testing/runs/${run.id}`,
        title: `Test run ${run.id.slice(0, 8)}…`,
        migrationCategory: 'admin',
        contentType: 'admin-test-run',
        visibility: 'admin',
        source: 'instantdb:testRuns',
        status: run.status,
      });
    }
  } catch (error) {
    console.warn('[export] testRuns query failed:', error);
  }
} else {
  console.warn('[export] InstantDB not configured — skipping DB products, roundups, affiliates, redirects');
  for (const product of fileProducts) {
    add({
      path: `/reviews/${product.slug}`,
      title: `${product.name} Review`,
      migrationCategory: 'public-live',
      contentType: 'review',
      visibility: 'published',
      source: 'src/data/products.ts (file fallback)',
    });
    add({
      path: `/reviews/preview/${product.slug}`,
      title: `${product.name} Preview`,
      migrationCategory: 'preview-draft',
      contentType: 'review-preview',
      visibility: 'preview',
      source: 'src/data/products.ts (file fallback)',
    });
  }
}

// Sitemap registry (published public URLs — fills gaps after DB enrichment)
const publishedProducts = await loadPublishedProducts(fileProducts);
const sitemapEntries = getAllSitemapEntries(publishedProducts);

for (const entry of sitemapEntries) {
  add({
    path: entry.url,
    title: entry.title,
    migrationCategory: entry.includeInXmlSitemap ? 'public-live' : 'public-noindex',
    contentType: entry.contentType,
    visibility: entry.includeInXmlSitemap ? 'published' : 'noindex',
    source: 'src/lib/sitemap.ts',
    inXmlSitemap: entry.includeInXmlSitemap,
  });
}

// ---------------------------------------------------------------------------
// Sanity guides (published + drafts if token available)
// ---------------------------------------------------------------------------

if (isSanityConfigured()) {
  try {
    const publishedGuides = await sanityQuery<{ title: string; slug: string; noindex?: boolean }[]>(
      `*[_type == "guide" && defined(slug.current)]{ title, "slug": slug.current, noindex }`,
    );
    for (const guide of publishedGuides) {
      add({
        path: `/guides/${guide.slug}`,
        title: guide.title,
        migrationCategory: guide.noindex ? 'public-noindex' : 'public-live',
        contentType: 'guide',
        visibility: guide.noindex ? 'noindex' : 'published',
        source: 'sanity:published',
        inXmlSitemap: !guide.noindex,
      });
    }
  } catch (error) {
    console.warn('[export] Sanity published guides failed:', error);
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
          migrationCategory: 'preview-draft',
          contentType: 'guide-preview',
          visibility: 'preview',
          source: 'sanity:drafts',
          notes: 'Requires SANITY_PREVIEW_SECRET query param',
        });
      }
    } catch (error) {
      console.warn('[export] Sanity draft guides failed:', error);
    }
  }
}

// ---------------------------------------------------------------------------
// Admin static routes
// ---------------------------------------------------------------------------

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
  '/admin/seo/metadata',
  '/admin/seo/redirects',
  '/admin/seo/indexing',
  '/admin/monetization/affiliate-links',
  '/admin/administration/users',
  '/admin/administration/roles',
  '/admin/administration/audit',
];

for (const path of ADMIN_STATIC) {
  add({
    path,
    title: path.replace('/admin/', '').replace(/\//g, ' › ') || 'Admin dashboard',
    migrationCategory: 'admin',
    contentType: 'admin',
    visibility: 'admin',
    source: 'src/components/admin/Layout.tsx',
    notes: 'SPA route — noindex',
  });
}

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

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
  '/api/admin/homepage/sync-featured-characters',
  '/api/admin/ai-verdict/generate',
  '/api/admin/ai-verdict/usage',
  '/api/admin/ai-verdict/notes',
  '/api/admin/ai-pricing/extract',
  '/api/admin/ai-alt-text/generate',
  '/api/admin/affiliate-links/check',
];

for (const path of API_ROUTES) {
  add({
    path,
    title: path.replace('/api/', ''),
    migrationCategory: 'api',
    contentType: 'api',
    visibility: 'api',
    source: 'src/pages/api',
    notes: 'Dynamic segments like /api/admin/products/{id}/publish exist — see OpenAPI/admin usage',
  });
}

// Dynamic API patterns (documented, not expanded)
const API_PATTERNS = [
  '/api/admin/products/{id}/publish',
  '/api/admin/products/{id}/slug',
  '/api/admin/products/{id}/score-history',
  '/api/admin/test-runs/{id}/publish',
  '/api/admin/test-runs/{id}/calculate',
  '/api/admin/test-runs/{id}/impact',
  '/api/admin/test-runs/{id}/export',
  '/api/admin/roundups/{id}/rank',
  '/api/admin/affiliate-links/{id}/destination',
  '/api/admin/data/{entity}',
  '/api/admin/data/{entity}/{id}',
  '/api/admin/data/{entity}/{id}/restore',
  '/api/admin/ai-verdict/suggestions/{id}',
  '/api/admin/ai-verdict/suggestions/{id}/insert',
  '/api/admin/ai-verdict/suggestions/{id}/reject',
];

for (const path of API_PATTERNS) {
  add({
    path,
    title: path,
    migrationCategory: 'api',
    contentType: 'api-pattern',
    visibility: 'api',
    source: 'src/pages/api',
    notes: 'Route template — expand per entity ID in migration tooling',
  });
}

// ---------------------------------------------------------------------------
// Review tab fragments (same page, useful for migration)
// ---------------------------------------------------------------------------

for (const product of publishedProducts) {
  for (const fragment of ['overview', 'ratings', 'review', 'photos', 'pricing']) {
    add({
      path: `/reviews/${product.slug}#${fragment}`,
      title: `${product.name} — ${fragment} tab`,
      migrationCategory: 'public-live',
      contentType: 'review-tab',
      visibility: 'published',
      source: 'client tab bar',
      notes: 'Hash fragment — same document as /reviews/{slug}',
    });
  }
}

// ---------------------------------------------------------------------------
// Sort and write outputs
// ---------------------------------------------------------------------------

rows.sort((a, b) => {
  const cat = a.migrationCategory.localeCompare(b.migrationCategory);
  if (cat !== 0) return cat;
  return a.path.localeCompare(b.path);
});

const generatedAt = new Date().toISOString();
const summary = rows.reduce<Record<string, number>>((acc, row) => {
  acc[row.migrationCategory] = (acc[row.migrationCategory] ?? 0) + 1;
  return acc;
}, {});

const jsonPayload = {
  generatedAt,
  siteOrigin: SITE_ORIGIN,
  totalUrls: rows.length,
  summaryByCategory: summary,
  urls: rows.map((row) => ({
    ...row,
    fullUrl: `${SITE_ORIGIN}${row.path.startsWith('/') ? row.path : `/${row.path}`}`,
  })),
};

writeFileSync(resolve(process.cwd(), 'site-url-export.json'), JSON.stringify(jsonPayload, null, 2));

const csvHeader = [
  'path',
  'full_url',
  'title',
  'migration_category',
  'content_type',
  'visibility',
  'source',
  'status',
  'destination',
  'in_xml_sitemap',
  'notes',
].join(',');

const csvEscape = (value: string | boolean | undefined) => {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const csvLines = [
  csvHeader,
  ...jsonPayload.urls.map((row) =>
    [
      row.path,
      row.fullUrl,
      row.title,
      row.migrationCategory,
      row.contentType,
      row.visibility,
      row.source,
      row.status,
      row.destination,
      row.inXmlSitemap ?? '',
      row.notes,
    ]
      .map(csvEscape)
      .join(','),
  ),
];

writeFileSync(resolve(process.cwd(), 'site-url-export.csv'), csvLines.join('\n'));

const migrationRows = jsonPayload.urls.filter((row) =>
  ['public-live', 'public-noindex', 'preview-draft', 'redirect', 'affiliate'].includes(row.migrationCategory),
);

writeFileSync(
  resolve(process.cwd(), 'site-url-export-migration.csv'),
  [
    csvHeader,
    ...migrationRows.map((row) =>
      [
        row.path,
        row.fullUrl,
        row.title,
        row.migrationCategory,
        row.contentType,
        row.visibility,
        row.source,
        row.status,
        row.destination,
        row.inXmlSitemap ?? '',
        row.notes,
      ]
        .map(csvEscape)
        .join(','),
    ),
  ].join('\n'),
);

const mdLines = [
  '# Site URL Export',
  '',
  `Generated: ${generatedAt}`,
  '',
  `Site origin: ${SITE_ORIGIN}`,
  '',
  `**Total URLs:** ${rows.length}`,
  '',
  '## Summary by migration category',
  '',
  ...Object.entries(summary)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cat, count]) => `- **${cat}**: ${count}`),
  '',
  '## Files',
  '',
  '- `site-url-export.json` — full structured export',
  '- `site-url-export.csv` — spreadsheet-friendly (all URLs)',
  '- `site-url-export-migration.csv` — public pages, previews, redirects, affiliates only',
  '',
  '## Category guide',
  '',
  '| Category | Meaning |',
  '|----------|---------|',
  '| `public-live` | Published, indexable public pages |',
  '| `public-noindex` | Public but excluded from XML sitemap |',
  '| `preview-draft` | Preview URLs, unpublished reviews, draft guides |',
  '| `redirect` | Source URLs that 301/302 elsewhere |',
  '| `affiliate` | `/go/{slug}` cloaked outbound links |',
  '| `admin` | Admin panel (noindex) |',
  '| `api` | Server/API endpoints |',
  '| `legacy` | Old paths that redirect to new URLs |',
  '',
];

writeFileSync(resolve(process.cwd(), 'site-url-export.md'), mdLines.join('\n'));

console.log(`\nSite URL export complete (${rows.length} URLs)\n`);
console.log('Summary:');
for (const [cat, count] of Object.entries(summary).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${cat}: ${count}`);
}
console.log('\nWrote:');
console.log('  site-url-export.json');
console.log('  site-url-export.csv');
console.log(`  site-url-export-migration.csv (${migrationRows.length} URLs)`);
console.log('  site-url-export.md');
