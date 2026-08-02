import { useEffect, useState } from 'react';
import type { TakeawayListRowDto, TakeawayRowDto } from '../../../../lib/subscore-takeaways/types';
import { Button, Icon, TextArea, fmtDate } from '../../ui';
import { ExplanationStatusBadge } from '../explanations/ExplanationStatusBadge';
import { nextTakeawayKey, prevTakeawayKey } from './takeawayNav';
import type { TakeawayStatusFilter } from './useSubscoreTakeaways';
import type { ExplanationStatus } from '../../../../lib/ai-explanations/types';

interface Props {
  row: TakeawayRowDto;
  detailLoading?: boolean;
  generating: boolean;
  generateError?: string | null;
  statusFilter: TakeawayStatusFilter;
  allRows: TakeawayListRowDto[];
  onApprove: (body: { keyTakeaway: string; reviewerNote?: string }) => Promise<void>;
  onApproveAndNext: (body: { keyTakeaway: string; reviewerNote?: string }) => void;
  onRegenerate: () => Promise<void>;
  onDiscard: (opts?: { silent?: boolean }) => Promise<void>;
  onSelect: (subscoreKey: string) => void;
  onDirtyChange?: (dirty: boolean, text?: string) => void;
}

export function TakeawayEditor({
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
  const [text, setText] = useState(row.keyTakeaway ?? '');
  const [reviewerNote, setReviewerNote] = useState(row.reviewerNote ?? '');
  const dirty = text !== (row.keyTakeaway ?? '') || reviewerNote !== (row.reviewerNote ?? '');
  const hasCopy = Boolean(text.trim());
  const canDiscard =
    row.takeawayStatus === 'needs_review' ||
    row.takeawayStatus === 'draft' ||
    dirty;

  useEffect(() => {
    setText(row.keyTakeaway ?? '');
    setReviewerNote(row.reviewerNote ?? '');
  }, [row.subscoreKey, row.keyTakeaway, row.reviewerNote]);

  useEffect(() => {
    onDirtyChange?.(dirty, text);
  }, [dirty, text, onDirtyChange]);

  const prevKey = prevTakeawayKey(allRows, row.subscoreKey);
  const nextKey = nextTakeawayKey(allRows, row.subscoreKey, statusFilter);
  const body = () => ({ keyTakeaway: text, reviewerNote: reviewerNote || undefined });

  async function navigateTo(key: string | null) {
    if (!key) return;
    const hadReviewCopy =
      Boolean(row.keyTakeaway?.trim()) ||
      row.takeawayStatus === 'needs_review' ||
      row.takeawayStatus === 'draft';
    if (!text.trim() && hadReviewCopy) {
      await onDiscard({ silent: true });
    }
    onSelect(key);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.subscoreName}</h3>
          <p className="text-[11px] text-slate-500">
            {row.categoryName}
            {row.finalScore != null ? ` · Final score ${row.finalScore.toFixed(1)}` : ''}
          </p>
        </div>
        <ExplanationStatusBadge
          status={row.takeawayStatus as ExplanationStatus}
          loading={generating || detailLoading}
        />
      </div>

      {(row.resultsChanged || row.generationError || generateError) && (
        <div className="space-y-1">
          {row.resultsChanged && (
            <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              Scores changed — needs review.
            </p>
          )}
          {(row.generationError || generateError) && (
            <p className="text-[11px] text-red-700 dark:text-red-300">
              {generateError ?? row.generationError}
            </p>
          )}
        </div>
      )}

      <details className="rounded-md border border-slate-200 dark:border-slate-700" open>
        <summary className="cursor-pointer px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Score breakdown
        </summary>
        <div className="border-t border-slate-200 px-2 py-2 dark:border-slate-700">
          {row.breakdown.length > 0 ? (
            <ul className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
              {row.breakdown.map((b) => (
                <li key={b.name} className="flex justify-between gap-2">
                  <span>{b.name}</span>
                  <span className="font-medium tabular-nums text-slate-800 dark:text-slate-200">
                    {b.score != null ? b.score.toFixed(1) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">{detailLoading ? 'Loading…' : 'No scores yet.'}</p>
          )}
        </div>
      </details>

      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Key takeaway
        </label>
        <TextArea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={hasCopy ? 'Edit the drawer key takeaway…' : 'Generate or write the key takeaway…'}
          className="!text-sm"
        />
        <p className="mt-1 text-[10px] text-slate-400">
          Exactly 2 short sentences — simple words, no long lists of numbers.
        </p>
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
        <Button
          variant="secondary"
          disabled={generating || detailLoading}
          className="!py-1 !text-xs"
          onClick={() => void onRegenerate()}
        >
          <Icon name="auto_awesome" className="!text-[14px]" />
          {hasCopy ? 'Regenerate' : 'Generate'}
        </Button>
        <Button variant="ghost" disabled={!prevKey} className="!py-1 !text-xs" onClick={() => prevKey && void navigateTo(prevKey)}>
          ← Prev
        </Button>
        <Button variant="ghost" disabled={!nextKey} className="!py-1 !text-xs" onClick={() => nextKey && void navigateTo(nextKey)}>
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
