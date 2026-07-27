#!/usr/bin/env npx tsx
// Chat-features weight rebalance: group-chat down, voice calls / chat modes / voice up.
//
// Usage: npx tsx scripts/backfill-testing-v7.ts

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

/** category slug -> evidence slug -> weight (% within subscore) */
const WEIGHTS: Record<string, Record<string, number>> = {
  'chat-features': {
    // Media — +5 voice-received, -5 gifs (keeps subscore at 100)
    'voice-received': 25,
    gifs: 0,
    // Interaction — group-chat 10%, +5 voice-calls, +5 chat-modes
    'voice-calls': 22,
    'chat-modes': 22,
    'group-chat': 10,
    'double-texting': 15,
    'proactive-messages': 14,
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
  const weight = WEIGHTS[cat ?? '']?.[slug];
  if (weight === undefined) continue;
  chunks.push(db.tx.evidenceDefinitions[def.id].update({ weight }));
  matched++;
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

console.log(`Backfill v7 complete (${matched} evidence definitions updated).`);
