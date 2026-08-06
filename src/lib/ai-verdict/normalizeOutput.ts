import { z } from 'zod';
import { HttpError } from '../db/auth';
import type { AiVerdictScope } from './config';
import {
  aiSuggestionOutputSchema,
  type AiSuggestionOutput,
  type KeyFinding,
} from './suggestionSchema';
import { stripInlineEvidenceIds } from './sanitizeEvidenceCitations';

type FieldBlock = { text: string; evidence_ids: string[] };

const SCALAR_FIELDS = [
  'one_line_verdict',
  'overall_verdict',
  'primary_strength',
  'primary_limitation',
  'short_directory_description',
  'category_verdict_headline',
  'category_verdict',
  'category_primary_strength',
  'category_primary_limitation',
  'field_suggestion',
] as const;

const LIST_FIELDS = [
  'best_for',
  'not_ideal_for',
  'pros',
  'cons',
  'expert_opinion_outline',
  'category_pros',
  'category_cons',
] as const;

const CAMEL_ALIASES: Record<string, string> = {
  oneLineVerdict: 'one_line_verdict',
  overallVerdict: 'overall_verdict',
  primaryStrength: 'primary_strength',
  primaryLimitation: 'primary_limitation',
  shortDirectoryDescription: 'short_directory_description',
  bestFor: 'best_for',
  notIdealFor: 'not_ideal_for',
  categoryVerdictHeadline: 'category_verdict_headline',
  categoryVerdict: 'category_verdict',
  categoryPrimaryStrength: 'category_primary_strength',
  categoryPrimaryLimitation: 'category_primary_limitation',
  categoryPros: 'category_pros',
  categoryCons: 'category_cons',
  expertOpinionOutline: 'expert_opinion_outline',
  fieldSuggestion: 'field_suggestion',
  keyFindings: 'key_findings',
  insufficientEvidenceFields: 'insufficient_evidence_fields',
};

function coerceFieldBlock(value: unknown): FieldBlock | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const { text } = stripInlineEvidenceIds(value.trim());
    return text ? { text, evidence_ids: [] } : undefined;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    const text = String(o.text ?? o.content ?? o.value ?? '').trim();
    if (!text) return undefined;
    const rawIds = Array.isArray(o.evidence_ids)
      ? o.evidence_ids.map(String)
      : Array.isArray(o.evidenceIds)
        ? o.evidenceIds.map(String)
        : [];
    const { text: cleanText, extractedIds } = stripInlineEvidenceIds(text);
    if (!cleanText) return undefined;
    const evidence_ids = [...new Set([...rawIds, ...extractedIds])];
    return { text: cleanText, evidence_ids };
  }
  return undefined;
}

function coerceFieldList(value: unknown): FieldBlock[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: FieldBlock[] = [];
  for (const item of value) {
    const block = coerceFieldBlock(item);
    if (block) out.push(block);
  }
  return out.length > 0 ? out : undefined;
}

function coerceKeyFindings(value: unknown): KeyFinding[] {
  const list = coerceFieldList(value);
  if (!list) return [];
  return list.map((item) => ({ text: item.text, evidence_ids: item.evidence_ids }));
}

function flattenRaw(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };
  for (const [camel, snake] of Object.entries(CAMEL_ALIASES)) {
    if (out[camel] !== undefined && out[snake] === undefined) {
      out[snake] = out[camel];
    }
  }
  return out;
}

function fieldSuggestionFromTarget(
  raw: Record<string, unknown>,
  targetField?: string,
): FieldBlock | undefined {
  const direct = coerceFieldBlock(raw.field_suggestion);
  if (direct) return direct;

  const tf = targetField ?? '';
  const mappings: [RegExp, string[]][] = [
    [/oneLineVerdict/i, ['one_line_verdict', 'oneLineVerdict']],
    [/ourTake/i, ['overall_verdict', 'ourTake']],
    [/mainStrength/i, ['primary_strength', 'mainStrength']],
    [/mainLimitation/i, ['primary_limitation', 'mainLimitation']],
    [/directoryDescription/i, ['short_directory_description', 'directoryDescription']],
    [/expertOpinion/i, ['expert_opinion', 'expertOpinion', 'field_suggestion']],
    [/bestFor|best for/i, ['best_for', 'bestFor']],
    [/notIdealFor|not ideal/i, ['not_ideal_for', 'notIdealFor']],
    [/\bpros\b/i, ['pros']],
    [/\bcons\b/i, ['cons']],
  ];

  for (const [re, keys] of mappings) {
    if (!re.test(tf)) continue;
    for (const key of keys) {
      const scalar = coerceFieldBlock(raw[key]);
      if (scalar) return scalar;
      const list = coerceFieldList(raw[key]);
      if (list?.length) {
        return {
          text: list.map((x) => x.text).join('\n'),
          evidence_ids: list.flatMap((x) => x.evidence_ids),
        };
      }
    }
  }

  const generic = coerceFieldBlock(raw.text ?? raw.suggestion ?? raw.content);
  return generic;
}

/** Coerce loosely shaped model JSON into the structure our Zod schema expects. */
export function normalizeRawSuggestion(
  raw: unknown,
  scope: AiVerdictScope,
  targetField?: string,
): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new HttpError(502, 'AI returned invalid JSON shape');
  }

  const src = flattenRaw(raw as Record<string, unknown>);
  const out: Record<string, unknown> = {
    scope,
    category: src.category,
    warnings: Array.isArray(src.warnings) ? src.warnings.map(String) : undefined,
    insufficient_evidence_fields: Array.isArray(src.insufficient_evidence_fields)
      ? src.insufficient_evidence_fields.map(String)
      : undefined,
    key_findings: coerceKeyFindings(src.key_findings),
  };

  for (const key of SCALAR_FIELDS) {
    const block = coerceFieldBlock(src[key]);
    if (block) out[key] = block;
  }

  for (const key of LIST_FIELDS) {
    const list = coerceFieldList(src[key]);
    if (list) out[key] = list;
  }

  if (scope === 'field') {
    const fieldSuggestion = fieldSuggestionFromTarget(src, targetField);
    if (fieldSuggestion) out.field_suggestion = fieldSuggestion;
  }

  return out;
}

function formatZodError(error: z.ZodError): string {
  const top = error.issues.slice(0, 2).map((i) => i.message);
  return top.length > 0
    ? `AI output failed validation: ${top.join('; ')}`
    : 'AI output failed validation';
}

export function parseAiSuggestionOutput(
  raw: unknown,
  scope: AiVerdictScope,
  categorySlug?: string,
  targetField?: string,
): AiSuggestionOutput {
  const normalized = normalizeRawSuggestion(raw, scope, targetField);
  const result = aiSuggestionOutputSchema.safeParse({
    ...normalized,
    scope,
    category: categorySlug,
  });

  if (!result.success) {
    throw new HttpError(422, formatZodError(result.error));
  }

  const output = result.data;

  if (scope === 'field' && !output.field_suggestion?.text?.trim()) {
    const parts: string[] = [];
    if (output.insufficient_evidence_fields?.length) {
      parts.push(
        `Not enough test evidence for: ${output.insufficient_evidence_fields.join(', ')}.`,
      );
    }
    if (output.warnings?.length) {
      parts.push(...output.warnings);
    }
    throw new HttpError(
      422,
      parts.length > 0
        ? parts.join(' ')
        : 'AI did not return a field suggestion — complete more testing evidence and try again.',
    );
  }

  return output;
}
