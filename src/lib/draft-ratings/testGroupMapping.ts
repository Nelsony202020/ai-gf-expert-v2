/**
 * Presentation-layer test groups derived from admin TEST_SESSIONS.
 * No DB migration — maps existing session definitions to public-facing groups.
 */

import { TEST_SESSIONS, type TestSessionDef } from '../../components/admin/testing/sessions';

export interface MappedTestGroup {
  id: string;
  title: string;
  intro?: string;
  categorySlug: string;
  subscoreSlug: string;
  slugs: string[];
}

/** Public-friendly titles where the admin session title is too internal. */
const TITLE_OVERRIDES: Record<string, string> = {
  'library-tags': 'Character library audit',
  'finding-characters': 'Search and filters test',
  'character-sample-review': 'Profile quality audit',
  'appearance-options': 'Appearance options audit',
  'personality-options': 'Personality options audit',
  'creator-control': 'Character creation accuracy test',
  'chat-understanding': 'Five-chat understanding test',
  'chat-realism': 'Conversation realism test',
  'chat-reliability': 'Long-session reliability test',
  'chat-media': 'In-chat media capabilities test',
  'chat-interaction': 'Voice and interaction features test',
  'chat-controls': 'Message and memory controls audit',
  'platform-extras': 'Bonus feature audit',
  'image-experience': 'Image generation workflow test',
  'image-editing-test': 'Image editing test',
  'image-batch-review': '20-image quality test',
  'image-consistency': 'Same-character consistency test',
  'video-batch-review': 'Five-video quality test',
  'policy-review': 'Privacy policy audit',
  'data-controls': 'Account and data-control test',
  'security-billing': 'Security features audit',
  'customer-support': 'Support response test',
  'subscription-basics': 'Subscription pricing audit',
  'pricing-limits-policies': 'Credit and top-up audit',
  'pricing-value-breakdown': 'Pricing clarity and value test',
  'video-capabilities': 'Video capabilities audit',
  'video-experience': 'Video generation workflow test',
};

/** Map evidence slug → subscore slug using methodology seed order / session placement. */
const SUBSCORE_BY_SESSION: Record<string, string> = {
  'library-tags': 'variety',
  'finding-characters': 'discovery',
  'character-sample-review': 'quality',
  'appearance-options': 'appearance',
  'personality-options': 'personality',
  'creator-control': 'control',
  'chat-understanding': 'understanding',
  'chat-realism': 'realism',
  'chat-reliability': 'reliability',
  'chat-media': 'media',
  'chat-interaction': 'interaction',
  'chat-controls': 'controls',
  'platform-extras': 'platform-extras',
  'image-experience': 'experience',
  'image-editing-test': 'accuracy',
  'image-batch-review': 'quality',
  'image-consistency': 'accuracy',
  'video-batch-review': 'quality',
  'policy-review': 'data-use',
  'data-controls': 'user-control',
  'security-billing': 'security',
  'customer-support': 'support',
  'subscription-basics': 'subscription',
  'pricing-limits-policies': 'extra-costs',
  'pricing-value-breakdown': 'value',
  value: 'value',
  'video-capabilities': 'capabilities',
  'video-experience': 'experience',
};

function slugToSubscore(session: TestSessionDef, categorySlug: string): string {
  if (SUBSCORE_BY_SESSION[session.id]) return SUBSCORE_BY_SESSION[session.id];
  // Heuristic: first slug prefix or session id segment
  const first = session.slugs[0];
  if (first?.includes('privacy') || categorySlug === 'privacy') return session.id.split('-')[0] ?? session.id;
  if (categorySlug === 'pricing') {
    if (session.id.includes('subscription')) return 'subscription';
    if (session.id.includes('credit') || session.id.includes('top')) return 'extra-costs';
    return 'value';
  }
  return session.id;
}

export function mappedTestGroupsForCategory(categorySlug: string): MappedTestGroup[] {
  const sessions = TEST_SESSIONS[categorySlug] ?? [];
  return sessions.map((session) => ({
    id: session.id,
    title: TITLE_OVERRIDES[session.id] ?? session.title,
    intro: session.intro,
    categorySlug,
    subscoreSlug: slugToSubscore(session, categorySlug),
    slugs: [...session.slugs],
  }));
}

export function allMappedTestGroups(): MappedTestGroup[] {
  return Object.keys(TEST_SESSIONS).flatMap((cat) => mappedTestGroupsForCategory(cat));
}

export const DRAFT_CATEGORY_ORDER = [
  'characters',
  'customization',
  'chat',
  'chat-features',
  'images',
  'video',
  'privacy',
  'pricing',
] as const;
