// Plan-level allowances / entitlements. Sits above Feature Costs:
// allowances answer "what does this tier already include?";
// feature costs answer "what does overage cost in credits?"

export const PLAN_ACCESS_TYPES = [
  'unlimited',
  'included_quantity',
  'included_credits',
  'pay_as_you_go',
  'not_included',
  'included_unspecified',
] as const;
export type PlanAccessType = (typeof PLAN_ACCESS_TYPES)[number];

export const PLAN_RESET_INTERVALS = [
  'day',
  'week',
  'month',
  'billing_cycle',
  'one_time',
  'none',
] as const;
export type PlanResetInterval = (typeof PLAN_RESET_INTERVALS)[number];

export const AFTER_ALLOWANCE_TYPES = [
  'shared_credits',
  'per_use',
  'unavailable',
  'unknown',
] as const;
export type AfterAllowanceType = (typeof AFTER_ALLOWANCE_TYPES)[number];

export interface PlanAllowanceAfterAllowance {
  type: AfterAllowanceType;
  creditCost?: number;
  unit?: string;
}

export interface PlanAllowance {
  id: string;
  /** Normalized identity for calc (e.g. photo_messages). */
  featureKey: string;
  /** Original screenshot / UI wording. */
  sourceLabel: string;
  accessType: PlanAccessType;
  quantity?: number;
  unit?: string;
  resetInterval?: PlanResetInterval;
  notes?: string;
  evidenceMediaIds?: string[];
  /** What happens after an included allowance is exhausted. */
  afterAllowance?: PlanAllowanceAfterAllowance;
}

/** Canonical keys used by calc + public matrix + AI normalization. */
export const CANONICAL_ALLOWANCE_KEYS = [
  'messages',
  'photo_messages',
  'image_generations',
  'hd_generations',
  'videos',
  'voice_messages',
  'voice_chat',
  'voice_minutes',
  'shared_credits',
  'memory',
  'messaging_speed',
  'personas',
  'custom_companions',
  'customizations',
  'other',
] as const;
export type CanonicalAllowanceKey = (typeof CANONICAL_ALLOWANCE_KEYS)[number];

/** Display labels for public matrix rows (stable order). */
export const ALLOWANCE_ROW_META: Array<{ key: string; label: string }> = [
  { key: 'shared_credits', label: 'Included credits' },
  { key: 'messages', label: 'Messages' },
  { key: 'image_generations', label: 'Generations' },
  { key: 'hd_generations', label: 'HD generations' },
  { key: 'photo_messages', label: 'Photo messages' },
  { key: 'videos', label: 'Video' },
  { key: 'voice_messages', label: 'Voice messages' },
  { key: 'voice_chat', label: 'Voice chat' },
  { key: 'voice_minutes', label: 'Voice minutes' },
  { key: 'memory', label: 'Memory' },
  { key: 'messaging_speed', label: 'Messaging speed' },
  { key: 'personas', label: 'Customized personas' },
  { key: 'custom_companions', label: 'Custom companions' },
  { key: 'customizations', label: 'Customizations' },
];

/** Lightweight review groups (scan-friendly, not a taxonomy explosion). */
export const ALLOWANCE_GROUPS: Array<{ id: string; label: string; keys: string[] }> = [
  {
    id: 'usage',
    label: 'Usage & allowances',
    keys: [
      'shared_credits',
      'messages',
      'photo_messages',
      'image_generations',
      'videos',
      'voice_messages',
      'voice_chat',
      'voice_minutes',
    ],
  },
  {
    id: 'quality',
    label: 'Features & quality',
    keys: ['hd_generations', 'memory', 'messaging_speed'],
  },
  {
    id: 'customization',
    label: 'Customization',
    keys: ['personas', 'custom_companions', 'customizations'],
  },
];

/** Map usage scenario featureTypes → allowance featureKeys. */
export const USAGE_TO_ALLOWANCE_KEYS: Record<string, string[]> = {
  standard_image: ['photo_messages', 'image_generations', 'hd_generations'],
  premium_image: ['photo_messages', 'image_generations', 'hd_generations'],
  hd_image: ['hd_generations', 'image_generations', 'photo_messages'],
  in_chat_image: ['photo_messages', 'image_generations'],
  standard_video: ['videos'],
  premium_video: ['videos'],
  text_to_video: ['videos'],
  image_to_video: ['videos'],
  live_cam_video: ['videos'],
  voice_message: ['voice_messages'],
  voice_call: ['voice_chat', 'voice_minutes'],
  premium_message: ['messages'],
  messages: ['messages'],
};

