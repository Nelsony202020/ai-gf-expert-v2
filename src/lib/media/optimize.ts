/** Bunny Optimizer + public-image helpers for PageSpeed (LCP, next-gen, sizing). */

import { isLocalPublicAsset } from './cdn';
import { cdnBaseUrlFromEnv } from './cdnClient';

const PLACEHOLDER_RE = /picsum\.photos|placeholder\.com|via\.placeholder/i;
const BUNNY_RE = /b-cdn\.net/i;
/** Bunny Optimizer max output width — roundup banners ship at 3200px for retina. */
const MAX_OPTIMIZER_WIDTH = 3200;

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
    if (isLocalPublicAsset(src)) return src;
    const base = cdnBaseUrlFromEnv();
    if (base) src = `${base}${src}`;
  }

  if (/[?&](width|quality)=/i.test(src)) return src;
  if (!isBunnyImageUrl(src)) return src;

  const params = new URLSearchParams();
  if (opts.width && opts.width > 0) {
    const dpr = opts.dpr ?? 2;
    params.set('width', String(Math.min(Math.round(opts.width * dpr), MAX_OPTIMIZER_WIDTH)));
  }
  params.set('quality', String(opts.quality ?? 80));
  if (opts.format) params.set('format', opts.format);

  const qs = params.toString();
  return qs ? `${src}${src.includes('?') ? '&' : '?'}${qs}` : src;
}

/** Resize product logos at 2× for retina without flattening transparency. */
export function optimizedLogoUrl(url: string | undefined | null, width = 128): string {
  return optimizedImageUrl(url, { width, quality: 85, format: 'webp' });
}

/** Large hero / featured art (review gallery, directory cards). */
export function optimizedHeroImageUrl(url: string | undefined | null, displayWidth = 960): string {
  return optimizedImageUrl(url, { width: displayWidth, quality: 80, format: 'webp' });
}

/** Drop Bunny Optimizer params so a pasted/admin URL is the real file. */
export function stripOptimizerQuery(url: string | undefined | null): string {
  const src = String(url ?? '').trim();
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src;
  try {
    const u = new URL(src, 'https://aigirlfriend.expert');
    for (const key of ['width', 'height', 'quality', 'format', 'aspect_ratio']) {
      u.searchParams.delete(key);
    }
    const qs = u.searchParams.toString();
    const path = /^https?:\/\//i.test(src) ? `${u.origin}${u.pathname}` : u.pathname;
    return qs ? `${path}?${qs}` : path;
  } catch {
    return src;
  }
}

/**
 * Full-bleed roundup banner. Largest candidate is the original file —
 * Bunny `width=3200` upscales 1600px ChatGPT/OG exports and looks muddy.
 */
export function optimizedRoundupBannerUrl(url: string | undefined | null, _width = 1600): string {
  return stripOptimizerQuery(url);
}

export function roundupBannerSrcSet(url: string, quality = 88): string {
  const original = stripOptimizerQuery(url);
  if (!original) return '';
  const mobile = imageSrcSet(original, [640, 960, 1280], quality);
  return mobile ? `${mobile}, ${original} 1920w` : `${original} 1920w`;
}

/** Responsive srcset for hero frames — widths are physical pixels (dpr baked in). */
export function heroImageSrcSet(
  url: string,
  widths: number[] = [640, 960, 1280, 1600, 1920],
  quality = 85,
): string {
  return imageSrcSet(url, widths, quality);
}

/** Card / row thumbnails and medium previews. */
export function optimizedCardImageUrl(url: string | undefined | null, displayWidth = 480): string {
  return optimizedImageUrl(url, { width: displayWidth, quality: 82 });
}

export function imageSrcSet(url: string, widths: number[], quality = 80): string {
  return widths
    .filter((w) => w > 0)
    .map((w) => `${optimizedImageUrl(url, { width: w, quality, dpr: 1, format: 'webp' })} ${w}w`)
    .join(', ');
}
