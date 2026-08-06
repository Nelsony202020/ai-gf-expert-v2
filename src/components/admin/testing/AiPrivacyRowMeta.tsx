// Per-question AI status, confidence, and source summary shown inline on privacy rows.

import {
  aiPrivacyConfidenceLabel,
  aiPrivacySourceSummary,
  aiPrivacyStatusLabel,
  aiPrivacyStatusTone,
  getAiPrivacyDisplayStatus,
  readAiPrivacyDetails,
  resolveAiPrivacyRationale,
} from '../../../lib/ai-privacy/clientHelpers';
import { isAiPrivacySlug } from '../../../lib/ai-privacy/types';
import type { EntityRow } from '../api';

export function AiPrivacyRowMeta({
  def,
  result,
  hasAnswer,
  expanded,
  onToggleProof,
  onEnterManually,
}: {
  def: EntityRow;
  result: EntityRow | null;
  hasAnswer: boolean;
  expanded: boolean;
  onToggleProof: () => void;
  onEnterManually?: () => void;
}) {
  const slug = String(def.slug ?? '');
  if (!isAiPrivacySlug(slug)) return null;

  const ai = readAiPrivacyDetails(result);
  if (!ai) return null;

  const displayStatus = getAiPrivacyDisplayStatus(ai, hasAnswer);
  if (!displayStatus) return null;

  const rationale = resolveAiPrivacyRationale(ai, result);
  const sourceSummary = aiPrivacySourceSummary(ai);
  const tone = aiPrivacyStatusTone(displayStatus);
  const proofLabel =
    displayStatus === 'not_found'
      ? ai.evidence.length > 0
        ? 'View source evidence'
        : 'Enter manually'
      : displayStatus === 'needs_review' || displayStatus === 'conflicting'
        ? 'Review evidence'
        : 'View proof';

  return (
    <div className="mt-1.5 space-y-1">
      <p className={`text-[11px] font-medium ${tone}`}>
        {aiPrivacyStatusLabel(displayStatus)} · {aiPrivacyConfidenceLabel(ai.confidence)}
      </p>

      {displayStatus === 'not_found' && !rationale && (
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          No clear policy language was found for this question.
        </p>
      )}

      {rationale && (
        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{rationale}</p>
      )}

      {sourceSummary && displayStatus !== 'not_found' && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{sourceSummary}</p>
      )}

      <button
        type="button"
        className="text-[11px] font-medium text-pink-600 underline decoration-pink-300/60 underline-offset-2 hover:text-pink-700 dark:text-pink-400"
        aria-expanded={expanded}
        onClick={(e) => {
          e.stopPropagation();
          if (displayStatus === 'not_found' && ai.evidence.length === 0 && onEnterManually) {
            onEnterManually();
            return;
          }
          onToggleProof();
        }}
      >
        {expanded ? 'Hide proof' : proofLabel}
      </button>
    </div>
  );
}
