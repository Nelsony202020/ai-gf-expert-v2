// Generic atom node for every non-text-flow review block (dynamic product
// data, structured blocks like FAQ/CTA/callout, and unknown future types).
// Renders as a compact, visually distinct embed inside the continuous editor
// with an inline settings panel exposing the same fields the old card editor
// had. The node is selectable, deletable, and draggable — never text-editable.

import { useState } from 'react';
import { Node } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  Badge,
  Button,
  Field,
  Icon,
  LinesTextArea,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from '../ui';
import { useWorkspace } from '../workspace/context';
import { blockMeta, type ReviewBlockType } from '../workspace/reviewBlocks';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dynamicBlock: {
      insertDynamicBlock: (blockType: string, data?: Record<string, unknown>) => ReturnType;
    };
  }
}

export const DynamicBlockNode = Node.create({
  name: 'dynamicBlock',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      blockType: { default: 'paragraph' },
      data: { default: {} },
      blockId: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-dynamic-block]',
        getAttrs: (el) => {
          const node = el as HTMLElement;
          try {
            return {
              blockType: node.getAttribute('data-dynamic-block') ?? 'paragraph',
              data: JSON.parse(node.getAttribute('data-block-data') ?? '{}'),
              blockId: node.getAttribute('data-block-id'),
            };
          } catch {
            return { blockType: node.getAttribute('data-dynamic-block') ?? 'paragraph', data: {} };
          }
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        'data-dynamic-block': String(node.attrs.blockType ?? ''),
        'data-block-data': JSON.stringify(node.attrs.data ?? {}),
        'data-block-id': node.attrs.blockId ?? undefined,
      },
    ];
  },

  addCommands() {
    return {
      insertDynamicBlock:
        (blockType, data = {}) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { blockType, data } }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DynamicBlockView);
  },
});

/** Default data for a freshly inserted block, matching the old card editor. */
export function defaultBlockData(type: string): Record<string, unknown> {
  switch (type) {
    case 'prosCons':
      return { source: 'product' };
    case 'faq':
      return { items: [] };
    case 'callout':
      return { tone: 'info', text: '' };
    case 'cta':
      return { label: 'Try it now' };
    default:
      return {};
  }
}

const KNOWN_TYPES = new Set([
  'paragraph', 'h2', 'h3', 'h4', 'bulletList', 'numberedList', 'image', 'video', 'table',
  'quote', 'callout', 'prosCons', 'faq', 'relatedGuide', 'cta', 'scoreOverall',
  'scoreCategory', 'pricingTable', 'characterGallery', 'publicGallery',
  'evidenceSummary', 'methodologyLink',
]);

/** Types that have configurable settings (show the gear button). */
const CONFIGURABLE = new Set([
  'callout', 'prosCons', 'faq', 'relatedGuide', 'cta', 'scoreCategory',
  'evidenceSummary', 'video',
]);

