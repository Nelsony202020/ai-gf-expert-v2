export const prerender = false;

import type { APIRoute } from 'astro';
import { buildXmlSitemapIndex } from '../lib/sitemap';
import { loadPublishedProducts, loadPublishedRoundupSummaries } from '../lib/content/store';
import { getDraftedPaths, getNoindexPaths } from '../lib/seo/pageOverrides';
import { defaultNoindexBrandHubPaths } from '../lib/guides/brandGuideHub';
import { products as fileProducts } from '../data/products';
import { publicSiteOrigin } from '../lib/siteOrigin';

// Sitemap index — the single URL submitted to Google. It points at the child
// sitemaps (pages, reviews, methodology, guides, roundups).
export const GET: APIRoute = async ({ site }) => {
  const origin = publicSiteOrigin(site);
  // Same inputs the children use, so each <sitemap> can carry the newest
  // <lastmod> of the URLs that child actually emits.
  const [publishedProducts, publishedRoundups, draftedPaths, noindexPaths] = await Promise.all([
    loadPublishedProducts(fileProducts),
    loadPublishedRoundupSummaries(),
    getDraftedPaths(),
    getNoindexPaths(defaultNoindexBrandHubPaths()),
  ]);
  const body = buildXmlSitemapIndex(origin, {
    products: publishedProducts,
    roundups: publishedRoundups,
    excludePaths: draftedPaths,
    noindexPaths,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
