#!/usr/bin/env npx tsx
// Convert characters|browsing to Yes/No and migrate legacy typed answers to notes.
//
// Usage: npx tsx scripts/backfill-testing-v11.ts

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

const { evidenceDefinitions, evidenceResults } = await (db.query as any)({
  evidenceDefinitions: { subscore: { category: {} } },
  evidenceResults: { evidenceDefinition: {}, testRun: { product: {} } },
});

const browsingDef = (evidenceDefinitions as any[]).find(
  (d) => d.subscore?.category?.slug === 'characters' && d.slug === 'browsing',
);

if (!browsingDef) {
  console.error('characters|browsing definition not found');
  process.exit(1);
}

const chunks: unknown[] = [];

chunks.push(
  db.tx.evidenceDefinitions[browsingDef.id].update({
    measurementType: 'boolean',
    inputType: 'yes_no',
    allowUnableToVerify: false,
    resultFormat: 'Yes or No.',
    scoringRule: { kind: 'manual' },
    internalInstructions:
      'Complete the 10 fixed browsing tasks in the testing guide.\nRecord Yes when browsing is easy overall (most tasks completed smoothly).\nRecord No when browsing is difficult or many tasks fail.\nAdd task details in the internal note if helpful.',
  }),
);

function legacyNote(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  if ('text' in raw && typeof (raw as { text?: unknown }).text === 'string') {
    const text = (raw as { text: string }).text.trim();
    if (text) return text;
  }
  if ('value' in raw) {
    return `Legacy browsing score: ${String((raw as { value: unknown }).value)}`;
  }
  if ('structured' in raw) {
    return `Legacy browsing data: ${JSON.stringify((raw as { structured: unknown }).structured)}`;
  }
  return undefined;
}

let migrated = 0;
for (const result of evidenceResults as any[]) {
  if (result.evidenceDefinition?.id !== browsingDef.id) continue;
  const raw = result.rawValue;
  if (!raw || typeof raw !== 'object') continue;
  if ('status' in raw && ((raw as { status?: string }).status === 'yes' || (raw as { status?: string }).status === 'no')) {
    continue;
  }

  const note = legacyNote(raw);
  const existingNotes = typeof result.internalNotes === 'string' ? result.internalNotes.trim() : '';
  const patch: Record<string, unknown> = {
    rawValue: { status: 'yes' },
  };
  if (note && !existingNotes) patch.internalNotes = note;
  else if (note && existingNotes && !existingNotes.includes(note.slice(0, 40))) {
    patch.internalNotes = `${existingNotes}\n\n${note}`;
  }

  chunks.push(db.tx.evidenceResults[result.id].update(patch));
  migrated += 1;
  const productSlug = result.testRun?.product?.slug ?? 'unknown';
  console.log(`Migrated browsing result for ${productSlug} (${result.id})`);
}

for (let i = 0; i < chunks.length; i += 50) {
  await db.transact(chunks.slice(i, i + 50));
}

console.log(`Backfill v11 complete (${chunks.length} transactions, ${migrated} browsing results migrated).`);