function DynamicBlockView(props: NodeViewProps) {
  const { node, selected, editor, updateAttributes, deleteNode } = props;
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);

  const blockType = String(node.attrs.blockType ?? '');
  const data = (node.attrs.data ?? {}) as Record<string, any>;
  const known = KNOWN_TYPES.has(blockType);
  const meta = known ? blockMeta(blockType as ReviewBlockType) : null;
  const editable = editor.isEditable;

  const updateData = (patch: Record<string, unknown>) =>
    updateAttributes({ data: { ...data, ...patch } });

  return (
    <NodeViewWrapper
      className={`review-dynamic-block my-3 rounded-lg border bg-blue-50/40 dark:bg-blue-950/20 ${
        selected
          ? 'border-pink-400 ring-1 ring-pink-400'
          : 'border-blue-200 dark:border-blue-900'
      }`}
      data-block-type={blockType}
      contentEditable={false}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        {editable && (
          <span
            data-drag-handle
            draggable
            title="Drag to move"
            className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Icon name="drag_indicator" className="!text-[16px]" />
          </span>
        )}
        <Icon name={meta?.icon ?? 'extension'} className="!text-[16px] text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {meta?.label ?? blockType}
        </span>
        <Badge tone="blue">{meta?.dynamic ? 'dynamic' : known ? 'block' : 'unknown'}</Badge>
        <span className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {blockSummary(blockType, data, ws)}
        </span>
        {editable && (
          <span className="flex shrink-0 items-center gap-0.5">
            {(CONFIGURABLE.has(blockType) || !known) && (
              <button
                type="button"
                title="Block settings"
                aria-label="Block settings"
                onClick={() => setOpen((v) => !v)}
                className={`rounded p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 ${
                  open ? 'text-pink-600' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon name="settings" className="!text-[16px]" />
              </button>
            )}
            <button
              type="button"
              title="Remove block"
              aria-label="Remove block"
              onClick={() => deleteNode()}
              className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40"
            >
              <Icon name="delete" className="!text-[16px]" />
            </button>
          </span>
        )}
      </div>
      <p className="px-3 pb-2 text-xs text-slate-500 dark:text-slate-400">
        <Icon name="bolt" className="mr-1 !text-[13px] text-blue-500" />
        {sourceDescription(blockType, meta?.description)}
      </p>
      {open && editable && (
        <div className="border-t border-blue-200 bg-white/70 p-3 dark:border-blue-900 dark:bg-slate-900/60">
          <BlockSettingsForm blockType={blockType} data={data} onChange={updateData} />
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" className="text-xs" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

function sourceDescription(blockType: string, metaDescription?: string): string {
  switch (blockType) {
    case 'callout':
      return 'Highlighted note rendered in a tinted box on the live page.';
    case 'prosCons':
      return 'Pros & cons panel — synced from the product record or custom lists.';
    case 'faq':
      return 'FAQ accordion rendered (and marked up for SEO) on the live page.';
    case 'relatedGuide':
      return 'Card linking to another guide on the site.';
    case 'cta':
      return 'Affiliate call-to-action button using the product’s tracked link.';
    case 'video':
      return 'Self-hosted / external video, rendered as a player on the live page.';
    default:
      return metaDescription ?? 'Rendered from structured records at build time — data is never duplicated into copy.';
  }
}

function blockSummary(blockType: string, d: Record<string, any>, ws: ReturnType<typeof useWorkspace>): string {
  switch (blockType) {
    case 'callout':
      return `${d.tone ?? 'info'} · ${String(d.text ?? '').slice(0, 60) || 'empty'}`;
    case 'prosCons':
      return d.source === 'product'
        ? 'Synced with product pros & cons'
        : `Custom: ${(d.pros ?? []).length} pros / ${(d.cons ?? []).length} cons`;
    case 'faq':
      return `${(d.items ?? []).length} question${(d.items ?? []).length === 1 ? '' : 's'}`;
    case 'relatedGuide':
      return d.title || d.path || 'No guide selected';
    case 'cta': {
      const link = ws.related.affiliateLinks.find((l) => l.id === d.affiliateLinkId);
      return `"${d.label ?? ''}"${link ? ` → /go/${link.cloakedSlug}` : ' → default product CTA'}`;
    }
    case 'scoreCategory': {
      const cat = ws.related.categories.find((c) => c.slug === d.categorySlug);
      return cat ? String(cat.name) : d.categorySlug || 'No category selected';
    }
    case 'evidenceSummary': {
      const cat = ws.related.categories.find((c) => c.slug === d.categorySlug);
      return cat ? String(cat.name) : 'All categories';
    }
    case 'video':
      return d.url || 'No video URL set';
    case 'scoreOverall':
      return 'Current published overall score';
    case 'pricingTable':
      return `${ws.related.plans.length} plan${ws.related.plans.length === 1 ? '' : 's'} on record`;
    case 'characterGallery':
      return `${ws.related.characters.length} character${ws.related.characters.length === 1 ? '' : 's'} on record`;
    case 'publicGallery':
      return 'Approved public gallery media';
    case 'methodologyLink':
      return 'Links to the methodology page';
    default:
      return 'Stored settings preserved as-is';
  }
}

// ---------------------------------------------------------------------------
// Per-type settings forms (ported from the old ReviewTab card editor)
// ---------------------------------------------------------------------------

export function BlockSettingsForm({
  blockType,
  data: d,
  onChange,
}: {
  blockType: string;
  data: Record<string, any>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const ws = useWorkspace();

  switch (blockType) {
    case 'callout':
      return (
        <div className="space-y-2">
          <Field label="Tone">
            <Select value={d.tone ?? 'info'} onChange={(e) => onChange({ tone: e.target.value })}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
            </Select>
          </Field>
          <Field label="Text">
            <TextArea
              rows={2}
              value={d.text ?? ''}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="Callout text"
            />
          </Field>
        </div>
      );
    case 'prosCons': {
      const useProduct = d.source === 'product';
      return (
        <div className="space-y-2">
          <Toggle
            checked={useProduct}
            onChange={(v) => onChange({ source: v ? 'product' : 'custom' })}
            label="Use the product's overall pros and cons (recommended — stays in sync)"
          />
          {!useProduct && (
            <div className="grid gap-2 sm:grid-cols-2">
              <LinesTextArea
                rows={3}
                value={Array.isArray(d.pros) ? (d.pros as string[]) : undefined}
                onChange={(pros) => onChange({ pros })}
                placeholder="Pros — one per line"
              />
              <LinesTextArea
                rows={3}
                value={Array.isArray(d.cons) ? (d.cons as string[]) : undefined}
                onChange={(cons) => onChange({ cons })}
                placeholder="Cons — one per line"
              />
            </div>
          )}
        </div>
      );
    }
    case 'faq': {
      const items: { question: string; answer: string }[] = Array.isArray(d.items) ? d.items : [];
      return (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1 space-y-1">
                <TextInput
                  value={item.question}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], question: e.target.value };
                    onChange({ items: next });
                  }}
                  placeholder="Question"
                />
                <TextArea
                  rows={2}
                  value={item.answer}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], answer: e.target.value };
                    onChange({ items: next });
                  }}
                  placeholder="Answer"
                />
              </div>
              <button
                type="button"
                aria-label="Remove question"
                onClick={() => onChange({ items: items.filter((_, j) => j !== i) })}
                className="self-start rounded p-1 text-slate-400 hover:text-red-600"
              >
                <Icon name="delete" className="!text-[16px]" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() => onChange({ items: [...items, { question: '', answer: '' }] })}
          >
            <Icon name="add" className="!text-[14px]" /> Add question
          </Button>
        </div>
      );
    }
    case 'relatedGuide':
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Guide title">
            <TextInput
              value={d.title ?? ''}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Guide title"
            />
          </Field>
          <Field label="Path">
            <TextInput
              value={d.path ?? ''}
              onChange={(e) => onChange({ path: e.target.value })}
              placeholder="/guides/example-guide"
            />
          </Field>
        </div>
      );
    case 'cta': {
      const productLinks = ws.related.affiliateLinks.filter((l) => l.active);
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Button label">
            <TextInput
              value={d.label ?? ''}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="Button label, e.g. Try it now"
            />
          </Field>
          <Field label="Affiliate link">
            <Select
              value={d.affiliateLinkId ?? ''}
              onChange={(e) => onChange({ affiliateLinkId: e.target.value || undefined })}
            >
              <option value="">Default product CTA (/go/ link or website)</option>
              {productLinks.map((l) => (
                <option key={l.id} value={l.id}>
                  /go/{l.cloakedSlug}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      );
    }
    case 'scoreCategory':
      return (
        <Field label="Category">
          <Select
            value={d.categorySlug ?? ''}
            onChange={(e) => onChange({ categorySlug: e.target.value })}
            className="max-w-56"
          >
            <option value="">— choose category —</option>
            {ws.related.categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      );
    case 'evidenceSummary':
      return (
        <Field label="Category (optional)">
          <Select
            value={d.categorySlug ?? ''}
            onChange={(e) => onChange({ categorySlug: e.target.value || undefined })}
            className="max-w-56"
          >
            <option value="">All categories</option>
            {ws.related.categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      );
    case 'video':
      return (
        <div className="space-y-2">
          <Field label="Video URL">
            <TextInput
              value={d.url ?? ''}
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder="Video URL (hosted mp4/webm)"
            />
          </Field>
          <Field label="Caption (optional)">
            <TextInput
              value={d.caption ?? ''}
              onChange={(e) => onChange({ caption: e.target.value })}
              placeholder="Caption"
            />
          </Field>
        </div>
      );
    default:
      return (
        <div>
          <p className="mb-1 text-xs text-slate-500">
            Stored settings (read-only — this block type has no editable options here):
          </p>
          <pre className="max-h-40 overflow-auto rounded bg-slate-100 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {JSON.stringify(d, null, 2)}
          </pre>
        </div>
      );
  }
}
