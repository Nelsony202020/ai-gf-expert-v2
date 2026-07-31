#!/usr/bin/env npx tsx
// Bonus features category, privacy support, chat Yes/No inputs, category weights.
//
// Usage: npx tsx scripts/backfill-testing-v9.ts

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

const CHAT_YES_NO = new Set([
  'voice-calls',
  'group-chat',
  'double-texting',
  'proactive-messages',
  'edit-messages',
  'delete-messages',
  'regenerate-replies',
  'save-memories',
  'edit-memories',
  'export-chat',
]);

const CATEGORY_WEIGHTS: Record<string, number> = {
  'chat-features': 9,
  privacy: 8,
  pricing: 8,
  'bonus-features': 5,
};

const PRIVACY_SUBSCORE_WEIGHTS: Record<string, number> = {
  'data-use': 31,
  'user-control': 28,
  security: 28,
  support: 13,
};

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

// --- Categories ---
for (const seed of categorySeeds) {
  const existing = catBySlug.get(seed.slug);
  const cid = existing?.id ?? id();
  const weight = CATEGORY_WEIGHTS[seed.slug] ?? seed.weight;
  chunks.push(
    db.tx.categories[cid]
      .update({
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        weight,
        displayOrder: seed.displayOrder,
        methodologyUrl: `/test/${seed.slug}/`,
        active: true,
      })
      .link({ methodologyVersion: mv.id }),
  );
  if (!existing) catBySlug.set(seed.slug, { id: cid, slug: seed.slug, subscores: [] });
  else if (CATEGORY_WEIGHTS[seed.slug] !== undefined) {
    /* weight updated above */
  }
}

// Re-query subscores after category ensure — use in-memory map
const subByKey = new Map<string, string>();
for (const cat of catBySlug.values()) {
  for (const sub of cat.subscores ?? []) {
    subByKey.set(`${cat.slug}/${sub.slug}`, sub.id);
  }
}

for (const seed of subscoreSeeds) {
  if (seed.category === 'bonus-features' || (seed.category === 'privacy' && seed.slug === 'support')) {
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
}

for (const [slug, weight] of Object.entries(PRIVACY_SUBSCORE_WEIGHTS)) {
  const subId = subByKey.get(`privacy/${slug}`);
  if (subId) chunks.push(db.tx.subscores[subId].update({ weight }));
}

// --- New evidence from seeds (bonus + support) ---
const NEW_SLUGS = new Set([
  'live-cam',
  'interactive-video',
  'shorts',
  'episodic-content',
  'roulette',
  'support-reach',
  'support-speed',
  'support-helpfulness',
]);

for (const seed of evidenceDefSeeds) {
  if (!NEW_SLUGS.has(seed.slug)) continue;
  const subId = subByKey.get(`${seed.category}/${seed.subscore}`);
  if (!subId) {
    console.warn('Missing subscore for', seed.slug);
    continue;
  }
  const extra: Record<string, unknown> = {};
  if (seed.category === 'privacy' && seed.subscore === 'support') {
    extra.inputType = 'rubric';
    extra.options = SUPPORT_RUBRIC;
    extra.allowUnableToVerify = false;
  }
  chunks.push(
    db.tx.evidenceDefinitions[id()]
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
}

// --- Patch existing chat-features + weights ---
const { evidenceDefinitions } = await (db.query as any)({
  evidenceDefinitions: { subscore: { category: {} } },
});

for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug as string | undefined;
  const slug = def.slug as string;
  const patch: Record<string, unknown> = {};

  if (cat === 'chat-features' && CHAT_YES_NO.has(slug)) {
    patch.measurementType = 'boolean';
    patch.inputType = 'yes_no';
    patch.allowUnableToVerify = false;
    if (slug === 'double-texting') {
      patch.internalInstructions =
        'In a normal chat, send one message and wait without replying.\nRecord Yes when the character sometimes sends two or more separate messages before you reply.\nRecord No when it always waits for your next message.';
      patch.resultFormat = 'Yes or No.';
    }
  }

  if (cat === 'chat-features' && slug === 'reset-chat') {
    patch.measurementType = 'boolean';
    patch.inputType = 'yes_no_unknown';
    patch.allowUnableToVerify = true;
  }

  if (cat === 'chat-features' && slug === 'voice-calls') patch.weight = 27;
  if (cat === 'chat-features' && slug === 'group-chat') patch.weight = 5;
  if (cat === 'chat-features' && slug === 'gifs') patch.weight = 2;
  if (cat === 'chat-features' && slug === 'voice-received') patch.weight = 23;

  if (Object.keys(patch).length > 0) {
    chunks.push(db.tx.evidenceDefinitions[def.id].update(patch));
  }
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

console.log(`Backfill v9 complete (${chunks.length} transactions).`);
