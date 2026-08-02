import { explanationOutputSchema } from './schema';

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateExplanationOutput(raw: unknown): { whatThisMeans: string } {
  const parsed = explanationOutputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('AI response missing whatThisMeans field.');
  }

  const text = parsed.data.whatThisMeans.trim().replace(/\s+/g, ' ');
  if (!text) throw new Error('AI returned empty whatThisMeans.');

  if (/\n/.test(text)) {
    throw new Error('Output must be one paragraph with no line breaks.');
  }
  if (/^[\-*•]\s|^\d+\.\s|#{1,6}\s/m.test(text)) {
    throw new Error('Output must not contain bullet points or headings.');
  }
  if (/\*\*|__|\[.+\]\(.+\)/.test(text)) {
    throw new Error('Output must not contain markdown formatting.');
  }

  const words = wordCount(text);
  if (words < 15) {
    throw new Error(`Output is too short (${words} words). Aim for 25–50 words.`);
  }
  if (words > 65) {
    throw new Error(`Output is too long (${words} words). Keep it under 65 words.`);
  }

  return { whatThisMeans: text };
}
