// Test sessions: groups of evidence definitions that are completed with the
// same piece of work (e.g. the same 50-character sample or the same 200-reply
// chat test). Sessions are a presentation layer only — every evidence
// definition still saves its own result and the scoring engine is untouched.

import type { EntityRow } from '../api';
import { PRICING_AUTOFILL_SLUGS as PRICING_TAB_COVERED_SLUGS } from '../../../lib/testing/pricingEvidenceSlugs';
import { SAMPLE } from './sampleSizes';

export interface TestSessionDef {
  id: string;
  title: string;
  /** Shared setup instructions shown once at the top of the session. */
  intro?: string;
  icon: string;
  /** Evidence definition slugs within this session's category. */
  slugs: string[];
  /** Optional sample-size prompt shown once at the top (quality review sessions). */
  sampleSizeField?: { label: string; default?: number };
}

export const TEST_SESSIONS: Record<string, TestSessionDef[]> = {
  characters: [
    {
      id: 'library-tags',
      title: 'Library variety',
      intro: 'Open the character library once. Count characters in each category below.',
      icon: 'groups',
      slugs: [
        'female-count',
        'male-count',
        'anime-female-count',
        'anime-male-count',
        'transgender-count',
        'non-binary-count',
        'other-count',
        'styles',
        'ethnicities',
        'personalities',
        'scenarios',
      ],
    },
    {
      id: 'finding-characters',
      title: 'Finding characters',
      intro: 'Try filters, categories, search, and 10 quick browsing tasks.',
      icon: 'travel_explore',
      slugs: ['filters', 'categories', 'search', 'browsing'],
    },
    {
      id: 'character-sample-review',
      title: 'Character quality check',
      intro: 'Review one sample group of characters. Set the sample size once, then answer every question for that same group.',
      icon: 'fact_check',
      sampleSizeField: { label: 'How many characters did you review?', default: 25 },
      slugs: ['duplicates', 'originality', 'profile-quality', 'visual-quality'],
    },
  ],

  customization: [
    {
      id: 'appearance-options',
      title: 'Appearance options',
      intro: 'Open the character creator once and count every appearance option in this order.',
      icon: 'face_retouching_natural',
      slugs: [
        'ethnicity',
        'age',
        'eye-color',
        'body-type',
        'breast-size',
        'hair-style',
        'hair-color',
        'outfits',
        'creator-personalities',
      ],
    },
    {
      id: 'personality-options',
      title: 'Personality & voice options',
      intro: 'In the character creator: count personality, relationship/chat style, occupation, kink options, and voice options.',
      icon: 'psychology',
      slugs: ['traits', 'interests', 'relationship', 'kink-options', 'role', 'voice'],
    },
    {
      id: 'creator-control',
      title: 'Creator control',
      intro: 'Make 5 test characters. Use them for every question in this section.',
      icon: 'tune',
      slugs: ['custom-prompts', 'editing', 'preview'],
    },
  ],

  chat: [
    {
      id: 'chat-understanding',
      title: 'Chat understanding',
      icon: 'neurology',
      slugs: ['memory', 'relevance', 'context', 'instructions', 'roleplay-accuracy'],
    },
    {
      id: 'chat-realism',
      title: 'Chat quality',
      intro: 'Use the same 5 chats as the understanding test. Fill in the table — one row per chat.',
      icon: 'forum',
      slugs: ['naturalness', 'personality', 'roleplay', 'initiative', 'emotion', 'style'],
    },
    {
      id: 'chat-reliability',
      title: 'Chat problems & speed',
      intro: 'Use the same chats again. Also run the refusal test and speed test where asked.',
      icon: 'speed',
      slugs: ['repetition', 'refusals', 'reply-speed', 'errors', 'consistency', 'recovery'],
    },
  ],

  'chat-features': [
    {
      id: 'chat-media',
      title: 'In-chat media (3 attempts each)',
      intro: 'Try each media type three times in separate chats and record the outcome.',
      icon: 'perm_media',
      slugs: [
        'images-sent',
        'images-received',
        'voice-sent',
        'voice-received',
        'chat-video',
        'gifs',
        'reactions',
      ],
    },
    {
      id: 'chat-interaction',
      title: 'Interaction features',
      intro: 'Voice calls, chat modes, group chats, double texting, and proactive messages.',
      icon: 'interactive_space',
      slugs: [
        'voice-calls',
        'chat-modes',
        'mode-types',
        'group-chat',
        'double-texting',
        'proactive-messages',
      ],
    },
    {
      id: 'chat-controls',
      title: 'Message & memory controls (3 attempts each)',
      intro: 'Try each control three times: editing, deleting, regenerating, memories, reset and export.',
      icon: 'settings',
      slugs: [
        'edit-messages',
        'delete-messages',
        'regenerate-replies',
        'save-memories',
        'edit-memories',
        'reset-chat',
        'export-chat',
      ],
    },
    {
      id: 'platform-extras',
      title: 'Platform extras',
      intro:
        'Does the app have bonus features beyond normal chat? If yes, note AI cam models and any other extras with proof.',
      icon: 'stars',
      slugs: ['platform-extras-list', 'live-cam'],
    },
  ],

  images: [
    {
      id: 'image-experience',
      title: 'Generation experience & tools',
      intro: 'Speed, failures, where generation is available, prompting, editing, and NSFW rules.',
      icon: 'auto_fix_high',
      slugs: [
        'speed',
        'failures',
        'chat-generation',
        'separate-generator',
        'custom-prompts',
        'image-editing',
        'nsfw-support',
        'resolution',
      ],
    },
    {
      id: 'image-editing-test',
      title: 'Image editing accuracy',
      intro: 'Try editing generated images and record how accurately edits are applied.',
      icon: 'brush',
      slugs: ['editing-accuracy'],
    },
    {
      id: 'image-batch-review',
      title: `${SAMPLE.imageBatch} images`,
      icon: 'photo_library',
      slugs: ['realism', 'visual-errors', 'composition', 'prompt-accuracy'],
    },
    {
      id: 'image-consistency',
      title: 'Character consistency',
      icon: 'face_6',
      slugs: [
        'character-consistency',
        'face-consistency',
        'body-consistency',
        'style-consistency',
      ],
    },
  ],

  video: [
    {
      id: 'video-capabilities',
      title: 'Video capabilities',
      intro: 'What video features exist: text-to-video, image-to-video, chat video, audio, length and resolution.',
      icon: 'movie',
      slugs: [
        'text-to-video',
        'image-to-video',
        'chat-video',
        'audio',
        'maximum-length',
      ],
    },
    {
      id: 'video-experience',
      title: 'Generation experience',
      intro: 'Speed, failures, ease of use, and regeneration.',
      icon: 'smart_display',
      slugs: ['speed', 'failures', 'ease-of-use', 'regeneration', 'maximum-resolution'],
    },
    {
      id: 'video-batch-review',
      title: `${SAMPLE.videoBatch} videos`,
      icon: 'video_library',
      slugs: ['motion', 'accuracy', 'character-consistency', 'visual-errors', 'frame-consistency'],
    },
  ],

  privacy: [
    {
      id: 'policy-review',
      title: 'Policy & data-use review',
      intro: 'Read the privacy policy, terms and help pages once, then answer all of these.',
      icon: 'policy',
      slugs: ['training', 'human-review', 'data-sharing', 'advertising', 'retention', 'policy-clarity'],
    },
    {
      id: 'data-controls',
      title: 'User data controls (test account)',
      intro: 'Use the test account to try deleting, exporting and opting out.',
      icon: 'shield_person',
      slugs: [
        'delete-chats',
        'delete-account',
        'delete-personal-data',
        'training-opt-out',
        'export-data',
      ],
    },
    {
      id: 'security-billing',
      title: 'Security & billing',
      intro: 'Encryption, two-factor authentication, billing descriptor, and security incidents.',
      icon: 'lock',
      slugs: [
        'encryption',
        'two-factor-authentication',
        'billing-descriptor',
        'security-incidents',
      ],
    },
    {
      id: 'customer-support',
      title: 'Customer support',
      intro:
        'Contact support once with a real question. Rate how easy it was to reach them, how fast they replied, and how helpful the answer was — use your overall impression, not exact seconds.',
      icon: 'support_agent',
      slugs: [
        'support-available',
        'support-channels',
        'support-reach',
        'support-speed',
        'support-helpfulness',
      ],
    },
  ],

  pricing: [
    {
      id: 'subscription-basics',
      title: 'Free plan & trial',
      intro: 'Record whether a free plan and free trial exist. Plan prices live in the Pricing tab.',
      icon: 'payments',
      slugs: ['free-plan', 'free-trial', 'included-features'],
    },
    {
      id: 'pricing-limits-policies',
      title: 'Limits, paywalls & refunds',
      intro:
        'Record usage limits, credit expiry rules, feature paywalls, and refund policy. Dollar amounts for plans and packages come from the Pricing tab.',
      icon: 'policy',
      slugs: ['plan-limits', 'credit-expiry', 'feature-paywalls', 'refunds'],
    },
    {
      id: 'pricing-value-breakdown',
      title: 'Value breakdown',
      intro: 'Compare value vs competitors and rate feature and usage value.',
      icon: 'analytics',
      slugs: ['category-comparison', 'feature-value', 'usage-value'],
    },
    {
      id: 'value',
      title: 'Value for money',
      intro: 'Pricing clarity and whether the product feels worth the money.',
      icon: 'monitoring',
      slugs: ['pricing-clarity'],
    },
  ],
};

