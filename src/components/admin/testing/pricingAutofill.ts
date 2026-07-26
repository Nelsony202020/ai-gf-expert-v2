// Pricing evidence auto-fill: computes suggested answers for pricing-related
// evidence definitions from the data editors already enter in the Pricing tab
// (plan tiers, credit packages, feature costs). Suggestions are shown to the
// tester, who reviews and saves them — nothing is written automatically.
//
// Keyed by "<category slug>/<evidence slug>" because slugs repeat across
// categories (e.g. images/cost and video/cost).

import type { EntityRow } from '../api';
import {
  bestValuePackage,
  cheapestTopUpRate,
  estimatedFeatureMoneyCost,
  fmtMoney,
  lowestPlainMonthlyPrice,
  monthlyEquivalent,
  packageTotalCredits,
  pricePerCredit,
  scenarioMonthlyCost,
  tierBillingOptions,
  type CreditPackageLike,
  type FeatureCostLike,
  type PlanTierLike,
} from '../../../lib/pricing/calc';
import type { RawValue } from './EvidenceInput';

export interface AutofillSuggestion {
  raw: RawValue;
  /** Short human explanation of where the value came from. */
  note: string;
}

export interface PricingSourceData {
  plans: EntityRow[];
  packages: EntityRow[];
  featureCosts: EntityRow[];
}

const REGULAR_USE = { images: 20, videos: 4, voiceMinutes: 30, messages: 500 };
const HEAVY_USE = { images: 100, videos: 20, voiceMinutes: 120, messages: 2000 };

/**
 * Builds suggestions from the product's pricing records. Only returns entries
 * it can actually compute — missing data simply produces no suggestion.
 */
