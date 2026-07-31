#!/usr/bin/env npx tsx
// Scoring calibration v6: character gender weights, customization bands,
// video weights/bands, pricing free-plan/trial.
//
// Usage: npx tsx scripts/backfill-testing-v6.ts

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

const { getDb } = await import('../src/lib/db/server');
const db = getDb();

type BandUpdate = {
  category: string;
  slug: string;
  weight?: number;
  scoringRule?: { kind: 'bands'; bands: { upTo: number; score: number }[] };
};

const FEMALE_COUNT_BANDS = {
  kind: 'bands' as const,
  bands: [
    { upTo: 10, score: 2 },
    { upTo: 30, score: 4 },
    { upTo: 80, score: 6 },
    { upTo: 120, score: 8 },
    { upTo: 999999, score: 10 },
  ],
};

const MALE_COUNT_BANDS = {
  kind: 'bands' as const,
  bands: [
    { upTo: 5, score: 2 },
    { upTo: 15, score: 4 },
    { upTo: 30, score: 6 },
    { upTo: 50, score: 8 },
    { upTo: 999999, score: 10 },
  ],
};

const TRANSGENDER_COUNT_BANDS = {
  kind: 'bands' as const,
  bands: [
    { upTo: 0, score: 0 },
    { upTo: 3, score: 4 },
    { upTo: 10, score: 6 },
    { upTo: 25, score: 8 },
    { upTo: 999999, score: 10 },
  ],
};

const SMALL_COUNT_BANDS = {
  kind: 'bands' as const,
  bands: [
    { upTo: 0, score: 0 },
    { upTo: 2, score: 4 },
    { upTo: 5, score: 6 },
    { upTo: 15, score: 8 },
    { upTo: 999999, score: 10 },
  ],
};

const UPDATES: BandUpdate[] = [
  // Character library — gender counts (female heaviest, male lighter, trans mid, other/non-binary small)
  { category: 'characters', slug: 'female-count', weight: 18, scoringRule: FEMALE_COUNT_BANDS },
  { category: 'characters', slug: 'anime-female-count', weight: 18, scoringRule: FEMALE_COUNT_BANDS },
  { category: 'characters', slug: 'male-count', weight: 7, scoringRule: MALE_COUNT_BANDS },
  { category: 'characters', slug: 'anime-male-count', weight: 7, scoringRule: MALE_COUNT_BANDS },
  { category: 'characters', slug: 'transgender-count', weight: 11, scoringRule: TRANSGENDER_COUNT_BANDS },
  { category: 'characters', slug: 'non-binary-count', weight: 4, scoringRule: SMALL_COUNT_BANDS },
  { category: 'characters', slug: 'other-count', weight: 4, scoringRule: SMALL_COUNT_BANDS },
  {
    category: 'characters',
    slug: 'ethnicities',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 3, score: 1 },
        { upTo: 5, score: 2 },
        { upTo: 7, score: 3 },
        { upTo: 10, score: 5 },
        { upTo: 15, score: 7 },
        { upTo: 999999, score: 10 },
      ],
    },
  },

  // Customization appearance (v2 slugs)
  {
    category: 'customization',
    slug: 'ethnicity',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 2, score: 1 },
        { upTo: 4, score: 2 },
        { upTo: 5, score: 3 },
        { upTo: 8, score: 6 },
        { upTo: 12, score: 8 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'eye-color',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 2, score: 1 },
        { upTo: 3, score: 2 },
        { upTo: 5, score: 4 },
        { upTo: 10, score: 7 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'body-type',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 2, score: 2 },
        { upTo: 4, score: 4 },
        { upTo: 5, score: 6 },
        { upTo: 8, score: 8 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'breast-size',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 2, score: 2 },
        { upTo: 4, score: 4 },
        { upTo: 6, score: 6 },
        { upTo: 10, score: 8 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'hair-style',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 3, score: 1 },
        { upTo: 6, score: 3 },
        { upTo: 12, score: 5 },
        { upTo: 25, score: 7 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'outfits',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 5, score: 2 },
        { upTo: 15, score: 4 },
        { upTo: 25, score: 6 },
        { upTo: 35, score: 7 },
        { upTo: 50, score: 8 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'creator-personalities',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 3, score: 2 },
        { upTo: 6, score: 4 },
        { upTo: 10, score: 6 },
        { upTo: 15, score: 8 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'relationship',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 4, score: 2 },
        { upTo: 8, score: 4 },
        { upTo: 12, score: 6 },
        { upTo: 20, score: 8 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'kink-options',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 0, score: 0 },
        { upTo: 3, score: 3 },
        { upTo: 6, score: 6 },
        { upTo: 9, score: 9 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'role',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 5, score: 2 },
        { upTo: 15, score: 4 },
        { upTo: 25, score: 6 },
        { upTo: 40, score: 8 },
        { upTo: 999999, score: 10 },
      ],
    },
  },
  {
    category: 'customization',
    slug: 'voice',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 3, score: 2 },
        { upTo: 6, score: 4 },
        { upTo: 9, score: 5 },
        { upTo: 15, score: 7 },
        { upTo: 999999, score: 10 },
      ],
    },
  },

  // Video capabilities
  { category: 'video', slug: 'text-to-video', weight: 5 },
  { category: 'video', slug: 'image-to-video', weight: 17 },
  { category: 'video', slug: 'chat-video', weight: 17 },
  { category: 'video', slug: 'audio', weight: 17 },
  {
    category: 'video',
    slug: 'maximum-length',
    scoringRule: {
      kind: 'bands',
      bands: [
        { upTo: 5, score: 2 },
        { upTo: 10, score: 4 },
        { upTo: 15, score: 6 },
        { upTo: 30, score: 8 },
        { upTo: 60, score: 9 },
        { upTo: 999999, score: 10 },
      ],
    },
  },

  // Pricing
  { category: 'pricing', slug: 'free-trial', weight: 18 },
];

const { evidenceDefinitions } = await (db.query as any)({
  evidenceDefinitions: { subscore: { category: {} } },
});

const chunks: any[] = [];
let matched = 0;

for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug as string | undefined;
  const slug = def.slug as string;
  const update = UPDATES.find((u) => u.category === cat && u.slug === slug);
  if (!update) continue;

  const patch: Record<string, unknown> = {};
  if (update.weight !== undefined) patch.weight = update.weight;
  if (update.scoringRule !== undefined) patch.scoringRule = update.scoringRule;
  if (Object.keys(patch).length === 0) continue;

  chunks.push(db.tx.evidenceDefinitions[def.id].update(patch));
  matched++;
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

console.log(`Backfill v6 complete (${matched} evidence definitions updated).`);
