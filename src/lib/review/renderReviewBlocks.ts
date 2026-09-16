// Server-side HTML renderer for persisted review blocks (public review article tab).

import { isUsablePublicMediaUrl, inferMediaTypeFromUrl } from '../media/url';
import { optimizedHeroImageUrl } from '../media/optimize';
import type { MediaLookupEntry } from '../media/catalog';
import { publicFigureStyle, publicMediaFrameStyle, publicImageStyle, isCircleCrop, clampRadiusPercent } from './imageFrameStyle';
import {
  createGlossaryDecorateState,
  decorateGlossaryPlainText,
  setGlossarySection,
  type GlossaryDecorateState,
} from '../glossary/decorate';
import type { PublishedGlossaryTerm } from '../glossary/types';
import { goAffiliateRel, isGoAffiliateHref } from '../affiliate/rel';

export interface ReviewBlockPublic {
  id: string;
  type: string;
  data?: Record<string, unknown>;
}

export interface ReviewTocEntry {
  id: string;
  label: string;
  level: 2 | 3;
}

interface InlineNode {
  type: string;
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: InlineNode[];
}

interface GlossaryRenderContext {
  terms: PublishedGlossaryTerm[];
  state: GlossaryDecorateState;
}

/** Score/CTA dashboards stay out of the Full Review article (Figma board 3). */
const SKIP_ARTICLE_DASHBOARDS = new Set([
  'scoreOverall',
  'scoreCategory',
  'pricingTable',
  'characterGallery',
  'publicGallery',
  'evidenceSummary',
  'cta',
]);

const CALLOUT_LABEL: Record<string, string> = {
  info: 'Tip',
  warning: 'Important',
  success: 'Worth knowing',
};

const CALLOUT_ICON =
  '<svg class="review-callout__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 18h6M10 22h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isInlineArray(value: unknown): value is InlineNode[] {
  return Array.isArray(value) && value.every((n) => n && typeof n === 'object' && typeof (n as InlineNode).type === 'string');
}

function renderRichNodes(
  nodes: InlineNode[] | undefined,
  glossary?: GlossaryRenderContext | null,
): string {
  if (!nodes) return '';
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      const text = String(node.text ?? '');
      const marks = node.marks ?? [];
      const hasLink = marks.some((m) => m.type === 'link');
      let html =
        glossary && !hasLink
          ? decorateGlossaryPlainText(text, glossary.terms, glossary.state)
          : escapeHtml(text);
      for (const mark of marks) {
        if (mark.type === 'bold') html = `<strong>${html}</strong>`;
        else if (mark.type === 'italic') html = `<em>${html}</em>`;
        else if (mark.type === 'link') {
          const rawHref = String(mark.attrs?.href ?? '');
          const href = escapeHtml(rawHref);
          const rel = isGoAffiliateHref(rawHref)
            ? goAffiliateRel({ newTab: false })
            : 'noopener noreferrer';
          html = `<a href="${href}" class="content-link" rel="${rel}">${html}</a>`;
        }
      }
      out += html;
    } else if (node.type === 'hardBreak') {
      out += '<br />';
    } else if (node.content) {
      out += renderRichNodes(node.content, glossary);
    }
  }
  return out;
}

function renderInline(
  data: Record<string, unknown>,
  glossary?: GlossaryRenderContext | null,
  opts?: { skipGlossary?: boolean },
): string {
  const ctx = opts?.skipGlossary ? null : glossary;
  if (isInlineArray(data.rich)) return renderRichNodes(data.rich, ctx);
  const text = String(data.text ?? '');
  if (!ctx) return escapeHtml(text);
  return decorateGlossaryPlainText(text, ctx.terms, ctx.state);
}

function richNodesPlainText(nodes: InlineNode[]): string {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') out += String(node.text ?? '');
    else if (node.content) out += richNodesPlainText(node.content);
  }
  return out;
}

/** Split TipTap inline content on hard breaks (legacy line-break “lists”). */
function splitRichOnHardBreaks(nodes: InlineNode[]): InlineNode[][] | null {
  const lines: InlineNode[][] = [];
  let current: InlineNode[] = [];
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      lines.push(current);
      current = [];
    } else {
      current.push(node);
    }
  }
  lines.push(current);
  const nonEmpty = lines.filter((line) => richNodesPlainText(line).trim().length > 0);
  return nonEmpty.length >= 2 ? nonEmpty : null;
}

