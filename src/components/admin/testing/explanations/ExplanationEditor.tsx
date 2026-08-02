import { useEffect, useState } from 'react';
import type { ExplanationListRowDto, ExplanationRowDto } from '../../../../lib/ai-explanations/types';
import { Button, Icon, TextArea, fmtDate } from '../../ui';
import { ExplanationStatusBadge } from './ExplanationStatusBadge';
import { nextReviewKey, prevReviewKey } from './explanationNav';
import type { StatusFilter } from './useExplanations';

interface Props {
  row: ExplanationRowDto;
  detailLoading?: boolean;
  generating: boolean;
  generateError?: string | null;
  statusFilter: StatusFilter;
  allRows: ExplanationListRowDto[];
  onApprove: (body: { whatThisMeans: string; reviewerNote?: string }) => Promise<void>;
  onApproveAndNext: (body: { whatThisMeans: string; reviewerNote?: string }) => void;
  onRegenerate: () => Promise<void>;
  onDiscard: () => Promise<void>;
  onSelect: (groupKey: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function ExplanationEditor({
  row,
  detailLoading,
  generating,
  generateError,
  statusFilter,
  allRows,
  onApprove,
  onApproveAndNext,
  onRegenerate,
  onDiscard,
  onSelect,
  onDirtyChange,
}: Props) {
  const [text, setText] = useState(row.whatThisMeans ?? '');
  const [reviewerNote, setReviewerNote] = useState(row.reviewerNote ?? '');
  const dirty = text !== (row.whatThisMeans ?? '') || reviewerNote !== (row.reviewerNote ?? '');
  const hasCopy = Boolean(text.trim());
  const canDiscard =
    row.explanationStatus === 'needs_review' ||
    row.explanationStatus === 'draft' ||
    dirty;

  useEffect(() => {
    setText(row.whatThisMeans ?? '');
    setReviewerNote(row.reviewerNote ?? '');
  }, [row.groupKey, row.whatThisMeans, row.reviewerNote]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const prevKey = prevReviewKey(allRows, row.groupKey);
  const nextKey = nextReviewKey(allRows, row.groupKey, statusFilter);

  const body = () => ({ whatThisMeans: text, reviewerNote: reviewerNote || undefined });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.groupName}</h3>
          <p className="text-[11px] text-slate-500">
            {row.categoryName} › {row.subscoreName}
            {row.score != null ? ` · ${row.score}` : ''}
          </p>
        </div>
        <ExplanationStatusBadge status={row.explanationStatus} loading={generating || detailLoading} />
      </div>

      {(row.resultsChanged || row.generationError || generateError) && (
        <div className="space-y-1">
          {row.resultsChanged && (
            <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              Results changed — needs review.
            </p>
          )}
          {(row.generationError || generateError) && (
            <p className="text-[11px] text-red-700 dark:text-red-300">
              {generateError ?? row.generationError}
            </p>
          )}
        </div>
      )}

      {detailLoading && !row.methodology.whatThisMeasures && (
        <p className="text-xs text-slate-500">Loading details…</p>
      )}

      <details className="rounded-md border border-slate-200 dark:border-slate-700">
        <summary className="cursor-pointer px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Testing context
        </summary>
        <div className="space-y-2 border-t border-slate-200 px-2 py-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
          {row.methodology.whatThisMeasures ? (
            <>
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-300">Measures:</span>{' '}
                {row.methodology.whatThisMeasures}
              </p>
              {row.methodology.howWeTested && (
                <p>
                  <span className="font-medium text-slate-700 dark:text-slate-300">How tested:</span>{' '}
                  {row.methodology.howWeTested}
                </p>
              )}
              <ul className="space-y-0.5">
                {row.results.map((r) => (
                  <li key={r.slug}>
                    <span className="font-medium">{r.label}:</span> {r.value}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-slate-400">Loading…</p>
          )}
        </div>
      </details>

      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
          What this means
        </label>
        <TextArea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={hasCopy ? 'Edit the user-facing explanation…' : 'Generate or write the user-facing explanation…'}
          className="!text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] text-slate-500">
          Reviewer note <span className="text-slate-400">(optional, for AI)</span>
        </label>
        <TextArea
          rows={1}
          value={reviewerNote}
          onChange={(e) => setReviewerNote(e.target.value)}
          placeholder="Optional context for regeneration…"
          className="!text-sm"
        />
      </div>

      <p className="text-[11px] text-slate-500">
        {row.generatedAt ? `Generated ${fmtDate(row.generatedAt)}` : 'Not generated yet'}
        {row.approvedAt ? ` · Approved ${fmtDate(row.approvedAt)}` : ''}
        {dirty ? ' · Edited — approve or discard' : ''}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <Button
          disabled={generating || detailLoading || !text.trim()}
          className="!py-1 !text-xs"
          onClick={() => void onApprove(body())}
        >
          Approve
        </Button>
        <Button
          variant="primary"
          disabled={generating || detailLoading || !text.trim()}
          className="!py-1 !text-xs"
          onClick={() => onApproveAndNext(body())}
        >
          Approve &amp; Next
        </Button>
        <Button variant="secondary" disabled={generating || detailLoading} className="!py-1 !text-xs" onClick={() => void onRegenerate()}>
          <Icon name="auto_awesome" className="!text-[14px]" />
          {hasCopy ? 'Regenerate' : 'Generate'}
        </Button>
        <Button variant="ghost" disabled={!prevKey} className="!py-1 !text-xs" onClick={() => prevKey && onSelect(prevKey)}>
          ← Prev
        </Button>
        <Button variant="ghost" disabled={!nextKey} className="!py-1 !text-xs" onClick={() => nextKey && onSelect(nextKey)}>
          Next →
        </Button>
        {canDiscard && (
          <Button
            variant="ghost"
            disabled={detailLoading}
            className="!py-1 !text-xs text-red-600 hover:text-red-700 dark:text-red-400"
            onClick={() => void onDiscard()}
          >
            Discard review
          </Button>
        )}
      </div>
    </div>
  );
}

/** Imperative guard — returns true if navigation should proceed. */
export function confirmLeaveReview(opts: {
  dirty: boolean;
  needsReviewCount: number;
}): boolean {
  if (!opts.dirty && opts.needsReviewCount === 0) return true;

  const parts: string[] = [];
  if (opts.dirty) parts.push('You have unsaved edits on this group.');
  if (opts.needsReviewCount > 0) {
    parts.push(
      `${opts.needsReviewCount} explanation${opts.needsReviewCount === 1 ? '' : 's'} still need review.`,
    );
  }
  parts.push('Leave anyway? Unapproved AI copy will stay in review until you discard it.');

  return window.confirm(parts.join(' '));
}
