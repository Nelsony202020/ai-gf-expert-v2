import { useEffect, useMemo, useState } from 'react';
import { Button, Icon, Select, Spinner } from '../../ui';
import { ExplanationEditor } from './ExplanationEditor';
import { ExplanationStatusBadge } from './ExplanationStatusBadge';
import { buildExplanationListTree } from './explanationListTree';
import { nextReviewKey } from './explanationNav';
import { setExplanationLeaveGuard } from './explanationLeaveGuard';
import { useExplanations, type StatusFilter } from './useExplanations';
import type { ExplanationListRowDto, ExplanationRowDto } from '../../../../lib/ai-explanations/types';
import { sortReviewCopyCategoryEntries } from '../../../../lib/admin/reviewCopyOrder';

const filterSelectClass = 'min-w-[9rem] max-w-[11rem] shrink-0 !w-auto !py-1 !text-xs';

interface Props {
  productId: string;
  testingComplete: boolean;
  onBack: () => void;
  /** When nested inside ReviewCopyPanel — hides duplicate header/back/guard. */
  embedded?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onNeedsReviewChange?: (count: number) => void;
}

function AiBatchButton({
  label,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="secondary" disabled={disabled || loading} className="!py-1 !text-xs" onClick={onClick}>
      <Icon
        name={loading ? 'progress_activity' : 'auto_awesome'}
        className={`!text-[14px] ${loading ? 'animate-spin' : ''}`}
      />
      {label}
    </Button>
  );
}

