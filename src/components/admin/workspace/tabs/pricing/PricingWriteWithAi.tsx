import { useState, type ReactNode } from 'react';
import { api } from '../../../api';
import { Button, Icon } from '../../../ui';
import type { PricingCopyFieldId } from '../../../../../lib/ai-pricing-copy/context';
import type { PricingWriteAction } from '../../../../../lib/ai-pricing-copy/prompts';

const ACTIONS: { id: PricingWriteAction; label: string }[] = [
  { id: 'write_fresh', label: 'Write fresh' },
  { id: 'notes_to_copy', label: 'Turn notes into copy' },
  { id: 'easier', label: 'Easier to read' },
  { id: 'shorter', label: 'Make shorter' },
  { id: 'more_detail', label: 'Add more detail' },
  { id: 'another', label: 'Another version' },
];

export function PricingWriteWithAi({
  productId,
  field,
  currentText,
  privateNotes,
  hasText,
  disabled,
  beside,
  onReplace,
}: {
  productId: string;
  field: PricingCopyFieldId;
  currentText: string;
  privateNotes?: string;
  hasText: boolean;
  disabled?: boolean;
  /** Optional control shown on the same row as the Write with AI trigger. */
  beside?: ReactNode;
  onReplace: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [undoText, setUndoText] = useState<string | null>(null);

  async function run(action: PricingWriteAction) {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ text: string }>('/api/admin/ai-pricing/write-copy', {
        productId,
        field,
        action,
        currentText: preview?.trim() || currentText.trim() || undefined,
        privateNotes: privateNotes?.trim() || undefined,
      });
      const text = String(res.text ?? '').trim();
      if (!text) {
        setError('No suggestion returned');
        return;
      }
      if (!hasText && !preview) {
        setUndoText(currentText);
        onReplace(text);
        setPreview(null);
        setOpen(false);
      } else {
        setPreview(text);
        setOpen(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI write failed');
    } finally {
      setLoading(false);
    }
  }

  function replaceWithPreview() {
    if (!preview) return;
    setUndoText(currentText);
    onReplace(preview);
    setPreview(null);
    setOpen(false);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div className="inline-flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={disabled || loading}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-pink-600 transition-colors hover:bg-pink-50 hover:text-pink-700 disabled:opacity-60 dark:text-pink-400 dark:hover:bg-pink-950/40"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon
              name={loading ? 'progress_activity' : 'auto_awesome'}
              className={`!text-[14px] ${loading ? 'animate-spin' : ''}`}
            />
            {loading ? 'Writing…' : 'Write with AI'}
          </button>
          {undoText != null && (
            <button
              type="button"
              className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              onClick={() => {
                onReplace(undoText);
                setUndoText(null);
              }}
            >
              Undo
            </button>
          )}
          {error && <span className="text-[11px] text-red-600">{error}</span>}
        </div>
        {beside}
      </div>

      {open && (
        <div className="rounded-lg border border-pink-100 bg-pink-50/50 p-2.5 dark:border-pink-900/40 dark:bg-pink-950/20">
          {!preview && !loading && (
            <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
              Pick what you want AI to do:
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={loading || disabled}
                className="rounded bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-pink-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-pink-950/40"
                onClick={() => void run(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>

          {preview && (
            <div className="mt-2 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                AI suggestion
              </p>
              <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{preview}</p>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="secondary" className="!py-1 text-xs" onClick={replaceWithPreview}>
                  Replace text
                </Button>
                <Button
                  variant="ghost"
                  className="!py-1 text-xs"
                  disabled={loading}
                  onClick={() => void run('another')}
                >
                  Try again
                </Button>
                <Button
                  variant="ghost"
                  className="!py-1 text-xs"
                  onClick={() => {
                    setPreview(null);
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
