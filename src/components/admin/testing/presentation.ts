// Tester-facing presentation layer for evidence definitions.
//
// Evidence definitions carry internal methodology fields (slug, weight,
// scoringRule…) plus optional tester-facing fields (questionLabel,
// testInstructions, options, calculationMethod…). This module derives what the
// tester should see, with safe fallbacks for definitions that only have the
// internal fields — old definitions keep working, they just read less nicely.
//
// Nothing here affects scoring: the engine only ever reads rawValue.value /
// rawValue.status.

import type { EntityRow } from '../api';
import {
  INCLUDED_FEATURES_CHECKLIST_ITEMS,
  PAYWALLS_CHECKLIST_ITEMS,
  TESTER_RUBRIC_OPTIONS,
} from './rubricOptions';
import { SHORT_QUESTIONS } from './shortQuestions';

function shortQuestionKey(categorySlug: string | undefined, def: EntityRow): string | null {
  const cat = categorySlug?.trim().toLowerCase();
  const slug = String(def.slug ?? '').trim();
  if (!cat || !slug) return null;
  return `${cat}|${slug}`;
}

export type ControlKind =
  | 'ynl' // yes / limited / no (+ unable to verify)
  | 'boolean' // yes / no
  | 'number' // count, seconds, currency, scale, plain percentage
  | 'ratio' // numerator + denominator → derived percentage
  | 'checklist' // checks passed → derived percentage
  | 'multi_select' // tick which options exist → derived count
  | 'rubric' // structured levels with descriptions
  | 'select' // enum with defined options
  | 'text'; // free text / structured fallback

export interface RatioConfig {
  kind: 'ratio';
  numeratorLabel: string;
  denominatorLabel: string;
  invert?: boolean;
}

export interface ChecklistConfig {
  kind: 'checklist';
  items: string[];
}

export interface DefOption {
  value: string | number;
  label: string;
  description?: string;
}

/** Strip redundant "Category: " prefix when the session header already names the category. */
function stripCategoryPrefix(q: string, categorySlug?: string): string {
  if (!categorySlug || !q.includes(':')) return q;
  const stripped = q.replace(/^[^:]+:\s*/, '').trim();
  if (!stripped) return q;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

/** Short question label for testers. Prefers the generated short map, then DB label. */
export function testerQuestion(def: EntityRow, categorySlug?: string): string {
  const key = shortQuestionKey(categorySlug, def);
  let q: string;
  if (key && SHORT_QUESTIONS[key]?.q) q = SHORT_QUESTIONS[key].q;
  else {
    const label = typeof def.questionLabel === 'string' ? def.questionLabel.trim() : '';
    q = label || String(def.name ?? '');
  }
  return stripCategoryPrefix(q, categorySlug);
}

/** Plain-English hint for the ? tooltip next to each question. */
export function testerHelpTooltip(def: EntityRow, categorySlug?: string): string | null {
  const key = shortQuestionKey(categorySlug, def);
  if (key && SHORT_QUESTIONS[key]?.hint) return SHORT_QUESTIONS[key].hint;
  const help = typeof def.helpText === 'string' ? def.helpText.trim() : '';
  if (help) return help;
  const desc = typeof def.shortDescription === 'string' ? def.shortDescription.trim() : '';
  const steps = testerInstructions(def);
  if (desc && steps[0]) return `${desc} ${steps[0]}`;
  if (desc) return desc;
  if (steps.length === 1) return steps[0];
  if (steps.length > 1) return steps.join(' ');
  return null;
}

/** Whether this definition still shows its internal name to testers. */
export function usesFallbackLabel(def: EntityRow): boolean {
  return !(typeof def.questionLabel === 'string' && def.questionLabel.trim() !== '');
}

/** Step-by-step instructions: prefers testInstructions, falls back to internalInstructions. */
export function testerInstructions(def: EntityRow): string[] {
  const raw =
    (typeof def.testInstructions === 'string' && def.testInstructions.trim()) ||
    (typeof def.internalInstructions === 'string' && def.internalInstructions.trim()) ||
    '';
  if (!raw) return [];
  return raw
    .split('\n')
    .map((s) => s.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)/, '').trim())
    .filter(Boolean);
}

export function ratioConfig(def: EntityRow): RatioConfig | null {
  const c = def.calculationMethod as RatioConfig | ChecklistConfig | undefined;
  return c && c.kind === 'ratio' ? c : null;
}

const HARDCODED_CHECKLISTS: Record<string, string[]> = {
  'included-features': INCLUDED_FEATURES_CHECKLIST_ITEMS,
  paywalls: PAYWALLS_CHECKLIST_ITEMS,
};

export function checklistConfig(def: EntityRow): ChecklistConfig | null {
  const slug = String(def.slug ?? '');
  const hardcoded = HARDCODED_CHECKLISTS[slug];
  if (hardcoded) {
    return { kind: 'checklist', items: hardcoded };
  }
  const c = def.calculationMethod as RatioConfig | ChecklistConfig | undefined;
  return c && c.kind === 'checklist' && Array.isArray(c.items) && c.items.length > 0 ? c : null;
}

