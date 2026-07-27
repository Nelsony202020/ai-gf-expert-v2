#!/usr/bin/env tsx
/** Smoke tests for AI verdict suggestion schema validation. */
import assert from 'node:assert/strict';
import { normalizeRawSuggestion, parseAiSuggestionOutput } from '../src/lib/ai-verdict/normalizeOutput';
import {
  aiSuggestionOutputSchema,
  validateEvidenceIds,
} from '../src/lib/ai-verdict/suggestionSchema';

const overall = aiSuggestionOutputSchema.parse({
  scope: 'overall',
  key_findings: [{ text: 'Score 8.2', evidence_ids: [] }],
  one_line_verdict: { text: 'Strong chat platform', evidence_ids: ['ev-1'] },
});
assert.equal(overall.scope, 'overall');

const bad = aiSuggestionOutputSchema.parse({
  scope: 'overall',
  key_findings: [],
  pros: [{ text: 'Fast replies', evidence_ids: ['bad-id'] }],
});
assert.ok(validateEvidenceIds(bad, new Set(['ev-1'])).length > 0);

const good = aiSuggestionOutputSchema.parse({
  scope: 'category',
  category: 'chat-features',
  key_findings: [],
  category_verdict: { text: 'Excellent memory', evidence_ids: ['ev-1'] },
});
assert.deepEqual(validateEvidenceIds(good, new Set(['ev-1'])), []);

// Model often returns plain strings — normalize before Zod parse.
const stringy = parseAiSuggestionOutput(
  {
    scope: 'overall',
    key_findings: [],
    one_line_verdict: 'Strong chat platform',
    overall_verdict: 'A capable companion app with excellent memory.',
    primary_strength: 'Realistic conversations',
    primary_limitation: 'Slow image generation',
    short_directory_description: 'Top-tier AI girlfriend app',
    best_for: ['Roleplay fans', 'Memory-heavy chatters'],
    not_ideal_for: ['Budget users'],
    pros: ['Fast replies', 'Great memory'],
    cons: ['Pricey'],
  },
  'overall',
);
assert.equal(stringy.one_line_verdict?.text, 'Strong chat platform');
assert.equal(stringy.best_for?.length, 2);
assert.equal(stringy.pros?.[0]?.text, 'Fast replies');

const fieldFromString = parseAiSuggestionOutput(
  { scope: 'field', key_findings: [], field_suggestion: 'Top-tier companion platform' },
  'field',
  undefined,
  'oneLineVerdict — short headline',
);
assert.equal(fieldFromString.field_suggestion?.text, 'Top-tier companion platform');

const fieldFromWrongKey = parseAiSuggestionOutput(
  {
    scope: 'field',
    key_findings: [],
    one_line_verdict: 'Recovered from wrong key',
  },
  'field',
  undefined,
  'oneLineVerdict — short headline',
);
assert.equal(fieldFromWrongKey.field_suggestion?.text, 'Recovered from wrong key');

const normalized = normalizeRawSuggestion(
  { oneLineVerdict: 'Camel case headline', pros: ['Pro one'] },
  'overall',
);
assert.equal((normalized.one_line_verdict as { text: string }).text, 'Camel case headline');
assert.equal((normalized.pros as { text: string }[])[0].text, 'Pro one');

console.log('ai-verdict schema tests passed');
