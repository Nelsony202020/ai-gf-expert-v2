import type { UsageCalculation } from '../pricing/usageScenarios';
import type { PricingFreeAccess } from './freeAccessShared';

export interface PricingPlanBillingOption {
  interval: 'monthly' | 'quarterly' | 'yearly';
  /** Effective per-month price shown as the primary figure */
  monthlyPrice: number | null;
  monthlyPriceLabel: string;
  /** Full billed amount for the period (yearly/quarterly total); null for monthly */
  periodPrice: number | null;
  periodPriceLabel: string | null;
  /** e.g. "Billed monthly" or "$47.88 billed yearly" */
  priceSub: string;
  savingsPercent: number | null;
  /** e.g. "Save 71%" */
  savingsLabel: string | null;
  /** Active promo / intro price presentation (omit when not on sale) */
  sale: PricingPlanSale | null;
}

export interface PricingPlanSale {
  /** Struck-through list / “was” price */
  listPriceLabel: string;
  /** e.g. "36% OFF" or "36% OFF · Ends Aug 31" */
  badge: string;
  /** e.g. "Promo price" or "Advertised as 36% off" */
  note: string;
}

export interface PricingTopUpPackage {
  key: string;
  /** Primary line, e.g. "2,880 credits" */
  creditsLabel: string;
  /** Muted secondary, e.g. "2,400 + 480 bonus"; null when no bonus */
  bonusDetail: string | null;
  credits: number;
  baseCredits: number | null;
  bonusCredits: number | null;
  priceLabel: string;
  /** e.g. "14% better value" or "—" for the baseline pack */
  valueLabel: string;
  /** True when this is the lowest effective rate */
  isBestValue: boolean;
  /** True when this pack feeds the usage-estimate top-up rate */
  isEstimatePackage: boolean;
}

export interface PricingTopUps {
  heading: string;
  intro: string;
  /** Column heading for relative value, e.g. "Value vs. 100-credit pack" */
  valueColumnLabel: string;
  packages: PricingTopUpPackage[];
  estimateNote: string | null;
  truncated: boolean;
}

export interface PricingPlanColumn {
  key: string;
  name: string;
  /** UI label — real plan name from data (Premium, Deluxe, Free, …) */
  displayName: string;
  isFree: boolean;
  /**
   * When this free column comes from testing Free-access answers rather than
   * a formal Free subscriptionPlan.
   */
  freeAccessSource?: 'subscription_plan' | 'testing';
  /** Which paid tier drives the credit-pool example when multiple exist */
  isRecommended: boolean;
  /** Default (monthly) price label for SSR / no-JS */
  priceLabel: string;
  priceSub?: string;
  /** Compact summary under the price, e.g. "100 credits/month" */
  summaryLine: string;
  /** Parsed monthly credit pool size when known */
  includedCredits: number | null;
  tone: 'accent' | 'neutral';
  /** null for free / non-billable columns */
  billing: {
    monthly: PricingPlanBillingOption | null;
    quarterly: PricingPlanBillingOption | null;
    yearly: PricingPlanBillingOption | null;
  } | null;
  rows: Array<{
    label: string;
    value: string;
    /** Optional methodology tip (shown via info icon) */
    tip?: string;
    /** Optional secondary line under the value, e.g. "10 sec each" */
    sublabel?: string;
    /** @deprecated Prefer explicit value text ("Included" / "Unlimited") over checkmarks */
    included?: boolean;
  }>;
}

export interface PricingBillingToggle {
  show: boolean;
  defaultInterval: 'monthly' | 'quarterly' | 'yearly';
  /** Union of billing intervals available across paid plans */
  intervals: Array<{
    key: 'monthly' | 'quarterly' | 'yearly';
    label: string;
  }>;
  monthlyLabel: string;
  yearlyLabel: string;
  maxYearlySavingsPercent: number | null;
  /** Objective annual label shown beside the toggle (unused — savings show under price) */
  annualBadge: string | null;
}

