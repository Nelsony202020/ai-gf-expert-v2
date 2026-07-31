#!/usr/bin/env npx tsx
// Fold bonus-features into chat-features platform-extras; add support link fields;
// restore 8-category weights (chat/privacy/pricing 10% each).
//
// Usage: npx tsx scripts/backfill-testing-v10.ts

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
const { evidenceDefSeeds, categorySeeds, subscoreSeeds } = await import('./seed/methodology-data');
const db = getDb();

const SUPPORT_RUBRIC = [
  { value: 2, label: 'Poor', description: 'Hard to reach, slow, or unhelpful' },
  { value: 4, label: 'Fair', description: 'Below average' },
  { value: 6, label: 'Good', description: 'Acceptable' },
  { value: 8, label: 'Very good', description: 'Strong experience' },
  { value: 10, label: 'Excellent', description: 'Outstanding' },
];

const CATEGORY_WEIGHTS: Record<string, number> = {
  'chat-features': 10,
  privacy: 10,
  pricing: 10,
};

const CHAT_FEATURES_SUBSCORE_WEIGHTS: Record<string, number> = {
  media: 30,
  interaction: 30,
  controls: 30,
  'platform-extras': 10,
};

const PRIVACY_SUBSCORE_WEIGHTS: Record<string, number> = {
  'data-use': 31,
  'user-control': 28,
  security: 28,
  support: 13,
};

const DEACTIVATE_BONUS_SLUGS = new Set([
  'interactive-video',
  'shorts',
  'episodic-content',
  'roulette',
]);

const NEW_OR_MOVE_SLUGS = new Set([
  'live-cam',
  'platform-extras-list',
  'support-available',
  'support-channels',
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

const chunks: any[] = [];
const catBySlug = new Map<string, any>();
for (const cat of mv.categories ?? []) {
  catBySlug.set(cat.slug, cat);
}

// --- Categories: restore 8-category weights; deactivate bonus-features ---
for (const seed of categorySeeds) {
  const existing = catBySlug.get(seed.slug);
  if (!existing?.id) continue;
  chunks.push(
    db.tx.categories[existing.id].update({
      weight: seed.weight,
      active: true,
      displayOrder: seed.displayOrder,
      description: seed.description,
    }),
  );
}

const bonusCat = catBySlug.get('bonus-features');
if (bonusCat?.id) {
  chunks.push(db.tx.categories[bonusCat.id].update({ active: false }));
}

// --- Subscores ---
const subByKey = new Map<string, string>();
for (const cat of catBySlug.values()) {
  for (const sub of cat.subscores ?? []) {
    subByKey.set(`${cat.slug}/${sub.slug}`, sub.id);
  }
}

for (const seed of subscoreSeeds) {
  if (seed.category !== 'chat-features' && !(seed.category === 'privacy' && seed.slug === 'support')) {
    continue;
  }
  if (seed.slug !== 'platform-extras' && seed.category === 'chat-features') continue;

  const cat = catBySlug.get(seed.category);
  if (!cat?.id) continue;
  const existingSub = (cat.subscores ?? []).find((s: any) => s.slug === seed.slug);
  const sid = existingSub?.id ?? id();
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
      .link({ category: cat.id }),
  );
  subByKey.set(`${seed.category}/${seed.slug}`, sid);
}

for (const [slug, weight] of Object.entries(CHAT_FEATURES_SUBSCORE_WEIGHTS)) {
  const subId = subByKey.get(`chat-features/${slug}`);
  if (subId) chunks.push(db.tx.subscores[subId].update({ weight }));
}

for (const [slug, weight] of Object.entries(PRIVACY_SUBSCORE_WEIGHTS)) {
  const subId = subByKey.get(`privacy/${slug}`);
  if (subId) chunks.push(db.tx.subscores[subId].update({ weight }));
}

for (const [slug, weight] of Object.entries(CATEGORY_WEIGHTS)) {
  const cat = catBySlug.get(slug);
  if (cat?.id) chunks.push(db.tx.categories[cat.id].update({ weight }));
}

// --- Evidence: deactivate old bonus slugs; ensure platform-extras + support defs ---
const { evidenceDefinitions } = await (db.query as any)({
  evidenceDefinitions: { subscore: { category: {} } },
});

const defsByKey = new Map<string, any>();
for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug as string | undefined;
  if (cat) defsByKey.set(`${cat}|${def.slug}`, def);
}

for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug as string | undefined;
  const slug = def.slug as string;
  if (cat === 'bonus-features') {
    chunks.push(db.tx.evidenceDefinitions[def.id].update({ active: false }));
    continue;
  }
  if (DEACTIVATE_BONUS_SLUGS.has(slug)) {
    chunks.push(db.tx.evidenceDefinitions[def.id].update({ active: false }));
  }
}

for (const seed of evidenceDefSeeds) {
  if (!NEW_OR_MOVE_SLUGS.has(seed.slug)) continue;
  const subId = subByKey.get(`${seed.category}/${seed.subscore}`);
  if (!subId) {
    console.warn('Missing subscore for', seed.slug);
    continue;
  }

  const key = `${seed.category}|${seed.slug}`;
  const existing = defsByKey.get(key);
  const did = existing?.id ?? id();

  const extra: Record<string, unknown> = {};
  if (seed.slug === 'live-cam') {
    extra.inputType = 'yes_no';
    extra.allowUnableToVerify = false;
  }
  if (seed.slug === 'support-available') {
    extra.inputType = 'yes_no';
    extra.allowUnableToVerify = false;
  }
  if (['support-reach', 'support-speed', 'support-helpfulness'].includes(seed.slug)) {
    extra.inputType = 'rubric';
    extra.options = SUPPORT_RUBRIC;
    extra.allowUnableToVerify = false;
  }

  chunks.push(
    db.tx.evidenceDefinitions[did]
      .update({
        slug: seed.slug,
        name: seed.name,
        publicDescription: seed.publicDescription,
        internalInstructions: seed.internalInstructions,
        resultFormat: seed.resultFormat,
        measurementType: seed.measurementType,
        unit: seed.unit ?? null,
        scoringRule: seed.scoringRule,
        weight: seed.weight,
        required: seed.required,
        displayOrder: seed.displayOrder,
        active: true,
        publicResultTemplate: seed.unit ? '{value}' : null,
        ...extra,
      })
      .link({ subscore: subId }),
  );

  // Migrate live-cam from bonus-features if it existed there
  if (seed.slug === 'live-cam') {
    const old = defsByKey.get('bonus-features|live-cam');
    if (old?.id && old.id !== did) {
      chunks.push(db.tx.evidenceDefinitions[old.id].update({ active: false }));
    }
  }
}

// Patch support rubric display order if defs already exist
for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug as string | undefined;
  if (cat !== 'privacy') continue;
  const slug = def.slug as string;
  const patch: Record<string, unknown> = {};
  if (slug === 'support-reach') patch.displayOrder = 3;
  if (slug === 'support-speed') patch.displayOrder = 4;
  if (slug === 'support-helpfulness') patch.displayOrder = 5;
  if (Object.keys(patch).length > 0) {
    chunks.push(db.tx.evidenceDefinitions[def.id].update(patch));
  }
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

console.log(`Backfill v10 complete (${chunks.length} transactions).`);
