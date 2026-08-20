// Group feature-cost rows into editor families (Standard image, Video, etc.)
// and format variant summaries for compact admin display.

import { creditsPerDisplayUse, featureCostRange, type CostRange, type FeatureCostLike } from './calc';

export const UNIT_LABELS: Record<string, string> = {
  per_image: 'per image',
  per_batch: 'per batch',
  per_message: 'per message',
  per_minute: 'per minute',
  per_second: 'per second',
  per_video: 'per video',
  per_generation: 'per generation',
  per_unlock: 'per unlock',
  per_request: 'per request',
  per_character: 'per character',
  per_creation: 'per creation',
  custom: 'custom',
};

export interface FeatureCostFamilyDef {
  key: string;
  label: string;
  featureTypes: readonly string[];
  defaultFeatureType: string;
  defaultUnit: string;
  unitOptions: readonly string[];
}

export const EXTRACT_FEATURE_CATEGORIES = [
  'chat_message',
  'standard_image',
  'video_generation',
  'voice_message',
  'voice_call',
  'character_creation',
  'custom',
] as const;

export type ExtractFeatureCategory = (typeof EXTRACT_FEATURE_CATEGORIES)[number];

export const FEATURE_COST_FAMILIES: readonly FeatureCostFamilyDef[] = [
  {
    key: 'chat_message',
    label: 'Chat',
    featureTypes: ['chat_message', 'text_message', 'message'],
    defaultFeatureType: 'chat_message',
    defaultUnit: 'per_message',
    unitOptions: ['per_message', 'per_request'],
  },
  {
    key: 'standard_image',
    label: 'Image generation',
    featureTypes: [
      'standard_image',
      'premium_image',
      'hd_image',
      'image_regeneration',
      'image_unlock',
      'in_chat_image',
    ],
    defaultFeatureType: 'standard_image',
    defaultUnit: 'per_image',
    unitOptions: ['per_image', 'per_batch', 'per_message'],
  },
  {
    key: 'voice_message',
    label: 'Voice message',
    featureTypes: ['voice_message'],
    defaultFeatureType: 'voice_message',
    defaultUnit: 'per_message',
    unitOptions: ['per_message', 'per_second', 'per_minute'],
  },
  {
    key: 'voice_call',
    label: 'Phone call',
    featureTypes: ['voice_call'],
    defaultFeatureType: 'voice_call',
    defaultUnit: 'per_minute',
    unitOptions: ['per_minute', 'per_second', 'per_message'],
  },
  {
    key: 'character_creation',
    label: 'Custom character',
    featureTypes: ['character_creation', 'custom_character', 'custom_ai'],
    defaultFeatureType: 'character_creation',
    defaultUnit: 'per_character',
    unitOptions: ['per_character', 'per_creation', 'per_message'],
  },
  {
    key: 'video_generation',
    label: 'Video generation',
    featureTypes: [
      'standard_video',
      'premium_video',
      'text_to_video',
      'image_to_video',
      'live_cam_video',
      'custom',
    ],
    defaultFeatureType: 'standard_video',
    defaultUnit: 'per_generation',
    unitOptions: ['per_generation', 'per_second', 'per_video', 'per_message'],
  },
] as const;

/** @deprecated Use FEATURE_COST_FAMILIES — kept for any external imports. */
export const PREDEFINED_FEATURE_COSTS = FEATURE_COST_FAMILIES.map((f) => ({
  featureType: f.defaultFeatureType,
  label: f.label,
  defaultUnit: f.defaultUnit,
  unitOptions: f.unitOptions,
  findTypes: f.featureTypes,
}));

export type FeatureCostRow = FeatureCostLike & {
  id?: string;
  featureType?: string;
  qualityTier?: string | null;
  durationProduced?: number | null;
  customLabel?: string | null;
  unit?: string;
  active?: boolean;
  sortOrder?: number | null;
};

function isActive(cost: FeatureCostRow): boolean {
  return cost.active !== false;
}

/** Custom rows belong to video when they carry video-ish metadata. */
function customBelongsToVideo(cost: FeatureCostRow): boolean {
  if (String(cost.featureType ?? '') !== 'custom') return false;
  if (cost.qualityTier?.trim()) return true;
  if (cost.durationProduced != null && cost.durationProduced > 0) return true;
  const label = String(cost.customLabel ?? '').toLowerCase();
  return /\bvideo\b|\baudio\b|\bclip\b|\bgen\b/.test(label);
}

