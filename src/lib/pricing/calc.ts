// Pure pricing calculations. Editors enter raw facts (prices, credits,
// feature costs); everything here is derived and never stored back except
// the snapshot-activation cache sync. Keep these functions framework-free
// and testable — the future /industry-statistics page reuses them.

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

export interface FeatureCostLike {
  featureType?: string;
  active?: boolean;
  creditCost?: number | null;
  minCost?: number | null;
  maxCost?: number | null;
  unit?: string;
  durationProduced?: number | null;
}

export interface CostRange {
  min: number;
  max: number;
}

/** Credit cost of one feature use as a range (fixed cost → min === max). */
export function featureCostRange(cost: FeatureCostLike): CostRange | null {
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

function creditsNeededForUsage(
  usage: Record<string, number>,
  featureCosts: FeatureCostLike[],
): number {
  let creditsNeeded = 0;
  for (const [featureType, count] of Object.entries(usage)) {
    const cost = featureCosts.find((c) => c.featureType === featureType && c.active !== false);
    const range = cost ? featureCostRange(cost) : null;
    if (range) creditsNeeded += range.max * count;
  }
  return creditsNeeded;
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

    const includedCredits = numOrNull(best.tier.includedTokens) ?? 0;
    const creditsNeeded = creditsNeededForUsage(scenario.usage, featureCosts);
    const shortfall = Math.max(0, creditsNeeded - includedCredits);
    const topUpPerMonth = topUpCostForShortfall(shortfall, packages);
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
 * Estimated total monthly cost for a usage scenario: cheapest plan +
 * top-ups needed to cover the credit shortfall at the best package rate.
 * Uses max cost for range-priced features (conservative estimate).
 */
export function scenarioMonthlyCost(
  scenario: UsageScenario,
  tiers: PlanTierLike[],
  featureCosts: FeatureCostLike[],
  packages: CreditPackageLike[],
): ScenarioResult | null {
  const tier = cheapestMonthlyTier(tiers);
  if (!tier) return null;
  const opt = tierBillingOptions(tier).find((o) => o.active !== false && o.interval === 'monthly');
  if (!opt) return null;

  const includedCredits = numOrNull(tier.includedTokens) ?? 0;
  const creditsNeeded = creditsNeededForUsage(scenario.usage, featureCosts);
  const shortfall = Math.max(0, creditsNeeded - includedCredits);
  const topUpCost = topUpCostForShortfall(shortfall, packages);
  const months = MONTHS_PER_INTERVAL.monthly;

  return {
    planCost: opt.price,
    planCostPerMonth: round2(opt.price / months),
    billingInterval: 'monthly',
    billingPeriodMonths: months,
    creditShortfall: shortfall,
    topUpCost,
    totalMonthly: topUpCost === null ? null : round2(opt.price / months + topUpCost),
  };
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
