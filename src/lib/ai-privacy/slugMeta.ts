import type { AiPrivacySlug, PrivacyAnswerProposal, PrivacyStructuredOutput } from './types';

export const AI_PRIVACY_SLUG_LABELS: Record<AiPrivacySlug, string> = {
  'human-review': 'Human review of chats',
  'data-sharing': 'Data sharing with third parties',
  advertising: 'Advertising use of data',
  retention: 'Data retention period',
  'policy-clarity': 'Policy clarity',
  training: 'Data used for AI training',
  'training-opt-out': 'Training opt-out',
  'delete-account': 'Delete account (policy text)',
  'delete-personal-data': 'Delete personal data (policy text)',
  refunds: 'Refunds',
};

/** Testing session id where each AI slug’s answer row lives. */
export const AI_PRIVACY_SLUG_SESSION: Record<AiPrivacySlug, string> = {
  'human-review': 'policy-review',
  'data-sharing': 'policy-review',
  advertising: 'policy-review',
  retention: 'policy-review',
  'policy-clarity': 'policy-review',
  training: 'data-controls',
  'training-opt-out': 'data-controls',
  'delete-account': 'data-controls',
  'delete-personal-data': 'data-controls',
  refunds: 'pricing-billing',
};

export type AiPrivacyAnswerBreakdown = {
  slug: AiPrivacySlug;
  label: string;
  sessionId: string;
  status: PrivacyAnswerProposal['status'];
  confidence: PrivacyAnswerProposal['confidence'];
  answerPreview: string | null;
  hasEvidence: boolean;
};

function previewRaw(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.status === 'string') {
    const s = rec.status;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  if (typeof rec.value === 'number') {
    const unit = (rec.detail as { unit?: string; rubric?: string } | undefined)?.unit;
    const rubric = (rec.detail as { rubric?: string } | undefined)?.rubric;
    if (unit) return `${rec.value} ${unit}`;
    if (rubric) return rubric;
    return String(rec.value);
  }
  return null;
}

export function statusLabel(status: PrivacyAnswerProposal['status']): string {
  switch (status) {
    case 'filled':
      return 'Answer proposed';
    case 'needs_review':
      return 'Needs review';
    case 'not_found':
      return 'Not found in policy';
    case 'conflicting':
      return 'Conflicting sources';
    case 'not_applicable':
      return 'Not applicable';
    default:
      return status;
  }
}

export function buildAnswerBreakdown(output: PrivacyStructuredOutput): AiPrivacyAnswerBreakdown[] {
  return output.answers.map((a) => ({
    slug: a.slug,
    label: AI_PRIVACY_SLUG_LABELS[a.slug] ?? a.slug,
    sessionId: AI_PRIVACY_SLUG_SESSION[a.slug] ?? 'policy-review',
    status: a.status,
    confidence: a.confidence,
    answerPreview: a.status === 'filled' || a.status === 'needs_review' ? previewRaw(a.raw) : null,
    hasEvidence: a.evidence.length > 0,
  }));
}

export function groupBreakdownByStatus(breakdown: AiPrivacyAnswerBreakdown[]) {
  return {
    filled: breakdown.filter((a) => a.status === 'filled'),
    needsReview: breakdown.filter((a) => a.status === 'needs_review' || a.status === 'conflicting'),
    notFound: breakdown.filter((a) => a.status === 'not_found' || a.status === 'not_applicable'),
  };
}
