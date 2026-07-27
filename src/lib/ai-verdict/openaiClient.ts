import OpenAI from 'openai';
import { env } from '../env';
import { HttpError } from '../db/auth';

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (_client) return _client;
  const apiKey = env('OPENAI_API_KEY');
  if (!apiKey) {
    throw new HttpError(
      503,
      'AI features are not configured — set OPENAI_API_KEY in .env (local) or Vercel env (production).',
    );
  }
  _client = new OpenAI({ apiKey, timeout: 45_000 });
  return _client;
}
