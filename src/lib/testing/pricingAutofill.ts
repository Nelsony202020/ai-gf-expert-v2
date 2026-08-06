// Pricing evidence auto-fill from plan tiers, credit packages, and feature costs.

import {
  bestValuePackage,
  cheapestTopUpRate,
  estimatedFeatureMoneyCost,
  fmtMoney,
  intervalDiscount,
  lowestPlainMonthlyPrice,
  monthlyEquivalent,
  packageTotalCredits,
  pricePerCredit,
  scenarioMonthlyCost,
  tierBillingOptions,
  type CreditPackageLike,
  type FeatureCostLike,
  type PlanTierLike,
} from '../pricing/calc';
import { findCheapestCost } from '../pricing/featureCostGroups';
import { normalizeEvidence, type RawValue, type ScoringRule } from '../scoring/engine';
import { formatEvidenceAnswer } from './evidenceFormat';
import { PRICING_AUTOFILL_SLUGS } from './pricingEvidenceSlugs';

export interface AutofillSuggestion {
  raw: RawValue;
  note: string;
}

export interface PricingSourceData {
  plans: Record<string, unknown>[];
  packages: Record<string, unknown>[];
  featureCosts: Record<string, unknown>[];
  paymentProfile?: Record<string, unknown> | null;
}

const REGULAR_USE = { images: 20, videos: 4, voiceMinutes: 30, messages: 500 };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Normalize a per-unit cost to dollars per 10 seconds (video / voice message). */
export function normalizeCostPer10Sec(money: number, cost: FeatureCostLike): number {
  const unit = String(cost.unit ?? '');
  const duration = Number(cost.durationProduced);
  const hasDuration = Number.isFinite(duration) && duration > 0;

  if (unit === 'per_second') {
    const secs = hasDuration ? duration : 1;
    return round2((money / secs) * 10);
  }
  if (unit === 'per_video') {
    const secs = hasDuration ? duration : 10;
    return round2((money / secs) * 10);
  }
  if (unit === 'per_minute') {
    return round2(money / 6);
  }
  if (unit === 'per_message') {
    const secs = hasDuration ? duration : 10;
    return round2((money / secs) * 10);
  }
  return round2(money);
}

export interface PricingAutofillDef {
  measurementType: string;
  scoringRule: ScoringRule;
  unit?: string;
}

/** Evidence row shape used when overlaying live Pricing tab values onto assembled test data. */
export interface PricingAutofillEvidenceRow {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  subscoreSlug: string;
  required: boolean;
  weight: number;
  normalizedScore: number | null;
  publicResult: string | null;
  notApplicable: boolean;
  isUnknown: boolean;
}

/**
 * Overlay live Pricing tab autofill onto assembled evidence (e.g. payment privacy).
 * Keeps drawer breakdown in sync when pricing profile changes without re-testing.
 */
export function applyPricingAutofillToEvidence(
  evidence: PricingAutofillEvidenceRow[],
  defsByKey: Map<string, PricingAutofillDef>,
  source: PricingSourceData,
): void {
  const suggestions = computePricingSuggestions(source);
  for (const item of evidence) {
    if (!PRICING_AUTOFILL_SLUGS.has(item.slug)) continue;
    const key = `${item.categorySlug}/${item.slug}`;
    const suggestion = suggestions.get(key);
    const def = defsByKey.get(key);
    if (!suggestion || !def) continue;

    const { score } = normalizeEvidence({
      definitionId: item.id,
      slug: item.slug,
      name: item.name,
      subscoreSlug: item.subscoreSlug,
      categorySlug: item.categorySlug,
      weight: item.weight,
      required: item.required,
      measurementType: def.measurementType,
      scoringRule: def.scoringRule,
      rawValue: suggestion.raw,
    });

    item.normalizedScore = score;
    item.notApplicable = false;
    item.isUnknown = false;
    const answer = formatEvidenceAnswer(
      { unit: def.unit, measurementType: def.measurementType, slug: item.slug },
      suggestion.raw,
      false,
      false,
    );
    item.publicResult = answer.trim() || null;
  }
}

