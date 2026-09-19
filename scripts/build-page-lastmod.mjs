#!/usr/bin/env node
/**
 * Writes src/data/page-lastmod.json: URL path -> ISO date of the last git
 * commit that touched the source file behind that page.
 *
 * Why a generated file: the sitemaps are server-rendered (`prerender = false`),
 * and git is not available at request time. This runs at build.
 *
 * Rules, per the brief:
 *  - Only real commit dates. If `git log` returns nothing for a file (no
 *    history, shallow clone, untracked), that URL is OMITTED. A missing
 *    lastmod is fine; a fabricated one makes Google distrust the whole file.
 *  - Never substitute build time or Date.now().
 *  - If git is unavailable entirely, the existing JSON is left untouched
 *    rather than being emptied or filled with today.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'src/data/page-lastmod.json');

/**
 * URL path -> the source file(s) that produce it. Where a page is a route plus
 * a data file, both are listed and the NEWEST commit date wins, because either
 * one changing changes the page.
 */
const PAGE_SOURCES = {
  '/': ['src/pages/index.astro'],
  '/about/': ['src/pages/about.astro'],
  '/contact/': ['src/pages/contact.astro'],
  '/glossary/': ['src/pages/glossary.astro'],
  '/sitemap/': ['src/pages/sitemap.astro'],
  '/reviews/': ['src/pages/reviews/index.astro'],
  '/guides/': ['src/pages/guides/index.astro', 'src/data/guides.ts'],
  '/ai-girlfriend-apps/': ['src/pages/ai-girlfriend-apps.astro'],
  '/editorial-guidelines/': ['src/pages/editorial-guidelines.astro'],
  '/author/herman-carter/': ['src/data/authors.ts'],

  // Guides: one .astro per guide, plus the registry that titles and orders them.
  '/guides/how-to-choose-an-ai-girlfriend-app/': ['src/pages/guides/how-to-choose-an-ai-girlfriend-app.astro', 'src/data/buying-guide-content.ts'],
  '/guides/ourdream-ai-prompt/': ['src/pages/guides/ourdream-ai-prompt.astro'],
  '/guides/how-to-use-ourdream-ai-image-generator/': ['src/pages/guides/how-to-use-ourdream-ai-image-generator.astro'],
  '/guides/ourdream-ai-image-prompt/': ['src/pages/guides/ourdream-ai-image-prompt.astro'],
  '/guides/ourdream-ai-comics/': ['src/pages/guides/ourdream-ai-comics.astro'],
  '/guides/ourdream-ai/': ['src/pages/guides/ourdream-ai.astro', 'src/lib/guides/brandGuideHub.ts'],

  // Legal.
  '/legal/': ['src/pages/legal/index.astro'],
  '/legal/privacy/': ['src/pages/legal/privacy.astro'],
  '/legal/terms/': ['src/pages/legal/terms.astro'],
  '/legal/accessibility/': ['src/pages/legal/accessibility.astro'],
  '/legal/copyright/': ['src/pages/legal/copyright.astro'],
  '/legal/disclaimer/': ['src/pages/legal/disclaimer.astro'],
  '/legal/affiliate-disclosure/': ['src/pages/legal/affiliate-disclosure.astro'],

  // Methodology. The hub and the category/subscore pages are all rendered from
  // the test framework plus their content files, so they share those sources.
  '/test/': ['src/pages/test/index.astro', 'src/data/test-hub-content.ts', 'src/lib/test-framework.ts'],
};

/**
 * Category and subscore pages under /test/ are generated from the same two
 * data files; their route file is shared too. Listing the prefix lets the
 * sitemap fall back to it for every URL beneath.
 */
const PREFIX_SOURCES = {
  '/test/': [
    'src/pages/test/[category]/index.astro',
    'src/pages/test/[category]/[subscore]/index.astro',
    'src/data/test-category-methodology.ts',
    'src/data/test-subscore-methodology.ts',
    'src/lib/test-framework.ts',
  ],
};

function gitDate(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function gitAvailable() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: root, stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

if (!gitAvailable()) {
  console.log('[page-lastmod] git unavailable — keeping the committed map as-is');
  process.exit(0);
}

/** Newest commit date across several files, as YYYY-MM-DD. */
function newestDate(files) {
  const dates = files
    .filter((f) => existsSync(resolve(root, f)))
    .map((f) => gitDate(f))
    .filter(Boolean)
    .map((d) => d.slice(0, 10)); // W3C date form; keeps every value comparable
  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
}

const map = {};
let missing = 0;
for (const [url, files] of Object.entries(PAGE_SOURCES)) {
  const d = newestDate(files);
  if (d) map[url] = d; else missing++;
}

const prefixes = {};
for (const [prefix, files] of Object.entries(PREFIX_SOURCES)) {
  const d = newestDate(files);
  if (d) prefixes[prefix] = d;
}

if (Object.keys(map).length === 0) {
  console.log('[page-lastmod] no commit dates resolved — keeping the committed map as-is');
  process.exit(0);
}

const next = JSON.stringify({ pages: map, prefixes }, null, 2) + '\n';
const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
if (prev !== next) writeFileSync(OUT, next);
console.log(`[page-lastmod] ${Object.keys(map).length} dated, ${missing} omitted`);
