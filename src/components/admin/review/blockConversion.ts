// Pure conversion between the stored review block array (the ONLY persisted
// format — see REVIEW_BLOCK_TYPES in src/lib/validation/schemas.ts) and the
// TipTap JSON document the continuous editor works on.
//
// Storage rules honoured here:
// - Only whitelisted block types are ever emitted by docToBlocks.
// - `data` is a free-form record, so editor-only fidelity information lives in
//   extra data keys that public renderers ignore:
//     - paragraph/heading/quote/list text keeps its plain `text`/`items`
//       fields (unchanged public contract) plus an optional `rich` /
//       `richItems` key holding TipTap inline JSON when the editor added
//       marks (bold/italic/link) that plain text cannot express.
//     - H4 headings (whitelist only has h2/h3) are stored as `h3` with
//       `data.level = 4`.
//     - Horizontal rules (no whitelist type) are stored as an empty
//       `paragraph` with `data.divider = true`.
// - Every non-text-flow block (dynamic product data, structured blocks, and
//   unknown future types) maps to a single generic `dynamicBlock` atom node
//   carrying `{ blockType, data }` so nothing is ever dropped.

import { newBlockId, type ReviewBlock, type ReviewBlockType } from '../workspace/reviewBlocks';

// ---------------------------------------------------------------------------
// Minimal TipTap/ProseMirror JSON types (kept local so this module stays pure)
// ---------------------------------------------------------------------------

export interface JSONMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface JSONNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JSONNode[];
  marks?: JSONMark[];
  text?: string;
}

export interface JSONDoc {
  type: 'doc';
  content: JSONNode[];
}

/** Optional lookup context so stored media ids can be resolved to URLs. */
export interface ConversionContext {
  mediaById?: Record<string, { url?: string; altText?: string }>;
}

/** Block types rendered as native editable rich-text flow in the editor. */
const TEXT_FLOW_TYPES = new Set<string>([
  'paragraph',
  'h2',
  'h3',
  'bulletList',
  'numberedList',
  'quote',
  'image',
  'video',
  'table',
]);

export function isDynamicBlockType(type: string): boolean {
  return !TEXT_FLOW_TYPES.has(type);
}

// ---------------------------------------------------------------------------
// Inline content <-> { text, rich? }
// ---------------------------------------------------------------------------

/** Plain text (with \n for hard breaks) -> inline node array. */
function textToInline(text: string): JSONNode[] {
  const out: JSONNode[] = [];
  const lines = String(text ?? '').split('\n');
  lines.forEach((line, i) => {
    if (i > 0) out.push({ type: 'hardBreak' });
    if (line !== '') out.push({ type: 'text', text: line });
  });
  return out;
}

function isInlineArray(value: unknown): value is JSONNode[] {
  return Array.isArray(value) && value.every((n) => n && typeof n === 'object' && typeof (n as JSONNode).type === 'string');
}

/** data { text, rich? } -> inline node array (rich wins when present). */
function dataToInline(d: Record<string, unknown>): JSONNode[] {
  if (isInlineArray(d.rich)) return d.rich as JSONNode[];
  return textToInline(String(d.text ?? ''));
}

/** Inline node array -> plain text (hard breaks become \n). */
function inlineToText(content: JSONNode[] | undefined): string {
  if (!content) return '';
  let out = '';
  for (const node of content) {
    if (node.type === 'text') out += node.text ?? '';
    else if (node.type === 'hardBreak') out += '\n';
    else if (node.content) out += inlineToText(node.content);
  }
  return out;
}

/** True when inline content carries information plain text cannot express. */
function inlineNeedsRich(content: JSONNode[] | undefined): boolean {
  if (!content) return false;
  return content.some(
    (node) =>
      (node.marks && node.marks.length > 0) ||
      (node.type !== 'text' && node.type !== 'hardBreak'),
  );
}

/** Inline node array -> { text, rich? } data fields. */
function inlineToData(content: JSONNode[] | undefined): { text: string; rich?: JSONNode[] } {
  const text = inlineToText(content);
  if (inlineNeedsRich(content)) return { text, rich: content };
  return { text };
}

// ---------------------------------------------------------------------------
// Node builders
// ---------------------------------------------------------------------------

function paragraphNode(content: JSONNode[], blockId?: string | null): JSONNode {
  const node: JSONNode = { type: 'paragraph', attrs: { blockId: blockId ?? null } };
  if (content.length > 0) node.content = content;
  return node;
}

