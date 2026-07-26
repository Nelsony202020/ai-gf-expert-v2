export const prerender = false;

import type { APIRoute } from 'astro';
import { isDbConfigured } from '../lib/db/server';
import { findRedirect, recordRedirectHit } from '../lib/db/redirects';

/**
 * Catch-all for paths that don't match a prerendered page or another server
 * route. Consults the centralized redirect manager, then 404s.
 *
 * (Static files win first on Vercel, so this only runs for unknown paths.)
 */
export const GET: APIRoute = async ({ params }) => {
  const path = `/${params.fallback ?? ''}`;

  if (isDbConfigured()) {
    try {
      const hit = await findRedirect(path);
      if (hit) {
        recordRedirectHit(hit.id);
        return new Response(null, {
          status: hit.redirectType === 302 ? 302 : 301,
          headers: { Location: hit.destinationPath },
        });
      }
    } catch (error) {
      console.error('[redirects] lookup failed', error);
    }
  }

  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>404 · AI Girlfriend Expert</title><meta name="robots" content="noindex"></head>
<body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#fafaf9;color:#1c1917">
<div style="text-align:center"><h1 style="font-size:3rem;margin:0">404</h1><p>This page doesn't exist.</p><a href="/" style="color:#db2777">Back to the homepage</a></div>
</body></html>`,
    { status: 404, headers: { 'Content-Type': 'text/html' } },
  );
};
