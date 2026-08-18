#!/usr/bin/env npx tsx
/**
 * Upload pop-art logos (secondaryLogo) and review featured images for products.
 *
 * Usage:
 *   npx tsx scripts/upload-product-brand-images.ts
 *   npx tsx scripts/upload-product-brand-images.ts candy-ai
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { id } from '@instantdb/admin';

const ASSETS_DIR =
  '/Users/evandernelson/.cursor/projects/Users-evandernelson-Desktop-AI-GF-Expert-V2/assets';

const PRODUCT_IMAGES: Array<{
  slug: string;
  name: string;
  popArt: string;
  review: string;
}> = [
  {
    slug: 'candy-ai',
    name: 'Candy AI',
    popArt: 'Candy_AI_Logo_popart-afa286f2-a79d-4de8-8475-674b45250d94.png',
    review: 'Candy_AI_Review_art-2eea31a7-5791-4882-b823-b14e6d1734b6.png',
  },
  {
    slug: 'nectar-ai',
    name: 'Nectar AI',
    popArt: 'Nectar_AI_Logo_popart-e38f7705-030a-41f3-aab8-821b7f969bc4.png',
    review: 'Nectar_AI_review_art-cdc46bc8-bb5a-4b88-b0b0-dcb468a8646a.png',
  },
  {
    slug: 'ourdream-ai',
    name: 'OurDream AI',
    popArt: 'OurDream_AI_Logo_Popart-e1c0226c-36cf-4a4e-b227-e78b94711707.png',
    review: 'OurDream_AI_Review_art-26b7a3a1-37cd-4c0d-b145-2737a3da1921.png',
  },
  {
    slug: 'girlfriendgpt',
    name: 'GirlfriendGPT',
    popArt: 'GirlfriendGPT_logo_popart-a529bdf4-83b5-49df-aa49-187715cfb5f7.png',
    review: 'GirlfriendGPT_Review_art-69225379-1765-48f5-8c6b-76d02a18b6c6.png',
  },
  {
    slug: 'juicychat-ai',
    name: 'JuicyChat AI',
    popArt: 'JuicyChat_AI_Logo_popart-abf02018-e6fc-411e-9e89-376d95abc77d.png',
    review: 'JuicyChat_AI_Review_art-1498d5ce-aa6c-4ea6-a402-a3650f3a5be9.png',
  },
];

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

async function uploadAndLink(
  db: ReturnType<typeof import('../src/lib/db/server').getDb>,
  uploadToBunny: typeof import('../src/lib/media/cdn').uploadToBunny,
  product: { id: string; slug: string },
  filePath: string,
  linkKey: 'featuredImage' | 'secondaryLogo',
  altText: string,
): Promise<string> {
  const buffer = readFileSync(filePath);
  const mediaId = id();
  const ext = filePath.endsWith('.webp') ? 'webp' : 'png';
  const mime = ext === 'webp' ? 'image/webp' : 'image/png';
  const storagePath = `media/${product.slug}/${mediaId}.${ext}`;
  const cdnUrl = await uploadToBunny(storagePath, buffer, mime);
  const now = Date.now();

  await db.transact([
    (db.tx as any).media[mediaId]
      .update({
        url: cdnUrl,
        mediaType: 'image',
        altText,
        caption: altText,
        adult: false,
        ageGated: false,
        role: linkKey === 'featuredImage' ? 'featured' : 'secondaryLogo',
        sortOrder: 0,
        approved: true,
        createdAt: now,
      })
      .link({ product: product.id }),
    (db.tx as any).products[product.id].link({ [linkKey]: mediaId }),
  ]);

  return cdnUrl;
}

async function main() {
  loadEnv();

  const filterSlug = process.argv[2]?.trim();
  const targets = filterSlug
    ? PRODUCT_IMAGES.filter((p) => p.slug === filterSlug)
    : PRODUCT_IMAGES;

  if (targets.length === 0) {
    console.error(`No product config for slug: ${filterSlug}`);
    process.exit(1);
  }

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

  const db = getDb();

  for (const entry of targets) {
    const { products } = await db.query({
      products: {
        $: { where: { slug: entry.slug } },
        featuredImage: {},
        secondaryLogo: {},
      },
    });

    const product = (products as any[])?.[0];
    if (!product) {
      console.warn(`Skipping ${entry.slug}: product not found`);
      continue;
    }

    const popArtPath = resolve(ASSETS_DIR, entry.popArt);
    const reviewPath = resolve(ASSETS_DIR, entry.review);

    const popArtUrl = await uploadAndLink(
      db,
      uploadToBunny,
      product,
      popArtPath,
      'secondaryLogo',
      `${entry.name} pop art logo`,
    );
    console.log(`${entry.slug}: pop art → ${popArtUrl}`);

    const reviewUrl = await uploadAndLink(
      db,
      uploadToBunny,
      product,
      reviewPath,
      'featuredImage',
      `${entry.name} review featured image`,
    );
    console.log(`${entry.slug}: review featured → ${reviewUrl}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