/** @deprecated Use PRICING_AUTOFILL_SLUGS from lib — kept for existing imports. */
export { PRICING_TAB_COVERED_SLUGS };

/** Evidence slugs with no standalone row — saved via a combined control. */
export const COMBINED_EVIDENCE_SLUGS = new Set([
  'mode-types',
  'live-cam',
  'support-channels',
]);

/** Evidence slugs managed elsewhere in the UI — never show as standalone rows. */
const HIDDEN_TESTING_SLUGS = new Set<string>([...COMBINED_EVIDENCE_SLUGS]);

function isExcludedFromTesting(categorySlug: string, slug: string): boolean {
  if (HIDDEN_TESTING_SLUGS.has(slug)) return true;
  if (categorySlug === 'pricing' && PRICING_TAB_COVERED_SLUGS.has(slug)) return true;
  return false;
}

export interface SessionGroup {
  session: TestSessionDef;
  defs: EntityRow[];
}

/**
 * Maps a category's active evidence definitions into ordered session groups.
 * Definitions not covered by the config land in a trailing "Other tests"
 * session so nothing ever disappears from the UI.
 */
export function sessionsForCategory(categorySlug: string, defs: EntityRow[]): SessionGroup[] {
  const config = TEST_SESSIONS[categorySlug] ?? [];
  const bySlug = new Map<string, EntityRow>();
  for (const d of defs) bySlug.set(String(d.slug), d);

  const groups: SessionGroup[] = [];
  const used = new Set<string>();

  for (const session of config) {
    const matched = session.slugs
      .map((slug) => bySlug.get(slug))
      .filter((d): d is EntityRow => Boolean(d));
    for (const d of matched) used.add(d.id);
    if (matched.length > 0) groups.push({ session, defs: matched });
  }

  const leftover = defs.filter(
    (d) => !used.has(d.id) && !isExcludedFromTesting(categorySlug, String(d.slug ?? '')),
  );
  if (leftover.length > 0) {
    groups.push({
      session: {
        id: `${categorySlug}-other`,
        title: 'Other tests',
        icon: 'science',
        slugs: [],
      },
      defs: leftover,
    });
  }

  return groups;
}
