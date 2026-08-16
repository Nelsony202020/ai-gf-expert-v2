import type { AiVerdictScope } from './config';
import type { AssembledPayload } from './assembleEvidence';
import type { KeyFinding } from './suggestionSchema';
import { parseSectionKey, sectionConfig } from './notesSchema';
import { TONE_OF_VOICE_PROMPT } from './toneOfVoice';

export const NOTES_PROMPT_VERSION = 'notes-v5';

/** Shared rules for Important Findings + Suggested Pros & Cons across every testing category. */
const CATEGORY_SYSTEM_PROMPT = `You are an experienced product reviewer summarizing test results for AI GF Expert.
Use only the provided test data. Never invent or exaggerate facts. Return valid JSON only.
These rules apply to EVERY category (Characters, Customization, Chat, Chat Features, Images, Video, Privacy, Pricing, and any other).

TONE:
* Short, human, decisive, specific, easy to scan
* No marketing language, no corporate/AI phrasing, no unnecessary adjectives
* Prefer "Huge character library" over "Extensive selection of character profiles available"
* Prefer "Poor memory" over "Memory performance was found to be below expectations"
* Prefer "Fast image generation" over "Images are generated at relatively fast speeds"
* Never include evidence IDs, UUIDs, or internal codes in any text field

═══════════════════════════════════════
IMPORTANT FINDINGS (key_findings)
═══════════════════════════════════════
Factual reviewer notes — extremely skimmable.

Rules:
* Prefer short factual phrases over full sentences
* Aim for roughly 3–8 words (hard max 8)
* No period at the end
* Remove filler: "There are", "The platform has", "Profiles were found", "We found", "It was observed that", etc.
* Preserve the actual meaning and evidence — never invent facts
* Convert large numbers to shorthand: 10,000→10K, 100,000→100K, 500,000→500K, 1,000,000→1M
* Use "+" when evidence means "more than" or an approximate minimum (e.g. 100K+)
* Use "~$" for approximate money (e.g. ~$31 regular monthly cost)
* AVAILABILITY ≠ QUALITY: Yes/Limited/No (availabilityOnly) means presence only — write "Has in-chat video" / "No in-chat video", never "Excellent in-chat video"
* Never paste evidence_ids or UUIDs into text — put them only in the evidence_ids array

Examples:
BAD → GOOD
"There are over 100,000 anime male profiles" → "100K+ anime male characters"
"Non-binary character profiles exceed 10,000" → "10K+ non-binary characters"
"Duplicate character profiles were found" → "Duplicate characters found"
"Browsing feature is not available" → "No character browsing"
"The regular monthly cost is approximately $31" → "~$31 regular monthly cost"
"Video generation costs more than the category average" → "Above-average video costs"

Output 3–6 key_findings.

═══════════════════════════════════════
SUGGESTED PROS & CONS (category_pros / category_cons)
═══════════════════════════════════════
Strong editorial takeaways — not AI descriptions.
Pros/cons may interpret facts into clear user-facing takeaways, but must stay grounded in the test data.

Rules:
* Aim for 2–5 words (hard max 5)
* No period at the end
* Decisive and easy to understand
* Do NOT start with filler: "Offers", "Provides", "There is", "The platform has", "Available", "Features", "Includes"
* Avoid formal/robotic wording; use normal consumer language
* Describe the actual benefit or drawback — do not merely restate evidence verbatim
* Never invent a positive or negative conclusion unsupported by the evidence
* Do not mention ratings, percentages, benchmarks, or "detected"
* Do not repeat the same point
* AVAILABILITY ≠ QUALITY (critical): When evidence has availabilityOnly=true, or measurementType is boolean / yes_limited_no, or the result is Yes / No / Limited — that ONLY means the feature exists or not. NEVER say it is fantastic, excellent, strong, high-quality, or "does a great job." A Yes on in-chat video only means video can be generated in chat — not that the video looks good.
* Use the evidence "name" field exactly as given (e.g. "In-chat video", "In-chat images", "Voice message generation", "AI phone calls") — never invent alternate product jargon like "chat videos"
* Output 2–4 pros and 1–3 cons

Examples:
BAD → GOOD
"Diverse character profiles available" → "Extreme character variety"
"High-quality visual character designs" → "Great character images"
"Wide range of non-binary options" → "Tons of non-binary characters"
"Limited filters for character browsing" → "Weak browsing filters"
"No option for browsing characters" → "No character browsing"
"Limited variety in character styles" → "Few character styles"
"Subscription price is lower than competitors" → "Below-average subscription price"
"Media generation can become expensive" → "Media gets expensive"
"Image generation demonstrates strong visual quality" → "Excellent image quality"
"Generated images sometimes contain visual errors" → "Frequent visual glitches"
"Conversation responses demonstrate good naturalness" → "Very natural conversations"
"The AI frequently repeats previous responses" → "Repetitive replies"
"High character consistency" → "Characters stay consistent"
"Lacks regeneration option" → "No regenerate option"
"Low ease of use" → "Hard to use"`;

function sectionFieldInstructions(sectionKey: string): string {
  const cfg = sectionConfig(sectionKey);
  const parsed = parseSectionKey(sectionKey);

  if (parsed.kind === 'category') {
    return `Category: "${cfg.label}".

Return key_findings (3–6): short factual phrases, ~3–8 words, no trailing period, number shorthand (10K/100K/1M/+), no filler openers.
Return category_pros (2–4) and category_cons (1–3): decisive takeaways, 2–5 words, no trailing period, no filler openers — follow the system prompt rules exactly.
Do NOT return category_verdict_headline, category_verdict, category_primary_strength, or category_primary_limitation.
Put supporting evidence IDs in evidence_ids only — never paste UUIDs or IDs inside the text.`;
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
- AVAILABILITY ≠ QUALITY: Yes / Limited / No (availabilityOnly) means presence only — never treat it as a quality compliment.
- Use evidence "name" values exactly (In-chat video, In-chat images, Voice message generation, AI phone calls).
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
      measurementType: e.measurementType,
      availabilityOnly: e.availabilityOnly,
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
      ? `- key_findings: array of 3-6 objects ${listExample} — factual skimmable phrases (~3–8 words, no period, use 10K/100K/1M/+ shorthand).
- category_pros: array of 2-4 objects ${listExample} — decisive takeaways (2–5 words, no period, no filler openers).
- category_cons: array of 1-3 objects ${listExample} — decisive takeaways (2–5 words, no period, no filler openers).
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