function listNode(
  kind: 'bulletList' | 'orderedList',
  d: Record<string, unknown>,
  blockId: string,
): JSONNode {
  const items: string[] = Array.isArray(d.items) ? (d.items as unknown[]).map((s) => String(s ?? '')) : [];
  const richItems: unknown[] | null = Array.isArray(d.richItems) ? (d.richItems as unknown[]) : null;
  const count = Math.max(items.length, richItems?.length ?? 0, 1);
  const listItems: JSONNode[] = [];
  for (let i = 0; i < count; i++) {
    const rich = richItems?.[i];
    const content = isInlineArray(rich) ? (rich as JSONNode[]) : textToInline(items[i] ?? '');
    listItems.push({ type: 'listItem', content: [paragraphNode(content)] });
  }
  return { type: kind, attrs: { blockId }, content: listItems };
}

const EM_DASH_PREFIX = /^—\s?/;

function quoteNode(d: Record<string, unknown>, blockId: string): JSONNode {
  let paragraphContents: JSONNode[][];
  if (Array.isArray(d.rich) && (d.rich as unknown[]).every((p) => isInlineArray(p))) {
    // rich = array of per-paragraph inline arrays (includes the attribution
    // paragraph when one existed at serialize time).
    paragraphContents = d.rich as JSONNode[][];
  } else {
    paragraphContents = String(d.text ?? '')
      .split('\n')
      .map((line) => (line === '' ? [] : [{ type: 'text', text: line } as JSONNode]));
    const attribution = String(d.attribution ?? '').trim();
    if (attribution) paragraphContents.push([{ type: 'text', text: `— ${attribution}` }]);
  }
  if (paragraphContents.length === 0) paragraphContents = [[]];
  return {
    type: 'blockquote',
    attrs: { blockId },
    content: paragraphContents.map((c) => paragraphNode(c)),
  };
}

function tableNode(d: Record<string, unknown>, blockId: string): JSONNode {
  const headers: string[] = Array.isArray(d.headers) ? (d.headers as unknown[]).map((s) => String(s ?? '')) : [];
  const rows: string[][] = Array.isArray(d.rows)
    ? (d.rows as unknown[]).map((r) => (Array.isArray(r) ? (r as unknown[]).map((c) => String(c ?? '')) : []))
    : [];
  const width = Math.max(headers.length, ...rows.map((r) => r.length), 1);

  const cell = (kind: 'tableHeader' | 'tableCell', text: string): JSONNode => ({
    type: kind,
    content: [paragraphNode(textToInline(text))],
  });

  const rowNodes: JSONNode[] = [];
  if (headers.length > 0) {
    rowNodes.push({
      type: 'tableRow',
      content: Array.from({ length: width }, (_, i) => cell('tableHeader', headers[i] ?? '')),
    });
  }
  for (const row of rows) {
    rowNodes.push({
      type: 'tableRow',
      content: Array.from({ length: width }, (_, i) => cell('tableCell', row[i] ?? '')),
    });
  }
  if (rowNodes.length === 0) {
    rowNodes.push({ type: 'tableRow', content: [cell('tableCell', '')] });
  }
  return { type: 'table', attrs: { blockId }, content: rowNodes };
}

// ---------------------------------------------------------------------------
// YouTube detection
// ---------------------------------------------------------------------------

export function isYouTubeUrl(url: string): boolean {
  return /(?:^|\.)(?:youtube\.com|youtube-nocookie\.com)\/(?:watch|shorts|embed|live)|youtu\.be\//.test(
    String(url ?? ''),
  );
}

/** Best-effort watch/shorts/share URL -> embeddable URL. */
export function youtubeEmbedUrl(url: string): string | null {
  const s = String(url ?? '');
  const m =
    s.match(/[?&]v=([\w-]{6,})/) ??
    s.match(/youtu\.be\/([\w-]{6,})/) ??
    s.match(/\/(?:shorts|embed|live)\/([\w-]{6,})/);
  if (!m) return null;
  return `https://www.youtube-nocookie.com/embed/${m[1]}`;
}

// ---------------------------------------------------------------------------
// blocks -> doc
// ---------------------------------------------------------------------------