export function computePricingSuggestions(source: PricingSourceData): Map<string, AutofillSuggestion> {
  const out = new Map<string, AutofillSuggestion>();

  const tiers = source.plans.filter((p) => p.active !== false) as unknown as PlanTierLike[];
  const packages = source.packages.filter((p) => p.active !== false) as unknown as CreditPackageLike[];
  const costs = source.featureCosts.filter((c) => c.active !== false) as unknown as FeatureCostLike[];

  const findCost = (...types: string[]) => findCheapestCost(costs, types);
  const bestPkg = bestValuePackage(packages);

  const plainMonthly = lowestPlainMonthlyPrice(tiers);
  if (plainMonthly !== null) {
    out.set('pricing/monthly-price', {
      raw: { value: plainMonthly },
      note: `Cheapest monthly plan in the Pricing tab (${fmtMoney(plainMonthly)}).`,
    });
  }

  let annualEq: number | null = null;
  let annualTotal: number | null = null;
  let annualDiscountPct: number | null = null;
  for (const tier of tiers) {
    for (const opt of tierBillingOptions(tier)) {
      if (opt.active === false || opt.interval !== 'yearly') continue;
      const eq = monthlyEquivalent(opt);
      if (eq !== null && (annualEq === null || eq < annualEq)) {
        annualEq = eq;
        annualTotal = opt.price;
        if (plainMonthly !== null) {
          annualDiscountPct = intervalDiscount(plainMonthly, opt);
        }
      }
    }
  }
  if (annualEq !== null) {
    out.set('pricing/annual-price', {
      raw: { value: annualEq, detail: { annualTotal } },
      note: `${fmtMoney(annualTotal)} per year → ${fmtMoney(annualEq)}/month effective.`,
    });
  }
  if (annualDiscountPct !== null && annualDiscountPct > 0) {
    out.set('pricing/annual-discount', {
      raw: { value: annualDiscountPct },
      note: `${annualDiscountPct.toFixed(1)}% cheaper than paying monthly for 12 months.`,
    });
  }

  let cheapestTier: PlanTierLike | null = null;
  let cheapestPrice = Infinity;
  for (const tier of tiers) {
    for (const opt of tierBillingOptions(tier)) {
      if (opt.active === false) continue;
      const eq = monthlyEquivalent(opt);
      if (eq !== null && eq < cheapestPrice) {
        cheapestPrice = eq;
        cheapestTier = tier;
      }
    }
  }
  const includedCredits = Number(cheapestTier?.includedTokens);
  if (Number.isFinite(includedCredits) && includedCredits > 0) {
    out.set('pricing/included-credits', {
      raw: { value: includedCredits },
      note: `Included credits on the cheapest tier (${cheapestTier?.name ?? 'unnamed'}).`,
    });
  }

  const imageCost = findCost('standard_image');
  if (imageCost && bestPkg) {
    const money = estimatedFeatureMoneyCost(bestPkg, imageCost);
    if (money) {
      out.set('pricing/image-cost', {
        raw: { value: money.max },
        note: `Standard image cost at the cheapest credit package rate (${fmtMoney(money.min)}–${fmtMoney(money.max)}).`,
      });
      out.set('images/cost', {
        raw: { value: money.max },
        note: 'Calculated from the Pricing tab: standard image at the cheapest package rate.',
      });
    }
  }

  const videoCost = findCost(
    'standard_video',
    'premium_video',
    'text_to_video',
    'image_to_video',
    'live_cam_video',
    'custom',
  );
  if (videoCost && bestPkg) {
    const money = estimatedFeatureMoneyCost(bestPkg, videoCost);
    if (money) {
      const per10 = normalizeCostPer10Sec(money.max, videoCost);
      out.set('pricing/video-cost', {
        raw: { value: per10, detail: { rawCost: money.max, unit: videoCost.unit, durationProduced: videoCost.durationProduced } },
        note: `Standard video normalized to ${fmtMoney(per10)} / 10 sec (raw ${fmtMoney(money.max)}).`,
      });
      out.set('video/cost', {
        raw: { value: per10 },
        note: 'Calculated from the Pricing tab: standard video normalized to cost per 10 sec.',
      });
    }
  }

  const voiceMessageCost = findCost('voice_message');
  if (voiceMessageCost && bestPkg) {
    const money = estimatedFeatureMoneyCost(bestPkg, voiceMessageCost);
    if (money) {
      const per10 = normalizeCostPer10Sec(money.max, voiceMessageCost);
      out.set('pricing/voice-cost', {
        raw: { value: per10, detail: { rawCost: money.max, unit: voiceMessageCost.unit, durationProduced: voiceMessageCost.durationProduced } },
        note: `Voice message normalized to ${fmtMoney(per10)} / 10 sec.`,
      });
    }
  }

  const voiceCallCost = findCost('voice_call');
  if (voiceCallCost && bestPkg) {
    const money = estimatedFeatureMoneyCost(bestPkg, voiceCallCost);
    if (money) {
      out.set('pricing/call-cost', {
        raw: { value: money.max },
        note: `Voice call cost per minute at the cheapest credit package rate (${fmtMoney(money.min)}–${fmtMoney(money.max)}).`,
      });
    }
  }

  const voiceCost = voiceCallCost ?? voiceMessageCost;

  const priced = packages
    .map((p) => ({ pkg: p, price: Number(p.price), credits: packageTotalCredits(p) }))
    .filter((x) => Number.isFinite(x.price) && x.credits !== null && x.credits > 0)
    .sort((a, b) => a.price - b.price);
  if (priced.length > 0) {
    const fmt = (x: (typeof priced)[number]) => {
      const rate = pricePerCredit(x.pkg);
      return `${fmtMoney(x.price)} for ${x.credits} credits${rate !== null ? ` (${fmtMoney(rate)}/credit)` : ''}`;
    };
    const smallest = priced[0];
    const largest = priced[priced.length - 1];
    const rate = cheapestTopUpRate(packages);
    out.set('pricing/top-up-value', {
      raw: {
        text:
          priced.length === 1
            ? `Single package: ${fmt(smallest)}`
            : `Smallest: ${fmt(smallest)} · Largest: ${fmt(largest)}`,
      },
      note: rate !== null ? `Best rate: ${fmtMoney(rate)} per 100 credits.` : 'From the Pricing tab packages.',
    });
  }

  function scenarioUsage(u: typeof REGULAR_USE): Record<string, number> {
    const usage: Record<string, number> = {};
    if (imageCost?.featureType) usage[String(imageCost.featureType)] = u.images;
    if (videoCost?.featureType) usage[String(videoCost.featureType)] = u.videos;
    if (voiceCost?.featureType === 'voice_call') usage.voice_call = u.voiceMinutes;
    const messageCost = findCost('premium_message');
    if (messageCost?.featureType) usage[String(messageCost.featureType)] = u.messages;
    return usage;
  }

  const regular = scenarioMonthlyCost({ usage: scenarioUsage(REGULAR_USE) }, tiers, costs, packages);
  if (regular?.totalMonthly != null) {
    out.set('pricing/monthly-spend', {
      raw: { value: regular.totalMonthly, detail: { planCost: regular.planCost, topUpCost: regular.topUpCost } },
      note: `Regular use (500 msgs, 20 images, 4 videos, 30 voice min): ${fmtMoney(regular.planCost)} plan + ${fmtMoney(regular.topUpCost)} top-ups.`,
    });
  }

  const profile = source.paymentProfile;
  if (profile) {
    const discreet = Boolean(profile.discreetBilling);
    const descriptor = String(profile.billingDescriptor ?? '').trim();
    out.set('pricing/payment-privacy', {
      raw: discreet
        ? { status: 'yes' as const, detail: descriptor ? { label: descriptor } : undefined }
        : { status: 'no' as const },
      note: discreet
        ? `Discreet billing enabled${descriptor ? ` (${descriptor})` : ''} — from the Pricing tab.`
        : 'Discreet billing not enabled — from the Pricing tab.',
    });
  }

  return out;
}
