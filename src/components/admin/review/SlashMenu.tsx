// Slash command menu: typing "/" at the start of an empty paragraph opens a
// grouped, keyboard-navigable, fuzzy-filtered insert menu (Text / Media /
// Product data). Built on @tiptap/suggestion with a manually positioned
// popup (no tippy dependency).

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Extension, type Editor } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion';
import { Icon } from '../ui';

export interface SlashCommandItem {
  id: string;
  label: string;
  group: string;
  icon: string;
  /** Extra search keywords (lowercase). */
  keywords?: string;
  description?: string;
  command: (editor: Editor) => void;
}

// ---------------------------------------------------------------------------
// Fuzzy filter: substring match ranks first, then subsequence match.
// ---------------------------------------------------------------------------

function subsequenceMatch(haystack: string, needle: string): boolean {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return false;
}

export function filterSlashItems(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const scored: { item: SlashCommandItem; score: number }[] = [];
  for (const item of items) {
    const label = item.label.toLowerCase();
    const hay = `${label} ${item.keywords ?? ''}`;
    if (hay.includes(q)) scored.push({ item, score: label.startsWith(q) ? 0 : 1 });
    else if (subsequenceMatch(hay, q)) scored.push({ item, score: 2 });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.item);
}

// ---------------------------------------------------------------------------
// Menu list component (rendered into a floating container)
// ---------------------------------------------------------------------------

export interface SlashMenuListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface SlashMenuListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

const SlashMenuList = forwardRef<SlashMenuListHandle, SlashMenuListProps>(
  function SlashMenuList({ items, command }, ref) {
    const [selected, setSelected] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => setSelected(0), [items]);

    useEffect(() => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    useImperativeHandle(ref, () => ({
      onKeyDown(event) {
        if (event.key === 'ArrowDown') {
          setSelected((s) => (items.length === 0 ? 0 : (s + 1) % items.length));
          return true;
        }
        if (event.key === 'ArrowUp') {
          setSelected((s) => (items.length === 0 ? 0 : (s - 1 + items.length) % items.length));
          return true;
        }
        if (event.key === 'Enter') {
          if (items[selected]) command(items[selected]);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="w-64 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-400 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          No matching blocks
        </div>
      );
    }

    let lastGroup: string | null = null;
    return (
      <div
        ref={listRef}
        className="max-h-80 w-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
      >
        {items.map((item, index) => {
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group;
          return (
            <div key={item.id}>
              {showGroup && (
                <p className="px-3 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {item.group}
                </p>
              )}
              <button
                type="button"
                data-index={index}
                onMouseEnter={() => setSelected(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  command(item);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm ${
                  index === selected
                    ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon name={item.icon} className="!text-[17px] text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.label}</span>
                  {item.description && (
                    <span className="block truncate text-xs font-normal text-slate-400">
                      {item.description}
                    </span>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// TipTap extension
// ---------------------------------------------------------------------------

export interface SlashCommandsOptions {
  getItems: () => SlashCommandItem[];
}

export const SlashCommands = Extension.create<SlashCommandsOptions>({
  name: 'slashCommands',

  addOptions() {
    return { getItems: () => [] };
  },

  addProseMirrorPlugins() {
    const { getItems } = this.options;

    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: '/',
        startOfLine: true,
        allowSpaces: false,
        allow: ({ state, range }) => {
          // Only inside top-level-ish paragraphs (not headings, quotes keep it too)
          const $from = state.doc.resolve(range.from);
          return $from.parent.type.name === 'paragraph';
        },
        items: ({ query }) => filterSlashItems(getItems(), query),
        command: ({ editor, range, props: item }) => {
          editor.chain().focus().deleteRange(range).run();
          item.command(editor);
        },
        render: () => {
          let component: ReactRenderer<SlashMenuListHandle, SlashMenuListProps> | null = null;
          let container: HTMLDivElement | null = null;

          const position = (props: SuggestionProps<SlashCommandItem>) => {
            if (!container) return;
            const rect = props.clientRect?.();
            if (!rect) return;
            const menuHeight = Math.min(container.offsetHeight || 320, 320);
            const below = rect.bottom + 6;
            const fitsBelow = below + menuHeight <= window.innerHeight - 8;
            container.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
            container.style.top = fitsBelow ? `${below}px` : `${Math.max(8, rect.top - menuHeight - 6)}px`;
          };

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenuList, {
                props: { items: props.items, command: props.command },
                editor: props.editor,
              });
              container = document.createElement('div');
              container.style.position = 'fixed';
              container.style.zIndex = '60';
              container.appendChild(component.element);
              document.body.appendChild(container);
              position(props);
            },
            onUpdate: (props) => {
              component?.updateProps({ items: props.items, command: props.command });
              position(props);
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                container?.remove();
                container = null;
                return true;
              }
              return component?.ref?.onKeyDown(props.event) ?? false;
            },
            onExit: () => {
              component?.destroy();
              container?.remove();
              component = null;
              container = null;
            },
          };
        },
      }),
    ];
  },
});
