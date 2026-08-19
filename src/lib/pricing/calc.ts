// Pure pricing calculations. Editors enter raw facts (prices, credits,
// feature costs); everything here is derived and never stored back except
// the snapshot-activation cache sync. Keep these functions framework-free
// and testable — the future /industry-statistics page reuses them.

import {
  findAllowance,
  hasExplicitAllowances,
  monthlyQuantityFromAllowance,
  resolvePlanAllowances,
  USAGE_TO_ALLOWANCE_KEYS,
} from './planAllowances';

export const BILLING_INTERVALS = [
  'weekly',
  'monthly',
  'quarterly',
  'six_months',
  'yearly',
  'lifetime',
  'custom',
] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

/** One billing option nested under a plan tier (mirrors billingOptionSchema). */
export interface BillingOption {
  interval: BillingInterval;
  price: number;
  currency: string;
  introPrice?: number;
  introDuration?: string;
  renewalPrice?: number;
  freeTrial?: boolean;
  trialLength?: string;
  active: boolean;
}

export const INTERVAL_LABELS: Record<BillingInterval, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  six_months: '6 months',
  yearly: 'Annual',
  lifetime: 'Lifetime',
  custom: 'Custom',
};

export const MONTHS_PER_INTERVAL: Record<BillingInterval, number | null> = {
  weekly: 12 / 52, // ≈0.2308 months per week
  monthly: 1,
  quarterly: 3,
  six_months: 6,
  yearly: 12,
  lifetime: null, // not a recurring monthly cost
  custom: null,
};

export interface PlanTierLike {
  name?: string;
  active?: boolean;
  billingOptions?: BillingOption[] | null;
  includedTokens?: number | null;
  includedImages?: number | null;
  includedVideos?: number | null;
  includedVoiceMinutes?: number | null;
  unlimitedFeatures?: unknown;
  /** Plan entitlements — when present, preferred over legacy scalars. */
  allowances?: unknown;
  // Legacy single-price fallback
  billingInterval?: string | null;
  price?: number | null;
  currency?: string | null;
}

/**
 * Normalized billing options for a tier: prefers the structured
 * `billingOptions` array and falls back to the legacy flat fields so
 * pre-migration plan rows keep working.
 */
export function tierBillingOptions(tier: PlanTierLike): BillingOption[] {
  if (Array.isArray(tier.billingOptions) && tier.billingOptions.length > 0) {
    return tier.billingOptions;
  }
  const interval = tier.billingInterval as BillingOption['interval'] | undefined;
  if (!interval || tier.price == null || !Number.isFinite(Number(tier.price))) return [];
  return [
    {
      interval,
      price: Number(tier.price),
      currency: String(tier.currency ?? 'USD'),
      active: tier.active !== false,
    },
  ];
}

/** Effective monthly cost of one billing option (null for lifetime/custom). */
export function monthlyEquivalent(option: BillingOption): number | null {
  const months = MONTHS_PER_INTERVAL[option.interval];
  if (months == null || months <= 0) return null;
  if (!Number.isFinite(option.price)) return null;
  return round2(option.price / months);
}

/**
 * Discount of a longer interval vs paying the monthly price for the same
 * period, e.g. annual $79.99 vs monthly $12.99 → 48.7%. Null when either
 * input is missing.
 */
export function intervalDiscount(monthlyPrice: number, option: BillingOption): number | null {
  const months = MONTHS_PER_INTERVAL[option.interval];
  if (months == null || months <= 1 || monthlyPrice <= 0) return null;
  const fullPrice = monthlyPrice * months;
  if (option.price >= fullPrice) return 0;
  return round1(((fullPrice - option.price) / fullPrice) * 100);
}

/** Absolute saving vs paying monthly for the option's period. */
export function intervalSaving(monthlyPrice: number, option: BillingOption): number | null {
  const months = MONTHS_PER_INTERVAL[option.interval];
  if (months == null || months <= 1 || monthlyPrice <= 0) return null;
  return round2(monthlyPrice * months - option.price);
}

/** Lowest effective monthly price across active options of active tiers. */
export function lowestMonthlyPrice(tiers: PlanTierLike[]): number | null {
  const values: number[] = [];
  for (const tier of tiers) {
    if (tier.active === false) continue;
    for (const opt of tierBillingOptions(tier)) {
      if (opt.active === false) continue;
      const eq = monthlyEquivalent(opt);
      if (eq !== null) values.push(eq);
    }
  }
  return values.length > 0 ? Math.min(...values) : null;
}

