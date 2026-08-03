/** Shared capability gating for evidence tests (UI + scoring). */

import {
  filterGenderGatedItems,
  isGenderCountApplicable,
} from './genderCountGating';

export {
  filterGenderGatedItems,
  GENDER_COUNT_SLUGS,
  isGenderCountApplicable,
  parseGenderGroupsFromRaw,
} from './genderCountGating';

export type ProductCapabilityName =
  | 'capVoiceCalls'
  | 'capVoiceMessages'
  | 'capGroupChat'
  | 'capCustomScenarios'
  | 'capInChatImages'
  | 'capVideoGeneration'
  | 'capMemoryInjection'
  | 'capLongTermMemory'
  | 'capDedicatedImageGenerator'
  | 'capImageGeneration';

/** category|slug → required capability (test hidden when cap is explicitly false). */
export const REQUIRED_CAP: Record<string, ProductCapabilityName> = {
  'chat-features|voice-calls': 'capVoiceCalls',
  'chat-features|voice-sent': 'capVoiceMessages',
  'chat-features|voice-received': 'capVoiceMessages',
  'chat-features|group-chat': 'capGroupChat',
  'chat-features|chat-modes': 'capCustomScenarios',
  'chat-features|mode-types': 'capCustomScenarios',
  'chat-features|images-sent': 'capInChatImages',
  'chat-features|images-received': 'capInChatImages',
  'chat-features|chat-video': 'capVideoGeneration',
  'chat-features|edit-memories': 'capMemoryInjection',
  'chat-features|save-memories': 'capLongTermMemory',
  'images|chat-generation': 'capInChatImages',
  'images|separate-generator': 'capDedicatedImageGenerator',
  'images|image-editing': 'capImageGeneration',
  'images|custom-prompts': 'capImageGeneration',
  'video|text-to-video': 'capVideoGeneration',
  'video|image-to-video': 'capVideoGeneration',
  'video|chat-video': 'capInChatImages',
};

/** Paywall / included-feature checklist labels → capability. */
export const FEATURE_ITEM_CAP: Record<string, ProductCapabilityName> = {
  'Image generation': 'capImageGeneration',
  'Image editing': 'capImageGeneration',
  'Video generation': 'capVideoGeneration',
  'Voice messages': 'capVoiceMessages',
  'Voice calls': 'capVoiceCalls',
  'Memory controls': 'capLongTermMemory',
};

export function evidenceCapKey(categorySlug: string | undefined, slug: string): string {
  return `${String(categorySlug ?? '').toLowerCase()}|${String(slug ?? '')}`;
}

/** False when the product explicitly lacks the capability for this test. */
export function isEvidenceApplicable(
  categorySlug: string | undefined,
  def: { slug?: unknown },
  productFields: Record<string, unknown>,
): boolean {
  const key = evidenceCapKey(categorySlug, String(def.slug ?? ''));
  const cap = REQUIRED_CAP[key];
  if (!cap) return true;
  if (productFields[cap] === false) return false;
  return true;
}

export function filterApplicableItems<T extends { def: { slug?: unknown } }>(
  categorySlug: string | undefined,
  items: T[],
  productFields: Record<string, unknown>,
  gendersRaw?: unknown,
): T[] {
  return filterGenderGatedItems(
    categorySlug,
    items.filter(({ def }) => isEvidenceApplicable(categorySlug, def, productFields)),
    gendersRaw,
  );
}
