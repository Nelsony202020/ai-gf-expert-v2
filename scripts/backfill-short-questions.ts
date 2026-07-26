#!/usr/bin/env npx tsx
// Overwrites questionLabel + helpText on all evidence definitions with the
// short plain-English labels from shortQuestions.ts.
//
// Usage: npx tsx scripts/backfill-short-questions.ts
// Pass --dry-run to preview without writing.

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

const dryRun = process.argv.includes('--dry-run');

const { SHORT_QUESTIONS } = await import('../src/components/admin/testing/shortQuestions.ts');
const { getDb, tx } = await import('../src/lib/db/server');
const db = getDb();

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
  questionLabel?: string;
  helpText?: string;
  subscore?: { category?: { id?: string; slug?: string } };
}[];

const txs = [];
let skipped = 0;

for (const def of defs) {
  const catSlug =
    def.subscore?.category?.slug?.toLowerCase() ??
    (def.subscore?.category?.id ? catSlugById.get(def.subscore.category.id) : undefined);
  if (!catSlug) {
    skipped++;
    continue;
  }
  const key = `${catSlug}|${def.slug}`;
  const short = SHORT_QUESTIONS[key];
  if (!short) {
    skipped++;
    continue;
  }
  const patch = { questionLabel: short.q, helpText: short.hint };
  txs.push(tx.evidenceDefinitions[def.id].update(patch));
  console.log(`${dryRun ? '[dry-run] ' : ''}${key}: "${short.q}"`);
}

if (!dryRun && txs.length > 0) await db.transact(txs);
console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${txs.length} definitions, skipped ${skipped}.`);
