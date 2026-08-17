// SEO → Glossary: manage terms for /glossary/ and review auto-tooltips.

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { dataApi, type EntityRow } from '../api';
import { useCan } from '../context';
import { useToast } from '../Toast';
import { ConfirmDialog } from '../ConfirmDialog';
import { GlossaryRichEditor } from '../glossary/GlossaryRichEditor';
import { scheduleLiveRebuild, flushLiveRebuild } from '../../../lib/admin/scheduleLiveRebuild';
import {
  GLOSSARY_CATEGORY_OPTIONS,
  glossaryOtherNamesText,
  parseAliases,
  resolveGlossaryCtaLabel,
  slugifyGlossaryAnchor,
  type GlossaryEntryRecord,
  type GlossaryTipTapDoc,
} from '../../../lib/glossary/types';
import { validateGlossaryEntry } from '../../../lib/glossary/validate';
import { calculateGlossaryUsage, type GlossaryUsageSummary } from '../../../lib/glossary/usage';
import { renderGlossaryTipTapHtml } from '../../../lib/glossary/renderTipTap';
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  Field,
  Icon,
  Modal,
  Select,
  Spinner,
  TextInput,
  Toggle,
  fmtDate,
  statusTone,
} from '../ui';
import '../../../styles/glossary-tooltips.css';
import { getTooltipCategoryIconLocal } from '../../../lib/tooltip-category-icons';

/** Soft guidance for tooltip length — not a hard validation limit. */
const TOOLTIP_SOFT_MAX = 180;
const EMPTY_DOC: GlossaryTipTapDoc = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function mapEntry(row: EntityRow): GlossaryEntryRecord {
  return {
    id: row.id,
    term: String(row.term ?? ''),
    anchor: String(row.anchor ?? ''),
    tooltipDefinition: String(row.tooltipDefinition ?? ''),
    ctaLabel: String(row.ctaLabel ?? '').trim(),
    fullDefinition: (row.fullDefinition as GlossaryTipTapDoc) ?? EMPTY_DOC,
    aliases: parseAliases(row.aliases),
    displayAliases: parseAliases(row.displayAliases),
    category: String(row.category ?? 'General'),
    status: String(row.status ?? 'draft'),
    autoTooltip: row.autoTooltip !== false,
    scope: String(row.scope ?? 'reviews'),
    publishedAt: row.publishedAt != null ? Number(row.publishedAt) : null,
    createdAt: row.createdAt != null ? Number(row.createdAt) : null,
    updatedAt: row.updatedAt != null ? Number(row.updatedAt) : null,
  };
}

interface EditorState {
  id?: string;
  term: string;
  anchor: string;
  anchorLocked: boolean;
  tooltipDefinition: string;
  ctaLabel: string;
  fullDefinition: GlossaryTipTapDoc;
  aliases: string[];
  category: string;
  status: 'draft' | 'published';
  autoTooltip: boolean;
  wasPublished: boolean;
}

function blankEditor(): EditorState {
  return {
    term: '',
    anchor: '',
    anchorLocked: false,
    tooltipDefinition: '',
    ctaLabel: '',
    fullDefinition: EMPTY_DOC,
    aliases: [],
    category: 'General',
    status: 'draft',
    autoTooltip: true,
    wasPublished: false,
  };
}

function fromEntry(entry: GlossaryEntryRecord): EditorState {
  return {
    id: entry.id,
    term: entry.term,
    anchor: entry.anchor,
    anchorLocked: entry.status === 'published',
    tooltipDefinition: entry.tooltipDefinition,
    ctaLabel: entry.ctaLabel ?? '',
    fullDefinition: entry.fullDefinition ?? EMPTY_DOC,
    aliases: [...entry.aliases],
    category: entry.category,
    status: entry.status === 'published' ? 'published' : 'draft',
    autoTooltip: entry.autoTooltip !== false,
    wasPublished: entry.status === 'published',
  };
}

