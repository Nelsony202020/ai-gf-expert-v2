#!/usr/bin/env npx tsx
/**
 * Build gate: every public static page in src/pages must be registered in the
 * sitemap source of truth (getAllSitemapEntries in src/lib/sitemap.ts).
 *
 * Catches the "added a page via Cursor but forgot the sitemap" case. Dynamic
 * routes ([slug], [category], …) are fed from the DB/CMS and are not checked
 * here.
 *
 * Usage:
 *   npx tsx scripts/check-sitemap-coverage.ts
 *   npm run check:sitemap   (also runs as part of `npm run build`)
 */

import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { pathMatchKey } from '../src/lib/urls';

const PAGES_DIR = resolve(process.cwd(), 'src/pages');

/** Route prefixes that are intentionally not in the sitemap. */
const IGNORED_PREFIXES = ['/api/', '/admin', '/go/'];

/** Exact routes that are intentionally not in the sitemap. */
const IGNORED_ROUTES = new Set([
  '/guides/preview/', // draft preview, requires ?secret=
  '/sitemap.xml',
]);

function collectPageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...collectPageFiles(full));
    } else if (/\.(astro|ts)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** src/pages file → route path, or null when the file is not a checkable static route. */
function fileToRoute(file: string): string | null {
  let rel = relative(PAGES_DIR, file).split(sep).join('/');

  // Dynamic and catch-all routes are covered by DB/CMS-driven sitemap logic.
  if (rel.includes('[')) return null;

  rel = rel.replace(/\.(astro|ts)$/, '');
  if (rel === 'index') return '/';
  if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length);

  // Endpoint files like sitemap.xml.ts keep their extension in the route.
  return `/${rel}`;
}

function normalize(path: string): string {
  return pathMatchKey(path);
}

const { getAllSitemapEntries } = await import('../src/lib/sitemap');

const registered = new Set(getAllSitemapEntries().map((e) => normalize(e.url)));

const missing: string[] = [];
for (const file of collectPageFiles(PAGES_DIR)) {
  const route = fileToRoute(file);
  if (!route) continue;

  const norm = normalize(route);
  if (IGNORED_ROUTES.has(norm)) continue;
  if (IGNORED_PREFIXES.some((p) => norm === p.replace(/\/$/, '') || norm.startsWith(p))) continue;

  if (!registered.has(norm)) {
    missing.push(`${norm}  (${relative(process.cwd(), file)})`);
  }
}

if (missing.length > 0) {
  console.error('\n[check-sitemap-coverage] Pages missing from the sitemap registry:\n');
  for (const m of missing) console.error(`  - ${m}`);
  console.error(
    '\nRegister each page in getAllSitemapEntries() (src/lib/sitemap.ts) so it appears',
    'in the HTML sitemap and XML sitemaps, or add it to the ignore lists in',
    'scripts/check-sitemap-coverage.ts if it should stay unlisted.\n',
  );
  process.exit(1);
}

console.log('[check-sitemap-coverage] OK — all public static pages are registered in the sitemap.');
