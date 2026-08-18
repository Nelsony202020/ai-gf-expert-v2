/** Cmd/Ctrl+K link picker: paste a URL or pick an internal review/guide page. */

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { dataApi, type EntityRow } from '../api';
import { Button, Field, Icon, Modal, TextInput } from '../ui';

export interface InternalLinkSuggestion {
  label: string;
  href: string;
  meta: string;
}

const STATIC_INTERNAL: InternalLinkSuggestion[] = [
  {
    label: 'How to Choose an AI Girlfriend App',
    href: '/guides/how-to-choose-an-ai-girlfriend-app/',
    meta: 'Guide',
  },
  { label: 'How We Test', href: '/test/', meta: 'Methodology' },
  { label: 'App Directory', href: '/ai-girlfriend-apps/', meta: 'Directory' },
  { label: 'Reviews Hub', href: '/reviews/', meta: 'Reviews' },
  { label: 'Best AI Girlfriend Apps', href: '/best/ai-girlfriend/', meta: 'Roundup' },
];

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

function scoreMatch(item: InternalLinkSuggestion, q: string): number {
  if (!q) return 1;
  const label = item.label.toLowerCase();
  const href = item.href.toLowerCase();
  const slug = href.split('/').filter(Boolean).pop() ?? '';
  if (label === q || slug === q.replace(/\s+/g, '-')) return 100;
  if (label.startsWith(q) || slug.startsWith(q.replace(/\s+/g, '-'))) return 80;
  if (label.includes(q) || slug.includes(q.replace(/\s+/g, '-'))) return 50;
  // Token match: "candy ai" → candy-ai
  const tokens = q.split(' ').filter(Boolean);
  if (tokens.length > 0 && tokens.every((t) => label.includes(t) || slug.includes(t))) return 40;
  return 0;
}

export function LinkDialog({
  initialHref = '',
  onClose,
  onApply,
}: {
  initialHref?: string;
  onClose: () => void;
  onApply: (href: string | null) => void;
}) {
  const [href, setHref] = useState(initialHref);
  const [query, setQuery] = useState('');
  const [internal, setInternal] = useState<InternalLinkSuggestion[]>(STATIC_INTERNAL);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [productsRes, glossaryRes] = await Promise.all([
          dataApi.list('products'),
          dataApi.list('glossaryEntries').catch(() => ({ rows: [] as EntityRow[] })),
        ]);
        if (cancelled) return;
        const fromProducts: InternalLinkSuggestion[] = productsRes.rows
          .filter((p) => p.active !== false && !p.deletedAt && p.slug)
          .map((p) => ({
            label: `${String(p.name ?? p.slug)} Review`,
            href: `/reviews/${String(p.slug)}/`,
            meta: 'Review',
          }));
        const fromGlossary: InternalLinkSuggestion[] = glossaryRes.rows
          .filter((g) => g.anchor)
          .map((g) => ({
            label: String(g.term ?? g.anchor),
            href: `/glossary/#${String(g.anchor)}`,
            meta: 'Glossary',
          }));
        setInternal([...fromProducts, ...fromGlossary, ...STATIC_INTERNAL]);
      } catch {
        /* static list still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = normalizeQuery(query || href);
    // If href looks like a full URL / path paste, don't force the list.
    const looksExternal = /^https?:\/\//i.test(href.trim());
    if (looksExternal && !query) return [];
    return internal
      .map((item) => ({ item, score: scoreMatch(item, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
      .slice(0, 12)
      .map((x) => x.item);
  }, [internal, query, href]);

  useEffect(() => {
    setActiveIndex(0);
  }, [suggestions]);

  function applyHref(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      onApply(null);
      return;
    }
    onApply(trimmed);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length) setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length) setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[activeIndex]) {
        applyHref(suggestions[activeIndex].href);
        return;
      }
      applyHref(href);
    }
  }

  return (
    <Modal title="Add link" onClose={onClose}>
      <div className="space-y-3" onKeyDown={onKeyDown}>
        <Field label="URL or search" help="Paste a link, or type to search reviews, guides, roundups, and glossary anchors. Enter to apply.">
          <TextInput
            value={query || href}
            onChange={(e) => {
              const v = e.target.value;
              setHref(v);
              setQuery(v);
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text) {
                // Prefer pasted URL as the link target immediately.
                setHref(text.trim());
                setQuery(text.trim());
              }
            }}
            placeholder="Search pages or paste a URL…"
            autoFocus
            className="font-mono text-sm"
          />
        </Field>

        {suggestions.length > 0 && (
          <ul className="max-h-56 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700">
            {suggestions.map((s, i) => (
              <li key={s.href}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyHref(s.href)}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm ${
                    i === activeIndex
                      ? 'bg-pink-50 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon name="link" className="mt-0.5 !text-[16px] text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.label}</span>
                    <span className="block truncate font-mono text-[11px] text-slate-400">{s.href}</span>
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">{s.meta}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-2">
          {initialHref ? (
            <Button variant="secondary" onClick={() => onApply(null)} className="text-xs">
              Remove link
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => applyHref(href)} disabled={!href.trim()}>
              Add link
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
