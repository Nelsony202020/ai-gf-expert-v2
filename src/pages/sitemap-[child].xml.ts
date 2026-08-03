export const prerender = false;

import type { APIRoute } from 'astro';
import { CHILD_SITEMAPS, buildChildXmlSitemap, type ChildSitemapKey } from '../lib/sitemap';
import { loadPublishedProducts, loadPublishedRoundupSummaries } from '../lib/content/store';
import { getDraftedPaths } from '../lib/seo/pageOverrides';
import { products as fileProducts } from '../data/products';
import { publicSiteOrigin } from '../lib/siteOrigin';

// One child sitemap per content group, e.g. /sitemap-reviews.xml.
// Server-rendered so newly published content appears immediately; pages set
// to draft from the admin are excluded.
export const GET: APIRoute = async ({ params, site }) => {
  const key = params.child as ChildSitemapKey;
  if (!CHILD_SITEMAPS.some((s) => s.key === key)) {
    return new Response(null, { status: 404, statusText: 'Not Found' });
  }

  const origin = publicSiteOrigin(site);
  const [publishedProducts, publishedRoundups, draftedPaths] = await Promise.all([
    loadPublishedProducts(fileProducts),
    loadPublishedRoundupSummaries(),
    getDraftedPaths(),
  ]);

  const body = buildChildXmlSitemap(origin, key, {
    products: publishedProducts,
    roundups: publishedRoundups,
    excludePaths: draftedPaths,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
