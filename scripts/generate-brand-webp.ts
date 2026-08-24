/**
 * Regenerates the WebP brand assets committed under public/brand/.
 *
 * The sources are oversized: the logos ship at 840x465 for a slot that is never
 * wider than ~150 CSS px, and the Herman icons are PNG bitmaps wrapped in an SVG
 * envelope (so they cost megabytes and cannot scale like real vectors).
 *
 * Run after replacing any brand source:  npx tsx scripts/generate-brand-webp.ts
 */
import sharp from 'sharp';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = `${ROOT}/public/brand`;
const kb = (p: string) => (statSync(p).size / 1024).toFixed(1).padStart(7);

/** Logos render at 148x82 CSS px, so 2x is 296x164. */
const LOGOS = ['girlfriend-expert-logo', 'girlfriend-expert-logo-white'];

/** Herman icons render no larger than ~80 CSS px, so 160 covers 2x. */
const ICONS = ['herman-main-icon', 'herman-in-love-icon'];

for (const name of LOGOS) {
  const src = `${BRAND}/${name}.png`;
  const out = `${BRAND}/${name}.webp`;
  await sharp(src).resize(296, 164, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90 })
    .toFile(out);
  console.log(`${kb(src)} KB -> ${kb(out)} KB  ${name}.png -> .webp`);
}

for (const name of ICONS) {
  const src = `${BRAND}/${name}.svg`;
  const out = `${BRAND}/${name}.webp`;
  // Each SVG is an envelope around stacked raster layers (the artwork is one of
  // several <image> elements), so rasterise the whole document rather than pulling
  // a single embedded payload out of it — that would drop every other layer.
  const svg = readFileSync(src);
  await sharp(svg, { density: 300 })
    .resize(160, 160, { fit: 'inside' })
    .webp({ quality: 88 })
    .toFile(out);
  console.log(`${kb(src)} KB -> ${kb(out)} KB  ${name}.svg -> .webp`);
}

// The favicon needs a format every browser accepts; WebP favicons are not
// dependably supported, so the tab icon gets a small PNG of the same artwork.
const favicon = `${BRAND}/herman-main-icon-96.png`;
await sharp(readFileSync(`${BRAND}/herman-main-icon.svg`), { density: 300 })
  .resize(96, 96, { fit: 'inside' })
  .png({ compressionLevel: 9 })
  .toFile(favicon);
console.log(`${kb(`${BRAND}/herman-main-icon.svg`)} KB -> ${kb(favicon)} KB  herman-main-icon.svg -> -96.png`);

/*
 * Homepage hero. optimizedImageUrl() normally hands this off to the Bunny
 * Optimizer via query params, but home-hero-mock.jpg is same-origin (see
 * SAME_ORIGIN_PUBLIC_PATHS in src/lib/media/cdn.ts — it has never been pushed
 * to the pull zone, confirmed 404 there), so those params are silently
 * dropped and the page ships the raw 175 KB source JPEG at every breakpoint.
 * Pre-generate the WebP variants locally instead so the srcset is real.
 * Source is 1024x537, so 1024 is the largest non-upscaled width.
 */
const HERO_WIDTHS = [480, 640, 800, 1024];
const heroSrc = `${BRAND}/home-hero-mock.jpg`;
for (const w of HERO_WIDTHS) {
  const out = `${BRAND}/home-hero-mock-${w}.webp`;
  await sharp(heroSrc).resize(w, null).webp({ quality: 80 }).toFile(out);
  console.log(`${kb(heroSrc)} KB -> ${kb(out)} KB  home-hero-mock.jpg -> -${w}.webp`);
}