const LABEL_ALIASES: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /\bhd\s*generations?\b/i, key: 'hd_generations' },
  { pattern: /\b(video\s*(generation|messages?|chat)?|videos?)\b/i, key: 'videos' },
  { pattern: /\b(image\s*)?generations?\b/i, key: 'image_generations' },
  { pattern: /\b(photo|image)\s*messages?\b/i, key: 'photo_messages' },
  { pattern: /\b(ai\s*)?(photos?|images?)\b/i, key: 'photo_messages' },
  { pattern: /\bvoice\s*messages?\b/i, key: 'voice_messages' },
  { pattern: /\bvoice\s*chat\b/i, key: 'voice_chat' },
  { pattern: /\b(voice|call)\s*minutes?\b/i, key: 'voice_minutes' },
  { pattern: /\b(messaging\s*speed|faster\s*messaging|message\s*speed)\b/i, key: 'messaging_speed' },
  { pattern: /\bmessages?\b/i, key: 'messages' },
  { pattern: /\b(advanced\s*)?credits?\b/i, key: 'shared_credits' },
  { pattern: /\b(tokens?|gems?)\b/i, key: 'shared_credits' },
  { pattern: /\b(memory|context)\b/i, key: 'memory' },
  { pattern: /\bcustomizations?\b/i, key: 'customizations' },
  { pattern: /\bpersonas?\b/i, key: 'personas' },
  { pattern: /\b(companions?|fantasies|custom\s*girls?)\b/i, key: 'custom_companions' },
];

