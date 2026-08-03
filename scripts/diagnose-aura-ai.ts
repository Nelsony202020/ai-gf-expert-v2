#!/usr/bin/env npx tsx
/** Compare DB-driven Aura AI review output against expectations. */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
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

loadEnv();

import { loadPublishedProductBySlug } from '../src/lib/content/store';
import { isUsablePublicMediaUrl } from '../src/lib/media/url';
import { resolveProductPageHead } from '../src/lib/seo/productMeta';

async function main() {
  const product = await loadPublishedProductBySlug('aura-ai');
  if (!product) {
    console.log('FAIL: loadPublishedProductBySlug returned null');
    process.exit(1);
  }

  const head = resolveProductPageHead(product, { astroSite: 'https://aigirlfriend.expert' });

  console.log('=== IDENTITY ===');
  console.log({ slug: product.slug, name: product.name, score: product.overallScore });

  console.log('=== SEO ===');
  console.log({ robots: head.robots, noindex: product.seo?.noindex, title: head.title?.slice(0, 80) });

  console.log('=== MEDIA ===');
  console.log(`mediaItems: ${product.mediaItems?.length ?? 0}`);
  console.log(`heroGallery: ${product.heroGallery?.length ?? 0}`);
  console.log(`featuredImage: ${product.featuredImage?.full ? 'yes' : 'no'}`);

  console.log('=== CHARACTERS ===');
  console.log(`overview characters: ${product.overview.characters.length}`);
  for (const c of product.overview.characters.slice(0, 4)) {
    console.log({
      name: c.name,
      avatar: Boolean(c.avatar),
      slides: c.storySlides.length,
      usable: isUsablePublicMediaUrl(c.avatar ?? ''),
    });
  }

  console.log('=== VERDICTS ===');
  console.log(`verdict count: ${product.verdicts.length}`);
  console.log(
    'category ids:',
    product.verdicts.filter((v) => v.id !== 'overall').map((v) => v.id),
  );

  const brokenMedia = (product.mediaItems ?? []).filter((m) => !isUsablePublicMediaUrl(m.src));
  console.log('=== CHECKS ===');
  console.log(`broken mediaItems: ${brokenMedia.length}`);
  console.log(`robots noindex: ${head.robots?.includes('noindex') ? 'yes' : 'NO'}`);
  console.log(`expertOpinion length: ${product.expertOpinion.length}`);
  console.log(`pricing monthly: ${product.pricingDisplay.monthly}`);

  if (!head.robots?.includes('noindex')) {
    console.log('\nWARN: page is indexable — expected noindex');
    process.exit(1);
  }

  if ((product.mediaItems?.length ?? 0) === 0) {
    console.log('\nWARN: no mediaItems — run backfill');
    process.exit(1);
  }

  console.log('\nOK: Aura AI looks DB-driven.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
