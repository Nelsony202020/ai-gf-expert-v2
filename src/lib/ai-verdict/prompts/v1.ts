import type { AiVerdictScope } from '../config';
import type { AssembledPayload } from '../assembleEvidence';
import type { KeyFinding } from '../suggestionSchema';

export function buildSystemPrompt(scope: AiVerdictScope): string {
  return `You are an editorial assistant for AI GF Expert, an independent product review site.
Write evidence-based verdict copy from structured testing data only.
Rules:
- Every material claim MUST cite valid evidence_ids from the provided payload.
- Do not invent scores, prices, or test results.
- Use site benchmarks when provided — do not guess industry averages.
- Write in third person for verdict fields; expert_opinion_outline may use first-person bullet prompts only.
- Return valid JSON matching the requested schema exactly.
- Scope: ${scope}.
- Never mention that you are an AI.`;
}

export function buildUserPrompt(
  payload: AssembledPayload,
  keyFindings: KeyFinding[],
  targetField?: string,
  opts?: {
    currentText?: string;
    fieldMode?: 'write' | 'rewrite' | 'shorten' | 'specific' | 'another';
    notesContext?: KeyFinding[];
  },
): string {
  const trimmed = {
    product: payload.product,
    testRun: payload.testRun,
    scope: payload.scope,
    categorySlug: payload.categorySlug,
    targetField,
    overallScore: payload.overallScore,
    scores: payload.scores,
    benchmarks: payload.benchmarks,
    pricing: payload.pricing,
    previousRun: payload.previousRun,
    evidence: payload.evidence.map((e: AssembledPayload['evidence'][number]) => ({
      id: e.id,
      slug: e.slug,
      name: e.name,
      categorySlug: e.categorySlug,
      publicResult: e.publicResult,
      publicExplanation: e.publicExplanation,
      normalizedScore: e.normalizedScore,
      isUnknown: e.isUnknown,
      notApplicable: e.notApplicable,
      internalNotes: e.internalNotes,
    })),
    key_findings: keyFindings,
  };

  const fieldInstructions =
    payload.scope === 'overall'
      ? `Generate: one_line_verdict, overall_verdict, primary_strength, primary_limitation, short_directory_description, best_for (3-4 items), not_ideal_for (2-4 items), pros (3-5), cons (2-4).`
      : payload.scope === 'category'
        ? `Generate category fields for "${payload.categorySlug}": category_verdict_headline, category_verdict, category_primary_strength, category_primary_limitation, category_pros, category_cons.`
        : payload.scope === 'field'
          ? fieldModeInstruction(targetField, opts)
          : `Generate expert_opinion_outline only — bullet prompts for the editor, not finished first-person copy.`;

  const schemaHint = schemaInstructions(payload.scope);
  const savedNotes =
    opts?.notesContext?.length ?
      `\nSAVED SECTION KEY FINDINGS (use as context, do not repeat verbatim):\n${JSON.stringify(opts.notesContext)}`
    : '';
  const current =
    opts?.currentText?.trim() ?
      `\nCURRENT EDITOR TEXT:\n${opts.currentText.trim()}`
    : '';

  return `${fieldInstructions}${savedNotes}${current}

${schemaHint}

Respond with JSON only.

DATA:
${JSON.stringify(trimmed)}`;
}

function fieldModeInstruction(
  targetField: string | undefined,
  opts?: {
    currentText?: string;
    fieldMode?: 'write' | 'rewrite' | 'shorten' | 'specific' | 'another';
  },
): string {
  const base = `Generate field_suggestion for target field "${targetField}".`;
  switch (opts?.fieldMode) {
    case 'rewrite':
      return `${base} Rewrite the current editor text for clarity while keeping the same meaning and evidence.`;
    case 'shorten':
      return `${base} Shorten the current editor text while keeping the key points.`;
    case 'specific':
      return `${base} Make the suggestion more specific using concrete test details from the data.`;
    case 'another':
      return `${base} Provide a different version from any previous suggestion.`;
    default:
      return base;
  }
}

export function outputJsonSchema(scope: AiVerdictScope): Record<string, unknown> {
  const base = {
    type: 'object',
    additionalProperties: false,
    properties: {
      scope: { type: 'string' },
      category: { type: 'string' },
      key_findings: { type: 'array', items: { type: 'object' } },
      warnings: { type: 'array', items: { type: 'string' } },
      insufficient_evidence_fields: { type: 'array', items: { type: 'string' } },
    },
    required: ['scope', 'key_findings'],
  };
  if (scope === 'overall') {
    return {
      ...base,
      properties: {
        ...base.properties,
        one_line_verdict: fieldBlock(),
        overall_verdict: fieldBlock(),
        primary_strength: fieldBlock(),
        primary_limitation: fieldBlock(),
        short_directory_description: fieldBlock(),
        best_for: listBlock(),
        not_ideal_for: listBlock(),
        pros: listBlock(),
        cons: listBlock(),
      },
    };
  }
  if (scope === 'category') {
    return {
      ...base,
      properties: {
        ...base.properties,
        category_verdict_headline: fieldBlock(),
        category_verdict: fieldBlock(),
        category_primary_strength: fieldBlock(),
        category_primary_limitation: fieldBlock(),
        category_pros: listBlock(),
        category_cons: listBlock(),
      },
    };
  }
  if (scope === 'field') {
    return { ...base, properties: { ...base.properties, field_suggestion: fieldBlock() } };
  }
  return {
    ...base,
    properties: { ...base.properties, expert_opinion_outline: listBlock() },
  };
}

function schemaInstructions(scope: AiVerdictScope): string {
  const blockExample = '{"text":"Your copy here","evidence_ids":["evidence-id-from-DATA"]}';
  const listExample = `[${blockExample}]`;
  const common = `IMPORTANT — every text field MUST be an object ${blockExample}, NOT a plain string.
List fields (pros, cons, best_for, etc.) MUST be arrays of those objects ${listExample}, NOT arrays of strings.
Use snake_case keys exactly as shown. Cite evidence ids from DATA.evidence[].id.`;

  if (scope === 'overall') {
    return `${common}
Required keys: one_line_verdict, overall_verdict, primary_strength, primary_limitation, short_directory_description, best_for, not_ideal_for, pros, cons (each as object or object array).`;
  }
  if (scope === 'category') {
    return `${common}
Required keys: category_verdict_headline, category_verdict, category_primary_strength, category_primary_limitation, category_pros, category_cons.`;
  }
  if (scope === 'field') {
    return `${common}
Return exactly one key: field_suggestion ${blockExample} for the requested target field.`;
  }
  return `${common}
Return expert_opinion_outline as an array of objects ${listExample}.`;
}

function fieldBlock() {
  return {
    type: 'object',
    properties: { text: { type: 'string' }, evidence_ids: { type: 'array', items: { type: 'string' } } },
    required: ['text', 'evidence_ids'],
  };
}

function listBlock() {
  return { type: 'array', items: fieldBlock() };
}
