#!/usr/bin/env npx tsx
/**
 * Full site URL export for migration planning.
 *
 * Thin wrapper around the shared URL registry (src/lib/seo/urlRegistry.ts),
 * which also powers the admin SEO control center.
 *
 * Usage:
 *   npx tsx scripts/export-site-urls.ts
 *   npm run export:urls
 *
 * Outputs (project root):
 *   site-url-export.json
 *   site-url-export.csv
 *   site-url-export-migration.csv
 *   site-url-export.md
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

const { buildUrlRegistry } = await import('../src/lib/seo/urlRegistry');
const registry = await buildUrlRegistry();

type MigrationCategory =
  | 'public-live'
  | 'public-noindex'
  | 'preview-draft'
  | 'redirect'
  | 'affiliate'
  | 'admin'
  | 'api'
  | 'legacy';

function migrationCategory(status: string): MigrationCategory {
  switch (status) {
    case 'published':
      return 'public-live';
    case 'noindex':
      return 'public-noindex';
    case 'draft':
    case 'preview':
      return 'preview-draft';
    case 'redirect':
      return 'redirect';
    case 'affiliate':
      return 'affiliate';
    case 'admin':
      return 'admin';
    case 'api':
      return 'api';
    case 'legacy':
      return 'legacy';
    default:
      return 'public-live';
  }
}

const rows = registry.urls.map((u) => ({
  path: u.path,
  fullUrl: `${registry.siteOrigin}${u.path.startsWith('/') ? u.path : `/${u.path}`}`,
  title: u.title,
  migrationCategory: migrationCategory(u.status),
  contentType: u.contentType,
  visibility: u.status,
  source: u.sourceDetail,
  status: u.recordStatus,
  destination: u.destination,
  inXmlSitemap: u.inXmlSitemap,
  notes: u.notes,
}));

rows.sort((a, b) => {
  const cat = a.migrationCategory.localeCompare(b.migrationCategory);
  if (cat !== 0) return cat;
  return a.path.localeCompare(b.path);
});

const generatedAt = registry.generatedAt;
const summary = rows.reduce<Record<string, number>>((acc, row) => {
  acc[row.migrationCategory] = (acc[row.migrationCategory] ?? 0) + 1;
  return acc;
}, {});

const jsonPayload = {
  generatedAt,
  siteOrigin: registry.siteOrigin,
  totalUrls: rows.length,
  summaryByCategory: summary,
  urls: rows,
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

const toCsvLine = (row: (typeof rows)[number]) =>
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
    .join(',');

writeFileSync(
  resolve(process.cwd(), 'site-url-export.csv'),
  [csvHeader, ...rows.map(toCsvLine)].join('\n'),
);

const migrationRows = rows.filter((row) =>
  ['public-live', 'public-noindex', 'preview-draft', 'redirect', 'affiliate'].includes(row.migrationCategory),
);

writeFileSync(
  resolve(process.cwd(), 'site-url-export-migration.csv'),
  [csvHeader, ...migrationRows.map(toCsvLine)].join('\n'),
);

const mdLines = [
  '# Site URL Export',
  '',
  `Generated: ${generatedAt}`,
  '',
  `Site origin: ${registry.siteOrigin}`,
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
console.log(`\nDetected issues: ${registry.issueGroups.reduce((n, g) => n + g.count, 0)} across ${registry.summary.needsAttention} URLs`);
console.log('\nWrote:');
console.log('  site-url-export.json');
console.log('  site-url-export.csv');
console.log(`  site-url-export-migration.csv (${migrationRows.length} URLs)`);
console.log('  site-url-export.md');
