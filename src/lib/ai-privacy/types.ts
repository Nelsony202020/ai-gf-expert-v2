// Shared types for AI-assisted privacy policy analysis.

import { z } from 'zod';

export const AI_PRIVACY_SLUGS = [
  'human-review',
  'data-sharing',
  'advertising',
  'retention',
  'policy-clarity',
  'training',
  'training-opt-out',
  /** Policy-text inference — tester should still verify in the app. */
  'delete-account',
  'delete-personal-data',
  /** Pricing → Billing; filled when a Refund Policy document is uploaded. */
  'refunds',
] as const;

export type AiPrivacySlug = (typeof AI_PRIVACY_SLUGS)[number];

export const DOCUMENT_LABELS = [
  'Privacy Policy',
  'Terms of Service',
  'Refund Policy',
  'Content Moderation Policy',
  'Cookie Policy',
  'Data Processing Policy',
  'Community Guidelines',
  'Other',
] as const;

export type DocumentLabel = (typeof DOCUMENT_LABELS)[number];

export const privacyDocumentSchema = z.object({
  id: z.string().min(1),
  label: z.enum(DOCUMENT_LABELS),
  sourceUrl: z.union([z.string().url().max(500), z.literal('')]).optional(),
  pastedText: z.string().max(500_000).optional(),
  scrapedText: z.string().max(500_000).optional(),
  scrapeStatus: z.enum(['pending', 'ok', 'failed', 'skipped']).optional(),
  scrapeError: z.string().max(500).optional(),
});

export type PrivacyDocument = z.infer<typeof privacyDocumentSchema>;

export const privacyEvidenceItemSchema = z.object({
  sourceDocumentId: z.string().min(1),
  sourceLabel: z.string().min(1).max(120),
  sourceUrl: z.string().max(500).optional(),
  section: z.string().max(200).default('Section not identified'),
  excerpt: z.string().max(400),
  findText: z.string().max(120),
  characterStart: z.number().int().nonnegative().optional(),
  characterEnd: z.number().int().nonnegative().optional(),
});

export type PrivacyEvidenceItem = z.infer<typeof privacyEvidenceItemSchema>;

export const privacyAnswerProposalSchema = z.object({
  slug: z.enum(AI_PRIVACY_SLUGS),
  status: z.enum(['filled', 'needs_review', 'not_found', 'conflicting', 'not_applicable']),
  confidence: z.enum(['high', 'medium', 'low']),
  /** Validated/normalized after parse — keep loose for model output. */
  raw: z.unknown().optional(),
  rationale: z.string().max(500).optional(),
  evidence: z.array(privacyEvidenceItemSchema).default([]),
});

export type PrivacyAnswerProposal = z.infer<typeof privacyAnswerProposalSchema>;

export const privacyStructuredOutputSchema = z
  .object({
    answers: z.array(privacyAnswerProposalSchema).min(1).max(AI_PRIVACY_SLUGS.length),
  })
  .passthrough();

export type PrivacyStructuredOutput = z.infer<typeof privacyStructuredOutputSchema>;

export type AiPrivacyReviewStatus = 'pending_review' | 'accepted' | 'rejected';

/** Stored on evidenceResults.calculationDetails.aiPrivacy */
export interface AiPrivacyCalculationDetails {
  analysisId: string;
  slug: AiPrivacySlug;
  reviewStatus: AiPrivacyReviewStatus;
  fillStatus: PrivacyAnswerProposal['status'];
  confidence: PrivacyAnswerProposal['confidence'];
  proposalRaw?: unknown;
  rationale?: string;
  /** @deprecated Legacy copy stored before rationale-only AI findings. Read for display only. */
  internalNote?: string;
  /** Migrated legacy AI text when moved out of internalNotes. */
  legacyRationale?: string;
  evidence: PrivacyEvidenceItem[];
  rejectedAt?: number;
  rejectedBy?: string;
  acceptedAt?: number;
  acceptedBy?: string;
}

export function isAiPrivacySlug(slug: string): slug is AiPrivacySlug {
  return (AI_PRIVACY_SLUGS as readonly string[]).includes(slug);
}
