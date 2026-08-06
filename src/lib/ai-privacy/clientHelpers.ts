// Client-safe helpers for reading AI privacy details from evidence results.

import {
  AI_PRIVACY_SLUGS,
  isAiPrivacySlug,
  type AiPrivacyCalculationDetails,
  type AiPrivacySlug,
} from './types';

export function readAiPrivacyDetails(result: unknown): AiPrivacyCalculationDetails | null {
  if (!result || typeof result !== 'object') return null;
  const details = (result as { calculationDetails?: unknown }).calculationDetails;
  if (!details || typeof details !== 'object') return null;
  const ai = (details as { aiPrivacy?: unknown }).aiPrivacy;
  if (!ai || typeof ai !== 'object') return null;
  const row = ai as AiPrivacyCalculationDetails;
  if (!row.slug || !isAiPrivacySlug(row.slug)) return null;
  return row;
}

/** True when internalNotes likely holds a legacy AI-generated note tied to this row. */
export function isLikelyLegacyAiInternalNote(
  result: { internalNotes?: unknown } | null | undefined,
  ai: AiPrivacyCalculationDetails,
): boolean {
  const notes = String(result?.internalNotes ?? '').trim();
  if (!notes) return false;
  const legacy = ai.internalNote?.trim() || ai.legacyRationale?.trim();
  if (legacy && notes === legacy) return true;
  if (ai.internalNote?.trim() && notes === ai.internalNote.trim()) return true;
  return false;
}

/** Resolve display rationale from aiPrivacy only — never writes to internalNotes. */
export function resolveAiPrivacyRationale(
  ai: AiPrivacyCalculationDetails,
  result?: { internalNotes?: unknown } | null,
): string | null {
  if (ai.rationale?.trim()) return ai.rationale.trim();
  if (ai.legacyRationale?.trim()) return ai.legacyRationale.trim();
  if (ai.internalNote?.trim()) return ai.internalNote.trim();
  if (result && isLikelyLegacyAiInternalNote(result, ai)) {
    const notes = String(result.internalNotes ?? '').trim();
    if (notes) return notes;
  }
  if (ai.fillStatus === 'not_found' || ai.fillStatus === 'not_applicable') {
    return 'No clear policy language was found for this question in the uploaded documents.';
  }
  if (ai.evidence.length > 0) {
    const ev = ai.evidence[0];
    return `Policy states (${ev.sourceLabel}${ev.section ? `, ${ev.section}` : ''}): “${ev.excerpt.slice(0, 180)}${ev.excerpt.length > 180 ? '…' : ''}”`;
  }
  return null;
}

export function isAiFindingIncomplete(ai: AiPrivacyCalculationDetails): boolean {
  if (ai.fillStatus !== 'filled') return false;
  return !resolveAiPrivacyRationale(ai) && ai.evidence.length === 0;
}

export type AiPrivacyDisplayStatus =
  | 'ai_filled'
  | 'needs_review'
  | 'not_found'
  | 'conflicting'
  | 'manually_completed'
  | 'reviewed';

export function getAiPrivacyDisplayStatus(
  ai: AiPrivacyCalculationDetails | null,
  hasAnswer: boolean,
): AiPrivacyDisplayStatus | null {
  if (!ai) return hasAnswer ? 'manually_completed' : null;
  if (ai.reviewStatus === 'accepted') return 'reviewed';
  if (ai.reviewStatus === 'rejected') return 'manually_completed';
  if (ai.fillStatus === 'conflicting') return 'conflicting';
  if (ai.fillStatus === 'needs_review') return 'needs_review';
  if (ai.fillStatus === 'not_found' || ai.fillStatus === 'not_applicable') return 'not_found';
  if (ai.fillStatus === 'filled') {
    if (isAiFindingIncomplete(ai)) return 'needs_review';
    return 'ai_filled';
  }
  return null;
}

export function aiPrivacyStatusLabel(status: AiPrivacyDisplayStatus): string {
  switch (status) {
    case 'ai_filled':
      return 'AI filled';
    case 'needs_review':
      return 'Needs review';
    case 'not_found':
      return 'Not found';
    case 'manually_completed':
      return 'Manually completed';
    case 'conflicting':
      return 'Conflicting policies';
    case 'reviewed':
      return 'Reviewed';
  }
}

export function aiPrivacyConfidenceLabel(confidence: AiPrivacyCalculationDetails['confidence']): string {
  if (confidence === 'high') return 'High confidence';
  if (confidence === 'medium') return 'Medium confidence';
  return 'Low confidence';
}

export function aiPrivacySourceSummary(ai: AiPrivacyCalculationDetails): string | null {
  if (ai.evidence.length === 0) return null;
  const labels = [...new Set(ai.evidence.map((e) => e.sourceLabel).filter(Boolean))];
  const labelPart = labels.length > 0 ? labels.join(', ') : 'Policy document';
  const n = ai.evidence.length;
  return `${labelPart} · ${n} supporting excerpt${n === 1 ? '' : 's'}`;
}

/** Rows the top-panel “Review flagged answers” button should jump to. */
export function isAiPrivacyFlaggedForReview(ai: AiPrivacyCalculationDetails): boolean {
  if (ai.reviewStatus === 'accepted') return false;
  return (
    ai.fillStatus === 'needs_review' ||
    ai.fillStatus === 'not_found' ||
    ai.fillStatus === 'not_applicable' ||
    ai.fillStatus === 'conflicting'
  );
}

