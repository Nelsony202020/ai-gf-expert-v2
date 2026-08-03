/**
 * Copy existing InstantDB media files to Bunny CDN and update media.url.
 *
 * Requires .env:
 *   PUBLIC_INSTANT_APP_ID, INSTANT_APP_ADMIN_TOKEN
 *   BUNNY_STORAGE_ZONE, BUNNY_STORAGE_API_KEY, BUNNY_CDN_HOSTNAME
 *
 * Usage:
 *   npx tsx scripts/migrate-media-to-bunny.ts
 *   npx tsx scripts/migrate-media-to-bunny.ts --dry-run
 *   npx tsx scripts/migrate-media-to-bunny.ts --product candy-ai
 */

import { getDb } from '../src/lib/db/server';
import { env } from '../src/lib/env';
import { isBunnyConfigured, isPermanentCdnUrl, uploadToBunny } from '../src/lib/media/cdn';
import { resolveMediaUrl } from '../src/lib/media/url';

const dryRun = process.argv.includes('--dry-run');
const productSlug = (() => {
  const i = process.argv.indexOf('--product');
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

async function main() {
  if (!isBunnyConfigured()) {
    console.error('Bunny CDN is not configured. Set BUNNY_STORAGE_ZONE, BUNNY_STORAGE_API_KEY, BUNNY_CDN_HOSTNAME in .env');
    process.exit(1);
  }
  if (!env('PUBLIC_INSTANT_APP_ID') || !env('INSTANT_APP_ADMIN_TOKEN')) {
    console.error('Missing PUBLIC_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN');
    process.exit(1);
  }

  const db = getDb();
  const query: Record<string, unknown> = {
    media: { file: {}, product: {} },
  };
  if (productSlug) {
    query.media = { $: { where: { 'product.slug': productSlug } }, file: {}, product: {} };
  }

  const { media: rows } = await (db.query as any)(query);
  const list = (rows as any[]).filter((r) => !r.deletedAt);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of list) {
    const currentUrl = String(row.url ?? '');
    if (isPermanentCdnUrl(currentUrl)) {
      skipped += 1;
      continue;
    }

    const sourceUrl = resolveMediaUrl(row);
    if (!sourceUrl || !sourceUrl.includes('files.instantdb.com')) {
      skipped += 1;
      continue;
    }

    const ext = guessExt(sourceUrl, row.mediaType);
    const slug = row.product?.slug ?? 'shared';
    const storagePath = `media/${slug}/${row.id}${ext}`;

    console.log(`${dryRun ? '[dry-run] ' : ''}Migrating ${row.id} → ${storagePath}`);

    if (dryRun) {
      migrated += 1;
      continue;
    }

    try {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
      const cdnUrl = await uploadToBunny(storagePath, buffer, contentType);
      await db.transact(db.tx.media[row.id].update({ url: cdnUrl }));
      migrated += 1;
    } catch (error) {
      failed += 1;
      console.error(`  failed ${row.id}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`Done. migrated=${migrated} skipped=${skipped} failed=${failed}`);
}

function guessExt(url: string, mediaType?: string): string {
  const fromUrl = url.match(/\.(jpe?g|png|webp|gif|svg|mp4|webm)(\?|#|$)/i)?.[1];
  if (fromUrl) return `.${fromUrl.toLowerCase()}`;
  if (mediaType === 'video') return '.mp4';
  return '.jpg';
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
