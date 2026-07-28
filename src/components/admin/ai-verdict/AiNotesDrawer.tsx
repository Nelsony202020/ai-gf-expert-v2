import { useEffect, useState } from 'react';
import { Button, ErrorNote, Icon, Spinner } from '../ui';
import { useToast } from '../Toast';
import type { AiVerdictNotesDto } from '../../../lib/ai-verdict/notesSchema';
import { FIELD_LABELS, normalizeListField, normalizeScalarField } from '../../../lib/ai-verdict/notesSchema';
import type { KeyFinding } from '../../../lib/ai-verdict/suggestionSchema';
import { DRAWER_UNMOUNT_MS } from '../../../lib/drawer/animate';
import {
  applyListInsert,
  applyTextInsert,
  confirmInsertConflict,
  copyToClipboard,
} from './insertHelpers';
import '../testing/testing-ui.css';

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function FindingRow({ finding, onCopy }: { finding: KeyFinding; onCopy: () => void }) {
  return (
    <li className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pink-400" aria-hidden="true" />
      <span className="min-w-0 flex-1">{finding.text}</span>
      <button
        type="button"
        className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        title="Copy finding"
        aria-label="Copy finding"
        onClick={onCopy}
      >
        <Icon name="content_copy" className="!text-[16px]" />
      </button>
    </li>
  );
}

function SuggestionBlock({
  label,
  text,
  onInsert,
  onCopy,
}: {
  label: string;
  text: string;
  onInsert: () => void;
  onCopy: () => void;
}) {
  if (!text.trim()) return null;
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{text}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="secondary" className="!py-1 text-xs" onClick={onInsert}>
          Insert
        </Button>
        <Button variant="ghost" className="!py-1 text-xs" onClick={onCopy}>
          Copy
        </Button>
      </div>
    </div>
  );
}

