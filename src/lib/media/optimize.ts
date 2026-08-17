/** Bunny Optimizer + public-image helpers for PageSpeed (LCP, next-gen, sizing). */

import { cdnBaseUrlFromEnv } from './cdnClient';

const PLACEHOLDER_RE = /picsum\.photos|placeholder\.com|via\.placeholder/i;
const BUNNY_RE = /b-cdn\.net/i;

/** Local branded fallback when a page would otherwise ship a Picsum LCP image. */
export const PUBLIC_HERO_FALLBACK = '/brand/herman-youtube-review.png';

export function isPlaceholderImage(url: string | undefined | null): boolean {
  return !url || PLACEHOLDER_RE.test(url);
}

export function isBunnyImageUrl(url: string): boolean {
  return BUNNY_RE.test(url);
}

export interface ImageOptimizeOpts {
  /** Max display width in CSS pixels (1x). We request 2x for retina. */
  width?: number;
  quality?: number;
}

/**
 * Append Bunny Optimizer params. If Optimizer is off on the pull zone,
 * Bunny ignores unknown query params and still serves the original file.
 */
export function optimizedImageUrl(url: string | undefined | null, opts: ImageOptimizeOpts = {}): string {
  let src = String(url ?? '').trim();
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  if (/\.svg(\?|#|$)/i.test(src)) return src;
  if (isPlaceholderImage(src)) return src;
  if (src.startsWith('/') && !src.startsWith('//')) {
    const base = cdnBaseUrlFromEnv();
    if (base) src = `${base}${src}`;
  }
  if (/[?&](width|quality)=/i.test(src)) return src;
  if (!isBunnyImageUrl(src) && !src.startsWith('/')) return src;

  const params = new URLSearchParams();
  if (opts.width && opts.width > 0) {
    params.set('width', String(Math.min(Math.round(opts.width * 2), 1600)));
  }
  params.set('quality', String(opts.quality ?? 75));

  const qs = params.toString();
  return qs ? `${src}${src.includes('?') ? '&' : '?'}${qs}` : src;
}

export function imageSrcSet(url: string, widths: number[], quality = 75): string {
  return widths
    .filter((w) => w > 0)
    .map((w) => `${optimizedImageUrl(url, { width: w, quality })} ${w}w`)
    .join(', ');
}
