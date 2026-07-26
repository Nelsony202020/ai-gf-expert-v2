import { Badge, Icon, statusTone } from './ui';

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-amber-500',
  in_review: 'bg-amber-500',
  scheduled: 'bg-blue-500',
  published: 'bg-green-500',
  archived: 'bg-slate-300',
};

interface ProductSetupStatusBarProps {
  status: string;
  progressPct: number;
  missingCount: number;
  missingKind: 'required' | 'recommended';
  showPreview: boolean;
  previewUrl?: string;
}

export function ProductSetupStatusBar({
  status,
  progressPct,
  missingCount,
  missingKind,
  showPreview,
  previewUrl,
}: ProductSetupStatusBarProps) {
  const statusLabel = String(status ?? 'draft').replace('_', ' ');

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={statusTone(status)}>
            <span className="inline-flex items-center gap-1.5 capitalize">
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] ?? 'bg-slate-400'}`}
              />
              {statusLabel}
            </span>
          </Badge>
          {missingCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <Icon name="warning" className="!text-[14px]" />
              {missingCount}{' '}
              {missingKind === 'required'
                ? `required field${missingCount === 1 ? '' : 's'} remaining`
                : `recommended field${missingCount === 1 ? '' : 's'} missing`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
              <Icon name="check_circle" className="!text-[14px]" />
              {missingKind === 'required' ? 'Required fields complete' : 'Recommended fields complete'}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Setup progress</span>
            <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">
              {progressPct}% complete
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-pink-500 transition-all dark:bg-pink-600"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        {showPreview && previewUrl ? (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-pink-600 hover:underline dark:text-pink-400"
          >
            Preview product <Icon name="open_in_new" className="!text-[16px]" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
