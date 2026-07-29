#!/usr/bin/env npx tsx
// Pricing methodology v12: plan-value / usage-costs / free-access / billing.
// Migrates v11 slugs and deactivates removed evidence definitions.
//
// Usage: npx tsx scripts/backfill-pricing-v11.ts

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
const { evidenceDefSeeds, subscoreSeeds } = await import('./seed/methodology-data');
const db = getDb();

const NEW_PRICING_SUBSCORES = new Set(['plan-value', 'usage-costs', 'free-access', 'billing']);
const LEGACY_SUBSCORES = new Set([
  'subscription',
  'free-trial',
  'pay-as-you-go',
  'value',
  'extra-costs',
]);

/** Old evidence slug → new slug (same rawValue shape where possible). */
const SLUG_MIGRATIONS: Record<string, string> = {
  'voice-message-cost': 'voice-cost',
  'voice-call-cost': 'call-cost',
  'top-ups': 'top-up-value',
  'real-cost': 'monthly-spend',
  'feature-paywalls': 'paywalls',
};

const DEACTIVATE_SLUGS = new Set([
  'free-plan',
  'free-trial',
  'heavy-use-cost',
  'category-comparison',
  'feature-value',
  'usage-value',
  'voice-message-cost',
  'voice-call-cost',
  'top-ups',
  'real-cost',
  'feature-paywalls',
]);

const { methodologyVersions } = await (db.query as any)({
  methodologyVersions: {
    $: { where: { status: 'active' } },
    categories: { subscores: { evidenceDefinitions: {} } },
  },
});

const mv = (methodologyVersions as any[])[0];
if (!mv) {
  console.error('No active methodology version found.');
  process.exit(1);
}

const pricingCat = (mv.categories ?? []).find((c: any) => c.slug === 'pricing');
if (!pricingCat?.id) {
  console.error('No pricing category on active methodology.');
  process.exit(1);
}

const chunks: any[] = [];
const subByKey = new Map<string, string>();
const renamedSubscoreIds = new Set<string>();

for (const sub of pricingCat.subscores ?? []) {
  subByKey.set(sub.slug, sub.id);
}

// Rename legacy subscores to new slugs when a direct mapping exists
const SUBSCORE_RENAMES: Record<string, string> = {
  subscription: 'plan-value',
  'pay-as-you-go': 'usage-costs',
  'free-trial': 'free-access',
  value: 'usage-costs',
  'extra-costs': 'usage-costs',
};

for (const [from, to] of Object.entries(SUBSCORE_RENAMES)) {
  const existingId = subByKey.get(from);
  if (!existingId || subByKey.get(to)) continue;
  const seed = subscoreSeeds.find((s) => s.category === 'pricing' && s.slug === to);
  if (!seed) continue;
  renamedSubscoreIds.add(existingId);
  chunks.push(
    db.tx.subscores[existingId].update({
      slug: to,
      name: seed.name,
      description: seed.description,
      weight: seed.weight,
      displayOrder: seed.displayOrder,
      active: true,
    }),
  );
  subByKey.delete(from);
  subByKey.set(to, existingId);
}

// Upsert all pricing subscores from seeds
for (const seed of subscoreSeeds.filter((s) => s.category === 'pricing')) {
  const existingId = subByKey.get(seed.slug);
  const sid = existingId ?? id();
  chunks.push(
    db.tx.subscores[sid]
      .update({
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        weight: seed.weight,
        displayOrder: seed.displayOrder,
        active: true,
      })
      .link({ category: pricingCat.id }),
  );
  subByKey.set(`${seed.category}/${seed.slug}`, sid);
  subByKey.set(seed.slug, sid);
}

// Deactivate legacy pricing subscores (never deactivate rows we just renamed)
for (const sub of pricingCat.subscores ?? []) {
  if (renamedSubscoreIds.has(sub.id)) continue;
  if (NEW_PRICING_SUBSCORES.has(sub.slug)) continue;
  if (LEGACY_SUBSCORES.has(sub.slug)) {
    chunks.push(db.tx.subscores[sub.id].update({ active: false }));
  }
}

const { evidenceDefinitions, evidenceResults } = await (db.query as any)({
  evidenceDefinitions: { subscore: { category: {} } },
  evidenceResults: { evidenceDefinition: {} },
});

const defsByKey = new Map<string, any>();
const defsBySlug = new Map<string, any>();
for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug as string | undefined;
  if (cat) defsByKey.set(`${cat}|${def.slug}`, def);
  if (cat === 'pricing') defsBySlug.set(def.slug, def);
}

for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug as string | undefined;
  if (cat !== 'pricing') continue;
  if (DEACTIVATE_SLUGS.has(def.slug)) {
    chunks.push(db.tx.evidenceDefinitions[def.id].update({ active: false }));
  }
}

function seedToDefUpdate(seed: (typeof evidenceDefSeeds)[number]) {
  return {
    slug: seed.slug,
    name: seed.name,
    publicDescription: seed.publicDescription,
    internalInstructions: seed.internalInstructions,
    resultFormat: seed.resultFormat,
    measurementType: seed.measurementType,
    unit: seed.unit,
    weight: seed.weight,
    required: seed.required,
    displayOrder: seed.displayOrder,
    scoringRule: seed.scoringRule,
    active: true,
  };
}

for (const seed of evidenceDefSeeds.filter((s) => s.category === 'pricing')) {
  const subId = subByKey.get(`${seed.category}/${seed.subscore}`) ?? subByKey.get(seed.subscore);
  if (!subId) {
    console.warn('Missing subscore for', seed.slug, seed.subscore);
    continue;
  }

  const key = `${seed.category}|${seed.slug}`;
  const existing = defsByKey.get(key);
  const did = existing?.id ?? id();

  chunks.push(
    db.tx.evidenceDefinitions[did].update(seedToDefUpdate(seed)).link({ subscore: subId }),
  );
  defsBySlug.set(seed.slug, { ...existing, id: did, slug: seed.slug });
}

// Migrate evidence results from old slugs to new definitions
for (const row of evidenceResults as any[]) {
  const oldSlug = String(row.evidenceDefinition?.slug ?? '');
  const newSlug = SLUG_MIGRATIONS[oldSlug];
  if (!newSlug) continue;
  const newDef = defsBySlug.get(newSlug);
  if (!newDef?.id || row.evidenceDefinition?.id === newDef.id) continue;
  chunks.push(db.tx.evidenceResults[row.id].link({ evidenceDefinition: newDef.id }));
}

// Move pricing-clarity to billing subscore if it still links elsewhere
const claritySeed = evidenceDefSeeds.find((s) => s.slug === 'pricing-clarity');
if (claritySeed) {
  const subId = subByKey.get(`${claritySeed.category}/${claritySeed.subscore}`);
  const existing = defsByKey.get('pricing|pricing-clarity');
  if (existing?.id && subId) {
    chunks.push(db.tx.evidenceDefinitions[existing.id].link({ subscore: subId }));
  }
}

console.log(`Applying ${chunks.length} pricing methodology updates…`);
for (let i = 0; i < chunks.length; i += 100) {
  await db.transact(chunks.slice(i, i + 100));
}
console.log('Done. Re-run score calculation on affected test runs if needed.');
