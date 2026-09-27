/**
 * Add /go/juicychat-ai-youtube — the YouTube campaign link for JuicyChat AI.
 *
 * Every other brand has both a product link and a `-youtube` twin sharing the
 * same destination (candy-ai, girlfriendgpt, nectar-ai, ourdream-ai). JuicyChat
 * had only the product link, so /go/juicychat-ai-youtube/ 302'd to the homepage
 * and the click was lost.
 *
 * The 18+ interstitial needs no flag: needsYoutubeAgeGate() infers it from any
 * slug ending in -youtube or -yt, which is why every link in the table shows
 * ageGate unset and the YouTube ones still gate.
 *
 * Upsert by cloakedSlug; re-running only refreshes the fields below. Editable
 * afterwards in Admin -> Affiliate links.
 *
 * Run: npx tsx scripts/add-juicychat-youtube-link.ts [--dry-run]
 */
import { getDb, id, isDbConfigured, tx } from '../src/lib/db/server';

const SLUG = 'juicychat-ai-youtube';
const PRODUCT_SLUG = 'juicychat-ai';
/** Same destination as the /go/juicychat-ai product link, matching every other brand. */
const DEST =
  'https://www.juicychat.ai/?nsfw=1&irclickid=WzFUZ4RA5xyZTDy0yiWnZzrFUkr0kyxA%3A0M1y00&sharedid=&irpid=6374000&irgwc=1&afsrc=1&utm_source=impact&utm_medium=expert';
const dry = process.argv.includes('--dry-run');

async function main() {
  if (!isDbConfigured()) throw new Error('InstantDB is not configured.');
  const db = getDb();

  const { products, affiliateLinks } = await db.query({
    products: { $: { where: { slug: PRODUCT_SLUG } } },
    affiliateLinks: { product: {} },
  });
  const product = (products as any[])[0];
  if (!product?.id) throw new Error(`product ${PRODUCT_SLUG} not found`);

  const existing = (affiliateLinks as any[]).find((l) => l.cloakedSlug === SLUG && !l.deletedAt);
  console.log(`product:  ${product.name} (${product.id})`);
  console.log(`existing: ${existing ? `${existing.id} (clicks ${existing.clickCount ?? 0})` : 'none — creating'}`);
  console.log(`dest:     ${DEST}`);

  const fields = {
    cloakedSlug: SLUG,
    destinationUrl: DEST,
    campaign: 'youtube',
    linkType: 'campaign',
    active: true,
    relTags: 'nofollow sponsored noopener',
    notes: 'YouTube traffic from the JuicyChat AI video review (9iTPpT3o3Eo).',
  };

  if (dry) {
    console.log('\n--dry-run: would write', JSON.stringify(fields, null, 1));
    return;
  }

  const linkId = existing?.id ?? id();
  await db.transact([
    tx.affiliateLinks[linkId].update({
      ...fields,
      ...(existing ? {} : { createdAt: Date.now(), clickCount: 0, lastCheckStatus: 'unchecked' }),
    }),
    tx.affiliateLinks[linkId].link({ product: product.id }),
  ]);

  const { affiliateLinks: after } = await db.query({ affiliateLinks: { $: {}, product: {} } });
  const w = (after as any[]).find((l) => l.cloakedSlug === SLUG);
  console.log(`\nwritten: ${w?.cloakedSlug}  active=${w?.active}  campaign=${w?.campaign}`);
  console.log(`         product=${w?.product?.slug ?? w?.product?.[0]?.slug ?? '(unlinked)'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
