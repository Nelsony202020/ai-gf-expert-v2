// Plain-language usage personas for “what will I actually spend?” estimates.

import type { ProductType } from './productType';
import type { FeatureCostLike, CreditPackageLike, PlanTierLike, BillingPlanEstimate } from './calc';
import {
  billableCreditsForTier,
  cheapestPricedFeatureCost,
  creditsPerDisplayUse,
  estimateBillingPlans,
  featureCostRange,
  fmtMoney,
  resolveReferenceTier,
  resolveTierByName,
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
    description: 'Light daily use — chat with occasional images and rare video.',
    messagesPerDay: 25,
    imagesPerDay: 1,
    videosPerDay: 0.2,
    voiceMinutesPerDay: 0.5,
  },
  {
    id: 'regular',
    title: 'Regular',
    description: 'Typical daily user — steady chat, a few images, some video and voice.',
    messagesPerDay: 50,
    imagesPerDay: 3,
    videosPerDay: 0.5,
    voiceMinutesPerDay: 1.5,
  },
  {
    id: 'power',
    title: 'Power user',
    description: 'Heavy daily use — long sessions across chat, images, video, and voice.',
    messagesPerDay: 100,
    imagesPerDay: 15,
    videosPerDay: 2,
    voiceMinutesPerDay: 5,
  },
];

export const NSFW_CHATBOT_USAGE_PROFILES: UsageProfile[] = [
  {
    id: 'casual',
    title: 'Casual',
    description: 'Light daily use — chat with occasional images.',
    messagesPerDay: 27,
    imagesPerDay: 1,
    videosPerDay: 0,
    voiceMinutesPerDay: 0.5,
  },
  {
    id: 'regular',
    title: 'Regular',
    description: 'Typical daily user — steady chat, images, and occasional video.',
    messagesPerDay: 75,
    imagesPerDay: 1,
    videosPerDay: 0.2,
    voiceMinutesPerDay: 1.5,
  },
  {
    id: 'power',
    title: 'Power user',
    description: 'Heavy daily use — long sessions across chat, images, and video.',
    messagesPerDay: 150,
    imagesPerDay: 3,
    videosPerDay: 1,
    voiceMinutesPerDay: 5,
  },
];

export function defaultUsageProfilesForType(productType?: ProductType | null): UsageProfile[] {
  const base =
    productType === 'nsfw_chatbot' ? NSFW_CHATBOT_USAGE_PROFILES : DEFAULT_USAGE_PROFILES;
  return base.map((p) => ({ ...p }));
}

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
  const imageCost = cheapestPricedFeatureCost(costs, 'standard_image', 'premium_image');
  const videoCost = cheapestPricedFeatureCost(
    costs,
    'standard_video',
    'text_to_video',
    'image_to_video',
  );
  const voiceCallCost = cheapestPricedFeatureCost(costs, 'voice_call');
  const voiceMessageCost = cheapestPricedFeatureCost(costs, 'voice_message');
  const messageCost = cheapestPricedFeatureCost(costs, 'premium_message');

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

