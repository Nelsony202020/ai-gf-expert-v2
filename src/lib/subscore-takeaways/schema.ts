import { z } from 'zod';

export const generateTakeawayRequestSchema = z.object({
  regenerate: z.boolean().optional(),
  reviewerNote: z.string().optional(),
});

export const saveTakeawayRequestSchema = z.object({
  keyTakeaway: z.string().optional(),
  reviewerNote: z.string().optional(),
});

export const validateTakeawayOutputSchema = z.object({
  keyTakeaway: z.string().min(1),
});
