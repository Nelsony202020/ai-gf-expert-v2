import type { Roundup, RoundupPick } from '../../../data/roundups/ai-girlfriend';
import { isLocalUrl } from '../../siteOrigin';
import { reviewPageUrl } from '../../slugs';
import { absoluteUrl, organizationId, productId, websiteId } from './ids';
import type { JsonLdNode } from './omitEmpty';
import { buildBreadcrumbSchema } from './breadcrumb';
import { buildOrganizationSchema } from './organization';

function pickImage(pick: RoundupPick): string | undefined {
  const candidates = [pick.logo, pick.gallery?.[0]?.full];
  for (const url of candidates) {
    if (url && /^https?:\/\//i.test(url) && !isLocalUrl(url)) return url;
  }
  return undefined;
}

/**
 * CollectionPage + ItemList of Products for the best-AI-girlfriend roundup.
 * Positions follow visible pick order. Product URLs point at our review pages.
 */
export function buildRoundupItemListSchema(
  roundup: Roundup,
  opts: { pathname?: string; pageTitle?: string } = {},
): JsonLdNode[] {
  const pathname = opts.pathname ?? '/best/ai-girlfriend/';
  const pageUrl = absoluteUrl(pathname);
  const picks = roundup.picks ?? [];
  if (picks.length === 0) return [];

  const itemListElement = picks.map((pick, index) => {
    const reviewUrl = absoluteUrl(pick.reviewUrl || reviewPageUrl(pick.slug));
    const product: JsonLdNode = {
      '@type': 'Product',
      '@id': productId(pick.slug),
      name: pick.name,
      url: reviewUrl,
      image: pickImage(pick),
    };
    return {
      '@type': 'ListItem',
      position: index + 1,
      item: product,
    };
  });

  const itemList: JsonLdNode = {
    '@type': 'ItemList',
    '@id': `${pageUrl}#itemlist`,
    name: roundup.title,
    numberOfItems: picks.length,
    itemListElement,
  };

  const collectionPage: JsonLdNode = {
    '@type': 'CollectionPage',
    '@id': pageUrl,
    url: pageUrl,
    name: opts.pageTitle ?? roundup.title,
    description: roundup.metaDescription,
    isPartOf: { '@id': websiteId() },
    mainEntity: { '@id': `${pageUrl}#itemlist` },
    publisher: { '@id': organizationId() },
  };

  return [
    collectionPage,
    itemList,
    buildBreadcrumbSchema(pathname, [
      { label: 'Home', href: '/' },
      { label: 'Roundups', href: '/best/ai-girlfriend/' },
      { label: roundup.title },
    ]),
    buildOrganizationSchema({ full: false }),
  ];
}
