// Server-side HTML renderer for persisted review blocks (public review article tab).

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

const DYNAMIC_BLOCK_TYPES = new Set([
  'scoreOverall',
  'scoreCategory',
  'pricingTable',
  'characterGallery',
  'publicGallery',
  'evidenceSummary',
  'methodologyLink',
  'callout',
  'prosCons',
  'faq',
  'relatedGuide',
  'cta',
]);

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

function renderRichNodes(nodes: InlineNode[] | undefined): string {
  if (!nodes) return '';
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      let html = escapeHtml(String(node.text ?? ''));
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') html = `<strong>${html}</strong>`;
        else if (mark.type === 'italic') html = `<em>${html}</em>`;
        else if (mark.type === 'link') {
          const href = escapeHtml(String(mark.attrs?.href ?? ''));
          html = `<a href="${href}" rel="noopener noreferrer">${html}</a>`;
        }
      }
      out += html;
    } else if (node.type === 'hardBreak') {
      out += '<br />';
    } else if (node.content) {
      out += renderRichNodes(node.content);
    }
  }
  return out;
}

function renderInline(data: Record<string, unknown>): string {
  if (isInlineArray(data.rich)) return renderRichNodes(data.rich);
  return escapeHtml(String(data.text ?? ''));
}

function headingLevel(type: string, data: Record<string, unknown>): 2 | 3 | 4 {
  if (type === 'h2') return 2;
  const stored = Number(data.level);
  if (stored === 4) return 4;
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

function resolveImageSrc(data: Record<string, unknown>, mediaById?: Record<string, { url?: string }>): string {
  const src = String(data.src ?? '').trim();
  if (src) return src;
  const mediaId = data.mediaId ? String(data.mediaId) : '';
  if (mediaId && mediaById?.[mediaId]?.url) return String(mediaById[mediaId].url);
  return '';
}

export function buildReviewToc(blocks: ReviewBlockPublic[]): ReviewTocEntry[] {
  const toc: ReviewTocEntry[] = [];
  for (const block of blocks) {
    if (block.type !== 'h2' && block.type !== 'h3') continue;
    const data = block.data ?? {};
    const text = String(data.text ?? '').trim();
    if (!text) continue;
    const level = headingLevel(block.type, data);
    if (level === 4) continue;
    toc.push({
      id: headingId(text, block.id),
      label: text,
      level: level as 2 | 3,
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
    case 'quote':
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

function renderPlaceholder(type: string): string {
  const label = type.replace(/([A-Z])/g, ' $1').replace(/-/g, ' ');
  return `<div class="review-block-placeholder" data-block-type="${escapeHtml(type)}">[${escapeHtml(label.trim())} — dynamic block]</div>`;
}

export function renderReviewBlocksHtml(
  blocks: ReviewBlockPublic[],
  opts?: { mediaById?: Record<string, { url?: string; altText?: string }> },
): string {
  const parts: string[] = [];

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
          for (const raw of flatItems) {
            const item = raw as Record<string, unknown>;
            const src = resolveImageSrc(item, opts?.mediaById);
            if (!src) continue;
            const alt = escapeHtml(String(item.alt ?? opts?.mediaById?.[String(item.mediaId ?? '')]?.altText ?? ''));
            const caption = String(item.caption ?? '').trim();
            const width = Math.min(100, Math.max(30, Number(item.widthPercent ?? 100)));
            const radius = Math.min(50, Math.max(0, Number(item.borderRadiusPercent ?? 0)));
            let html = `<figure class="review-figure" style="width:${width}%;max-width:100%;margin-inline:${width < 100 ? 'auto' : '0'};border-radius:${radius}%;overflow:hidden"><img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" />`;
            if (caption) html += `<figcaption>${escapeHtml(caption)}</figcaption>`;
            html += '</figure>';
            parts.push(html);
          }
          break;
        }
        const inner = renderInline(data);
        if (!inner.trim()) break;
        parts.push(`<p>${inner}</p>`);
        break;
      }
      case 'h2':
      case 'h3': {
        const level = headingLevel(type, data);
        const text = String(data.text ?? '');
        const id = headingId(text, block.id);
        const tag = level === 2 ? 'h2' : level === 4 ? 'h4' : 'h3';
        const cls = level === 2 ? 'review-heading review-heading--h2' : 'review-heading';
        parts.push(renderHeading(tag, id, cls, renderInline(data)));
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
          const inner = isInlineArray(rich) ? renderRichNodes(rich) : escapeHtml(items[i] ?? '');
          lis.push(`<li>${inner}</li>`);
        }
        parts.push(`<${tag} class="review-list">${lis.join('')}</${tag}>`);
        break;
      }
      case 'quote': {
        const body = renderInline(data);
        const attribution = String(data.attribution ?? '').trim();
        let html = `<blockquote class="review-quote"><p>${body}</p>`;
        if (attribution) html += `<footer>— ${escapeHtml(attribution)}</footer>`;
        html += '</blockquote>';
        parts.push(html);
        break;
      }
      case 'image': {
        const src = resolveImageSrc(data, opts?.mediaById);
        if (!src) break;
        const alt = escapeHtml(String(data.alt ?? opts?.mediaById?.[String(data.mediaId ?? '')]?.altText ?? ''));
        const caption = String(data.caption ?? '').trim();
        const width = Math.min(100, Math.max(30, Number(data.widthPercent ?? 100)));
        const radius = Math.min(50, Math.max(0, Number(data.borderRadiusPercent ?? 0)));
        let html = `<figure class="review-figure" style="width:${width}%;max-width:100%;margin-inline:${width < 100 ? 'auto' : '0'};border-radius:${radius}%;overflow:hidden"><img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" />`;
        if (caption) html += `<figcaption>${escapeHtml(caption)}</figcaption>`;
        html += '</figure>';
        parts.push(html);
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
          parts.push(
            `<figure class="review-figure review-video"><video class="review-video-native" src="${escapeHtml(url)}" controls preload="metadata"></video>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`,
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
        if (DYNAMIC_BLOCK_TYPES.has(type)) {
          parts.push(renderPlaceholder(type));
        }
        break;
    }
  }

  return parts.join('\n');
}
