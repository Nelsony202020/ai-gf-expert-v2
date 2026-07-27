import type { AiVerdictScope } from './config';
import type { AssembledPayload } from './assembleEvidence';
import type { KeyFinding } from './suggestionSchema';
import { parseSectionKey, sectionConfig } from './notesSchema';
import { TONE_OF_VOICE_PROMPT } from './toneOfVoice';

export const NOTES_PROMPT_VERSION = 'notes-v1';

function sectionFieldInstructions(sectionKey: string): string {
  const cfg = sectionConfig(sectionKey);
  const parsed = parseSectionKey(sectionKey);

  if (parsed.kind === 'category') {
    return `Generate writing suggestions for the "${cfg.label}" category:
category_verdict_headline, category_verdict, category_primary_strength, category_primary_limitation, category_pros (3-5), category_cons (2-4).
Also return 3-6 key_findings specific to this category's test evidence.`;
  }

  switch (parsed.stepId) {
    case 'overall':
      return `Generate writing suggestions for the Overall verdict section:
one_line_verdict, overall_verdict, primary_strength, primary_limitation, short_directory_description.
Also return 3-6 key_findings from the test data (scores, counts, percentages, benchmarks — factual only).`;
    case 'decision':
      return `Generate writing suggestions for the Decision summary section:
best_for (3-4 items), not_ideal_for (2-4 items).
Also return 3-6 key_findings that help decide who should use this product.`;
    case 'pros-cons':
      return `Generate writing suggestions for Pros & cons:
pros (3-5 items), cons (2-4 items).
Also return 3-6 key_findings highlighting strengths and weaknesses.`;
    case 'expert':
      return `Generate writing suggestions for Expert opinion:
field_suggestion with a first-person expert conclusion (100-250 words) based on testing.
Also return expert_opinion_outline (3-5 bullet prompts) and 3-6 key_findings.`;
    default:
      return `Generate relevant verdict suggestions and 3-6 key_findings.`;
  }
}

export function buildNotesSystemPrompt(scope: AiVerdictScope): string {
  return `You are an editorial assistant for AI GF Expert, an independent product review site.
Write evidence-based verdict notes and copy suggestions from structured testing data only.

${TONE_OF_VOICE_PROMPT}

Rules:
- Every material claim MUST cite valid evidence_ids from the provided payload when possible.
- key_findings must be 3-6 short, scannable factual bullets editors can use as writing notes.
- Return valid JSON matching the requested schema exactly.
- Scope: ${scope}.
- Never mention that you are an AI.`;
}

export function buildNotesUserPrompt(
  sectionKey: string,
  payload: AssembledPayload,
  derivedFindings: KeyFinding[],
): string {
  const trimmed = {
    product: payload.product,
    testRun: payload.testRun,
    scope: payload.scope,
    categorySlug: payload.categorySlug,
    overallScore: payload.overallScore,
    scores: payload.scores,
    benchmarks: payload.benchmarks,
    pricing: payload.pricing,
    previousRun: payload.previousRun,
    evidence: payload.evidence.map((e) => ({
      id: e.id,
      slug: e.slug,
      name: e.name,
      categorySlug: e.categorySlug,
      publicResult: e.publicResult,
      publicExplanation: e.publicExplanation,
      normalizedScore: e.normalizedScore,
      isUnknown: e.isUnknown,
      notApplicable: e.notApplicable,
    })),
    derived_findings: derivedFindings,
  };

  const blockExample = '{"text":"Your copy here","evidence_ids":["evidence-id-from-DATA"]}';
  const listExample = `[${blockExample}]`;

  return `${sectionFieldInstructions(sectionKey)}

SCHEMA:
- key_findings: array of 3-6 objects ${listExample} — concise factual writing notes.
- Every text field MUST be an object ${blockExample}, NOT a plain string.
- List fields MUST be arrays of objects ${listExample}, NOT arrays of strings.
- If evidence is too sparse, return fewer key_findings and add insufficient_evidence_fields.

Respond with JSON only.

DATA:
${JSON.stringify(trimmed)}`;
}
