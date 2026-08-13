// Pricing evidence auto-fill from plan tiers, credit packages, and feature costs.

import {
  bestValuePackage,
  cheapestTopUpRate,
  estimatedFeatureMoneyCost,
  featureCostAvailability,
  fmtMoney,
  intervalDiscount,
  lowestPlainMonthlyPrice,
  monthlyEquivalent,
  packageTotalCredits,
  pricePerCredit,
  resolveReferenceTier,
  resolveTierForFeature,
  scenarioMonthlyCost,
  tierBillingOptions,
  type CreditPackageLike,
  type FeatureCostLike,
  type PlanTierLike,
} from '../pricing/calc';
import { findCheapestCost } from '../pricing/featureCostGroups';
import {
  findAllowance,
  resolvePlanAllowances,
  USAGE_TO_ALLOWANCE_KEYS,
} from '../pricing/planAllowances';
import { normalizeEvidence, type RawValue, type ScoringRule } from '../scoring/engine';
import { formatEvidenceAnswer } from './evidenceFormat';
import { PRICING_AUTOFILL_SLUGS } from './pricingEvidenceSlugs';

export interface AutofillSuggestion {
  raw: RawValue;
  note: string;
  /** When true, treat as unknown rather than a scored numeric answer. */
  isUnknown?: boolean;
}

export interface PricingSourceData {
  plans: Record<string, unknown>[];
  packages: Record<string, unknown>[];
  featureCosts: Record<string, unknown>[];
  paymentProfile?: Record<string, unknown> | null;
  referencePlanName?: string | null;
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
      isUnknown: Boolean(suggestion.isUnknown),
    });

    item.normalizedScore = suggestion.isUnknown ? null : score;
    item.notApplicable = false;
    item.isUnknown = Boolean(suggestion.isUnknown);
    if (suggestion.isUnknown && 'text' in suggestion.raw) {
      item.publicResult = String(suggestion.raw.text);
    } else {
      const answer = formatEvidenceAnswer(
        { unit: def.unit, measurementType: def.measurementType, slug: item.slug },
        suggestion.raw,
        false,
        false,
      );
      item.publicResult = answer.trim() || null;
    }
  }
}

function allowanceForFeature(tier: PlanTierLike | null, featureTypes: string[]) {
  if (!tier) return undefined;
  const allowances = resolvePlanAllowances(tier);
  const keys = featureTypes.flatMap((t) => USAGE_TO_ALLOWANCE_KEYS[t] ?? [t]);
  return findAllowance(allowances, keys);
}

