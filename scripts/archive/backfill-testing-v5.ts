#!/usr/bin/env npx tsx
// Chat media weights, proactive messages boolean, editing-accuracy scoring hint.
//
// Usage: npx tsx scripts/backfill-testing-v5.ts

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

const CHAT_MEDIA_WEIGHTS: Record<string, number> = {
  'images-sent': 7,
  'images-received': 21,
  'voice-sent': 7,
  'voice-received': 20,
  'chat-video': 20,
  gifs: 5,
  reactions: 20,
};

const { evidenceDefinitions } = await (db.query as any)({
  evidenceDefinitions: { subscore: { category: {} } },
});

const chunks: any[] = [];

for (const def of evidenceDefinitions as any[]) {
  const cat = def.subscore?.category?.slug;
  const slug = def.slug as string;

  if (cat === 'chat-features' && CHAT_MEDIA_WEIGHTS[slug] !== undefined) {
    chunks.push(
      db.tx.evidenceDefinitions[def.id].update({ weight: CHAT_MEDIA_WEIGHTS[slug] }),
    );
  }

  if (cat === 'chat-features' && slug === 'proactive-messages') {
    chunks.push(
      db.tx.evidenceDefinitions[def.id].update({
        measurementType: 'boolean',
        unit: null,
        scoringRule: { kind: 'ynl', yes: 10, limited: 5, no: 0, unknown: 0 },
        questionLabel: 'Chat: messages you first?',
        publicDescription: 'character messages you first without prompting',
      }),
    );
  }
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

console.log(`Backfill v5 complete (${chunks.length} updates).`);
