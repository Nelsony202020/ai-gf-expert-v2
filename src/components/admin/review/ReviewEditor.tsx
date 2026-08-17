// Continuous document-style review editor built on TipTap. The document is a
// single writing canvas (article typography, dark-mode aware) with:
// - sticky compact toolbar + bubble menu on text selection
// - markdown input rules (##, ###, ####, -, 1., >, ---)
// - slash command menu ("/" on an empty line)
// - custom image / YouTube nodes and the generic dynamicBlock atom node
// Storage never changes: the parent converts blocks <-> TipTap JSON via
// blockConversion.ts.

import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Extension, Node, type Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import {
  BubbleMenu,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  type NodeViewProps,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import { Button, Field, Icon, Modal, TextInput } from '../ui';
import { BLOCK_META } from '../workspace/reviewBlocks';
import { isYouTubeUrl, youtubeEmbedUrl, type JSONDoc } from './blockConversion';
import { DynamicBlockNode, defaultBlockData } from './DynamicBlockNode';
import { MediaPickerModal, type PickedMedia } from './MediaPickerModal';
import { SlashCommands, type SlashCommandItem } from './SlashMenu';
import { createClipboardImagePaste } from './clipboardImagePaste';
import { LinkDialog } from './LinkDialog';
import { isImageFile, isVideoFile, uploadReviewMedia } from './uploadReviewMedia';
import { useToast } from '../Toast';
import {
  ReviewEditorUIContext,
  type ImageInspectorTarget,
  type ReviewEditorUI,
} from './reviewEditorContext';
import {
  figureFrameStyle,
  figureImageStyle,
  figureMediaFrameStyle,
  clampRadiusPercent,
  clampFocusPercent,
  isCircleCrop,
} from '../../../lib/review/imageFrameStyle';
import { applyLink, reviewEditorPasteProps } from '../tiptap/sharedTextExtensions';
import './editor.css';

// ---------------------------------------------------------------------------
// Custom nodes: image with caption/mediaId, YouTube embed with caption
// ---------------------------------------------------------------------------

const ReviewImage = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: '' },
      mediaId: { default: null },
      widthPercent: { default: 100 },
      borderRadiusPercent: { default: 0 },
      clipFocusX: { default: 50 },
      clipFocusY: { default: 50 },
      nsfw: { default: false },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