export interface PricingCreditPoolItem {
  key: string;
  label: string;
  icon: string;
  /** Full skim string, e.g. "50 standard images" (legacy / a11y). */
  value: string;
  /** Large display figure, e.g. "75", "~12", "750 min". */
  amount?: string;
  tip?: string;
  sublabel?: string;
}

/** Per-plan credit budget for the selectable “What your plan can buy” tool. */
export interface PricingPlanCreditBudget {
  planKey: string;
  displayName: string;
  isFree: boolean;
  credits: number | null;
  creditsLine: string | null;
  items: PricingCreditPoolItem[];
  mixer: PricingCreditMixer | null;
  /** Short feature lines for the selected-plan summary */
  highlights: string[];
}

export interface PricingCreditMixerChannel {
  key: 'images' | 'premium_images' | 'videos' | 'voice_messages' | 'voice_calls' | 'custom_character';
  label: string;
  icon: string;
  /** Credits consumed by one display unit */
  creditsPerUnit: number;
  /** Stepper increment in display units */
  step: number;
  unitLabel: string;
  format: 'count' | 'hours' | 'minutes';
  sublabel?: string | null;
  /** e.g. "$0.20/ea" when top-up rate is known */
  unitMoneyLabel?: string | null;
  maxUnits: number;
  /** Skim label, e.g. "50 images" */
  maxLabel: string;
}

export interface PricingCreditMixerPreset {
  id: string;
  label: string;
  quantities: Record<string, number>;
}

export interface PricingCreditMixer {
  credits: number;
  heading: string;
  lead: string;
  footnote: string;
  channels: PricingCreditMixerChannel[];
  presets: PricingCreditMixerPreset[];
}

export interface PricingCreditPool {
  /** Section title, e.g. "What your plan can buy" */
  heading: string;
  note: string;
  defaultPlanKey: string;
  defaultInterval: 'monthly' | 'quarterly' | 'yearly';
  byPlan: Record<string, PricingPlanCreditBudget>;
  /** SSR snapshot of the default paid budget (mirrors byPlan[default]) */
  credits: number;
  creditsLine: string | null;
  items: PricingCreditPoolItem[];
  mixer: PricingCreditMixer | null;
}

export interface PricingLimitRow {
  key: string;
  label: string;
  icon: string;
  /** One cell per plan column, in `plans` order */
  cells: string[];
}

export interface PricingUsageTier {
  id: 'casual' | 'regular' | 'power';
  title: string;
  /** One-line selector subtitle, e.g. "Mostly chatting" */
  shortLabel: string;
  description: string;
  icon: string;
  tone: 'neutral' | 'green' | 'amber' | 'red';
  monthlyCost: number | null;
  costLabel: string;
  /** Subscription portion of the estimate */
  planCost: number | null;
  /** Extra credit / top-up spend beyond the plan */
  topUpCost: number | null;
  assumptions: {
    chat: string;
    images: string;
    videos: string;
    voice: string;
    character: string;
  };
  /** Transparent “how we calculated” breakdown when math is available */
  calculation: UsageCalculation | null;
}

export interface PricingFeatureCostRow {
  key: string;
  label: string;
  /** Primary: money estimate, e.g. "≈$0.14 each" */
  value: string;
  /** Secondary: credit cost, e.g. "2 credits" */
  secondaryValue?: string | null;
  icon: string;
  tone: 'neutral' | 'pink' | 'green' | 'amber' | 'purple' | 'blue';
}

export type PricingDiffTone = 'better' | 'worse' | 'neutral';

export interface PricingCompareRow {
  metric: string;
  productValue: string;
  /** Typical / median market benchmark for this metric. */
  typicalValue: string;
  diffLabel: string;
  diffTone: PricingDiffTone;
}

export interface PricingTabViewModel {
  productSlug: string;
  productName: string;
  updatedLabel: string;
  isDraft: boolean;
  currency: string;

  pricingScore: number | null;
  scoreLabel: string;
  /** Compact verdict lead, e.g. "Good value — Aura AI’s $12.99…" */
  scoreInsight: string;
  /** Optional short caveat under the verdict */
  scoreCaveat: string | null;