export function blocksToDoc(blocks: ReviewBlock[], ctx?: ConversionContext): JSONDoc {
  const content: JSONNode[] = [];

  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (!block || typeof block.type !== 'string') continue;
    const d = (block.data ?? {}) as Record<string, unknown>;
    const blockId = String(block.id ?? newBlockId());

    switch (block.type) {
      case 'paragraph': {
        if (d.divider === true) {
          content.push({ type: 'horizontalRule', attrs: { blockId } });
        } else {
          const layoutRow = d.layoutRow as { columns?: { items?: unknown[] }[] } | undefined;
          const legacyRow = d.imageRow as { items?: unknown[] } | undefined;
          const layoutItems =
            layoutRow?.columns?.flatMap((col) => (Array.isArray(col.items) ? col.items : [])) ??
            legacyRow?.items ??
            [];
          if (layoutItems.length > 0) {
            for (const raw of layoutItems) {
              const item = raw as Record<string, unknown>;
              content.push({
                type: 'image',
                attrs: {
                  blockId: newBlockId(),
                  src: String(item.src ?? ''),
                  alt: String(item.alt ?? ''),
                  caption: String(item.caption ?? ''),
                  mediaId: item.mediaId ? String(item.mediaId) : null,
                  widthPercent: Number(item.widthPercent ?? 100),
                  borderRadiusPercent: Number(item.borderRadiusPercent ?? 0),
                },
              });
            }
          } else {
            content.push(paragraphNode(dataToInline(d), blockId));
          }
        }
        break;
      }
      case 'h2':
      case 'h3': {
        const stored = Number(d.level);
        const level = stored >= 2 && stored <= 4 ? stored : block.type === 'h2' ? 2 : 3;
        const node: JSONNode = { type: 'heading', attrs: { level, blockId } };
        const inline = dataToInline(d);
        if (inline.length > 0) node.content = inline;
        content.push(node);
        break;
      }
      case 'bulletList':
        content.push(listNode('bulletList', d, blockId));
        break;
      case 'numberedList':
        content.push(listNode('orderedList', d, blockId));
        break;
      case 'quote':
        content.push(quoteNode(d, blockId));
        break;
      case 'image': {
        const mediaId = d.mediaId ? String(d.mediaId) : null;
        const media = mediaId ? ctx?.mediaById?.[mediaId] : undefined;
        content.push({
          type: 'image',
          attrs: {
            src: String(d.src ?? media?.url ?? ''),
            alt: String(d.alt ?? media?.altText ?? ''),
            caption: String(d.caption ?? ''),
            mediaId,
            widthPercent: Number(d.widthPercent ?? 100),
            borderRadiusPercent: Number(d.borderRadiusPercent ?? 0),
            blockId,
          },
        });
        break;
      }
      case 'video': {
        const url = String(d.url ?? '');
        if (isYouTubeUrl(url)) {
          content.push({
            type: 'youtube',
            attrs: { src: url, caption: String(d.caption ?? ''), blockId },
          });
        } else {
          // Non-YouTube video URLs keep the generic embed treatment.
          content.push({ type: 'dynamicBlock', attrs: { blockType: 'video', data: d, blockId } });
        }
        break;
      }
      case 'table':
        content.push(tableNode(d, blockId));
        break;
      default:
        // Dynamic product blocks, structured blocks, and any unknown future
        // type: preserved verbatim inside the generic atom node.
        content.push({ type: 'dynamicBlock', attrs: { blockType: block.type, data: d, blockId } });
        break;
    }
  }

  if (content.length === 0) content.push(paragraphNode([]));
  return { type: 'doc', content };
}

// ---------------------------------------------------------------------------
// doc -> blocks
// ---------------------------------------------------------------------------

function takeId(node: JSONNode, seen: Set<string>): string {
  const raw = node.attrs?.blockId;
  let id = typeof raw === 'string' && raw.length > 0 && raw.length <= 60 ? raw : newBlockId();
  while (seen.has(id)) id = newBlockId();
  seen.add(id);
  return id;
}

function listToData(node: JSONNode): Record<string, unknown> {
  const items: string[] = [];
  const richItems: JSONNode[][] = [];
  let anyRich = false;
  for (const li of node.content ?? []) {
    // A list item may contain several paragraphs; flatten with hard breaks.
    const inline: JSONNode[] = [];
    (li.content ?? []).forEach((p, i) => {
      if (i > 0) inline.push({ type: 'hardBreak' });
      inline.push(...(p.content ?? []));
    });
    items.push(inlineToText(inline));
    richItems.push(inline);
    if (inlineNeedsRich(inline)) anyRich = true;
  }
  return anyRich ? { items, richItems } : { items };
}

