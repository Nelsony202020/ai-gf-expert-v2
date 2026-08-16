/**
 * Normalize feature-cost statuses to the admin UI model:
 * Cost unknown | Not available | Credit cost (fixed) | Unlimited
 *
 * Also archives methodology v3.2 so only v3.1 is offered for new test runs.
 *
 * Usage: npx tsx scripts/normalize-feature-cost-modes.ts
 */
import { getDb } from '../src/lib/db/server';
import { featureCostAvailability, featureCostRange } from '../src/lib/pricing/calc';

async function main() {
  const db = getDb();

  const { methodologyVersions } = await (db.query as any)({ methodologyVersions: {} });
  for (const v of (methodologyVersions ?? []) as any[]) {
    const version = String(v.version ?? '');
    if (version.includes('3.2') && v.status !== 'archived') {
      console.log(`Archiving methodology ${version} (${v.id})`);
      await db.transact(db.tx.methodologyVersions[v.id].update({ status: 'archived' }));
    }
    if (version.includes('3.1') && v.status !== 'active') {
      console.log(`Activating methodology ${version} (${v.id})`);
      await db.transact(db.tx.methodologyVersions[v.id].update({ status: 'active' }));
    }
  }

  const { featureCosts } = await (db.query as any)({ featureCosts: { product: {} } });
  let updated = 0;
  let skipped = 0;

  for (const row of (featureCosts ?? []) as any[]) {
    if (row.deletedAt) {
      skipped += 1;
      continue;
    }
    const availability = featureCostAvailability(row);
    const range = featureCostRange(row);
    let nextType: string | null = null;

    if (availability === 'included') nextType = 'unlimited';
    else if (availability === 'pay_as_you_go') {
      nextType = range && range.min > 0 ? 'fixed' : 'unknown';
    } else if (!row.costType || String(row.costType).trim() === '') {
      nextType = range && range.min > 0 ? 'fixed' : 'unknown';
    }

    if (!nextType || nextType === row.costType) {
      skipped += 1;
      continue;
    }

    const product = row.product?.slug ?? row.product?.name ?? 'unknown';
    console.log(`Update ${product} ${row.featureType}: ${row.costType ?? '(empty)'} → ${nextType}`);
    await db.transact(db.tx.featureCosts[row.id].update({ costType: nextType }));
    updated += 1;
  }

  console.log(`Done. featureCosts updated=${updated} skipped=${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
