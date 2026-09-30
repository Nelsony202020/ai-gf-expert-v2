/**
 * Point the Nectar AI affiliate links at the working trynectar.ai destination.
 *
 * The old URL used the nectar.ai domain; this one is on trynectar.ai and is the
 * only link currently converting. Applied to BOTH Nectar links so the product
 * link and the YouTube link cannot drift apart:
 *   nectar-ai          -> /go/nectar-ai (review page CTAs)
 *   nectar-ai-youtube  -> /go/nectar-ai-youtube and /go/nectar-ai-yt
 *
 * Same field as Admin -> Affiliate links -> destination URL.
 *
 * Run: npx tsx scripts/set-nectar-destination.ts [--dry-run]
 */
import { getDb, isDbConfigured, tx } from '../src/lib/db/server';

const SLUGS = ['nectar-ai', 'nectar-ai-youtube'];
const DEST =
  'https://trynectar.ai/?_ef_transaction_id=&utm_campaign=https%3A%2F%2Faigirlfriend.expert%2F&utm_source=affiliate&utm_medium=referral&oid=5&affid=238&creative_id=2';
const dry = process.argv.includes('--dry-run');

async function main() {
  if (!isDbConfigured()) throw new Error('InstantDB is not configured.');
  const db = getDb();

  const { affiliateLinks } = await db.query({ affiliateLinks: { $: {} } });
  const rows = (affiliateLinks as any[]).filter(
    (l) => SLUGS.includes(String(l.cloakedSlug)) && !l.deletedAt,
  );
  if (rows.length !== SLUGS.length) {
    throw new Error(
      `expected ${SLUGS.length} links, found ${rows.length}: ${rows.map((r) => r.cloakedSlug).join(', ')}`,
    );
  }

  for (const l of rows) {
    console.log(`${l.cloakedSlug}  (clicks ${l.clickCount ?? 0})`);
    console.log(`  from: ${l.destinationUrl}`);
    console.log(`  to:   ${DEST}`);
  }

  if (dry) {
    console.log('\n--dry-run: no write performed.');
    return;
  }

  await db.transact(rows.map((l) => tx.affiliateLinks[l.id].update({ destinationUrl: DEST })));

  const { affiliateLinks: after } = await db.query({ affiliateLinks: { $: {} } });
  console.log('');
  for (const s of SLUGS) {
    const w = (after as any[]).find((l) => l.cloakedSlug === s);
    console.log(`${w?.destinationUrl === DEST ? 'OK  ' : 'FAIL'} ${s}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
