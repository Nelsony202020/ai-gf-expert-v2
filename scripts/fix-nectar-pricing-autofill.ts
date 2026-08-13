/**
 * One-shot: reactivate image/video cost evidence defs, set Nectar reference
 * plan + unknown feature costs, sync pricing autofill onto the active test run.
 *
 * Usage: npx tsx scripts/fix-nectar-pricing-autofill.ts
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { init, id as newId } from '@instantdb/admin';
import { computePricingSuggestions } from '../src/lib/testing/pricingAutofill';
import { PRICING_AUTOFILL_SLUGS } from '../src/lib/testing/pricingEvidenceSlugs';
import { cheapestMonthlyTier } from '../src/lib/pricing/calc';

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

loadEnv();

const PRODUCT_ID = '9fa968fc-161d-4cf7-a006-5258276cb39d';
const RUN_ID = '59ab7e16-3a07-470f-b8e6-b2dee2c64f8b';
const IMAGE_COST_DEF = '5ee014f6-cbda-4b33-b7da-511569484f23';
const VIDEO_COST_DEF = '9967c1b4-be3d-4bd2-97ef-9938c1b75d78';

function first<T>(x: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(x)) return x[0];
  return x ?? undefined;
}

async function main() {
  const db = init({
    appId: process.env.PUBLIC_INSTANT_APP_ID!,
    adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  });

  const txs: unknown[] = [];

  // 1) Reactivate the linked image/video cost evidence definitions.
  txs.push(db.tx.evidenceDefinitions[IMAGE_COST_DEF].update({ active: true }));
  txs.push(db.tx.evidenceDefinitions[VIDEO_COST_DEF].update({ active: true }));

  const { products } = await db.query({
    products: {
      $: { where: { id: PRODUCT_ID } },
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
      paymentProfiles: {},
      pricingSnapshots: {},
    },
  });
  const product = (products as any[])[0];
  if (!product) throw new Error('Nectar product not found');

  const snapshots = (product.pricingSnapshots ?? []) as any[];
  const snap =
    snapshots.find((s) => s.status === 'active' && !s.deletedAt) ??
    snapshots.find((s) => !s.deletedAt);
  if (!snap) throw new Error('No pricing snapshot');

  const plans = (product.subscriptionPlans ?? []).filter((p: any) => p.active !== false);
  const cheapest = cheapestMonthlyTier(plans as any);
  const refName = String(cheapest?.name ?? 'Premium');
  txs.push(
    db.tx.pricingSnapshots[snap.id].update({
      referencePlanName: refName,
      updatedAt: Date.now(),
    }),
  );

  // 2) Empty credit-cost rows → explicit unknown (do not invent numbers).
  for (const cost of product.featureCosts ?? []) {
    if (cost.active === false) continue;
    const type = String(cost.featureType ?? '');
    if (!['standard_video', 'voice_message', 'voice_call'].includes(type)) continue;
    const hasCredits =
      Number(cost.creditCost) > 0 ||
      Number(cost.minCost) > 0 ||
      Number(cost.maxCost) > 0;
    if (hasCredits) continue;
    if (cost.costType === 'unknown') continue;
    txs.push(
      db.tx.featureCosts[cost.id].update({
        costType: 'unknown',
        updatedAt: Date.now(),
      }),
    );
    console.log(`featureCost ${type} → costType unknown`);
  }

  await db.transact(txs as any);
  console.log(`Activated image/video cost defs; referencePlanName=${refName}`);

  // Reload pricing after writes
  const { products: products2 } = await db.query({
    products: {
      $: { where: { id: PRODUCT_ID } },
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
      paymentProfiles: {},
      pricingSnapshots: {},
    },
  });
  const p2 = (products2 as any[])[0];
  const snap2 =
    (p2.pricingSnapshots ?? []).find((s: any) => s.status === 'active' && !s.deletedAt) ??
    (p2.pricingSnapshots ?? [])[0];

  const source = {
    plans: p2.subscriptionPlans ?? [],
    packages: p2.creditPackages ?? [],
    featureCosts: p2.featureCosts ?? [],
    paymentProfile: first(p2.paymentProfiles) ?? null,
    referencePlanName: snap2?.referencePlanName ?? refName,
  };
  const suggestions = computePricingSuggestions(source as any);
  for (const [k, v] of suggestions) {
    if (/cost|included-credits|monthly-spend/.test(k)) {
      console.log('suggestion', k, JSON.stringify(v));
    }
  }

  // 3) Sync onto the test run (same keys as syncPricingEvidence).
  const { testRuns } = await db.query({
    testRuns: {
      $: { where: { id: RUN_ID } },
      evidenceResults: { evidenceDefinition: {} },
      methodologyVersion: { categories: { subscores: { evidenceDefinitions: {} } } },
    },
  });
  const run = (testRuns as any[])[0];
  const mv = first(run.methodologyVersion);
  if (!mv) throw new Error('No methodology version on run');

  const resultByDef = new Map<string, any>();
  for (const r of run.evidenceResults ?? []) {
    const def = first(r.evidenceDefinition);
    if (def?.id) resultByDef.set(def.id, { ...r, evidenceDefinition: def });
  }

  const now = Date.now();
  const writes: unknown[] = [];
  for (const cat of mv.categories ?? []) {
    if (cat.active === false) continue;
    if (!['pricing', 'images', 'video'].includes(String(cat.slug))) continue;
    for (const sub of cat.subscores ?? []) {
      if (sub.active === false) continue;
      for (const def of sub.evidenceDefinitions ?? []) {
        if (def.active === false || !PRICING_AUTOFILL_SLUGS.has(String(def.slug))) continue;
        const key = `${cat.slug}/${def.slug}`;
        const suggestion = suggestions.get(key);
        if (!suggestion) continue;
        const existing = resultByDef.get(def.id);
        if (existing) {
          writes.push(
            db.tx.evidenceResults[existing.id].update({
              rawValue: suggestion.raw,
              notApplicable: false,
              isUnknown: Boolean(suggestion.isUnknown),
              testDate: now,
              updatedAt: now,
            }),
          );
          console.log('update evidence', key, suggestion.isUnknown ? 'unknown' : suggestion.raw);
        } else {
          const rid = newId();
          writes.push(
            db.tx.evidenceResults[rid]
              .update({
                rawValue: suggestion.raw,
                notApplicable: false,
                isUnknown: Boolean(suggestion.isUnknown),
                testDate: now,
                updatedAt: now,
              })
              .link({ testRun: RUN_ID, evidenceDefinition: def.id, product: PRODUCT_ID }),
          );
          console.log('create evidence', key, suggestion.isUnknown ? 'unknown' : suggestion.raw);
        }
      }
    }
  }

  if (writes.length) {
    // Instant has a transaction size limit — chunk.
    const chunk = 40;
    for (let i = 0; i < writes.length; i += chunk) {
      await db.transact(writes.slice(i, i + chunk) as any);
    }
  }
  console.log(`Synced ${writes.length} pricing evidence row(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
