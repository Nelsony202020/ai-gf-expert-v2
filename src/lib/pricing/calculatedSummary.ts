/**
 * Read-only calculated pricing summary for admin + shared inspection.
 * Numbers come from the same calc helpers used by the public Pricing tab.
 */

import {
  bestValuePackage,
  cheapestPricedFeatureCost,
  estimatedFeatureMoneyCost,
  featureCostAvailability,
  fmtMoney,
  lowestPlainMonthlyPrice,
  pricePerCredit,
  type CreditPackageLike,
  type FeatureCostLike,
  type PlanTierLike,
} from './calc';
import type { ProductType } from './productType';
import {
  defaultUsageProfilesForType,
  estimateProfile,
  profilesFromSnapshot,
} from './usageScenarios';

export interface PricingCalculatedRow {
  key: string;
  label: string;
  value: string;
  tip: string;
}

export interface PricingCalculatedSummary {
  currency: string;
  rows: PricingCalculatedRow[];
}

function money(amount: number | null | undefined, currency: string): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return fmtMoney(amount, currency);
}

function pickPriced(costs: FeatureCostLike[], ...types: string[]): FeatureCostLike | undefined {
  return cheapestPricedFeatureCost(costs, ...types);
}

function featureMoneyLabel(
  pkg: CreditPackageLike | null,
  cost: FeatureCostLike | undefined,
  currency: string,
  opts?: { multiplier?: number; suffix?: string },
): string {
  if (!pkg || !cost || featureCostAvailability(cost) !== 'priced') return '—';
  const moneyRange = estimatedFeatureMoneyCost(pkg, cost);
  if (!moneyRange) return '—';
  const mult = opts?.multiplier ?? 1;
  const min = moneyRange.min * mult;
  const max = moneyRange.max * mult;
  const suffix = opts?.suffix ?? '';
  if (min === max) {
    if (min > 0 && min < 0.01) return `<${money(0.01, currency)}${suffix}`;
    return `${money(min, currency)}${suffix}`;
  }
  return `${money(min, currency)}–${money(max, currency)}${suffix}`;
}

