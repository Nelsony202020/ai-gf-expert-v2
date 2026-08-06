#!/usr/bin/env npx tsx
// One-time backfill:
// - Updates Characters|styles checkbox options (Realistic, Anime, Fantasy, Semi-realistic)
// - Adds customization|ss-size evidence definition (after breast-size bands)
// - Pre-fills ss-size = 5 for candy-ai and girlfriendgpt test runs
//
// Usage: npx tsx scripts/backfill-ss-size-and-styles.ts

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

const { getDb, id } = await import('../src/lib/db/server');
const db = getDb();
const now = Date.now();

const STYLE_OPTIONS = ['Realistic', 'Anime', 'Fantasy', 'Semi-realistic'].map((label) => ({
  value: label,
  label,
}));

const BREAST_SIZE_BANDS = {
  kind: 'bands' as const,
  bands: [
    { upTo: 2, score: 2 },
    { upTo: 4, score: 4 },
    { upTo: 6, score: 6 },
    { upTo: 10, score: 8 },
    { upTo: 999999, score: 10 },
  ],
};

const PREFILL_PRODUCTS = ['candy-ai', 'girlfriendgpt'] as const;
const SS_SIZE_VALUE = 5;

const { subscores, evidenceDefinitions } = await (db.query as any)({
  subscores: { category: {} },
  evidenceDefinitions: { subscore: { category: {} } },
});

const subByKey = new Map<string, string>();
for (const sub of subscores as any[]) {
  const catSlug = sub.category?.slug;
  if (catSlug) subByKey.set(`${catSlug}/${sub.slug}`, sub.id);
}

const appearanceSubId = subByKey.get('customization/appearance');
if (!appearanceSubId) {
  console.error('Missing customization/appearance subscore — aborting.');
  process.exit(1);
}

const defByCatSlug = new Map<string, any>();
for (const d of evidenceDefinitions as any[]) {
  const cat = d.subscore?.category?.slug;
  if (cat) defByCatSlug.set(`${cat}|${d.slug}`, d);
}

const chunks: any[] = [];

// 1. Update styles multi_select options
const stylesDef = (evidenceDefinitions as any[]).find(
  (d) => d.slug === 'styles' && d.subscore?.category?.slug === 'characters',
);
if (stylesDef) {
  chunks.push(
    db.tx.evidenceDefinitions[stylesDef.id].update({
      inputType: 'multi_select',
      options: STYLE_OPTIONS,
    }),
  );
  console.log('styles: updated checkbox options');
} else {
  console.warn('styles definition not found — skipping options update');
}

// 2. Add ss-size evidence definition (or update if present)
const existingSs = defByCatSlug.get('customization|ss-size');
const ssDefId = existingSs?.id ?? id();
if (!existingSs) {
  // Bump displayOrder for defs at/after 6
  for (const d of evidenceDefinitions as any[]) {
    if (d.subscore?.id !== appearanceSubId) continue;
    const order = Number(d.displayOrder ?? 0);
    if (order >= 6) {
      chunks.push(db.tx.evidenceDefinitions[d.id].update({ displayOrder: order + 1 }));
    }
  }
}

chunks.push(
  db.tx.evidenceDefinitions[ssDefId]
    .update({
      slug: 'ss-size',
      name: 'SS size options',
      publicDescription: 'ss size options',
      internalInstructions: 'Count SS size options.',
      resultFormat: 'Number of SS size options.',
      measurementType: 'count',
      unit: 'count',
      scoringRule: BREAST_SIZE_BANDS,
      weight: 11,
      required: true,
      displayOrder: 6,
      active: true,
      publicResultTemplate: '{value}',
    })
    .link({ subscore: appearanceSubId }),
);
console.log(existingSs ? 'ss-size: updated existing definition' : 'ss-size: created definition');

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

// 3. Pre-fill ss-size for candy-ai and girlfriendgpt
const res = await (db.query as any)({
  products: {},
  testRuns: { product: {} },
  evidenceDefinitions: { subscore: { category: {} } },
  evidenceResults: { testRun: {}, evidenceDefinition: {} },
});

const ssDef = (res.evidenceDefinitions as any[]).find(
  (d) => d.slug === 'ss-size' && d.subscore?.category?.slug === 'customization',
);
if (!ssDef) {
  console.error('ss-size definition missing after upsert — skipping prefill.');
  process.exit(1);
}

const prefillChunks: any[] = [];
for (const productSlug of PREFILL_PRODUCTS) {
  const product = (res.products as any[]).find((p) => p.slug === productSlug);
  if (!product) {
    console.warn(`No product ${productSlug} — skipping prefill.`);
    continue;
  }
  const runs = (res.testRuns as any[]).filter((r) => r.product?.id === product.id);
  runs.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  const run = runs[0];
  if (!run) {
    console.warn(`No test run for ${productSlug} — skipping prefill.`);
    continue;
  }
  const existing = (res.evidenceResults as any[]).find(
    (r) => r.testRun?.id === run.id && r.evidenceDefinition?.id === ssDef.id,
  );
  const rid = existing?.id ?? id();
  prefillChunks.push(
    db.tx.evidenceResults[rid]
      .update({
        rawValue: { value: SS_SIZE_VALUE },
        publicResult: String(SS_SIZE_VALUE),
        notApplicable: false,
        isUnknown: false,
        testDate: now,
        updatedAt: now,
      })
      .link({ testRun: run.id, evidenceDefinition: ssDef.id, product: product.id }),
  );
  console.log(`${productSlug}: pre-filled ss-size=${SS_SIZE_VALUE} on run ${run.id}`);
}

if (prefillChunks.length) {
  await db.transact(prefillChunks);
}

console.log('Done.');
