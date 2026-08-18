#!/usr/bin/env npx tsx
/**
 * Upload a roundup hero/banner image and set ogImageUrl on the roundup record.
 * Small ChatGPT exports (1024×256) are upscaled to 3200×800 before upload.
 *
 * Usage:
 *   npx tsx scripts/set-roundup-featured-image.ts [path-to-image] [roundup-slug] [alt-text]
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { id } from '@instantdb/admin';
import { prepareRoundupBanner } from '../src/lib/media/prepareBanner';

const DEFAULT_IMAGE =
  '/Users/evandernelson/.cursor/projects/Users-evandernelson-Desktop-AI-GF-Expert-V2/assets/Best_AI_Girlfriend_Apps_2026-b88b0f6d-4c77-42e5-bf4e-ea6b4cf856de.png';
const DEFAULT_SLUG = 'ai-girlfriend';
const DEFAULT_ALT = 'Best AI girlfriend 2026 by ai girlfriend expert';

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

  const imagePath = resolve(process.argv[2] ?? DEFAULT_IMAGE);
  const roundupSlug = process.argv[3]?.trim() || DEFAULT_SLUG;
  const altText = process.argv[4]?.trim() || DEFAULT_ALT;

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

  const raw = readFileSync(imagePath);
  const { buffer, width, height, upscaled } = await prepareRoundupBanner(raw);

  if (upscaled) {
    console.log(`Upscaled banner ${width}×${height} (from smaller ChatGPT export)`);
  } else {
    console.log(`Banner already ${width}×${height} — uploading as-is`);
  }

  const db = getDb();
  const now = Date.now();
  const mediaId = id();
  const storagePath = `media/roundups/${roundupSlug}/${mediaId}.png`;
  const cdnUrl = await uploadToBunny(storagePath, buffer, 'image/png');

  const { roundups } = await db.query({
    roundups: { $: { where: { slug: roundupSlug } } },
  });

  const roundup = (roundups as any[])?.find((r) => !r.deletedAt);
  if (!roundup) {
    console.error(`Roundup "${roundupSlug}" not found`);
    process.exit(1);
  }

  await db.transact([
    (db.tx as any).media[mediaId]
      .update({
        url: cdnUrl,
        mediaType: 'image',
        altText,
        caption: `Roundup banner — ${roundupSlug}`,
        adult: false,
        ageGated: false,
        role: 'featured',
        sortOrder: 0,
        approved: true,
        createdAt: now,
      }),
    (db.tx as any).roundups[roundup.id].update({
      ogImageUrl: cdnUrl,
      updatedAt: now,
    }),
    (db.tx as any).roundups[roundup.id].link({ heroImage: mediaId }),
  ]);

  console.log(`Uploaded ${imagePath}`);
  console.log(`CDN URL: ${cdnUrl}`);
  console.log(`Linked ogImageUrl + heroImage → roundup "${roundupSlug}"`);
  console.log(`Alt text: ${altText}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
