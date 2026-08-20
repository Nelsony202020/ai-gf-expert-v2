/**
 * OurDream video variants were saved as per_second with a flat clip price
 * (e.g. Spicy 1.0 = 100 coins for a 10s video). Calc then did 100 × 10 = 1000.
 *
 * Flat model×duration table prices should be per_generation.
 * Run: npx tsx scripts/migrate-ourdream-video-units.ts
 */
import { getDb, isDbConfigured, tx } from '../src/lib/db/server';

async function main() {
  if (!isDbConfigured()) {
    console.error('InstantDB is not configured.');
    process.exit(1);
  }

  const db = getDb();
  const { products } = await (db.query as any)({
    products: {
      $: { where: { slug: 'ourdream-ai' } },
      featureCosts: {},
    },
  });
  const product = (products as any[])?.[0];
  if (!product) {
    console.error('ourdream-ai product not found');
    process.exit(1);
  }

  const videos = ((product.featureCosts as any[]) ?? []).filter(
    (c) =>
      c.active !== false &&
      String(c.featureType ?? '') === 'standard_video' &&
      String(c.unit ?? '') === 'per_second' &&
      c.durationProduced != null &&
      Number(c.durationProduced) > 0,
  );

  if (videos.length === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  const now = Date.now();
  for (const row of videos) {
    await db.transact([
      tx.featureCosts[row.id].update({
        unit: 'per_generation',
        updatedAt: now,
      }),
    ]);
    console.log(
      `upd ${row.qualityTier ?? row.id}: ${row.creditCost} per_second → per_generation (${row.durationProduced}s clip)`,
    );
  }
  console.log(`\nDone. updated=${videos.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
