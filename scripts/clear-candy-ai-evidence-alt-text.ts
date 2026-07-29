#!/usr/bin/env npx tsx
// Clear auto-generated evidence alt text on Candy AI media (pattern: "Evidence: …").
//
// Usage: npx tsx scripts/clear-candy-ai-evidence-alt-text.ts [--dry-run]

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
const { getDb } = await import('../src/lib/db/server');

const db = getDb();

const { products } = await (db.query as any)({
  products: {
    $: { where: { slug: 'candy-ai' } },
    media: {},
    evidenceResults: { attachments: {} },
  },
});

const product = (products as any[])[0];
if (!product) {
  console.error('No candy-ai product found.');
  process.exit(1);
}

const mediaById = new Map<string, any>();

for (const m of product.media ?? []) {
  if (!m.deletedAt) mediaById.set(m.id, m);
}

for (const result of product.evidenceResults ?? []) {
  for (const m of result.attachments ?? []) {
    if (!m.deletedAt) mediaById.set(m.id, m);
  }
}

const matches = [...mediaById.values()].filter((m) =>
  /^evidence:/i.test(String(m.altText ?? '').trim()),
);

if (matches.length === 0) {
  console.log('No candy-ai media with auto-generated Evidence: alt text found.');
  process.exit(0);
}

console.log(`${dryRun ? '[dry-run] Would clear' : 'Clearing'} alt text on ${matches.length} item(s):`);
for (const m of matches) {
  console.log(`  - ${m.id}: ${String(m.altText).slice(0, 80)}`);
}

if (dryRun) {
  process.exit(0);
}

const chunks = matches.map((m) => db.tx.media[m.id].update({ altText: null }));
await db.transact(chunks);

console.log(`Done — cleared alt text on ${matches.length} candy-ai media item(s).`);