function ImageView({ node, selected, editor, updateAttributes, deleteNode, getPos }: NodeViewProps) {
  const ui = useContext(ReviewEditorUIContext);
  const editable = editor.isEditable;
  const src = String(node.attrs.src ?? '');
  const figureRef = useRef<HTMLElement>(null);
  const [adjustFocus, setAdjustFocus] = useState(false);
  const radius = clampRadiusPercent(node.attrs.borderRadiusPercent);
  const isCircle = isCircleCrop(radius);

  useEffect(() => {
    if (!adjustFocus) return;
    const onMove = (e: MouseEvent) => {
      const el = figureRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      updateAttributes({
        clipFocusX: Math.min(100, Math.max(0, x)),
        clipFocusY: Math.min(100, Math.max(0, y)),
      });
    };
    const onUp = () => setAdjustFocus(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [adjustFocus, updateAttributes]);

  const frameStyle = figureFrameStyle({
    widthPercent: node.attrs.widthPercent,
    borderRadiusPercent: node.attrs.borderRadiusPercent,
    clipFocusX: node.attrs.clipFocusX,
    clipFocusY: node.attrs.clipFocusY,
  });
  const mediaStyle = figureMediaFrameStyle({
    borderRadiusPercent: node.attrs.borderRadiusPercent,
    clipFocusX: node.attrs.clipFocusX,
    clipFocusY: node.attrs.clipFocusY,
  });
  const imgStyle = figureImageStyle({
    borderRadiusPercent: node.attrs.borderRadiusPercent,
    clipFocusX: node.attrs.clipFocusX,
    clipFocusY: node.attrs.clipFocusY,
  });
  const caption = String(node.attrs.caption ?? '').trim();

  return (
    <NodeViewWrapper
      as="figure"
      ref={figureRef}
      className={`review-image-node group relative my-4 ${selected ? 'ring-2 ring-pink-400' : ''} ${adjustFocus ? 'cursor-crosshair ring-2 ring-sky-400' : ''}`}
      contentEditable={false}
      style={frameStyle}
      onDoubleClick={(e: ReactMouseEvent) => {
        if (!editable || !isCircle) return;
        e.preventDefault();
        e.stopPropagation();
        setAdjustFocus(true);
      }}
    >
      <span data-drag-handle draggable={editable} className={`block ${editable ? 'cursor-grab' : ''}`} style={mediaStyle}>
        {src ? (
          <button
            type="button"
            className="block w-full cursor-pointer border-0 bg-transparent p-0"
            draggable={editable}
            onDragStart={(e) => {
              const pos = getPos();
              if (typeof pos !== 'number') return;
              e.dataTransfer.setData(
                'application/x-review-image',
                JSON.stringify({ pos, attrs: node.attrs }),
              );
            }}
            onClick={() =>
              editable &&
              ui.openImageInspector({
                kind: 'image',
                attrs: node.attrs as Record<string, unknown>,
                updateAttributes,
                pairWithNext: editable
                  ? () => pairImageWithNext(editor, typeof getPos === 'function' ? getPos() : undefined)
                  : undefined,
              })
            }
          >
            <img src={src} alt={String(node.attrs.alt ?? '')} style={imgStyle} />
          </button>
        ) : (
          <span className="flex h-32 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
            Image not available
          </span>
        )}
      </span>
      {caption ? (
        <figcaption className="mt-2 text-center text-xs italic text-slate-500">{caption}</figcaption>
      ) : null}
      {adjustFocus && (
        <span
          className="pointer-events-none absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-pink-500 shadow"
          style={{
            left: `${clampFocusPercent(node.attrs.clipFocusX)}%`,
            top: `${clampFocusPercent(node.attrs.clipFocusY)}%`,
          }}
        />
      )}
      {editable && (
        <span className="absolute right-2 top-2 hidden items-center gap-1 rounded-md bg-black/60 p-1 group-hover:flex">
          <button
            type="button"
            title="Replace image"
            onClick={() =>
              ui.openImagePicker((m) => updateAttributes({ src: m.url, mediaId: m.id }))
            }
            className="rounded p-0.5 text-white hover:bg-white/20"
          >
            <Icon name="cached" className="!text-[16px]" />
          </button>
          <button
            type="button"
            title="Remove image"
            onClick={() => deleteNode()}
            className="rounded p-0.5 text-white hover:bg-white/20"
          >
            <Icon name="delete" className="!text-[16px]" />
          </button>
        </span>
      )}
    </NodeViewWrapper>
  );
}

type ReviewImageItem = {
  src?: string;
  alt?: string;
  caption?: string;
  mediaId?: string | null;
  widthPercent?: number;
  borderRadiusPercent?: number;
  clipFocusX?: number;
  clipFocusY?: number;
};

function imageAttrsToItem(attrs: Record<string, unknown>): ReviewImageItem {
  return {
    src: String(attrs.src ?? ''),
    alt: String(attrs.alt ?? ''),
    caption: String(attrs.caption ?? ''),
    mediaId: attrs.mediaId ? String(attrs.mediaId) : null,
    widthPercent: Math.min(100, Math.max(30, Number(attrs.widthPercent ?? 100))),
    borderRadiusPercent: clampRadiusPercent(attrs.borderRadiusPercent),
    clipFocusX: clampFocusPercent(attrs.clipFocusX),
    clipFocusY: clampFocusPercent(attrs.clipFocusY),
  };
}

function pairImageWithNext(editor: Editor, pos: number | undefined) {
  if (typeof pos !== 'number') return;
  const doc = editor.state.doc;
  const current = doc.nodeAt(pos);
  if (!current || current.type.name !== 'image') return;

  const $pos = doc.resolve(pos);
  const parent = $pos.parent;
  const index = $pos.index();
  let nextIndex = -1;
  for (let i = index + 1; i < parent.childCount; i += 1) {
    if (parent.child(i).type.name === 'image') {
      nextIndex = i;
      break;
    }
  }
  if (nextIndex === -1) return;

  let nextPos = $pos.start();
  for (let i = 0; i < nextIndex; i += 1) nextPos += parent.child(i).nodeSize;
  const nextNode = parent.child(nextIndex);

  const item1 = { ...imageAttrsToItem(current.attrs as Record<string, unknown>), widthPercent: 50 };
  const item2 = { ...imageAttrsToItem(nextNode.attrs as Record<string, unknown>), widthPercent: 50 };
  const from = pos;
  const to = nextPos + nextNode.nodeSize;

  editor
    .chain()
    .focus()
    .deleteRange({ from, to })
    .insertContentAt(from, { type: 'imageRow', attrs: { items: [item1, item2] } })
    .run();
}

function splitImageRow(editor: Editor, rowPos: number | undefined) {
  if (typeof rowPos !== 'number') return;
  const doc = editor.state.doc;
  const rowNode = doc.nodeAt(rowPos);
  if (!rowNode || rowNode.type.name !== 'imageRow') return;

  const items = Array.isArray(rowNode.attrs.items) ? (rowNode.attrs.items as ReviewImageItem[]) : [];
  if (items.length === 0) return;

  editor
    .chain()
    .focus()
    .command(({ tr, state }) => {
      const imageType = state.schema.nodes.image;
      if (!imageType) return false;
      const imageNodes = items.map((item) =>
        imageType.create({
          src: item.src ?? '',
          alt: item.alt ?? '',
          caption: item.caption ?? '',
          mediaId: item.mediaId ?? null,
          widthPercent: item.widthPercent ?? 100,
          borderRadiusPercent: item.borderRadiusPercent ?? 0,
          clipFocusX: item.clipFocusX ?? 50,
          clipFocusY: item.clipFocusY ?? 50,
        }),
      );
      tr.replaceWith(rowPos, rowPos + rowNode.nodeSize, imageNodes);
      return true;
    })
    .run();
}

function ImageRowCell({
  item,
  editable,
  onOpenInspector,
  onRemove,
  onUpdateFocus,
}: {
  item: ReviewImageItem;
  editable: boolean;
  selected?: boolean;
  onOpenInspector: () => void;
  onRemove: () => void;
  onUpdateFocus: (clipFocusX: number, clipFocusY: number) => void;
}) {
  const figureRef = useRef<HTMLElement>(null);
  const [adjustFocus, setAdjustFocus] = useState(false);
  const radius = clampRadiusPercent(item.borderRadiusPercent);
  const isCircle = isCircleCrop(radius);

  useEffect(() => {
    if (!adjustFocus) return;
    const onMove = (e: MouseEvent) => {
      const el = figureRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      onUpdateFocus(Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
    };
    const onUp = () => setAdjustFocus(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [adjustFocus, onUpdateFocus]);

  const frameStyle = figureFrameStyle({
    widthPercent: item.widthPercent ?? 50,
    borderRadiusPercent: item.borderRadiusPercent,
    clipFocusX: item.clipFocusX,
    clipFocusY: item.clipFocusY,
    rowCell: true,
    rowWidth: item.widthPercent ?? 50,
  });
  const mediaStyle = figureMediaFrameStyle({
    borderRadiusPercent: item.borderRadiusPercent,
    clipFocusX: item.clipFocusX,
    clipFocusY: item.clipFocusY,
  });
  const imgStyle = figureImageStyle({
    borderRadiusPercent: item.borderRadiusPercent,
    clipFocusX: item.clipFocusX,
    clipFocusY: item.clipFocusY,
  });
  const caption = String(item.caption ?? '').trim();

  return (
    <figure
      ref={figureRef}
      className={`review-image-row-node__cell relative m-0 min-w-0 ${adjustFocus ? 'cursor-crosshair ring-2 ring-sky-400' : ''}`}
      style={frameStyle}
      onDoubleClick={(e: ReactMouseEvent) => {
        if (!editable || !isCircle) return;
        e.preventDefault();
        e.stopPropagation();
        setAdjustFocus(true);
      }}
    >
      <div style={mediaStyle}>
        {item.src ? (
          <button
            type="button"
            className="block w-full cursor-pointer border-0 bg-transparent p-0"
            onClick={() => editable && onOpenInspector()}
          >
            <img src={item.src} alt={item.alt ?? ''} style={imgStyle} />
          </button>
        ) : (
          <span className="flex h-32 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
            Image missing
          </span>
        )}
      </div>
      {caption ? (
        <figcaption className="mt-1.5 text-center text-xs italic text-slate-500">{caption}</figcaption>
      ) : null}
      {adjustFocus && (
        <span
          className="pointer-events-none absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-pink-500 shadow"
          style={{
            left: `${clampFocusPercent(item.clipFocusX)}%`,
            top: `${clampFocusPercent(item.clipFocusY)}%`,
          }}
        />
      )}
      {editable && (
        <button
          type="button"
          title="Remove from row"
          onClick={onRemove}
          className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white hover:bg-black/80"
        >
          <Icon name="close" className="!text-[14px]" />
        </button>
      )}
    </figure>
  );
}

const ReviewImageRow = Node.create({
  name: 'imageRow',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      items: { default: [] as ReviewImageItem[] },
      blockId: { default: null },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageRowView);
  },
});

function ImageRowView({ node, selected, editor, updateAttributes, deleteNode, getPos }: NodeViewProps) {
  const ui = useContext(ReviewEditorUIContext);
  const editable = editor.isEditable;
  const items = Array.isArray(node.attrs.items) ? (node.attrs.items as ReviewImageItem[]) : [];

  function updateItem(index: number, patch: Partial<ReviewImageItem>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    updateAttributes({ items: next });
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    if (next.length === 0) {
      deleteNode();
      return;
    }
    if (next.length === 1) {
      const only = next[0];
      const rowPos = typeof getPos === 'function' ? getPos() : undefined;
      if (typeof rowPos !== 'number') {
        updateAttributes({ items: next });
        return;
      }
      editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          const imageType = state.schema.nodes.image;
          if (!imageType) return false;
          tr.replaceWith(
            rowPos,
            rowPos + node.nodeSize,
            imageType.create({
              src: only.src ?? '',
              alt: only.alt ?? '',
              caption: only.caption ?? '',
              mediaId: only.mediaId ?? null,
              widthPercent: only.widthPercent ?? 100,
              borderRadiusPercent: only.borderRadiusPercent ?? 0,
              clipFocusX: only.clipFocusX ?? 50,
              clipFocusY: only.clipFocusY ?? 50,
            }),
          );
          return true;
        })
        .run();
      return;
    }
    updateAttributes({ items: next });
  }

  return (
    <NodeViewWrapper
      as="div"
      className={`review-image-row-node my-4 flex flex-wrap gap-3 ${selected ? 'ring-2 ring-pink-400' : ''}`}
      contentEditable={false}
    >
      {items.map((item, index) => (
        <ImageRowCell
          key={`${item.src}-${index}`}
          item={item}
          editable={editable}
          selected={selected}
          onOpenInspector={() =>
            ui.openImageInspector({
              kind: 'imageRow',
              attrs: {
                alt: item.alt ?? '',
                caption: item.caption ?? '',
                widthPercent: item.widthPercent ?? 50,
                borderRadiusPercent: item.borderRadiusPercent ?? 0,
                clipFocusX: item.clipFocusX ?? 50,
                clipFocusY: item.clipFocusY ?? 50,
                src: item.src ?? '',
                mediaId: item.mediaId ?? null,
              },
              updateAttributes: (patch) => updateItem(index, patch as Partial<ReviewImageItem>),
              itemIndex: index,
              splitRow: editable
                ? () => splitImageRow(editor, typeof getPos === 'function' ? getPos() : undefined)
                : undefined,
            })
          }
          onRemove={() => removeItem(index)}
          onUpdateFocus={(clipFocusX, clipFocusY) => updateItem(index, { clipFocusX, clipFocusY })}
        />
      ))}
      {editable && items.length < 4 && (
        <button
          type="button"
          className="flex min-h-[8rem] flex-[0_0_calc(50%-6px)] items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:border-pink-400 hover:text-pink-600 dark:border-slate-700"
          onClick={() =>
            ui.openImagePicker((m) => {
              updateAttributes({
                items: [
                  ...items,
                  {
                    src: m.url,
                    alt: '',
                    mediaId: m.id,
                    caption: '',
                    widthPercent: items.length >= 1 ? 50 : 100,
                    borderRadiusPercent: 0,
                    clipFocusX: 50,
                    clipFocusY: 50,
                  },
                ],
              });
            })
          }
        >
          + Add image
        </button>
      )}
    </NodeViewWrapper>
  );
}

const ReviewYoutube = Youtube.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: '' },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeView);
  },
});

