#!/usr/bin/env npx tsx
// Updates video ease-of-use to use scale scoring (1–10 slider = score directly).
// Run: npx tsx scripts/backfill-ease-of-use-scoring.ts

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

const SCALE_RULE = { kind: 'scale' as const, min: 1, max: 10 };

const { getDb } = await import('../src/lib/db/server');
const db = getDb();

const { evidenceDefinitions } = await (db.query as any)({
  evidenceDefinitions: { subscore: { category: {} } },
});

const targets = (evidenceDefinitions as any[]).filter(
  (d) => d.slug === 'ease-of-use' && d.subscore?.category?.slug === 'video',
);

if (targets.length === 0) {
  console.log('No video ease-of-use evidence definitions found.');
  process.exit(0);
}

const tx = targets.map((def) =>
  db.tx.evidenceDefinitions[def.id].update({
    measurementType: 'scale',
    unit: 'score',
    publicDescription: 'how easy the video generator is to use',
    internalInstructions:
      'Create three videos.\nRate how easy the full workflow feels from opening the generator to starting generation.\nUse 1 for very hard and 10 for very easy.',
    resultFormat: '1–10 ease rating (10 = very easy).',
    questionLabel: 'How easy is video generation? (1–10)',
    scoringRule: SCALE_RULE,
  }),
);

await db.transact(tx);

console.log(`Updated ${targets.length} ease-of-use definition(s) to scale scoring (1–10 = score).`);
console.log('Re-open test runs or run calculate to refresh normalized scores.');
