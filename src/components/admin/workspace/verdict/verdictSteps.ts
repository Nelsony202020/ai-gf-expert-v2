import type { CategoryVerdict, VerdictStepDef, VerdictStepId } from './types';
import { isCategoryVerdictComplete } from './categoryVerdictProgress';

export const VERDICT_STEPS: VerdictStepDef[] = [
  { id: 'overall', label: 'Overall summary', navLabel: 'Overall' },
  { id: 'decision', label: 'Decision & pros/cons', navLabel: 'Decision' },
  { id: 'expert', label: 'Expert opinion', navLabel: 'Expert opinion' },
  { id: 'categories', label: 'Category verdicts', navLabel: 'Categories' },
];

export interface VerdictProgressInput {
  oneLineVerdict?: string;
  ourTake?: string;
  bestFor: string[];
  notIdealFor: string[];
  pros: string[];
  cons: string[];
  expertOpinion?: string;
  categoryVerdicts: Record<string, CategoryVerdict>;
  categorySlugs: string[];
}

function textFilled(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isVerdictStepComplete(stepId: VerdictStepId, input: VerdictProgressInput): boolean {
  switch (stepId) {
    case 'overall':
      return textFilled(input.oneLineVerdict) && textFilled(input.ourTake);
    case 'decision':
      return (
        input.bestFor.length > 0 &&
        input.pros.length > 0 &&
        input.cons.length > 0
      );
    case 'expert':
      return textFilled(input.expertOpinion);
    case 'categories':
      return (
        input.categorySlugs.length > 0 &&
        input.categorySlugs.every((slug) => isCategoryVerdictComplete(input.categoryVerdicts[slug]))
      );
  }
}

export function computeVerdictProgress(input: VerdictProgressInput) {
  const stepStatus = VERDICT_STEPS.map((step) => ({
    ...step,
    complete: isVerdictStepComplete(step.id, input),
  }));
  const completed = stepStatus.filter((s) => s.complete).length;
  const nextIncomplete = stepStatus.find((s) => !s.complete)?.id ?? null;
  return {
    steps: stepStatus,
    completed,
    total: VERDICT_STEPS.length,
    nextIncomplete,
  };
}

export function aiScopeForStep(stepId: VerdictStepId): 'overall' | 'category' | 'outline' {
  if (stepId === 'expert') return 'outline';
  if (stepId === 'categories') return 'category';
  return 'overall';
}
