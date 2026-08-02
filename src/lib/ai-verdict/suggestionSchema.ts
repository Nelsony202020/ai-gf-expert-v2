import { z } from 'zod';
import type { AiVerdictScope } from './types';

export const aiVerdictScopeSchema = z.enum(['overall', 'category', 'field', 'outline']);

export const keyFindingSchema = z.object({
  text: z.string().min(1),
  evidence_ids: z.array(z.string()).default([]),
  finding_type: z.enum(['strength', 'weakness', 'neutral', 'pricing', 'score']).optional(),
});

export const generateRequestSchema = z.object({
  productId: z.string().min(1),
  testRunId: z.string().min(1).optional(),
  scope: aiVerdictScopeSchema,
  categorySlug: z.string().optional(),
  targetField: z.string().optional(),
  includeTesterNotes: z.boolean().optional(),
  regenerate: z.boolean().optional(),
  /** Current editor text for rewrite/shorten modes. */
  currentText: z.string().optional(),
  /** write | rewrite | shorten | specific | another */
  fieldMode: z.enum(['write', 'rewrite', 'shorten', 'specific', 'another']).optional(),
  /** Saved section key findings passed as writing context. */
  notesContext: z.array(keyFindingSchema).optional(),
});

export const suggestionFieldSchema = z.object({
  text: z.string().min(1),
  evidence_ids: z.array(z.string()).default([]),
});

export const aiSuggestionOutputSchema = z.object({
  scope: aiVerdictScopeSchema,
  category: z.string().optional(),
  key_findings: z.array(keyFindingSchema).default([]),
  one_line_verdict: suggestionFieldSchema.optional(),
  overall_verdict: suggestionFieldSchema.optional(),
  primary_strength: suggestionFieldSchema.optional(),
  primary_limitation: suggestionFieldSchema.optional(),
  short_directory_description: suggestionFieldSchema.optional(),
  best_for: z.array(suggestionFieldSchema).optional(),
  not_ideal_for: z.array(suggestionFieldSchema).optional(),
  pros: z.array(suggestionFieldSchema).optional(),
  cons: z.array(suggestionFieldSchema).optional(),
  expert_opinion_outline: z.array(suggestionFieldSchema).optional(),
  category_verdict_headline: suggestionFieldSchema.optional(),
  category_verdict: suggestionFieldSchema.optional(),
  category_primary_strength: suggestionFieldSchema.optional(),
  category_primary_limitation: suggestionFieldSchema.optional(),
  category_pros: z.array(suggestionFieldSchema).optional(),
  category_cons: z.array(suggestionFieldSchema).optional(),
  field_suggestion: suggestionFieldSchema.optional(),
  warnings: z.array(z.string()).optional(),
  insufficient_evidence_fields: z.array(z.string()).optional(),
});

export type AiSuggestionOutput = z.infer<typeof aiSuggestionOutputSchema>;
export type KeyFinding = z.infer<typeof keyFindingSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export function validateEvidenceIds(
  output: AiSuggestionOutput,
  allowedIds: Set<string>,
): string[] {
  const errors: string[] = [];
  const check = (ids: string[] | undefined, label: string) => {
    for (const id of ids ?? []) {
      if (!allowedIds.has(id)) errors.push(`${label}: unknown evidence id ${id}`);
    }
  };

  for (const f of output.key_findings) check(f.evidence_ids, 'key_findings');
  const fields: (keyof AiSuggestionOutput)[] = [
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
  ];
  for (const key of fields) {
    const block = output[key] as { evidence_ids?: string[] } | undefined;
    if (block) check(block.evidence_ids, String(key));
  }
  for (const listKey of [
    'best_for',
    'not_ideal_for',
    'pros',
    'cons',
    'expert_opinion_outline',
    'category_pros',
    'category_cons',
  ] as const) {
    for (const item of output[listKey] ?? []) check(item.evidence_ids, listKey);
  }
  return errors;
}

export function suggestionToProductPatch(
  output: AiSuggestionOutput,
  categorySlug?: string,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (output.one_line_verdict?.text) patch.oneLineVerdict = output.one_line_verdict.text;
  if (output.overall_verdict?.text) patch.ourTake = output.overall_verdict.text;
  if (output.primary_strength?.text) patch.mainStrength = output.primary_strength.text;
  if (output.primary_limitation?.text) patch.mainLimitation = output.primary_limitation.text;
  if (output.short_directory_description?.text) {
    patch.directoryDescription = output.short_directory_description.text;
  }
  if (output.best_for?.length) patch.bestFor = output.best_for.map((x) => x.text);
  if (output.not_ideal_for?.length) patch.notIdealFor = output.not_ideal_for.map((x) => x.text);
  if (output.pros?.length) patch.pros = output.pros.map((x) => x.text);
  if (output.cons?.length) patch.cons = output.cons.map((x) => x.text);

  const slug = categorySlug ?? output.category;
  if (slug) {
    const cv: Record<string, unknown> = {};
    if (output.category_verdict_headline?.text) cv.headline = output.category_verdict_headline.text;
    if (output.category_verdict?.text) cv.verdict = output.category_verdict.text;
    if (output.category_primary_strength?.text) cv.mainStrength = output.category_primary_strength.text;
    if (output.category_primary_limitation?.text) cv.mainWeakness = output.category_primary_limitation.text;
    if (output.category_pros?.length) cv.pros = output.category_pros.map((x) => x.text);
    if (output.category_cons?.length) cv.cons = output.category_cons.map((x) => x.text);
    if (Object.keys(cv).length > 0) {
      patch.categoryVerdicts = { [slug]: cv };
    }
  }

  if (output.field_suggestion?.text && output.scope === 'field') {
    // Caller maps targetField → product field
  }

  return patch;
}

export function scopeLabel(scope: AiVerdictScope): string {
  switch (scope) {
    case 'overall':
      return 'Overall verdict';
    case 'category':
      return 'Category verdict';
    case 'field':
      return 'Field suggestion';
    case 'outline':
      return 'Expert opinion outline';
  }
}
