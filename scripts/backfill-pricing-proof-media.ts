#!/usr/bin/env npx tsx
// Tag all pricing-tab evidence screenshots as Pricing proof in the media gallery.
//
// Usage: npx tsx scripts/backfill-pricing-proof-media.ts [--dry-run]

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
const { PRICING_PROOF_CAPTION, PRICING_PROOF_TEST_CATEGORY } = await import('../src/lib/media/catalog');

const db = getDb();

const ENTITIES = [
  'subscriptionPlans',
  'creditPackages',
  'featureCosts',
  'paymentProfiles',
  'pricingSnapshots',
  'pricingPromotions',
] as const;

function collectMediaIds(rows: any[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    const list = row.evidenceMediaIds;
    if (!Array.isArray(list)) continue;
    for (const id of list) {
      if (typeof id === 'string' && id.trim()) ids.add(id.trim());
    }
  }
  return ids;
}

const mediaIdSet = new Set<string>();
for (const entity of ENTITIES) {
  const { [entity]: rows } = await (db.query as any)({ [entity]: {} });
  for (const id of collectMediaIds(rows ?? [])) mediaIdSet.add(id);
}

if (mediaIdSet.size === 0) {
  console.log('No pricing evidence media IDs found.');
  process.exit(0);
}

const ids = [...mediaIdSet];
const { media } = await (db.query as any)({
  media: { $: { where: { id: { $in: ids } } } },
});

const rows = (media ?? []) as any[];
console.log(`Found ${rows.length} media row(s) linked from pricing evidence (${ids.length} id(s) referenced).`);

let updated = 0;
const chunks: any[] = [];

for (const row of rows) {
  if (row.deletedAt) continue;
  const needsRole = row.role !== 'proof';
  const needsCategory = row.testCategory !== PRICING_PROOF_TEST_CATEGORY;
  const needsCaption = !String(row.caption ?? '').trim();
  if (!needsRole && !needsCategory && !needsCaption) continue;

  updated += 1;
  const patch: Record<string, unknown> = {};
  if (needsRole) patch.role = 'proof';
  if (needsCategory) patch.testCategory = PRICING_PROOF_TEST_CATEGORY;
  if (needsCaption) patch.caption = PRICING_PROOF_CAPTION;

  console.log(`  ${row.id}: ${JSON.stringify(patch)}`);
  if (!dryRun) chunks.push(db.tx.media[row.id].update(patch));
}

if (dryRun) {
  console.log(`Dry run — would update ${updated} media row(s).`);
  process.exit(0);
}

if (chunks.length === 0) {
  console.log('All pricing evidence media already tagged as Pricing proof.');
  process.exit(0);
}

for (let i = 0; i < chunks.length; i += 100) {
  await db.transact(chunks.slice(i, i + 100));
}
console.log(`Updated ${updated} media row(s) as Pricing proof.`);
