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
  /** Max display width in CSS pixels (1x). Multiplied by `dpr` unless `dpr` is 1. */
  width?: number;
  quality?: number;
  /** Device pixel ratio. Default 2. Use 1 when `width` is already a srcset pixel width. */
  dpr?: number;
  /** Bunny Optimizer output format. Use jpeg for huge/animated webp avatars. */
  format?: 'jpeg' | 'webp' | 'png';
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
    const dpr = opts.dpr ?? 2;
    params.set('width', String(Math.min(Math.round(opts.width * dpr), 1600)));
  }
  params.set('quality', String(opts.quality ?? 75));
  if (opts.format) params.set('format', opts.format);

  const qs = params.toString();
  return qs ? `${src}${src.includes('?') ? '&' : '?'}${qs}` : src;
}

/** Resize product logos without flattening transparency to JPEG. */
export function optimizedLogoUrl(url: string | undefined | null, width = 128): string {
  return optimizedImageUrl(url, { width, quality: 80, dpr: 1, format: 'webp' });
}

export function imageSrcSet(url: string, widths: number[], quality = 75): string {
  return widths
    .filter((w) => w > 0)
    .map((w) => `${optimizedImageUrl(url, { width: w, quality, dpr: 1 })} ${w}w`)
    .join(', ');
}
