import type { APIRoute } from 'astro';
import { buildXmlSitemapIndex } from '../lib/sitemap';

// Sitemap index — the single URL submitted to Google. It points at the child
// sitemaps (pages, reviews, methodology, guides, roundups).
export const GET: APIRoute = async ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://aigirlfriend.expert';
  const body = buildXmlSitemapIndex(origin);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
