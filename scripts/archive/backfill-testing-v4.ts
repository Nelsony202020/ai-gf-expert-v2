#!/usr/bin/env npx tsx
// Updates privacy evidence weights, chat-modes flow metadata, and resolution enum.
//
// Usage: npx tsx scripts/backfill-testing-v4.ts

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

const PRIVACY_WEIGHTS: Record<string, number> = {
  training: 14,
  'human-review': 14,
  'data-sharing': 4,
  advertising: 4,
  retention: 20,
  'policy-clarity': 42,
  'delete-chats': 25,
  'delete-account': 25,
  'delete-personal-data': 12,
  'training-opt-out': 12,
  'export-data': 12,
  encryption: 7,
  'two-factor-authentication': 7,
  'billing-descriptor': 43,
  'security-incidents': 43,
};

const CHAT_MODE_BANDS = {
  kind: 'bands',
  bands: [
    { upTo: 0, score: 0 },
    { upTo: 1, score: 4 },
    { upTo: 2, score: 6 },
    { upTo: 3, score: 8 },
    { upTo: 999999, score: 10 },
  ],
};

const { evidenceDefinitions } = await (db.query as any)({
  evidenceDefinitions: { subscore: { category: {} } },
});

const chunks: any[] = [];

for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug;
  const slug = def.slug as string;

  if (cat === 'privacy' && PRIVACY_WEIGHTS[slug] !== undefined) {
    chunks.push(
      db.tx.evidenceDefinitions[def.id].update({ weight: PRIVACY_WEIGHTS[slug] }),
    );
  }

  if (cat === 'privacy' && slug === 'encryption') {
    chunks.push(
      db.tx.evidenceDefinitions[def.id].update({
        measurementType: 'boolean',
        unit: null,
        scoringRule: { kind: 'ynl', yes: 10, limited: 5, no: 0, unknown: 0 },
        questionLabel: 'Does the platform claim end-to-end encryption?',
        publicDescription: 'end-to-end encryption claimed',
      }),
    );
  }

  if (cat === 'chat-features' && slug === 'chat-modes') {
    chunks.push(
      db.tx.evidenceDefinitions[def.id].update({
        measurementType: 'boolean',
        scoringRule: CHAT_MODE_BANDS,
        questionLabel: 'Chat: different chat modes?',
      }),
    );
  }

  if (cat === 'chat-features' && slug === 'mode-types') {
    chunks.push(
      db.tx.evidenceDefinitions[def.id].update({
        measurementType: 'structured',
        unit: null,
        scoringRule: { kind: 'manual' },
        questionLabel: 'Chat: how well do modes work?',
      }),
    );
  }

  if (cat === 'images' && slug === 'resolution') {
    chunks.push(
      db.tx.evidenceDefinitions[def.id].update({
        measurementType: 'enum',
        unit: null,
        questionLabel: 'Images: max resolution?',
      }),
    );
  }
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

console.log(`Backfill v4 complete (${chunks.length} updates).`);
