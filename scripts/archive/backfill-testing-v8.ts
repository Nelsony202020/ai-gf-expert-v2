#!/usr/bin/env npx tsx
// GIFs 2%, group-chat 5%, voice-calls 27%, voice-received 23%, chat-mode count bands.
//
// Usage: npx tsx scripts/backfill-testing-v8.ts

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

const CHAT_MODE_BANDS = {
  kind: 'bands',
  bands: [
    { upTo: 0, score: 0 },
    { upTo: 1, score: 3 },
    { upTo: 2, score: 5 },
    { upTo: 4, score: 6 },
    { upTo: 6, score: 7 },
    { upTo: 9, score: 8 },
    { upTo: 999999, score: 10 },
  ],
};

const WEIGHTS: Record<string, Record<string, number>> = {
  'chat-features': {
    gifs: 2,
    'voice-received': 23,
    'voice-calls': 27,
    'group-chat': 5,
  },
};

const { evidenceDefinitions } = await (db.query as any)({
  evidenceDefinitions: { subscore: { category: {} } },
});

const chunks: any[] = [];
let matched = 0;

for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug as string | undefined;
  const slug = def.slug as string;
  const patch: Record<string, unknown> = {};
  const weight = WEIGHTS[cat ?? '']?.[slug];
  if (weight !== undefined) patch.weight = weight;
  if (cat === 'chat-features' && slug === 'chat-modes') patch.scoringRule = CHAT_MODE_BANDS;
  if (Object.keys(patch).length === 0) continue;
  chunks.push(db.tx.evidenceDefinitions[def.id].update(patch));
  matched++;
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

console.log(`Backfill v8 complete (${matched} evidence definitions updated).`);
