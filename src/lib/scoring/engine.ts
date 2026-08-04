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
  | { value: number; detail?: Record<string, unknown> }
  | { status: 'yes' | 'limited' | 'optional' | 'no' | 'unknown' | 'na'; detail?: Record<string, unknown> }
  | { text: string; detail?: Record<string, unknown> }
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
  /** Sibling answers for conditional scoring (e.g. chat-modes count gates mode-types). */
  relatedAnswers?: Record<string, RawValue | undefined>;
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

const RESOLUTION_SCORES: Record<string, number> = {
  '480p': 4,
  '720p': 6,
  '1080p': 8,
  '4k': 10,
};

const MODE_RATING_SCORES: Record<string, number> = {
  good: 10,
  partial: 5,
  poor: 0,
};

/** Absent = excluded from score; present = bonus points. */
export const BONUS_ONLY_SLUGS = new Set(['live-cam']);

const EDITORIAL_SLUGS = new Set(['support-channels', 'support-available']);

const SUPPORT_RATING_SLUGS = new Set(['support-reach', 'support-speed', 'support-helpfulness']);

function supportOffered(related?: Record<string, RawValue | undefined>): boolean | null {
  const raw = related?.['support-available'];
  if (!raw || typeof raw !== 'object' || !('status' in raw)) return null;
  if (raw.status === 'yes') return true;
  if (raw.status === 'no') return false;
  return null;
}

