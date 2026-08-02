import { validateTakeawayOutputSchema } from './schema';

export function validateTakeawayOutput(parsed: unknown): { keyTakeaway: string } {
  const result = validateTakeawayOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join('; ') || 'Invalid AI output');
  }
  const text = result.data.keyTakeaway.trim();
  if (text.split(/[.!?]+/).filter(Boolean).length < 2) {
    throw new Error('Key takeaway must be exactly 2 sentences.');
  }
  return { keyTakeaway: text };
}
