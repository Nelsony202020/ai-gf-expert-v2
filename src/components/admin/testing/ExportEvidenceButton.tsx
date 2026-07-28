import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../Toast';
import { Button, Icon } from '../ui';

export function ExportEvidenceButton({
  runId,
  disabled,
}: {
  runId: string;
  disabled?: boolean;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!(e.target as Element).closest?.('[data-export-evidence-menu]')) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  async function download(format: 'csv' | 'pdf') {
    setBusy(format);
    try {
      await api.download(`/api/admin/test-runs/${runId}/export?format=${format}`);
      toast.success(`Evidence exported as ${format.toUpperCase()}`);
      setOpen(false);
    } catch (e) {
      toast.error('Export failed', {
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative" data-export-evidence-menu>
      <Button
        variant="secondary"
        className="shrink-0"
        disabled={disabled || busy !== null}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon name="download" />
        Export evidence
        <Icon name="expand_more" className="!text-[16px]" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 min-w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={busy !== null}
            onClick={() => void download('csv')}
          >
            <Icon name="table" className="!text-[16px] text-slate-400" />
            {busy === 'csv' ? 'Exporting CSV…' : 'CSV spreadsheet'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={busy !== null}
            onClick={() => void download('pdf')}
          >
            <Icon name="picture_as_pdf" className="!text-[16px] text-slate-400" />
            {busy === 'pdf' ? 'Exporting PDF…' : 'PDF report'}
          </button>
        </div>
      )}
    </div>
  );
}
