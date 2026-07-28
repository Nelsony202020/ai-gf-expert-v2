// Plain-language usage personas for “what will I actually spend?” estimates.

import type { FeatureCostLike, CreditPackageLike, PlanTierLike, BillingPlanEstimate } from './calc';
import { estimateBillingPlans, scenarioMonthlyCost } from './calc';

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
  const voiceCost = find('voice_call', 'voice_message');
  const messageCost = find('premium_message');

  const usage: Record<string, number> = {};
  if (imageCost?.featureType && monthly.images > 0) {
    usage[String(imageCost.featureType)] = monthly.images;
  }
  if (videoCost?.featureType && monthly.videos > 0) {
    usage[String(videoCost.featureType)] = monthly.videos;
  }
  if (voiceCost?.featureType === 'voice_call' && monthly.voiceMinutes > 0) {
    usage.voice_call = monthly.voiceMinutes;
  } else if (voiceCost?.featureType && monthly.voiceMinutes > 0) {
    usage[String(voiceCost.featureType)] = monthly.voiceMinutes;
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
}

export function estimateProfile(
  profile: UsageProfile,
  tiers: PlanTierLike[],
  costs: FeatureCostLike[],
  packages: CreditPackageLike[],
): ProfileEstimate {
  const usage = buildUsageMap(profile, costs);
  const scenario = { usage };
  const monthly = scenarioMonthlyCost(scenario, tiers, costs, packages);
  const billingPlans = estimateBillingPlans(scenario, tiers, costs, packages);
  return {
    profile,
    billingPlans,
    totalMonthly: monthly?.totalMonthly ?? null,
    planCost: monthly?.planCost ?? null,
    topUpCost: monthly?.topUpCost ?? null,
    missingData: monthly === null,
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