function SuggestionListBlock({
  label,
  items,
  onInsert,
  onCopy,
  onCopyItem,
}: {
  label: string;
  items: string[];
  onInsert: () => void;
  onCopy: () => void;
  onCopyItem: (item: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="min-w-0 flex-1">• {item}</span>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Copy item"
              aria-label={`Copy ${label} item`}
              onClick={() => onCopyItem(item)}
            >
              <Icon name="content_copy" className="!text-[14px]" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="secondary" className="!py-1 text-xs" onClick={onInsert}>
          Insert all
        </Button>
        <Button variant="ghost" className="!py-1 text-xs" onClick={onCopy}>
          Copy all
        </Button>
      </div>
    </div>
  );
}

export function AiNotesDrawer({
  open,
  sectionLabel,
  productName,
  testRunName,
  notes,
  loading,
  generating,
  error,
  onClose,
  onGenerate,
  onRegenerate,
  getFieldValue,
  onInsertField,
  onInsertListField,
}: {
  open: boolean;
  sectionLabel: string;
  productName: string;
  testRunName?: string;
  notes: AiVerdictNotesDto | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  onClose: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  getFieldValue: (fieldKey: string) => string | string[];
  onInsertField: (fieldKey: string, value: string) => void;
  onInsertListField: (fieldKey: string, items: string[]) => void;
}) {
  const toast = useToast();
  const [visible, setVisible] = useState(false);
  const [animOpen, setAnimOpen] = useState(false);
  const [regenConfirm, setRegenConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      const t = requestAnimationFrame(() => setAnimOpen(true));
      return () => cancelAnimationFrame(t);
    }
    setAnimOpen(false);
    const t = window.setTimeout(() => setVisible(false), DRAWER_UNMOUNT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function handleClose() {
    setAnimOpen(false);
    setRegenConfirm(false);
    window.setTimeout(onClose, DRAWER_UNMOUNT_MS);
  }

  async function handleCopy(text: string, label?: string) {
    const ok = await copyToClipboard(text);
    if (ok) toast.success(label ? `${label} copied` : 'Copied');
    else toast.error('Could not copy to clipboard');
  }

  function insertText(fieldKey: string, suggestion: string) {
    const label = FIELD_LABELS[fieldKey] ?? fieldKey;
    const existing = String(getFieldValue(fieldKey) ?? '');
    if (existing.trim()) {
      const choice = confirmInsertConflict(label);
      const next = applyTextInsert(existing, suggestion, choice);
      if (next == null) return;
      onInsertField(fieldKey, next);
    } else {
      onInsertField(fieldKey, suggestion.trim());
    }
    toast.success(`Inserted into ${label}`);
  }

  function insertList(fieldKey: string, items: string[]) {
    const label = FIELD_LABELS[fieldKey] ?? fieldKey;
    const existing = getFieldValue(fieldKey);
    const current = Array.isArray(existing) ? existing : [];
    if (current.length > 0) {
      const choice = confirmInsertConflict(label);
      const next = applyListInsert(current, items, choice);
      if (next == null) return;
      onInsertListField(fieldKey, next);
    } else {
      onInsertListField(fieldKey, items);
    }
    toast.success(`Inserted into ${label}`);
  }

  if (!visible) return null;

  const suggestions = notes?.fieldSuggestions ?? {};
  const scalarKeys = Object.keys(suggestions).filter(
    (k) => !Array.isArray(suggestions[k]) && k !== 'expertOutline',
  );
  const listKeys = ['pros', 'cons', 'bestFor', 'notIdealFor', 'expertOutline'];

  return (
    <>
      <button
        type="button"
        aria-label="Close AI notes"
        className={`testing-proof-backdrop fixed inset-0 z-[60] bg-slate-900/30 transition-opacity duration-200 ${
          animOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <aside
        className={`testing-proof-drawer fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900 ${
          animOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-labelledby="ai-notes-drawer-title"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--testing-accent-muted)]">
              AI notes & suggestions
            </p>
            <h2 id="ai-notes-drawer-title" className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {sectionLabel}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {productName}
              {testRunName ? ` · ${testRunName}` : ''}
            </p>
            {notes && (
              <p className="mt-0.5 text-[11px] text-slate-400">
                Generated {formatRelativeTime(notes.updatedAt)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <Icon name="close" className="!text-[20px]" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          {(loading || generating) && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Spinner />
              {generating ? 'Generating from test results…' : 'Loading saved notes…'}
            </div>
          )}

          {error && <ErrorNote message={error} />}

          {notes?.stale && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-medium">Test results changed after these notes were generated.</p>
              <button
                type="button"
                className="mt-1 font-semibold text-amber-800 underline dark:text-amber-300"
                onClick={() => setRegenConfirm(true)}
              >
                Regenerate notes
              </button>
            </div>
          )}

          {!loading && !generating && !notes && !error && (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">No notes generated yet.</p>
              <Button className="mt-4" onClick={onGenerate}>
                <Icon name="auto_awesome" className="!text-[18px]" />
                Generate from test results
              </Button>
            </div>
          )}

          {notes && (
            <>
              <section>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Key findings
                  </h3>
                  {notes.keyFindings.length > 0 && (
                    <button
                      type="button"
                      className="text-[11px] font-medium text-pink-600 hover:underline dark:text-pink-400"
                      onClick={() =>
                        void handleCopy(notes.keyFindings.map((f) => `• ${f.text}`).join('\n'), 'Findings')
                      }
                    >
                      Copy all
                    </button>
                  )}
                </div>
                {notes.keyFindings.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Not enough completed testing data to generate reliable findings.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {notes.keyFindings.map((f, i) => (
                      <FindingRow
                        key={i}
                        finding={f}
                        onCopy={() => void handleCopy(f.text, 'Finding')}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Writing suggestions
                </h3>
                {scalarKeys.map((key) => {
                  const text = normalizeScalarField(suggestions[key]);
                  return (
                  <SuggestionBlock
                    key={key}
                    label={FIELD_LABELS[key] ?? key}
                    text={text}
                    onInsert={() => insertText(key, text)}
                    onCopy={() => void handleCopy(text, FIELD_LABELS[key])}
                  />
                  );
                })}
                {listKeys.map((key) => {
                  const items = normalizeListField(suggestions[key]);
                  if (items.length === 0) return null;
                  return (
                    <SuggestionListBlock
                      key={key}
                      label={FIELD_LABELS[key] ?? key}
                      items={items}
                      onInsert={() => insertList(key, items)}
                      onCopy={() => void handleCopy(items.map((x) => `• ${x}`).join('\n'), FIELD_LABELS[key])}
                      onCopyItem={(item) => void handleCopy(item)}
                    />
                  );
                })}
                {scalarKeys.length === 0 &&
                  listKeys.every((k) => normalizeListField(suggestions[k]).length === 0) && (
                    <p className="text-sm text-slate-500">No writing suggestions in this section yet.</p>
                  )}
              </section>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          {regenConfirm ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                This will replace the saved AI notes and suggestions for this section. Existing verdict
                content will not be changed.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setRegenConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={generating}
                  onClick={() => {
                    setRegenConfirm(false);
                    onRegenerate();
                  }}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {notes && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={generating}
                  onClick={() => setRegenConfirm(true)}
                >
                  Regenerate
                </Button>
              )}
              <Button variant="ghost" className="flex-1" onClick={handleClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
