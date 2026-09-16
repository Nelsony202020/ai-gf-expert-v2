export const prerender = false;

import type { APIRoute } from 'astro';
import { loadPublishedProductBySlug } from '../../lib/content/store';

/**
 * Legacy WordPress review URLs still live in YouTube descriptions:
 *   /ai-girlfriend-reviews/<brand>-review  →  /reviews/<brand>/ (301 when published)
 *
 * No WordPress fallback — unknown or removed reviews return 404.
 */
const LEGACY_REVIEW_SLUG_FIXES: Record<string, string> = {
  'kindroid-ai': 'kindroid',
  'dreamgf-ai': 'dreamgf',
};

function resolveReviewSlug(raw: string): string {
  const base = raw.replace(/-review$/, '');
  return LEGACY_REVIEW_SLUG_FIXES[base] ?? base;
}

export const GET: APIRoute = async ({ params }) => {
  const raw = params.slug;
  const slug = (Array.isArray(raw) ? raw.join('/') : String(raw ?? ''))
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();

  if (!slug || slug.includes('..') || /[^a-z0-9/_-]/.test(slug)) {
    return new Response(null, { status: 301, headers: { Location: '/reviews/' } });
  }

  const reviewSlug = resolveReviewSlug(slug);
  const product = await loadPublishedProductBySlug(reviewSlug);
  if (!product) {
    return new Response(null, { status: 404, statusText: 'Not Found' });
  }

  return new Response(null, {
    status: 301,
    headers: { Location: `/reviews/${reviewSlug}/` },
  });
};
