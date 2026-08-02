import { SUBSCORE_EVIDENCE_GROUPS } from '../ratings/evidenceCategoryMapping';
import { sortReviewCopyExplanationRows } from '../admin/reviewCopyOrder';
import type { ExplanationGroupRef } from './types';

const CATEGORY_NAMES: Record<string, string> = {
  characters: 'Characters',
  customization: 'Customization',
  chat: 'Chat',
  'chat-features': 'Chat Features',
  images: 'Images',
  video: 'Video',
  privacy: 'Privacy',
  pricing: 'Pricing',
};

const SUBSCORE_NAMES: Record<string, Record<string, string>> = {
  characters: {
    variety: 'Variety',
    discovery: 'Discovery',
    quality: 'Quality',
  },
  customization: {
    appearance: 'Appearance',
    personality: 'Personality',
    control: 'Control',
  },
  chat: {
    understanding: 'Understanding',
    realism: 'Realism',
    reliability: 'Reliability',
  },
  'chat-features': {
    media: 'Media',
    interaction: 'Interaction',
    controls: 'Controls',
    'platform-extras': 'Platform Extras',
  },
  images: {
    quality: 'Quality',
    accuracy: 'Accuracy',
    experience: 'Experience',
  },
  video: {
    capabilities: 'Capabilities',
    quality: 'Quality',
    experience: 'Experience',
  },
  privacy: {
    'data-use': 'Data Use',
    'user-control': 'User Control',
    security: 'Security',
    support: 'Support',
  },
  pricing: {
    'plan-value': 'Plan Value',
    'usage-costs': 'Usage Costs',
    'free-access': 'Free Access',
    billing: 'Billing',
  },
};

export function parseGroupKey(groupKey: string): {
  categorySlug: string;
  subscoreSlug: string;
  groupSlug: string;
} {
  const parts = groupKey.split('/');
  if (parts.length !== 3) {
    throw new Error(`Invalid groupKey: ${groupKey}`);
  }
  const [categorySlug, subscoreSlug, groupSlug] = parts;
  return { categorySlug, subscoreSlug, groupSlug };
}

export function buildGroupKey(categorySlug: string, subscoreSlug: string, groupSlug: string): string {
  return `${categorySlug}/${subscoreSlug}/${groupSlug}`;
}

function categoryName(slug: string): string {
  return CATEGORY_NAMES[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function subscoreName(categorySlug: string, subscoreSlug: string): string {
  return (
    SUBSCORE_NAMES[categorySlug]?.[subscoreSlug] ??
    subscoreSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function listAllEvidenceGroups(): ExplanationGroupRef[] {
  const out: ExplanationGroupRef[] = [];
  for (const [subscoreKey, groups] of Object.entries(SUBSCORE_EVIDENCE_GROUPS)) {
    const [categorySlug, subscoreSlug] = subscoreKey.split('/');
    for (const group of groups) {
      out.push({
        groupKey: buildGroupKey(categorySlug, subscoreSlug, group.slug),
        categorySlug,
        subscoreSlug,
        groupSlug: group.slug,
        groupName: group.name,
        categoryName: categoryName(categorySlug),
        subscoreName: subscoreName(categorySlug, subscoreSlug),
      });
    }
  }
  return sortReviewCopyExplanationRows(out);
}

export function findEvidenceGroup(groupKey: string): ExplanationGroupRef | undefined {
  const { categorySlug, subscoreSlug, groupSlug } = parseGroupKey(groupKey);
  const groups = SUBSCORE_EVIDENCE_GROUPS[`${categorySlug}/${subscoreSlug}`];
  const group = groups?.find((g) => g.slug === groupSlug);
  if (!group) return undefined;
  return {
    groupKey,
    categorySlug,
    subscoreSlug,
    groupSlug: group.slug,
    groupName: group.name,
    categoryName: categoryName(categorySlug),
    subscoreName: subscoreName(categorySlug, subscoreSlug),
  };
}

export function memberSlugsForGroup(groupKey: string): string[] {
  const { categorySlug, subscoreSlug, groupSlug } = parseGroupKey(groupKey);
  const groups = SUBSCORE_EVIDENCE_GROUPS[`${categorySlug}/${subscoreSlug}`];
  return groups?.find((g) => g.slug === groupSlug)?.memberSlugs ?? [];
}
