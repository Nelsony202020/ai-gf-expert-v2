import { Button, Icon } from '../../ui';

export function VerdictProgressHeader({
  completed,
  total,
  onContinue,
}: {
  completed: number;
  total: number;
  onContinue: () => void;
}) {
  const hasIncomplete = completed < total;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Verdict progress
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {completed} of {total} sections complete
          </p>
        </div>
        {hasIncomplete && (
          <Button variant="secondary" className="!py-1.5 text-xs" onClick={onContinue}>
            <Icon name="arrow_forward" className="!text-[16px]" />
            Continue next incomplete
          </Button>
        )}
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[var(--testing-accent,#6366f1)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
