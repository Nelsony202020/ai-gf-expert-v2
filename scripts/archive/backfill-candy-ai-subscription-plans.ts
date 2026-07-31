#!/usr/bin/env npx tsx
// Consolidate Candy AI's three interval-named plan rows into one subscription
// tier with monthly / quarterly / yearly billingOptions.
//
// Usage: npx tsx scripts/backfill-candy-ai-subscription-plans.ts [--dry-run]

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
const now = Date.now();

/** Candy AI's mis-filed rows map to these billing options. */
const CONSOLIDATED = {
  name: 'Premium',
  currency: 'USD',
  includedTokens: 100,
  billingOptions: [
    { interval: 'monthly' as const, price: 13.99, currency: 'USD', active: true },
    { interval: 'quarterly' as const, price: 26.97, currency: 'USD', active: true },
    { interval: 'yearly' as const, price: 47.88, currency: 'USD', active: true },
  ],
};

const { products } = await db.query({
  products: {
    $: { where: { slug: 'candy-ai' } },
    subscriptionPlans: {},
    pricingSnapshots: { plans: {} },
  },
});

const product = products[0];
if (!product) {
  console.log('No candy-ai product found.');
  process.exit(1);
}

const plans = (product.subscriptionPlans ?? []) as any[];
if (plans.length === 0) {
  console.log('No subscription plans on candy-ai — nothing to consolidate.');
  process.exit(0);
}

const keep =
  plans.find((p) => String(p.name).toLowerCase().includes('1 month')) ??
  plans.find((p) => Number(p.price) === 13.99) ??
  plans[0];
const remove = plans.filter((p) => p.id !== keep.id);

if (plans.length === 1 && Array.isArray(keep.billingOptions)) {
  const intervals = new Set(keep.billingOptions.map((o: any) => o.interval));
  if (intervals.has('monthly') && intervals.has('quarterly') && intervals.has('yearly')) {
    console.log('Candy AI already has a single consolidated plan with all billing intervals.');
    process.exit(0);
  }
}

const evidenceIds = [
  ...new Set(
    plans.flatMap((p) => (Array.isArray(p.evidenceMediaIds) ? (p.evidenceMediaIds as string[]) : [])),
  ),
];

console.log(`Product: ${product.name}`);
console.log(`Keep plan: ${keep.id} (${keep.name})`);
console.log(`Remove ${remove.length} duplicate interval row(s):`, remove.map((p) => p.name).join(', '));
console.log('New billing options:', CONSOLIDATED.billingOptions);

if (dryRun) {
  console.log('Dry run — no changes written.');
  process.exit(0);
}

const txs: any[] = [
  db.tx.subscriptionPlans[keep.id].update({
    name: CONSOLIDATED.name,
    billingInterval: 'monthly',
    price: CONSOLIDATED.billingOptions[0].price,
    currency: CONSOLIDATED.currency,
    billingOptions: CONSOLIDATED.billingOptions,
    includedTokens: CONSOLIDATED.includedTokens,
    active: true,
    sortOrder: 0,
    lastVerifiedAt: now,
    evidenceMediaIds: evidenceIds.length > 0 ? evidenceIds : undefined,
    updatedAt: now,
  }),
  ...remove.map((p) => db.tx.subscriptionPlans[p.id].delete()),
];

await db.transact(txs);
console.log(`Consolidated Candy AI into one "${CONSOLIDATED.name}" plan with monthly, quarterly, and yearly billing.`);

for (const snap of product.pricingSnapshots ?? []) {
  const snapPlans = (snap.plans ?? []) as any[];
  if (snapPlans.length === 0) continue;
  const snapKeep = snapPlans[0];
  const snapRemove = snapPlans.slice(1);
  const snapTxs = [
    db.tx.subscriptionPlans[snapKeep.id].update({
      name: CONSOLIDATED.name,
      billingInterval: 'monthly',
      price: CONSOLIDATED.billingOptions[0].price,
      currency: CONSOLIDATED.currency,
      billingOptions: CONSOLIDATED.billingOptions,
      includedTokens: CONSOLIDATED.includedTokens,
      active: true,
      sortOrder: 0,
      lastVerifiedAt: now,
      updatedAt: now,
    }),
    ...snapRemove.map((p) => db.tx.subscriptionPlans[p.id].delete()),
  ];
  if (!dryRun) await db.transact(snapTxs);
  console.log(
    dryRun
      ? `[dry-run] Would update snapshot ${snap.id}: keep 1 plan, remove ${snapRemove.length}`
      : `Updated snapshot ${snap.id}: kept 1 plan, removed ${snapRemove.length} duplicate(s).`,
  );
}
