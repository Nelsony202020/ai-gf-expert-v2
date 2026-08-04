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
