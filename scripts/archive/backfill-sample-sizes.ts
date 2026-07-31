#!/usr/bin/env npx tsx
// Updates sampleSize on evidence definitions to match testing/sampleSizes.ts.
//
// Usage: npx tsx scripts/backfill-sample-sizes.ts

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

const { SAMPLE } = await import('../src/components/admin/testing/sampleSizes.ts');
const { getDb, tx } = await import('../src/lib/db/server');
const db = getDb();

/** category slug → slug → sample size */
const SIZES: Record<string, Record<string, number>> = {
  characters: {
    duplicates: SAMPLE.characterReview,
    originality: SAMPLE.characterReview,
    'profile-quality': SAMPLE.characterReview,
    'visual-quality': SAMPLE.characterReview,
  },
  chat: {
    memory: SAMPLE.chatConversations,
    relevance: SAMPLE.chatConversations,
    context: SAMPLE.chatConversations,
    instructions: SAMPLE.chatConversations,
    'roleplay-accuracy': SAMPLE.chatConversations,
    naturalness: SAMPLE.chatConversations * SAMPLE.chatRepliesPerChat,
    personality: SAMPLE.chatConversations,
    roleplay: SAMPLE.chatConversations,
    initiative: SAMPLE.chatConversations * 10,
    emotion: SAMPLE.chatConversations * 5,
    style: SAMPLE.chatConversations * SAMPLE.chatRepliesPerChat,
    repetition: SAMPLE.chatConversations * SAMPLE.chatRepliesPerChat,
    refusals: SAMPLE.refusalPrompts,
    'reply-speed': SAMPLE.speedTestReplies,
    errors: SAMPLE.chatConversations * SAMPLE.chatRepliesPerChat,
    consistency: SAMPLE.chatConversations * 5,
    recovery: SAMPLE.chatConversations,
  },
  images: {
    realism: SAMPLE.imageBatch,
    'visual-errors': SAMPLE.imageBatch,
    detail: SAMPLE.imageBatch,
    composition: SAMPLE.imageBatch,
    'prompt-accuracy': SAMPLE.imageBatch,
    'character-consistency': SAMPLE.imageConsistency,
    'face-consistency': SAMPLE.imageConsistency,
    'body-consistency': SAMPLE.imageConsistency,
    'style-consistency': SAMPLE.imageConsistency,
  },
  video: {
    realism: SAMPLE.videoBatch,
    motion: SAMPLE.videoBatch,
    accuracy: SAMPLE.videoBatch,
    'character-consistency': SAMPLE.videoBatch,
    'visual-errors': SAMPLE.videoBatch,
    'frame-consistency': SAMPLE.videoBatch,
  },
};

const data = await db.query({
  evidenceDefinitions: { subscore: { category: {} } },
  categories: {},
});

const catSlugById = new Map<string, string>();
for (const cat of data.categories as { id: string; slug: string }[]) {
  catSlugById.set(cat.id, String(cat.slug).toLowerCase());
}

const defs = data.evidenceDefinitions as unknown as {
  id: string;
  slug: string;
  subscore?: { category?: { id?: string; slug?: string } };
}[];

const txs = [];
let updated = 0;

for (const def of defs) {
  const catSlug =
    def.subscore?.category?.slug?.toLowerCase() ??
    (def.subscore?.category?.id ? catSlugById.get(def.subscore.category.id) : undefined);
  if (!catSlug) continue;
  const size = SIZES[catSlug]?.[def.slug];
  if (size === undefined) continue;
  txs.push(tx.evidenceDefinitions[def.id].update({ sampleSize: size }));
  console.log(`${catSlug}|${def.slug} → sampleSize ${size}`);
  updated++;
}

if (txs.length > 0) await db.transact(txs);
console.log(`\nUpdated sampleSize on ${updated} definitions.`);
