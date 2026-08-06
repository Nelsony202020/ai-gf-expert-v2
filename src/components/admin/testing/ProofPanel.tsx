// Proof-only panel: instructions + attachments + optional reference links. Uploads save immediately.

import { useEffect, useRef } from 'react';
import type { EntityRow } from '../api';
import { EvidenceAttachments } from './EvidenceAttachments';
import { EvidenceLinks, type EvidenceLinksHandle } from './EvidenceLinks';
import { AiPrivacyEvidencePanel } from './AiPrivacyEvidencePanel';
import { testerHelpTooltip, testerInstructions } from './presentation';
import { parseProofLinks } from './proofLinks';

export function ProofPanel({
  def,
  categorySlug,
  productId,
  runId,
  ensureResultId,
  resultId,
  result,
  disabled,
  showLinks,
  proofLinks,
  onUploaded,
  onRegisterBeforeClose,
}: {
  def: EntityRow;
  categorySlug?: string;
  productId?: string;
  runId?: string;
  ensureResultId: () => Promise<string>;
  resultId: string | null;
  result?: EntityRow | null;
  disabled?: boolean;
  showLinks?: boolean;
  proofLinks?: unknown;
  onUploaded?: () => void;
  onRegisterBeforeClose?: (handler: () => Promise<void>) => void;
}) {
  const linksRef = useRef<EvidenceLinksHandle>(null);
  const steps = testerInstructions(def);
  const hint = testerHelpTooltip(def, categorySlug);

  useEffect(() => {
    if (!onRegisterBeforeClose) return;
    onRegisterBeforeClose(async () => {
      await linksRef.current?.flushPending();
    });
  }, [onRegisterBeforeClose]);

  return (
    <div className="space-y-4">
      {(hint || steps.length > 0) && (
        <div className="space-y-2 rounded-lg border border-slate-200/80 bg-white/80 p-3 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          {hint && steps.length === 0 && <p className="text-xs">{hint}</p>}
          {steps.length > 0 && (
            <ol className="list-decimal space-y-0.5 pl-4 text-xs">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {runId && (
        <AiPrivacyEvidencePanel
          def={def}
          result={result ?? null}
          productId={productId}
          runId={runId}
          onChanged={onUploaded}
        />
      )}

      <EvidenceAttachments
        def={def}
        resultId={resultId}
        productId={productId}
        ensureResultId={ensureResultId}
        disabled={disabled}
        onUploaded={onUploaded}
      />

      {showLinks && (
        <EvidenceLinks
          ref={linksRef}
          resultId={resultId}
          proofLinks={parseProofLinks(proofLinks)}
          ensureResultId={ensureResultId}
          disabled={disabled}
          onChanged={onUploaded}
        />
      )}
    </div>
  );
}
