// Proof drawer for platform extras: AI cam + named bonus features (tagged attachments).

import type { EntityRow } from '../api';
import { EvidenceAttachments } from './EvidenceAttachments';
import { parseBonusFeaturesDraft } from './BonusExtrasField';
import type { RawValue } from './EvidenceInput';
import { bonusExtraCaption, LIVE_CAM_PROOF_TAG } from './proofTags';

export function BonusProofPanel({
  def,
  categorySlug,
  productId,
  listResultId,
  liveCamDef,
  liveCamResultId,
  listRaw,
  liveRaw,
  ensureListResultId,
  ensureLiveCamResultId,
  onUploaded,
  disabled,
}: {
  def: EntityRow;
  categorySlug?: string;
  productId?: string;
  listResultId: string | null;
  liveCamDef?: EntityRow;
  liveCamResultId?: string | null;
  listRaw?: RawValue;
  liveRaw?: RawValue;
  ensureListResultId: () => Promise<string>;
  ensureLiveCamResultId: () => Promise<string>;
  onUploaded?: () => void;
  disabled?: boolean;
}) {
  const parsed = parseBonusFeaturesDraft(listRaw, liveRaw);
  const namedExtras = parsed.extras.filter((r) => r.name.trim());

  return (
    <div className="space-y-4">
      {liveCamDef && parsed.aiCamModels && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200">AI Cam Models</h3>
          <EvidenceAttachments
            def={liveCamDef}
            resultId={liveCamResultId ?? null}
            productId={productId}
            ensureResultId={ensureLiveCamResultId}
            disabled={disabled}
            captionTag={LIVE_CAM_PROOF_TAG}
            onUploaded={onUploaded}
          />
        </section>
      )}

      {namedExtras.map((row, idx) => (
        <section key={row.id} className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {row.name.trim()}
            {row.note.trim() && (
              <span className="ml-1 font-normal text-slate-500">— {row.note.trim()}</span>
            )}
          </h3>
          <EvidenceAttachments
            def={def}
            resultId={listResultId}
            productId={productId}
            ensureResultId={ensureListResultId}
            disabled={disabled}
            captionTag={bonusExtraCaption(row.id)}
            onUploaded={onUploaded}
          />
        </section>
      ))}

      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {namedExtras.length > 0 ? 'General bonus features proof' : 'Bonus features proof'}
        </h3>
        <EvidenceAttachments
          def={def}
          resultId={listResultId}
          productId={productId}
          ensureResultId={ensureListResultId}
          disabled={disabled}
          onUploaded={onUploaded}
        />
      </section>
    </div>
  );
}
