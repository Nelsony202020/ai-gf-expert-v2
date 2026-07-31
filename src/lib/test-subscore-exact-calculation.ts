import type { MethodologyEvidenceItem } from './test-methodology-evidence';
import { getSubscoreEvidenceList } from './test-methodology-evidence';

/** Public page order for Variety exact-calculation table and evidence sections. */
export const VARIETY_EVIDENCE_DISPLAY_ORDER = [
  'female-count',
  'male-count',
  'anime-female-count',
  'anime-male-count',
  'styles',
  'ethnicities',
  'personalities',
  'transgender-count',
  'non-binary-count',
  'other-count',
  'scenarios',
] as const;

export const DISCOVERY_EVIDENCE_DISPLAY_ORDER = [
  'filters',
  'categories',
  'search',
  'browsing',
] as const;

export const QUALITY_EVIDENCE_DISPLAY_ORDER = [
  'duplicates',
  'originality',
  'profile-quality',
  'visual-quality',
] as const;

export const APPEARANCE_EVIDENCE_DISPLAY_ORDER = [
  'age',
  'ethnicity',
  'eye-color',
  'body-type',
  'breast-size',
  'hair-style',
  'hair-color',
  'outfits',
  'creator-personalities',
] as const;

export const PERSONALITY_EVIDENCE_DISPLAY_ORDER = [
  'traits',
  'interests',
  'relationship',
  'role',
  'voice',
  'kink-options',
] as const;

export const CONTROL_EVIDENCE_DISPLAY_ORDER = ['custom-prompts', 'editing', 'preview'] as const;

export const UNDERSTANDING_EVIDENCE_DISPLAY_ORDER = [
  'memory',
  'relevance',
  'context',
  'instructions',
  'roleplay-accuracy',
] as const;

export const REALISM_EVIDENCE_DISPLAY_ORDER = [
  'naturalness',
  'personality',
  'roleplay',
  'initiative',
  'emotion',
  'style',
] as const;

export const RELIABILITY_EVIDENCE_DISPLAY_ORDER = [
  'repetition',
  'refusals',
  'reply-speed',
  'errors',
  'consistency',
  'recovery',
] as const;

export const MEDIA_EVIDENCE_DISPLAY_ORDER = [
  'images-sent',
  'images-received',
  'voice-sent',
  'voice-received',
  'chat-video',
  'gifs',
  'reactions',
] as const;

export const INTERACTION_EVIDENCE_DISPLAY_ORDER = [
  'voice-calls',
  'chat-modes',
  'mode-types',
  'group-chat',
  'double-texting',
  'proactive-messages',
] as const;

export const CHAT_FEATURES_CONTROLS_EVIDENCE_DISPLAY_ORDER = [
  'edit-messages',
  'delete-messages',
  'regenerate-replies',
  'save-memories',
  'edit-memories',
  'reset-chat',
  'export-chat',
] as const;

export const PLATFORM_EXTRAS_EVIDENCE_DISPLAY_ORDER = ['live-cam'] as const;

export const IMAGES_QUALITY_EVIDENCE_DISPLAY_ORDER = [
  'realism',
  'visual-errors',
  'composition',
  'resolution',
] as const;

export const IMAGES_ACCURACY_EVIDENCE_DISPLAY_ORDER = [
  'prompt-accuracy',
  'character-consistency',
  'face-consistency',
  'body-consistency',
  'style-consistency',
  'editing-accuracy',
] as const;

export const IMAGES_EXPERIENCE_EVIDENCE_DISPLAY_ORDER = [
  'speed',
  'failures',
  'chat-generation',
  'separate-generator',
  'custom-prompts',
  'image-editing',
  'nsfw-support',
] as const;

export const VIDEO_CAPABILITIES_EVIDENCE_DISPLAY_ORDER = [
  'text-to-video',
  'image-to-video',
  'chat-video',
  'audio',
  'maximum-length',
  'maximum-resolution',
] as const;

export const VIDEO_QUALITY_EVIDENCE_DISPLAY_ORDER = [
  'motion',
  'accuracy',
  'character-consistency',
  'visual-errors',
  'frame-consistency',
] as const;

export const VIDEO_EXPERIENCE_EVIDENCE_DISPLAY_ORDER = [
  'speed',
  'failures',
  'ease-of-use',
  'regeneration',
] as const;

export const PRIVACY_DATA_USE_EVIDENCE_DISPLAY_ORDER = [
  'training',
  'human-review',
  'data-sharing',
  'advertising',
  'retention',
  'policy-clarity',
] as const;

