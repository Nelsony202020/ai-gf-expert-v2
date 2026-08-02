export type TakeawayStatus =
  | 'not_generated'
  | 'draft'
  | 'needs_review'
  | 'approved'
  | 'outdated'
  | 'error';

export interface SubscoreRef {
  subscoreKey: string;
  categorySlug: string;
  subscoreSlug: string;
  categoryName: string;
  subscoreName: string;
}

export interface BreakdownItem {
  name: string;
  score: number | null;
}

export interface AssembledSubscoreTakeawayContext {
  product: { id: string; name: string; slug: string };
  subscore: SubscoreRef;
  finalScore: number | null;
  breakdown: BreakdownItem[];
  scoreBreakdownText: string;
  inputHash: string;
  hasUsableScores: boolean;
}

export interface TakeawayRowDto {
  id?: string;
  subscoreKey: string;
  categorySlug: string;
  subscoreSlug: string;
  categoryName: string;
  subscoreName: string;
  keyTakeaway?: string;
  takeawayStatus: TakeawayStatus;
  inputHash?: string;
  reviewerNote?: string;
  generationError?: string;
  generatedAt?: number;
  generatedBy?: string;
  approvedAt?: number;
  approvedBy?: string;
  finalScore: number | null;
  breakdown: BreakdownItem[];
  resultsChanged: boolean;
  hasUsableScores: boolean;
}

export type TakeawayListRowDto = Omit<
  TakeawayRowDto,
  'breakdown' | 'reviewerNote' | 'generationError' | 'generatedAt' | 'generatedBy' | 'inputHash'
>;

export interface TakeawayApprovePatch {
  subscoreKey: string;
  keyTakeaway: string;
  takeawayStatus: 'approved';
  approvedAt: number;
  approvedBy: string;
  inputHash?: string;
}

export interface TakeawaySummaryDto {
  total: number;
  notGenerated: number;
  draft: number;
  needsReview: number;
  approved: number;
  outdated: number;
  error: number;
}