function YoutubeView({ node, selected, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const editable = editor.isEditable;
  const embed = youtubeEmbedUrl(String(node.attrs.src ?? ''));

  return (
    <NodeViewWrapper
      as="figure"
      className={`review-youtube-node group relative my-4 rounded-lg ${selected ? 'ring-2 ring-pink-400' : ''}`}
      contentEditable={false}
    >
      <span data-drag-handle draggable className={`block ${editable ? 'cursor-grab' : ''}`}>
        {embed ? (
          <span className="relative block aspect-video overflow-hidden rounded-lg bg-black">
            <iframe
              src={embed}
              title="YouTube video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {/* Transparent overlay so clicking selects/drags the node instead of the iframe. */}
            {editable && <span className="absolute inset-0" />}
          </span>
        ) : (
          <span className="flex h-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
            Invalid YouTube URL: {String(node.attrs.src ?? '')}
          </span>
        )}
      </span>
      {editable && (
        <span className="absolute right-2 top-2 hidden items-center gap-1 rounded-md bg-black/60 p-1 group-hover:flex">
          <button
            type="button"
            title="Remove video"
            onClick={() => deleteNode()}
            className="rounded p-0.5 text-white hover:bg-white/20"
          >
            <Icon name="delete" className="!text-[16px]" />
          </button>
        </span>
      )}
      {editable ? (
        <input
          value={String(node.attrs.caption ?? '')}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Caption (optional)"
          className="mt-1.5 w-full rounded border border-slate-200 bg-transparent px-2 py-1 text-xs italic text-slate-500 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none dark:border-slate-700 dark:text-slate-400"
        />
      ) : (
        node.attrs.caption && (
          <figcaption className="mt-1 text-xs italic text-slate-500">{String(node.attrs.caption)}</figcaption>
        )
      )}
    </NodeViewWrapper>
  );
}

// ---------------------------------------------------------------------------
// Stable block ids: carried on every top-level node so saves keep ids stable
// ---------------------------------------------------------------------------

const BlockIdAttribute = Extension.create({
  name: 'blockIdAttribute',
  addGlobalAttributes() {
    return [
      {
        types: [
          'paragraph',
          'heading',
          'bulletList',
          'orderedList',
          'blockquote',
          'horizontalRule',
          'table',
          'image',
          'youtube',
        ],
        attributes: {
          blockId: { default: null, rendered: false, keepOnSplit: false },
        },
      },
    ];
  },
});

// ---------------------------------------------------------------------------
// Slash / insert menu items
// ---------------------------------------------------------------------------

function buildInsertItems(ui: {
  openImage: () => void;
  openYoutube: () => void;
}): SlashCommandItem[] {
  const text = (
    id: string,
    label: string,
    icon: string,
    command: (editor: Editor) => void,
    keywords = '',
  ): SlashCommandItem => ({ id, label, icon, group: 'Text', keywords, command });

  const items: SlashCommandItem[] = [
    text('paragraph', 'Paragraph', 'notes', (e) => e.chain().focus().setParagraph().run(), 'text body'),
    text('h3', 'Section heading', 'format_h3', (e) => e.chain().focus().setHeading({ level: 3 }).run(), 'section title h3'),
    text('h4', 'Subheading', 'format_h4', (e) => e.chain().focus().setHeading({ level: 4 }).run(), 'subheading h4'),
    text('bulletList', 'Bullet list', 'format_list_bulleted', (e) => e.chain().focus().toggleBulletList().run(), 'unordered ul'),
    text('numberedList', 'Numbered list', 'format_list_numbered', (e) => e.chain().focus().toggleOrderedList().run(), 'ordered ol'),
    text('quote', 'Quote', 'format_quote', (e) => e.chain().focus().toggleBlockquote().run(), 'blockquote citation'),
    text('divider', 'Divider', 'horizontal_rule', (e) => e.chain().focus().setHorizontalRule().run(), 'separator hr rule'),
    text('table', 'Table', 'table', (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), 'grid comparison'),
    {
      id: 'image',
      label: 'Image',
      icon: 'image',
      group: 'Media',
      keywords: 'photo picture media screenshot',
      command: () => ui.openImage(),
    },
    {
      id: 'youtube',
      label: 'YouTube / Video',
      icon: 'smart_display',
      group: 'Media',
      keywords: 'video embed youtube',
      command: () => ui.openYoutube(),
    },
  ];

  // Structured + dynamic product blocks map to the generic dynamicBlock node.
  for (const meta of BLOCK_META) {
    if (meta.group !== 'Structured' && meta.group !== 'Dynamic data') continue;
    if (meta.type === 'table') continue; // now a native editor table
    items.push({
      id: meta.type,
      label: meta.label,
      icon: meta.icon,
      group: 'Product data',
      keywords: `${meta.group.toLowerCase()} ${meta.description ?? ''}`.toLowerCase(),
      description: meta.description,
      command: (e) => e.chain().focus().insertDynamicBlock(meta.type, defaultBlockData(meta.type)).run(),
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Toolbar helpers
// ---------------------------------------------------------------------------

function ToolBtn({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md p-1.5 disabled:opacity-30 ${
        active
          ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      <Icon name={icon} className="!text-[18px]" />
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-700" />;
}

/** Dropdown listing all insertable blocks (same items as the slash menu). */
function InsertBlockMenu({ editor, items }: { editor: Editor; items: SlashCommandItem[] }) {
  const [open, setOpen] = useState(false);
  let lastGroup: string | null = null;
  return (
    <span className="relative">
      <button
        type="button"
        title="Insert block"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Icon name="add_box" className="!text-[18px]" /> Insert
        <Icon name={open ? 'expand_less' : 'expand_more'} className="!text-[16px]" />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <span className="absolute right-0 z-40 mt-1 block max-h-80 w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {items.map((item) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <span key={item.id} className="block">
                  {showGroup && (
                    <span className="block px-3 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {item.group}
                    </span>
                  )}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setOpen(false);
                      item.command(editor);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-pink-50 hover:text-pink-700 dark:text-slate-300 dark:hover:bg-pink-950/30"
                  >
                    <Icon name={item.icon} className="!text-[16px] text-slate-400" />
                    {item.label}
                  </button>
                </span>
              );
            })}
          </span>
        </>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// The editor component
// ---------------------------------------------------------------------------

export interface ReviewEditorProps {
  /** Initial (or replacement) document. Re-applied whenever contentKey changes. */
  content: JSONDoc;
  /** Bump to force-reload `content` into the editor (template, revision restore). */
  contentKey: number;
  editable: boolean;
  productId: string;
  onChange: (doc: JSONDoc) => void;
  /** Rendered on the right side of the sticky toolbar (save button etc.). */
  toolbarExtra?: ReactNode;
  onImageInspectorChange?: (target: ImageInspectorTarget | null) => void;
  onRegisterUi?: (ui: ReviewEditorUI) => void;
}

export default function ReviewEditor({
  content,
  contentKey,
  editable,
  productId,
  onChange,
  toolbarExtra,
  onImageInspectorChange,
  onRegisterUi,
}: ReviewEditorProps) {
  const [imagePickerHandler, setImagePickerHandler] = useState<((m: PickedMedia) => void) | null>(null);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [pasteUploading, setPasteUploading] = useState(false);
  const [mediaDropActive, setMediaDropActive] = useState(false);
  const onImageInspectorChangeRef = useRef(onImageInspectorChange);
  onImageInspectorChangeRef.current = onImageInspectorChange;
  const { toast } = useToast();

  const productIdRef = useRef(productId);
  productIdRef.current = productId;
  const pasteUploadingRef = useRef(false);
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const openUploadedInspectorRef = useRef<(uploaded: { id: string; url: string; altText: string }) => void>(() => {});
  const openLinkDialogRef = useRef(() => setLinkDialogOpen(true));
  openLinkDialogRef.current = () => setLinkDialogOpen(true);

  const clipboardPasteExtension = useMemo(
    () =>
      createClipboardImagePaste(() => ({
        productId: productIdRef.current,
        onUploadStart: () => {
          if (!pasteUploadingRef.current) {
            pasteUploadingRef.current = true;
            setPasteUploading(true);
            toastRef.current('info', 'Uploading pasted image…');
          }
        },
        onUploadEnd: () => {
          pasteUploadingRef.current = false;
          setPasteUploading(false);
        },
        onError: (message) => toastRef.current('error', 'Paste upload failed', { message }),
        onUploaded: (uploaded) => openUploadedInspectorRef.current(uploaded),
      })),
    [],
  );

  const linkShortcutExtension = useMemo(
    () =>
      Extension.create({
        name: 'linkShortcut',
        addKeyboardShortcuts() {
          return {
            'Mod-k': () => {
              openLinkDialogRef.current();
              return true;
            },
          };
        },
      }),
    [],
  );

  const ui = useMemo<ReviewEditorUI>(
    () => ({
      openImagePicker: (onPick) => setImagePickerHandler(() => onPick),
      openImageInspector: (target) => onImageInspectorChangeRef.current?.(target),
    }),
    [],
  );

  useEffect(() => {
    onRegisterUi?.(ui);
  }, [ui, onRegisterUi]);

  // Stable ref so slash items (built once) always see the latest handlers.
  const editorRef = useRef<Editor | null>(null);
  const insertItems = useMemo(
    () =>
      buildInsertItems({
        openImage: () =>
          ui.openImagePicker((m) => {
            editorRef.current
              ?.chain()
              .focus()
              .insertContent({ type: 'image', attrs: { src: m.url, alt: '', mediaId: m.id, caption: '' } })
              .run();
          }),
        openYoutube: () => setYoutubeDialogOpen(true),
      }),
    [ui],
  );
  const itemsRef = useRef(insertItems);
  itemsRef.current = insertItems;

  // Ref so the once-created editor always calls the latest onChange.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] }, // no H1 in the review body
        code: false,
        codeBlock: false,
        strike: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading'
            ? 'Heading…'
            : "Write your review, or type '/' to insert a block…",
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      ReviewImage,
      ReviewImageRow,
      ReviewYoutube,
      DynamicBlockNode,
      BlockIdAttribute,
      SlashCommands.configure({ getItems: () => itemsRef.current }),
      clipboardPasteExtension,
      linkShortcutExtension,
    ],
    content,
    editorProps: reviewEditorPasteProps,
    onUpdate: ({ editor: e }) => onChangeRef.current(e.getJSON() as JSONDoc),
    onSelectionUpdate: ({ editor: e }) => {
      if (e.isActive('image') || e.isActive('imageRow')) return;
      onImageInspectorChangeRef.current?.(null);
    },
  });
  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    openUploadedInspectorRef.current = (uploaded) => {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'image') return;
        if (String(node.attrs.mediaId ?? '') !== uploaded.id) return;
        onImageInspectorChangeRef.current?.({
          kind: 'image',
          attrs: { ...(node.attrs as Record<string, unknown>) },
          updateAttributes: (patch) => {
            editor.chain().focus().setNodeSelection(pos).updateAttributes('image', patch).run();
          },
        });
      });
    };
  }, [editor]);

  // Replace the document when the parent swaps content (template / restore).
  const appliedKey = useRef(contentKey);
  useEffect(() => {
    if (!editor || appliedKey.current === contentKey) return;
    appliedKey.current = contentKey;
    editor.commands.setContent(content, false);
  }, [contentKey, content, editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  const inTable = editor.isActive('table');
  const headingValue = editor.isActive('heading', { level: 3 })
    ? '3'
    : editor.isActive('heading', { level: 4 })
      ? '4'
      : editor.isActive('heading', { level: 2 })
        ? '3'
        : 'p';

  return (
    <ReviewEditorUIContext.Provider value={ui}>
      <div className="review-editor">
        {/* Sticky compact toolbar */}
        {editable && (
          <div className="sticky top-[var(--workspace-sticky-top,6.5rem)] z-20 mb-2 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <select
              title="Paragraph style"
              value={headingValue}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'p') editor.chain().focus().setParagraph().run();
                else editor.chain().focus().setHeading({ level: Number(v) as 3 | 4 }).run();
              }}
              className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:border-pink-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="p">Paragraph</option>
              <option value="3">Section heading</option>
              <option value="4">Subheading</option>
            </select>
            <ToolbarDivider />
            <ToolBtn icon="format_bold" label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolBtn icon="format_italic" label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolBtn icon="link" label="Link (⌘K)" active={editor.isActive('link')} onClick={() => setLinkDialogOpen(true)} />
            <ToolbarDivider />
            <ToolBtn icon="format_list_bulleted" label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolBtn icon="format_list_numbered" label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ToolBtn icon="format_quote" label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <ToolBtn icon="horizontal_rule" label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
            <ToolbarDivider />
            <ToolBtn
              icon="table"
              label="Insert table"
              active={inTable}
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            />
            {inTable && (
              <>
                <ToolBtn icon="add_row_below" label="Add row" onClick={() => editor.chain().focus().addRowAfter().run()} />
                <ToolBtn icon="add_column_right" label="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()} />
                <ToolBtn icon="variable_remove" label="Delete row" onClick={() => editor.chain().focus().deleteRow().run()} />
                <ToolBtn icon="disabled_by_default" label="Delete table" onClick={() => editor.chain().focus().deleteTable().run()} />
              </>
            )}
            <ToolBtn
              icon="image"
              label="Insert image"
              onClick={() =>
                ui.openImagePicker((m) =>
                  editor
                    .chain()
                    .focus()
                    .insertContent({ type: 'image', attrs: { src: m.url, alt: '', mediaId: m.id, caption: '' } })
                    .run(),
                )
              }
            />
            <InsertBlockMenu editor={editor} items={insertItems} />
            <ToolbarDivider />
            <ToolBtn icon="undo" label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
            <ToolBtn icon="redo" label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
            {toolbarExtra && <span className="ml-auto flex items-center gap-2">{toolbarExtra}</span>}
          </div>
        )}

        {/* Bubble menu on text selection */}
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          shouldShow={({ editor: e, state }) => {
            if (!e.isEditable || state.selection.empty) return false;
            if (state.selection instanceof NodeSelection) return false;
            return !e.isActive('image') && !e.isActive('youtube') && !e.isActive('dynamicBlock');
          }}
        >
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <ToolBtn icon="format_bold" label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolBtn icon="format_italic" label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolBtn icon="link" label="Link (⌘K)" active={editor.isActive('link')} onClick={() => setLinkDialogOpen(true)} />
          </div>
        </BubbleMenu>

        {/* Writing canvas */}
        <div
          className={`relative rounded-xl border bg-white px-6 py-6 shadow-sm dark:bg-slate-900 md:px-10 md:py-8 ${
            mediaDropActive
              ? 'border-pink-400 ring-2 ring-pink-200 dark:border-pink-500 dark:ring-pink-900'
              : 'border-slate-200 dark:border-slate-800'
          }`}
          onDragEnter={(e) => {
            if (![...e.dataTransfer.types].includes('Files')) return;
            e.preventDefault();
            setMediaDropActive(true);
          }}
          onDragOver={(e) => {
            if (![...e.dataTransfer.types].includes('Files')) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as globalThis.Node | null)) return;
            setMediaDropActive(false);
          }}
          onDrop={(e) => {
            setMediaDropActive(false);
            const files = Array.from(e.dataTransfer.files ?? []);
            const videos = files.filter(isVideoFile);
            const images = files.filter(isImageFile);
            if (videos.length === 0 && images.length === 0) return;
            e.preventDefault();
            e.stopPropagation();
            void (async () => {
              try {
                setPasteUploading(true);
                for (const file of [...images, ...videos]) {
                  toastRef.current('info', `Uploading ${file.name}…`);
                  const uploaded = await uploadReviewMedia(file, productIdRef.current);
                  if (uploaded.mediaType === 'video') {
                    editor
                      .chain()
                      .focus()
                      .insertDynamicBlock('video', {
                        url: uploaded.url,
                        mediaId: uploaded.id,
                        mediaType: 'video',
                        caption: '',
                      })
                      .run();
                  } else {
                    editor
                      .chain()
                      .focus()
                      .insertContent({
                        type: 'image',
                        attrs: {
                          src: uploaded.url,
                          alt: '',
                          mediaId: uploaded.id,
                          caption: '',
                        },
                      })
                      .run();
                    openUploadedInspectorRef.current(uploaded);
                  }
                }
              } catch (err) {
                toastRef.current('error', 'Upload failed', {
                  message: err instanceof Error ? err.message : String(err),
                });
              } finally {
                setPasteUploading(false);
              }
            })();
          }}
        >
          {pasteUploading && (
            <span className="pointer-events-none absolute right-4 top-3 z-10 rounded-md bg-slate-900/75 px-2.5 py-1 text-xs text-white dark:bg-slate-100/90 dark:text-slate-900">
              Uploading…
            </span>
          )}
          {mediaDropActive && (
            <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-pink-50/80 text-sm font-medium text-pink-700 dark:bg-pink-950/50 dark:text-pink-200">
              Drop images or videos to upload
            </span>
          )}
          <EditorContent editor={editor} />
        </div>

        {imagePickerHandler && (
          <MediaPickerModal
            productId={productId}
            onClose={() => setImagePickerHandler(null)}
            onSelect={(m) => {
              imagePickerHandler(m);
              setImagePickerHandler(null);
            }}
          />
        )}

        {youtubeDialogOpen && (
          <YoutubeDialog
            productId={productId}
            onClose={() => setYoutubeDialogOpen(false)}
            onSubmit={(url, caption) => {
              setYoutubeDialogOpen(false);
              if (isYouTubeUrl(url)) {
                editor.chain().focus().insertContent({ type: 'youtube', attrs: { src: url, caption } }).run();
              } else {
                editor.chain().focus().insertDynamicBlock('video', { url, caption }).run();
              }
            }}
            onUploadedVideo={(uploaded, caption) => {
              setYoutubeDialogOpen(false);
              editor
                .chain()
                .focus()
                .insertDynamicBlock('video', {
                  url: uploaded.url,
                  mediaId: uploaded.id,
                  mediaType: 'video',
                  caption,
                })
                .run();
            }}
          />
        )}

        {linkDialogOpen && (
          <LinkDialog
            initialHref={String(editor.getAttributes('link').href ?? '')}
            onClose={() => setLinkDialogOpen(false)}
            onApply={(href) => {
              setLinkDialogOpen(false);
              applyLink(editor, href);
            }}
          />
        )}
      </div>
    </ReviewEditorUIContext.Provider>
  );
}