export const PRIVACY_USER_CONTROL_EVIDENCE_DISPLAY_ORDER = [
  'delete-chats',
  'delete-account',
  'delete-personal-data',
  'training-opt-out',
  'export-data',
] as const;

export const PRIVACY_SECURITY_EVIDENCE_DISPLAY_ORDER = [
  'encryption',
  'two-factor-authentication',
  'billing-descriptor',
  'security-incidents',
] as const;

export const PRIVACY_SUPPORT_EVIDENCE_DISPLAY_ORDER = [
  'support-available',
  'support-channels',
  'support-reach',
  'support-speed',
  'support-helpfulness',
] as const;

export const PRIVACY_SUPPORT_SCORED_EVIDENCE_DISPLAY_ORDER = [
  'support-reach',
  'support-speed',
  'support-helpfulness',
] as const;

export const PRICING_PLAN_VALUE_EVIDENCE_DISPLAY_ORDER = [
  'monthly-price',
  'annual-price',
  'included-features',
  'included-credits',
  'plan-limits',
  'annual-discount',
] as const;

export const PRICING_USAGE_COSTS_EVIDENCE_DISPLAY_ORDER = [
  'image-cost',
  'video-cost',
  'voice-cost',
  'call-cost',
  'top-up-value',
  'monthly-spend',
] as const;

export const PRICING_FREE_ACCESS_EVIDENCE_DISPLAY_ORDER = [
  'free-chat',
  'free-images',
  'free-video',
  'free-voice',
  'free-characters',
  'free-value',
  'restrictions',
] as const;

export const PRICING_BILLING_EVIDENCE_DISPLAY_ORDER = [
  'pricing-clarity',
  'paywalls',
  'credit-expiry',
  'refunds',
  'cancellation',
  'payment-privacy',
] as const;

export interface SubscoreEvidenceConfig {
  displayOrder: readonly string[];
  exampleScores: Record<string, number>;
  exampleTableSlugs: readonly string[];
}

