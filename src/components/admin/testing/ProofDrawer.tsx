// Right-side drawer for proof uploads — keeps the main session view compact.

import { useEffect, useState } from 'react';
import { dataApi, type EntityRow } from '../api';
import { DrawerCloseButton } from '../ui';
import { DRAWER_UNMOUNT_MS } from '../../../lib/drawer/animate';
import { BonusProofPanel } from './BonusProofPanel';
import type { RawValue } from './EvidenceInput';
import { QuestionLabel } from './QuestionLabel';
import { ProofPanel } from './ProofPanel';
import { allowsProofLinks } from './proofLinks';

export function ProofDrawer({
  def,
  categorySlug,
  sessionId,
  runId,
  productId,
  existing,
  liveCamDef,
  liveCamExisting,
  listRaw,
  liveRaw,
  onClose,
  onSaved,
}: {
  def: EntityRow;
  categorySlug?: string;
  sessionId?: string;
  runId: string;
  productId?: string;
  existing: EntityRow | null;
  liveCamDef?: EntityRow;
  liveCamExisting?: EntityRow | null;
  listRaw?: RawValue;
  liveRaw?: RawValue;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [resultId, setResultId] = useState<string | null>(existing?.id ?? null);
  const [liveCamResultId, setLiveCamResultId] = useState<string | null>(
    liveCamExisting?.id ?? null,
  );

  useEffect(() => {
    if (existing?.id) setResultId(existing.id);
  }, [existing?.id]);

  useEffect(() => {
    if (liveCamExisting?.id) setLiveCamResultId(liveCamExisting.id);
  }, [liveCamExisting?.id]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleClose() {
    setOpen(false);
    window.setTimeout(onClose, DRAWER_UNMOUNT_MS);
  }

  async function ensureResultId(): Promise<string> {
    if (resultId) return resultId;
    const created = await dataApi.create(
      'evidenceResults',
      { testDate: Date.now() },
      { testRun: runId, evidenceDefinition: def.id, product: productId ?? null },
    );
    setResultId(created.id);
    onSaved();
    return created.id;
  }

  async function ensureLiveCamResultId(): Promise<string> {
    if (!liveCamDef) return ensureResultId();
    if (liveCamResultId) return liveCamResultId;
    const created = await dataApi.create(
      'evidenceResults',
      { testDate: Date.now() },
      { testRun: runId, evidenceDefinition: liveCamDef.id, product: productId ?? null },
    );
    setLiveCamResultId(created.id);
    onSaved();
    return created.id;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close proof panel"
        className={`testing-proof-backdrop fixed inset-0 z-[60] bg-slate-900/30 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <aside
        className={`testing-proof-drawer fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col border-l border-slate-200 shadow-2xl transition-transform duration-300 ease-out dark:border-slate-700 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-labelledby="proof-drawer-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--testing-accent-muted)]">
              Proof upload
            </p>
            <h2 id="proof-drawer-title" className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <QuestionLabel def={def} categorySlug={categorySlug} />
            </h2>
          </div>
          <DrawerCloseButton onClick={handleClose} ariaLabel="Close proof panel" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {String(def.slug) === 'platform-extras-list' && liveCamDef ? (
            <BonusProofPanel
              def={def}
              categorySlug={categorySlug}
              productId={productId}
              listResultId={resultId}
              liveCamDef={liveCamDef}
              liveCamResultId={liveCamResultId}
              listRaw={listRaw}
              liveRaw={liveRaw}
              ensureListResultId={ensureResultId}
              ensureLiveCamResultId={ensureLiveCamResultId}
              onUploaded={() => void onSaved()}
            />
          ) : (
            <ProofPanel
              def={def}
              categorySlug={categorySlug}
              productId={productId}
              resultId={resultId}
              ensureResultId={ensureResultId}
              showLinks={allowsProofLinks(sessionId)}
              proofLinks={existing?.proofLinks}
              onUploaded={() => void onSaved()}
            />
          )}
        </div>
      </aside>
    </>
  );
}
