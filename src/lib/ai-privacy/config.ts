import { env } from '../env';

export const AI_PRIVACY_PROMPT_VERSION = 'v3';

export function aiPrivacyConfig() {
  return {
    enabled: env('AI_PRIVACY_ENABLED') !== 'false',
    model: env('OPENAI_PRIVACY_MODEL') ?? env('OPENAI_VERDICT_MODEL') ?? 'gpt-4o-mini',
    maxOutputTokens: Number(env('AI_PRIVACY_MAX_OUTPUT_TOKENS') ?? 6000),
    /** Soft cap on combined document text sent to the model. */
    maxTotalChars: Number(env('AI_PRIVACY_MAX_TOTAL_CHARS') ?? 180_000),
    minDocChars: 80,
  };
}
