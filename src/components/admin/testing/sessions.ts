// Test sessions: groups of evidence definitions that are completed with the
// same piece of work (e.g. the same 50-character sample or the same 200-reply
// chat test). Sessions are a presentation layer only — every evidence
// definition still saves its own result and the scoring engine is untouched.
//
// Definitions are matched by category slug + evidence slug. Anything not
// listed here falls into an automatic "Other tests" session for its category,
// so new methodology definitions keep working without a code change.

import type { EntityRow } from '../api';

export interface TestSessionDef {
  id: string;
  title: string;
  /** Shared setup instructions shown once at the top of the session. */
  intro?: string;
  icon: string;
  /** Evidence definition slugs within this session's category. */
  slugs: string[];
}

export const TEST_SESSIONS: Record<string, TestSessionDef[]> = {
  characters: [
    {
      id: 'library-tags',
      title: 'Library variety',
      intro: 'Open the character library once. Count and tick what you see.',
      icon: 'groups',
      slugs: ['amount', 'styles', 'genders', 'ethnicities', 'personalities', 'scenarios'],
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
      title: '25-character check',
      intro: 'Look at 25 characters once. Answer all four quality questions from that same group.',
      icon: 'fact_check',
      slugs: ['duplicates', 'originality', 'profile-quality', 'visual-quality'],
    },
  ],

  customization: [
    {
      id: 'appearance-options',
      title: 'Appearance options',
      intro: 'Open the character creator once and count every appearance option.',
      icon: 'face_retouching_natural',
      slugs: ['gender', 'age', 'ethnicity', 'face', 'hair', 'body', 'clothing'],
    },
    {
      id: 'personality-options',
      title: 'Personality & voice options',
      intro: 'Still in the character creator: count personality, relationship, role and voice options.',
      icon: 'psychology',
      slugs: ['traits', 'interests', 'communication', 'relationship', 'role', 'voice'],
    },
    {
      id: 'creator-control',
      title: 'Creator control',
      intro: 'Make 5 test characters. Use them for every question in this section.',
      icon: 'tune',
      slugs: ['custom-prompts', 'editing', 'detail-level', 'combinations', 'preview'],
    },
  ],

  chat: [
    {
      id: 'chat-understanding',
      title: 'Chat understanding',
      intro: 'Read the pink step-by-step box below. Fill in the table — one row per chat.',
      icon: 'neurology',
      slugs: ['memory', 'relevance', 'context', 'instructions', 'roleplay-accuracy'],
    },
    {
      id: 'chat-realism',
      title: 'Chat quality',
      intro: 'Use the same 10 chats as above. Read the steps in the pink box and fill in the table.',
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
      intro:
        'Voice calls, chat modes, group chats, double texting and the 7-day proactive-message test.',
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
  ],

  images: [
    {
      id: 'image-batch-review',
      title: '20 images',
      intro: 'Make 20 test images. Follow the pink step-by-step box and fill in the table.',
      icon: 'photo_library',
      slugs: ['realism', 'visual-errors', 'detail', 'composition', 'resolution', 'prompt-accuracy'],
    },
    {
      id: 'image-consistency',
      title: 'Same-character images',
      intro: 'Make 10 images of one character. Follow the pink box below.',
      icon: 'face_6',
      slugs: [
        'character-consistency',
        'face-consistency',
        'body-consistency',
        'style-consistency',
        'editing-accuracy',
      ],
    },
    {
      id: 'image-experience',
      title: 'Generation experience & tools',
      intro: 'Speed, failures, where generation is available, prompting, editing, NSFW rules and cost.',
      icon: 'auto_fix_high',
      slugs: [
        'speed',
        'failures',
        'chat-generation',
        'separate-generator',
        'custom-prompts',
        'image-editing',
        'nsfw-support',
        'cost',
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
        'maximum-resolution',
      ],
    },
    {
      id: 'video-batch-review',
      title: '5 videos',
      intro: 'Make 10 test videos. Follow the pink step-by-step box and fill in the table.',
      icon: 'video_library',
      slugs: ['realism', 'motion', 'accuracy', 'character-consistency', 'visual-errors', 'frame-consistency'],
    },
    {
      id: 'video-experience',
      title: 'Generation experience',
      intro: 'Speed, failures, ease of use, available controls, regeneration and cost.',
      icon: 'smart_display',
      slugs: ['speed', 'failures', 'ease-of-use', 'controls', 'regeneration', 'cost'],
    },
  ],

  privacy: [
    {
      id: 'policy-review',
      title: 'Policy & data-use review',
      intro:
        'Read the privacy policy, terms and help pages once, then answer all of these. Record the source and date for each.',
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
        'consent-controls',
      ],
    },
    {
      id: 'security-billing',
      title: 'Security & billing privacy',
      intro: 'Account protections, encryption statements, 2FA, and how the charge appears on a bank statement.',
      icon: 'lock',
      slugs: [
        'encryption',
        'account-security',
        'two-factor-authentication',
        'billing-privacy',
        'billing-descriptor',
        'security-incidents',
      ],
    },
  ],

  pricing: [
    {
      id: 'subscription-basics',
      title: 'Subscription basics',
      intro: 'Record the public prices, trial, included credits, features and limits.',
      icon: 'payments',
      slugs: [
        'monthly-price',
        'annual-price',
        'free-plan',
        'free-trial',
        'included-credits',
        'included-features',
        'plan-limits',
      ],
    },
    {
      id: 'extra-costs',
      title: 'Credits & extra costs',
      intro: 'Per-image, per-video and voice costs, credit packages, expiry, paywalls and refunds.',
      icon: 'toll',
      slugs: [
        'image-cost',
        'video-cost',
        'voice-cost',
        'top-ups',
        'credit-expiry',
        'feature-paywalls',
        'refunds',
      ],
    },
    {
      id: 'value',
      title: 'Value for money',
      intro:
        'Use the two standard usage examples (regular and heavy use) to calculate what a month really costs.',
      icon: 'monitoring',
      slugs: [
        'real-cost',
        'heavy-use-cost',
        'category-comparison',
        'feature-value',
        'usage-value',
        'pricing-clarity',
      ],
    },
  ],
};

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

  const leftover = defs.filter((d) => !used.has(d.id));
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
