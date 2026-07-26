// Automatic score calculation.
//
//   Evidence results -> subscores -> category scores -> overall score
//
// Rules (from the rating methodology):
// - Every evidence value is normalized to a 0-10 internal score using the
//   evidence definition's scoring rule.
// - "Unknown" must NOT be treated as Yes (it scores via the rule's unknown
//   value, default 0).
// - "Not Applicable" evidence is removed and the remaining evidence weights
//   within the subscore are re-scaled proportionally.
// - Manual overrides require a reason and are surfaced in the calculation
//   details; they never silently replace values.

export const CALCULATION_VERSION = 'calc-1.0';

export type ScoringRule =
  | { kind: 'linear'; min: number; max: number; invert?: boolean }
  | { kind: 'bands'; bands: { upTo: number; score: number }[] }
  | { kind: 'ynl'; yes: number; limited: number; no: number; unknown: number }
  | { kind: 'manual' };

export type RawValue =
  | { value: number }
  | { status: 'yes' | 'limited' | 'no' | 'unknown' | 'na' }
  | { text: string }
  | { structured: Record<string, unknown> };

export interface EvidenceInput {
  definitionId: string;
  slug: string;
  name: string;
  subscoreSlug: string;
  categorySlug: string;
  weight: number; // % within subscore
  required: boolean;
  measurementType: string;
  scoringRule: ScoringRule;
  // result (may be missing entirely)
  resultId?: string;
  rawValue?: RawValue;
  notApplicable?: boolean;
  isUnknown?: boolean;
  manualOverrideScore?: number;
  manualOverrideReason?: string;
}

export interface SubscoreInput {
  slug: string;
  name: string;
  categorySlug: string;
  weight: number; // % within category
}

export interface CategoryInput {
  slug: string;
  name: string;
  weight: number; // % of overall
}

export interface EvidenceComputed {
  definitionId: string;
  slug: string;
  name: string;
  subscoreSlug: string;
  categorySlug: string;
  required: boolean;
  status: 'scored' | 'missing' | 'na' | 'unknown' | 'needs_manual';
  normalizedScore: number | null;
  effectiveWeight: number | null; // after NA re-scaling, % within subscore
  overridden: boolean;
  detail: string;
}

