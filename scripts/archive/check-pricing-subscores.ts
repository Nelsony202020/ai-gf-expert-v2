#!/usr/bin/env npx tsx
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

const slug = process.argv[2] ?? 'candy-ai';
const { getDb } = await import('../src/lib/db/server');
const { calculateRun } = await import('../src/lib/scoring/testRuns');
const db = getDb();

const { products } = await db.query({
  products: {
    $: { where: { slug } },
    testRuns: { $: { order: { serverCreatedAt: 'desc' } }, scoreSnapshots: {} },
  },
});

const product = products[0];
if (!product) {
  console.error('No product:', slug);
  process.exit(1);
}

const runs = (product.testRuns ?? []) as any[];
const run = runs.find((r) => r.isCurrentPublished) ?? runs[0];
if (!run) {
  console.error('No test run');
  process.exit(1);
}

console.log('Product:', product.name);
console.log('Run:', run.id, '| status:', run.status);

const storedSubs = (run.scoreSnapshots ?? [])
  .filter((s: any) => s.kind === 'subscore' && s.parentSlug === 'pricing')
  .map((s: any) => s.refSlug);
console.log('Stored snapshot subscores:', storedSubs.join(', ') || '(none)');

const { tree } = await calculateRun(run.id);
const pricing = tree.categories.find((c) => c.slug === 'pricing');
console.log(
  'Live calculated subscores:',
  pricing?.subscores.map((s) => `${s.slug} (${s.score})`).join(', ') ?? '(none)',
);
