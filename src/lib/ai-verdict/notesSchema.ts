import { z } from 'zod';
import type { VerdictStepId } from '../../components/admin/workspace/verdict/types';
import type { AiVerdictScope } from './config';
import { enforceMaxWords, PRO_CON_MAX_WORDS } from './fieldPromptHelpers';
import type { AiSuggestionOutput, KeyFinding } from './suggestionSchema';

export const aiNotesSectionKeySchema = z.string().min(1);

export const loadNotesRequestSchema = z.object({
  productId: z.string().min(1),
  testRunId: z.string().min(1),
  sectionKey: z.string().min(1),
});

export const generateNotesRequestSchema = loadNotesRequestSchema.extend({
  regenerate: z.boolean().optional(),
});

export type LoadNotesRequest = z.infer<typeof loadNotesRequestSchema>;
export type GenerateNotesRequest = z.infer<typeof generateNotesRequestSchema>;

export interface AiNotesSectionConfig {
  label: string;
  scope: AiVerdictScope;
  categorySlug?: string;
  /** Product field keys this section can insert into. */
  productFields?: string[];
  categoryFields?: string[];
}

export function verdictStepSectionKey(stepId: VerdictStepId): string {
  return `step:${stepId}`;
}

export function categorySectionKey(slug: string): string {
  return `category:${slug}`;
}

export function parseSectionKey(sectionKey: string): {
  kind: 'step' | 'category';
  stepId?: VerdictStepId;
  categorySlug?: string;
} {
  if (sectionKey.startsWith('step:')) {
    return { kind: 'step', stepId: sectionKey.slice(5) as VerdictStepId };
  }
  if (sectionKey.startsWith('category:')) {
    return { kind: 'category', categorySlug: sectionKey.slice(9) };
  }
  throw new Error(`Invalid section key: ${sectionKey}`);
}

export function sectionConfig(sectionKey: string, categoryName?: string): AiNotesSectionConfig {
  const parsed = parseSectionKey(sectionKey);
  if (parsed.kind === 'category' && parsed.categorySlug) {
    return {
      label: categoryName ?? parsed.categorySlug,
      scope: 'category',
      categorySlug: parsed.categorySlug,
      categoryFields: [
        'headline',
        'verdict',
        'mainStrength',
        'mainWeakness',
        'pros',
        'cons',
      ],
    };
  }
  switch (parsed.stepId) {
    case 'overall':
      return {
        label: 'Overall verdict',
        scope: 'overall',
        productFields: [
          'oneLineVerdict',
          'ourTake',
          'mainStrength',
          'mainLimitation',
          'directoryDescription',
        ],
      };
    case 'decision':
      return {
        label: 'Decision summary',
        scope: 'overall',
        productFields: ['bestFor', 'notIdealFor'],
      };
    case 'pros-cons':
      return {
        label: 'Pros & cons',
        scope: 'overall',
        productFields: ['pros', 'cons'],
      };
    case 'expert':
      return {
        label: 'Expert opinion',
        scope: 'outline',
        productFields: ['expertOpinion'],
      };
    case 'categories':
      return {
        label: 'Category verdicts',
        scope: 'category',
      };
    default:
      return { label: sectionKey, scope: 'overall' };
  }
}

export function normalizeListField(value: unknown): string[] {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && 'text' in item) {
        return String((item as { text: unknown }).text ?? '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

export function normalizeScalarField(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && 'text' in value) {
    return String((value as { text: unknown }).text ?? '').trim();
  }
  return '';
}

/** Ensure saved suggestions always use plain strings for lists and scalars. */
export function normalizeFieldSuggestions(raw: Record<string, unknown>): Record<string, unknown> {
  const listKeys = new Set(['pros', 'cons', 'bestFor', 'notIdealFor', 'expertOutline']);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (listKeys.has(key) || Array.isArray(value)) {
      let items = normalizeListField(value);
      if (key === 'pros' || key === 'cons') {
        items = items.map((s) => enforceMaxWords(s, PRO_CON_MAX_WORDS));
      }
      out[key] = items;
    } else {
      const text = normalizeScalarField(value);
      if (text) out[key] = text;
      else if (typeof value === 'string' && value.trim()) out[key] = value.trim();
    }
  }
  return out;
}

/** Map structured AI output to product/category field suggestions for a section. */
export function buildFieldSuggestions(
  sectionKey: string,
  output: AiSuggestionOutput,
): Record<string, unknown> {
  const parsed = parseSectionKey(sectionKey);
  if (parsed.kind === 'category') {
    const out = normalizeFieldSuggestions({
      headline: output.category_verdict_headline,
      verdict: output.category_verdict,
      mainStrength: output.category_primary_strength,
      mainWeakness: output.category_primary_limitation,
      pros: output.category_pros,
      cons: output.category_cons,
    });
    const pros = out.pros as string[] | undefined;
    const cons = out.cons as string[] | undefined;
    if (pros?.[0]) out.mainStrength = pros[0];
    if (cons?.[0]) out.mainWeakness = cons[0];
    return out;
  }
  switch (parsed.stepId) {
    case 'overall':
      return normalizeFieldSuggestions({
        oneLineVerdict: output.one_line_verdict,
        ourTake: output.overall_verdict,
        mainStrength: output.primary_strength,
        mainLimitation: output.primary_limitation,
        directoryDescription: output.short_directory_description,
      });
    case 'decision':
      return normalizeFieldSuggestions({
        bestFor: output.best_for,
        notIdealFor: output.not_ideal_for,
      });
    case 'pros-cons':
      return normalizeFieldSuggestions({
        pros: output.pros,
        cons: output.cons,
      });
    case 'expert':
      return normalizeFieldSuggestions({
        expertOpinion: output.field_suggestion ?? output.expert_opinion_outline?.[0],
        expertOutline: output.expert_opinion_outline,
      });
    default:
      return {};
  }
}

export interface AiVerdictNotesDto {
  id: string;
  sectionKey: string;
  scope: AiVerdictScope;
  categorySlug: string | null;
  keyFindings: KeyFinding[];
  fieldSuggestions: Record<string, unknown>;
  inputHash: string;
  evidenceIds: string[];
  model: string;
  promptVersion: string;
  status: string;
  generatedAt: number;
  updatedAt: number;
  generatedBy: string | null;
  testRunId: string | null;
  stale: boolean;
}

export const FIELD_LABELS: Record<string, string> = {
  oneLineVerdict: 'Verdict headline',
  ourTake: 'Verdict paragraph',
  mainStrength: 'Primary strength',
  mainLimitation: 'Primary limitation',
  directoryDescription: 'Directory description',
  bestFor: 'Best for',
  notIdealFor: 'Not ideal for',
  pros: 'Pros',
  cons: 'Cons',
  expertOpinion: 'Expert opinion',
  headline: 'Category headline',
  verdict: 'Category verdict',
  mainWeakness: 'Primary limitation',
};
