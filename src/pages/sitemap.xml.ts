export const prerender = false;

import type { APIRoute } from 'astro';
import { buildXmlSitemapIndex } from '../lib/sitemap';
import { publicSiteOrigin } from '../lib/siteOrigin';

// Sitemap index — the single URL submitted to Google. It points at the child
// sitemaps (pages, reviews, methodology, guides, roundups).
export const GET: APIRoute = async ({ site }) => {
  const origin = publicSiteOrigin(site);
  const body = buildXmlSitemapIndex(origin);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
