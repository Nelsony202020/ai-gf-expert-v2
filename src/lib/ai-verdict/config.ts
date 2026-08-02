import { env } from '../env';

export type { AiVerdictScope } from './types';
export const PROMPT_VERSION = 'v1';

export function aiVerdictConfig() {
  return {
    enabled: env('AI_VERDICT_ENABLED') !== 'false',
    model: env('OPENAI_VERDICT_MODEL') ?? 'gpt-4o-mini',
    maxOutputTokens: Number(env('AI_VERDICT_MAX_OUTPUT_TOKENS') ?? 2000),
    maxPayloadBytes: Number(env('AI_VERDICT_MAX_PAYLOAD_BYTES') ?? 50_000),
    userWindowMs: Number(env('AI_VERDICT_USER_WINDOW_MS') ?? 10 * 60 * 1000),
    userMaxRequests: Number(env('AI_VERDICT_USER_MAX_REQUESTS') ?? 30),
    productCooldownMs: Number(env('AI_VERDICT_PRODUCT_COOLDOWN_MS') ?? 15_000),
    dedupeWindowMs: Number(env('AI_VERDICT_DEDUPE_WINDOW_MS') ?? 5 * 60 * 1000),
    requestTimeoutMs: Number(env('AI_VERDICT_REQUEST_TIMEOUT_MS') ?? 45_000),
    dailyLimit: Number(env('AI_VERDICT_DAILY_LIMIT') ?? 200),
  };
}
