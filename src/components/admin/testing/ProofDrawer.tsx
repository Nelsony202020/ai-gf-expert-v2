// Right-side drawer for proof, instructions and reviewer metadata — keeps
// the main session view compact.

import { useEffect } from 'react';
import type { EntityRow } from '../api';
import { Icon } from '../ui';
import { QuestionLabel } from './QuestionLabel';
import { ProofPanel } from './ProofPanel';
import type { RawValue } from './EvidenceInput';

export function ProofDrawer({
  def,
  categorySlug,
  runId,
  productId,
  existing,
  answerRaw,
  onClose,
  onSaved,
}: {
  def: EntityRow;
  categorySlug?: string;
  runId: string;
  productId?: string;
  existing: EntityRow | null;
  answerRaw?: RawValue;
  onClose: () => void;
  onSaved: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close proof panel"
        className="fixed inset-0 z-[60] bg-slate-900/30"
        onClick={onClose}
      />
      <aside
        className="testing-proof-drawer fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-slate-200 shadow-2xl dark:border-slate-700"
        role="dialog"
        aria-labelledby="proof-drawer-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--testing-accent-muted)]">
              Proof &amp; notes
            </p>
            <h2 id="proof-drawer-title" className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <QuestionLabel def={def} categorySlug={categorySlug} />
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-200/80 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <Icon name="close" className="!text-[20px]" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <ProofPanel
            key={`${def.id}:${existing?.updatedAt ?? 'new'}`}
            def={def}
            categorySlug={categorySlug}
            runId={runId}
            productId={productId}
            existing={existing}
            answerRaw={answerRaw}
            onSaved={() => {
              onSaved();
              onClose();
            }}
          />
        </div>
      </aside>
    </>
  );
}