export function familyForCost(cost: FeatureCostRow): FeatureCostFamilyDef | null {
  const type = String(cost.featureType ?? '');
  for (const family of FEATURE_COST_FAMILIES) {
    if (!family.featureTypes.includes(type)) continue;
    if (type === 'custom' && family.key !== 'video_generation') continue;
    if (type === 'custom' && family.key === 'video_generation' && !customBelongsToVideo(cost)) continue;
    return family;
  }
  return null;
}

export function costsInFamily<T extends FeatureCostRow>(costs: T[], family: FeatureCostFamilyDef): T[] {
  return costs.filter((c) => {
    if (!isActive(c)) return false;
    const type = String(c.featureType ?? '');
    if (!family.featureTypes.includes(type)) return false;
    if (type === 'custom' && family.key === 'video_generation') return customBelongsToVideo(c);
    if (type === 'custom') return false;
    return true;
  });
}

export function familySummaryRange(variants: FeatureCostRow[]): CostRange | null {
  let min = Infinity;
  let max = -Infinity;
  for (const v of variants) {
    const range = featureCostRange(v);
    // Ignore zero-cost included/unlimited rows in the numeric summary.
    if (!range || (range.min === 0 && range.max === 0)) continue;
    min = Math.min(min, range.min);
    max = Math.max(max, range.max);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

export function formatCostAmount(range: CostRange | null): string {
  if (!range) return '—';
  if (range.min === range.max) return String(range.min);
  return `${range.min}–${range.max}`;
}

export function variantHasMetadata(cost: FeatureCostRow): boolean {
  return Boolean(
    cost.qualityTier?.trim() ||
      (cost.durationProduced != null && cost.durationProduced > 0) ||
      cost.customLabel?.trim(),
  );
}

/** Compact label for one variant, e.g. "Lite 5s: 30" or "Video with audio: 80". */
export function formatVariantShortLabel(cost: FeatureCostRow): string {
  const range = featureCostRange(cost);
  const amount = range ? (range.min === range.max ? String(range.min) : `${range.min}–${range.max}`) : '?';
  const tier = String(cost.qualityTier ?? '').trim();
  const duration = cost.durationProduced;
  const custom = String(cost.customLabel ?? '').trim();

  if (tier && duration) return `${tier} ${duration}s: ${amount}`;
  if (custom && duration) return `${custom} ${duration}s: ${amount}`;
  if (tier) return `${tier}: ${amount}`;
  if (duration) return `${duration}s: ${amount}`;
  if (custom) return `${custom}: ${amount}`;
  return amount;
}

/** Gray subtext under a family row — all variants joined. */
export function formatVariantSubtext(variants: FeatureCostRow[]): string | null {
  const priced = variants.filter((v) => featureCostRange(v));
  if (priced.length <= 1 && !priced.some(variantHasMetadata)) return null;
  return priced.map(formatVariantShortLabel).join(' · ');
}

/** Clean AI-extracted model/label/duration — e.g. "Lite Model (5s)" → model Lite, duration 5. */
export function normalizeExtractedVariant(input: {
  model?: string | null;
  label?: string | null;
  durationSeconds?: number | null;
}): { model: string; label: string; durationSeconds: string } {
  let model = String(input.model ?? '').trim();
  let label = String(input.label ?? '').trim();
  let durationSeconds =
    input.durationSeconds != null && input.durationSeconds > 0 ? String(input.durationSeconds) : '';

  const tryParseCombined = (raw: string): boolean => {
    const s = raw.trim();
    if (!s) return false;
    const parenMatch = s.match(/^(.+?)\s+model\s*\(\s*(\d+(?:\.\d+)?)\s*s\s*\)\s*$/i);
    if (parenMatch) {
      model = parenMatch[1].replace(/\s+model$/i, '').trim();
      if (!durationSeconds) durationSeconds = parenMatch[2];
      return true;
    }
    const bareMatch = s.match(/^(.+?)\s+model\s*$/i);
    if (bareMatch) {
      model = bareMatch[1].trim();
      return true;
    }
    return false;
  };

  if (model && tryParseCombined(model)) {
    if (label.toLowerCase() === model.toLowerCase() || /^model$/i.test(label)) label = '';
  } else if (!model && label && tryParseCombined(label)) {
    label = '';
  }

  model = model.replace(/\s+model$/i, '').replace(/\s*\(\s*\d+\s*s\s*\)\s*$/i, '').trim();

  if (label && /^model$/i.test(label)) label = '';
  if (label && model && label.toLowerCase() === `${model.toLowerCase()} model`) label = '';

  // Label-only modalities (video with audio) — keep label, clear model
  if (label && /video|audio/i.test(label) && !model) {
    // ok
  } else if (label && model && !/video|audio/i.test(label)) {
    // ambiguous duplicate — prefer model path
    if (label.length <= model.length + 8) label = '';
  }

  return { model, label, durationSeconds };
}

export function costRowHumanSummary(row: {
  model?: string;
  customLabel?: string;
  durationSeconds?: string;
  tokenCost?: string;
  unit?: string;
}): string {
  const norm = normalizeExtractedVariant({
    model: row.model,
    label: row.customLabel,
    durationSeconds: row.durationSeconds ? Number(row.durationSeconds) : null,
  });
  const cost = row.tokenCost?.trim() || '?';
  const parts: string[] = [];
  if (norm.label && !norm.model) {
    parts.push(norm.label);
  } else if (norm.model) {
    parts.push(norm.model);
  }
  if (norm.durationSeconds) parts.push(`${norm.durationSeconds}s`);
  const head = parts.length > 0 ? parts.join(' · ') : 'Standard';
  const unit = row.unit?.replace(/^per_/, '').replace(/_/g, ' ') ?? 'generation';
  return `${head} → ${cost} coins (${unit})`;
}

export function dominantUnit(variants: FeatureCostRow[], fallback: string): string {
  const units = variants.map((v) => String(v.unit ?? fallback)).filter(Boolean);
  if (units.length === 0) return fallback;
  const counts = new Map<string, number>();
  for (const u of units) counts.set(u, (counts.get(u) ?? 0) + 1);
  let best = fallback;
  let bestCount = 0;
  for (const [u, n] of counts) {
    if (n > bestCount) {
      bestCount = n;
      best = u;
    }
  }
  return units.every((u) => u === best) ? best : 'mixed';
}

/** Cheapest active cost in a type list (lowest credits per display use). */
export function findCheapestCost<T extends FeatureCostRow>(costs: T[], types: readonly string[]): T | null {
  let best: T | null = null;
  let bestMin = Infinity;
  for (const c of costs) {
    if (!isActive(c)) continue;
    if (!types.includes(String(c.featureType ?? ''))) continue;
    if (String(c.featureType ?? '') === 'custom' && !customBelongsToVideo(c)) continue;
    const perUse = creditsPerDisplayUse(c);
    if (!perUse || perUse.min <= 0) continue;
    if (perUse.min < bestMin) {
      bestMin = perUse.min;
      best = c;
    }
  }
  return best;
}

export function findCheapestInFamily<T extends FeatureCostRow>(
  costs: T[],
  family: FeatureCostFamilyDef,
): T | null {
  return findCheapestCost(costs, family.featureTypes);
}

/** Map an AI-extracted variant or editor row to stored featureCost fields. */
export function variantFieldsToFeatureCost(
  family: FeatureCostFamilyDef,
  input: {
    model?: string | null;
    durationSeconds?: number | null;
    label?: string | null;
    creditCost?: number | null;
    unit?: string | null;
  },
): Record<string, unknown> {
  const model = String(input.model ?? '').trim();
  const label = String(input.label ?? '').trim();
  const duration =
    input.durationSeconds != null && input.durationSeconds > 0 ? input.durationSeconds : undefined;
  const unit = input.unit?.trim() || family.defaultUnit;

  if (family.key === 'video_generation') {
    if (label && !model) {
      return {
        featureType: 'custom',
        customLabel: label,
        qualityTier: undefined,
        durationProduced: duration,
        unit,
        creditCost: input.creditCost ?? undefined,
      };
    }
    return {
      featureType: family.defaultFeatureType,
      qualityTier: model || undefined,
      customLabel: label || undefined,
      durationProduced: duration,
      unit,
      creditCost: input.creditCost ?? undefined,
    };
  }

  if (family.key === 'standard_image' && (model || label)) {
    return {
      featureType: family.defaultFeatureType,
      qualityTier: model || undefined,
      customLabel: label || undefined,
      durationProduced: undefined,
      unit,
      creditCost: input.creditCost ?? undefined,
    };
  }

  return {
    featureType: family.defaultFeatureType,
    qualityTier: model || undefined,
    customLabel: label || undefined,
    durationProduced: family.key === 'video_generation' ? duration : undefined,
    unit,
    creditCost: input.creditCost ?? undefined,
  };
}

export function familyByCategory(category: string): FeatureCostFamilyDef | null {
  return FEATURE_COST_FAMILIES.find((f) => f.key === category) ?? null;
}

export function categoryForFeatureCost(cost: FeatureCostRow): ExtractFeatureCategory | 'custom' {
  const family = familyForCost(cost);
  if (family) return family.key as ExtractFeatureCategory;
  return 'custom';
}

/** Stable key for matching imported rows to existing DB records. */
export function variantMatchKey(cost: FeatureCostRow): string {
  const family = familyForCost(cost);
  const cat = family?.key ?? 'custom';
  const model = String(cost.qualityTier ?? '').trim().toLowerCase();
  const duration = cost.durationProduced != null ? String(cost.durationProduced) : '';
  const label = String(cost.customLabel ?? '').trim().toLowerCase();
  const type = String(cost.featureType ?? '').trim();
  return [cat, type, model, duration, label].join('|');
}

export function matchExistingVariant<T extends FeatureCostRow>(existing: T[], candidate: FeatureCostRow): T | undefined {
  const key = variantMatchKey(candidate);
  return existing.find((row) => variantMatchKey(row) === key);
}

export interface FlatExtractedFeatureCost {
  category?: ExtractFeatureCategory | null;
  featureType: string;
  customLabel?: string | null;
  model?: string | null;
  durationSeconds?: number | null;
  tokenCost: number;
  unit: string;
}

/** Convert AI variant output into flat feature cost rows for the review modal. */
export function flattenExtractedFeatureCosts(input: {
  featureCosts?: Array<Record<string, unknown>>;
  featureCostVariants?: Array<Record<string, unknown>>;
}): FlatExtractedFeatureCost[] {
  const out: FlatExtractedFeatureCost[] = [];
  const seen = new Set<string>();

  function push(row: FlatExtractedFeatureCost) {
    const key = [
      row.category,
      row.featureType,
      row.model ?? '',
      row.durationSeconds ?? '',
      row.customLabel ?? '',
      row.tokenCost,
    ].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    out.push(row);
  }

  for (const raw of input.featureCostVariants ?? []) {
    const category = String(raw.category ?? '').trim() as ExtractFeatureCategory;
    const family = familyByCategory(category);
    if (!family) continue;
    const tokenCost = Number(raw.tokenCost);
    if (!Number.isFinite(tokenCost) || tokenCost < 0) continue;
    const fields = variantFieldsToFeatureCost(family, {
      model: raw.model as string | null,
      durationSeconds: raw.durationSeconds as number | null,
      label: raw.label as string | null,
      creditCost: tokenCost,
      unit: String(raw.unit ?? family.defaultUnit),
    });
    push({
      category,
      featureType: String(fields.featureType ?? family.defaultFeatureType),
      customLabel: (fields.customLabel as string) ?? null,
      model: (fields.qualityTier as string) ?? null,
      durationSeconds: (fields.durationProduced as number) ?? null,
      tokenCost,
      unit: String(fields.unit ?? family.defaultUnit),
    });
  }

  for (const raw of input.featureCosts ?? []) {
    const tokenCost = Number(raw.tokenCost ?? raw.creditCost ?? raw.cost);
    if (!Number.isFinite(tokenCost) || tokenCost < 0) continue;
    const featureType = String(raw.featureType ?? 'custom');
    const family =
      FEATURE_COST_FAMILIES.find((f) => f.featureTypes.includes(featureType)) ??
      (featureType === 'custom' ? FEATURE_COST_FAMILIES.find((f) => f.key === 'video_generation') : null);
    const category = (family?.key ?? 'custom') as ExtractFeatureCategory;
    push({
      category,
      featureType,
      customLabel: (raw.customLabel as string) ?? null,
      model: (raw.model as string) ?? (raw.qualityTier as string) ?? null,
      durationSeconds: (raw.durationSeconds as number) ?? (raw.durationProduced as number) ?? null,
      tokenCost,
      unit: String(raw.unit ?? family?.defaultUnit ?? 'per_generation'),
    });
  }

  return out;
}
