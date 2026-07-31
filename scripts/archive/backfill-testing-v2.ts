#!/usr/bin/env npx tsx
// Adds split character-count + creator appearance evidence definitions,
// deactivates replaced slugs, and pre-fills Candy AI library counts.
//
// Usage: npx tsx scripts/backfill-testing-v2.ts

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

type NewDef = {
  category: string;
  subscore: string;
  slug: string;
  name: string;
  publicDescription: string;
  displayOrder: number;
  weight: number;
};

const COUNT_BAND = {
  kind: 'bands',
  bands: [
    { upTo: 5, score: 2 },
    { upTo: 20, score: 4 },
    { upTo: 50, score: 6 },
    { upTo: 100, score: 8 },
    { upTo: 999999, score: 10 },
  ],
};

const NEW_DEFS: NewDef[] = [
  { category: 'characters', subscore: 'variety', slug: 'female-count', name: 'Female characters', publicDescription: 'female characters in the library', displayOrder: 1, weight: 12 },
  { category: 'characters', subscore: 'variety', slug: 'male-count', name: 'Male characters', publicDescription: 'male characters in the library', displayOrder: 2, weight: 12 },
  { category: 'characters', subscore: 'variety', slug: 'anime-female-count', name: 'Anime female', publicDescription: 'anime-style female characters', displayOrder: 3, weight: 12 },
  { category: 'characters', subscore: 'variety', slug: 'anime-male-count', name: 'Anime male', publicDescription: 'anime-style male characters', displayOrder: 4, weight: 12 },
  { category: 'characters', subscore: 'variety', slug: 'transgender-count', name: 'Transgender', publicDescription: 'transgender characters', displayOrder: 5, weight: 10 },
  { category: 'characters', subscore: 'variety', slug: 'non-binary-count', name: 'Non-binary', publicDescription: 'non-binary characters', displayOrder: 6, weight: 10 },
  { category: 'characters', subscore: 'variety', slug: 'other-count', name: 'Other', publicDescription: 'other gender/category characters', displayOrder: 7, weight: 10 },
  { category: 'customization', subscore: 'appearance', slug: 'eye-color', name: 'Eye color', publicDescription: 'eye color options', displayOrder: 3, weight: 12 },
  { category: 'customization', subscore: 'appearance', slug: 'body-type', name: 'Body type', publicDescription: 'body type options', displayOrder: 4, weight: 12 },
  { category: 'customization', subscore: 'appearance', slug: 'breast-size', name: 'Breast size', publicDescription: 'breast size options', displayOrder: 5, weight: 11 },
  { category: 'customization', subscore: 'appearance', slug: 'hair-style', name: 'Hair style', publicDescription: 'hairstyle options', displayOrder: 6, weight: 11 },
  { category: 'customization', subscore: 'appearance', slug: 'hair-color', name: 'Hair color', publicDescription: 'hair color options', displayOrder: 7, weight: 11 },
  { category: 'customization', subscore: 'appearance', slug: 'outfits', name: 'Outfits', publicDescription: 'clothing and outfit options', displayOrder: 8, weight: 11 },
  { category: 'customization', subscore: 'personality', slug: 'creator-personalities', name: 'Personalities', publicDescription: 'personality options in the creator', displayOrder: 7, weight: 16 },
];

const DEACTIVATE_SLUGS = new Set(['amount', 'genders', 'gender', 'face', 'hair', 'body', 'clothing']);

const CANDY_COUNTS: Record<string, number> = {
  'female-count': 146,
  'male-count': 12,
  'anime-female-count': 60,
  'anime-male-count': 10,
  'transgender-count': 0,
  'non-binary-count': 0,
  'other-count': 0,
};

const { subscores, evidenceDefinitions } = await (db.query as any)({
  subscores: { category: {} },
  evidenceDefinitions: { subscore: { category: {} } },
});

const subByKey = new Map<string, string>();
for (const sub of subscores as any[]) {
  const catSlug = sub.category?.slug;
  if (catSlug) subByKey.set(`${catSlug}/${sub.slug}`, sub.id);
}

const chunks: any[] = [];

for (const seed of NEW_DEFS) {
  const subId = subByKey.get(`${seed.category}/${seed.subscore}`);
  if (!subId) {
    console.warn('Missing subscore', seed.category, seed.subscore);
    continue;
  }
  const existing = (evidenceDefinitions as any[]).find(
    (d) => d.slug === seed.slug && d.subscore?.id === subId,
  );
  const did = existing?.id ?? id();
  chunks.push(
    db.tx.evidenceDefinitions[did]
      .update({
        slug: seed.slug,
        name: seed.name,
        publicDescription: seed.publicDescription,
        internalInstructions: `Count ${seed.publicDescription}.`,
        resultFormat: 'Number of characters.',
        measurementType: 'count',
        unit: 'count',
        scoringRule: COUNT_BAND,
        weight: seed.weight,
        required: true,
        displayOrder: seed.displayOrder,
        active: true,
        publicResultTemplate: '{value}',
      })
      .link({ subscore: subId }),
  );
}

for (const def of evidenceDefinitions as any[]) {
  if (!DEACTIVATE_SLUGS.has(def.slug)) continue;
  chunks.push(db.tx.evidenceDefinitions[def.id].update({ active: false }));
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}
console.log('Evidence definitions updated.');

const res = await (db.query as any)({
  products: { $: { where: { slug: 'candy-ai' } } },
  testRuns: { product: {} },
  evidenceDefinitions: { subscore: { category: {} } },
  evidenceResults: { testRun: {}, evidenceDefinition: {} },
});

const product = res.products?.[0];
if (!product) {
  console.log('No candy-ai product — skipping prefill.');
  process.exit(0);
}

const runs = (res.testRuns as any[]).filter((r) => r.product?.id === product.id);
runs.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
const run = runs[0];
if (!run) {
  console.log('No test run for candy-ai — skipping prefill.');
  process.exit(0);
}

const defBySlug = new Map<string, any>();
for (const d of res.evidenceDefinitions as any[]) {
  if (!d.active) continue;
  const cat = d.subscore?.category?.slug;
  if (cat) defBySlug.set(`${cat}|${d.slug}`, d);
}

const prefillChunks: any[] = [];
for (const [slug, value] of Object.entries(CANDY_COUNTS)) {
  const def = defBySlug.get(`characters|${slug}`);
  if (!def) continue;
  const existing = (res.evidenceResults as any[]).find(
    (r) => r.testRun?.id === run.id && r.evidenceDefinition?.id === def.id,
  );
  const rid = existing?.id ?? id();
  prefillChunks.push(
    db.tx.evidenceResults[rid]
      .update({
        rawValue: { value },
        publicResult: String(value),
        notApplicable: false,
        isUnknown: false,
        testDate: now,
        updatedAt: now,
      })
      .link({ testRun: run.id, evidenceDefinition: def.id, product: product.id }),
  );
}

if (prefillChunks.length) {
  await db.transact(prefillChunks);
  console.log(`Prefilled ${prefillChunks.length} Candy AI character counts on run ${run.id}.`);
}

console.log('Done.');