export function buildPricingCalculatedSummary(input: {
  tiers: PlanTierLike[];
  packages: CreditPackageLike[];
  featureCosts: FeatureCostLike[];
  usageScenarios?: unknown;
  productType?: ProductType | null;
  currency?: string;
  /** Median starting monthly price — public typical-price benchmark. */
  typicalMonthlyPrice?: number | null;
}): PricingCalculatedSummary {
  const currency = input.currency ?? 'USD';
  const activeTiers = input.tiers.filter((t) => (t as { active?: boolean }).active !== false);
  const starting = lowestPlainMonthlyPrice(activeTiers);
  const bestPkg = bestValuePackage(input.packages);
  const rate = bestPkg ? pricePerCredit(bestPkg) : null;

  const profiles =
    profilesFromSnapshot(input.usageScenarios, input.productType)
    ?? defaultUsageProfilesForType(input.productType);
  const light = estimateProfile(
    profiles.find((p) => p.id === 'casual') ?? profiles[0]!,
    activeTiers,
    input.featureCosts,
    input.packages,
  );
  const regular = estimateProfile(
    profiles.find((p) => p.id === 'regular') ?? profiles[0]!,
    activeTiers,
    input.featureCosts,
    input.packages,
  );
  const heavy = estimateProfile(
    profiles.find((p) => p.id === 'power') ?? profiles[profiles.length - 1]!,
    activeTiers,
    input.featureCosts,
    input.packages,
  );

  let marketPosition = '—';
  let marketTip = 'Compared with typical (median) starting subscription price.';
  if (starting != null && input.typicalMonthlyPrice != null && input.typicalMonthlyPrice > 0) {
    const pct = Math.round(
      ((input.typicalMonthlyPrice - starting) / input.typicalMonthlyPrice) * 100,
    );
    if (Math.abs(pct) <= 3) marketPosition = 'About average';
    else if (pct > 3) marketPosition = `${pct}% cheaper than typical`;
    else marketPosition = `${Math.abs(pct)}% more than typical`;
    marketTip = `Starting ${money(starting, currency)}/mo vs typical ${money(input.typicalMonthlyPrice, currency)}/mo.`;
  }

  const image = pickPriced(input.featureCosts, 'standard_image');
  const video = pickPriced(
    input.featureCosts,
    'standard_video',
    'text_to_video',
    'image_to_video',
  );
  const voiceMsg = pickPriced(input.featureCosts, 'voice_message');
  const voiceCall = pickPriced(input.featureCosts, 'voice_call');
  const character = pickPriced(
    input.featureCosts,
    'character_creation',
    'custom_character',
    'custom_ai',
  );

  const videoMult =
    video && String(video.unit ?? '') === 'per_second'
      ? Number(video.durationProduced) > 0
        ? Number(video.durationProduced)
        : 10
      : 1;
  const voiceMsgMult =
    voiceMsg && String(voiceMsg.unit ?? '') === 'per_minute' ? 10 / 60 : 1;

  const rows: PricingCalculatedRow[] = [
    {
      key: 'starting',
      label: 'Starting monthly price',
      value: starting != null ? `${money(starting, currency)}/mo` : '—',
      tip: 'Lowest plain monthly price across active subscription tiers.',
    },
    {
      key: 'market_typical',
      label: 'Typical monthly price',
      value:
        input.typicalMonthlyPrice != null
          ? `~${money(input.typicalMonthlyPrice, currency)}/mo`
          : '—',
      tip: 'Median starting subscription across reviewed apps in the category.',
    },
    {
      key: 'market_position',
      label: 'Market position',
      value: marketPosition,
      tip: marketTip,
    },
    {
      key: 'light',
      label: 'Light-use estimate',
      value: light.totalMonthly != null ? `~${money(light.totalMonthly, currency)}/mo` : '—',
      tip: 'Subscription + estimated credit top-ups for the light-use persona.',
    },
    {
      key: 'regular',
      label: 'Regular-use estimate',
      value: regular.totalMonthly != null ? `~${money(regular.totalMonthly, currency)}/mo` : '—',
      tip: 'Subscription + estimated credit top-ups for the regular-use persona.',
    },
    {
      key: 'heavy',
      label: 'Heavy-use estimate',
      value: heavy.totalMonthly != null ? `~${money(heavy.totalMonthly, currency)}/mo` : '—',
      tip: 'Subscription + estimated credit top-ups for the heavy-use persona.',
    },
    {
      key: 'best_pack',
      label: 'Best-value top-up',
      value: bestPkg
        ? `${String(bestPkg.name ?? 'Pack')} · ${money(Number(bestPkg.price), currency)} (${rate != null ? `${money(rate, currency)}/credit` : '—'})`
        : '—',
      tip: 'Active credit package with the lowest price per credit.',
    },
    {
      key: 'image',
      label: 'Cost per image',
      value: featureMoneyLabel(bestPkg, image, currency),
      tip: 'Credits per standard image × best-value pack $/credit.',
    },
    {
      key: 'video',
      label: 'Cost per 10s video',
      value: featureMoneyLabel(bestPkg, video, currency, { multiplier: videoMult }),
      tip: 'Normalized to ~10 seconds of video from feature credit cost.',
    },
    {
      key: 'voice',
      label: 'Cost per voice message',
      value: featureMoneyLabel(bestPkg, voiceMsg, currency, {
        multiplier: voiceMsgMult,
        suffix: voiceMsg && String(voiceMsg.unit ?? '') === 'per_message' ? ' / msg' : '',
      }),
      tip: 'Voice message cost normalized to a ~10s clip when priced per minute.',
    },
    {
      key: 'call',
      label: 'Cost per phone call minute',
      value: featureMoneyLabel(bestPkg, voiceCall, currency, { suffix: ' / min' }),
      tip: 'Credits per voice-call minute × best-value pack $/credit.',
    },
    {
      key: 'character',
      label: 'Custom character cost',
      value: featureMoneyLabel(bestPkg, character, currency, { suffix: ' / character' }),
      tip: 'Credits to create a custom character × best-value pack $/credit.',
    },
  ];

  return { currency, rows };
}