const SUBSCORE_EVIDENCE_CONFIG: Record<string, SubscoreEvidenceConfig> = {
  'characters/variety': {
    displayOrder: VARIETY_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'female-count': 8.0,
      'male-count': 4.0,
      'anime-female-count': 7.723,
      'anime-male-count': 7.723,
      styles: 6.0,
      ethnicities: 7.723,
      personalities: 7.723,
      'transgender-count': 7.723,
      'non-binary-count': 7.723,
      'other-count': 7.723,
      scenarios: 7.723,
    },
    exampleTableSlugs: ['female-count', 'styles', 'male-count'],
  },
  'characters/discovery': {
    displayOrder: DISCOVERY_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      filters: 8.0,
      categories: 8.0,
      search: 10.0,
      browsing: 8.0,
    },
    exampleTableSlugs: DISCOVERY_EVIDENCE_DISPLAY_ORDER,
  },
  'characters/quality': {
    displayOrder: QUALITY_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      duplicates: 9.4,
      originality: 8.2,
      'profile-quality': 8.4,
      'visual-quality': 9.0,
    },
    exampleTableSlugs: QUALITY_EVIDENCE_DISPLAY_ORDER,
  },
  'customization/appearance': {
    displayOrder: APPEARANCE_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      age: 8,
      ethnicity: 8,
      'eye-color': 7,
      'body-type': 8,
      'breast-size': 8,
      'hair-style': 7,
      'hair-color': 6,
      outfits: 8,
      'creator-personalities': 8,
    },
    exampleTableSlugs: ['age', 'ethnicity', 'body-type'],
  },
  'customization/personality': {
    displayOrder: PERSONALITY_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      traits: 8,
      interests: 8,
      relationship: 8,
      role: 8,
      voice: 7,
      'kink-options': 9,
    },
    exampleTableSlugs: PERSONALITY_EVIDENCE_DISPLAY_ORDER,
  },
  'customization/control': {
    displayOrder: CONTROL_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'custom-prompts': 10,
      editing: 8,
      preview: 5,
    },
    exampleTableSlugs: CONTROL_EVIDENCE_DISPLAY_ORDER,
  },
  'chat/understanding': {
    displayOrder: UNDERSTANDING_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      memory: 8.4,
      relevance: 8.8,
      context: 8.0,
      instructions: 8.67,
      'roleplay-accuracy': 8.8,
    },
    exampleTableSlugs: UNDERSTANDING_EVIDENCE_DISPLAY_ORDER,
  },
  'chat/realism': {
    displayOrder: REALISM_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      naturalness: 8.4,
      personality: 8.0,
      roleplay: 8.4,
      initiative: 7.8,
      emotion: 8.4,
      style: 8.2,
    },
    exampleTableSlugs: REALISM_EVIDENCE_DISPLAY_ORDER,
  },
  'chat/reliability': {
    displayOrder: RELIABILITY_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      repetition: 8,
      refusals: 8,
      'reply-speed': 8,
      errors: 9,
      consistency: 9.2,
      recovery: 8,
    },
    exampleTableSlugs: RELIABILITY_EVIDENCE_DISPLAY_ORDER,
  },
  'chat-features/media': {
    displayOrder: MEDIA_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'images-sent': 10,
      'images-received': 5,
      'voice-sent': 10,
      'voice-received': 10,
      'chat-video': 0,
      gifs: 5,
      reactions: 10,
    },
    exampleTableSlugs: MEDIA_EVIDENCE_DISPLAY_ORDER,
  },
  'chat-features/interaction': {
    displayOrder: INTERACTION_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'voice-calls': 10,
      'chat-modes': 7,
      'mode-types': 7.5,
      'group-chat': 5,
      'double-texting': 7,
      'proactive-messages': 10,
    },
    exampleTableSlugs: INTERACTION_EVIDENCE_DISPLAY_ORDER,
  },
  'chat-features/controls': {
    displayOrder: CHAT_FEATURES_CONTROLS_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'edit-messages': 10,
      'delete-messages': 10,
      'regenerate-replies': 10,
      'save-memories': 5,
      'edit-memories': 5,
      'reset-chat': 10,
      'export-chat': 0,
    },
    exampleTableSlugs: CHAT_FEATURES_CONTROLS_EVIDENCE_DISPLAY_ORDER,
  },
  'chat-features/platform-extras': {
    displayOrder: PLATFORM_EXTRAS_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'live-cam': 10,
    },
    exampleTableSlugs: PLATFORM_EXTRAS_EVIDENCE_DISPLAY_ORDER,
  },
  'images/quality': {
    displayOrder: IMAGES_QUALITY_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      realism: 8.4,
      'visual-errors': 8.0,
      composition: 8.2,
      resolution: 8.0,
    },
    exampleTableSlugs: IMAGES_QUALITY_EVIDENCE_DISPLAY_ORDER,
  },
  'images/accuracy': {
    displayOrder: IMAGES_ACCURACY_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'prompt-accuracy': 8.2,
      'character-consistency': 8.0,
      'face-consistency': 8.0,
      'body-consistency': 6.0,
      'style-consistency': 8.0,
      'editing-accuracy': 7.6,
    },
    exampleTableSlugs: IMAGES_ACCURACY_EVIDENCE_DISPLAY_ORDER,
  },
  'images/experience': {
    displayOrder: IMAGES_EXPERIENCE_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      speed: 8,
      failures: 9,
      'chat-generation': 10,
      'separate-generator': 10,
      'custom-prompts': 10,
      'image-editing': 5,
      'nsfw-support': 5,
    },
    exampleTableSlugs: IMAGES_EXPERIENCE_EVIDENCE_DISPLAY_ORDER,
  },
  'video/capabilities': {
    displayOrder: VIDEO_CAPABILITIES_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'text-to-video': 10,
      'image-to-video': 10,
      'chat-video': 5,
      audio: 5,
      'maximum-length': 8,
      'maximum-resolution': 8,
    },
    exampleTableSlugs: VIDEO_CAPABILITIES_EVIDENCE_DISPLAY_ORDER,
  },
  'video/quality': {
    displayOrder: VIDEO_QUALITY_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      motion: 8,
      accuracy: 8.67,
      'character-consistency': 8,
      'visual-errors': 6.67,
      'frame-consistency': 7.33,
    },
    exampleTableSlugs: VIDEO_QUALITY_EVIDENCE_DISPLAY_ORDER,
  },
  'video/experience': {
    displayOrder: VIDEO_EXPERIENCE_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      speed: 8,
      failures: 8,
      'ease-of-use': 8,
      regeneration: 5,
    },
    exampleTableSlugs: VIDEO_EXPERIENCE_EVIDENCE_DISPLAY_ORDER,
  },
  'privacy/data-use': {
    displayOrder: PRIVACY_DATA_USE_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      training: 10,
      'human-review': 10,
      'data-sharing': 4,
      advertising: 10,
      retention: 8,
      'policy-clarity': 8.33,
    },
    exampleTableSlugs: PRIVACY_DATA_USE_EVIDENCE_DISPLAY_ORDER,
  },
  'privacy/user-control': {
    displayOrder: PRIVACY_USER_CONTROL_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'delete-chats': 10,
      'delete-account': 5,
      'delete-personal-data': 10,
      'training-opt-out': 5,
      'export-data': 10,
    },
    exampleTableSlugs: PRIVACY_USER_CONTROL_EVIDENCE_DISPLAY_ORDER,
  },
  'privacy/security': {
    displayOrder: PRIVACY_SECURITY_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      encryption: 5,
      'two-factor-authentication': 0,
      'billing-descriptor': 10,
      'security-incidents': 10,
    },
    exampleTableSlugs: PRIVACY_SECURITY_EVIDENCE_DISPLAY_ORDER,
  },
  'privacy/support': {
    displayOrder: PRIVACY_SUPPORT_SCORED_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'support-reach': 8,
      'support-speed': 6,
      'support-helpfulness': 8,
    },
    exampleTableSlugs: PRIVACY_SUPPORT_SCORED_EVIDENCE_DISPLAY_ORDER,
  },
  'pricing/plan-value': {
    displayOrder: PRICING_PLAN_VALUE_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'monthly-price': 7,
      'annual-price': 8,
      'included-features': 8,
      'included-credits': 7,
      'plan-limits': 6,
      'annual-discount': 3,
    },
    exampleTableSlugs: PRICING_PLAN_VALUE_EVIDENCE_DISPLAY_ORDER,
  },
  'pricing/usage-costs': {
    displayOrder: PRICING_USAGE_COSTS_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'image-cost': 8,
      'video-cost': 6,
      'voice-cost': 8,
      'call-cost': 7,
      'top-up-value': 6,
      'monthly-spend': 7,
    },
    exampleTableSlugs: PRICING_USAGE_COSTS_EVIDENCE_DISPLAY_ORDER,
  },
  'pricing/free-access': {
    displayOrder: PRICING_FREE_ACCESS_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'free-chat': 8,
      'free-images': 6,
      'free-video': 4,
      'free-voice': 4,
      'free-characters': 8,
      'free-value': 10,
      'restrictions': 8,
    },
    exampleTableSlugs: PRICING_FREE_ACCESS_EVIDENCE_DISPLAY_ORDER,
  },
  'pricing/billing': {
    displayOrder: PRICING_BILLING_EVIDENCE_DISPLAY_ORDER,
    exampleScores: {
      'pricing-clarity': 7.5,
      paywalls: 8,
      'credit-expiry': 10,
      refunds: 5,
      cancellation: 10,
      'payment-privacy': 5,
    },
    exampleTableSlugs: PRICING_BILLING_EVIDENCE_DISPLAY_ORDER,
  },
};

