import { toSlug } from '../slugs';
import { findEvidenceSlugByName } from '../test-methodology-evidence';
import {
  getPublicEvidenceGroupDisplay,
  listPublicEvidenceSubscoreKeys,
} from '../test-subscore-public-evidence';
import { iconForEvidenceDef } from './evidenceIcons';

export interface EvidenceCategoryGroupDef {
  slug: string;
  name: string;
  memberSlugs: string[];
}

function buildSubscoreEvidenceGroups(): Record<string, EvidenceCategoryGroupDef[]> {
  const result: Record<string, EvidenceCategoryGroupDef[]> = {};
  for (const key of listPublicEvidenceSubscoreKeys()) {
    const [categorySlug, subscoreSlug] = key.split('/');
    const groups = getPublicEvidenceGroupDisplay(categorySlug, subscoreSlug);
    if (!groups?.length) continue;
    result[key] = groups.map((group) => ({
      slug: group.slug,
      name: group.label,
      memberSlugs: group.memberSectionIds,
    }));
  }
  return result;
}

/** Evidence category groups per category/subscore — derived from methodology display tree. */
export const SUBSCORE_EVIDENCE_GROUPS: Record<string, EvidenceCategoryGroupDef[]> =
  buildSubscoreEvidenceGroups();

/** Material Symbols icon names for evidence category rows. */
export const CONTRIBUTOR_ICONS: Record<string, string> = {
  amount: 'groups',
  styles: 'palette',
  genders: 'transgender',
  ethnicities: 'public',
  personalities: 'mood',
  scenarios: 'auto_awesome',
  filters: 'filter_alt',
  categories: 'category',
  search: 'search',
  browsing: 'travel_explore',
  duplicates: 'content_copy',
  originality: 'auto_awesome',
  'profile-quality': 'description',
  'visual-quality': 'photo_camera',
  ethnicity: 'public',
  age: 'cake',
  'eye-color': 'visibility',
  'body-type': 'accessibility_new',
  'breast-size': 'straighten',
  'hair-style': 'content_cut',
  'hair-color': 'palette',
  outfits: 'checkroom',
  'creator-personalities': 'mood',
  'personality-presets': 'mood',
  traits: 'psychology',
  interests: 'favorite',
  relationship: 'favorite',
  role: 'theater_comedy',
  voice: 'record_voice_over',
  'kink-options': 'lock_open',
  'custom-prompts': 'edit_note',
  editing: 'edit',
  preview: 'preview',
  memory: 'psychology',
  relevance: 'target',
  context: 'forum',
  instructions: 'rule',
  'roleplay-accuracy': 'theater_comedy',
  naturalness: 'record_voice_over',
  personality: 'mood',
  roleplay: 'theater_comedy',
  emotion: 'sentiment_satisfied',
  initiative: 'bolt',
  style: 'format_paint',
  repetition: 'repeat',
  refusals: 'block',
  'reply-speed': 'speed',
  errors: 'error',
  consistency: 'sync',
  recovery: 'restart_alt',
  'images-sent': 'send',
  'images-received': 'image',
  'voice-sent': 'mic',
  'voice-received': 'record_voice_over',
  'chat-video': 'videocam',
  gifs: 'gif_box',
  reactions: 'add_reaction',
  'voice-calls': 'call',
  'chat-modes': 'tune',
  'mode-types': 'category',
  'group-chat': 'groups',
  'double-texting': 'forum',
  'proactive-messages': 'notifications_active',
  'edit-messages': 'edit',
  'delete-messages': 'delete',
  'regenerate-replies': 'refresh',
  'save-memories': 'bookmark',
  'edit-memories': 'edit_note',
  'reset-chat': 'restart_alt',
  'export-chat': 'download',
  'live-cam': 'videocam',
  'other-extras': 'extension',
  realism: 'photo_camera',
  'visual-errors': 'bug_report',
  composition: 'crop',
  resolution: 'hd',
  'prompt-accuracy': 'target',
  'character-consistency': 'face',
  'face-consistency': 'face',
  'body-consistency': 'accessibility_new',
  'style-consistency': 'palette',
  'editing-accuracy': 'edit',
  speed: 'speed',
  failures: 'error',
  'chat-generation': 'chat',
  'separate-generator': 'apps',
  'image-editing': 'edit',
  'nsfw-support': 'lock_open',
  'text-to-video': 'movie',
  'image-to-video': 'movie_filter',
  audio: 'volume_up',
  'maximum-length': 'timer',
  'maximum-resolution': 'hd',
  motion: 'animation',
  accuracy: 'target',
  'frame-consistency': 'view_carousel',
  'ease-of-use': 'touch_app',
  regeneration: 'refresh',
  training: 'school',
  'human-review': 'person_search',
  'data-sharing': 'share',
  advertising: 'campaign',
  retention: 'schedule',
  'policy-clarity': 'description',
  'delete-chats': 'delete',
  'delete-account': 'person_remove',
  'delete-personal-data': 'delete_forever',
  'training-opt-out': 'block',
  'export-data': 'download',
  encryption: 'lock',
  'two-factor-authentication': 'security',
  'billing-descriptor': 'receipt',
  'security-incidents': 'warning',
  'support-available': 'support_agent',
  'support-channels': 'forum',
  'support-reach': 'contact_support',
  'support-speed': 'speed',
  'support-helpfulness': 'thumb_up',
  'monthly-price': 'payments',
  'annual-price': 'calendar_month',
  'included-features': 'checklist',
  'included-credits': 'toll',
  'plan-limits': 'speed',
  'annual-discount': 'sell',
  'monthly-spend': 'account_balance_wallet',
  'top-up-value': 'add_shopping_cart',
  'voice-cost': 'mic',
  'call-cost': 'call',
  'image-cost': 'image',
  'video-cost': 'movie',
  'free-chat': 'chat',
  'free-characters': 'person_add',
  'free-images': 'photo',
  'free-video': 'videocam',
  'free-voice': 'record_voice_over',
  'free-value': 'card_giftcard',
  restrictions: 'event_busy',
  'pricing-clarity': 'info',
  paywalls: 'lock',
  'credit-expiry': 'schedule',
  refunds: 'currency_exchange',
  cancellation: 'cancel',
  'payment-privacy': 'visibility_off',
};

