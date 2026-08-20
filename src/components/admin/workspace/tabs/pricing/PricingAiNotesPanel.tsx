import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../api';
import { Button, Icon } from '../../../ui';
import type { PricingAiNotes } from '../../../../../lib/validation/schemas';

type NotesDto = PricingAiNotes & { stale: boolean };

export type PricingNotesSummaryStat = {
  value: string;
  label: string;
};

export function PricingAiNotesPanel({
  productId,
  canEdit,
  summaryStats = [],
}: {
  productId: string;
  canEdit: boolean;
  /** Compact headline stats shown while notes are collapsed. */
  summaryStats?: PricingNotesSummaryStat[];
}) {
  const [notes, setNotes] = useState<NotesDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<{ notes: NotesDto | null }>(
        `/api/admin/ai-pricing/notes?productId=${encodeURIComponent(productId)}`,
      );
      setNotes(res.notes);
    } catch {
      /* ignore load errors on mount */
    }
  }, [productId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const findingCount = useMemo(() => {
    if (!notes) return 0;
    return notes.importantFindings.length + notes.pros.length + notes.watchOuts.length;
  }, [notes]);

  async function generate(regenerate: boolean) {
    if (!canEdit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ notes: NotesDto }>('/api/admin/ai-pricing/notes', {
        productId,
        regenerate,
      });
      setNotes(res.notes);
      setExpanded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate pricing notes');
    } finally {
      setLoading(false);
    }
  }

  const visibleStats = summaryStats.filter((s) => s.value.trim() && s.value !== '—');

  return (
    <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex min-w-0 items-center gap-2 text-left"
          onClick={() => notes && setExpanded((v) => !v)}
          disabled={!notes}
          aria-expanded={notes ? expanded : undefined}
        >
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            AI pricing notes
          </span>
          {notes && (
            <>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {findingCount} finding{findingCount === 1 ? '' : 's'}
              </span>
              <Icon
                name={expanded ? 'expand_less' : 'expand_more'}
                className="!text-[18px] text-slate-400"
              />
            </>
          )}
        </button>

        {canEdit && (
          <Button
            variant="secondary"
            className="text-xs"
            disabled={loading}
            onClick={() => void generate(Boolean(notes))}
          >
            <Icon
              name={loading ? 'progress_activity' : 'auto_awesome'}
              className={`!text-[14px] ${loading ? 'animate-spin' : ''}`}
            />
            {loading ? 'Generating…' : notes ? 'Regenerate' : 'Generate'}
          </Button>
        )}
      </div>

      {notes?.stale && (
        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
          Pricing notes outdated — regenerate recommended
        </p>
      )}
      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}

      {!notes ? (
        <p className="mt-2 text-xs text-slate-400">
          Generate once for compact findings while you write. Not published.
        </p>
      ) : (
        <>
          {!expanded && visibleStats.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {visibleStats.slice(0, 3).map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <p className="truncate text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {!expanded && (
            <button
              type="button"
              className="mt-2 text-[11px] font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
              onClick={() => setExpanded(true)}
            >
              View all notes
            </button>
          )}

          {expanded && (
            <div className="mt-3 space-y-3">
              <NotesList title="Key findings" items={notes.importantFindings} />
              <NotesList title="Good" items={notes.pros} />
              <NotesList title="Watch out" items={notes.watchOuts} />
              <button
                type="button"
                className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                onClick={() => setExpanded(false)}
              >
                Hide notes
              </button>
            </div>
          )}
        </>
      )}

      {!notes && visibleStats.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {visibleStats.slice(0, 3).map((stat) => (
            <div key={stat.label} className="min-w-0">
              <p className="truncate text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {stat.value}
              </p>
              <p className="text-[10px] text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