/** Lowest plain monthly (not annual-equivalent) price. */
export function lowestPlainMonthlyPrice(tiers: PlanTierLike[]): number | null {
  const values: number[] = [];
  for (const tier of tiers) {
    if (tier.active === false) continue;
    for (const opt of tierBillingOptions(tier)) {
      if (opt.active === false || opt.interval !== 'monthly') continue;
      values.push(opt.price);
    }
  }
  return values.length > 0 ? Math.min(...values) : null;
}

/** Highest annual discount available across active tiers. */
export function maxAnnualDiscount(tiers: PlanTierLike[]): number | null {
  let max: number | null = null;
  for (const tier of tiers) {
    if (tier.active === false) continue;
    const options = tierBillingOptions(tier).filter((o) => o.active !== false);
    const monthly = options.find((o) => o.interval === 'monthly');
    if (!monthly) continue;
    for (const opt of options) {
      const d = intervalDiscount(monthly.price, opt);
      if (d !== null && (max === null || d > max)) max = d;
    }
  }
  return max;
}

// ---------------------------------------------------------------------------
// Credit packages
// ---------------------------------------------------------------------------

export interface CreditPackageLike {
  name?: string;
  active?: boolean;
  price?: number | null;
  currency?: string | null;
  baseCredits?: number | null;
  bonusCredits?: number | null;
  tokenAmount?: number | null; // legacy total
}

/** Total credits in a package: base + bonus, falling back to legacy total. */
export function packageTotalCredits(pkg: CreditPackageLike): number | null {
  const base = numOrNull(pkg.baseCredits);
  if (base !== null) return base + (numOrNull(pkg.bonusCredits) ?? 0);
  return numOrNull(pkg.tokenAmount);
}

/** Price per 100 credits, e.g. $7.27 per 100 gems. */
export function pricePer100Credits(pkg: CreditPackageLike): number | null {
  const total = packageTotalCredits(pkg);
  const price = numOrNull(pkg.price);
  if (total === null || total <= 0 || price === null) return null;
  return round2((price / total) * 100);
}

/** Price of a single credit. */
export function pricePerCredit(pkg: CreditPackageLike): number | null {
  const total = packageTotalCredits(pkg);
  const price = numOrNull(pkg.price);
  if (total === null || total <= 0 || price === null) return null;
  return price / total;
}

/** The active package with the lowest price per credit. */
export function bestValuePackage<T extends CreditPackageLike>(packages: T[]): T | null {
  let best: T | null = null;
  let bestRate = Infinity;
  for (const pkg of packages) {
    if (pkg.active === false) continue;
    const rate = pricePerCredit(pkg);
    if (rate !== null && rate < bestRate) {
      bestRate = rate;
      best = pkg;
    }
  }
  return best;
}

/** Cheapest top-up rate expressed per 100 credits. */
export function cheapestTopUpRate(packages: CreditPackageLike[]): number | null {
  const best = bestValuePackage(packages);
  return best ? pricePer100Credits(best) : null;
}

// ---------------------------------------------------------------------------
// Feature costs and allowances
// ---------------------------------------------------------------------------

export type FeatureCostAvailability =
  | 'fixed'
  | 'range'
  | 'variable'
  | 'included'
  | 'unlimited'
  | 'pay_as_you_go'
  | 'not_available'
  | 'unknown';

export interface FeatureCostLike {
  featureType?: string;
  active?: boolean;
  creditCost?: number | null;
  minCost?: number | null;
  maxCost?: number | null;
  /** Priced (fixed/range/variable) or non-priced states (included / unlimited / …). */
  costType?: FeatureCostAvailability | string | null;
  unit?: string;
  durationProduced?: number | null;
  /** Empty / missing = available on all plans; otherwise plan name match. */
  availablePlanNames?: string[] | null;
}

export interface CostRange {
  min: number;
  max: number;
}

