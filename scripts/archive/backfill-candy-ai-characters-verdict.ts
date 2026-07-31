#!/usr/bin/env npx tsx
// Patch Candy AI characters category verdict (one-time editorial backfill).
// Usage: npx tsx scripts/backfill-candy-ai-characters-verdict.ts [--dry-run]

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

const CHARACTERS_VERDICT = {
  headline: 'Large high quality character library',
  verdict:
    'Candy AI has a great selections of AI characters to chat with. Most of their characters are created because users requested them through email or their Discord server, resulting in a library specifically build for their users. Each character has a unique personality and texting style ensuring each conversation is a brand new experience. It lacks non-binary characters and falls short in the anime characters.',
  mainStrength: 'Large selection of AI girlfriends',
  mainWeakness: 'Lacks AI boyfriends',
  pros: ['146+ Unique AI girlfriends', 'Characters centered around kinks and fetishes'],
  cons: ['Limited anime characters', 'Limited AI boyfriends'],
};

const { getDb } = await import('../src/lib/db/server');
const db = getDb();

const { products } = await db.query({
  products: { $: { where: { slug: 'candy-ai' } } },
});

const product = products[0] as { id: string; categoryVerdicts?: Record<string, unknown> } | undefined;
if (!product) {
  console.log('No candy-ai product found.');
  process.exit(1);
}

const existing = (product.categoryVerdicts ?? {}) as Record<string, unknown>;
const next = {
  ...existing,
  characters: CHARACTERS_VERDICT,
};

console.log(dryRun ? '[dry-run] Would update categoryVerdicts.characters on candy-ai' : 'Updating categoryVerdicts.characters on candy-ai…');

if (!dryRun) {
  await db.transact([(db.tx as any).products[product.id].update({ categoryVerdicts: next })]);
}

console.log('Done.');
process.exit(0);
