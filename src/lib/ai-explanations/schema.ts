import { z } from 'zod';

export const explanationOutputSchema = z.object({
  whatThisMeans: z.string().min(1),
});

export const generateExplanationRequestSchema = z.object({
  regenerate: z.boolean().optional(),
  reviewerNote: z.string().max(2000).optional(),
});

export const saveExplanationRequestSchema = z.object({
  whatThisMeans: z.string().max(2000).optional(),
  reviewerNote: z.string().max(2000).optional(),
});

export const batchGenerateRequestSchema = z.object({
  scope: z.enum(['missing', 'outdated', 'category', 'groups']),
  categorySlug: z.string().optional(),
  groupKeys: z.array(z.string()).optional(),
});

export type GenerateExplanationRequest = z.infer<typeof generateExplanationRequestSchema>;
export type SaveExplanationRequest = z.infer<typeof saveExplanationRequestSchema>;
export type BatchGenerateRequest = z.infer<typeof batchGenerateRequestSchema>;