export function newAllowanceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `allow_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeAllowanceLabel(label: string): string {
  const text = label.trim();
  if (!text) return 'other';
  // Prefer more specific HD generations before generic generations.
  if (/\bhd\b/i.test(text) && /\bgeneration/i.test(text)) return 'hd_generations';
  for (const { pattern, key } of LABEL_ALIASES) {
    if (pattern.test(text)) return key;
  }
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 60) || 'other'
  );
}

export function isPlanAccessType(v: unknown): v is PlanAccessType {
  return typeof v === 'string' && (PLAN_ACCESS_TYPES as readonly string[]).includes(v);
}

export function isPlanResetInterval(v: unknown): v is PlanResetInterval {
  return typeof v === 'string' && (PLAN_RESET_INTERVALS as readonly string[]).includes(v);
}

function parseLooseNumber(raw: string): number | undefined {
  const n = Number(raw.replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Repair / enrich a raw AI (or stored) allowance so listed benefits are never
 * mis-tagged as "not_included", and quantities/periods are inferred from wording.
 */
export function refineAllowanceFields(input: {
  sourceLabel?: string | null;
  featureKey?: string | null;
  accessType?: string | null;
  quantity?: number | null;
  unit?: string | null;
  resetInterval?: string | null;
  notes?: string | null;
  evidenceMediaIds?: string[] | null;
  id?: string | null;
  afterAllowance?: PlanAllowanceAfterAllowance | null;
}): PlanAllowance {
  const sourceLabel = String(input.sourceLabel ?? '').trim() || 'Feature';
  const lower = sourceLabel.toLowerCase();
  let featureKey = String(input.featureKey ?? '').trim() || normalizeAllowanceLabel(sourceLabel);
  let accessType: PlanAccessType = isPlanAccessType(input.accessType)
    ? input.accessType
    : 'included_unspecified';
  let quantity =
    typeof input.quantity === 'number' && Number.isFinite(input.quantity)
      ? input.quantity
      : undefined;
  let resetInterval: PlanResetInterval | undefined = isPlanResetInterval(input.resetInterval)
    ? input.resetInterval
    : undefined;
  let notes = typeof input.notes === 'string' && input.notes.trim() ? input.notes.trim() : undefined;
  let unit = typeof input.unit === 'string' && input.unit.trim() ? input.unit.trim().slice(0, 40) : undefined;

  const negative =
    /\b(not\s+included|unavailable|not\s+available|does\s+not\s+include|doesn't\s+include|no\s+access|locked)\b/i.test(
      sourceLabel,
    );

  if (/\b\/?\s*day\b|\bdaily\b|\bper\s*day\b/i.test(lower)) resetInterval = resetInterval ?? 'day';
  else if (/\b\/?\s*mo(nth)?\b|\bmonthly\b|\bper\s*month\b/i.test(lower)) {
    resetInterval = resetInterval ?? 'month';
  }

  if (negative && !/\bunlimited\b/i.test(lower)) {
    accessType = 'not_included';
  } else if (/\bunlimited\b/i.test(lower)) {
    accessType = 'unlimited';
    quantity = undefined;
  } else {
    // AI sometimes marks positive checklist items as not_included — never keep that
    // without explicit negative wording.
    if (accessType === 'not_included') accessType = 'included_unspecified';

    const plusMatch = sourceLabel.match(/([\d,.]+)\s*\+/);
    const kContext = sourceLabel.match(/([\d,.]+)\s*k\b/i);
    const qtyInLabel =
      sourceLabel.match(
        /([\d,.]+)\s*(?:messages?|photos?|images?|generations?|personas?|companions?|credits?|videos?|mins?|minutes?|sec)/i,
      ) ?? sourceLabel.match(/^([\d,.]+)\b/);

    if (/faster|messaging\s*speed|message\s*speed/i.test(lower) && !plusMatch) {
      featureKey = 'messaging_speed';
      accessType = 'included_unspecified';
      notes = notes ?? (/faster/i.test(lower) ? 'Faster' : sourceLabel);
      quantity = undefined;
    } else if (kContext && /context|memory/i.test(lower)) {
      featureKey = 'memory';
      accessType = 'included_unspecified';
      notes = notes ?? `${kContext[1]}K context`;
      quantity = undefined;
    } else if (plusMatch) {
      accessType = 'included_unspecified';
      notes = notes ?? `${plusMatch[1]}+`;
      quantity = undefined;
      if (/customization/i.test(lower)) featureKey = 'customizations';
    } else if (quantity != null || qtyInLabel) {
      const q = quantity ?? parseLooseNumber(String(qtyInLabel![1]));
      if (q != null) {
        quantity = q;
        if (featureKey === 'shared_credits' || /\bcredits?\b/i.test(lower)) {
          accessType = 'included_credits';
        } else {
          accessType = 'included_quantity';
        }
        resetInterval = resetInterval ?? 'month';
      }
    } else if (
      accessType !== 'included_quantity' &&
      accessType !== 'included_credits' &&
      accessType !== 'pay_as_you_go' &&
      accessType !== 'unlimited'
    ) {
      // Listed benefit with no amount → included, amount unspecified (NOT not_included).
      accessType = 'included_unspecified';
    }
  }

  return {
    id: String(input.id ?? newAllowanceId()),
    featureKey: featureKey || 'other',
    sourceLabel,
    accessType,
    ...(quantity != null ? { quantity } : {}),
    ...(unit ? { unit } : {}),
    ...(resetInterval ? { resetInterval } : {}),
    ...(notes ? { notes: notes.slice(0, 300) } : {}),
    ...(Array.isArray(input.evidenceMediaIds)
      ? { evidenceMediaIds: input.evidenceMediaIds.map(String) }
      : {}),
    ...(input.afterAllowance ? { afterAllowance: input.afterAllowance } : {}),
  };
}

export function parsePlanAllowances(raw: unknown): PlanAllowance[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanAllowance[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const sourceLabel = String(r.sourceLabel ?? r.label ?? '').trim();
    if (!sourceLabel && !r.featureKey) continue;
    const quantity =
      typeof r.quantity === 'number' && Number.isFinite(r.quantity)
        ? r.quantity
        : typeof r.quantity === 'string' && r.quantity.trim()
          ? Number(r.quantity)
          : undefined;
    out.push({
      ...refineAllowanceFields({
        id: r.id != null ? String(r.id) : undefined,
        sourceLabel: sourceLabel || String(r.featureKey ?? 'Feature'),
        featureKey: r.featureKey != null ? String(r.featureKey) : undefined,
        accessType: typeof r.accessType === 'string' ? r.accessType : undefined,
        quantity,
        unit: typeof r.unit === 'string' ? r.unit : undefined,
        resetInterval: typeof r.resetInterval === 'string' ? r.resetInterval : undefined,
        notes: typeof r.notes === 'string' ? r.notes : undefined,
        evidenceMediaIds: Array.isArray(r.evidenceMediaIds)
          ? r.evidenceMediaIds.map(String)
          : undefined,
        afterAllowance: parseAfterAllowance(r.afterAllowance),
      }),
    });
  }
  return out;
}

function parseAfterAllowance(raw: unknown): PlanAllowanceAfterAllowance | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const type = String(r.type ?? '');
  if (!(AFTER_ALLOWANCE_TYPES as readonly string[]).includes(type)) return undefined;
  const creditCost =
    typeof r.creditCost === 'number' && Number.isFinite(r.creditCost) ? r.creditCost : undefined;
  const unit = typeof r.unit === 'string' && r.unit.trim() ? r.unit.trim().slice(0, 40) : undefined;
  return {
    type: type as AfterAllowanceType,
    ...(creditCost != null ? { creditCost } : {}),
    ...(unit ? { unit } : {}),
  };
}

export function resolveAfterAllowance(allowance: PlanAllowance | undefined): AfterAllowanceType {
  if (allowance?.afterAllowance?.type) return allowance.afterAllowance.type;
  if (allowance?.accessType === 'included_quantity' || allowance?.accessType === 'included_credits') {
    return 'shared_credits';
  }
  return 'unknown';
}

/** Group allowances for review/edit lists. Unknown keys fall into Features & quality. */
export function groupAllowancesForReview(allowances: PlanAllowance[]): Array<{
  id: string;
  label: string;
  rows: PlanAllowance[];
}> {
  const used = new Set<string>();
  const groups = ALLOWANCE_GROUPS.map((g) => {
    const rows = allowances.filter((a) => g.keys.includes(a.featureKey));
    for (const r of rows) used.add(r.id);
    return { id: g.id, label: g.label, rows };
  }).filter((g) => g.rows.length > 0);

  const leftover = allowances.filter((a) => !used.has(a.id));
  if (leftover.length > 0) {
    const quality = groups.find((g) => g.id === 'quality');
    if (quality) quality.rows.push(...leftover);
    else groups.push({ id: 'quality', label: 'Features & quality', rows: leftover });
  }
  return groups;
}

export interface PlanAllowanceSource {
  name?: string | null;
  allowances?: unknown;
  includedTokens?: number | null;
  includedImages?: number | null;
  includedVideos?: number | null;
  includedVoiceMinutes?: number | null;
  unlimitedFeatures?: unknown;
}

function numOrUndef(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Resolve allowances for a plan.
 * Prefer stored `allowances`; otherwise synthesize from legacy scalars so
 * Candy-style products keep working with zero migrations.
 */
export function resolvePlanAllowances(plan: PlanAllowanceSource): PlanAllowance[] {
  const stored = parsePlanAllowances(plan.allowances);
  if (stored.length > 0) return stored;

  const synthesized: PlanAllowance[] = [];
  const tokens = numOrUndef(plan.includedTokens);
  if (tokens != null && tokens > 0) {
    synthesized.push({
      id: 'legacy_shared_credits',
      featureKey: 'shared_credits',
      sourceLabel: 'Included credits',
      accessType: 'included_credits',
      quantity: tokens,
      unit: 'credit',
      resetInterval: 'month',
    });
  }
  const images = numOrUndef(plan.includedImages);
  if (images != null && images > 0) {
    synthesized.push({
      id: 'legacy_images',
      featureKey: 'photo_messages',
      sourceLabel: 'Images',
      accessType: 'included_quantity',
      quantity: images,
      unit: 'image',
      resetInterval: 'month',
    });
  }
  const videos = numOrUndef(plan.includedVideos);
  if (videos != null && videos > 0) {
    synthesized.push({
      id: 'legacy_videos',
      featureKey: 'videos',
      sourceLabel: 'Videos',
      accessType: 'included_quantity',
      quantity: videos,
      unit: 'video',
      resetInterval: 'month',
    });
  }
  const voice = numOrUndef(plan.includedVoiceMinutes);
  if (voice != null && voice > 0) {
    synthesized.push({
      id: 'legacy_voice',
      featureKey: 'voice_minutes',
      sourceLabel: 'Voice minutes',
      accessType: 'included_quantity',
      quantity: voice,
      unit: 'minute',
      resetInterval: 'month',
    });
  }
  if (Array.isArray(plan.unlimitedFeatures)) {
    for (const label of plan.unlimitedFeatures) {
      const text = String(label ?? '').trim();
      if (!text) continue;
      synthesized.push({
        id: `legacy_unlimited_${normalizeAllowanceLabel(text)}`,
        featureKey: normalizeAllowanceLabel(text),
        sourceLabel: text,
        accessType: 'unlimited',
      });
    }
  }
  return synthesized;
}

/** True when the plan has explicit stored allowances (not only legacy synthesis). */
export function hasExplicitAllowances(plan: PlanAllowanceSource): boolean {
  return parsePlanAllowances(plan.allowances).length > 0;
}

export function findAllowance(
  allowances: PlanAllowance[],
  featureKeys: string | string[],
): PlanAllowance | undefined {
  const keys = Array.isArray(featureKeys) ? featureKeys : [featureKeys];
  for (const key of keys) {
    const hit = allowances.find((a) => a.featureKey === key);
    if (hit) return hit;
  }
  return undefined;
}

export function formatAllowanceCell(a: PlanAllowance | undefined): string {
  if (!a) return '—';
  switch (a.accessType) {
    case 'unlimited':
      return 'Unlimited';
    case 'not_included':
      return '—';
    case 'pay_as_you_go':
      return 'Credits';
    case 'included_unspecified':
      return 'Included';
    case 'included_credits': {
      const q = a.quantity;
      if (q == null) return 'Credits included';
      const period =
        a.resetInterval === 'day' ? '/ day' : a.resetInterval === 'month' || !a.resetInterval ? '/ mo' : '';
      return `${q}${period ? ` ${period.trim()}` : ''}`.replace('  ', ' ');
    }
    case 'included_quantity': {
      const q = a.quantity;
      if (q == null) return 'Included';
      const period =
        a.resetInterval === 'day'
          ? '/ day'
          : a.resetInterval === 'week'
            ? '/ wk'
          : a.resetInterval === 'billing_cycle'
            ? '/ cycle'
            : a.resetInterval === 'one_time'
              ? ''
              : '/ mo';
      const base = period ? `${q} ${period.trim()}` : String(q);
      const after = a.afterAllowance?.type ?? resolveAfterAllowance(a);
      if (after === 'unavailable') return `${base} · cap`;
      if (after === 'per_use' && a.afterAllowance?.creditCost != null) {
        const unit = (a.afterAllowance.unit ?? 'use').replace(/^per_/, '');
        return `${base} · then ${a.afterAllowance.creditCost}/${unit}`;
      }
      if (after === 'shared_credits') return `${base} · then credits`;
      if (after === 'unknown') return `${base} · then unknown`;
      return base;
    }
    default:
      return '—';
  }
}

/** Human-facing benefit name for review cards. */
export function allowanceDisplayLabel(a: PlanAllowance): string {
  const meta = ALLOWANCE_ROW_META.find((m) => m.key === a.featureKey);
  if (meta) return meta.label;
  const label = a.sourceLabel.trim();
  if (label) return label;
  return a.featureKey.replace(/_/g, ' ');
}

/** Rows the reviewer should double-check (uncertain / incomplete extraction). */
export function allowanceNeedsReview(a: PlanAllowance): boolean {
  if (!a.sourceLabel.trim()) return true;
  if (a.accessType === 'not_included') return true;
  if (
    (a.accessType === 'included_quantity' || a.accessType === 'included_credits') &&
    (a.quantity == null || !Number.isFinite(a.quantity))
  ) {
    return true;
  }
  return false;
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString('en-US') : String(n);
}

/**
 * Compact badge text for review UI — quantities, Unlimited, Included, etc.
 * Prefer notes / rich source wording when the amount is unspecified.
 */
export function formatAllowanceReviewBadge(a: PlanAllowance): string {
  switch (a.accessType) {
    case 'unlimited':
      return 'Unlimited';
    case 'not_included':
      return 'Not included';
    case 'pay_as_you_go':
      return 'Pay as you go';
    case 'included_unspecified': {
      const note = a.notes?.trim();
      if (note) return note;
      const src = a.sourceLabel.trim();
      if (src && (/\d/.test(src) || /\+/.test(src) || /faster|context/i.test(src))) {
        // Prefer compact readable fragment over raw "9000 Messages/Mo".
        const plus = src.match(/([\d,.]+)\s*\+/);
        if (plus) return `${plus[1]}+`;
        const k = src.match(/([\d,.]+)\s*k\b/i);
        if (k && /context|memory/i.test(src)) return `${k[1]}K context`;
        if (/faster/i.test(src)) return 'Faster';
        return src;
      }
      return 'Included';
    }
    case 'included_credits': {
      if (a.quantity == null) return 'Credits · amount unknown';
      const period =
        a.resetInterval === 'day' ? ' / day' : a.resetInterval === 'month' || !a.resetInterval ? ' / mo' : '';
      return `${formatQty(a.quantity)} credits${period}`;
    }
    case 'included_quantity': {
      if (a.quantity == null) return 'Included · amount unknown';
      const period =
        a.resetInterval === 'day'
          ? ' / day'
          : a.resetInterval === 'billing_cycle'
            ? ' / cycle'
            : a.resetInterval === 'one_time' || a.resetInterval === 'none'
              ? ''
              : ' / month';
      return `${formatQty(a.quantity)}${period}`;
    }
    default:
      return formatAllowanceCell(a);
  }
}

export function countAllowancesNeedingReview(allowances: PlanAllowance[]): number {
  return allowances.filter(allowanceNeedsReview).length;
}

/** Soft-sync legacy scalar fields from allowances for older readers. */
export function legacyFieldsFromAllowances(allowances: PlanAllowance[]): {
  includedTokens?: number;
  includedImages?: number;
  includedVideos?: number;
  includedVoiceMinutes?: number;
  unlimitedFeatures?: string[];
} {
  const out: {
    includedTokens?: number;
    includedImages?: number;
    includedVideos?: number;
    includedVoiceMinutes?: number;
    unlimitedFeatures?: string[];
  } = {};
  const unlimited: string[] = [];
  for (const a of allowances) {
    if (a.accessType === 'unlimited') {
      unlimited.push(a.sourceLabel || a.featureKey);
      continue;
    }
    if (a.accessType === 'included_credits' && a.featureKey === 'shared_credits' && a.quantity != null) {
      out.includedTokens = a.quantity;
    }
    if (a.accessType === 'included_quantity' && a.quantity != null) {
      if (a.featureKey === 'photo_messages' || a.featureKey === 'image_generations') {
        out.includedImages = Math.max(out.includedImages ?? 0, a.quantity);
      }
      if (a.featureKey === 'videos') out.includedVideos = a.quantity;
      if (a.featureKey === 'voice_minutes') out.includedVoiceMinutes = a.quantity;
    }
  }
  if (unlimited.length) out.unlimitedFeatures = unlimited;
  return out;
}

/** Normalize monthly quantity from day/month reset intervals for scenario math. */
export function monthlyQuantityFromAllowance(a: PlanAllowance): number | null {
  if (a.accessType !== 'included_quantity' && a.accessType !== 'included_credits') return null;
  if (a.quantity == null || !Number.isFinite(a.quantity)) return null;
  if (a.resetInterval === 'day') return a.quantity * 30;
  if (a.resetInterval === 'week') return Math.round((a.quantity * 30) / 7);
  return a.quantity;
}

export const ACCESS_TYPE_LABELS: Record<PlanAccessType, string> = {
  unlimited: 'Unlimited',
  included_quantity: 'Included quantity',
  included_credits: 'Included credits',
  pay_as_you_go: 'Pay as you go',
  not_included: 'Not included',
  included_unspecified: 'Included',
};

export const RESET_INTERVAL_LABELS: Record<PlanResetInterval, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
  billing_cycle: 'Per billing cycle',
  one_time: 'Total',
  none: 'None',
};