export function getSubscoreEvidenceConfig(
  categoryKey: string,
  subscoreSlug: string,
): SubscoreEvidenceConfig | undefined {
  return SUBSCORE_EVIDENCE_CONFIG[`${categoryKey}/${subscoreSlug}`];
}

export interface ExactCalculationRow {
  slug: string;
  name: string;
  weight: number;
  sharePercent: number;
  anchorId: string;
}

export interface ExampleCalculationRow {
  slug: string;
  name: string;
  exampleScore: number;
  sharePercent: number;
  calculation: string;
  weightedContribution: number;
}

export interface ExampleOtherTestsSummary {
  sharePercent: number;
  exampleScore: number;
  weightedContribution: number;
}

export interface ExactCalculationData {
  rows: ExactCalculationRow[];
  totalWeight: number;
  exampleRows: ExampleCalculationRow[];
  otherExampleSummary: ExampleOtherTestsSummary | null;
  finalExampleScore: number;
}

function formatShare(weight: number, totalWeight: number): number {
  return Math.round((weight / totalWeight) * 10000) / 100;
}

function formatScore(value: number): string {
  return value.toFixed(2);
}

export interface ApportionedGroupShare {
  groupLabel: string;
  /** Portion of the subscore score apportioned from this evidence group's public weight. */
  sharePercent: number;
}

/**
 * Apportion each evidence group's public weight across its scored tests.
 * Example: Amount 30% split across four tests by DB weight — shares sum to 30%.
 */
