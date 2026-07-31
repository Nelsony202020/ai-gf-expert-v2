import { defineMiddleware } from 'astro:middleware';
import { getPageOverrides, normalizeOverridePath } from './lib/seo/pageOverrides';

const NOT_FOUND_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>404 · AI Girlfriend Expert</title><meta name="robots" content="noindex"></head>
<body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#fafaf9;color:#1c1917">
<div style="text-align:center"><h1 style="font-size:3rem;margin:0">404</h1><p>This page doesn't exist.</p><a href="/" style="color:#db2777">Back to the homepage</a></div>
</body></html>`;

/**
 * Serve pages that were set to draft from the admin (SEO → Pages → drawer)
 * as 404. Skipped during the production build's prerender pass so drafting
 * never breaks a build; at runtime drafted pages 404 like any unknown URL.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  if (import.meta.env.PROD && context.isPrerendered) return next();

  const path = context.url.pathname;
  // Only guard public HTML pages — never admin, API, or asset requests.
  if (
    path.startsWith('/admin') ||
    path.startsWith('/api') ||
    path.startsWith('/_') ||
    path.startsWith('/go/') ||
    /\.[a-z0-9]+$/i.test(path)
  ) {
    return next();
  }

  try {
    const overrides = await getPageOverrides();
    if (overrides[normalizeOverridePath(path)]?.status === 'draft') {
      return new Response(NOT_FOUND_HTML, {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch {
    // Never let override lookups take the site down.
  }

  return next();
});
