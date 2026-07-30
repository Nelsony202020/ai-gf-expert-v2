import type { APIRoute } from 'astro';
import { buildXmlSitemap } from '../lib/sitemap';
import { loadComparisonProducts } from '../lib/content/comparisonProducts';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://aigirlfriend.expert';
  const publishedProducts = await loadComparisonProducts();
  const body = buildXmlSitemap(origin, publishedProducts);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
