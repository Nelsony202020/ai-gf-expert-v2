import { publicSiteOrigin, resolveCanonicalUrl } from '../siteOrigin';
import {
  resolveProductSeoMeta,
  type ProductPageHead,
  type ProductSeoFields,
  type ProductSeoSource,
} from './productMeta';

function robotsDirective(noindex?: boolean, nofollow?: boolean): string | undefined {
  const parts: string[] = [];
  if (noindex) parts.push('noindex');
  if (nofollow) parts.push('nofollow');
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function absolutizeUrl(url: string | null | undefined, origin: string): string | null {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    return new URL(trimmed, origin || 'https://example.com').toString();
  } catch {
    return trimmed;
  }
}

/** Resolved `<head>` + hero heading values for a live or preview review page. */
export function resolveProductPageHead(
  product: ProductSeoSource,
  opts: { astroSite?: URL | string | null; preview?: boolean; draft?: boolean } = {},
): ProductPageHead {
  const seo = product.seo ?? {};
  const origin = publicSiteOrigin(opts.astroSite);
  const featuredImageUrl = product.featuredImage?.full ?? null;
  const fields: ProductSeoFields = {
    name: product.name,
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    h1Override: seo.h1Override,
    searchExcerpt: seo.searchExcerpt,
    directoryDescription: product.directoryDescription,
    tagline: product.tagline,
    oneLineVerdict: product.overallSummary,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImageUrl: seo.ogImageUrl,
    socialImageUrl: seo.socialImageUrl,
  };

  const resolved = resolveProductSeoMeta(fields, {
    productName: product.name,
    featuredImageUrl,
  });

  const fallbackTitle = `${product.name} Review`;
  const baseTitle = resolved.seoTitle || fallbackTitle;
  const title = opts.preview
    ? `[Preview] ${baseTitle}`
    : opts.draft
      ? `[Draft] ${baseTitle}`
      : baseTitle;

  const h1Override = String(seo.h1Override ?? '').trim();
  const h1 = h1Override || `${product.name} Review`;

  const canonical = resolveCanonicalUrl(
    `/reviews/${product.slug}`,
    seo.canonicalUrl,
    opts.astroSite,
  );

  const robots = opts.preview || opts.draft
    ? 'noindex, nofollow'
    : robotsDirective(seo.noindex, seo.nofollow);

  return {
    title,
    metaDescription: resolved.metaDescription || product.tagline || '',
    h1,
    h1IsOverride: Boolean(h1Override),
    canonical,
    robots,
    ogTitle: resolved.ogTitle || baseTitle,
    ogDescription: resolved.ogDescription || resolved.metaDescription || product.tagline || '',
    ogImage: absolutizeUrl(resolved.ogImageUrl || featuredImageUrl, origin),
  };
}
