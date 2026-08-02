import { listMethodologyAlignedSubscoreKeys } from '../ratings/evidenceGroupScoring';
import { sortReviewCopySubscoreRows } from '../admin/reviewCopyOrder';
import type { SubscoreRef } from './types';

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
  characters: { variety: 'Variety', discovery: 'Discovery', quality: 'Quality' },
  customization: { appearance: 'Appearance', personality: 'Personality', control: 'Control' },
  chat: { understanding: 'Understanding', realism: 'Realism', reliability: 'Reliability' },
  'chat-features': {
    media: 'Media',
    interaction: 'Interaction',
    controls: 'Controls',
    'platform-extras': 'Platform Extras',
  },
  images: { quality: 'Quality', accuracy: 'Accuracy', experience: 'Experience' },
  video: { capabilities: 'Capabilities', quality: 'Quality', experience: 'Experience' },
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

function categoryName(slug: string): string {
  return CATEGORY_NAMES[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function subscoreName(categorySlug: string, subscoreSlug: string): string {
  return (
    SUBSCORE_NAMES[categorySlug]?.[subscoreSlug] ??
    subscoreSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function buildSubscoreKey(categorySlug: string, subscoreSlug: string): string {
  return `${categorySlug}/${subscoreSlug}`;
}

export function parseSubscoreKey(subscoreKey: string): { categorySlug: string; subscoreSlug: string } {
  const parts = subscoreKey.split('/');
  if (parts.length !== 2) throw new Error(`Invalid subscoreKey: ${subscoreKey}`);
  return { categorySlug: parts[0], subscoreSlug: parts[1] };
}

export function findSubscore(subscoreKey: string): SubscoreRef | undefined {
  const { categorySlug, subscoreSlug } = parseSubscoreKey(subscoreKey);
  if (!listMethodologyAlignedSubscoreKeys().includes(subscoreKey)) return undefined;
  return {
    subscoreKey,
    categorySlug,
    subscoreSlug,
    categoryName: categoryName(categorySlug),
    subscoreName: subscoreName(categorySlug, subscoreSlug),
  };
}

export function listAllSubscores(): SubscoreRef[] {
  return sortReviewCopySubscoreRows(
    listMethodologyAlignedSubscoreKeys()
      .map((subscoreKey) => findSubscore(subscoreKey)!)
      .filter(Boolean),
  );
}
