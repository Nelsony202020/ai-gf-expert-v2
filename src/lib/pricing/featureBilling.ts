// Unified feature billing vocabulary — maps plan allowances + global feature costs
// into one admin/public model without duplicating storage.

import {
  cheapestPricedFeatureCost,
  featureCostAvailability,
  featureCostRange,
  creditsPerDisplayUse,
  type FeatureCostLike,
  type PlanTierLike,
} from './calc';
import {
  costsInFamily,
  familySummaryRange,
  formatCostAmount,
  formatVariantSubtext,
  type FeatureCostFamilyDef,
  FEATURE_COST_FAMILIES,
  UNIT_LABELS,
} from './featureCostGroups';
import {
  findAllowance,
  monthlyQuantityFromAllowance,
  resolveAfterAllowance,
  resolvePlanAllowances,
  type AfterAllowanceType,
  type PlanAllowance,
  type PlanAccessType,
} from './planAllowances';

export type { AfterAllowanceType, PlanAllowanceAfterAllowance } from './planAllowances';
export { AFTER_ALLOWANCE_TYPES, resolveAfterAllowance } from './planAllowances';

/** User-facing billing modes (admin Feature Billing table). */
export const FEATURE_BILLING_MODES = [
  'unlimited',
  'included_allowance',
  'shared_credits',
  'per_use',
  'unavailable',
  'unknown',
] as const;
export type FeatureBillingMode = (typeof FEATURE_BILLING_MODES)[number];

export const FEATURE_BILLING_MODE_LABELS: Record<FeatureBillingMode, string> = {
  unlimited: 'Unlimited',
  included_allowance: 'Included allowance',
  shared_credits: 'Shared coins',
  per_use: 'Charged per use',
  unavailable: 'Not available',
  unknown: 'Unknown',
};

export const AFTER_ALLOWANCE_LABELS: Record<AfterAllowanceType, string> = {
  shared_credits: 'Uses shared credits',
  per_use: 'Charged per use',
  unavailable: 'Not available',
  unknown: 'Unknown',
};

/** Admin summary rows — one per product feature area. */
export const FEATURE_BILLING_ROWS: Array<{
  key: string;
  label: string;
  allowanceKeys: string[];
  familyKey: string;
}> = [
  { key: 'chat', label: 'Chat', allowanceKeys: ['messages'], familyKey: 'chat_message' },
  {
    key: 'images',
    label: 'Image generation',
    allowanceKeys: ['photo_messages', 'image_generations', 'hd_generations'],
    familyKey: 'standard_image',
  },
  {
    key: 'video',
    label: 'Video generation',
    allowanceKeys: ['videos'],
    familyKey: 'video_generation',
  },
  {
    key: 'voice_message',
    label: 'Voice message',
    allowanceKeys: ['voice_messages'],
    familyKey: 'voice_message',
  },
  {
    key: 'voice_call',
    label: 'Phone call',
    allowanceKeys: ['voice_chat', 'voice_minutes'],
    familyKey: 'voice_call',
  },
  {
    key: 'character',
    label: 'Custom character',
    allowanceKeys: ['custom_companions', 'personas', 'customizations'],
    familyKey: 'character_creation',
  },
];

export function familyForBillingRow(row: (typeof FEATURE_BILLING_ROWS)[number]): FeatureCostFamilyDef {
  return FEATURE_COST_FAMILIES.find((f) => f.key === row.familyKey)!;
}

export function accessTypeToBillingMode(
  access: PlanAccessType | undefined,
  featureKey?: string,
): FeatureBillingMode | null {
  if (!access) return null;
  switch (access) {
    case 'unlimited':
      return 'unlimited';
    case 'included_quantity':
      return 'included_allowance';
    case 'included_credits':
      return featureKey === 'shared_credits' ? 'shared_credits' : 'included_allowance';
    case 'pay_as_you_go':
      return 'shared_credits';
    case 'not_included':
      return 'unavailable';
    case 'included_unspecified':
      return 'unknown';
    default:
      return null;
  }
}

export function billingModeToAccessType(mode: FeatureBillingMode): PlanAccessType {
  switch (mode) {
    case 'unlimited':
      return 'unlimited';
    case 'included_allowance':
      return 'included_quantity';
    case 'shared_credits':
      return 'pay_as_you_go';
    case 'per_use':
      return 'pay_as_you_go';
    case 'unavailable':
      return 'not_included';
    case 'unknown':
      return 'included_unspecified';
  }
}

function allowanceForRow(plan: PlanTierLike, allowanceKeys: string[]): PlanAllowance | undefined {
  const allowances = resolvePlanAllowances(plan);
  return findAllowance(allowances, allowanceKeys);
}

function formatQtyRange(values: number[], suffix: string): string {
  const nums = values.filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return '—';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const fmt = (n: number) => (Number.isInteger(n) ? n.toLocaleString('en-US') : String(n));
  if (min === max) return `${fmt(min)}${suffix}`;
  return `${fmt(min)}–${fmt(max)}${suffix}`;
}

function globalExtraUsageLabel(
  costs: FeatureCostLike[],
  family: FeatureCostFamilyDef,
  creditLabel: string,
): string {
  const variants = costsInFamily(costs as FeatureCostLike[], family);
  if (variants.length === 0) return '—';

  const modes = new Set(
    variants.map((v) => featureCostAvailability(v as FeatureCostLike)),
  );
  if (modes.size === 1 && modes.has('unlimited')) return 'Unlimited';
  if (modes.size === 1 && modes.has('not_available')) return 'Not available';

  const priced = variants.filter((v) => featureCostAvailability(v as FeatureCostLike) === 'priced');
  if (priced.length === 0) {
    if (modes.has('unknown')) return 'Unknown';
    return '—';
  }

  const range = familySummaryRange(priced);
  if (!range) return 'Varies';

  const unit = String(priced[0]?.unit ?? family.defaultUnit);
  const unitLabel = UNIT_LABELS[unit] ?? unit.replace(/^per_/, 'per ');
  const sub = formatVariantSubtext(priced);
  const amount = formatCostAmount(range);
  const base = `${amount} ${creditLabel} / ${unitLabel.replace(/^per /, '')}`;
  return sub ? 'Varies' : base;
}

