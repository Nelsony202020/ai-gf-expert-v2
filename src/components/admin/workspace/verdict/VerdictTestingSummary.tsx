import { Icon, Spinner } from '../../ui';

export function VerdictTestingSummary({
  previewScore,
  topCategories,
  remainingRequired,
  loading,
  calcError,
  isPreview,
  runName,
}: {
  previewScore: number | null;
  topCategories: { name: string; score: number }[];
  remainingRequired: number | null;
  loading: boolean;
  calcError: boolean;
  isPreview: boolean;
  runName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Testing summary
          </p>
          {loading && !previewScore ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <Spinner />
              Loading scores…
            </div>
          ) : calcError ? (
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              Could not load preview score — complete more test answers or retry from Testing.
            </p>
          ) : previewScore != null ? (
            <p className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {previewScore.toFixed(1)}
              <span className="ml-1.5 text-sm font-normal text-slate-500">
                {isPreview ? 'preview score' : 'published score'}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">No test run yet — start testing to unlock scores.</p>
          )}
          {topCategories.length > 0 && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {topCategories.map((c) => `${c.name} ${c.score.toFixed(1)}`).join(' · ')}
            </p>
          )}
          {runName && (
            <p className="mt-1 text-[11px] text-slate-400">
              Source: {runName}
              {isPreview ? ' (draft — not published)' : ''}
            </p>
          )}
        </div>
        {remainingRequired != null && remainingRequired > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <Icon name="science" className="!text-[14px]" />
            {remainingRequired} required test answer{remainingRequired === 1 ? '' : 's'} remaining
          </div>
        )}
      </div>
    </div>
  );
}