export function GlossaryPage() {
  const canEdit = useCan()('content.edit');
  const toast = useToast();
  const [rows, setRows] = useState<GlossaryEntryRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GlossaryEntryRecord | null>(null);
  const [usageById, setUsageById] = useState<Map<string, GlossaryUsageSummary>>(new Map());
  const [usageLoading, setUsageLoading] = useState(false);
  const [aliasDraft, setAliasDraft] = useState('');
  const [anchorEditing, setAnchorEditing] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [previewTooltip, setPreviewTooltip] = useState(false);
  const [previewGlossary, setPreviewGlossary] = useState(false);

  function reload() {
    dataApi
      .list('glossaryEntries')
      .then((r) => setRows(r.rows.map(mapEntry)))
      .catch((e) => setError(e.message));
  }

  useEffect(reload, []);

  useEffect(() => {
    if (!rows) return;
    let cancelled = false;
    setUsageLoading(true);
    Promise.all([dataApi.list('products'), dataApi.list('reviews')])
      .then(([productsRes, reviewsRes]) => {
        if (cancelled) return;
        const products = productsRes.rows.map((p) => {
          const review = reviewsRes.rows.find((r) => r.product?.id === p.id);
          return {
            id: p.id,
            name: String(p.name ?? ''),
            slug: String(p.slug ?? ''),
            status: String(p.status ?? ''),
            reviewBlocks: review?.blocks,
          };
        });
        const map = new Map<string, GlossaryUsageSummary>();
        for (const entry of rows) {
          map.set(entry.id, calculateGlossaryUsage(entry, products));
        }
        setUsageById(map);
      })
      .catch(() => {
        if (!cancelled) setUsageById(new Map());
      })
      .finally(() => {
        if (!cancelled) setUsageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    return rows.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        r.term.toLowerCase().includes(q) ||
        r.anchor.toLowerCase().includes(q) ||
        r.aliases.some((a) => a.toLowerCase().includes(q)) ||
        r.tooltipDefinition.toLowerCase().includes(q)
      );
    });
  }, [rows, search, categoryFilter, statusFilter]);

  async function saveEditor(nextStatus?: 'draft' | 'published') {
    if (!editing || !canEdit) return;
    const status = nextStatus ?? editing.status;
    const publishing = status === 'published';
    const draftEntry: GlossaryEntryRecord = {
      id: editing.id ?? '',
      term: editing.term.trim(),
      anchor: editing.anchor.trim() || slugifyGlossaryAnchor(editing.term),
      tooltipDefinition: editing.tooltipDefinition.trim(),
      ctaLabel: editing.ctaLabel.trim(),
      fullDefinition: editing.fullDefinition,
      aliases: editing.aliases,
      // Until a separate “Other names” UI exists, mirror matching aliases for the public line.
      displayAliases: editing.aliases,
      category: editing.category,
      status,
      autoTooltip: editing.autoTooltip,
      scope: 'reviews',
    };
    const issues = validateGlossaryEntry(draftEntry, {
      publishing,
      otherEntries: rows ?? [],
    });
    if (issues.length > 0) {
      toast.error(issues[0].message);
      return;
    }

    if (
      editing.wasPublished &&
      editing.id &&
      editing.anchor !== (rows?.find((r) => r.id === editing.id)?.anchor ?? editing.anchor)
    ) {
      const ok = window.confirm(
        'You are changing the anchor on a published glossary entry. Existing links to /glossary/#… may break. Continue?',
      );
      if (!ok) return;
    }

    setSaving(true);
    setError(null);
    try {
      const fields = {
        term: draftEntry.term,
        anchor: draftEntry.anchor,
        tooltipDefinition: draftEntry.tooltipDefinition,
        ctaLabel: draftEntry.ctaLabel,
        fullDefinition: draftEntry.fullDefinition,
        aliases: draftEntry.aliases,
        displayAliases: draftEntry.displayAliases,
        category: draftEntry.category,
        status,
        autoTooltip: draftEntry.autoTooltip,
        scope: 'reviews',
        ...(publishing ? { publishedAt: Date.now() } : {}),
      };
      const wasPublic = editing.wasPublished;
      if (editing.id) {
        await dataApi.update('glossaryEntries', editing.id, fields);
      } else {
        await dataApi.create('glossaryEntries', fields);
      }
      setEditing(null);
      reload();
      toast.success(publishing ? 'Glossary term published' : 'Glossary term saved');
      if (publishing || wasPublic) {
        void flushLiveRebuild(`glossary ${publishing ? 'published' : 'updated'}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !canEdit) return;
    const wasPublished = deleteTarget.status === 'published';
    try {
      await dataApi.remove('glossaryEntries', deleteTarget.id);
      setDeleteTarget(null);
      reload();
      toast.success('Glossary term deleted');
      if (wasPublished) void scheduleLiveRebuild('glossary deleted');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const editorUsage =
    editing?.id && usageById.get(editing.id)
      ? usageById.get(editing.id)!
      : editing
        ? calculateGlossaryUsage(
            {
              id: editing.id ?? 'new',
              term: editing.term,
              aliases: editing.aliases,
              anchor: editing.anchor || slugifyGlossaryAnchor(editing.term),
              tooltipDefinition: editing.tooltipDefinition || ' ',
            },
            [],
          )
        : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Glossary</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage definitions used on the public glossary and in review tooltips.
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setAliasDraft('');
              setAnchorEditing(false);
              setUsageOpen(false);
              setPreviewTooltip(false);
              setPreviewGlossary(false);
              setEditing(blankEditor());
            }}
          >
            <Icon name="add" /> Add term
          </Button>
        )}
      </div>

      {error && <ErrorNote message={error} />}

      <div className="flex flex-wrap gap-2">
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms…"
          className="w-56"
        />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-40">
          <option value="all">All categories</option>
          {GLOSSARY_CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
      </div>

      {!filtered ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState message="No glossary terms yet." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/50">
              <tr>
                <th className="px-3 py-2 font-medium">Term</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Used on</th>
                <th className="px-3 py-2 font-medium">Updated</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const usage = usageById.get(row.id);
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    onClick={() => {
                      setAliasDraft('');
                      setAnchorEditing(false);
                      setUsageOpen(false);
                      setPreviewTooltip(false);
                      setPreviewGlossary(false);
                      setEditing(fromEntry(row));
                    }}
                  >
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{row.term}</p>
                      <p className="text-[11px] text-slate-400">/#{row.anchor}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.category}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                      {usageLoading && !usage
                        ? '…'
                        : `${usage?.reviewCount ?? 0} review${(usage?.reviewCount ?? 0) === 1 ? '' : 's'}`}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
                      {row.updatedAt ? fmtDate(row.updatedAt) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {canEdit && (
                        <Button variant="ghost" className="text-xs text-red-600" onClick={() => setDeleteTarget(row)}>
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? 'Edit glossary term' : 'Add glossary term'}
          onClose={() => !saving && setEditing(null)}
          wide
          footer={
            canEdit ? (
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" disabled={saving} onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void saveEditor('draft')}
                >
                  {saving ? 'Saving…' : 'Save draft'}
                </Button>
                <Button disabled={saving} onClick={() => void saveEditor('published')}>
                  {saving ? 'Saving…' : 'Publish'}
                </Button>
              </div>
            ) : undefined
          }
        >
          <div className="space-y-2.5">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
              <div>
                <Field label="Term">
                  <TextInput
                    value={editing.term}
                    disabled={!canEdit || saving}
                    onChange={(e) => {
                      const term = e.target.value;
                      setEditing((prev) => {
                        if (!prev) return prev;
                        const next = { ...prev, term };
                        if (!prev.id && !prev.anchorLocked) {
                          next.anchor = slugifyGlossaryAnchor(term);
                        }
                        return next;
                      });
                    }}
                  />
                </Field>
                <div className="mt-1 flex min-h-[1.25rem] items-center gap-1">
                  {anchorEditing && canEdit ? (
                    <TextInput
                      value={editing.anchor}
                      disabled={saving}
                      autoFocus
                      className="!py-0.5 font-mono text-[11px]"
                      onBlur={() => setAnchorEditing(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setAnchorEditing(false);
                        }
                      }}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev
                            ? {
                                ...prev,
                                anchor: e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]+/g, '-')
                                  .replace(/^-|-$/g, ''),
                                anchorLocked: true,
                              }
                            : prev,
                        )
                      }
                    />
                  ) : (
                    <>
                      <code className="truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        /glossary/#{editing.anchor || slugifyGlossaryAnchor(editing.term) || '…'}
                      </code>
                      {canEdit && (
                        <button
                          type="button"
                          title="Edit anchor"
                          aria-label="Edit anchor"
                          className="inline-flex text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                          onClick={() => setAnchorEditing(true)}
                        >
                          <Icon name="edit" className="!text-[14px]" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <Field label="Category">
                <Select
                  value={editing.category}
                  disabled={!canEdit || saving}
                  onChange={(e) => setEditing((p) => (p ? { ...p, category: e.target.value } : p))}
                >
                  {GLOSSARY_CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={editing.status}
                  disabled={!canEdit || saving}
                  onChange={(e) =>
                    setEditing((p) =>
                      p ? { ...p, status: e.target.value === 'published' ? 'published' : 'draft' } : p,
                    )
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Aliases
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {editing.aliases.map((alias) => (
                    <span
                      key={alias}
                      className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800"
                    >
                      {alias}
                      {canEdit && (
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-700"
                          onClick={() =>
                            setEditing((p) =>
                              p ? { ...p, aliases: p.aliases.filter((a) => a !== alias) } : p,
                            )
                          }
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {canEdit && (
                    <div className="inline-flex items-center gap-1">
                      <TextInput
                        value={aliasDraft}
                        placeholder="+ Add"
                        className="!w-28 !py-1 text-xs"
                        onChange={(e) => setAliasDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          const next = aliasDraft.trim();
                          if (!next) return;
                          setEditing((p) => {
                            if (!p) return p;
                            if (p.aliases.some((a) => a.toLowerCase() === next.toLowerCase())) return p;
                            return { ...p, aliases: [...p.aliases, next] };
                          });
                          setAliasDraft('');
                        }}
                      />
                      <Button
                        variant="secondary"
                        className="!px-2 !py-1 text-[11px]"
                        onClick={() => {
                          const next = aliasDraft.trim();
                          if (!next) return;
                          setEditing((p) => {
                            if (!p) return p;
                            if (p.aliases.some((a) => a.toLowerCase() === next.toLowerCase())) return p;
                            return { ...p, aliases: [...p.aliases, next] };
                          });
                          setAliasDraft('');
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <Toggle
                checked={editing.autoTooltip}
                disabled={!canEdit || saving}
                label="Reviews"
                aria-label="Activate reviews"
                onChange={(v) => setEditing((p) => (p ? { ...p, autoTooltip: v } : p))}
                className="pb-0.5 text-xs font-medium text-slate-700 dark:text-slate-200"
              />
            </div>

            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Tooltip definition
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`tabular-nums text-[11px] ${
                      editing.tooltipDefinition.length > TOOLTIP_SOFT_MAX
                        ? 'font-medium text-amber-600 dark:text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {editing.tooltipDefinition.length} / {TOOLTIP_SOFT_MAX}
                  </span>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
                    onClick={() => setPreviewTooltip(true)}
                  >
                    Preview tooltip
                  </button>
                </div>
              </div>
              <textarea
                rows={4}
                className="min-h-[5.5rem] w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-950"
                value={editing.tooltipDefinition}
                disabled={!canEdit || saving}
                onChange={(e) =>
                  setEditing((p) => (p ? { ...p, tooltipDefinition: e.target.value } : p))
                }
              />
              <div className="mt-1.5 flex items-center gap-2">
                <span className="shrink-0 text-[11px] font-medium text-slate-400">CTA</span>
                <TextInput
                  value={editing.ctaLabel}
                  disabled={!canEdit || saving}
                  placeholder="How tokens work →"
                  className="!max-w-xs !py-1 text-xs"
                  onChange={(e) => setEditing((p) => (p ? { ...p, ctaLabel: e.target.value } : p))}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Full explanation
                </span>
                <button
                  type="button"
                  className="text-[11px] font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
                  onClick={() => setPreviewGlossary(true)}
                >
                  Preview glossary section
                </button>
              </div>
              <GlossaryRichEditor
                value={editing.fullDefinition}
                disabled={!canEdit || saving}
                onChange={(doc) => setEditing((p) => (p ? { ...p, fullDefinition: doc } : p))}
              />
            </div>

            {editorUsage && (
              <div className="rounded-md border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                  onClick={() => setUsageOpen((v) => !v)}
                >
                  <Icon name={usageOpen ? 'expand_more' : 'chevron_right'} className="!text-[16px]" />
                  <span>
                    Used on — {editorUsage.reviewCount} review
                    {editorUsage.reviewCount === 1 ? '' : 's'} · {editorUsage.occurrenceCount}{' '}
                    occurrence{editorUsage.occurrenceCount === 1 ? '' : 's'}
                  </span>
                </button>
                {usageOpen && (
                  <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                    {editorUsage.reviews.length > 0 ? (
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {editorUsage.reviews.slice(0, 12).map((r) => (
                          <li key={r.productId} className="flex justify-between gap-3">
                            <span>{r.productName} Review</span>
                            <span className="tabular-nums text-slate-400">{r.occurrences}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        {!editing.id
                          ? 'Save the term first to see live usage across reviews.'
                          : 'No matches detected yet.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {previewTooltip && editing && (
        <Modal title="Tooltip preview" onClose={() => setPreviewTooltip(false)}>
          <div
            className="flex justify-center bg-slate-100 py-10 dark:bg-slate-950"
            style={
              {
                '--color-accent': '#ec4899',
                '--color-on-surface': '#0f172a',
                '--color-surface-container-lowest': '#ffffff',
                '--color-surface-variant': '#e2e8f0',
                '--font-display': 'ui-sans-serif, system-ui, sans-serif',
              } as CSSProperties
            }
          >
            <div className="glossary-tooltip is-open relative !opacity-100 !pointer-events-auto !transform-none">
              <div className="glossary-tooltip__badge" aria-hidden="true">
                <div className="glossary-tooltip__badge-clip">
                  <img
                    src={getTooltipCategoryIconLocal(editing.category)}
                    alt=""
                    width={36}
                    height={36}
                  />
                </div>
              </div>
              <div className="glossary-tooltip__body">
                <p className="glossary-tooltip__eyebrow">Glossary term</p>
                <p className="glossary-tooltip__term">{editing.term || 'Term'}</p>
                {glossaryOtherNamesText(editing.term, editing.aliases, editing.displayAliases) ? (
                  <p className="glossary-tooltip__also">
                    Other names: {glossaryOtherNamesText(editing.term, editing.aliases, editing.displayAliases)}
                  </p>
                ) : null}
                <p className="glossary-tooltip__def">
                  {editing.tooltipDefinition.trim() || 'Tooltip definition preview…'}
                </p>
                <a
                  className="glossary-tooltip__link"
                  href={`/glossary/#${editing.anchor || slugifyGlossaryAnchor(editing.term) || 'term'}`}
                  onClick={(e) => e.preventDefault()}
                >
                  {resolveGlossaryCtaLabel(editing.ctaLabel)}
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {previewGlossary && editing && (
        <Modal title="Glossary section preview" onClose={() => setPreviewGlossary(false)} wide>
          <article className="prose prose-sm max-w-none dark:prose-invert">
            <h2 id={editing.anchor || slugifyGlossaryAnchor(editing.term)}>
              {editing.term || 'Untitled term'}
            </h2>
            <p className="text-slate-500 !mt-1 !mb-4 text-sm not-prose">
              Category: {editing.category}
            </p>
            <div
              dangerouslySetInnerHTML={{
                __html:
                  renderGlossaryTipTapHtml(editing.fullDefinition) ||
                  '<p><em>No full explanation yet.</em></p>',
              }}
            />
          </article>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.term}"?`}
          message="Review text stays unchanged. The glossary page and tooltips will drop this term after the next site rebuild."
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}
