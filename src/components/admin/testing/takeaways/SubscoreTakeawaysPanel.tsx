import { useEffect, useMemo, useState } from 'react';
import { Button, Icon, Select, Spinner } from '../../ui';
import { ExplanationStatusBadge } from '../explanations/ExplanationStatusBadge';
import type { ExplanationStatus } from '../../../../lib/ai-explanations/types';
import { sortReviewCopyCategoryEntries } from '../../../../lib/admin/reviewCopyOrder';
import { TakeawayEditor } from './TakeawayEditor';
import { nextTakeawayKey } from './takeawayNav';
import { useSubscoreTakeaways, type TakeawayStatusFilter } from './useSubscoreTakeaways';

const filterSelectClass = 'min-w-[9rem] max-w-[11rem] shrink-0 !w-auto !py-1 !text-xs';

interface Props {
  productId: string;
  testingComplete: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onNeedsReviewChange?: (count: number) => void;
}

export function SubscoreTakeawaysPanel({
  productId,
  testingComplete,
  onDirtyChange,
  onNeedsReviewChange,
}: Props) {
  const {
    summary,
    rows,
    loading,
    detailLoading,
    generating,
    generatingKey,
    approving,
    discarding,
    error,
    generateError,
    needsReviewCount,
    loadDetail,
    getRowDetail,
    approve,
    approveAndNext,
    approveAll,
    discardReview,
    discardAll,
    generateOne,
    generateAllMissing,
  } = useSubscoreTakeaways(productId);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TakeawayStatusFilter>('all');
  const [editorDirty, setEditorDirty] = useState(false);
  const [editorText, setEditorText] = useState('');

  useEffect(() => {
    onDirtyChange?.(editorDirty);
  }, [editorDirty, onDirtyChange]);

  useEffect(() => {
    onNeedsReviewChange?.(needsReviewCount);
  }, [needsReviewCount, onNeedsReviewChange]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.categorySlug, r.categoryName);
    return sortReviewCopyCategoryEntries(
      [...map.entries()].map(([slug, name]) => ({ slug, name })),
    ).map(({ slug, name }) => [slug, name] as const);
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (categoryFilter !== 'all' && r.categorySlug !== categoryFilter) return false;
      if (statusFilter !== 'all' && r.takeawayStatus !== statusFilter) return false;
      return true;
    });
  }, [rows, categoryFilter, statusFilter]);

  const effectiveSelectedKey =
    selectedKey ?? filteredRows[0]?.subscoreKey ?? rows[0]?.subscoreKey ?? null;

  const selectedRow = effectiveSelectedKey ? getRowDetail(effectiveSelectedKey) : null;

  useEffect(() => {
    if (effectiveSelectedKey) void loadDetail(effectiveSelectedKey);
  }, [effectiveSelectedKey, loadDetail]);

  const listByCategory = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const r of filteredRows) {
      const list = map.get(r.categorySlug) ?? [];
      list.push(r);
      map.set(r.categorySlug, list);
    }
    return sortReviewCopyCategoryEntries(
      [...map.entries()].map(([slug, rows]) => ({
        slug,
        name: rows[0]?.categoryName ?? slug,
        rows,
      })),
    ).map(({ slug, rows }) => [slug, rows] as const);
  }, [filteredRows]);

  async function handleSelect(subscoreKey: string) {
    if (subscoreKey === effectiveSelectedKey) return;

    if (effectiveSelectedKey && selectedRow) {
      const hadReviewCopy =
        Boolean(selectedRow.keyTakeaway?.trim()) ||
        selectedRow.takeawayStatus === 'needs_review' ||
        selectedRow.takeawayStatus === 'draft';
      if (!editorText.trim() && hadReviewCopy) {
        await discardReview(effectiveSelectedKey);
      }
    }

    setEditorDirty(false);
    setSelectedKey(subscoreKey);
  }

  function handleApproveAndNext(body: { keyTakeaway: string; reviewerNote?: string }) {
    if (!effectiveSelectedKey) return;
    const next = nextTakeawayKey(rows, effectiveSelectedKey, statusFilter);
    setEditorDirty(false);
    void approveAndNext(effectiveSelectedKey, next, body, (key) => setSelectedKey(key));
  }

  async function handleDiscard(opts?: { silent?: boolean }) {
    if (!effectiveSelectedKey || !selectedRow) return;
    const isReviewStatus =
      selectedRow.takeawayStatus === 'needs_review' || selectedRow.takeawayStatus === 'draft';

    if (!isReviewStatus && editorDirty) {
      if (!opts?.silent && !window.confirm('Discard your edits and revert to the approved copy?')) return;
      await loadDetail(effectiveSelectedKey);
      setEditorDirty(false);
      return;
    }

    if (!opts?.silent && !window.confirm('Discard this AI copy? It will be removed from review.')) return;
    await discardReview(effectiveSelectedKey);
    setEditorDirty(false);
  }

  if (loading && !summary) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="secondary"
          disabled={approving || needsReviewCount === 0}
          className="!py-1 !text-xs"
          onClick={() => void approveAll()}
        >
          {approving ? 'Approving…' : `Approve all (${needsReviewCount})`}
        </Button>
        <Button
          variant="secondary"
          disabled={discarding || needsReviewCount === 0}
          className="!py-1 !text-xs text-red-700 hover:text-red-800 dark:text-red-400"
          onClick={() => {
            if (
              !window.confirm(
                `Discard all ${needsReviewCount} takeaway${needsReviewCount === 1 ? '' : 's'} waiting for review?`,
              )
            ) {
              return;
            }
            void discardAll();
          }}
        >
          {discarding ? 'Discarding…' : `Discard all (${needsReviewCount})`}
        </Button>
        <Button
          variant="secondary"
          disabled={!testingComplete || generating}
          className="!py-1 !text-xs"
          onClick={() => void generateAllMissing()}
        >
          <Icon
            name={generating ? 'progress_activity' : 'auto_awesome'}
            className={`!text-[14px] ${generating ? 'animate-spin' : ''}`}
          />
          {generating ? 'Generating…' : 'Generate all missing'}
        </Button>
      </div>

      {!testingComplete && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
          Complete required testing first — takeaways need finished subscore results.
        </p>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-800">
          {error}
        </p>
      )}

      {summary && (
        <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
          <span>
            <strong className="text-slate-800 dark:text-slate-200">{summary.total}</strong> subscores
          </span>
          <span>{summary.notGenerated} not generated</span>
          <span>{summary.needsReview} needs review</span>
          <span>{summary.approved} approved</span>
          <span>{summary.outdated} outdated</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={filterSelectClass}
        >
          <option value="all">All categories</option>
          {categories.map(([slug, name]) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TakeawayStatusFilter)}
          className={filterSelectClass}
        >
          <option value="all">All statuses</option>
          <option value="needs_review">Needs review</option>
          <option value="outdated">Outdated</option>
          <option value="not_generated">Not generated</option>
          <option value="approved">Approved</option>
          <option value="error">Error</option>
        </Select>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(200px,260px)_1fr] lg:items-start">
        <div className="max-h-[min(420px,calc(100vh-14rem))] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="space-y-3">
            {listByCategory.map(([catSlug, catRows]) => (
              <section
                key={catSlug}
                className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="border-b border-slate-200 bg-slate-100/90 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[11px] font-semibold tracking-wide text-slate-800 dark:text-slate-100">
                    {catRows[0]?.categoryName}
                  </p>
                </div>
                <ul className="pb-0.5">
                  {catRows.map((r) => (
                    <li key={r.subscoreKey}>
                      <button
                        type="button"
                        onClick={() => handleSelect(r.subscoreKey)}
                        className={`flex w-full items-center justify-between gap-1 px-2.5 py-1 text-left text-xs ${
                          effectiveSelectedKey === r.subscoreKey
                            ? 'bg-pink-50 font-medium text-pink-900 dark:bg-pink-950/40 dark:text-pink-100'
                            : 'text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="truncate">{r.subscoreName}</span>
                        <ExplanationStatusBadge
                          status={r.takeawayStatus as ExplanationStatus}
                          loading={generatingKey === r.subscoreKey}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          {selectedRow ? (
            <TakeawayEditor
              row={selectedRow}
              detailLoading={detailLoading === effectiveSelectedKey}
              generating={generatingKey === selectedRow.subscoreKey}
              generateError={
                generateError?.subscoreKey === selectedRow.subscoreKey ? generateError.message : null
              }
              statusFilter={statusFilter}
              allRows={rows}
              onDirtyChange={(dirty, text) => {
                setEditorDirty(dirty);
                if (text !== undefined) setEditorText(text);
              }}
              onApprove={async (body) => {
                await approve(selectedRow.subscoreKey, body);
                setEditorDirty(false);
              }}
              onApproveAndNext={handleApproveAndNext}
              onRegenerate={async () => {
                const hasExisting = Boolean(selectedRow.keyTakeaway?.trim());
                await generateOne(selectedRow.subscoreKey, {
                  regenerate: hasExisting,
                  reviewerNote: selectedRow.reviewerNote,
                });
              }}
              onDiscard={handleDiscard}
              onSelect={handleSelect}
            />
          ) : (
            <p className="text-xs text-slate-500">Select a subscore to review its key takeaway.</p>
          )}
        </div>
      </div>
    </div>
  );
}