/** @deprecated Use SUBSCORE_EVIDENCE_GROUPS — kept for slug lookups. */
export const CONTRIBUTOR_MEMBER_SLUGS: Record<string, string[]> = Object.fromEntries(
  Object.entries(SUBSCORE_EVIDENCE_GROUPS).flatMap(([key, groups]) =>
    groups.map((g) => [`${key}/${g.slug}`, g.memberSlugs]),
  ),
);

const SCOPE_BY_CONTRIBUTOR: Record<string, string> = {
  amount: 'Measures the size and breadth of available options in this area.',
  styles: 'Measures how many distinct visual or format styles are offered.',
  genders: 'Measures gender and identity representation across available options.',
  ethnicities: 'Measures how many ethnicity or background groups are represented.',
  personalities: 'Measures the range of personality types available.',
  scenarios: 'Measures relationship, story, and scenario variety.',
};

export function contributorKey(
  categorySlug: string,
  subscoreSlug: string,
  contributorLabel: string,
): string {
  return `${categorySlug}/${subscoreSlug}/${toSlug(contributorLabel)}`;
}

export function memberSlugsForContributor(
  categorySlug: string,
  subscoreSlug: string,
  contributorLabel: string,
): string[] {
  const key = contributorKey(categorySlug, subscoreSlug, contributorLabel);
  const grouped = CONTRIBUTOR_MEMBER_SLUGS[key];
  if (grouped) return grouped;

  const dbSlug = findEvidenceSlugByName(categorySlug, subscoreSlug, contributorLabel);
  if (dbSlug) return [dbSlug];

  return [toSlug(contributorLabel)];
}

export function evidenceGroupsForSubscore(
  categorySlug: string,
  subscoreSlug: string,
): EvidenceCategoryGroupDef[] | undefined {
  return SUBSCORE_EVIDENCE_GROUPS[`${categorySlug}/${subscoreSlug}`];
}

export function scopeForContributor(contributorLabel: string): string | undefined {
  return SCOPE_BY_CONTRIBUTOR[toSlug(contributorLabel)];
}

export function iconForContributor(groupSlug: string, label: string): string {
  return iconForEvidenceDef(groupSlug, label) !== 'analytics'
    ? iconForEvidenceDef(groupSlug, label)
    : CONTRIBUTOR_ICONS[groupSlug] ?? CONTRIBUTOR_ICONS[toSlug(label)] ?? 'analytics';
}