export function computePricingSuggestions(
  source: PricingSourceData,
): Map<string, AutofillSuggestion> {
  const out = new Map<string, AutofillSuggestion>();

  const tiers = source.plans.filter((p) => p.active !== false) as unknown as PlanTierLike[];
  const packages = source.packages.filter((p) => p.active !== false) as unknown as CreditPackageLike[];
  const costs = source.featureCosts.filter((c) => c.active !== false) as unknown as FeatureCostLike[];

  const findCost = (...types: string[]) =>
    costs.find((c) => types.includes(String(c.featureType ?? ''))) ?? null;
  const bestPkg = bestValuePackage(packages);

  // --- Subscription -------------------------------------------------------
  const plainMonthly = lowestPlainMonthlyPrice(tiers);
  if (plainMonthly !== null) {
    out.set('pricing/monthly-price', {
      raw: { value: plainMonthly },
      note: `Cheapest monthly plan in the Pricing tab (${fmtMoney(plainMonthly)}).`,
    });
  }

  // Effective monthly price on the cheapest annual option.
  let annualEq: number | null = null;
  let annualTotal: number | null = null;
  for (const tier of tiers) {
    for (const opt of tierBillingOptions(tier)) {
      if (opt.active === false || opt.interval !== 'yearly') continue;
      const eq = monthlyEquivalent(opt);
      if (eq !== null && (annualEq === null || eq < annualEq)) {
        annualEq = eq;
        annualTotal = opt.price;
      }
    }
  }
  if (annualEq !== null) {
    out.set('pricing/annual-price', {
      raw: { value: annualEq, detail: { annualTotal } },
      note: `${fmtMoney(annualTotal)} per year → ${fmtMoney(annualEq)}/month effective.`,
    });
  }

  // Free plan: only suggested when a $0 tier exists (the 7-day usage test is
  // still the tester's call).
  const hasFreeTier = tiers.some((t) =>
    tierBillingOptions(t).some((o) => o.active !== false && o.price === 0),
  );
  if (hasFreeTier) {
    out.set('pricing/free-plan', {
      raw: { status: 'yes' },
      note: 'A $0 plan tier exists in the Pricing tab. Confirm with the 7-day usage test.',
    });
  }

  const hasTrial = tiers.some((t) =>
    tierBillingOptions(t).some((o) => o.active !== false && o.freeTrial),
  );
  if (hasTrial) {
    out.set('pricing/free-trial', {
      raw: { status: 'yes' },
      note: 'At least one plan option is marked "free trial" in the Pricing tab.',
    });
  }

  // Included credits on the cheapest tier (same convention as scenario costs).
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

  // --- Extra costs ---------------------------------------------------------
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
        note: `Calculated from the Pricing tab: standard image at the cheapest package rate.`,
      });
    }
  }

  const videoCost = findCost('standard_video', 'text_to_video', 'image_to_video');
  if (videoCost && bestPkg) {
    const money = estimatedFeatureMoneyCost(bestPkg, videoCost);
    if (money) {
      out.set('pricing/video-cost', {
        raw: { value: money.max },
        note: `Standard video cost at the cheapest credit package rate (${fmtMoney(money.min)}–${fmtMoney(money.max)}).`,
      });
      out.set('video/cost', {
        raw: { value: money.max },
        note: `Calculated from the Pricing tab: standard video at the cheapest package rate.`,
      });
    }
  }

  const voiceCost = findCost('voice_call', 'voice_message');
  if (voiceCost && bestPkg) {
    const money = estimatedFeatureMoneyCost(bestPkg, voiceCost);
    if (money) {
      out.set('pricing/voice-cost', {
        raw: { value: money.max },
        note: `Voice cost at the cheapest credit package rate (${fmtMoney(money.min)}–${fmtMoney(money.max)}).`,
      });
    }
  }

  // Top-up packages: smallest and largest with per-credit rate.
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
    out.set('pricing/top-ups', {
      raw: {
        text:
          priced.length === 1
            ? `Single package: ${fmt(smallest)}`
            : `Smallest: ${fmt(smallest)} · Largest: ${fmt(largest)}`,
      },
      note: rate !== null ? `Best rate: ${fmtMoney(rate)} per 100 credits.` : 'From the Pricing tab packages.',
    });
  }

  // --- Value scenarios -----------------------------------------------------
  function scenarioUsage(u: typeof REGULAR_USE): Record<string, number> {
    const usage: Record<string, number> = {};
    if (imageCost?.featureType) usage[String(imageCost.featureType)] = u.images;
    if (videoCost?.featureType) usage[String(videoCost.featureType)] = u.videos;
    // Scenarios only price voice calls (per minute); voice messages have no
    // clean per-minute mapping.
    if (voiceCost?.featureType === 'voice_call') usage.voice_call = u.voiceMinutes;
    const messageCost = findCost('premium_message');
    if (messageCost?.featureType) usage[String(messageCost.featureType)] = u.messages;
    return usage;
  }

  const regular = scenarioMonthlyCost({ usage: scenarioUsage(REGULAR_USE) }, tiers, costs, packages);
  if (regular?.totalMonthly != null) {
    out.set('pricing/real-cost', {
      raw: { value: regular.totalMonthly, detail: { planCost: regular.planCost, topUpCost: regular.topUpCost } },
      note: `Regular use (500 msgs, 20 images, 4 videos, 30 voice min): ${fmtMoney(regular.planCost)} plan + ${fmtMoney(regular.topUpCost)} top-ups.`,
    });
  }
  const heavy = scenarioMonthlyCost({ usage: scenarioUsage(HEAVY_USE) }, tiers, costs, packages);
  if (heavy?.totalMonthly != null) {
    out.set('pricing/heavy-use-cost', {
      raw: { value: heavy.totalMonthly, detail: { planCost: heavy.planCost, topUpCost: heavy.topUpCost } },
      note: `Heavy use (2000 msgs, 100 images, 20 videos, 120 voice min): ${fmtMoney(heavy.planCost)} plan + ${fmtMoney(heavy.topUpCost)} top-ups.`,
    });
  }

  return out;
}