/** Avoid turning prose paragraphs with accidental newlines into lists. */
function looksLikeSimpleListLines(textLines: string[]): boolean {
  if (textLines.length < 2 || textLines.length > 30) return false;
  for (const line of textLines) {
    if (line.length > 120) return false;
    if (line.length > 72 && /[.!?]/.test(line)) return false;
  }
  return true;
}

function renderSimpleBulletList(textLines: string[], richLines: InlineNode[][] | null): string {
  const lis: string[] = [];
  for (let i = 0; i < textLines.length; i++) {
    const rich = richLines?.[i];
    const inner = rich ? renderRichNodes(rich, null) : escapeHtml(textLines[i]);
    lis.push(`<li>${inner}</li>`);
  }
  return `<ul class="review-list">${lis.join('')}</ul>`;
}

function paragraphAsBulletListIfNeeded(data: Record<string, unknown>): string | null {
  if (isInlineArray(data.rich)) {
    const richLines = splitRichOnHardBreaks(data.rich);
    if (richLines) {
      const texts = richLines.map((line) => richNodesPlainText(line).trim());
      if (looksLikeSimpleListLines(texts)) return renderSimpleBulletList(texts, richLines);
    }
  }
  const text = String(data.text ?? '').trim();
  if (!text.includes('\n')) return null;
  const texts = text
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!looksLikeSimpleListLines(texts)) return null;
  return renderSimpleBulletList(texts, null);
}

function headingLevel(type: string, data: Record<string, unknown>): 2 | 3 | 4 {
  if (type === 'h2') return 2;
  if (type === 'h4') return 4;
  const stored = Number(data.level);
  if (stored === 4) return 4;
  if (stored === 2) return 2;
  return 3;
}

function headingId(text: string, blockId: string): string {
  const slug = String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `section-${blockId}`;
}

function youtubeEmbedUrl(url: string): string | null {
  const s = String(url ?? '');
  const m =
    s.match(/[?&]v=([\w-]{6,})/) ??
    s.match(/youtu\.be\/([\w-]{6,})/) ??
    s.match(/\/(?:shorts|embed|live)\/([\w-]{6,})/);
  if (!m) return null;
  return `https://www.youtube-nocookie.com/embed/${m[1]}`;
}

