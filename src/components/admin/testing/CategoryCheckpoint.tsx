import { Button, Icon } from '../ui';

export function CategoryCheckpoint({
  completedCategory,
  nextCategory,
  onBegin,
  onBack,
}: {
  completedCategory: string;
  nextCategory: string;
  onBegin: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/40">
        <Icon name="check_circle" className="!text-[28px] text-green-600" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {completedCategory} complete
      </p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Up next</h3>
      <p className="mt-1 text-2xl font-bold text-pink-600 dark:text-pink-400">{nextCategory}</p>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Continue when you are ready. Your progress in {completedCategory} is saved.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {onBack && (
          <Button type="button" variant="secondary" onClick={onBack}>
            ← Back
          </Button>
        )}
        <Button type="button" onClick={onBegin}>
          Begin {nextCategory} →
        </Button>
      </div>
    </div>
  );
}
