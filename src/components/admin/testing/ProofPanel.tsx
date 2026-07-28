// Proof-only panel: instructions + attachments + optional reference links. Uploads save immediately.

import type { EntityRow } from '../api';
import { EvidenceAttachments } from './EvidenceAttachments';
import { EvidenceLinks } from './EvidenceLinks';
import { testerHelpTooltip, testerInstructions } from './presentation';
import { parseProofLinks } from './proofLinks';

export function ProofPanel({
  def,
  categorySlug,
  productId,
  ensureResultId,
  resultId,
  disabled,
  showLinks,
  proofLinks,
  onUploaded,
}: {
  def: EntityRow;
  categorySlug?: string;
  productId?: string;
  ensureResultId: () => Promise<string>;
  resultId: string | null;
  disabled?: boolean;
  showLinks?: boolean;
  proofLinks?: unknown;
  onUploaded?: () => void;
}) {
  const steps = testerInstructions(def);
  const hint = testerHelpTooltip(def, categorySlug);

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
