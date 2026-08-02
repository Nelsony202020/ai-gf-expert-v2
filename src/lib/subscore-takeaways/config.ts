import { env } from '../env';

export const PROMPT_VERSION = 'takeaways-v2';

export function subscoreTakeawaysConfig() {
  return {
    enabled: env('AI_SUBSCORE_TAKEAWAYS_ENABLED') !== 'false',
    model: env('OPENAI_SUBSCORE_TAKEAWAYS_MODEL') ?? env('OPENAI_EXPLANATIONS_MODEL') ?? 'gpt-4o',
    temperature: Number(env('AI_SUBSCORE_TAKEAWAYS_TEMPERATURE') ?? env('AI_EXPLANATIONS_TEMPERATURE') ?? 0.4),
    maxOutputTokens: Number(env('AI_SUBSCORE_TAKEAWAYS_MAX_OUTPUT_TOKENS') ?? 200),
    concurrency: Number(env('AI_SUBSCORE_TAKEAWAYS_CONCURRENCY') ?? 5),
  };
}
