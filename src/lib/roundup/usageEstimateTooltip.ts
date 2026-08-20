import type { AtGlanceTooltip } from '../../data/roundups/ai-girlfriend';
import { fmtMoney } from '../pricing/calc';
import type { PricingUsageTier } from '../pricing-tab/types';
import type { UsageCalcFeatureRow, UsageCalculation } from '../pricing/usageScenarios';
import { reviewPageUrl } from '../slugs';

export interface TooltipMoneyParts {
  /** e.g. "~$48.98" or "$13.99" */
  main: string;
  /** Always "/mo" when monthly */
  period: string;
  /** Extra credits row uses accent styling */
  accent?: boolean;
}

export interface TooltipAssumptionRow {
  icon: 'image' | 'videocam' | 'call';
  /** e.g. "3", "0.5", "1.5" */
  value: string;
  /** e.g. "images", "videos", "min of calls" */
  label: string;
}

function parseDailyAmount(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed || trimmed === 'None' || trimmed === 'Occasional') return null;
  const slash = trimmed.match(/^~?([\d.]+)\/day$/);
  if (slash) return slash[1]!;
  const min = trimmed.match(/^~?([\d.]+)\s*min\/day$/i);
  if (min) return min[1]!;
  return null;
}

function assumptionRow(feature: UsageCalcFeatureRow): TooltipAssumptionRow | null {
  if (feature.assumptionLabel === 'None') return null;

  if (feature.key === 'images') {
    const n = parseDailyAmount(feature.assumptionLabel);
    return n ? { icon: 'image', value: n, label: 'images' } : null;
  }

  if (feature.key === 'videos') {
    const n = parseDailyAmount(feature.assumptionLabel.split('(')[0]!.trim());
    return n ? { icon: 'videocam', value: n, label: 'videos' } : null;
  }

  if (feature.key === 'voice') {
    if (feature.assumptionLabel === 'Occasional') return null;
    const n = parseDailyAmount(feature.assumptionLabel);
    if (!n) return null;
    const isCall = feature.label.toLowerCase().includes('call');
    return {
      icon: 'call',
      value: n,
      label: isCall ? 'min of calls' : 'min of voice messages',
    };
  }

  return null;
}

function assumptionsFromCalculation(calc: UsageCalculation): TooltipAssumptionRow[] {
  const rows: TooltipAssumptionRow[] = [];
  for (const feature of calc.features) {
    const row = assumptionRow(feature);
    if (row) rows.push(row);
  }
  return rows;
}

function moneyParts(
  amount: number | null | undefined,
  currency: string,
  approximate = false,
  accent = false,
): TooltipMoneyParts | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const formatted = fmtMoney(amount, currency);
  const main = approximate && amount > 0 ? `~${formatted}` : formatted;
  return { main, period: '/mo', accent };
}

function costDriverNote(calc: UsageCalculation): string | null {
  if ((calc.topUpCost ?? 0) <= 0) return null;

  const media = calc.features.filter(
    (f) => (f.key === 'images' || f.key === 'videos' || f.key === 'voice') && f.cost > 0,
  );
  if (media.length === 0) return null;

  const top = [...media].sort((a, b) => b.cost - a.cost)[0]!;
  const labels: Record<string, string> = {
    images: 'images',
    videos: 'video',
    voice: 'voice calls',
  };
  const name = labels[top.key] ?? top.label.toLowerCase();
  return `Most extra spend comes from ${name}.`;
}

function tooltipCopy(kind: 'regular' | 'power'): {
  title: string;
  subtitle: string;
} {
  if (kind === 'regular') {
    return {
      title: 'REGULAR USE COST',
      subtitle: 'Typical monthly cost for a regular user.',
    };
  }
  return {
    title: 'POWER USE COST',
    subtitle: 'Typical monthly cost for a power user.',
  };
}

function tierHasVerifiedEstimate(tier: PricingUsageTier | undefined): tier is PricingUsageTier {
  if (!tier) return false;
  if (tier.monthlyCost == null || !Number.isFinite(tier.monthlyCost)) return false;
  if (!tier.calculation) return false;
  if (tier.planCost == null || !Number.isFinite(tier.planCost)) return false;
  if (tier.topUpCost == null || !Number.isFinite(tier.topUpCost)) return false;
  return true;
}

/** Build roundup pricing tooltip — same usage tier + calculation as admin / public Pricing tab. */
export function buildUsageEstimateTooltip(
  productSlug: string,
  currency: string,
  kind: 'regular' | 'power',
  tier: PricingUsageTier | undefined,
): AtGlanceTooltip | undefined {
  if (!tierHasVerifiedEstimate(tier)) return undefined;

  const calc = tier.calculation!;
  const assumptions = assumptionsFromCalculation(calc);
  const { title, subtitle } = tooltipCopy(kind);

  const subscription = moneyParts(tier.planCost, currency, false);
  const extraCredits = moneyParts(tier.topUpCost, currency, true, true);
  const total = moneyParts(tier.monthlyCost, currency, true);
  if (!subscription || !extraCredits || !total) return undefined;

  return {
    title,
    subtitle,
    amount: total,
    assumptions,
    subscription,
    extraCredits,
    total,
    costDriverNote: costDriverNote(calc),
    pricingHref: `${reviewPageUrl(productSlug)}#pricing`,
  };
}

/** Cell label when calculator data is missing — never invent a monthly estimate. */
export function usageEstimateUnavailableLabel(): string {
  return 'Not enough data';
}