export function computePricingSuggestions(source: PricingSourceData): Map<string, AutofillSuggestion> {
  const out = new Map<string, AutofillSuggestion>();

  const tiers = source.plans.filter((p) => p.active !== false) as unknown as PlanTierLike[];
  const packages = source.packages.filter((p) => p.active !== false) as unknown as CreditPackageLike[];
  const costs = source.featureCosts.filter((c) => c.active !== false) as unknown as FeatureCostLike[];

  /** Prefer a priced credit cost; otherwise any matching row (unknown / empty). */
  const findCost = (...types: string[]): FeatureCostLike | null => {
    const priced = findCheapestCost(costs, types);
    if (priced) return priced;
    return (
      costs.find((c) => types.includes(String((c as { featureType?: string }).featureType ?? ''))) ??
      null
    );
  };
  const bestPkg = bestValuePackage(packages);
  const metricTier = resolveReferenceTier(tiers, source.referencePlanName);

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

  const includedFromAllowance = metricTier
    ? findAllowance(resolvePlanAllowances(metricTier), 'shared_credits')
    : undefined;
  const includedCredits =
    includedFromAllowance?.quantity ?? Number(metricTier?.includedTokens);
  if (Number.isFinite(includedCredits) && includedCredits > 0) {
    out.set('pricing/included-credits', {
      raw: { value: includedCredits },
      note: `Included credits on ${metricTier?.name ?? 'reference'} tier.`,
    });
  } else if (metricTier) {
    // Cheapest/reference monthly plan has no shared credit pool — still answer the question.
    out.set('pricing/included-credits', {
      raw: { value: 0 },
      note: `${metricTier.name ?? 'Reference'} plan has no shared credit pool (allowances are feature-quantity based).`,
    });
  }

  function setFeatureMoneyCost(
    slugKeys: string[],
    featureTypes: string[],
    normalize?: (money: number, cost: FeatureCostLike) => number,
  ) {
    // Always price against the reference / cheapest monthly plan (not "depends on plan").
    const tierForFeature = resolveTierForFeature(
      tiers,
      featureTypes,
      source.referencePlanName,
    );
    const allowance = allowanceForFeature(tierForFeature, featureTypes);
    if (allowance?.accessType === 'unlimited') {
      for (const key of slugKeys) {
        out.set(key, {
          raw: { value: 0 },
          note: `Unlimited on ${tierForFeature?.name ?? 'reference plan'} — overage cost $0.`,
        });
      }
      return;
    }
    if (allowance?.accessType === 'not_included') {
      for (const key of slugKeys) {
        out.set(key, {
          raw: { text: 'Not included' },
          note: `Not available on ${tierForFeature?.name ?? 'reference plan'}.`,
          isUnknown: true,
        });
      }
      return;
    }

    const cost = findCost(...featureTypes);
    if (!cost) {
      // Included allotment with no overage row → $0; otherwise unknown.
      if (
        allowance?.accessType === 'included_quantity' ||
        allowance?.accessType === 'included_unspecified' ||
        allowance?.accessType === 'included_credits'
      ) {
        for (const key of slugKeys) {
          out.set(key, {
            raw: { value: 0 },
            note: `Included on ${tierForFeature?.name ?? 'reference plan'} — no separate credit overage cost recorded.`,
          });
        }
        return;
      }
      for (const key of slugKeys) {
        out.set(key, {
          raw: { text: 'Cost unknown' },
          note: 'No feature credit cost in the Pricing tab — leave blank or set a cost.',
          isUnknown: true,
        });
      }
      return;
    }

    const availability = featureCostAvailability(cost);
    if (availability === 'unlimited' || availability === 'included') {
      for (const key of slugKeys) {
        out.set(key, {
          raw: { value: 0 },
          note: `${availability === 'unlimited' ? 'Unlimited' : 'Included'} in Feature Costs — $0 overage.`,
        });
      }
      return;
    }
    if (availability === 'not_available') {
      for (const key of slugKeys) {
        out.set(key, {
          raw: { text: 'Not included' },
          note: 'Feature cost marked not available.',
          isUnknown: true,
        });
      }
      return;
    }
    if (availability === 'unknown' || availability === 'pay_as_you_go') {
      for (const key of slugKeys) {
        out.set(key, {
          raw: { text: 'Cost unknown' },
          note:
            availability === 'pay_as_you_go'
              ? 'Feature is pay-as-you-go without a fixed credit amount in the Pricing tab.'
              : 'Feature cost recorded without a credit amount.',
          isUnknown: true,
        });
      }
      return;
    }

    if (!bestPkg) return;
    const money = estimatedFeatureMoneyCost(bestPkg, cost);
    if (!money) {
      for (const key of slugKeys) {
        out.set(key, {
          raw: { text: 'Cost unknown' },
          note: 'Could not convert feature credits to money — check token packages.',
          isUnknown: true,
        });
      }
      return;
    }
    const value = normalize ? normalize(money.max, cost) : money.max;
    for (const key of slugKeys) {
      out.set(key, {
        raw: {
          value,
          detail: normalize
            ? { rawCost: money.max, unit: cost.unit, durationProduced: cost.durationProduced }
            : undefined,
        },
        note: `From Pricing tab (${tierForFeature?.name ?? 'cheapest tier'}) at best package rate.`,
      });
    }
  }

  setFeatureMoneyCost(['pricing/image-cost', 'images/cost'], ['standard_image']);
  setFeatureMoneyCost(
    ['pricing/video-cost', 'video/cost'],
    ['standard_video', 'premium_video', 'text_to_video', 'image_to_video', 'live_cam_video', 'custom'],
    normalizeCostPer10Sec,
  );
  setFeatureMoneyCost(['pricing/voice-cost'], ['voice_message'], normalizeCostPer10Sec);
  setFeatureMoneyCost(['pricing/call-cost'], ['voice_call']);

  // Monthly-spend scenarios only bill features with a real credit price.
  // Unknown/empty feature-cost rows must not zero out an otherwise computable total.
  const imageCost = findCheapestCost(costs, ['standard_image']);
  const videoCost = findCheapestCost(costs, [
    'standard_video',
    'premium_video',
    'text_to_video',
    'image_to_video',
    'live_cam_video',
    'custom',
  ]);
  const voiceMessageCost = findCheapestCost(costs, ['voice_message']);
  const voiceCallCost = findCheapestCost(costs, ['voice_call']);
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
    const messageCost = findCheapestCost(costs, ['premium_message']);
    if (messageCost?.featureType) usage[String(messageCost.featureType)] = u.messages;
    return usage;
  }

  const regular = scenarioMonthlyCost(
    { usage: scenarioUsage(REGULAR_USE) },
    tiers,
    costs,
    packages,
    source.referencePlanName,
  );
  if (regular?.totalMonthly != null) {
    out.set('pricing/monthly-spend', {
      raw: {
        value: regular.totalMonthly,
        detail: {
          planCost: regular.planCost,
          topUpCost: regular.topUpCost,
          planName: regular.planName,
        },
      },
      note: `Regular use on ${regular.planName ?? 'reference plan'} (500 msgs, 20 images, 4 videos, 30 voice min): ${fmtMoney(regular.planCost)} plan + ${fmtMoney(regular.topUpCost)} top-ups.`,
    });
  } else if (regular?.incomplete || (regular?.unavailableFeatures?.length ?? 0) > 0) {
    out.set('pricing/monthly-spend', {
      raw: { text: 'Depends on plan' },
      note: 'Could not fully price regular use for the reference plan (missing costs or unavailable features).',
      isUnknown: true,
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