export interface ScoreTree {
  overall: number | null;
  categories: {
    slug: string;
    name: string;
    weight: number;
    score: number | null;
    subscores: {
      slug: string;
      name: string;
      weight: number;
      score: number | null;
      evidence: EvidenceComputed[];
    }[];
  }[];
  blockingErrors: string[];
  warnings: string[];
  calculationVersion: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp10 = (n: number) => Math.max(0, Math.min(10, n));

/** Normalize one evidence value to 0-10 (null = cannot score). */
export function normalizeEvidence(input: EvidenceInput): {
  score: number | null;
  status: EvidenceComputed['status'];
  detail: string;
} {
  // Manual override wins (audited elsewhere; reason required at write time).
  if (input.manualOverrideScore !== undefined && input.manualOverrideScore !== null) {
    return {
      score: clamp10(input.manualOverrideScore),
      status: 'scored',
      detail: `Manual override: ${input.manualOverrideScore} (${input.manualOverrideReason ?? 'no reason recorded'})`,
    };
  }

  if (input.notApplicable || (input.rawValue && 'status' in input.rawValue && input.rawValue.status === 'na')) {
    return { score: null, status: 'na', detail: 'Not applicable — removed, weights re-scaled' };
  }

  if (!input.rawValue) {
    return { score: null, status: 'missing', detail: 'No result entered' };
  }

  const rule = input.scoringRule;

  // Yes/Limited/No/Unknown statuses
  if ('status' in input.rawValue) {
    const status = input.rawValue.status;
    if (rule.kind === 'ynl') {
      const map: Record<string, number> = {
        yes: rule.yes,
        limited: rule.limited,
        no: rule.no,
        unknown: rule.unknown,
      };
      const score = map[status];
      if (score === undefined) return { score: null, status: 'missing', detail: `Unmapped status "${status}"` };
      return {
        score: clamp10(score),
        status: status === 'unknown' ? 'unknown' : 'scored',
        detail: `${status} -> ${score}/10`,
      };
    }
    // Status result against a non-ynl rule: treat unknown as unscorable-but-counted
    if (status === 'unknown') {
      return { score: 0, status: 'unknown', detail: 'Unknown — scored 0 (never treated as Yes)' };
    }
    return { score: null, status: 'missing', detail: `Status "${status}" needs a ynl scoring rule` };
  }

  if ('value' in input.rawValue) {
    const raw = input.rawValue.value;
    if (typeof raw !== 'number' || Number.isNaN(raw)) {
      return { score: null, status: 'missing', detail: 'Raw value is not a number' };
    }
    switch (rule.kind) {
      case 'linear': {
        const { min, max, invert } = rule;
        if (max === min) return { score: null, status: 'missing', detail: 'Invalid linear rule (min == max)' };
        let t = (raw - min) / (max - min);
        t = Math.max(0, Math.min(1, t));
        if (invert) t = 1 - t;
        const score = round2(t * 10);
        return { score, status: 'scored', detail: `linear(${min}..${max}${invert ? ', inverted' : ''}): ${raw} -> ${score}` };
      }
      case 'bands': {
        const sorted = [...rule.bands].sort((a, b) => a.upTo - b.upTo);
        const band = sorted.find((b) => raw <= b.upTo) ?? sorted[sorted.length - 1];
        return {
          score: clamp10(band.score),
          status: 'scored',
          detail: `bands: ${raw} -> ${band.score} (band ≤ ${band.upTo})`,
        };
      }
      case 'manual':
        return { score: null, status: 'needs_manual', detail: 'Manual scoring rule — tester must set a score' };
      case 'ynl':
        return { score: null, status: 'missing', detail: 'Numeric value given but rule expects yes/limited/no' };
    }
  }

  // text / structured values
  if (rule.kind === 'manual') {
    return { score: null, status: 'needs_manual', detail: 'Structured result — needs manual score' };
  }
  return { score: null, status: 'missing', detail: 'Result format does not match scoring rule' };
}

/**
 * Compute the full score tree. Pure function — callers provide the
 * methodology tree and evidence inputs, and persist snapshots themselves.
 */
export function computeScores(
  categories: CategoryInput[],
  subscoresIn: SubscoreInput[],
  evidence: EvidenceInput[],
): ScoreTree {
  const blockingErrors: string[] = [];
  const warnings: string[] = [];

  const evidenceComputed: EvidenceComputed[] = evidence.map((e) => {
    const { score, status, detail } = normalizeEvidence(e);
    return {
      definitionId: e.definitionId,
      slug: e.slug,
      name: e.name,
      subscoreSlug: e.subscoreSlug,
      categorySlug: e.categorySlug,
      required: e.required,
      status,
      normalizedScore: score,
      effectiveWeight: null,
      overridden: e.manualOverrideScore !== undefined && e.manualOverrideScore !== null,
      detail,
    };
  });

  // Blocking: required evidence missing or needing manual scores
  const missingRequired = evidenceComputed.filter(
    (e) => e.required && (e.status === 'missing' || e.status === 'needs_manual'),
  );
  if (missingRequired.length > 0) {
    blockingErrors.push(
      `Cannot publish: ${missingRequired.length} required question${missingRequired.length === 1 ? '' : 's'} still unanswered (${missingRequired
        .slice(0, 6)
        .map((e) => e.name)
        .join(', ')}${missingRequired.length > 6 ? '…' : ''}).`,
    );
  }

  const categoriesOut = categories
    .slice()
    .sort((a, b) => a.weight - b.weight)
    .map((cat) => {
      const catSubscores = subscoresIn.filter((s) => s.categorySlug === cat.slug);
      const subscoresOut = catSubscores.map((sub) => {
        const subEvidence = evidenceComputed.filter(
          (e) => e.subscoreSlug === sub.slug && e.categorySlug === cat.slug,
        );

        // NA removal + proportional re-weighting
        const scorable = subEvidence.filter((e) => e.normalizedScore !== null);
        const totalWeight = scorable.reduce((sum, e) => {
          const def = evidence.find((d) => d.definitionId === e.definitionId)!;
          return sum + def.weight;
        }, 0);

        let score: number | null = null;
        if (scorable.length > 0 && totalWeight > 0) {
          let acc = 0;
          for (const e of scorable) {
            const def = evidence.find((d) => d.definitionId === e.definitionId)!;
            const effective = (def.weight / totalWeight) * 100;
            e.effectiveWeight = round2(effective);
            acc += (e.normalizedScore! * effective) / 100;
          }
          score = round1(acc);
        }

        if (subEvidence.some((e) => e.status === 'unknown')) {
          warnings.push(`${cat.name} / ${sub.name}: contains "Unknown" results (scored 0-per-rule, never as Yes).`);
        }

        return {
          slug: sub.slug,
          name: sub.name,
          weight: sub.weight,
          score,
          evidence: subEvidence,
        };
      });

      const scored = subscoresOut.filter((s) => s.score !== null);
      const subWeightTotal = scored.reduce((sum, s) => sum + s.weight, 0);
      let catScore: number | null = null;
      if (scored.length > 0 && subWeightTotal > 0) {
        const acc = scored.reduce((sum, s) => sum + (s.score! * s.weight) / subWeightTotal, 0);
        catScore = round1(acc);
      }
      if (scored.length < subscoresOut.length && scored.length > 0) {
        warnings.push(
          `${cat.name}: ${subscoresOut.length - scored.length} subscore(s) have no scorable evidence and were excluded.`,
        );
      }

      return {
        slug: cat.slug,
        name: cat.name,
        weight: cat.weight,
        score: catScore,
        subscores: subscoresOut,
      };
    })
    .sort((a, b) => categories.findIndex((c) => c.slug === a.slug) - categories.findIndex((c) => c.slug === b.slug));

  const scoredCats = categoriesOut.filter((c) => c.score !== null);
  const catWeightTotal = scoredCats.reduce((sum, c) => sum + c.weight, 0);
  let overall: number | null = null;
  if (scoredCats.length > 0 && catWeightTotal > 0) {
    overall = round1(scoredCats.reduce((sum, c) => sum + (c.score! * c.weight) / catWeightTotal, 0));
  }
  if (scoredCats.length < categoriesOut.length) {
    const missing = categoriesOut.filter((c) => c.score === null).map((c) => c.name);
    if (missing.length > 0) {
      blockingErrors.push(`Categories without any scorable evidence: ${missing.join(', ')}.`);
    }
  }

  return {
    overall,
    categories: categoriesOut,
    blockingErrors,
    warnings,
    calculationVersion: CALCULATION_VERSION,
  };
}