export function profilesFromSnapshot(
  stored: unknown,
  productType?: ProductType | null,
): UsageProfile[] {
  const defaults = defaultUsageProfilesForType(productType);
  if (!Array.isArray(stored) || stored.length === 0) return defaults;

  return PRESET_ORDER.map((id) => {
    const base = defaults.find((p) => p.id === id)!;
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
  return cheapestPricedFeatureCost(costs, ...types);
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

export interface UsageCalcPackageLine {
  name: string;
  creditsLabel: string;
  priceLabel: string;
  quantity: number;
}

export interface UsageCalculation {
  /** e.g. "How we calculated regular use" */
  heading: string;
  intro: string;
  /** e.g. "See how we estimated ~$36.63/mo ↓" */
  summaryLabel: string;
  features: UsageCalcFeatureRow[];
  /** Total feature credits required this month */
  requiredCredits: number;
  requiredCreditsLabel: string;
  includedCredits: number;
  includedCreditsLabel: string;
  /** Shortfall after included pool */
  extraCredits: number;
  extraCreditsLabel: string;
  /** Actual package checkout lines */
  packageLines: UsageCalcPackageLine[];
  purchasedCredits: number;
  purchasedCreditsLabel: string;
  leftoverCredits: number;
  leftoverCreditsLabel: string;
  mediaValue: number;
  mediaValueLabel: string;
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
 * Transparent usage → credit shortfall → real package checkout math
 * for the “See how we estimated” panel.
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
  const scenario = { usage: buildUsageMap(profile, costs) };
  const result = scenarioMonthlyCost(scenario, tiers, costs, packages, referencePlanName);
  if (!result || result.totalMonthly == null || result.planCost == null) return null;

  const tier =
    resolveTierByName(tiers, result.planName)
    ?? resolveReferenceTier(tiers, referencePlanName);
  if (!tier) return null;

  const billed = billableCreditsForTier(scenario.usage, tier, costs);
  const money = (n: number) => fmtMoney(n, currency);
  const features: UsageCalcFeatureRow[] = [];

  const imageCost = findActiveCost(costs, 'standard_image', 'premium_image');
  {
    const perDay = profile.imagesPerDay;
    const qty = round2(perDay * DAYS_PER_MONTH);
    const creditsEach = imageCost ? featureCostRange(imageCost)?.min ?? 0 : 0;
    const costCredits = perDay > 0 && imageCost ? round2(qty * creditsEach) : 0;
    const assumption = perDay > 0 ? formatPerDay(perDay, 'day') : 'None';
    features.push({
      key: 'images',
      label: 'Images',
      icon: 'image',
      assumptionLabel: assumption,
      unitCostLabel: imageCost ? `${creditsEach} credits/image` : '—',
      cost: costCredits,
      costLabel: `${costCredits} credits`,
      mathDetail:
        perDay > 0 && imageCost
          ? `${formatPerDay(perDay, 'day')} × ${DAYS_PER_MONTH} days = ${qty} images × ${creditsEach} credits = ${costCredits} credits`
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
    const displayCredits = videoCost ? creditsPerDisplayUse(videoCost)?.min ?? 0 : 0;
    const costCredits = perDay > 0 && videoCost ? round2(qty * displayCredits) : 0;
    const assumption = perDay > 0 ? formatPerDay(perDay, 'day') : 'None';
    features.push({
      key: 'videos',
      label: 'Video',
      icon: 'videocam',
      assumptionLabel: assumption === 'None' ? 'None' : `${assumption} (${seconds} sec each)`,
      unitCostLabel: videoCost ? `${displayCredits} credits/${seconds}s` : '—',
      cost: costCredits,
      costLabel: `${costCredits} credits`,
      mathDetail:
        perDay > 0 && videoCost
          ? `${formatPerDay(perDay, 'day')} × ${DAYS_PER_MONTH} days = ${qty} videos × ${displayCredits} credits = ${costCredits} credits`
          : null,
    });
  }

  const voiceCall = findActiveCost(costs, 'voice_call');
  const voiceMsg = findActiveCost(costs, 'voice_message');
  const voiceCost = voiceCall ?? voiceMsg;
  {
    const perDay = profile.voiceMinutesPerDay;
    const minutes = round2(perDay * DAYS_PER_MONTH);
    const creditsPerMin = voiceCost ? featureCostRange(voiceCost)?.min ?? 0 : 0;
    const costCredits = perDay > 0 && voiceCost ? round2(minutes * creditsPerMin) : 0;
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
      unitCostLabel: voiceCost ? `${creditsPerMin} credits/min` : '—',
      cost: costCredits,
      costLabel: `${costCredits} credits`,
      mathDetail:
        perDay > 0 && voiceCost
          ? `${assumption} × ${DAYS_PER_MONTH} = ${minutes} min × ${creditsPerMin} credits = ${costCredits} credits`
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
    mathDetail: 'Included in subscription = 0 credits',
  });

  const requiredCredits = billed.creditsNeeded;
  const includedCredits = billed.includedCredits;
  const extraCredits = result.creditShortfall;
  const topUpCost = result.topUpCost ?? 0;
  const planCost = round2(result.planCostPerMonth ?? result.planCost);
  const total = round2(result.totalMonthly);
  const levelName =
    profile.id === 'casual' ? 'light use' : profile.id === 'power' ? 'heavy use' : 'regular use';
  const approx = (n: number) => (n > 0 ? `~${money(n)}` : money(0));

  const packageLines: UsageCalcPackageLine[] = (result.packageCombination ?? []).map((line) => ({
    name: line.name,
    creditsLabel:
      line.quantity > 1
        ? `${line.quantity} × ${line.credits.toLocaleString('en-US')} credits`
        : `${line.credits.toLocaleString('en-US')} credits`,
    priceLabel: money(line.lineTotal),
    quantity: line.quantity,
  }));

  return {
    heading: `How we calculated ${levelName}`,
    intro: 'Uses the cheapest subscription tier plus the cheapest token packs you can actually buy.',
    summaryLabel: `See how we estimated ${approx(total)}/mo`,
    features,
    requiredCredits,
    requiredCreditsLabel: `${requiredCredits.toLocaleString('en-US')} credits`,
    includedCredits,
    includedCreditsLabel: `−${includedCredits.toLocaleString('en-US')} credits`,
    extraCredits,
    extraCreditsLabel: `${extraCredits.toLocaleString('en-US')} credits`,
    packageLines,
    purchasedCredits: result.purchasedCredits,
    purchasedCreditsLabel: `${result.purchasedCredits.toLocaleString('en-US')} credits`,
    leftoverCredits: result.leftoverCredits,
    leftoverCreditsLabel: `${result.leftoverCredits.toLocaleString('en-US')} credits`,
    mediaValue: requiredCredits,
    mediaValueLabel: `${requiredCredits.toLocaleString('en-US')} credits`,
    includedValue: includedCredits,
    includedValueLabel: includedCredits > 0 ? `−${includedCredits.toLocaleString('en-US')} credits` : '0 credits',
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