const GENDER_GROUP_OPTIONS: DefOption[] = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Transgender', label: 'Transgender' },
  { value: 'Non-binary', label: 'Non-binary' },
];

export function defOptions(def: EntityRow): DefOption[] {
  const slug = String(def.slug ?? '');
  const custom = TESTER_RUBRIC_OPTIONS[slug];
  if (custom) return custom;
  const existing = Array.isArray(def.options) ? (def.options as DefOption[]) : [];
  if (slug === 'genders') {
    return existing.length > 0 ? existing : GENDER_GROUP_OPTIONS;
  }
  return existing;
}

/** Which input control the tester sees. Derived from measurementType with optional inputType hint. */
const TESTER_RUBRIC_SLUGS = new Set(Object.keys(TESTER_RUBRIC_OPTIONS));

export function controlKind(def: EntityRow): ControlKind {
  const slug = String(def.slug ?? '');
  if (HARDCODED_CHECKLISTS[slug]) return 'checklist';
  if (TESTER_RUBRIC_SLUGS.has(slug)) return 'rubric';
  if (slug === 'genders' && defOptions(def).length > 0) return 'multi_select';
  // Character creator: simple availability checks, not percentage or limited.
  if (slug === 'editing' || slug === 'preview') return 'boolean';

  const hint = typeof def.inputType === 'string' ? def.inputType : '';
  if (hint === 'ratio' && ratioConfig(def)) return 'ratio';
  if (hint === 'checklist' && checklistConfig(def)) return 'checklist';
  if (hint === 'multi_select' && defOptions(def).length > 0) return 'multi_select';
  if (hint === 'rubric' && defOptions(def).length > 0) return 'rubric';

  const mt = String(def.measurementType ?? '');
  const rule = (def.scoringRule ?? {}) as { kind?: string };
  if (mt === 'boolean') return 'boolean';
  if (mt === 'yes_limited_no' || rule.kind === 'ynl') return 'ynl';
  if (mt === 'percentage') {
    if (checklistConfig(def)) return 'checklist';
    if (ratioConfig(def)) return 'ratio';
    return 'number';
  }
  if (['count', 'seconds', 'currency', 'scale'].includes(mt)) return 'number';
  if (mt === 'enum') return defOptions(def).length > 0 ? 'select' : 'text';
  return 'text'; // structured and anything unknown
}

/** Whether the tester may answer "Unable to verify" (stored as status: unknown). */
export function allowsUnableToVerify(def: EntityRow): boolean {
  // Default true — unknown is a first-class outcome in the scoring rules.
  return def.allowUnableToVerify !== false;
}

const UNIT_DEFAULTS: Record<string, string> = {
  percentage: '%',
  seconds: 'seconds',
  currency: 'USD',
};

export function unitLabel(def: EntityRow): string {
  const unit = typeof def.unit === 'string' ? def.unit.trim() : '';
  return unit || UNIT_DEFAULTS[String(def.measurementType ?? '')] || '';
}

/** Render the public result string from the template, e.g. "{value} seconds" → "8.4 seconds". */
export function renderPublicResult(def: EntityRow, value: string | number): string | null {
  const tpl = typeof def.publicResultTemplate === 'string' ? def.publicResultTemplate.trim() : '';
  if (!tpl) return null;
  return tpl.replace(/\{(?:value|result)\}/g, String(value));
}

export interface EvidenceRequirement {
  type: 'screenshot' | 'recording' | 'video' | 'document';
  description: string;
}

export function evidenceRequirements(def: EntityRow): EvidenceRequirement[] {
  return Array.isArray(def.evidenceRequirements)
    ? (def.evidenceRequirements as EvidenceRequirement[])
    : [];
}

// ---------------------------------------------------------------------------
// Methodology completeness — warns editors when a definition lacks the fields
// a guided tester experience needs. Used by the Evidence Definitions admin and
// the migration checklist script.
// ---------------------------------------------------------------------------

export function definitionGaps(def: EntityRow): string[] {
  const gaps: string[] = [];
  if (usesFallbackLabel(def)) gaps.push('No tester-facing question (falls back to internal name)');
  if (testerInstructions(def).length === 0) gaps.push('No testing instructions');
  const mt = String(def.measurementType ?? '');
  if (['count', 'seconds', 'currency', 'scale'].includes(mt) && !unitLabel(def)) {
    gaps.push('No unit label');
  }
  if (mt === 'percentage' && !ratioConfig(def) && !checklistConfig(def)) {
    gaps.push('Percentage has no calculation method — tester must compute it manually');
  }
  if (mt === 'enum' && defOptions(def).length === 0) {
    gaps.push('Enum has no defined options — tester gets a free-text box');
  }
  if (def.required && evidenceRequirements(def).length === 0) {
    gaps.push('No required-proof description');
  }
  return gaps;
}
