/**
 * Add /go/ourdream-ai-generate (editable afterwards in Admin → Affiliate links).
 * Upsert by cloakedSlug; re-running only refreshes the fields below.
 *
 * Run: npx tsx scripts/add-ourdream-generate-link.ts [--dry-run]
 */
import { getDb, id, isDbConfigured, tx } from '../src/lib/db/server';

const SLUG = 'ourdream-ai-generate';
const DEST = 'https://www.ourdreamersai13.com/9776S5J/3QQG7/?uid=553&sub1=generate';
const dry = process.argv.includes('--dry-run');

async function main() {
  if (!isDbConfigured()) throw new Error('InstantDB is not configured.');
  const db = getDb();
  const { products, affiliateLinks } = await db.query({
    products: { $: { where: { slug: 'ourdream-ai' } } },
    affiliateLinks: { product: {} },
  });
  const product = (products as any[])[0];
  const od = (affiliateLinks as any[]).filter((l) => String(l.cloakedSlug).startsWith('ourdream'));
  console.log('existing ourdream links:');
  for (const l of od) {
    const { product: _p, ...rest } = l;
    console.log(JSON.stringify(rest));
  }
  if (!product?.id) throw new Error('product ourdream-ai not found');
  const prev = od.find((l) => l.cloakedSlug === SLUG);
  const fields = {
    cloakedSlug: SLUG,
    destinationUrl: DEST,
    linkType: 'campaign',
    campaign: 'generate',
    active: true,
    relTags: 'nofollow sponsored noopener', // same as the other OurDream links
    notes: 'OurDream generate link (uid=553, sub1=generate). Added for the prompt vault.',
  };
  if (dry) return console.log(prev ? 'would update' : 'would create', fields);
  const linkId = prev?.id ?? id();
  await db.transact([
    tx.affiliateLinks[linkId].update(prev ? fields : { ...fields, clickCount: 0, createdAt: Date.now() }),
    tx.affiliateLinks[linkId].link({ product: product.id }),
  ]);
  console.log(prev ? 'updated' : 'created', `/go/${SLUG}`);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
