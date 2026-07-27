import { Button } from '../ui';

export function UnsavedChangesDialog({
  title = 'Leave without saving?',
  message = 'You have unsaved changes in this session.',
  saving,
  onStay,
  onDiscard,
  onSave,
}: {
  title?: string;
  message?: string;
  saving?: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900"
        role="alertdialog"
        aria-labelledby="unsaved-dialog-title"
        aria-describedby="unsaved-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 id="unsaved-dialog-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p id="unsaved-dialog-desc" className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <Button variant="secondary" disabled={saving} onClick={onStay}>
            Stay
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            className="!text-red-700 hover:!bg-red-50 dark:!text-red-400"
            onClick={onDiscard}
          >
            Leave without saving
          </Button>
          <Button disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save and leave'}
          </Button>
        </div>
      </div>
    </div>
  );
}