function chatModesCount(related?: Record<string, RawValue | undefined>): number | null {
  const chatRaw = related?.['chat-modes'];
  if (!chatRaw || typeof chatRaw !== 'object' || !('status' in chatRaw)) return null;
  if (chatRaw.status === 'no') return 0;
  if (chatRaw.status !== 'yes') return null;
  const detail = 'detail' in chatRaw ? (chatRaw.detail as Record<string, unknown> | undefined) : undefined;
  return typeof detail?.count === 'number' ? detail.count : null;
}

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

  if (input.slug === 'mode-types') {
    const chatRaw = input.relatedAnswers?.['chat-modes'];
    if (
      chatRaw &&
      typeof chatRaw === 'object' &&
      'status' in chatRaw &&
      chatRaw.status === 'na'
    ) {
      return {
        score: null,
        status: 'na',
        detail: 'Chat modes not applicable — mode quality excluded from score',
      };
    }
  }

  if (
    input.rawValue &&
    typeof input.rawValue === 'object' &&
    'detail' in input.rawValue &&
    (input.rawValue.detail as Record<string, unknown> | undefined)?.notPossible === true
  ) {
    return { score: 0, status: 'scored', detail: 'Feature not available — scored 0/10' };
  }

  if (input.slug === 'platform-extras-list') {
    if (!input.rawValue || !('structured' in input.rawValue)) {
      return {
        score: null,
        status: 'na',
        detail: 'No bonus features recorded — excluded from score (no penalty)',
      };
    }
    const structured = (input.rawValue as { structured?: Record<string, unknown> }).structured;
    if (structured?.hasBonus === 'no') {
      return {
        score: null,
        status: 'na',
        detail: 'No bonus features — excluded from score (no penalty)',
      };
    }
    if (structured?.hasBonus === 'yes') {
      const extras = Array.isArray(structured.extras) ? structured.extras : [];
      const named = extras.filter((row) => String((row as { name?: string }).name ?? '').trim());
      if (named.length > 0) {
        return {
          score: 10,
          status: 'scored',
          detail: `${named.length} bonus feature(s) — bonus 10/10`,
        };
      }
      return {
        score: null,
        status: 'na',
        detail: 'No named bonus features — excluded from score (no penalty)',
      };
    }
    return {
      score: null,
      status: 'na',
      detail: 'Bonus features not answered — excluded from score (no penalty)',
    };
  }

  if (input.slug === 'edit-memories') {
    const saveRaw = input.relatedAnswers?.['save-memories'];
    if (saveRaw && 'status' in saveRaw && saveRaw.status === 'no') {
      return {
        score: 0,
        status: 'scored',
        detail: 'Save memories unavailable — edit memories scored 0/10',
      };
    }
  }

  if (EDITORIAL_SLUGS.has(input.slug)) {
    if (!input.rawValue) {
      if (input.slug === 'support-available') {
        return { score: null, status: 'missing', detail: 'Support availability required' };
      }
      return { score: null, status: 'na', detail: 'Optional notes — excluded from score' };
    }
    if (input.slug === 'support-available' && 'status' in input.rawValue) {
      const st = input.rawValue.status;
      return {
        score: null,
        status: 'na',
        detail: st === 'yes' ? 'Support available — rated separately' : 'No support offered',
      };
    }
    return { score: null, status: 'na', detail: 'Reference notes — excluded from score' };
  }

  if (SUPPORT_RATING_SLUGS.has(input.slug)) {
    const offered = supportOffered(input.relatedAnswers);
    if (offered === false) {
      return { score: null, status: 'na', detail: 'No support — excluded from score' };
    }
  }

  if (input.slug === 'mode-types') {
    const modeCount = chatModesCount(input.relatedAnswers);
    if (modeCount !== null && modeCount <= 1) {
      return {
        score: null,
        status: 'na',
        detail:
          modeCount === 0
            ? 'No chat modes — mode quality excluded from score'
            : 'Only one chat mode — mode quality excluded (requires 2+ modes)',
      };
    }
  }

  if (!input.rawValue) {
    if (input.slug === 'mode-types') {
      const modeCount = chatModesCount(input.relatedAnswers);
      if (modeCount !== null && modeCount > 1) {
        return { score: null, status: 'missing', detail: 'Rate two chat modes when 2+ modes exist' };
      }
    }
    return { score: null, status: 'missing', detail: 'No result entered' };
  }

  const raw = input.rawValue;
  const rule = input.scoringRule;

  if (
    'text' in raw &&
    typeof raw.text === 'string' &&
    (input.slug === 'resolution' || input.slug === 'maximum-resolution')
  ) {
    const score = RESOLUTION_SCORES[raw.text.trim().toLowerCase()];
    if (score === undefined) {
      return { score: null, status: 'missing', detail: `Unknown resolution "${raw.text}"` };
    }
    return { score: clamp10(score), status: 'scored', detail: `${raw.text} -> ${score}/10` };
  }

  if (input.slug === 'mode-types') {
    const modeCount = chatModesCount(input.relatedAnswers);
    if (modeCount === null) {
      return { score: null, status: 'missing', detail: 'Chat mode count required before rating modes' };
    }
    if (!('structured' in raw)) {
      return { score: null, status: 'missing', detail: 'Rate two chat modes when 2+ modes exist' };
    }
    const modes = (raw.structured as { modes?: Array<{ rating?: string }> }).modes;
    if (!Array.isArray(modes) || modes.length === 0) {
      return { score: null, status: 'missing', detail: 'Mode ratings incomplete' };
    }
    const scores = modes
      .map((m) => MODE_RATING_SCORES[String(m.rating ?? '').toLowerCase()])
      .filter((n) => n !== undefined);
    if (scores.length === 0) {
      return { score: null, status: 'missing', detail: 'Mode ratings incomplete' };
    }
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      score: clamp10(round1(avg)),
      status: 'scored',
      detail: `${modes.length} mode(s) rated (${modeCount} available) -> avg ${round1(avg)}/10`,
    };
  }

  if (input.slug === 'chat-modes' && 'status' in raw && raw.status === 'no') {
    return { score: 0, status: 'scored', detail: 'No chat modes -> 0/10' };
  }

  if (input.slug === 'chat-modes' && 'status' in raw && raw.status === 'yes') {
    const detail = 'detail' in raw ? (raw.detail as Record<string, unknown> | undefined) : undefined;
    const count = typeof detail?.count === 'number' ? detail.count : null;
    if (count === null || rule.kind !== 'bands') {
      return { score: null, status: 'missing', detail: 'Chat mode count required when Yes' };
    }
    const sorted = [...rule.bands].sort((a, b) => a.upTo - b.upTo);
    const band = sorted.find((b) => count <= b.upTo) ?? sorted[sorted.length - 1];
    return {
      score: clamp10(band.score),
      status: 'scored',
      detail: `${count} mode(s) -> ${band.score}/10`,
    };
  }

  // Yes/Limited/No/Unknown statuses
  if ('status' in raw) {
    const status = raw.status;

    if (input.slug === 'free-value' && status === 'no') {
      return { score: 0, status: 'scored', detail: 'No meaningful free access — 0/10' };
    }

    if (BONUS_ONLY_SLUGS.has(input.slug)) {
      if (status === 'no') {
        return {
          score: null,
          status: 'na',
          detail: 'Not offered — excluded from score (no penalty)',
        };
      }
      if (status === 'yes') {
        return { score: 10, status: 'scored', detail: 'Available — bonus 10/10' };
      }
      if (status === 'limited') {
        return { score: 6, status: 'scored', detail: 'Limited availability — bonus 6/10' };
      }
    }

    if (rule.kind === 'ynl') {
      const map: Record<string, number> = {
        yes: rule.yes,
        optional: rule.yes,
        limited: rule.limited,
        no: rule.no,
        unknown: rule.unknown,
      };
      if (status === 'unknown' && input.categorySlug === 'privacy') {
        return { score: null, status: 'unknown', detail: 'Unknown — excluded from score' };
      }
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
    // Boolean yes/no stored as status when scoring rule was not migrated yet.
    if (
      (input.measurementType === 'boolean' ||
        input.slug === 'encryption' ||
        input.slug === 'editing') &&
      (status === 'yes' || status === 'no')
    ) {
      const score = status === 'yes' ? 10 : 0;
      return { score, status: 'scored', detail: `${status} -> ${score}/10 (boolean)` };
    }
    return { score: null, status: 'missing', detail: `Status "${status}" needs a ynl scoring rule` };
  }

  if ('value' in raw) {
    const num = raw.value;
    if (typeof num !== 'number' || Number.isNaN(num)) {
      return { score: null, status: 'missing', detail: 'Raw value is not a number' };
    }
    switch (rule.kind) {
      case 'linear': {
        const { min, max, invert } = rule;
        if (max === min) return { score: null, status: 'missing', detail: 'Invalid linear rule (min == max)' };
        let t = (num - min) / (max - min);
        t = Math.max(0, Math.min(1, t));
        if (invert) t = 1 - t;
        const score = round2(t * 10);
        return { score, status: 'scored', detail: `linear(${min}..${max}${invert ? ', inverted' : ''}): ${num} -> ${score}` };
      }
      case 'bands': {
        const sorted = [...rule.bands].sort((a, b) => a.upTo - b.upTo);
        const band = sorted.find((b) => num <= b.upTo) ?? sorted[sorted.length - 1];
        return {
          score: clamp10(band.score),
          status: 'scored',
          detail: `bands: ${num} -> ${band.score} (band ≤ ${band.upTo})`,
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

  function hasRecordedAnswer(input: EvidenceInput): boolean {
    if (input.notApplicable) return true;
    return input.rawValue !== undefined && input.rawValue !== null;
  }

  // Block only when required evidence has no recorded answer. Manual-scoring
  // items with an answer count as complete for publish — they may still need a
  // 0–10 override before they contribute to the calculated score.
  const missingRequired = evidenceComputed.filter((e, i) => {
    if (!e.required) return false;
    const input = evidence[i];
    if (e.status === 'missing') return true;
    if (e.status === 'needs_manual' && !hasRecordedAnswer(input)) return true;
    return false;
  });
  if (missingRequired.length > 0) {
    blockingErrors.push(
      `Cannot publish: ${missingRequired.length} required question${missingRequired.length === 1 ? '' : 's'} still unanswered (${missingRequired
        .slice(0, 6)
        .map((e) => e.name)
        .join(', ')}${missingRequired.length > 6 ? '…' : ''}).`,
    );
  }

  const pendingManualScores = evidenceComputed.filter(
    (e, i) => e.required && e.status === 'needs_manual' && hasRecordedAnswer(evidence[i]),
  );
  if (pendingManualScores.length > 0) {
    warnings.push(
      `${pendingManualScores.length} answer${pendingManualScores.length === 1 ? '' : 's'} recorded but not yet scored (manual review): ${pendingManualScores
        .slice(0, 4)
        .map((e) => e.name)
        .join(', ')}${pendingManualScores.length > 4 ? '…' : ''}.`,
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
