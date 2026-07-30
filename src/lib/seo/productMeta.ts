import { resolveSeoTemplate, type SeoTemplateContext } from './templateTags';

export interface ProductSeoFields {
  name?: string;
  seoTitle?: string;
  seoDescription?: string;
  h1Override?: string;
  searchExcerpt?: string;
  directoryDescription?: string;
  tagline?: string;
  oneLineVerdict?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  socialImageUrl?: string;
}

export interface ProductSeoSource {
  slug: string;
  name: string;
  tagline?: string;
  overallSummary?: string;
  directoryDescription?: string;
  featuredImage?: { full: string } | null;
  seo?: {
    seoTitle?: string;
    seoDescription?: string;
    h1Override?: string;
    canonicalUrl?: string;
    noindex?: boolean;
    nofollow?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImageUrl?: string;
    socialImageUrl?: string;
    searchExcerpt?: string;
    breadcrumbLabel?: string;
  };
}

export interface ProductPageHead {
  title: string;
  metaDescription: string;
  h1: string;
  h1IsOverride: boolean;
  canonical: string;
  robots?: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
}

export interface ResolvedProductSeoMeta {
  seoTitle: string;
  seoTitleRaw: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string | null;
}

export function resolveProductOpenGraphImage(
  fields: Pick<ProductSeoFields, 'ogImageUrl' | 'socialImageUrl'>,
  featuredImageUrl?: string | null,
): string | null {
  const og = String(fields.ogImageUrl ?? '').trim();
  if (og) return og;
  const social = String(fields.socialImageUrl ?? '').trim();
  if (social) return social;
  const featured = String(featuredImageUrl ?? '').trim();
  return featured || null;
}

export function resolveMetaDescription(fields: ProductSeoFields): string {
  return (
    String(fields.seoDescription ?? '').trim() ||
    String(fields.searchExcerpt ?? '').trim() ||
    String(fields.directoryDescription ?? '').trim() ||
    String(fields.oneLineVerdict ?? '').trim() ||
    String(fields.tagline ?? '').trim() ||
    ''
  );
}

/** Effective SEO + Open Graph values with social fallbacks applied. */
export function resolveProductSeoMeta(
  fields: ProductSeoFields,
  opts: { featuredImageUrl?: string | null } & SeoTemplateContext = {},
): ResolvedProductSeoMeta {
  const seoTitleRaw = String(fields.seoTitle ?? '').trim();
  const seoTitle =
    resolveSeoTemplate(seoTitleRaw, opts) || String(fields.name ?? '').trim() || 'Product review';
  const metaDescription = resolveMetaDescription(fields);
  const ogTitle = String(fields.ogTitle ?? '').trim() || seoTitle;
  const ogDescription = String(fields.ogDescription ?? '').trim() || metaDescription;
  const ogImageUrl = resolveProductOpenGraphImage(fields, opts.featuredImageUrl);

  return {
    seoTitle,
    seoTitleRaw,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImageUrl,
  };
}

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
  opts: { origin: string; preview?: boolean } = { origin: '' },
): ProductPageHead {
  const seo = product.seo ?? {};
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

  const fallbackTitle = `${product.name} Review — AI Girlfriend Expert`;
  const baseTitle = resolved.seoTitle || fallbackTitle;
  const title = opts.preview ? `[Preview] ${baseTitle}` : baseTitle;

  const h1Override = String(seo.h1Override ?? '').trim();
  const h1 = h1Override || `${product.name} Review`;

  const defaultCanonical = new URL(`/reviews/${product.slug}`, opts.origin || 'https://example.com').toString();
  const canonical = String(seo.canonicalUrl ?? '').trim() || defaultCanonical;

  const robots = opts.preview
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
    ogImage: absolutizeUrl(resolved.ogImageUrl || featuredImageUrl, opts.origin),
  };
}