  advertisedMonthly: number | null;
  regularUseMonthly: number | null;
  /** Active pricing snapshot model slug, when set. */
  pricingModel: string | null;
  /** Estimated monthly cost for the heavy-use profile. */
  powerUserMonthly: number | null;
  /** Scaled proxy for typical regular-use spend (from typical starting price). */
  categoryAvgMonthly: number | null;
  /**
   * Public market benchmark: median starting monthly subscription across tested apps
   * (“typical monthly price”). Like-for-like with advertisedMonthly.
   */
  typicalMonthlyPrice: number | null;
  reviewedAppCount: number | null;

  /**
   * Relative value headline — regular-use cost vs typical regular-use proxy
   * (like-for-like). Positive = cheaper.
   */
  heroCheaperPct: number | null;
  heroSavings: number | null;
  heroCheaperThanPct: number | null;

  barMin: number;
  barMax: number;
  /** Position of advertised/starting price on the hero bar. */
  productBarPct: number | null;
  /** Position of typical starting subscription on the hero bar. */
  typicalBarPct: number | null;

  /** Monthly ↔ Annual switch; hidden when annual isn't available */
  billingToggle: PricingBillingToggle;
  /** One column per plan tier (Free / Premium / …), not billing period */
  plans: PricingPlanColumn[];
  /** Shared credit-pool translation for the primary paid plan */
  creditPool: PricingCreditPool | null;
  /** Hard limits comparison (chat + credit-gated features) */
  limitRows: PricingLimitRow[];
  /** One-time credit top-up packs; null when product has none */
  topUps: PricingTopUps | null;
  usageTiers: PricingUsageTier[];
  /** False when light/regular/heavy spend cannot be calculated from verified data. */
  usageEstimatesAvailable: boolean;
  advertisedVsRegularDiff: number | null;

  featureCosts: PricingFeatureCostRow[];
  compareRows: PricingCompareRow[];

  /** Short Herman editorial line shown at the end of the Pricing tab. */
  hermanTake: string | null;

  /** Product-specific H2 lead under Pricing. */
  pageIntro: string | null;
  /** Section intros — original analysis, not number restatements. */
  marketIntro: string | null;
  plansIntro: string | null;
  usageIntro: string | null;
  featureCostsIntro: string | null;
  compareIntro: string | null;
  /** Editor commentary shown under the market comparison table */
  comparisonNote: string | null;
  /** H4 under plans for free/paid limits table */
  limitsHeading: string;
  /** Short intro under Free vs. paid heading */
  freeVsPaidIntro: string | null;
  /** Free-access limits from a Free plan or testing answers */
  freeAccess: PricingFreeAccess | null;
  /**
   * When pricing entities were borrowed from another product (e.g. Aura ← Candy).
   * Public pages must not treat borrowed evidence as this product's verified pricing.
   */
  pricingDataSource: {
    productSlug: string;
    borrowed: boolean;
  };
  /** Editorial evidence — verified pricing screenshots for lightbox */
  pricingEvidence: {
    verifiedLabel: string;
    capturedLabel: string;
    sourceUrl: string | null;
    main: { src: string; alt: string; caption: string } | null;
    topUps: { src: string; alt: string; caption: string } | null;
    featureCosts: { src: string; alt: string; caption: string } | null;
  } | null;
}

/** Shared helper for hero comparison vs the typical (median) market price. */
export function computeHeroComparison(
  advertised: number | null,
  typicalPrice: number | null,
): { cheaperPct: number | null; savings: number | null } {
  if (advertised == null || typicalPrice == null || typicalPrice <= 0) {
    return { cheaperPct: null, savings: null };
  }
  const cheaperPct = Math.round(((typicalPrice - advertised) / typicalPrice) * 100);
  const savings = Math.round((typicalPrice - advertised) * 100) / 100;
  return { cheaperPct, savings };
}

export function clampBarPct(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.round(((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100);
}
