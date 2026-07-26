/**
 * Shared directory metadata used by both server-rendered components
 * (homepage quick finder, /apps directory) and the client-side engine.
 * Keep this module dependency-free so it can safely ship in client bundles.
 */

export interface DirectoryScoreMeta {
  value: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

/** All ranking factors backed by real structured scores (overall + 8 categories). */
export const DIRECTORY_SCORE_META: DirectoryScoreMeta[] = [
  { value: 'overall', label: 'Overall balance', icon: 'balance', color: '#16a34a', description: 'The official overall score.' },
  { value: 'characters', label: 'Characters', icon: 'groups', color: '#9333ea', description: 'Character depth and variety.' },
  { value: 'customization', label: 'Customization', icon: 'tune', color: '#db2777', description: 'Persona and appearance control.' },
  { value: 'chat', label: 'Chat', icon: 'chat_bubble', color: '#2563eb', description: 'Memory and chat realism.' },
  { value: 'chat-features', label: 'Chat features', icon: 'forum', color: '#0891b2', description: 'Voice, extras, and chat tools.' },
  { value: 'images', label: 'Images', icon: 'image', color: '#ca8a04', description: 'Quality and consistency.' },
  { value: 'video', label: 'Video', icon: 'videocam', color: '#dc2626', description: 'Quality, speed and consistency.' },
  { value: 'privacy', label: 'Privacy', icon: 'shield', color: '#4f46e5', description: 'Data controls and discretion.' },
  { value: 'pricing', label: 'Pricing', icon: 'paid', color: '#ca8a04', description: 'Value for the monthly price.' },
];

export const DIRECTORY_SCORE_META_BY_VALUE: Record<string, DirectoryScoreMeta> = Object.fromEntries(
  DIRECTORY_SCORE_META.map((meta) => [meta.value, meta]),
);

/** Customize-ranking choices — chat, images, video only. */
export const DIRECTORY_PRIORITY_OPTIONS: DirectoryScoreMeta[] = [
  { value: 'chat', label: 'Chat', icon: 'chat_bubble', color: '#2563eb', description: 'Memory and chat realism.' },
  { value: 'images', label: 'Images', icon: 'image', color: '#ca8a04', description: 'Quality and consistency.' },
  { value: 'video', label: 'Video', icon: 'videocam', color: '#dc2626', description: 'Quality, speed and consistency.' },
];

export const DIRECTORY_PRIORITY_OPTIONS_BY_VALUE: Record<string, DirectoryScoreMeta> = Object.fromEntries(
  DIRECTORY_PRIORITY_OPTIONS.map((meta) => [meta.value, meta]),
);

/** Category scores shown in collapsed results when no priorities are active. */
export const DEFAULT_VISIBLE_SCORE_KEYS = ['chat', 'images', 'customization'];

/** Default personalized-ranking priorities (also the visible-score fallback order). */
export const DEFAULT_RANKING_PRIORITIES = ['chat', 'images', 'video'];

/**
 * Resolve which three category scores collapsed rows/cards should display,
 * based on the active ranking priorities. "overall" is skipped because the
 * overall score is always visible separately.
 */
export function getVisibleScoreKeys(priorities: string[] | null | undefined): string[] {
  const keys: string[] = [];
  (priorities ?? []).forEach((key) => {
    if (key !== 'overall' && DIRECTORY_SCORE_META_BY_VALUE[key] && !keys.includes(key)) keys.push(key);
  });
  DEFAULT_VISIBLE_SCORE_KEYS.forEach((key) => {
    if (keys.length < 3 && !keys.includes(key)) keys.push(key);
  });
  return keys.slice(0, 3);
}

export interface DirectorySortOption {
  id: string;
  label: string;
}

/** Sort options backed by real structured data. */
export const DIRECTORY_SORT_OPTIONS: DirectorySortOption[] = [
  { id: 'overall', label: 'Overall rating' },
  { id: 'popular', label: 'Most popular' },
  { id: 'price-asc', label: 'Lowest monthly price' },
  { id: 'value', label: 'Best value' },
  { id: 'chat', label: 'Highest Chat score' },
  { id: 'images', label: 'Highest Images score' },
  { id: 'video', label: 'Highest Video score' },
];

export const DIRECTORY_SORT_LABELS: Record<string, string> = Object.fromEntries(
  DIRECTORY_SORT_OPTIONS.map((opt) => [opt.id, opt.label]),
);

export interface HomeQuickChoice {
  id: string;
  label: string;
  icon: string;
  /** Structured filter id applied when this choice is selected (null = ranking only). */
  filter: string | null;
  /** Category used to order preview results (null = overall score). */
  sortKey: string | null;
  /** The 2–3 category scores surfaced on preview cards for this choice. */
  scores: string[];
}

/** Homepage quick-finder choices (kept to six high-value options). */
export const HOME_QUICK_CHOICES: HomeQuickChoice[] = [
  { id: 'realistic-chat', label: 'Realistic chat', icon: 'chat_bubble', filter: 'realistic-chat', sortKey: 'chat', scores: ['chat', 'chat-features', 'customization'] },
  { id: 'images-video', label: 'Images & video', icon: 'image', filter: 'images', sortKey: 'images', scores: ['images', 'video', 'pricing'] },
  { id: 'roleplay', label: 'Roleplay', icon: 'theater_comedy', filter: 'roleplay', sortKey: 'characters', scores: ['characters', 'chat', 'customization'] },
  { id: 'memory', label: 'Long-term memory', icon: 'psychology', filter: 'memory', sortKey: 'chat', scores: ['chat', 'chat-features', 'privacy'] },
  { id: 'value', label: 'Best value', icon: 'sell', filter: null, sortKey: 'pricing', scores: ['pricing', 'chat', 'images'] },
  { id: 'free-plan', label: 'Free plan', icon: 'savings', filter: 'free-plan', sortKey: 'pricing', scores: ['pricing', 'chat', 'images'] },
];

export const HOME_QUICK_CHOICES_BY_ID: Record<string, HomeQuickChoice> = Object.fromEntries(
  HOME_QUICK_CHOICES.map((choice) => [choice.id, choice]),
);

export interface HomePriorityChoice {
  id: string;
  label: string;
}

/** "What matters most?" options on the homepage (only supported score factors). */
export const HOME_PRIORITY_CHOICES: HomePriorityChoice[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'images', label: 'Images' },
  { id: 'video', label: 'Video' },
  { id: 'pricing', label: 'Price' },
  { id: 'overall', label: 'Overall balance' },
];

/** Human labels for structured filter ids (chips, capability tags). */
export const DIRECTORY_FILTER_LABELS: Record<string, string> = {
  'realistic-chat': 'Realistic conversations',
  roleplay: 'Roleplay & scenarios',
  memory: 'Long-term memory',
  images: 'Image generation',
  video: 'Video generation',
  voice: 'Voice calls',
  custom: 'Custom characters',
  nsfw: 'NSFW support',
  mobile: 'Mobile app',
  'voice-messages': 'Voice messages',
  'free-plan': 'Free tier',
  'privacy-high': 'Strong privacy',
  'no-credit-system': 'No credit system',
  'pay-card': 'Card',
  'pay-paypal': 'PayPal',
  'pay-crypto': 'Cryptocurrency',
  'pay-discreet': 'Discreet billing',
};

/** Capability tags surfaced on list rows, in display-priority order. */
export const DIRECTORY_TAG_ORDER = ['voice', 'images', 'video', 'memory', 'roleplay', 'realistic-chat', 'custom', 'free-plan'];