function resolveMediaItem(
  data: Record<string, unknown>,
  mediaById?: Record<string, MediaLookupEntry>,
): { src: string; mediaType: 'image' | 'video' } {
  const mediaId = data.mediaId ? String(data.mediaId) : '';
  const fromCatalog = mediaId ? mediaById?.[mediaId] : undefined;
  if (fromCatalog?.url) {
    return { src: fromCatalog.url, mediaType: fromCatalog.mediaType };
  }

  // A block bound to a library item follows that item's visibility: when the
  // lookup was provided and the id isn't in it (drafted/deleted media), the
  // block renders nothing rather than falling back to its cached URL.
  if (mediaId && mediaById) {
    return { src: '', mediaType: 'image' };
  }

  const stored = String(data.src ?? '').trim();
  if (isUsablePublicMediaUrl(stored)) {
    const hinted = data.mediaType === 'video' ? 'video' : data.mediaType === 'image' ? 'image' : null;
    return {
      src: stored,
      mediaType: hinted ?? inferMediaTypeFromUrl(stored),
    };
  }

  return { src: '', mediaType: 'image' };
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

interface ReviewLightboxItem {
  src: string;
  alt: string;
  caption: string;
  type: 'image' | 'video';
}

function reviewLightboxItem(
  item: Record<string, unknown>,
  src: string,
  mediaType: 'image' | 'video',
  mediaById?: Record<string, MediaLookupEntry>,
): ReviewLightboxItem {
  const mediaId = item.mediaId ? String(item.mediaId) : '';
  const alt = String(item.alt ?? mediaById?.[mediaId]?.altText ?? '');
  const caption = String(item.caption ?? '').trim();
  return {
    src,
    alt,
    // Never fall back to alt — alt is accessibility-only, never shown as caption UI.
    caption,
    type: mediaType,
  };
}

function renderLightboxTrigger(payload: ReviewLightboxItem, innerHtml: string): string {
  const captionAttr = payload.caption
    ? ` data-lightbox-caption="${escapeAttr(payload.caption)}"`
    : '';
  return `<div role="button" tabindex="0" class="review-figure__zoom" data-lightbox-open="${escapeAttr(payload.src)}" data-lightbox-alt="${escapeAttr(payload.alt)}" data-lightbox-type="${payload.type}"${captionAttr} aria-label="Enlarge ${payload.type}">${innerHtml}</div>`;
}

function renderNsfwGate(innerHtml: string): string {
  return `<div role="button" tabindex="0" class="review-figure__zoom review-figure__zoom--nsfw" data-nsfw-gate aria-label="18+ content">${innerHtml}</div>`;
}

function renderImageFigure(
  item: Record<string, unknown>,
  opts?: {
    mediaById?: Record<string, MediaLookupEntry>;
    rowCell?: boolean;
  },
): { html: string; lightboxItem: ReviewLightboxItem | null } {
  const { src, mediaType } = resolveMediaItem(item, opts?.mediaById);
  if (!src) return { html: '', lightboxItem: null };
  const mediaId = item.mediaId ? String(item.mediaId) : '';
  const alt = escapeHtml(
    String(item.alt ?? opts?.mediaById?.[mediaId]?.altText ?? ''),
  );
  const caption = String(item.caption ?? '').trim();
  const radius = clampRadiusPercent(item.borderRadiusPercent);
  const cropped = isCircleCrop(radius);
  const nsfw = Boolean(item.nsfw) || Boolean(mediaId && opts?.mediaById?.[mediaId]?.adult);
  const cellClass = opts?.rowCell ? 'review-figure review-image-row__cell' : 'review-figure';
  const figureClass = [
    cellClass,
    cropped ? 'review-figure--crop' : '',
    nsfw ? 'review-figure--nsfw' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const figureStyle = publicFigureStyle({
    widthPercent: item.widthPercent,
    borderRadiusPercent: item.borderRadiusPercent,
    clipFocusX: item.clipFocusX,
    clipFocusY: item.clipFocusY,
    rowCell: opts?.rowCell,
  });
  const mediaFrameStyle = publicMediaFrameStyle({
    borderRadiusPercent: item.borderRadiusPercent,
    clipFocusX: item.clipFocusX,
    clipFocusY: item.clipFocusY,
  });
  const imageStyle = publicImageStyle({
    borderRadiusPercent: item.borderRadiusPercent,
    clipFocusX: item.clipFocusX,
    clipFocusY: item.clipFocusY,
  });
  const payload = reviewLightboxItem(item, src, mediaType, opts?.mediaById);
  const innerMedia =
    mediaType === 'video'
      ? `<video class="review-video-native review-video-native--preview" src="${escapeHtml(src)}" muted playsinline preload="metadata" style="${imageStyle}pointer-events:none${nsfw ? ';filter:blur(28px) brightness(0.75);transform:scale(1.08)' : ''}"${nsfw ? ' data-nsfw-blurred="true"' : ''}></video>`
      : `<img src="${escapeHtml(optimizedHeroImageUrl(src))}" alt="${alt}" loading="lazy" decoding="async" width="800" height="500" style="${imageStyle}${nsfw ? 'filter:blur(28px) brightness(0.75);transform:scale(1.08)' : ''}"${nsfw ? ' data-nsfw-blurred="true"' : ''} />`;
  // NSFW stays blurred — no lightbox; click shows a coming-soon notice.
  const mediaHtml = nsfw ? renderNsfwGate(innerMedia) : renderLightboxTrigger(payload, innerMedia);
  const nsfwOverlay = nsfw
    ? `<div class="review-figure__nsfw" aria-hidden="true"><span>18+</span></div>`
    : '';
  let html = `<figure class="${figureClass}" style="${figureStyle}"${nsfw ? ' data-nsfw="true"' : ''}><div class="review-figure__media" style="${mediaFrameStyle}">${mediaHtml}${nsfwOverlay}</div>`;
  if (caption) html += `<figcaption>${escapeHtml(caption)}</figcaption>`;
  html += '</figure>';
  return { html, lightboxItem: nsfw ? null : payload };
}

export function buildReviewToc(blocks: ReviewBlockPublic[]): ReviewTocEntry[] {
  const toc: ReviewTocEntry[] = [];
  for (const block of blocks) {
    if (block.type !== 'h2' && block.type !== 'h3' && block.type !== 'h4') continue;
    const data = block.data ?? {};
    const text = String(data.text ?? '').trim();
    if (!text) continue;
    const renderedLevel = headingLevel(block.type, data);
    const tocLevel: 2 | 3 = renderedLevel === 2 ? 2 : 3;
    toc.push({
      id: headingId(text, block.id),
      label: text,
      level: tocLevel,
    });
  }
  return toc;
}

function renderHeading(
  tag: 'h2' | 'h3' | 'h4',
  id: string,
  cls: string,
  innerHtml: string,
): string {
  return `<${tag} id="${escapeHtml(id)}" class="${cls}"><span class="review-heading__text">${innerHtml}</span><span class="review-heading__rule" aria-hidden="true"></span></${tag}>`;
}

function blockPlainText(block: ReviewBlockPublic): string {
  const d = block.data ?? {};
  switch (block.type) {
    case 'paragraph':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'quote':
    case 'callout':
      return String(d.text ?? '');
    case 'bulletList':
    case 'numberedList':
      return Array.isArray(d.items) ? (d.items as unknown[]).map(String).join(' ') : '';
    default:
      return '';
  }
}

export function countReviewBlockWords(blocks: ReviewBlockPublic[]): number {
  let words = 0;
  for (const block of blocks) {
    const text = blockPlainText(block).trim();
    if (!text) continue;
    words += text.split(/\s+/).filter(Boolean).length;
  }
  return words;
}

export function reviewReadingMinutes(blocks: ReviewBlockPublic[], wpm = 200): number {
  return Math.max(1, Math.ceil(countReviewBlockWords(blocks) / wpm));
}

export function renderReviewBlocksHtml(
  blocks: ReviewBlockPublic[],
  opts?: {
    mediaById?: Record<string, MediaLookupEntry>;
    glossaryTerms?: PublishedGlossaryTerm[];
  },
): string {
  const parts: string[] = [];
  const glossaryTerms = opts?.glossaryTerms ?? [];
  const glossary: GlossaryRenderContext | null =
    glossaryTerms.length > 0
      ? { terms: glossaryTerms, state: createGlossaryDecorateState() }
      : null;

  for (const block of blocks) {
    const data = block.data ?? {};
    const type = block.type;

    switch (type) {
      case 'paragraph': {
        if (data.divider === true) {
          parts.push('<hr class="review-divider" />');
          break;
        }
        const rowItems = (data.imageRow as { items?: unknown[] } | undefined)?.items;
        const layoutRow = (data.layoutRow as { columns?: { items?: unknown[] }[] } | undefined)?.columns;
        const flatItems =
          layoutRow?.flatMap((col) => (Array.isArray(col.items) ? col.items : [])) ?? rowItems ?? [];
        if (flatItems.length > 0) {
          const rowLightbox: ReviewLightboxItem[] = [];
          const figures = flatItems
            .map((raw) => {
              const rendered = renderImageFigure(raw as Record<string, unknown>, {
                mediaById: opts?.mediaById,
                rowCell: true,
              });
              if (rendered.lightboxItem) rowLightbox.push(rendered.lightboxItem);
              return rendered.html;
            })
            .filter(Boolean);
          if (figures.length > 0) {
            const galleryAttr =
              rowLightbox.length > 1
                ? ` data-gallery data-gallery-images="${escapeAttr(JSON.stringify(rowLightbox))}"`
                : '';
            parts.push(`<div class="review-image-row"${galleryAttr}>${figures.join('')}</div>`);
          }
          break;
        }
        const asList = paragraphAsBulletListIfNeeded(data);
        if (asList) {
          parts.push(asList);
          break;
        }
        const inner = renderInline(data, glossary);
        if (!inner.trim()) break;
        parts.push(`<p>${inner}</p>`);
        break;
      }
      case 'h2':
      case 'h3':
      case 'h4': {
        const text = String(data.text ?? '');
        const id = headingId(text, block.id);
        if ((type === 'h2' || headingLevel(type, data) === 2) && glossary) {
          setGlossarySection(glossary.state, id);
        }
        const level = headingLevel(type, data);
        const tag = level === 2 ? 'h2' : level === 4 ? 'h4' : 'h3';
        const cls = 'review-heading';
        parts.push(renderHeading(tag, id, cls, renderInline(data, glossary, { skipGlossary: true })));
        break;
      }
      case 'bulletList':
      case 'numberedList': {
        const items = Array.isArray(data.items) ? (data.items as unknown[]).map((s) => String(s ?? '')) : [];
        const richItems = Array.isArray(data.richItems) ? (data.richItems as unknown[]) : null;
        if (items.length === 0 && !richItems?.length) break;
        const tag = type === 'numberedList' ? 'ol' : 'ul';
        const count = Math.max(items.length, richItems?.length ?? 0);
        const lis: string[] = [];
        for (let i = 0; i < count; i++) {
          const rich = richItems?.[i];
          // Hard rule: never auto-tooltip glossary terms inside lists.
          const inner = isInlineArray(rich)
            ? renderRichNodes(rich, null)
            : escapeHtml(items[i] ?? '');
          lis.push(`<li>${inner}</li>`);
        }
        parts.push(`<${tag} class="review-list">${lis.join('')}</${tag}>`);
        break;
      }
      case 'quote': {
        const body = renderInline(data, glossary);
        const attribution = String(data.attribution ?? '').trim();
        let html = `<blockquote class="review-quote"><p>${body}</p>`;
        if (attribution) html += `<footer>— ${escapeHtml(attribution)}</footer>`;
        html += '</blockquote>';
        parts.push(html);
        break;
      }
      case 'callout': {
        const tone = String(data.tone ?? 'info');
        const label = CALLOUT_LABEL[tone] ?? 'Tip';
        const inner = renderInline(data, glossary);
        if (!inner.trim()) break;
        parts.push(
          `<aside class="review-callout review-callout--${escapeHtml(tone)}" role="note"><div class="review-callout__label">${CALLOUT_ICON}<span>${escapeHtml(label)}</span></div><div class="review-callout__body">${inner}</div></aside>`,
        );
        break;
      }
      case 'prosCons': {
        const pros = Array.isArray(data.pros) ? (data.pros as unknown[]).map((s) => String(s ?? '')) : [];
        const cons = Array.isArray(data.cons) ? (data.cons as unknown[]).map((s) => String(s ?? '')) : [];
        if (pros.length === 0 && cons.length === 0) break;
        const list = (items: string[]) =>
          items.length ? `<ul class="review-list">${items.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : '';
        parts.push(
          `<div class="review-proscons">${pros.length ? `<p class="review-proscons__heading">Pros</p>${list(pros)}` : ''}${cons.length ? `<p class="review-proscons__heading">Cons</p>${list(cons)}` : ''}</div>`,
        );
        break;
      }
      case 'faq': {
        const items = Array.isArray(data.items) ? (data.items as { q?: string; a?: string; question?: string; answer?: string }[]) : [];
        if (items.length === 0) break;
        const rows = items
          .map((item) => {
            const q = String(item.q ?? item.question ?? '').trim();
            const a = String(item.a ?? item.answer ?? '').trim();
            if (!q) return '';
            return `<details class="review-faq__item"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`;
          })
          .filter(Boolean);
        if (rows.length) parts.push(`<div class="review-faq">${rows.join('')}</div>`);
        break;
      }
      case 'relatedGuide': {
        const title = String(data.title ?? '').trim();
        const path = String(data.path ?? data.href ?? '').trim();
        if (!title || !path) break;
        parts.push(`<p><a href="${escapeHtml(path)}" class="content-link">${escapeHtml(title)}</a></p>`);
        break;
      }
      case 'methodologyLink': {
        parts.push(`<p><a href="/test/" class="content-link">How we test</a></p>`);
        break;
      }
      case 'image': {
        const rendered = renderImageFigure(data, { mediaById: opts?.mediaById });
        if (rendered.html) parts.push(rendered.html);
        break;
      }
      case 'video': {
        const url = String(data.url ?? '');
        const embed = youtubeEmbedUrl(url);
        const caption = String(data.caption ?? '').trim();
        if (embed) {
          let html = `<figure class="review-figure review-video"><div class="review-video-embed"><iframe src="${escapeHtml(embed)}" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
          if (caption) html += `<figcaption>${escapeHtml(caption)}</figcaption>`;
          html += '</figure>';
          parts.push(html);
        } else if (url) {
          const payload: ReviewLightboxItem = {
            src: url,
            alt: 'Review video',
            caption,
            type: 'video',
          };
          const videoBtn = renderLightboxTrigger(
            payload,
            `<video class="review-video-native review-video-native--preview" src="${escapeHtml(url)}" muted playsinline preload="metadata"></video>`,
          );
          parts.push(
            `<figure class="review-figure review-video">${videoBtn}${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`,
          );
        }
        break;
      }
      case 'table': {
        const headers = Array.isArray(data.headers) ? (data.headers as unknown[]).map((h) => String(h ?? '')) : [];
        const rows = Array.isArray(data.rows)
          ? (data.rows as unknown[][]).map((row) =>
              Array.isArray(row) ? row.map((c) => String(c ?? '')) : [],
            )
          : [];
        if (headers.length === 0 && rows.length === 0) break;
        let html = '<div class="review-table-wrap"><table class="review-table">';
        if (headers.length > 0) {
          html += `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
        }
        if (rows.length > 0) {
          html += `<tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
        }
        html += '</table></div>';
        parts.push(html);
        break;
      }
      default:
        if (SKIP_ARTICLE_DASHBOARDS.has(type)) break;
        if (type) {
          /* Unknown future blocks stay hidden in the article rather than as dashboards. */
        }
        break;
    }
  }

  return parts.join('\n');
}