function quoteToData(node: JSONNode): Record<string, unknown> {
  const children = node.content ?? [];
  // Non-paragraph children (rare — e.g. a pasted list) degrade to their text.
  const texts = children.map((c) => (c.type === 'paragraph' ? inlineToText(c.content) : inlineToText([c])));
  let attribution: string | undefined;
  let bodyTexts = texts;
  if (texts.length > 1 && EM_DASH_PREFIX.test(texts[texts.length - 1].trim())) {
    attribution = texts[texts.length - 1].trim().replace(EM_DASH_PREFIX, '');
    bodyTexts = texts.slice(0, -1);
  }
  const data: Record<string, unknown> = { text: bodyTexts.join('\n') };
  if (attribution) data.attribution = attribution;
  const allParagraphs = children.every((c) => c.type === 'paragraph');
  if (allParagraphs && children.some((p) => inlineNeedsRich(p.content))) {
    data.rich = children.map((p) => p.content ?? []);
  }
  return data;
}

function tableToData(node: JSONNode): Record<string, unknown> {
  const rows = (node.content ?? []).filter((r) => r.type === 'tableRow');
  const cellText = (cell: JSONNode): string =>
    (cell.content ?? [])
      .map((p) => inlineToText(p.content))
      .join('\n')
      .trim();
  let headers: string[] = [];
  let bodyRows = rows;
  const first = rows[0];
  if (first && (first.content ?? []).length > 0 && (first.content ?? []).every((c) => c.type === 'tableHeader')) {
    headers = (first.content ?? []).map(cellText);
    bodyRows = rows.slice(1);
  }
  return {
    headers,
    rows: bodyRows.map((r) => (r.content ?? []).map(cellText)),
  };
}

