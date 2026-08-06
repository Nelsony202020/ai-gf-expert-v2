// Inline AI policy evidence with accept / reject / change-answer actions.

import { useState } from 'react';
import { api, ApiError } from '../api';
import { Button, ErrorNote } from '../ui';
import {
  aiPrivacyConfidenceLabel,
  aiPrivacyStatusLabel,
  getAiPrivacyDisplayStatus,
  readAiPrivacyDetails,
  resolveAiPrivacyRationale,
} from '../../../lib/ai-privacy/clientHelpers';
import { isAiPrivacySlug } from '../../../lib/ai-privacy/types';
import type { EntityRow } from '../api';

export function AiPrivacyEvidencePanel({
  def,
  result,
  productId,
  runId,
  hasAnswer,
  onChanged,
  onChangeAnswer,
  rejected,
}: {
  def: EntityRow;
  result: EntityRow | null;
  productId?: string;
  runId: string;
  hasAnswer?: boolean;
  onChanged?: () => void | Promise<void>;
  onChangeAnswer?: () => void;
  rejected?: boolean;
}) {
  const slug = String(def.slug ?? '');
  const ai = readAiPrivacyDetails(result);
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isAiPrivacySlug(slug) || !ai) return null;

  const displayStatus = getAiPrivacyDisplayStatus(ai, Boolean(hasAnswer));
  const notAccepted = rejected || ai.reviewStatus === 'rejected';
  const rationale = resolveAiPrivacyRationale(ai, result);

  async function review(action: 'accept' | 'reject') {
    if (!productId) return;
    setBusy(action);
    setError(null);
    try {
      await api.post('/api/admin/ai-privacy/review', {
        productId,
        testRunId: runId,
        slug,
        action,
      });
      await onChanged?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update review status');
    } finally {
      setBusy(null);
    }
  }

  async function copyPhrase(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      /* ignore */
    }
  }

  const showAccept = ai.reviewStatus !== 'accepted' && ai.fillStatus !== 'not_found' && ai.fillStatus !== 'not_applicable';
  const statusHeading = displayStatus ? aiPrivacyStatusLabel(displayStatus) : 'AI evidence';

  return (
    <div
      className={`space-y-3 rounded-lg border p-3 ${
        notAccepted
          ? 'border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/30'
      }`}
      role="region"
      aria-label={`Evidence for ${String(def.name ?? slug)}`}
    >
      <div>
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">{statusHeading}</h4>
        {displayStatus && (
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {aiPrivacyConfidenceLabel(ai.confidence)}
            {notAccepted ? ' · Not accepted' : ai.reviewStatus === 'accepted' ? ' · Accepted' : ''}
          </p>
        )}
      </div>

      {ai.fillStatus === 'not_found' || ai.fillStatus === 'not_applicable' ? (
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          No clear statement was found for this question in the uploaded policies.
        </p>
      ) : ai.fillStatus === 'needs_review' ? (
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          The policy partially covers this question, but the wording is unclear.
        </p>
      ) : ai.fillStatus === 'conflicting' ? (
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          The uploaded documents contain different statements for this question. Choose the final answer
          from the dropdown above.
        </p>
      ) : null}

      {rationale && (
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{rationale}</p>
      )}

      {ai.evidence.length === 0 && ai.fillStatus !== 'not_found' && ai.fillStatus !== 'not_applicable' && (
        <p className="text-xs text-slate-500">No direct clause was extracted for this answer.</p>
      )}

      {ai.evidence.map((ev, i) => (
        <article
          key={`${ev.sourceDocumentId}-${i}`}
          className="space-y-2 rounded-md border border-slate-200/90 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/50"
        >
          <h5 className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Proof {i + 1}</h5>

          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Source</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">{ev.sourceLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Section</p>
              <p className="text-slate-700 dark:text-slate-200">{ev.section || 'Section not identified'}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Exact excerpt</p>
            <blockquote className="mt-1 border-l-2 border-slate-300 pl-2 text-xs leading-relaxed text-slate-700 dark:border-slate-600 dark:text-slate-200">
              “{ev.excerpt}”
            </blockquote>
          </div>

          {ev.findText && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Control+F</p>
              <p className="mt-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-200">{ev.findText}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500">
              Confidence: {aiPrivacyConfidenceLabel(ai.confidence).replace(' confidence', '')}
            </span>
            {ev.sourceUrl && (
              <a
                href={ev.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Open source
              </a>
            )}
            {ev.findText && (
              <button
                type="button"
                className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => void copyPhrase(ev.findText, `find-${i}`)}
              >
                {copiedKey === `find-${i}` ? 'Copied' : 'Copy phrase'}
              </button>
            )}
          </div>
        </article>
      ))}

      {error && <ErrorNote message={error} />}

      <div className="flex flex-wrap gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700">
        {showAccept && (
          <Button
            type="button"
            variant="secondary"
            className="!py-1 text-xs"
            disabled={Boolean(busy) || !productId}
            onClick={() => void review('accept')}
          >
            {busy === 'accept' ? 'Saving…' : 'Accept AI answer'}
          </Button>
        )}
        {ai.reviewStatus !== 'rejected' && (
          <Button
            type="button"
            variant="ghost"
            className="!py-1 text-xs"
            disabled={Boolean(busy) || !productId}
            onClick={() => void review('reject')}
          >
            {busy === 'reject' ? 'Saving…' : 'Reject AI answer'}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="!py-1 text-xs"
          onClick={() => onChangeAnswer?.()}
        >
          Change answer
        </Button>
      </div>

      <p className="text-[11px] text-slate-500">
        Policy excerpts are read-only. Upload a screenshot separately if you need manual proof.
      </p>
    </div>
  );
}
