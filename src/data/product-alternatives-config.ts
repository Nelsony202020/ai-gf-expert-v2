import { ROUNDUP_CATEGORY_KEYS } from '../data/roundups/ai-girlfriend';

type RoundupCategoryKey = (typeof ROUNDUP_CATEGORY_KEYS)[number];

export interface AlternativeEditorial {
  slug: string;
  bestFor: string;
  whyChoose: string;
  whereSourceBetter: string;
  chooseIf: string;
  /** Short consumer hook for the decision grid, e.g. "Want more customization?" */
  decisionHook: string;
  /** Material symbol name for decision grid */
  decisionIcon: string;
  /** One-line descriptor under name in comparison table */
  tableDescriptor: string;
}

export interface ProductAlternativesConfig {
  slugs: string[];
  updatedLabel: string;
  stickWithDecisionHook: string;
  stickWithDecisionIcon: string;
  editorials: Record<string, Omit<AlternativeEditorial, 'slug'>>;
  /** Quick-pick cards shown in the horizontal row below the hero. */
  quickPicks: Array<{ label: string; slug: string }>;
  /** Decision rows for the intro summary card (max 3 after closest match). */
  summarySlots: Array<{
    label: string;
    slug: string;
    valueKind: 'score' | 'price';
    /** Which metric to compare against the source product (defaults to overall). */
    compareMetric?: 'overall' | 'chat' | 'price';
  }>;
  /** Slugs used for detailed testing rows + score comparison table (defaults to first 3 peers). */
  tablePeerSlugs?: string[];
  /** Ahrefs target domain for market competitor data. */
  marketSourceDomain?: string;
}

/** Approved alternative slugs per source product — smallest config until DB relationship exists. */
export const PRODUCT_ALTERNATIVES: Record<string, ProductAlternativesConfig> = {
  'aura-ai': {
    slugs: ['ourdream-ai', 'candy-ai', 'kindroid', 'girlfriendgpt'],
    updatedLabel: 'August 2026',
    stickWithDecisionHook: 'Happy with Aura AI?',
    stickWithDecisionIcon: 'check_circle',
    quickPicks: [
      { label: 'Best Overall Alternative', slug: 'ourdream-ai' },
      { label: 'Best for Chat', slug: 'kindroid' },
      { label: 'Best for Images', slug: 'ourdream-ai' },
      { label: 'Best Cheaper Option', slug: 'candy-ai' },
    ],
    summarySlots: [
      { label: 'Best overall', slug: 'ourdream-ai', valueKind: 'score', compareMetric: 'overall' },
      { label: 'Best for chat', slug: 'kindroid', valueKind: 'score', compareMetric: 'chat' },
      { label: 'Cheapest alternative', slug: 'candy-ai', valueKind: 'price', compareMetric: 'price' },
    ],
    tablePeerSlugs: ['ourdream-ai', 'kindroid', 'girlfriendgpt'],
    marketSourceDomain: 'aura.ai',
    editorials: {
      'ourdream-ai': {
        bestFor: 'Customization & images',
        tableDescriptor: 'Closest match · stronger images',
        whyChoose:
          'Gives you much more control over character creation and produced stronger images in our hands-on tests.',
        whereSourceBetter: 'Aura AI scored higher for privacy and video in our testing.',
        chooseIf: 'You want deep customization and stronger image generation in one subscription.',
        decisionHook: 'Want more customization?',
        decisionIcon: 'palette',
      },
      'candy-ai': {
        bestFor: 'Beginners & balance',
        tableDescriptor: 'Balanced all-rounder · lower similarity',
        whyChoose:
          'The most balanced chat, image, and customization mix in our 2026 testing — fewer weak spots than rivals.',
        whereSourceBetter: 'Aura AI offers stronger video generation controls and voice-call polish.',
        chooseIf: 'You want one safe default app without optimizing for a single strength.',
        decisionHook: 'Want something simple?',
        decisionIcon: 'auto_awesome',
      },
      kindroid: {
        bestFor: 'Voice-first chat',
        tableDescriptor: 'Closest match · stronger voice/chat focus',
        whyChoose:
          'Voice calls and conversational realism scored higher in our chat-focused test scenarios.',
        whereSourceBetter: 'Aura AI leads on image-to-video generation and character library breadth.',
        chooseIf: 'Voice companionship matters more than media generation.',
        decisionHook: 'Want voice-first companionship?',
        decisionIcon: 'mic',
      },
      girlfriendgpt: {
        bestFor: 'Adult roleplay',
        tableDescriptor: 'Similar roleplay focus · weaker overall',
        whyChoose:
          'Long-form scenario roleplay and story depth scored best in our dedicated roleplay tests.',
        whereSourceBetter: 'Aura AI is stronger on image quality consistency and video features.',
        chooseIf: 'Conversation depth and adult scenarios are your priority.',
        decisionHook: 'Want deeper roleplay?',
        decisionIcon: 'forum',
      },
    },
  },
};

export const COMPARISON_CATEGORY_KEYS = [
  'characters',
  'customization',
  'chat',
  'chat-features',
  'images',
  'video',
  'privacy',
  'pricing',
] as const satisfies readonly RoundupCategoryKey[];

export const COMPARISON_CATEGORY_LABELS: Record<(typeof COMPARISON_CATEGORY_KEYS)[number], string> = {
  characters: 'Characters',
  customization: 'Customization',
  chat: 'Chat',
  'chat-features': 'Chat Features',
  images: 'Images',
  video: 'Video',
  privacy: 'Privacy',
  pricing: 'Pricing',
};

/** Minimum category score gap to count as "meaningfully better". */
export const ALTERNATIVE_BEAT_THRESHOLD = 1.0;
