// Tester-friendly dropdown labels mapped to scored numeric values.

import type { DefOption } from './presentation';

/** Shared 5-point quality scale → percentage for linear 0–100 scoring (100 = 10/10). */
export const QUALITY_LIKERT_OPTIONS: DefOption[] = [
  { value: 0, label: 'Very bad', description: 'Almost all profiles/photos feel poor' },
  { value: 25, label: 'Bad', description: 'Mostly weak or incomplete' },
  { value: 50, label: 'Neutral', description: 'Mixed — average overall' },
  { value: 75, label: 'Good', description: 'Mostly solid and useful' },
  { value: 100, label: 'Very good', description: 'Consistently strong — 10/10' },
];

export const TESTER_RUBRIC_OPTIONS: Record<string, DefOption[]> = {
  'profile-quality': QUALITY_LIKERT_OPTIONS,
  'visual-quality': QUALITY_LIKERT_OPTIONS,
  'policy-clarity': [
    { value: 0, label: 'Unclear', description: 'Policies leave major questions unanswered' },
    { value: 50, label: 'Neutral', description: 'Some answers clear, others vague or missing' },
    { value: 100, label: 'Very clear', description: 'All key data-use questions answered plainly' },
  ],
  'pricing-clarity': [
    { value: 100, label: 'Very clear', description: 'Costs and limits obvious before checkout' },
    { value: 75, label: 'Clear', description: 'Most pricing details shown upfront' },
    { value: 50, label: 'Normal', description: 'Mixed — some details only appear later' },
    { value: 25, label: 'Unclear', description: 'Important costs or limits are hard to find' },
    { value: 0, label: 'Very unclear', description: 'Pricing feels hidden or misleading' },
  ],
  'support-reach': [
    { value: 10, label: 'Very easy', description: 'Support is obvious and quick to start' },
    { value: 8, label: 'Easy', description: 'Easy for a paying user to reach support' },
    { value: 6, label: 'Normal', description: 'Acceptable but not effortless' },
    { value: 4, label: 'Hard', description: 'Takes effort to find or use support' },
    { value: 2, label: 'Very hard', description: 'Support is buried or unreliable' },
  ],
  'support-speed': [
    { value: 10, label: 'Very fast', description: 'Reply came quickly' },
    { value: 8, label: 'Fast', description: 'Reply felt prompt' },
    { value: 6, label: 'Normal', description: 'Average wait time' },
    { value: 4, label: 'Slow', description: 'Took noticeably long' },
    { value: 2, label: 'Extremely slow', description: 'Very long wait or no timely reply' },
  ],
  'support-helpfulness': [
    { value: 10, label: 'Very helpful', description: 'Fully solved or clearly advanced the issue' },
    { value: 8, label: 'Helpful', description: 'Useful answer with minor gaps' },
    { value: 6, label: 'Normal', description: 'Partially helpful' },
    { value: 4, label: 'Unhelpful', description: 'Generic or off-target reply' },
    { value: 2, label: 'Very unhelpful', description: 'Did not help or made things worse' },
  ],
};

/** Core plan features — tick those included on the normal paid tier without extra payment. */
export const INCLUDED_FEATURES_CHECKLIST_ITEMS = [
  'Standard chat',
  'Character library',
  'Character creation',
  'Image generation',
  'Image editing',
  'Video generation',
  'Voice messages',
  'Voice calls',
  'Memory controls',
  'Message regeneration',
];

/** Same feature list — tick those locked behind a higher tier or extra payment. */
export const PAYWALLS_CHECKLIST_ITEMS = [...INCLUDED_FEATURES_CHECKLIST_ITEMS];

export const NA_OPTION_HIDDEN_SLUGS = new Set([
  'included-features',
  'support-available',
  'support-reach',
  'support-speed',
  'support-helpfulness',
  'paywalls',
  'restrictions',
  ...Object.keys(TESTER_RUBRIC_OPTIONS),
]);

export function allowsNaToggle(def: { slug?: unknown }): boolean {
  return !NA_OPTION_HIDDEN_SLUGS.has(String(def.slug ?? ''));
}

export function nearestRubricValue(slug: string, pct: number): number | undefined {
  const options = TESTER_RUBRIC_OPTIONS[slug];
  if (!options?.length) return undefined;
  let best = options[0];
  let bestDist = Math.abs(Number(best.value) - pct);
  for (const opt of options) {
    const dist = Math.abs(Number(opt.value) - pct);
    if (dist < bestDist) {
      best = opt;
      bestDist = dist;
    }
  }
  return Number(best.value);
}
