import type { HomeExplorerApp } from '../../../data/homepage';
import { isLocalUrl } from '../../siteOrigin';
import { reviewPageUrl } from '../../slugs';
import { absoluteUrl, organizationId, productId, websiteId } from './ids';
import type { JsonLdNode } from './omitEmpty';
import { buildBreadcrumbSchema } from './breadcrumb';
import { buildOrganizationSchema } from './organization';

export interface DirectorySchemaApp {
  slug: string;
  name: string;
  logo?: string;
  reviewUrl?: string;
}

function productImage(app: DirectorySchemaApp): string | undefined {
  const logo = app.logo?.trim();
  if (logo && /^https?:\/\//i.test(logo) && !isLocalUrl(logo)) return logo;
  return undefined;
}

/**
 * CollectionPage + ItemList for /ai-girlfriend-apps/.
 * Pass the same apps array used to render the directory (default server order).
 * Product URLs always point at internal review pages — never affiliate destinations.
 */
export function buildDirectoryItemListSchema(
  apps: DirectorySchemaApp[] | HomeExplorerApp[],
  opts: {
    pathname?: string;
    name: string;
    description: string;
  },
): JsonLdNode[] {
  const pathname = opts.pathname ?? '/ai-girlfriend-apps/';
  const pageUrl = absoluteUrl(pathname);
  const pageId = `${pageUrl}#page`;
  const itemListId = `${pageUrl}#itemlist`;

  const eligible = apps.filter((app) => Boolean(app.slug?.trim() && app.name?.trim()));
  if (eligible.length === 0) return [];

  const itemListElement = eligible.map((app, index) => {
    const rawReview = app.reviewUrl?.trim();
    // Always prefer internal review path by slug — ignore affiliate/external URLs.
    const reviewPath =
      rawReview && rawReview.startsWith('/reviews/')
        ? rawReview.split('#')[0].split('?')[0]
        : reviewPageUrl(app.slug);
    const reviewUrl = absoluteUrl(reviewPath);
    const image = productImage(app);
    const product: JsonLdNode = {
      '@type': 'Product',
      '@id': productId(app.slug),
      name: app.name,
      url: reviewUrl,
      image,
      brand: {
        '@type': 'Brand',
        name: app.name,
      },
    };
    return {
      '@type': 'ListItem',
      position: index + 1,
      item: product,
    };
  });

  const itemList: JsonLdNode = {
    '@type': 'ItemList',
    '@id': itemListId,
    name: opts.name,
    numberOfItems: eligible.length,
    itemListElement,
  };

  const collectionPage: JsonLdNode = {
    '@type': 'CollectionPage',
    '@id': pageId,
    url: pageUrl,
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': websiteId() },
    publisher: { '@id': organizationId() },
    mainEntity: { '@id': itemListId },
  };

  return [
    collectionPage,
    itemList,
    buildBreadcrumbSchema(pathname, [
      { label: 'Home', href: '/' },
      { label: 'AI Girlfriend Apps' },
    ]),
    buildOrganizationSchema({ full: false }),
  ];
}
