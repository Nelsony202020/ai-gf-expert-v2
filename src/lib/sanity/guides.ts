// Guide content from Sanity, with product references resolved against the
// structured database (single source of truth for names/scores/links).

import { sanityQuery, isSanityConfigured } from './client';
import { getProduct } from '../../data/products';

export interface GuideAuthor {
  name: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
}

export interface GuideSummary {
  title: string;
  slug: string;
  excerpt?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  publishedAt?: string;
  author?: GuideAuthor;
  noindex?: boolean;
}

export interface Guide extends GuideSummary {
  seoTitle?: string;
  seoDescription?: string;
  /** Restricted portable-text body, rendered to HTML by renderGuideBody. */
  body: unknown[];
}

const GUIDE_PROJECTION = `{
  title,
  "slug": slug.current,
  excerpt,
  "heroImageUrl": heroImage.asset->url,
  "heroImageAlt": heroImage.alt,
  publishedAt,
  noindex,
  seoTitle,
  seoDescription,
  "author": author->{ name, "slug": slug.current, bio, "avatarUrl": avatar.asset->url },
  body[]{
    ...,
    _type == "guideImage" => { "url": asset->url, alt, caption }
  }
}`;

export async function listGuides(): Promise<GuideSummary[]> {
  if (!isSanityConfigured()) return [];
  try {
    return await sanityQuery<GuideSummary[]>(
      `*[_type == "guide" && defined(slug.current)] | order(publishedAt desc) ${GUIDE_PROJECTION}`,
    );
  } catch (error) {
    console.error('[guides] Sanity list failed — rendering no guides', error);
    return [];
  }
}

export async function getGuide(slug: string, drafts = false): Promise<Guide | null> {
  if (!isSanityConfigured()) return null;
  const results = await sanityQuery<Guide[]>(
    `*[_type == "guide" && slug.current == $slug] ${GUIDE_PROJECTION}`,
    { slug },
    { drafts },
  );
  return results[0] ?? null;
}

// ---------------------------------------------------------------------------
// Portable text -> HTML (restricted block set only)
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSpans(block: any): string {
  const markDefs: any[] = block.markDefs ?? [];
  return (block.children ?? [])
    .map((span: any) => {
      let html = escapeHtml(String(span.text ?? ''));
      for (const mark of span.marks ?? []) {
        if (mark === 'strong') html = `<strong>${html}</strong>`;
        else if (mark === 'em') html = `<em>${html}</em>`;
        else {
          const def = markDefs.find((d) => d._key === mark);
          if (def?._type === 'link' && def.href) {
            const href = escapeHtml(String(def.href));
            const external = /^https?:\/\//.test(def.href) && !def.href.includes('aigirlfriend.expert');
            html = `<a href="${href}"${external ? ' rel="noopener" target="_blank"' : ''}>${html}</a>`;
          }
        }
      }
      return html;
    })
    .join('');
}

function renderProductReference(block: any, guideSlug: string): string {
  const slug = String(block.productSlug ?? '');
  const product = getProduct(slug);
  if (!product) {
    console.warn(`[guides] Dangling product reference "${slug}" in guide "${guideSlug}"`);
    return '';
  }
  const reviewUrl = `/reviews/${product.slug}`;
  if (block.display === 'inline') {
    return `<a href="${reviewUrl}" class="guide-product-inline">${escapeHtml(product.name)}</a>`;
  }
  return `
<div class="guide-product-card">
  <div class="guide-product-card__info">
    <a href="${reviewUrl}" class="guide-product-card__name">${escapeHtml(product.name)}</a>
    <p class="guide-product-card__tagline">${escapeHtml(product.tagline)}</p>
  </div>
  <div class="guide-product-card__meta">
    <span class="guide-product-card__score">${product.overallScore.toFixed(1)}</span>
    <a href="${reviewUrl}" class="guide-product-card__cta">Read review</a>
  </div>
</div>`;
}

/**
 * Render the restricted portable-text body to HTML. Product references pull
 * live data from the structured database; dangling slugs warn at build time.
 */
export function renderGuideBody(body: unknown[], guideSlug: string): string {
  const out: string[] = [];
  let listTag: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listTag) {
      out.push(`</${listTag}>`);
      listTag = null;
    }
  };

  for (const raw of body ?? []) {
    const block = raw as any;
    if (block._type === 'block') {
      if (block.listItem) {
        const tag = block.listItem === 'number' ? 'ol' : 'ul';
        if (listTag !== tag) {
          closeList();
          out.push(`<${tag}>`);
          listTag = tag;
        }
        out.push(`<li>${renderSpans(block)}</li>`);
        continue;
      }
      closeList();
      const style = block.style ?? 'normal';
      const inner = renderSpans(block);
      if (style === 'h2') out.push(`<h2>${inner}</h2>`);
      else if (style === 'h3') out.push(`<h3>${inner}</h3>`);
      else if (style === 'blockquote') out.push(`<blockquote>${inner}</blockquote>`);
      else out.push(`<p>${inner}</p>`);
      continue;
    }

    closeList();
    if (block._type === 'productReference') {
      out.push(renderProductReference(block, guideSlug));
    } else if (block._type === 'callout') {
      const tone = ['info', 'tip', 'warning'].includes(block.tone) ? block.tone : 'info';
      out.push(`<div class="guide-callout guide-callout--${tone}">${escapeHtml(String(block.text ?? ''))}</div>`);
    } else if (block._type === 'faqSection') {
      const items = (block.items ?? [])
        .map(
          (item: any) => `
<details class="guide-faq__item">
  <summary>${escapeHtml(String(item.question ?? ''))}</summary>
  <p>${escapeHtml(String(item.answer ?? ''))}</p>
</details>`,
        )
        .join('');
      out.push(`<div class="guide-faq">${items}</div>`);
    } else if (block._type === 'guideImage' && block.url) {
      const caption = block.caption ? `<figcaption>${escapeHtml(String(block.caption))}</figcaption>` : '';
      out.push(
        `<figure class="guide-figure"><img src="${escapeHtml(String(block.url))}" alt="${escapeHtml(String(block.alt ?? ''))}" loading="lazy" />${caption}</figure>`,
      );
    }
  }
  closeList();
  return out.join('\n');
}

/** FAQ items across the body, for FAQPage JSON-LD. */
export function extractGuideFaqs(body: unknown[]): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  for (const raw of body ?? []) {
    const block = raw as any;
    if (block._type === 'faqSection') {
      for (const item of block.items ?? []) {
        if (item.question && item.answer) faqs.push({ question: item.question, answer: item.answer });
      }
    }
  }
  return faqs;
}
