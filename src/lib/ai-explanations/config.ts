import { env } from '../env';

export const PROMPT_VERSION = 'explanations-v6';

export function aiExplanationsConfig() {
  return {
    enabled: env('AI_EXPLANATIONS_ENABLED') !== 'false',
    model: env('OPENAI_EXPLANATIONS_MODEL') ?? 'gpt-4o',
    temperature: Number(env('AI_EXPLANATIONS_TEMPERATURE') ?? 0.4),
    maxOutputTokens: Number(env('AI_EXPLANATIONS_MAX_OUTPUT_TOKENS') ?? 400),
    /** Max parallel OpenAI calls during batch generation. */
    concurrency: Number(env('AI_EXPLANATIONS_CONCURRENCY') ?? env('AI_EXPLANATIONS_BATCH_SIZE') ?? 5),
    /** @deprecated Use concurrency — kept for env compatibility. */
    batchSize: Number(env('AI_EXPLANATIONS_BATCH_SIZE') ?? 5),
    userWindowMs: Number(env('AI_EXPLANATIONS_USER_WINDOW_MS') ?? 10 * 60 * 1000),
    userMaxRequests: Number(env('AI_EXPLANATIONS_USER_MAX_REQUESTS') ?? 500),
    productCooldownMs: Number(env('AI_EXPLANATIONS_PRODUCT_COOLDOWN_MS') ?? 3000),
  };
}
