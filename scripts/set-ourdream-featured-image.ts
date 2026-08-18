#!/usr/bin/env npx tsx
/**
 * Upload OurDream AI hero/featured product image to Bunny and link in InstantDB.
 *
 * Usage:
 *   npx tsx scripts/set-ourdream-featured-image.ts [path-to-image]
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { id } from '@instantdb/admin';

function loadEnv(): void {
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

async function main() {
  loadEnv();

  const defaultPath =
    '/Users/evandernelson/.cursor/projects/Users-evandernelson-Desktop-AI-GF-Expert-V2/assets/image-8f3d528f-0bb4-40d2-a59e-052eba3ba6e0.png';
  const imagePath = resolve(process.argv[2] ?? defaultPath);

  const { getDb, isDbConfigured } = await import('../src/lib/db/server');
  const { isBunnyConfigured, uploadToBunny } = await import('../src/lib/media/cdn');

  if (!isDbConfigured()) {
    console.error('InstantDB not configured');
    process.exit(1);
  }
  if (!isBunnyConfigured()) {
    console.error('Bunny CDN not configured');
    process.exit(1);
  }

  const buffer = readFileSync(imagePath);
  const db = getDb();
  const now = Date.now();
  const slug = 'ourdream-ai';

  const { products } = await db.query({
    products: {
      $: { where: { slug } },
      media: {},
      featuredImage: {},
    },
  });

  const product = (products as any[])?.[0];
  if (!product) {
    console.error(`Product ${slug} not found`);
    process.exit(1);
  }

  const mediaId = id();
  const storagePath = `media/${slug}/${mediaId}.png`;
  const cdnUrl = await uploadToBunny(storagePath, buffer, 'image/png');

  await db.transact([
    (db.tx as any).media[mediaId]
      .update({
        url: cdnUrl,
        mediaType: 'image',
        altText: 'OurDream AI platform preview',
        caption: 'OurDream AI — AI girlfriend platform',
        adult: false,
        ageGated: false,
        role: 'gallery',
        mediaTags: ['hero'],
        sortOrder: 0,
        heroSortOrder: 0,
        approved: true,
        createdAt: now,
      })
      .link({ product: product.id }),
    (db.tx as any).products[product.id].link({ featuredImage: mediaId }),
  ]);

  console.log(`Uploaded ${imagePath}`);
  console.log(`CDN URL: ${cdnUrl}`);
  console.log(`Linked featuredImage ${mediaId} → ${slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