export interface FeatureBillingSummaryRow {
  key: string;
  label: string;
  howCharged: string;
  included: string;
  extraUsage: string;
  family: FeatureCostFamilyDef;
  /** True when plan allowances differ between tiers. */
  variesByPlan: boolean;
}

export function summarizeFeatureBilling(
  tiers: PlanTierLike[],
  costs: FeatureCostLike[],
  creditLabel: string,
): FeatureBillingSummaryRow[] {
  const active = tiers.filter((t) => t.active !== false);

  return FEATURE_BILLING_ROWS.map((row) => {
    const family = familyForBillingRow(row);
    const modes: FeatureBillingMode[] = [];
    const includedQty: number[] = [];
    let anyUnlimited = false;
    let anyIncludedUnspecified = false;

    for (const plan of active) {
      const allowance = allowanceForRow(plan, row.allowanceKeys);
      const mode = accessTypeToBillingMode(allowance?.accessType, allowance?.featureKey);
      if (mode) modes.push(mode);
      if (allowance?.accessType === 'unlimited') anyUnlimited = true;
      if (allowance?.accessType === 'included_unspecified') anyIncludedUnspecified = true;
      const monthly = allowance ? monthlyQuantityFromAllowance(allowance) : null;
      if (monthly != null && monthly > 0) includedQty.push(monthly);
    }

    const uniqueModes = [...new Set(modes)];
    const includedMin = includedQty.length > 0 ? Math.min(...includedQty) : null;
    const includedMax = includedQty.length > 0 ? Math.max(...includedQty) : null;
    const variesByPlan =
      uniqueModes.length > 1 ||
      (includedMin != null && includedMax != null && includedMin !== includedMax) ||
      (active.length > 1 &&
        modes.length > 0 &&
        modes.length < active.length &&
        active.some((plan) => !allowanceForRow(plan, row.allowanceKeys)));

    let howCharged: string;
    if (variesByPlan) {
      howCharged = 'Varies by plan';
    } else if (uniqueModes.length === 1 && uniqueModes[0]) {
      howCharged = FEATURE_BILLING_MODE_LABELS[uniqueModes[0]];
    } else if (anyUnlimited) {
      howCharged = FEATURE_BILLING_MODE_LABELS.unlimited;
    } else {
      const global = cheapestPricedFeatureCost(costs, ...family.featureTypes);
      if (global && featureCostAvailability(global) === 'priced') {
        howCharged = FEATURE_BILLING_MODE_LABELS.shared_credits;
      } else if (anyIncludedUnspecified) {
        howCharged = FEATURE_BILLING_MODE_LABELS.unknown;
      } else {
        howCharged = '—';
      }
    }

    let included: string;
    if (anyUnlimited && !variesByPlan) {
      included = 'Unlimited';
    } else if (includedQty.length > 0) {
      included = formatQtyRange(includedQty, ' / mo');
    } else if (variesByPlan && includedQty.length === 0) {
      included = 'Varies by plan';
    } else {
      included = '—';
    }

    const extraUsage = globalExtraUsageLabel(costs, family, creditLabel);

    return {
      key: row.key,
      label: row.label,
      howCharged,
      included,
      extraUsage,
      family,
      variesByPlan,
    };
  });
}

/** Format extra-usage hint when an allowance has a defined afterAllowance policy. */
export function formatAfterAllowanceHint(
  allowance: PlanAllowance | undefined,
  costs: FeatureCostLike[],
  family: FeatureCostFamilyDef,
  creditLabel: string,
): string | null {
  if (!allowance) return null;
  const after = resolveAfterAllowance(allowance);
  if (after === 'unavailable') return 'Not available after limit';
  if (after === 'unknown') return 'Unknown after limit';
  if (after === 'per_use' && allowance.afterAllowance?.creditCost != null) {
    const unit = allowance.afterAllowance.unit ?? 'use';
    return `${allowance.afterAllowance.creditCost} ${creditLabel} / ${unit.replace(/^per_/, '')}`;
  }
  if (after === 'shared_credits') {
    const cost = cheapestPricedFeatureCost(costs, ...family.featureTypes);
    if (!cost) return 'Uses shared credits';
    const perUse = creditsPerDisplayUse(cost);
    if (!perUse) return 'Uses shared credits';
    const unit = String(cost.unit ?? family.defaultUnit);
    const unitLabel = UNIT_LABELS[unit] ?? unit;
    return `${perUse.min} ${creditLabel} ${unitLabel}`;
  }
  return null;
}

export function tierLikeFromRecord(t: Record<string, unknown>): PlanTierLike {
  return {
    name: String(t.name ?? ''),
    active: t.active !== false,
    allowances: t.allowances,
    includedTokens: t.includedTokens != null ? Number(t.includedTokens) : null,
    includedImages: t.includedImages != null ? Number(t.includedImages) : null,
    includedVideos: t.includedVideos != null ? Number(t.includedVideos) : null,
    includedVoiceMinutes: t.includedVoiceMinutes != null ? Number(t.includedVoiceMinutes) : null,
    unlimitedFeatures: t.unlimitedFeatures,
    billingOptions: t.billingOptions as PlanTierLike['billingOptions'],
  };
}