export function docToBlocks(doc: JSONDoc | null | undefined): ReviewBlock[] {
  const blocks: ReviewBlock[] = [];
  const seen = new Set<string>();

  for (const node of doc?.content ?? []) {
    switch (node.type) {
      case 'paragraph': {
        const data = inlineToData(node.content);
        if (!inlineToText(node.content).trim() && node.content?.length === 0) {
          // empty paragraph — may be a divider placeholder from horizontalRule
        }
        blocks.push({ id: takeId(node, seen), type: 'paragraph', data });
        break;
      }
      case 'layoutRow':
      case 'imageRow': {
        const rawColumns = node.attrs?.columns as { items?: unknown[] }[] | undefined;
        const legacyItems = node.attrs?.items as unknown[] | undefined;
        const items = rawColumns?.flatMap((col) => (Array.isArray(col.items) ? col.items : [])) ?? legacyItems ?? [];
        for (const raw of items) {
          const item = raw as Record<string, unknown>;
          const data: Record<string, unknown> = {
            caption: String(item.caption ?? ''),
          };
          if (item.mediaId) data.mediaId = String(item.mediaId);
          if (item.src) data.src = String(item.src);
          if (item.alt) data.alt = String(item.alt);
          const width = Number(item.widthPercent ?? 100);
          if (width !== 100) data.widthPercent = width;
          const radius = Number(item.borderRadiusPercent ?? 0);
          if (radius > 0) data.borderRadiusPercent = radius;
          blocks.push({ id: newBlockId(), type: 'image', data });
        }
        break;
      }
      case 'heading': {
        const level = Number(node.attrs?.level ?? 2);
        const type: ReviewBlockType = level === 2 ? 'h2' : 'h3';
        const data: Record<string, unknown> = inlineToData(node.content);
        if (level === 4) data.level = 4; // whitelist has no h4; preserved via data
        blocks.push({ id: takeId(node, seen), type, data });
        break;
      }
      case 'bulletList':
        blocks.push({ id: takeId(node, seen), type: 'bulletList', data: listToData(node) });
        break;
      case 'orderedList':
        blocks.push({ id: takeId(node, seen), type: 'numberedList', data: listToData(node) });
        break;
      case 'blockquote':
        blocks.push({ id: takeId(node, seen), type: 'quote', data: quoteToData(node) });
        break;
      case 'horizontalRule':
        blocks.push({ id: takeId(node, seen), type: 'paragraph', data: { text: '', divider: true } });
        break;
      case 'image': {
        const data: Record<string, unknown> = {
          caption: String(node.attrs?.caption ?? ''),
        };
        if (node.attrs?.mediaId) data.mediaId = String(node.attrs.mediaId);
        if (node.attrs?.src) data.src = String(node.attrs.src);
        if (node.attrs?.alt) data.alt = String(node.attrs.alt);
        const width = Number(node.attrs?.widthPercent ?? 100);
        if (width !== 100) data.widthPercent = width;
        const radius = Number(node.attrs?.borderRadiusPercent ?? 0);
        if (radius > 0) data.borderRadiusPercent = radius;
        blocks.push({ id: takeId(node, seen), type: 'image', data });
        break;
      }
      case 'youtube': {
        const data: Record<string, unknown> = { url: String(node.attrs?.src ?? '') };
        const caption = String(node.attrs?.caption ?? '');
        if (caption) data.caption = caption;
        blocks.push({ id: takeId(node, seen), type: 'video', data });
        break;
      }
      case 'table':
        blocks.push({ id: takeId(node, seen), type: 'table', data: tableToData(node) });
        break;
      case 'dynamicBlock': {
        const blockType = String(node.attrs?.blockType ?? 'paragraph') as ReviewBlockType;
        const data = (node.attrs?.data ?? {}) as Record<string, unknown>;
        blocks.push({ id: takeId(node, seen), type: blockType, data });
        break;
      }
      default: {
        // Unknown editor node (should not happen with the fixed schema):
        // degrade to a plain paragraph rather than dropping content.
        blocks.push({
          id: takeId(node, seen),
          type: 'paragraph',
          data: { text: inlineToText(node.content) },
        });
        break;
      }
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Document analysis (word count, warnings) — pure helpers for the sidebar
// ---------------------------------------------------------------------------

export interface DocAnalysis {
  words: number;
  empty: boolean;
  headingLevels: number[];
  imagesMissingAlt: number;
  headingSkips: number;
}

export function analyzeDoc(doc: JSONDoc | null | undefined): DocAnalysis {
  let words = 0;
  let hasContent = false;
  const headingLevels: number[] = [];
  let imagesMissingAlt = 0;

  const walk = (nodes: JSONNode[] | undefined) => {
    for (const node of nodes ?? []) {
      if (node.type === 'text' && node.text) {
        const count = node.text.trim().split(/\s+/).filter(Boolean).length;
        words += count;
        if (count > 0) hasContent = true;
      }
      if (node.type === 'heading') headingLevels.push(Number(node.attrs?.level ?? 2));
      if (node.type === 'image') {
        hasContent = true;
        if (!String(node.attrs?.alt ?? '').trim()) imagesMissingAlt++;
      }
      if (node.type === 'dynamicBlock' || node.type === 'youtube') hasContent = true;
      walk(node.content);
    }
  };
  walk(doc?.content);

  let headingSkips = 0;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) headingSkips++;
  }
  // A document that opens with an H4 (or H3 -> H4 handled above) is fine; the
  // skip check only flags jumps that skip a level going deeper.

  return {
    words,
    empty: !hasContent,
    headingLevels,
    imagesMissingAlt,
    headingSkips,
  };
}

// ---------------------------------------------------------------------------
// Dev-only round-trip assertion (no test runner exists in this repo)
// ---------------------------------------------------------------------------

/**
 * Verifies blocks -> doc -> blocks preserves id, type, and data semantics.
 * Logs (never throws) so a conversion regression is visible in the console
 * during development without breaking editing.
 */
export function devRoundTripCheck(blocks: ReviewBlock[], ctx?: ConversionContext): void {
  if (!import.meta.env.DEV) return;
  try {
    const roundTripped = docToBlocks(blocksToDoc(blocks, ctx));
    if (roundTripped.length !== blocks.length) {
      console.warn('[review] round-trip block count mismatch', blocks.length, '->', roundTripped.length);
      return;
    }
    for (let i = 0; i < blocks.length; i++) {
      const a = blocks[i];
      const b = roundTripped[i];
      if (a.id !== b.id) console.warn(`[review] round-trip id mismatch at ${i}: ${a.id} -> ${b.id}`);
      if (a.type !== b.type) console.warn(`[review] round-trip type mismatch at ${i}: ${a.type} -> ${b.type}`);
      if (isDynamicBlockType(a.type)) {
        const aData = JSON.stringify(a.data ?? {});
        const bData = JSON.stringify(b.data ?? {});
        if (aData !== bData) {
          console.warn(`[review] round-trip data mismatch at ${i} (${a.type})`, a.data, b.data);
        }
      }
    }
  } catch (e) {
    console.warn('[review] round-trip check failed', e);
  }
}
