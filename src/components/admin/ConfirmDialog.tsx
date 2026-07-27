import { Button, Icon } from './ui';

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900"
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={message ? 'confirm-dialog-desc' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 id="confirm-dialog-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {message && (
            <p id="confirm-dialog-desc" className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              {message}
            </p>
          )}
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className={danger ? '!bg-red-600 hover:!bg-red-700' : ''}
            onClick={onConfirm}
          >
            {danger && <Icon name="delete" className="!text-[18px]" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
