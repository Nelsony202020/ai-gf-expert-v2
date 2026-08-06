import type { AiVerdictScope } from './config';
import type { AssembledPayload } from './assembleEvidence';
import type { KeyFinding } from './suggestionSchema';
import { parseSectionKey, sectionConfig } from './notesSchema';
import { TONE_OF_VOICE_PROMPT } from './toneOfVoice';

export const NOTES_PROMPT_VERSION = 'notes-v3';

const CATEGORY_SYSTEM_PROMPT = `You are a review-writing assistant. Use only the provided test data.

Generate consumer-friendly pros and cons that explain what the result means in normal language.

Rules:

* Write for everyday readers, not analysts.
* Focus on the user experience, not test labels or scores.
* Do not mention ratings, percentages, benchmarks, or "detected."
* Rewrite technical findings into natural benefits or limitations.
* Keep each pro or con under 7 words.
* Be specific, clear, and useful.
* Do not exaggerate or invent facts.
* Do not repeat the same point.
* Do not use vague phrases like "great performance," "low ease of use," or "excellent accuracy rating."
* Describe unavailable features clearly.
* Never include evidence IDs, UUIDs, or internal reference codes in any text field.
* Output 2–4 pros and 1–3 cons.
* Output valid JSON only.

Examples:

"High character consistency" → "Characters stay visually consistent"

"Excellent accuracy rating" → "Videos follow prompts accurately"

"No visual errors detected" → "Videos have very few flaws"

"Low ease of use" → "Video generator feels complicated"

"Lacks regeneration option" → "No option to regenerate videos"`;

function sectionFieldInstructions(sectionKey: string): string {
  const cfg = sectionConfig(sectionKey);
  const parsed = parseSectionKey(sectionKey);

  if (parsed.kind === 'category') {
    return `Category: "${cfg.label}".

Also return key_findings: 3–6 short bullets for the reviewer (what actually happened during testing).
Findings are read-only reference notes — be factual and specific, but write in plain English.
Do not say "strong result" or "weak result." If a feature is unavailable, say so clearly.
Do not invent facts.
Put supporting evidence IDs in evidence_ids only — never paste UUIDs or IDs inside the text.

Return category_pros (2–4 items) and category_cons (1–3 items) using the system prompt rules.
Do NOT return category_verdict_headline, category_verdict, category_primary_strength, or category_primary_limitation.`;
  }

  switch (parsed.stepId) {
    case 'overall':
      return `Generate writing suggestions for the Overall verdict section:
one_line_verdict, overall_verdict, primary_strength, primary_limitation, short_directory_description.
Also return 3-6 key_findings from the test data (scores, counts, percentages, benchmarks — factual only).`;
    case 'decision':
      return `Generate writing suggestions for the Decision & pros/cons section:
best_for (3-4 items), not_ideal_for (2-4 items),
pros (3-5 items, max 5 words each), cons (2-4 items, max 5 words each). Pros/cons are short punchy phrases, not sentences.
Also return 3-6 key_findings that help decide who should use this product and highlight strengths and weaknesses.`;
    case 'expert':
      return `Generate writing suggestions for Expert opinion:
field_suggestion with a first-person expert conclusion (100-250 words) based on testing.
Also return expert_opinion_outline (3-5 bullet prompts) and 3-6 key_findings.`;
    default:
      return `Generate relevant verdict suggestions and 3-6 key_findings.`;
  }
}

export function buildNotesSystemPrompt(scope: AiVerdictScope, sectionKey?: string): string {
  if (sectionKey) {
    const parsed = parseSectionKey(sectionKey);
    if (parsed.kind === 'category') {
      return CATEGORY_SYSTEM_PROMPT;
    }
  }

  return `You are an AI review assistant for AI GF Expert, an independent product review site.
Use only the provided test data. Return valid JSON only.

${TONE_OF_VOICE_PROMPT}

Rules:
- Every material claim MUST cite valid evidence_ids from the provided payload when possible.
- Put evidence IDs in the evidence_ids array only — never include UUIDs or internal IDs in text.
- Return valid JSON matching the requested schema exactly.
- Scope: ${scope}.
- Never mention that you are an AI.`;
}

export function buildNotesUserPrompt(
  sectionKey: string,
  payload: AssembledPayload,
  derivedFindings: KeyFinding[],
): string {
  const parsed = parseSectionKey(sectionKey);
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
      subscoreSlug: e.subscoreSlug,
      publicResult: e.publicResult,
      publicExplanation: e.publicExplanation,
      normalizedScore: e.normalizedScore,
      isUnknown: e.isUnknown,
      notApplicable: e.notApplicable,
      internalNotes: e.internalNotes,
    })),
    derived_findings: derivedFindings,
  };

  const blockExample = '{"text":"Your copy here","evidence_ids":["evidence-id-from-DATA"]}';
  const listExample = `[${blockExample}]`;

  const categorySchema =
    parsed.kind === 'category'
      ? `- key_findings: array of 3-6 objects ${listExample} — reviewer reference notes in plain English.
- category_pros: array of 2-4 objects ${listExample} — consumer-friendly, under 7 words each.
- category_cons: array of 1-3 objects ${listExample} — consumer-friendly, under 7 words each.
- Every text field MUST be an object ${blockExample}, NOT a plain string.
- evidence_ids belong in the evidence_ids array only — never in text (no UUIDs in parentheses).
- Do NOT include category_verdict_headline, category_verdict, category_primary_strength, or category_primary_limitation.`
      : `- key_findings: array of 3-6 objects ${listExample} — concise factual writing notes.
- Scalar and list writing suggestion fields as described above.
- Every text field MUST be an object ${blockExample}, NOT a plain string.
- evidence_ids belong in the evidence_ids array only — never in text (no UUIDs in parentheses).
- List fields MUST be arrays of objects ${listExample}, NOT arrays of strings.`;

  return `${sectionFieldInstructions(sectionKey)}

SCHEMA:
${categorySchema}
- If evidence is too sparse, return fewer key_findings and add insufficient_evidence_fields.

Respond with JSON only.

DATA:
${JSON.stringify(trimmed)}`;
}
