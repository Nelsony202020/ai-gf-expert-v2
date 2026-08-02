import type { EvidenceIndex } from '../ratings/evidenceIndex';

export type ExplanationStatus =
  | 'not_generated'
  | 'draft'
  | 'needs_review'
  | 'approved'
  | 'outdated'
  | 'error';

export interface ExplanationGroupRef {
  groupKey: string;
  categorySlug: string;
  subscoreSlug: string;
  groupSlug: string;
  groupName: string;
  categoryName: string;
  subscoreName: string;
}

export interface ExplanationMemberResult {
  slug: string;
  label: string;
  value: string;
  normalizedScore: number | null;
}

export interface ExplanationMethodologyContext {
  whatThisMeasures: string;
  whyItMatters?: string;
  howWeTested?: string;
  limitations?: string;
}

export interface AssembledExplanationContext {
  product: { id: string; name: string; slug: string };
  group: ExplanationGroupRef;
  score: number | null;
  methodology: ExplanationMethodologyContext;
  results: ExplanationMemberResult[];
  reviewerNote?: string;
  methodologyVersion: string | null;
  inputHash: string;
  hasUsableResults: boolean;
}

/** Product test-run data loaded once and reused across evidence groups. */
export interface ExplanationProductBundle {
  product: { id: string; name: string; slug: string };
  testRunId: string;
  methodologyVersion: string | null;
  resultBySlug: Map<string, unknown>;
  resultIndex: EvidenceIndex<unknown>;
}

export interface ExplanationRowDto {
  id?: string;
  groupKey: string;
  categorySlug: string;
  subscoreSlug: string;
  groupSlug: string;
  groupName: string;
  categoryName: string;
  subscoreName: string;
  whatThisMeans?: string;
  explanationStatus: ExplanationStatus;
  inputHash?: string;
  generatedFromMethodologyVersion?: string;
  reviewerNote?: string;
  generationError?: string;
  generatedAt?: number;
  generatedBy?: string;
  approvedAt?: number;
  approvedBy?: string;
  score: number | null;
  resultsChanged: boolean;
  hasUsableResults: boolean;
  methodology: ExplanationMethodologyContext;
  results: ExplanationMemberResult[];
}

/** List sidebar — no methodology/results payload. */
export type ExplanationListRowDto = Omit<
  ExplanationRowDto,
  'methodology' | 'results' | 'reviewerNote' | 'generationError' | 'generatedAt' | 'generatedBy' | 'inputHash' | 'generatedFromMethodologyVersion'
>;

export interface ExplanationApprovePatch {
  groupKey: string;
  whatThisMeans: string;
  explanationStatus: 'approved';
  approvedAt: number;
  approvedBy: string;
  inputHash?: string;
}

export interface ExplanationSummaryDto {
  total: number;
  notGenerated: number;
  draft: number;
  needsReview: number;
  approved: number;
  outdated: number;
  error: number;
}
