import { PRODUCTION_SITE_ORIGIN } from '../../siteOrigin';
import { publicPagePath } from '../../urls';

const ORIGIN = PRODUCTION_SITE_ORIGIN;

export function websiteId(): string {
  return `${ORIGIN}/#website`;
}

export function organizationId(): string {
  return `${ORIGIN}/#organization`;
}

export function personId(authorSlug: string): string {
  const path = publicPagePath(`/author/${authorSlug}`);
  return `${ORIGIN}${path}#person`;
}

export function reviewPageId(productSlug: string): string {
  return `${ORIGIN}${publicPagePath(`/reviews/${productSlug}`)}`;
}

export function productId(productSlug: string): string {
  return `${reviewPageId(productSlug)}#product`;
}

export function reviewId(productSlug: string): string {
  return `${reviewPageId(productSlug)}#review`;
}

export function breadcrumbId(pathname: string): string {
  const path = publicPagePath(pathname.startsWith('/') ? pathname : `/${pathname}`);
  return `${ORIGIN}${path}#breadcrumb`;
}

export function absoluteUrl(pathname: string): string {
  const path = publicPagePath(pathname.startsWith('/') ? pathname : `/${pathname}`);
  return `${ORIGIN}${path}`;
}

export function siteOrigin(): string {
  return ORIGIN;
}
