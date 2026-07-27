import { Icon } from '../ui';

export function AiNotesSectionButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-pink-900/50 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
      onClick={onClick}
    >
      <Icon name="sticky_note_2" className="!text-[16px]" />
      AI notes & suggestions
    </button>
  );
}