export function buildApportionedGroupShares(
  groups: { label: string; memberSectionIds: string[] }[],
  rows: Pick<ExactCalculationRow, 'slug' | 'weight'>[],
  groupWeights: { label: string; weight: number }[],
): Map<string, ApportionedGroupShare> {
  const weightBySlug = new Map(rows.map((row) => [row.slug, row.weight]));
  const groupWeightByLabel = new Map(groupWeights.map((item) => [item.label, item.weight]));
  const shares = new Map<string, ApportionedGroupShare>();

  for (const group of groups) {
    const groupWeight = groupWeightByLabel.get(group.label);
    if (groupWeight == null) continue;

    const totalMemberWeight = group.memberSectionIds.reduce(
      (sum, slug) => sum + (weightBySlug.get(slug) ?? 0),
      0,
    );

    for (const slug of group.memberSectionIds) {
      const testWeight = weightBySlug.get(slug) ?? 0;
      shares.set(slug, {
        groupLabel: group.label,
        sharePercent:
          totalMemberWeight > 0
            ? Math.round(((groupWeight * testWeight) / totalMemberWeight) * 100) / 100
            : 0,
      });
    }
  }

  return shares;
}

export function orderEvidenceForDisplay(
  evidence: MethodologyEvidenceItem[],
  displayOrder: readonly string[],
): MethodologyEvidenceItem[] {
  const bySlug = new Map(evidence.map((item) => [item.slug, item]));
  return displayOrder
    .map((slug) => bySlug.get(slug))
    .filter((item): item is MethodologyEvidenceItem => item != null);
}

export function buildExactCalculationData(
  categoryKey: string,
  subscoreSlug: string,
  displayOrder?: readonly string[],
): ExactCalculationData | null {
  const config = getSubscoreEvidenceConfig(categoryKey, subscoreSlug);
  const order =
    displayOrder ??
    config?.displayOrder ??
    getSubscoreEvidenceList(categoryKey, subscoreSlug).map((item) => item.slug);

  const evidence = orderEvidenceForDisplay(getSubscoreEvidenceList(categoryKey, subscoreSlug), order);
  if (!evidence.length) return null;

  const exampleScores = config?.exampleScores ?? {};
  const exampleTableSlugs = config?.exampleTableSlugs ?? order.slice(0, 3);

  const totalWeight = evidence.reduce((sum, item) => sum + item.weight, 0);

  const rows: ExactCalculationRow[] = evidence.map((item) => ({
    slug: item.slug,
    name: item.name,
    weight: item.weight,
    sharePercent: formatShare(item.weight, totalWeight),
    anchorId: item.slug,
  }));

  let weightedSum = 0;
  for (const item of evidence) {
    const score = exampleScores[item.slug] ?? 7.0;
    weightedSum += score * item.weight;
  }
  const finalExampleScore = Math.round((weightedSum / totalWeight) * 100) / 100;

  // Skip configured slugs missing from the live methodology export — content
  // changes in the admin must never break a page render or the build.
  const presentTableSlugs = exampleTableSlugs.filter((slug) =>
    evidence.some((entry) => entry.slug === slug),
  );

  const exampleRows: ExampleCalculationRow[] = presentTableSlugs.map((slug) => {
    const item = evidence.find((entry) => entry.slug === slug)!;
    const exampleScore = exampleScores[slug] ?? 7.0;
    const sharePercent = formatShare(item.weight, totalWeight);
    const weightedContribution =
      Math.round(((exampleScore * item.weight) / totalWeight) * 100) / 100;
    return {
      slug: item.slug,
      name: item.name,
      exampleScore,
      sharePercent,
      calculation: `${formatScore(exampleScore)} × ${formatScore(sharePercent)}%`,
      weightedContribution,
    };
  });

  const exampleSlugSet = new Set<string>(exampleTableSlugs);
  const otherEvidence = evidence.filter((item) => !exampleSlugSet.has(item.slug));

  let otherExampleSummary: ExampleOtherTestsSummary | null = null;
  if (otherEvidence.length > 0) {
    let otherWeight = 0;
    let otherWeightedSum = 0;
    for (const item of otherEvidence) {
      const score = exampleScores[item.slug] ?? 7.0;
      otherWeight += item.weight;
      otherWeightedSum += score * item.weight;
    }

    otherExampleSummary = {
      sharePercent: formatShare(otherWeight, totalWeight),
      exampleScore: Math.round((otherWeightedSum / otherWeight) * 100) / 100,
      weightedContribution: Math.round((otherWeightedSum / totalWeight) * 100) / 100,
    };
  }

  return {
    rows,
    totalWeight,
    exampleRows,
    otherExampleSummary,
    finalExampleScore,
  };
}

export { formatScore };
