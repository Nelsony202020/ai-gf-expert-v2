#!/usr/bin/env npx tsx
// Deactivates redundant testing questions (covered elsewhere), adds kink-options,
// and updates a few measurement types — never deletes existing results.
//
// Usage: npx tsx scripts/backfill-testing-v3.ts

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

/** category|slug pairs deactivated. Existing results preserved. */
const DEACTIVATE_KEYS = new Set([
  'customization|detail-level',
  'customization|combinations',
  'customization|communication',
  'images|detail',
  'images|cost',
  'video|cost',
  'video|controls',
  'video|realism',
  'privacy|consent-controls',
  'privacy|billing-privacy',
  'privacy|account-security',
  'pricing|image-cost',
  'pricing|video-cost',
  'pricing|real-cost',
  'pricing|heavy-use-cost',
  'pricing|category-comparison',
  'pricing|feature-value',
  'pricing|usage-value',
]);

const NEW_DEF = {
  category: 'customization',
  subscore: 'personality',
  slug: 'kink-options',
  name: 'Kink options',
  publicDescription: 'kink or intimacy preference options',
  displayOrder: 8,
  weight: 10,
};

const COUNT_BAND = {
  kind: 'bands',
  bands: [
    { upTo: 0, score: 0 },
    { upTo: 3, score: 4 },
    { upTo: 8, score: 6 },
    { upTo: 15, score: 8 },
    { upTo: 999999, score: 10 },
  ],
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

for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug;
  const key = cat ? `${cat}|${def.slug}` : '';
  if (!DEACTIVATE_KEYS.has(key)) continue;
  chunks.push(db.tx.evidenceDefinitions[def.id].update({ active: false }));
}

const subId = subByKey.get(`${NEW_DEF.category}/${NEW_DEF.subscore}`);
if (subId) {
  const existing = (evidenceDefinitions as any[]).find(
    (d) => d.slug === NEW_DEF.slug && d.subscore?.id === subId,
  );
  const did = existing?.id ?? id();
  chunks.push(
    db.tx.evidenceDefinitions[did]
      .update({
        slug: NEW_DEF.slug,
        name: NEW_DEF.name,
        publicDescription: NEW_DEF.publicDescription,
        internalInstructions: `Count ${NEW_DEF.publicDescription} in the character creator.`,
        resultFormat: 'Number of options.',
        measurementType: 'count',
        unit: 'count',
        scoringRule: COUNT_BAND,
        weight: NEW_DEF.weight,
        required: false,
        displayOrder: NEW_DEF.displayOrder,
        active: true,
        publicResultTemplate: '{value}',
      })
      .link({ subscore: subId }),
  );
}

// Privacy encryption → yes/no on E2E only
for (const def of evidenceDefinitions as any[]) {
  if (def.slug !== 'encryption') continue;
  if (def.subscore?.category?.slug !== 'privacy') continue;
  chunks.push(
    db.tx.evidenceDefinitions[def.id].update({
      measurementType: 'boolean',
      inputType: 'boolean',
      options: null,
      questionLabel: 'Does the platform claim end-to-end encryption?',
    }),
  );
}

// Video ease-of-use → 1–10 scale
for (const def of evidenceDefinitions as any[]) {
  if (def.slug !== 'ease-of-use') continue;
  if (def.subscore?.category?.slug !== 'video') continue;
  chunks.push(
    db.tx.evidenceDefinitions[def.id].update({
      measurementType: 'scale',
      unit: 'score',
      questionLabel: 'How easy is video generation? (1–10)',
    }),
  );
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

console.log(`Backfill v3 complete (${chunks.length} updates).`);