/** Non-priced feature-cost states (no billable credit amount). */
export function featureCostAvailability(cost: FeatureCostLike): FeatureCostAvailability | 'priced' {
  const t = String(cost.costType ?? '').trim();
  if (
    t === 'included' ||
    t === 'unlimited' ||
    t === 'pay_as_you_go' ||
    t === 'not_available' ||
    t === 'unknown'
  ) {
    return t;
  }
  if (t === 'fixed' || t === 'range' || t === 'variable') return 'priced';
  const range = (() => {
    const fixed = numOrNull(cost.creditCost);
    const min = numOrNull(cost.minCost);
    const max = numOrNull(cost.maxCost);
    if (min !== null && max !== null && min > 0 && max > 0) return true;
    if (fixed !== null && fixed > 0) return true;
    if (min !== null && min > 0) return true;
    if (max !== null && max > 0) return true;
    return false;
  })();
  return range ? 'priced' : 'unknown';
}

/** Credit cost of one feature use as a range (fixed cost → min === max). */
export function featureCostRange(cost: FeatureCostLike): CostRange | null {
  const availability = featureCostAvailability(cost);
  if (availability === 'included' || availability === 'unlimited') {
    return { min: 0, max: 0 };
  }
  if (availability === 'not_available' || availability === 'unknown') return null;
  const fixed = numOrNull(cost.creditCost);
  const min = numOrNull(cost.minCost);
  const max = numOrNull(cost.maxCost);
  if (min !== null && max !== null && min > 0 && max > 0) return { min, max };
  if (fixed !== null && fixed > 0) return { min: fixed, max: fixed };
  if (min !== null && min > 0) return { min, max: min };
  if (max !== null && max > 0) return { min: max, max };
  return null;
}

/**
 * Estimated uses if all included credits were spent on this one feature.
 * Range costs produce a range of estimates (cheaper cost → more uses).
 */
export function estimatedAllowance(
  includedCredits: number | null | undefined,
  cost: FeatureCostLike,
): CostRange | null {
  const credits = numOrNull(includedCredits);
  const range = featureCostRange(cost);
  if (credits === null || credits <= 0 || !range) return null;
  return { min: round1(credits / range.max), max: round1(credits / range.min) };
}

/**
 * Credits required for one “display unit” of a feature (e.g. one image, one 10s video).
 * Returns null when the feature isn’t priced in credits.
 */
export function creditsPerDisplayUse(cost: FeatureCostLike): CostRange | null {
  const range = featureCostRange(cost);
  if (!range) return null;
  const unit = String(cost.unit ?? '');
  const type = String(cost.featureType ?? '');

  if (unit === 'per_second' || type.includes('video')) {
    const seconds =
      numOrNull(cost.durationProduced) && Number(cost.durationProduced) > 0
        ? Number(cost.durationProduced)
        : 10;
    return { min: round2(range.min * seconds), max: round2(range.max * seconds) };
  }

  if (unit === 'per_minute' && type.includes('voice_message')) {
    // Review convention: a voice message ≈ 10 seconds.
    const minutes = 10 / 60;
    return { min: round2(range.min * minutes), max: round2(range.max * minutes) };
  }

  return range;
}

/** Whole-number-friendly count for plan matrix cells. */
export function formatUseCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 100) return String(Math.round(n));
  if (n >= 10) return String(Math.round(n));
  return String(Math.round(n * 10) / 10);
}

/** Round generation counts for display — never show fractional videos/images. */
function formatWholeUses(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return String(Math.max(1, Math.round(n)));
}

function formatDurationFromMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  if (minutes >= 120) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${formatUseCount(hours)} hrs/mo`;
  }
  return `${formatUseCount(minutes)} min/mo`;
}

export interface CreditPoolUseCell {
  value: string;
  tip?: string;
  sublabel?: string;
}

/**
 * Human-readable allowance if the monthly credit pool were spent on one feature.
 * Technical credit math stays in tip/sublabel — never in the primary value.
 */
export function formatCreditPoolUsesCell(
  includedCredits: number | null | undefined,
  cost: FeatureCostLike | null | undefined,
  kind: 'image' | 'video' | 'voice_message' | 'voice_call' | 'character_creation',
): CreditPoolUseCell {
  const credits = numOrNull(includedCredits);
  if (credits == null || credits <= 0 || !cost) return { value: '—' };

  const availability = featureCostAvailability(cost);
  if (availability === 'unlimited') return { value: 'Unlimited' };
  if (availability === 'included') return { value: 'Included' };

  if (kind === 'voice_call') {
    const range = featureCostRange(cost);
    if (!range) return { value: '—' };
    const minMin = credits / range.max;
    const maxMin = credits / range.min;
    const value =
      Math.abs(minMin - maxMin) < 0.05
        ? formatDurationFromMinutes(minMin)
        : `${formatUseCount(minMin)}–${formatUseCount(maxMin)} min/mo`;
    return {
      value,
      tip: 'Estimated minutes of voice calls if the full monthly credit pool went to calls.',
    };
  }

  if (kind === 'voice_message') {
    const range = featureCostRange(cost);
    if (!range) return { value: '—' };
    const unit = String(cost.unit ?? '');
    // Prefer real time from per-minute pricing over message-count math.
    if (unit === 'per_minute' || unit === 'per_second') {
      const minMinutes =
        unit === 'per_second' ? credits / range.max / 60 : credits / range.max;
      const maxMinutes =
        unit === 'per_second' ? credits / range.min / 60 : credits / range.min;
      const mid = (minMinutes + maxMinutes) / 2;
      return {
        value:
          Math.abs(minMinutes - maxMinutes) < 0.05
            ? formatDurationFromMinutes(minMinutes)
            : formatDurationFromMinutes(mid),
        tip: `Equivalent to about ${formatUseCount(mid >= 120 ? mid / 60 : mid)}${
          mid >= 120 ? ' hours' : ' minutes'
        } of generated voice based on the current credit cost. Actual usage depends on message length.`,
      };
    }
  }

  const perUse = creditsPerDisplayUse(cost);
  if (!perUse || perUse.min <= 0) return { value: '—' };
  const minUses = credits / perUse.max;
  const maxUses = credits / perUse.min;
  const midUses = (minUses + maxUses) / 2;

  if (kind === 'character_creation') {
    const count =
      Math.abs(minUses - maxUses) < 0.05
        ? formatWholeUses(minUses)
        : `${formatWholeUses(minUses)}–${formatWholeUses(maxUses)}`;
    return {
      value: `${count}/mo`,
      tip: 'Estimated custom characters if the full monthly credit pool went to character creation.',
    };
  }

  if (kind === 'video') {
    const seconds =
      numOrNull(cost.durationProduced) && Number(cost.durationProduced) > 0
        ? Number(cost.durationProduced)
        : 10;
    const count =
      Math.abs(minUses - maxUses) < 0.05
        ? formatWholeUses(minUses)
        : `${formatWholeUses(minUses)}–${formatWholeUses(maxUses)}`;
    return {
      value: `${count} videos/mo`,
      sublabel: `${seconds} sec each`,
      tip: `Based on ${seconds}-second videos. Actual usage depends on video length and credit cost.`,
    };
  }

  if (kind === 'image') {
    const count =
      Math.abs(minUses - maxUses) < 0.05
        ? formatWholeUses(minUses)
        : `${formatWholeUses(minUses)}–${formatWholeUses(maxUses)}`;
    return {
      value: `${count}/mo`,
      tip: 'Estimated images if the full monthly credit pool went to standard image generation.',
    };
  }

  // Fallback voice_message (non per-minute) → treat uses as 10s clips and convert to time
  const totalSeconds = midUses * 10;
  return {
    value: formatDurationFromMinutes(totalSeconds / 60),
    tip: 'Equivalent generated voice time based on the current credit cost. Actual usage depends on message length.',
  };
}

/**
 * Human label for how many uses the monthly credit pool buys of one feature.
 * Examples: "50/mo", "8 videos/mo", "8.3 hrs/mo", "33 min/mo".
 */
export function formatCreditPoolUses(
  includedCredits: number | null | undefined,
  cost: FeatureCostLike | null | undefined,
  kind: 'image' | 'video' | 'voice_message' | 'voice_call' | 'character_creation',
): string {
  return formatCreditPoolUsesCell(includedCredits, cost, kind).value;
}

/** Estimated money cost of one feature use at a package's credit rate. */
export function estimatedFeatureMoneyCost(
  pkg: CreditPackageLike,
  cost: FeatureCostLike,
): CostRange | null {
  const rate = pricePerCredit(pkg);
  const range = featureCostRange(cost);
  if (rate === null || !range) return null;
  return { min: round2(rate * range.min), max: round2(rate * range.max) };
}

// ---------------------------------------------------------------------------
// Usage scenarios (typical monthly cost)
// ---------------------------------------------------------------------------

export interface UsageScenario {
  /** Feature usage per month, keyed by featureType (e.g. standard_image: 30). */
  usage: Record<string, number>;
}

export interface ScenarioResult {
  /** Subscription price for the billing period (e.g. $13.99 for monthly). */
  planCost: number;
  /** Same as planCost when billed monthly; monthly-equivalent for longer intervals. */
  planCostPerMonth: number;
  billingInterval: BillingInterval;
  billingPeriodMonths: number;
  /** Credits needed beyond the plan's included credits. */
  creditShortfall: number;
  /** Money for the shortfall at the best top-up rate (null if not purchasable). */
  topUpCost: number | null;
  totalMonthly: number | null;
  /** Tier name used for this estimate. */
  planName?: string;
  /** Features requested that are not available on this tier. */
  unavailableFeatures?: string[];
  /** True when spend could not be fully resolved (e.g. included_unspecified without a cost). */
  incomplete?: boolean;
}

export interface BillingPlanEstimate {
  key: 'monthly' | 'quarterly' | 'yearly';
  label: string;
  available: boolean;
  /** Price charged each billing period. */
  planPrice: number | null;
  periodMonths: number;
  /** Subscription cost normalized to one month. */
  planPerMonth: number | null;
  topUpPerMonth: number | null;
  totalPerMonth: number | null;
}

/** Tier with the lowest active plain-monthly option. */
export function cheapestMonthlyTier(tiers: PlanTierLike[]): PlanTierLike | null {
  let best: PlanTierLike | null = null;
  let bestPrice = Infinity;
  for (const tier of tiers) {
    if (tier.active === false) continue;
    for (const opt of tierBillingOptions(tier)) {
      if (opt.active === false || opt.interval !== 'monthly') continue;
      if (opt.price < bestPrice) {
        bestPrice = opt.price;
        best = tier;
      }
    }
  }
  return best;
}

/** Resolve a tier by name (case-insensitive), else cheapest monthly. */
export function resolveReferenceTier(
  tiers: PlanTierLike[],
  referencePlanName?: string | null,
): PlanTierLike | null {
  const active = tiers.filter((t) => t.active !== false);
  if (active.length === 0) return null;
  const needle = referencePlanName?.trim().toLowerCase();
  if (needle) {
    const hit = active.find((t) => String(t.name ?? '').trim().toLowerCase() === needle);
    if (hit) return hit;
  }
  return cheapestMonthlyTier(active);
}

/**
 * Reference tier for a feature metric: prefer the snapshot reference / cheapest
 * monthly plan, but if that plan marks the feature not_included, fall back to
 * the cheapest monthly plan that includes it.
 */
export function resolveTierForFeature(
  tiers: PlanTierLike[],
  featureTypes: string[],
  referencePlanName?: string | null,
): PlanTierLike | null {
  const preferred = resolveReferenceTier(tiers, referencePlanName);
  if (!preferred) return null;
  const keys = featureTypes.flatMap((t) => USAGE_TO_ALLOWANCE_KEYS[t] ?? [t]);
  const preferredAllowance = findAllowance(resolvePlanAllowances(preferred), keys);
  if (!preferredAllowance || preferredAllowance.accessType !== 'not_included') {
    return preferred;
  }
  const active = tiers.filter((t) => t.active !== false);
  const supporting = active.filter((t) => {
    const a = findAllowance(resolvePlanAllowances(t), keys);
    return Boolean(a && a.accessType !== 'not_included');
  });
  return cheapestMonthlyTier(supporting.length > 0 ? supporting : active);
}

function featureCostForPlan(
  featureCosts: FeatureCostLike[],
  featureType: string,
  planName?: string | null,
): FeatureCostLike | undefined {
  const candidates = featureCosts.filter(
    (c) => c.featureType === featureType && c.active !== false,
  );
  if (candidates.length === 0) return undefined;
  const name = planName?.trim().toLowerCase();
  if (!name) return candidates[0];
  const scoped = candidates.filter((c) => {
    const names = c.availablePlanNames;
    if (!names || names.length === 0) return true;
    return names.some((n) => String(n).trim().toLowerCase() === name);
  });
  // Prefer a plan-scoped row when both global and scoped exist.
  const onlyScoped = scoped.filter(
    (c) => Array.isArray(c.availablePlanNames) && c.availablePlanNames.length > 0,
  );
  return onlyScoped[0] ?? scoped[0] ?? candidates[0];
}

function creditsNeededForUsage(
  usage: Record<string, number>,
  featureCosts: FeatureCostLike[],
  planName?: string | null,
): number {
  let creditsNeeded = 0;
  for (const [featureType, count] of Object.entries(usage)) {
    const cost = featureCostForPlan(featureCosts, featureType, planName);
    const range = cost ? featureCostRange(cost) : null;
    if (range) creditsNeeded += range.max * count;
  }
  return creditsNeeded;
}

/**
 * Apply plan allowances to usage, then convert remaining to credits.
 * Unlimited → 0 billable; quantities deducted; not_included flagged.
 */
export function billableCreditsForTier(
  usage: Record<string, number>,
  tier: PlanTierLike,
  featureCosts: FeatureCostLike[],
): {
  creditsNeeded: number;
  unavailableFeatures: string[];
  incomplete: boolean;
  includedCredits: number;
} {
  const allowances = resolvePlanAllowances(tier);
  const planName = tier.name;
  const unavailableFeatures: string[] = [];
  let incomplete = false;
  let creditsNeeded = 0;

  // Shared credit pool from tokens / included_credits allowances.
  let includedCredits = numOrNull(tier.includedTokens) ?? 0;
  for (const a of allowances) {
    if (a.accessType === 'included_credits' && a.featureKey === 'shared_credits') {
      const q = monthlyQuantityFromAllowance(a);
      if (q != null) includedCredits = Math.max(includedCredits, q);
    }
  }

  for (const [featureType, count] of Object.entries(usage)) {
    if (!count || count <= 0) continue;
    const allowanceKeys = USAGE_TO_ALLOWANCE_KEYS[featureType] ?? [featureType];
    const allowance = findAllowance(allowances, allowanceKeys);

    if (allowance?.accessType === 'not_included') {
      unavailableFeatures.push(featureType);
      continue;
    }
    if (allowance?.accessType === 'unlimited') {
      continue;
    }

    let billable = count;
    if (
      allowance &&
      (allowance.accessType === 'included_quantity' || allowance.accessType === 'included_credits')
    ) {
      // included_credits on a feature key other than shared_credits rarely used;
      // quantity allowances reduce unit usage before credit conversion.
      if (allowance.accessType === 'included_quantity') {
        const included = monthlyQuantityFromAllowance(allowance) ?? 0;
        billable = Math.max(0, count - included);
      }
    }

    if (billable <= 0) continue;

    if (allowance?.accessType === 'included_unspecified') {
      const cost = featureCostForPlan(featureCosts, featureType, planName);
      const range = cost ? featureCostRange(cost) : null;
      if (!range) {
        incomplete = true;
        continue;
      }
      creditsNeeded += range.max * billable;
      continue;
    }

    const cost = featureCostForPlan(featureCosts, featureType, planName);
    const range = cost ? featureCostRange(cost) : null;
    if (range) {
      creditsNeeded += range.max * billable;
    } else if (hasExplicitAllowances(tier) && !allowance) {
      // Explicit allowance economy but no cost and no matching allowance → incomplete.
      incomplete = true;
    } else if (range == null && billable > 0 && hasExplicitAllowances(tier)) {
      incomplete = true;
    }
  }

  return { creditsNeeded, unavailableFeatures, incomplete, includedCredits };
}

function topUpCostForShortfall(shortfall: number, packages: CreditPackageLike[]): number | null {
  if (shortfall <= 0) return 0;
  const rate = bestValuePackage(packages);
  const perCredit = rate ? pricePerCredit(rate) : null;
  return perCredit !== null ? round2(shortfall * perCredit) : null;
}

/** Monthly top-up + three billing cadence estimates (best price per interval across tiers). */
export function estimateBillingPlans(
  scenario: UsageScenario,
  tiers: PlanTierLike[],
  featureCosts: FeatureCostLike[],
  packages: CreditPackageLike[],
): BillingPlanEstimate[] {
  const activeTiers = tiers.filter((t) => t.active !== false);
  if (activeTiers.length === 0) return [];

  const specs: { key: BillingPlanEstimate['key']; label: string; interval: BillingInterval }[] = [
    { key: 'monthly', label: 'Pay monthly', interval: 'monthly' },
    { key: 'quarterly', label: '3-month plan', interval: 'quarterly' },
    { key: 'yearly', label: '12-month plan', interval: 'yearly' },
  ];

  return specs.map(({ key, label, interval }) => {
    let best: { tier: PlanTierLike; opt: BillingOption; planPerMonth: number } | null = null;
    for (const tier of activeTiers) {
      for (const opt of tierBillingOptions(tier)) {
        if (opt.active === false || opt.interval !== interval) continue;
        const months = MONTHS_PER_INTERVAL[interval];
        if (months == null || months <= 0) continue;
        const planPerMonth = round2(opt.price / months);
        if (!best || planPerMonth < best.planPerMonth) {
          best = { tier, opt, planPerMonth };
        }
      }
    }

    if (!best) {
      return {
        key,
        label,
        available: false,
        planPrice: null,
        periodMonths: key === 'monthly' ? 1 : key === 'quarterly' ? 3 : 12,
        planPerMonth: null,
        topUpPerMonth: null,
        totalPerMonth: null,
      };
    }

    const billed = billableCreditsForTier(scenario.usage, best.tier, featureCosts);
    const shortfall = Math.max(0, billed.creditsNeeded - billed.includedCredits);
    const topUpPerMonth =
      billed.unavailableFeatures.length > 0 || billed.incomplete
        ? null
        : topUpCostForShortfall(shortfall, packages);
    const months = MONTHS_PER_INTERVAL[interval] ?? 1;
    const planPerMonth = round2(best.opt.price / months);
    const totalPerMonth =
      topUpPerMonth === null ? null : round2(planPerMonth + topUpPerMonth);

    return {
      key,
      label,
      available: true,
      planPrice: best.opt.price,
      periodMonths: months,
      planPerMonth,
      topUpPerMonth,
      totalPerMonth,
    };
  });
}

/**
 * Estimated monthly cost for a usage scenario on a specific subscription tier.
 * Applies plan allowances before feature costs / shared credits / top-ups.
 */
export function scenarioMonthlyCostForTier(
  scenario: UsageScenario,
  tier: PlanTierLike,
  featureCosts: FeatureCostLike[],
  packages: CreditPackageLike[],
): ScenarioResult | null {
  if (tier.active === false) return null;
  const opt = tierBillingOptions(tier).find((o) => o.active !== false && o.interval === 'monthly');
  if (!opt) return null;

  const billed = billableCreditsForTier(scenario.usage, tier, featureCosts);
  const shortfall = Math.max(0, billed.creditsNeeded - billed.includedCredits);
  const blocked = billed.unavailableFeatures.length > 0 || billed.incomplete;
  const topUpCost = blocked ? null : topUpCostForShortfall(shortfall, packages);
  const months = MONTHS_PER_INTERVAL.monthly ?? 1;

  return {
    planCost: opt.price,
    planCostPerMonth: round2(opt.price / months),
    billingInterval: 'monthly',
    billingPeriodMonths: months,
    creditShortfall: shortfall,
    topUpCost,
    totalMonthly: topUpCost === null ? null : round2(opt.price / months + topUpCost),
    planName: tier.name ? String(tier.name) : undefined,
    unavailableFeatures: billed.unavailableFeatures,
    incomplete: billed.incomplete,
  };
}

/**
 * Estimated total monthly cost for a usage scenario: reference/cheapest plan +
 * top-ups needed to cover the credit shortfall at the best package rate.
 * Uses max cost for range-priced features (conservative estimate).
 */
export function scenarioMonthlyCost(
  scenario: UsageScenario,
  tiers: PlanTierLike[],
  featureCosts: FeatureCostLike[],
  packages: CreditPackageLike[],
  referencePlanName?: string | null,
): ScenarioResult | null {
  const tier = resolveReferenceTier(tiers, referencePlanName);
  if (!tier) return null;
  return scenarioMonthlyCostForTier(scenario, tier, featureCosts, packages);
}

/** Per-tier monthly totals for usage scenario cards. */
export function scenarioMonthlyCostByTier(
  scenario: UsageScenario,
  tiers: PlanTierLike[],
  featureCosts: FeatureCostLike[],
  packages: CreditPackageLike[],
): Array<{ tier: PlanTierLike; result: ScenarioResult | null }> {
  return tiers
    .filter((t) => t.active !== false)
    .map((tier) => ({
      tier,
      result: scenarioMonthlyCostForTier(scenario, tier, featureCosts, packages),
    }));
}

// ---------------------------------------------------------------------------
// Formatting helpers (shared so admin + public render identically)
// ---------------------------------------------------------------------------

export function fmtMoney(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || !Number.isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function fmtRange(range: CostRange | null, format: (n: number) => string): string {
  if (!range) return '—';
  if (range.min === range.max) return format(range.min);
  return `${format(range.min)}–${format(range.max)}`;
}

function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