export type AiPrivacySessionSummary = {
  filledAutomatically: number;
  needsReview: number;
  notFound: number;
  conflicting: number;
  manuallyCompleted: number;
  reviewed: number;
  withAi: number;
  flaggedCount: number;
};

export function aiPrivacySummaryFromResults(
  results: Array<unknown>,
  slugs: readonly AiPrivacySlug[] = AI_PRIVACY_SLUGS,
): AiPrivacySessionSummary {
  const slugSet = new Set(slugs);
  const summary: AiPrivacySessionSummary = {
    filledAutomatically: 0,
    needsReview: 0,
    notFound: 0,
    conflicting: 0,
    manuallyCompleted: 0,
    reviewed: 0,
    withAi: 0,
    flaggedCount: 0,
  };

  for (const r of results) {
    const slug =
      r && typeof r === 'object' && 'evidenceDefinition' in r
        ? String((r as { evidenceDefinition?: { slug?: string } }).evidenceDefinition?.slug ?? '')
        : '';
    const ai = readAiPrivacyDetails(r);
    if (!ai) continue;
    if (slug && !slugSet.has(slug as AiPrivacySlug) && !slugSet.has(ai.slug)) continue;

    summary.withAi += 1;
    const raw = r && typeof r === 'object' ? (r as { rawValue?: unknown }).rawValue : undefined;
    const hasAnswer = Boolean(raw);

    const display = getAiPrivacyDisplayStatus(ai, hasAnswer);
    if (!display) continue;

    switch (display) {
      case 'ai_filled':
        summary.filledAutomatically += 1;
        break;
      case 'needs_review':
        summary.needsReview += 1;
        break;
      case 'not_found':
        summary.notFound += 1;
        break;
      case 'conflicting':
        summary.conflicting += 1;
        break;
      case 'manually_completed':
        summary.manuallyCompleted += 1;
        break;
      case 'reviewed':
        summary.reviewed += 1;
        break;
    }

    if (isAiPrivacyFlaggedForReview(ai)) summary.flaggedCount += 1;
  }

  return summary;
}

/** @deprecated use AiPrivacySessionSummary fields */
export function aiPrivacyLegacyCounts(summary: AiPrivacySessionSummary) {
  return {
    total: summary.withAi,
    withAi: summary.withAi,
    pending: summary.filledAutomatically + summary.needsReview + summary.notFound + summary.conflicting,
    accepted: summary.reviewed,
    rejected: summary.manuallyCompleted,
    filled: summary.filledAutomatically + summary.reviewed,
    needsReview: summary.needsReview + summary.conflicting,
    notFound: summary.notFound,
  };
}

export function aiPrivacyProofColumnLabel(
  ai: AiPrivacyCalculationDetails | null,
  screenshotCount: number,
): { label: string; action: 'expand' | 'drawer' | 'none' } {
  if (!ai) {
    if (screenshotCount > 0) {
      return {
        label: `${screenshotCount} screenshot${screenshotCount === 1 ? '' : 's'}`,
        action: 'drawer',
      };
    }
    return { label: 'Upload proof', action: 'drawer' };
  }

  const sourceCount = ai.evidence.length;
  if (ai.fillStatus === 'needs_review' && sourceCount === 0) {
    return { label: 'Needs review', action: 'expand' };
  }
  if (ai.fillStatus === 'conflicting') {
    return {
      label: sourceCount > 0 ? `View ${sourceCount} sources` : 'Conflicting policies',
      action: 'expand',
    };
  }
  if (
    (ai.fillStatus === 'not_found' || ai.fillStatus === 'not_applicable') &&
    sourceCount === 0 &&
    screenshotCount === 0
  ) {
    return { label: 'No proof found', action: 'expand' };
  }
  if (sourceCount > 0) {
    return {
      label: `View ${sourceCount} source${sourceCount === 1 ? '' : 's'}`,
      action: 'expand',
    };
  }
  if (screenshotCount > 0) {
    return {
      label: `${screenshotCount} screenshot${screenshotCount === 1 ? '' : 's'}`,
      action: 'drawer',
    };
  }
  return { label: 'View evidence', action: 'expand' };
}

export function aiPrivacyStatusTone(status: AiPrivacyDisplayStatus): string {
  switch (status) {
    case 'reviewed':
    case 'ai_filled':
      return 'text-emerald-700 dark:text-emerald-300';
    case 'needs_review':
      return 'text-amber-700 dark:text-amber-300';
    case 'not_found':
    case 'manually_completed':
      return 'text-slate-600 dark:text-slate-400';
    case 'conflicting':
      return 'text-red-700 dark:text-red-300';
  }
}

export const POLICY_REVIEW_AI_SLUGS: AiPrivacySlug[] = [
  'human-review',
  'data-sharing',
  'advertising',
  'retention',
  'policy-clarity',
];

export const DATA_CONTROLS_AI_SLUGS: AiPrivacySlug[] = [
  'delete-account',
  'delete-personal-data',
  'training',
  'training-opt-out',
];

export const BILLING_AI_SLUGS: AiPrivacySlug[] = ['refunds'];
