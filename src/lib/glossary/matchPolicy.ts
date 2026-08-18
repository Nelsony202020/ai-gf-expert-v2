import { aliasKey } from './types';

/**
 * Single-word glossary phrases that are also everyday English.
 * These only match when the on-page casing equals the glossary phrase
 * (e.g. "Steps" matches, "steps" in "follow these steps" does not).
 */
const EVERYDAY_SINGLE_WORD_PHRASES = new Set([
  'steps',
  'temperature',
  'creativity',
]);

/** True when a match phrase must use exact casing (not case-insensitive). */
export function phraseRequiresExactCase(phrase: string): boolean {
  const normalized = aliasKey(phrase);
  if (!normalized) return false;
  if (normalized.includes(' ')) return false;
  return EVERYDAY_SINGLE_WORD_PHRASES.has(normalized);
}

/** After a case-insensitive hit, verify casing when required. */
export function casingAllowsMatch(sourceText: string, start: number, end: number, phrase: string): boolean {
  if (!phraseRequiresExactCase(phrase)) return true;
  return sourceText.slice(start, end) === phrase;
}
