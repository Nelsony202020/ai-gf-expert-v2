export const prerender = false;

import type { APIRoute } from 'astro';

/**
 * Legacy WordPress review URLs still live in YouTube descriptions:
 *   /ai-girlfriend-reviews/<brand>-review  →  /reviews/<brand>/
 */
export const GET: APIRoute = async ({ params }) => {
  const raw = params.slug;
  const slug = (Array.isArray(raw) ? raw.join('/') : String(raw ?? ''))
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();

  if (!slug || slug.includes('..') || /[^a-z0-9/_-]/.test(slug)) {
    return new Response(null, { status: 301, headers: { Location: '/reviews/' } });
  }

  const reviewSlug = slug.replace(/-review$/, '');
  return new Response(null, {
    status: 301,
    headers: { Location: `/reviews/${reviewSlug}/` },
  });
};