function YoutubeDialog({
  productId,
  onClose,
  onSubmit,
  onUploadedVideo,
}: {
  productId: string;
  onClose: () => void;
  onSubmit: (url: string, caption: string) => void;
  onUploadedVideo: (uploaded: { id: string; url: string }, caption: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!isVideoFile(file)) {
      setError('Choose an MP4 or WebM video.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadReviewMedia(file, productId);
      onUploadedVideo(uploaded, caption.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal title="Insert video" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Video URL">
          <TextInput
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            autoFocus
          />
        </Field>
        <Field label="Caption (optional)">
          <TextInput value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" />
        </Field>

        <div
          className={`rounded-md border border-dashed px-3 py-4 text-center text-xs transition-colors ${
            dropActive
              ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-600 dark:bg-pink-950/40 dark:text-pink-200'
              : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDropActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as globalThis.Node | null)) return;
            setDropActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDropActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void uploadFile(file);
          }}
        >
          <p className="font-medium text-slate-600 dark:text-slate-300">Or drop a video here</p>
          <p className="mt-0.5 text-[11px] text-slate-400">MP4 / WebM · small files work best</p>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <button
            type="button"
            className="mt-2 text-[11px] font-medium text-pink-600 hover:underline dark:text-pink-400"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Choose file'}
          </button>
          {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
        </div>

        <p className="text-xs text-slate-400">
          YouTube links embed a player. Uploaded files and other URLs use the native video block on the live page.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => url.trim() && onSubmit(url.trim(), caption.trim())} disabled={!url.trim() || uploading}>
            Insert video
          </Button>
        </div>
      </div>
    </Modal>
  );
}
