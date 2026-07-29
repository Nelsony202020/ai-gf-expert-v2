import type { CategoryBenchmarkPanelConfig } from '../lib/test-category-benchmarks/types';
import {
  PRICING_FREE_ACCESS_MINIMUMS,
  PRICING_RED_FLAGS,
} from '../lib/test-category-benchmarks/pricing-market';

const standardTiers = {
  good: 'Good',
  typical: 'Typical',
  weak: 'Weak',
} as const;

const privacyTiers = {
  good: 'Good',
  typical: 'Caution',
  weak: 'Poor',
} as const;

export const categoryBenchmarkConfigs: Record<string, CategoryBenchmarkPanelConfig> = {
  characters: {
    categoryKey: 'characters',
    title: 'What good Characters looks like',
    intro:
      'Enough choice to keep the app interesting, without filling the library with rushed or copy-paste profiles.',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Female characters',
        good: '81+',
        typical: '31–80',
        weak: '0–30',
        evidenceRef: { category: 'characters', slug: 'female-count' },
      },
      {
        label: 'Useful filters',
        good: '7+',
        typical: '4–6',
        weak: '0–3',
        evidenceRef: { category: 'characters', slug: 'filters' },
      },
      {
        label: 'Duplicate rate',
        good: '20% or less',
        typical: '21–40%',
        weak: 'Over 40%',
        evidenceRef: { category: 'characters', slug: 'duplicates' },
      },
    ],
    minimums: [
      { label: 'Personality types', value: '11+', evidenceRef: { category: 'characters', slug: 'personalities' } },
      { label: 'Scenarios', value: '11+', evidenceRef: { category: 'characters', slug: 'scenarios' } },
      { label: 'Character search', value: 'Works for names and keywords' },
      { label: 'Profile quality', value: '80%+', evidenceRef: { category: 'characters', slug: 'profile-quality' } },
      { label: 'Visual quality', value: '80%+', evidenceRef: { category: 'characters', slug: 'visual-quality' } },
    ],
    redFlags: [
      'Lots of characters with nearly identical profiles',
      'Search only works for exact character names',
      'A large library filled with weak descriptions or broken images',
    ],
    footer: 'testing',
  },

  customization: {
    categoryKey: 'customization',
    title: 'What good Customization looks like',
    intro:
      'Enough options to create someone who actually matches your preferences, with control beyond a few basic presets.',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Body types',
        good: '9+',
        typical: '4–8',
        weak: '0–3',
        evidenceRef: { category: 'customization', slug: 'body-type' },
      },
      {
        label: 'Personality traits',
        good: '21+',
        typical: '11–20',
        weak: '0–10',
        evidenceRef: { category: 'customization', slug: 'traits' },
      },
      {
        label: 'Relationship types',
        good: '13+',
        typical: '9–12',
        weak: '0–8',
        evidenceRef: { category: 'customization', slug: 'relationship' },
      },
    ],
    minimums: [
      { label: 'Age options', value: '6+', evidenceRef: { category: 'customization', slug: 'age' } },
      { label: 'Ethnicity options', value: '9+', evidenceRef: { category: 'customization', slug: 'ethnicity' } },
      { label: 'Personality presets', value: '11+', evidenceRef: { category: 'customization', slug: 'creator-personalities' } },
      { label: 'Custom prompts', value: 'Available' },
      { label: 'Editable after creation', value: 'At least 4 of 5 areas' },
      { label: 'Preview before creation', value: 'Available' },
    ],
    redFlags: [
      'Only a few options for every setting',
      'No custom prompts or written instructions',
      'Character cannot be previewed or edited later',
    ],
    footer: 'testing',
  },

  chat: {
    categoryKey: 'chat',
    title: 'What good Chat looks like',
    intro:
      'A good chat remembers you, answers properly, stays in character, and feels natural across longer conversations.',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Facts remembered',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'chat', slug: 'memory' },
      },
      {
        label: 'Natural replies',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'chat', slug: 'naturalness' },
      },
      {
        label: 'Median reply speed',
        good: '4 sec or less',
        typical: '5–6 sec',
        weak: 'Over 4 sec',
        evidenceRef: { category: 'chat', slug: 'reply-speed' },
      },
    ],
    minimums: [
      { label: 'Direct questions answered', value: '80%+', evidenceRef: { category: 'chat', slug: 'relevance' } },
      { label: 'Instructions followed', value: '80%+', evidenceRef: { category: 'chat', slug: 'instructions' } },
      { label: 'Roleplay checks passed', value: '80%+', evidenceRef: { category: 'chat', slug: 'roleplay-accuracy' } },
      { label: 'Repetition problems', value: '2 or fewer per 50 replies' },
      { label: 'Broken replies', value: '2 or fewer per 50 replies' },
      { label: 'Successful recovery', value: '80%+' },
    ],
    redFlags: [
      'Forgets basic details almost immediately',
      'Regularly breaks character during roleplay',
      'Repeats itself or sends broken, unrelated replies',
    ],
    footer: 'testing',
  },

  'chat-features': {
    categoryKey: 'chat-features',
    title: 'What good Chat Features looks like',
    intro:
      'Useful features that make the chat more immersive and work properly—not features added only so the pricing page looks impressive.',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Core media tests',
        good: '3 of 3 work',
        typical: '1–2 of 3 work',
        weak: '0 of 3 work',
        compositeRef: {
          kind: 'ynl-pass-count',
          category: 'chat-features',
          slugs: ['images-received', 'voice-received', 'chat-video'],
        },
      },
      {
        label: 'Chat modes',
        good: '2+',
        typical: '1',
        weak: '0',
        evidenceRef: {
          category: 'chat-features',
          slug: 'chat-modes',
          goodMinScore: 5,
          typicalMinScore: 3,
        },
      },
      {
        label: 'Message controls',
        good: '6–7 available',
        typical: '3–5 available',
        weak: '0–2 available',
        subscoreCountRef: {
          kind: 'subscore-control-count',
          category: 'chat-features',
          subscore: 'controls',
        },
      },
    ],
    minimums: [
      { label: 'Voice calls', value: 'Connect in all 3 tests' },
      { label: 'Images and voice replies', value: 'Can be received' },
      { label: 'Edit, delete and regenerate', value: 'Available' },
      { label: 'Save and edit memories', value: 'Available' },
      { label: 'Reset and export chat', value: 'Available' },
      { label: 'Proactive-message test', value: 'Completed over 7 days' },
    ],
    redFlags: [
      'Advertised features repeatedly fail during testing',
      'Chat modes barely change how the conversation works',
      'No control over messages, conversations, or saved memories',
    ],
    footer: 'testing',
  },

  images: {
    categoryKey: 'images',
    title: 'What good Images looks like',
    intro:
      'Strong images that follow your prompt, keep the same character, and do not waste your credits on constant retries.',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Visual quality',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'images', slug: 'realism' },
      },
      {
        label: 'Prompt accuracy',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'images', slug: 'prompt-accuracy' },
      },
      {
        label: 'Generation speed',
        good: '20 sec or less',
        typical: '21–40 sec',
        weak: 'Over 20 sec',
        evidenceRef: { category: 'images', slug: 'speed' },
      },
    ],
    minimums: [
      { label: 'Failed generations', value: '20% or less' },
      { label: 'Images with major defects', value: '20% or less' },
      { label: 'Character consistency', value: '80%+', evidenceRef: { category: 'images', slug: 'character-consistency' } },
      { label: 'Editing accuracy', value: '80%+', evidenceRef: { category: 'images', slug: 'editing-accuracy' } },
      { label: 'Maximum resolution', value: '1080p or higher' },
      { label: 'Custom prompts', value: 'Accepted in all 3 tests' },
    ],
    redFlags: [
      'Regularly ignores important parts of the prompt',
      'Face or body changes between images',
      'Too many failed, broken, or unusable generations',
    ],
    footer: 'testing',
  },

  video: {
    categoryKey: 'video',
    title: 'What good Video looks like',
    intro:
      'A video generator that gives you real control, creates stable results, and offers more than a basic five-second animation.',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Maximum length',
        good: '16 sec+',
        typical: '11–15 sec',
        weak: '0–10 sec',
        evidenceRef: { category: 'video', slug: 'maximum-length' },
      },
      {
        label: 'Prompt accuracy',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'video', slug: 'accuracy' },
      },
      {
        label: 'Generation speed',
        good: '2 min or less',
        typical: '2–5 min',
        weak: 'Over 2 min',
        evidenceRef: { category: 'video', slug: 'speed' },
      },
    ],
    minimums: [
      { label: 'Motion quality', value: '80%+' },
      { label: 'Character consistency', value: '80%+', evidenceRef: { category: 'video', slug: 'character-consistency' } },
      { label: 'Failed generations', value: '20% or less' },
      { label: 'Maximum resolution', value: '1080p or higher' },
      { label: 'Steps to start generation', value: '5 or fewer' },
      { label: 'Regeneration', value: 'Available' },
    ],
    redFlags: [
      'Only offers a simple “turn image into video” button',
      'Face, body, or clothing changes during the video',
      'Heavy flickering, warping, or frequent failed generations',
    ],
    footer: 'testing',
  },

  privacy: {
    categoryKey: 'privacy',
    title: 'What good Privacy looks like',
    intro:
      'Clear policies, proper control over your data, and no major warning signs involving account security or sensitive information.',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: privacyTiers,
    tierVariant: 'privacy',
    mainRows: [
      {
        label: 'Chats used for training',
        good: 'No',
        typical: 'Unknown or limited',
        weak: 'Yes',
        evidenceRef: { category: 'privacy', slug: 'training' },
      },
      {
        label: 'Human review',
        good: 'No',
        typical: 'Unknown or limited',
        weak: 'Yes',
        evidenceRef: { category: 'privacy', slug: 'human-review' },
      },
      {
        label: 'Confirmed security incidents',
        good: '0',
        typical: '1',
        weak: '2+',
        evidenceRef: { category: 'privacy', slug: 'security-incidents' },
      },
    ],
    minimums: [
      { label: 'Policy clarity', value: 'At least 5 of 6 questions answered' },
      { label: 'Account deletion', value: 'Available in settings' },
      { label: 'Training opt-out', value: 'Available' },
      { label: 'Data export', value: 'Delivered within 30 days' },
      { label: 'Two-factor authentication', value: 'Available' },
      { label: 'Customer support', value: 'Rated Good or better' },
    ],
    redFlags: [
      'Vague wording about how chats and photos are used',
      'No clear way to delete data or opt out of training',
      'Recent confirmed breaches involving sensitive user information',
    ],
    footer: 'testing',
  },

  pricing: {
    categoryKey: 'pricing',
    title: 'What good pricing looks like',
    intro: 'Market price ranges and the minimum access we expect before asking users to pay.',
    mainSectionTitle: 'Market price ranges',
    tierLabels: { good: 'Low cost', typical: 'Typical', weak: 'High cost' },
    mainRows: [],
    marketData: true,
    minimumSectionTitle: 'Minimum useful free access',
    minimums: PRICING_FREE_ACCESS_MINIMUMS,
    redFlags: PRICING_RED_FLAGS,
    footer: 'live',
  },
};

export function getCategoryBenchmarkConfig(categoryKey: string): CategoryBenchmarkPanelConfig | undefined {
  return categoryBenchmarkConfigs[categoryKey];
}
