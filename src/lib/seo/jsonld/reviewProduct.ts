import type { Product } from '../../../data/products';
import { isLocalUrl } from '../../siteOrigin';
import { reviewPageUrl } from '../../slugs';
import {
  productId,
  reviewId,
  reviewPageId,
  websiteId,
} from './ids';
import type { JsonLdNode } from './omitEmpty';
import { buildBreadcrumbSchema } from './breadcrumb';
import { buildOrganizationRef, buildOrganizationSchema } from './organization';
import { buildPersonRef } from './person';

function notesList(items: string[]): JsonLdNode | undefined {
  const cleaned = items.map((s) => String(s).trim()).filter(Boolean);
  if (cleaned.length === 0) return undefined;
  return {
    '@type': 'ItemList',
    itemListElement: cleaned.map((name, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
    })),
  };
}

function productImage(product: Product): string | undefined {
  const candidates = [
    product.featuredImage?.full,
    product.logo,
    product.heroGallery?.[0]?.full,
    product.gallery[0]?.full,
  ];
  for (const url of candidates) {
    if (url && /^https?:\/\//i.test(url) && !isLocalUrl(url)) return url;
  }
  return undefined;
}

function overallProsCons(product: Product): { pros: string[]; cons: string[] } {
  const overall = product.verdicts.find((v) => v.id === 'overall');
  return {
    pros: overall?.pros ?? [],
    cons: overall?.cons ?? [],
  };
}

function toIsoDate(displayDate: string): string | undefined {
  const trimmed = displayDate.trim();
  if (!trimmed) return undefined;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString().slice(0, 10);
}

/**
 * Published review page graph: WebPage + Product + Review + BreadcrumbList
 * (+ Organization/Person refs). Editorial score → Review.reviewRating only.
 */
export function buildReviewProductSchema(product: Product): JsonLdNode[] {
  if (product.overallScore == null || Number.isNaN(product.overallScore)) {
    return [];
  }

  const slug = product.slug;
  const pageUrl = reviewPageId(slug);
  const pathname = reviewPageUrl(slug);
  const description =
    product.directoryDescription?.trim() ||
    product.overallSummary?.trim() ||
    product.ourTake?.trim() ||
    undefined;
  const { pros, cons } = overallProsCons(product);
  const author = product.authors[0];
  const image = productImage(product);
  const datePublished = toIsoDate(product.reviewedDate);
  const dateModified = toIsoDate(product.modifiedDate) ?? datePublished;
  const breadcrumbLabel = product.seo?.breadcrumbLabel?.trim() || product.name;

  const review: JsonLdNode = {
    '@type': 'Review',
    '@id': reviewId(slug),
    name: `${product.name} Review`,
    reviewBody: product.ourTake?.trim() || product.overallSummary?.trim() || undefined,
    datePublished,
    dateModified,
    author: author
      ? buildPersonRef({ name: author.name, slug: author.slug })
      : undefined,
    publisher: buildOrganizationRef(),
    reviewRating: {
      '@type': 'Rating',
      ratingValue: product.overallScore,
      bestRating: 10,
      worstRating: 0,
    },
    positiveNotes: notesList(pros),
    negativeNotes: notesList(cons),
    itemReviewed: { '@id': productId(slug) },
  };

  const productNode: JsonLdNode = {
    '@type': 'Product',
    '@id': productId(slug),
    name: product.name,
    url: pageUrl,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: product.name,
    },
    review: { '@id': reviewId(slug) },
  };
  if (product.websiteUrl?.trim() && !isLocalUrl(product.websiteUrl)) {
    productNode.sameAs = product.websiteUrl.trim();
  }

  const webPage: JsonLdNode = {
    '@type': 'WebPage',
    '@id': pageUrl,
    url: pageUrl,
    name: `${product.name} Review`,
    description,
    datePublished,
    dateModified,
    isPartOf: { '@id': websiteId() },
    mainEntity: { '@id': productId(slug) },
    publisher: buildOrganizationRef(),
  };

  return [
    webPage,
    productNode,
    review,
    buildBreadcrumbSchema(pathname, [
      { label: 'Home', href: '/' },
      { label: 'Reviews', href: '/reviews/' },
      { label: breadcrumbLabel },
    ]),
    buildOrganizationSchema({ full: false }),
  ];
}
