// Plain-language usage personas for “what will I actually spend?” estimates.

import type { FeatureCostLike, CreditPackageLike, PlanTierLike, BillingPlanEstimate } from './calc';
import {
  billableCreditsForTier,
  bestValuePackage,
  creditsPerDisplayUse,
  estimateBillingPlans,
  featureCostRange,
  fmtMoney,
  pricePerCredit,
  resolveReferenceTier,
  scenarioMonthlyCost,
  scenarioMonthlyCostByTier,
} from './calc';

export type PresetId = 'casual' | 'regular' | 'power';

export const PRESET_ORDER: PresetId[] = ['casual', 'regular', 'power'];

export interface UsageProfile {
  id: PresetId;
  title: string;
  description: string;
  messagesPerDay: number;
  imagesPerDay: number;
  videosPerDay: number;
  voiceMinutesPerDay: number;
}

export const DAYS_PER_MONTH = 30;

export const DEFAULT_USAGE_PROFILES: UsageProfile[] = [
  {
    id: 'casual',
    title: 'Casual',
    description: 'Light daily use — a few messages and images.',
    messagesPerDay: 5,
    imagesPerDay: 5,
    videosPerDay: 0.2,
    voiceMinutesPerDay: 1,
  },
  {
    id: 'regular',
    title: 'Regular',
    description: 'Typical daily user — chat, images, and some video.',
    messagesPerDay: 20,
    imagesPerDay: 5,
    videosPerDay: 1,
    voiceMinutesPerDay: 1,
  },
  {
    id: 'power',
    title: 'Power user',
    description: 'Heavy daily use — long sessions across chat, images, and video.',
    messagesPerDay: 100,
    imagesPerDay: 20,
    videosPerDay: 2,
    voiceMinutesPerDay: 5,
  },
];

export function profileToMonthlyUsage(profile: UsageProfile) {
  return {
    messages: profile.messagesPerDay * DAYS_PER_MONTH,
    images: profile.imagesPerDay * DAYS_PER_MONTH,
    videos: profile.videosPerDay * DAYS_PER_MONTH,
    voiceMinutes: profile.voiceMinutesPerDay * DAYS_PER_MONTH,
  };
}

export function buildUsageMap(
  profile: UsageProfile,
  costs: FeatureCostLike[],
): Record<string, number> {
  const monthly = profileToMonthlyUsage(profile);
  const find = (...types: string[]) =>
    costs.find((c) => types.includes(String(c.featureType ?? '')) && c.active !== false);

  const imageCost = find('standard_image', 'premium_image');
  const videoCost = find('standard_video', 'text_to_video', 'image_to_video');
  const voiceCallCost = find('voice_call');
  const voiceMessageCost = find('voice_message');
  const messageCost = find('premium_message');

  const usage: Record<string, number> = {};
  if (imageCost?.featureType && monthly.images > 0) {
    usage[String(imageCost.featureType)] = monthly.images;
  }
  if (videoCost?.featureType && monthly.videos > 0) {
    const unit = String(videoCost.unit ?? '');
    const type = String(videoCost.featureType ?? '');
    // per_second costs need seconds, not video counts
    if (unit === 'per_second' || (type.includes('video') && unit !== 'per_video' && unit !== 'per_generation')) {
      const seconds =
        videoCost.durationProduced != null && Number(videoCost.durationProduced) > 0
          ? Number(videoCost.durationProduced)
          : 10;
      usage[String(videoCost.featureType)] = monthly.videos * seconds;
    } else {
      usage[String(videoCost.featureType)] = monthly.videos;
    }
  }
  if (voiceCallCost?.featureType && monthly.voiceMinutes > 0) {
    usage.voice_call = monthly.voiceMinutes;
  } else if (voiceMessageCost?.featureType && monthly.voiceMinutes > 0) {
    usage[String(voiceMessageCost.featureType)] = monthly.voiceMinutes;
  }
  if (messageCost?.featureType && monthly.messages > 0) {
    usage[String(messageCost.featureType)] = monthly.messages;
  }
  return usage;
}

export interface ProfileEstimate {
  profile: UsageProfile;
  billingPlans: BillingPlanEstimate[];
  /** Primary monthly-billed total (for testing sync). */
  totalMonthly: number | null;
  planCost: number | null;
  topUpCost: number | null;
  missingData: boolean;
  /** Compact per-tier monthly totals when plans differ. */
  byPlan?: Array<{ planName: string; totalMonthly: number | null }>;
}

export function estimateProfile(
  profile: UsageProfile,
  tiers: PlanTierLike[],
  costs: FeatureCostLike[],
  packages: CreditPackageLike[],
  referencePlanName?: string | null,
): ProfileEstimate {
  const usage = buildUsageMap(profile, costs);
  const scenario = { usage };
  const monthly = scenarioMonthlyCost(scenario, tiers, costs, packages, referencePlanName);
  const billingPlans = estimateBillingPlans(scenario, tiers, costs, packages);
  const byPlan = scenarioMonthlyCostByTier(scenario, tiers, costs, packages)
    .filter((row) => row.tier.name)
    .map((row) => ({
      planName: String(row.tier.name),
      totalMonthly: row.result?.totalMonthly ?? null,
    }));
  return {
    profile,
    billingPlans,
    totalMonthly: monthly?.totalMonthly ?? null,
    planCost: monthly?.planCost ?? null,
    topUpCost: monthly?.topUpCost ?? null,
    missingData: monthly === null,
    byPlan: byPlan.length > 1 ? byPlan : undefined,
  };
}

