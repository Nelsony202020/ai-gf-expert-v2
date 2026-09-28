/**
 * Switch the JuicyChat AI affiliate destination from nsfw=1 to sfw=1.
 *
 * Applies to BOTH JuicyChat links, so the product link and the YouTube link
 * cannot drift apart:
 *   juicychat-ai          -> /go/juicychat-ai (review page CTAs)
 *   juicychat-ai-youtube  -> /go/juicychat-ai-youtube and /go/juicychat-ai-yt
 *
 * Only the nsfw=1 -> sfw=1 parameter changes; every other parameter is left
 * exactly as supplied.
 *
 * Run: npx tsx scripts/set-juicychat-sfw-destination.ts [--dry-run]
 */
import { getDb, isDbConfigured, tx } from '../src/lib/db/server';

const SLUGS = ['juicychat-ai', 'juicychat-ai-youtube'];
const DEST =
  'https://www.juicychat.ai/?sfw=1&irclickid=WzFUZ4RA5xyZTDy0yiWnZzrFUkr0kyxA%3A0M1y00&sharedid=&irpid=6374000&irgwc=1&afsrc=1&utm_source=impact&utm_medium=expert';
const dry = process.argv.includes('--dry-run');

async function main() {
  if (!isDbConfigured()) throw new Error('InstantDB is not configured.');
  const db = getDb();

  const { affiliateLinks } = await db.query({ affiliateLinks: { $: {} } });
  const rows = (affiliateLinks as any[]).filter(
    (l) => SLUGS.includes(String(l.cloakedSlug)) && !l.deletedAt,
  );
  if (rows.length !== SLUGS.length) {
    throw new Error(`expected ${SLUGS.length} links, found ${rows.length}: ${rows.map((r) => r.cloakedSlug).join(', ')}`);
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
    const ok = w?.destinationUrl === DEST;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${s}: ${String(w?.destinationUrl).slice(0, 48)}...`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