export function ResultExplanationsPanel({
  productId,
  testingComplete,
  onBack,
  embedded,
  onDirtyChange,
  onNeedsReviewChange,
}: Props) {
  const {
    summary,
    rows,
    loading,
    detailLoading,
    generating,
    generatingGroupKey,
    approving,
    discarding,
    error,
    generateError,
    batchProgress,
    batchErrors,
    batchJobId,
    needsReviewCount,
    loadDetail,
    getRowDetail,
    approve,
    approveAndNext,
    approveAll,
    discardReview,
    discardAll,
    generateOne,
    startBatch,
  } = useExplanations(productId);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editorDirty, setEditorDirty] = useState(false);

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
      if (statusFilter !== 'all' && r.explanationStatus !== statusFilter) return false;
      return true;
    });
  }, [rows, categoryFilter, statusFilter]);

  const effectiveSelectedKey =
    selectedKey ??
    filteredRows[0]?.groupKey ??
    rows[0]?.groupKey ??
    null;

  const selectedRow: ExplanationRowDto | null = effectiveSelectedKey
    ? getRowDetail(effectiveSelectedKey)
    : null;

  useEffect(() => {
    if (effectiveSelectedKey) void loadDetail(effectiveSelectedKey);
  }, [effectiveSelectedKey, loadDetail]);

  useEffect(() => {
    onDirtyChange?.(editorDirty);
  }, [editorDirty, onDirtyChange]);

  useEffect(() => {
    onNeedsReviewChange?.(needsReviewCount);
  }, [needsReviewCount, onNeedsReviewChange]);

  useEffect(() => {
    if (embedded) return;
    setExplanationLeaveGuard({ needsReviewCount, editorDirty });
    return () => setExplanationLeaveGuard(null);
  }, [embedded, needsReviewCount, editorDirty]);

  const listTree = useMemo(
    () =>
      buildExplanationListTree(rows, {
        categorySlug: categoryFilter,
        status: statusFilter,
      }),
    [rows, categoryFilter, statusFilter],
  );

  const batchPct =
    batchProgress && batchProgress.total > 0
      ? Math.round((batchProgress.done / batchProgress.total) * 100)
      : 0;

  function handleSelectGroup(groupKey: string) {
    if (groupKey === effectiveSelectedKey) return;
    setEditorDirty(false);
    setSelectedKey(groupKey);
  }

  function handleBack() {
    onBack();
  }

  function handleApproveAndNext(body: { whatThisMeans: string; reviewerNote?: string }) {
    if (!effectiveSelectedKey) return;
    const next = nextReviewKey(rows, effectiveSelectedKey, statusFilter);
    setEditorDirty(false);
    void approveAndNext(effectiveSelectedKey, next, body, (key) => setSelectedKey(key));
  }

  async function handleDiscard() {
    if (!effectiveSelectedKey || !selectedRow) return;

    const isReviewStatus =
      selectedRow.explanationStatus === 'needs_review' || selectedRow.explanationStatus === 'draft';

    if (!isReviewStatus && editorDirty) {
      if (!window.confirm('Discard your edits and revert to the approved copy?')) return;
      await loadDetail(effectiveSelectedKey);
      setEditorDirty(false);
      return;
    }

    if (!window.confirm('Discard this AI copy? It will be removed from review.')) return;
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
      {!embedded && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="mb-0.5 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-pink-600"
            >
              ← Back to testing
            </button>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Result explanations
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                    `Discard all ${needsReviewCount} explanation${needsReviewCount === 1 ? '' : 's'} waiting for review? This cannot be undone.`,
                  )
                ) {
                  return;
                }
                void discardAll();
              }}
            >
              {discarding ? 'Discarding…' : `Discard all (${needsReviewCount})`}
            </Button>
            <AiBatchButton
              label="Generate all missing"
              disabled={!testingComplete}
              loading={generating}
              onClick={() => void startBatch('missing')}
            />
            <AiBatchButton
              label="Regenerate outdated"
              disabled={(summary?.outdated ?? 0) === 0}
              loading={generating}
              onClick={() => void startBatch('outdated')}
            />
          </div>
        </div>
      )}

      {embedded && (
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
                  `Discard all ${needsReviewCount} explanation${needsReviewCount === 1 ? '' : 's'} waiting for review?`,
                )
              ) {
                return;
              }
              void discardAll();
            }}
          >
            {discarding ? 'Discarding…' : `Discard all (${needsReviewCount})`}
          </Button>
          <AiBatchButton
            label="Generate all missing"
            disabled={!testingComplete}
            loading={generating}
            onClick={() => void startBatch('missing')}
          />
          <AiBatchButton
            label="Regenerate outdated"
            disabled={(summary?.outdated ?? 0) === 0}
            loading={generating}
            onClick={() => void startBatch('outdated')}
          />
        </div>
      )}

      {!testingComplete && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
          Complete required testing first — explanations need finished test results.
        </p>
      )}

      {batchJobId && generating && (
        <div className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 dark:border-pink-900/40 dark:bg-pink-950/30">
          <div className="flex items-center gap-2 text-xs font-medium text-pink-800 dark:text-pink-200">
            <Icon name="progress_activity" className="animate-spin !text-[16px]" />
            {batchProgress
              ? `Generating explanations… ${batchProgress.done}/${batchProgress.total} (${batchPct}%)`
              : 'Preparing batch…'}
          </div>
          {batchProgress && batchProgress.total > 0 && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-pink-200 dark:bg-pink-900/50">
              <div
                className="h-full rounded-full bg-pink-600 transition-all duration-300"
                style={{ width: `${batchPct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-800">
          {error}
        </p>
      )}

      {batchErrors.length > 0 && (
        <details className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-800">
          <summary className="cursor-pointer font-medium">
            {batchErrors.length} generation error{batchErrors.length === 1 ? '' : 's'}
          </summary>
          <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto">
            {batchErrors.map((e) => (
              <li key={e.groupKey}>
                <span className="font-medium">{e.groupKey}:</span> {e.error}
              </li>
            ))}
          </ul>
        </details>
      )}

      {summary && (
        <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
          <span>
            <strong className="text-slate-800 dark:text-slate-200">{summary.total}</strong> groups
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
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className={filterSelectClass}
        >
          <option value="all">All statuses</option>
          <option value="needs_review">Needs review</option>
          <option value="outdated">Outdated</option>
          <option value="not_generated">Not generated</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="error">Error</option>
        </Select>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(200px,260px)_1fr] lg:items-start">
        <div className="max-h-[min(420px,calc(100vh-14rem))] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="space-y-3">
            {listTree.map((cat) => (
              <section
                key={cat.slug}
                className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="border-b border-slate-200 bg-slate-100/90 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[11px] font-semibold tracking-wide text-slate-800 dark:text-slate-100">
                    {cat.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {cat.approved}/{cat.total} approved
                  </p>
                </div>
                <div>
                  {cat.subscores.map((sub, subIdx) => (
                    <div
                      key={`${cat.slug}/${sub.slug}`}
                      className={subIdx > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}
                    >
                      <p className="px-2.5 pb-0.5 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {sub.name}
                      </p>
                      <ul className="pb-0.5">
                        {sub.rows.map((r) => (
                          <li key={r.groupKey}>
                            <button
                              type="button"
                              onClick={() => handleSelectGroup(r.groupKey)}
                              className={`flex w-full items-center justify-between gap-1 px-2.5 py-1 text-left text-xs ${
                                effectiveSelectedKey === r.groupKey
                                  ? 'bg-pink-50 font-medium text-pink-900 dark:bg-pink-950/40 dark:text-pink-100'
                                  : 'text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <span className="truncate">{r.groupName}</span>
                              <ExplanationStatusBadge
                                status={r.explanationStatus}
                                loading={generatingGroupKey === r.groupKey}
                              />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          {selectedRow ? (
            <ExplanationEditor
              row={selectedRow}
              detailLoading={detailLoading === effectiveSelectedKey}
              generating={generatingGroupKey === selectedRow.groupKey}
              generateError={
                generateError?.groupKey === selectedRow.groupKey ? generateError.message : null
              }
              statusFilter={statusFilter}
              allRows={rows}
              onDirtyChange={setEditorDirty}
              onApprove={async (body) => {
                await approve(selectedRow.groupKey, body);
                setEditorDirty(false);
              }}
              onApproveAndNext={handleApproveAndNext}
              onRegenerate={async () => {
                const hasExisting = Boolean(selectedRow.whatThisMeans?.trim());
                await generateOne(selectedRow.groupKey, {
                  regenerate: hasExisting,
                  reviewerNote: selectedRow.reviewerNote,
                });
              }}
              onDiscard={handleDiscard}
              onSelect={handleSelectGroup}
            />
          ) : (
            <p className="text-xs text-slate-500">Select an evidence group to review.</p>
          )}
        </div>
      </div>
    </div>
  );
}
