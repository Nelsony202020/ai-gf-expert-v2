#!/usr/bin/env npx tsx
/** Inspect category score breakdown for a product. Usage: npx tsx scripts/diagnose-category-scores.ts candy-ai chat-features privacy */

import { readFileSync } from 'node:fs';
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

const productSlug = process.argv[2] ?? 'candy-ai';
const categorySlugs = process.argv.slice(3);
const targets = categorySlugs.length > 0 ? categorySlugs : ['chat-features', 'privacy'];

const { getDb } = await import('../src/lib/db/server');
const { calculateRun } = await import('../src/lib/scoring/testRuns');
const db = getDb();

const { products } = await db.query({
  products: {
    $: { where: { slug: productSlug } },
    testRuns: {
      $: { order: { serverCreatedAt: 'desc' } },
      scoreSnapshots: {},
    },
  },
});

const product = products[0];
if (!product) {
  console.log(`No product: ${productSlug}`);
  process.exit(1);
}

const runs = (product.testRuns ?? []) as any[];
const run = runs.find((r) => r.isCurrentPublished) ?? runs[0];
if (!run) {
  console.log(`No test run for ${productSlug}.`);
  process.exit(1);
}

console.log('Product:', product.name, `(${product.slug})`);
console.log('Test run:', run.id, '| status:', run.status);

const { tree } = await calculateRun(run.id);

for (const slug of targets) {
  const cat = tree.categories.find((c) => c.slug === slug);
  const snap = (run.scoreSnapshots ?? []).find((s: any) => s.kind === 'category' && s.refSlug === slug);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${slug.toUpperCase()} — live: ${cat?.score ?? 'null'} | stored snapshot: ${snap?.score ?? '(none)'}`);
  console.log('='.repeat(60));

  for (const sub of cat?.subscores ?? []) {
    console.log(`\n  Subscore "${sub.slug}": ${sub.score}/10`);
    const evs = [...sub.evidence].sort((a, b) => (b.effectiveWeight ?? 0) - (a.effectiveWeight ?? 0));
    for (const ev of evs) {
      const wt = ev.effectiveWeight != null ? `${ev.effectiveWeight.toFixed(1)}%` : '—';
      const sc = ev.normalizedScore != null ? `${ev.normalizedScore}/10` : '—';
      console.log(`    • ${ev.name} (${ev.slug})`);
      console.log(`      Score: ${sc} | Weight: ${wt} | ${ev.detail}`);
    }
  }
}
