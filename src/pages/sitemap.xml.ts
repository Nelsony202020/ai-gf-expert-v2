import type { APIRoute } from 'astro';
import { buildXmlSitemap } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://aigirlfriend.expert';
  const body = buildXmlSitemap(origin);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