export function profilesFromSnapshot(stored: unknown): UsageProfile[] {
  const defaults = DEFAULT_USAGE_PROFILES.map((p) => ({ ...p }));
  if (!Array.isArray(stored) || stored.length === 0) return defaults;

  return PRESET_ORDER.map((id) => {
    const base = DEFAULT_USAGE_PROFILES.find((p) => p.id === id)!;
    const row = stored.find((s) => String((s as UsageProfile).id) === id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return { ...base };
    const legacyMessages = row.messages != null ? Number(row.messages) / DAYS_PER_MONTH : undefined;
    const legacyImages = row.images != null ? Number(row.images) / DAYS_PER_MONTH : undefined;
    const legacyVideos = row.videos != null ? Number(row.videos) / DAYS_PER_MONTH : undefined;
    const legacyVoice =
      row.voiceMinutes != null ? Number(row.voiceMinutes) / DAYS_PER_MONTH : undefined;
    return {
      id,
      title: String(row.title ?? base.title),
      description: String(row.description ?? base.description),
      messagesPerDay: Number(row.messagesPerDay ?? legacyMessages ?? base.messagesPerDay),
      imagesPerDay: Number(row.imagesPerDay ?? legacyImages ?? base.imagesPerDay),
      videosPerDay: Number(row.videosPerDay ?? legacyVideos ?? base.videosPerDay),
      voiceMinutesPerDay: Number(
        row.voiceMinutesPerDay ?? legacyVoice ?? base.voiceMinutesPerDay,
      ),
    };
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function findActiveCost(costs: FeatureCostLike[], ...types: string[]) {
  return costs.find((c) => types.includes(String(c.featureType ?? '')) && c.active !== false);
}

function formatPerDay(n: number, unit: string): string {
  if (n <= 0) return 'None';
  if (n < 1) return `~${Math.round(n * 10) / 10}/${unit}`;
  if (Number.isInteger(n)) return `${n}/${unit}`;
  return `~${Math.round(n * 10) / 10}/${unit}`;
}

export interface UsageCalcFeatureRow {
  key: string;
  label: string;
  icon: string;
  /** e.g. "5/day" */
  assumptionLabel: string;
  unitCostLabel: string;
  cost: number;
  /** Money or "Included" */
  costLabel: string;
  /** Hidden-by-default formula */
  mathDetail: string | null;
}

export interface UsageCalculation {
  /** e.g. "How we calculated regular use" */
  heading: string;
  intro: string;
  /** e.g. "See how we estimated ~$36.63/mo ↓" */
  summaryLabel: string;
  features: UsageCalcFeatureRow[];
  mediaValue: number;
  mediaValueLabel: string;
  includedCredits: number;
  includedValue: number;
  includedValueLabel: string;
  extraValue: number;
  extraValueLabel: string;
  planCost: number;
  planCostLabel: string;
  topUpCost: number;
  topUpCostLabel: string;
  total: number;
  totalLabel: string;
}

/**
 * Transparent usage → unit cost → monthly math for the “See how we estimated” panel.
 * Line items use display units; included-credit offset + shortfall match the estimate.
 */
export function buildUsageCalculation(
  profile: UsageProfile,
  tiers: PlanTierLike[],
  costs: FeatureCostLike[],
  packages: CreditPackageLike[],
  currency: string,
  referencePlanName?: string | null,
  tierTitle?: string,
): UsageCalculation | null {
  const tier = resolveReferenceTier(tiers, referencePlanName);
  if (!tier) return null;

  const scenario = { usage: buildUsageMap(profile, costs) };
  const result = scenarioMonthlyCost(scenario, tiers, costs, packages, referencePlanName);
  if (!result || result.totalMonthly == null || result.planCost == null) return null;

  const pkg = bestValuePackage(packages);
  const rate = pkg ? pricePerCredit(pkg) : null;
  if (rate == null) return null;

  const billed = billableCreditsForTier(scenario.usage, tier, costs);
  const money = (n: number) => fmtMoney(n, currency);
  const features: UsageCalcFeatureRow[] = [];

  const imageCost = findActiveCost(costs, 'standard_image', 'premium_image');
  {
    const perDay = profile.imagesPerDay;
    const qty = round2(perDay * DAYS_PER_MONTH);
    const creditsEach = imageCost ? featureCostRange(imageCost)?.max ?? 0 : 0;
    const unitMoney = imageCost ? round2(creditsEach * rate) : 0;
    const cost = perDay > 0 && imageCost ? round2(qty * unitMoney) : 0;
    const assumption = perDay > 0 ? formatPerDay(perDay, 'day') : 'None';
    features.push({
      key: 'images',
      label: 'Images',
      icon: 'image',
      assumptionLabel: assumption,
      unitCostLabel: imageCost ? `${money(unitMoney)}/image` : '—',
      cost,
      costLabel: money(cost),
      mathDetail:
        perDay > 0 && imageCost
          ? `${formatPerDay(perDay, 'day')} × ${DAYS_PER_MONTH} days = ${qty} images × ${money(unitMoney)} = ${money(cost)}`
          : null,
    });
  }

  const videoCost = findActiveCost(costs, 'standard_video', 'text_to_video', 'image_to_video');
  {
    const perDay = profile.videosPerDay;
    const qty = round2(perDay * DAYS_PER_MONTH);
    const seconds =
      videoCost?.durationProduced != null && Number(videoCost.durationProduced) > 0
        ? Number(videoCost.durationProduced)
        : 10;
    const displayCredits = videoCost ? creditsPerDisplayUse(videoCost)?.max ?? 0 : 0;
    const unitMoney = videoCost ? round2(displayCredits * rate) : 0;
    const cost = perDay > 0 && videoCost ? round2(qty * unitMoney) : 0;
    const assumption = perDay > 0 ? formatPerDay(perDay, 'day') : 'None';
    features.push({
      key: 'videos',
      label: 'Video',
      icon: 'videocam',
      assumptionLabel: assumption === 'None' ? 'None' : `${assumption} (${seconds} sec each)`,
      unitCostLabel: videoCost ? `${money(unitMoney)}/${seconds}s` : '—',
      cost,
      costLabel: money(cost),
      mathDetail:
        perDay > 0 && videoCost
          ? `${formatPerDay(perDay, 'day')} × ${DAYS_PER_MONTH} days = ${qty} videos × ${money(unitMoney)} = ${money(cost)}`
          : null,
    });
  }

  const voiceCall = findActiveCost(costs, 'voice_call');
  const voiceMsg = findActiveCost(costs, 'voice_message');
  const voiceCost = voiceCall ?? voiceMsg;
  {
    const perDay = profile.voiceMinutesPerDay;
    const minutes = round2(perDay * DAYS_PER_MONTH);
    const creditsPerMin = voiceCost ? featureCostRange(voiceCost)?.max ?? 0 : 0;
    const unitMoney = voiceCost ? round2(creditsPerMin * rate) : 0;
    const cost = perDay > 0 && voiceCost ? round2(minutes * unitMoney) : 0;
    const isCall = voiceCost ? String(voiceCost.featureType) === 'voice_call' : true;
    const assumption =
      perDay <= 0
        ? 'None'
        : perDay < 1
          ? 'Occasional'
          : `~${Math.round(perDay * 10) / 10} min/day`;
    features.push({
      key: 'voice',
      label: isCall ? 'Voice calls' : 'Voice',
      icon: 'call',
      assumptionLabel: assumption,
      unitCostLabel: voiceCost ? `${money(unitMoney)}/min` : '—',
      cost,
      costLabel: money(cost),
      mathDetail:
        perDay > 0 && voiceCost
          ? `${assumption} × ${DAYS_PER_MONTH} = ${minutes} min × ${money(unitMoney)} = ${money(cost)}`
          : null,
    });
  }

  features.push({
    key: 'chat',
    label: 'Chat',
    icon: 'chat_bubble',
    assumptionLabel: profile.messagesPerDay > 0 ? 'Daily' : 'None',
    unitCostLabel: 'Included',
    cost: 0,
    costLabel: 'Included',
    mathDetail: 'Included in subscription = $0.00',
  });

  const mediaValue = round2(features.reduce((sum, row) => sum + row.cost, 0));
  const topUpCost = result.topUpCost ?? 0;
  const includedCredits = billed.includedCredits;
  const includedPoolValue = round2(includedCredits * rate);
  const includedValue =
    topUpCost > 0
      ? round2(Math.max(0, mediaValue - topUpCost))
      : round2(Math.min(mediaValue, includedPoolValue));
  const planCost = round2(result.planCostPerMonth ?? result.planCost);
  const total = round2(result.totalMonthly);
  const levelName =
    profile.id === 'casual' ? 'light use' : profile.id === 'power' ? 'heavy use' : 'regular use';
  const approx = (n: number) => (n > 0 ? `~${money(n)}` : money(0));

  return {
    heading: `How we calculated ${levelName}`,
    intro: `We estimate ${levelName} cost by combining the subscription price with the extra credits needed for a typical daily usage pattern.`,
    summaryLabel: `See how we estimated ${approx(total)}/mo ↓`,
    features,
    mediaValue,
    mediaValueLabel: money(mediaValue),
    includedCredits,
    includedValue,
    includedValueLabel: includedValue > 0 ? `−${money(includedValue)}` : money(0),
    extraValue: round2(topUpCost),
    extraValueLabel: approx(topUpCost),
    planCost,
    planCostLabel: money(planCost),
    topUpCost: round2(topUpCost),
    topUpCostLabel: approx(topUpCost),
    total,
    totalLabel: `${approx(total)}/mo`,
  };
}
