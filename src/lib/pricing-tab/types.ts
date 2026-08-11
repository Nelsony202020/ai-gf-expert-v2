export interface PricingPlanColumn {
  key: string;
  name: string;
  priceLabel: string;
  priceSub?: string;
  badge?: string;
  tone: 'accent' | 'green' | 'neutral';
  rows: Array<{ label: string; value: string; included?: boolean }>;
}

export interface PricingUsageTier {
  id: 'casual' | 'regular' | 'power';
  title: string;
  description: string;
  icon: string;
  tone: 'green' | 'amber' | 'red';
  monthlyCost: number | null;
  costLabel: string;
}

export interface PricingFeatureCostRow {
  key: string;
  label: string;
  value: string;
  icon: string;
  tone: 'pink' | 'green' | 'amber' | 'purple' | 'blue';
}

export type PricingDiffTone = 'better' | 'worse' | 'neutral';

export interface PricingCompareRow {
  metric: string;
  productValue: string;
  averageValue: string;
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
  /** Category average used in the hero benchmark (monthly cost). */
  categoryAvgMonthly: number | null;
  reviewedAppCount: number | null;

  /** Hero benchmark uses sticker/advertised price vs category average. */
  heroCheaperPct: number | null;
  heroSavings: number | null;
  heroCheaperThanPct: number | null;

  barMin: number;
  barMax: number;
  /** Position of advertised price on the hero bar. */
  productBarPct: number | null;
  avgBarPct: number | null;

  plans: PricingPlanColumn[];
  usageTiers: PricingUsageTier[];
  advertisedVsRegularDiff: number | null;

  featureCosts: PricingFeatureCostRow[];
  compareRows: PricingCompareRow[];
}

/** Shared helper for hero comparison math. */
export function computeHeroComparison(
  advertised: number | null,
  categoryAvg: number | null,
): { cheaperPct: number | null; savings: number | null } {
  if (advertised == null || categoryAvg == null || categoryAvg <= 0) {
    return { cheaperPct: null, savings: null };
  }
  const cheaperPct = Math.round(((categoryAvg - advertised) / categoryAvg) * 100);
  const savings = Math.round((categoryAvg - advertised) * 100) / 100;
  return { cheaperPct, savings };
}

export function clampBarPct(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.round(((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100);
}
