/**
 * Set the JuicyChat AI YouTube review URL.
 *
 * This is the same field as Admin → product → Setup → "YouTube review URL"
 * (`products.youtubeReviewUrl`). Setting it here is identical to typing it in
 * admin; the script exists so the change is reviewable and repeatable.
 *
 * From there the site already does the rest, with no code change:
 *   store.ts resolveVideoReview()  -> Product.videoReview { embedUrl, channelUrl }
 *   Gallery.astro                  -> the "Watch full video review" hero button
 *   PhotosVideosTab.astro          -> the featured video in Photos & Videos
 *   VideoLightbox.astro            -> the player
 *   go/[slug].ts                   -> the age-gate "back to the video" link for
 *                                     /go/juicychat-ai-youtube
 *
 * Run: npx tsx scripts/set-juicychat-youtube-review.ts [--dry-run]
 */
import { getDb, isDbConfigured, tx } from '../src/lib/db/server';

const SLUG = 'juicychat-ai';
const URL = 'https://www.youtube.com/watch?v=9iTPpT3o3Eo';
const dry = process.argv.includes('--dry-run');

async function main() {
  if (!isDbConfigured()) throw new Error('InstantDB is not configured.');
  const db = getDb();

  const { products } = await db.query({ products: { $: { where: { slug: SLUG } } } });
  const product = (products as any[])[0];
  if (!product?.id) throw new Error(`product ${SLUG} not found`);

  console.log(`product: ${product.name ?? product.slug} (${product.id})`);
  console.log(`  status:            ${product.status ?? '(none)'}`);
  console.log(`  youtubeReviewUrl:  ${product.youtubeReviewUrl ?? '(empty)'}`);
  console.log(`  -> setting to:     ${URL}`);

  if (product.youtubeReviewUrl === URL) {
    console.log('already set — nothing to do.');
    return;
  }
  if (dry) {
    console.log('\n--dry-run: no write performed.');
    return;
  }

  await db.transact(
    tx.products[product.id].update({ youtubeReviewUrl: URL, updatedAt: Date.now() }),
  );

  const { products: after } = await db.query({ products: { $: { where: { slug: SLUG } } } });
  console.log(`\nwritten. now: ${(after as any[])[0]?.youtubeReviewUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
