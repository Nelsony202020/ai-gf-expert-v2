import { Icon } from '../ui';

/** Column header hint — visible on hover. */
export function ColumnTooltip({ hint }: { hint: string }) {
  return (
    <span className="group relative inline-block">
      <span
        className="ml-0.5 inline-flex cursor-help align-middle text-slate-400 group-hover:text-pink-500"
        aria-label="Column help"
        tabIndex={0}
      >
        <Icon name="info" className="!text-[14px]" />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-48 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-2 text-left text-[11px] font-normal leading-snug text-slate-600 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
      >
        {hint}
      </span>
    </span>
  );
}
