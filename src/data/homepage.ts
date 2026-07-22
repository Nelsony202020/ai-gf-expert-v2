import type { RoundupPick } from './roundups/ai-girlfriend';
import { aiGirlfriendRoundup } from './roundups/ai-girlfriend';
import { getProduct } from './products';
import type { StoryHighlightCharacter } from './products';
import { buildSearchIndex, type SearchResult } from './site-search';

const img = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export interface HomeExplorerApp extends RoundupPick {
  filters: string[];
  payments: string[];
  platforms: string[];
  highlightScores: { label: string; score: number; key: string }[];
  priceLabel: string;
  creditsNote?: string;
  reviewCount: number;
  hasReview: boolean;
  roundupHref: string;
  roundupRibbonLabel: string;
}

export interface HomeFilterOption {
  id: string;
  label: string;
  icon?: string;
}

export interface HomeFilterGroup {
  id: string;
  title: string;
  icon: string;
  options: HomeFilterOption[];
  advanced?: boolean;
}

export const APPS_PER_PAGE = 12;

export const explorerPopularVisible: HomeFilterOption[] = [
  { id: 'realistic-chat', label: 'Realistic conversations', icon: 'chat_bubble' },
  { id: 'roleplay', label: 'Roleplay & scenarios', icon: 'theater_comedy' },
  { id: 'memory', label: 'Long-term memory', icon: 'psychology' },
  { id: 'images', label: 'Image generation', icon: 'image' },
  { id: 'video', label: 'Video generation', icon: 'video_library' },
];

export const explorerPopularMore: HomeFilterOption[] = [
  { id: 'voice', label: 'Voice calls', icon: 'call' },
  { id: 'custom', label: 'Custom characters', icon: 'face' },
  { id: 'nsfw', label: 'NSFW support', icon: 'no_adult_content' },
  { id: 'mobile', label: 'Mobile app', icon: 'smartphone' },
  { id: 'voice-messages', label: 'Voice messages', icon: 'mic' },
  { id: 'free-plan', label: 'Free tier available', icon: 'savings' },
  { id: 'privacy-high', label: 'Strong privacy controls', icon: 'shield' },
];

/** @deprecated Use explorerPopularVisible */
export const explorerQuickFilters: HomeFilterOption[] = [
  ...explorerPopularVisible,
  ...explorerPopularMore,
];

export const explorerAcceptedPayments: HomeFilterOption[] = [
  { id: 'pay-card', label: 'Card', icon: 'card' },
  { id: 'pay-paypal', label: 'PayPal', icon: 'paypal' },
  { id: 'pay-crypto', label: 'Cryptocurrency', icon: 'bitcoin' },
  { id: 'pay-discreet', label: 'Discreet billing', icon: 'shield' },
];

export const explorerBillingPreferences: HomeFilterOption[] = [
  { id: 'pay-crypto-only', label: 'Crypto-only apps' },
  { id: 'pay-discreet', label: 'Discreet billing' },
  { id: 'no-credit-system', label: 'No credit system' },
];

export const explorerCollapsedFilterGroups: HomeFilterGroup[] = [
  {
    id: 'characters',
    title: 'Characters',
    icon: 'person',
    options: [
      { id: 'custom', label: 'Custom characters', icon: 'face' },
      { id: 'nsfw', label: 'NSFW support', icon: 'no_adult_content' },
      { id: 'mobile', label: 'Mobile app', icon: 'smartphone' },
    ],
  },
  {
    id: 'chat-roleplay',
    title: 'Chat & roleplay',
    icon: 'chat_bubble',
    options: [
      { id: 'realistic-chat', label: 'Realistic conversations', icon: 'chat_bubble' },
      { id: 'voice', label: 'Voice calls', icon: 'call' },
      { id: 'voice-messages', label: 'Voice messages', icon: 'mic' },
      { id: 'roleplay', label: 'Roleplay & scenarios', icon: 'theater_comedy' },
    ],
  },
  {
    id: 'media',
    title: 'Media features',
    icon: 'image',
    options: [
      { id: 'images', label: 'Image generation', icon: 'image' },
      { id: 'video', label: 'Video generation', icon: 'video_library' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    icon: 'shield',
    options: [
      { id: 'privacy-high', label: 'Strong privacy controls', icon: 'shield' },
      { id: 'free-plan', label: 'Free tier available', icon: 'savings' },
    ],
  },
];

/** @deprecated Use explorerCollapsedFilterGroups */
export const explorerMoreFilterGroups: HomeFilterGroup[] = [];

export function getExplorerCollapsedFilterGroups(): HomeFilterGroup[] {
  const visibleIds = new Set(explorerPopularVisible.map((option) => option.id));

  return explorerCollapsedFilterGroups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => !visibleIds.has(option.id)),
    }))
    .filter((group) => group.options.length > 0);
}

/** @deprecated Use getExplorerCollapsedFilterGroups */
export function getExplorerMoreFilterGroups(): HomeFilterGroup[] {
  return getExplorerCollapsedFilterGroups();
}

/** @deprecated Use explorerAcceptedPayments */
export const explorerPaymentFilters: HomeFilterOption[] = [
  ...explorerAcceptedPayments,
  ...explorerBillingPreferences,
];

/** @deprecated Use explorerMoreFilterGroups */
export const explorerAdvancedFilterGroups: HomeFilterGroup[] = explorerMoreFilterGroups;

/** All eight rating categories shown on directory cards */
export const EXPLORER_METRIC_CARDS = [
  { key: 'characters', label: 'Characters', icon: 'groups', color: '#9333ea' },
  { key: 'customization', label: 'Customization', icon: 'tune', color: '#db2777' },
  { key: 'chat', label: 'Chat', icon: 'chat_bubble', color: '#2563eb' },
  { key: 'chat-features', label: 'Chat quality', icon: 'forum', color: '#0891b2' },
  { key: 'images', label: 'Images', icon: 'image', color: '#ea580c' },
  { key: 'video', label: 'Video', icon: 'videocam', color: '#7c3aed' },
  { key: 'privacy', label: 'Privacy', icon: 'shield', color: '#4f46e5' },
  { key: 'pricing', label: 'Pricing', icon: 'paid', color: '#ca8a04' },
] as const;

/** @deprecated Use EXPLORER_METRIC_CARDS */
export const EXPLORER_PERFORMANCE_KEYS = EXPLORER_METRIC_CARDS.map((m) => m.key);
export const EXPLORER_PERFORMANCE_LABELS = Object.fromEntries(
  EXPLORER_METRIC_CARDS.map((m) => [m.key, m.label]),
) as Record<string, string>;
export const explorerBudgetPresets: HomeFilterOption[] = [
  { id: 'budget-free', label: 'Free' },
  { id: 'budget-under-15', label: 'Under $15' },
  { id: 'budget-15-25', label: '$15–25' },
  { id: 'budget-over-25', label: '$25+' },
];

export const explorerMinRatings: HomeFilterOption[] = [
  { id: 'rating-any', label: 'Any' },
  { id: 'rating-8', label: '8.0+' },
  { id: 'rating-85', label: '8.5+' },
  { id: 'rating-9', label: '9.0+' },
];

export const explorerFilterGroups: HomeFilterGroup[] = [
  {
    id: 'experience',
    title: 'Experience',
    options: explorerQuickFilters,
  },
  {
    id: 'pricing',
    title: 'Pricing',
    options: explorerBudgetPresets,
  },
];

export const explorerPriorityOptions = [
  { value: 'chat', label: 'Chat quality', icon: 'chat_bubble', color: '#db2777', description: 'Realistic, engaging, human-like conversations.' },
  { value: 'images', label: 'Image quality', icon: 'image', color: '#9333ea', description: 'Quality and variety of generated images.' },
  { value: 'pricing', label: 'Pricing / value', icon: 'paid', color: '#ea580c', description: 'Best features for your money.' },
  { value: 'customization', label: 'Customization', icon: 'tune', color: '#db2777', description: 'Character creation and personalization.' },
  { value: 'chat-features', label: 'Voice & calls', icon: 'call', color: '#16a34a', description: 'Voice messages and calls experience.' },
  { value: 'video', label: 'Video quality', icon: 'videocam', color: '#7c3aed', description: 'Quality of generated videos.' },
  { value: 'privacy', label: 'Privacy', icon: 'shield', color: '#4f46e5', description: 'Data handling and user control.' },
  { value: 'characters', label: 'Character variety', icon: 'groups', color: '#9333ea', description: 'Breadth and quality of characters.' },
  { value: 'overall', label: 'Overall balance', icon: 'balance', color: '#64748b', description: 'Balanced performance across categories.' },
] as const;

export const explorerQuickSortOptions = [
  { id: 'overall', label: 'Overall rating', icon: 'star' },
  { id: 'popular', label: 'Most popular', icon: 'local_fire_department' },
  { id: 'newest', label: 'Newest', icon: 'wb_sunny' },
  { id: 'value', label: 'Best value', icon: 'sell' },
  { id: 'rating', label: 'Highest rated', icon: 'emoji_events' },
] as const;

export const explorerLastUpdated = aiGirlfriendRoundup.modifiedDate;

export interface HomeRecentUpdate {
  id: string;
  title: string;
  href: string;
  image: string;
  imageAlt: string;
  date: string;
  summary: string;
  score?: number;
  scoreDelta?: number;
  type: 'review' | 'roundup' | 'retest';
  badge?: string;
}

export interface HomeGuide {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  image: string;
  imageAlt: string;
  date: string;
  type: 'guide' | 'roundup' | 'comparison';
}

export interface HomeGoal {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export const heroPopularSearches = [
  'best memory',
  'voice calls',
  'free plan',
  'realistic chat',
  'roleplay',
] as const;

export const trustStripStats = [
  { icon: 'apps', value: '24+', label: 'Apps tested' },
  { icon: 'category', value: '8', label: 'Rating categories' },
  { icon: 'payments', value: '100%', label: 'Paid accounts' },
  { icon: 'calendar_today', value: '30+ days', label: 'Hands-on testing' },
  { icon: 'update', value: 'Weekly', label: 'Updates' },
] as const;

export const findMatchGoals = [
  'Natural conversations',
  'Realistic images',
  'Voice & phone calls',
  'Long-term memory',
  'Roleplay & scenarios',
  'Privacy & discretion',
] as const;

export const browseGoals: HomeGoal[] = [
  { id: 'chat', label: 'Best for Realistic Chat', href: '/best/ai-girlfriend#pick-candy-ai', icon: 'chat' },
  { id: 'memory', label: 'Best for Long-term Memory', href: '/best/ai-girlfriend#pick-replika', icon: 'psychology' },
  { id: 'voice', label: 'Best for Voice Calls', href: '/best/ai-girlfriend#pick-kindroid', icon: 'call' },
  { id: 'images', label: 'Best for Images', href: '/best/ai-girlfriend#pick-dreamgf', icon: 'image' },
  { id: 'roleplay', label: 'Best for Roleplay', href: '/best/ai-girlfriend#pick-crushon-ai', icon: 'theater_comedy' },
  { id: 'free', label: 'Best Free Option', href: '/best/ai-girlfriend#pick-character-ai', icon: 'savings' },
  { id: 'privacy', label: 'Best for Privacy', href: '/best/ai-girlfriend#pick-replika', icon: 'shield' },
  { id: 'value', label: 'Best Value', href: '/best/ai-girlfriend#pick-nectar-ai', icon: 'sell' },
];

function scoreFor(pick: RoundupPick, key: string): number {
  return pick.categoryScores.find((c) => c.key === key)?.score ?? pick.overallScore;
}

function buildFilters(pick: RoundupPick): string[] {
  const filters = new Set<string>(['custom']);
  const specText = pick.specs.map((s) => `${s.label} ${s.value}`).join(' ').toLowerCase();
  const freeTier = pick.specs.find((s) => s.label === 'Free tier')?.value.toLowerCase() ?? '';

  if (freeTier && !freeTier.includes('no') && !freeTier.includes('none')) {
    filters.add('free-plan');
  }
  if (scoreFor(pick, 'chat') >= 8.5) filters.add('realistic-chat');
  if (scoreFor(pick, 'images') >= 8) filters.add('images');
  if (scoreFor(pick, 'video') >= 7.5 || specText.includes('video')) filters.add('video');
  if (specText.includes('voice') && !specText.includes('no')) filters.add('voice');
  if (pick.ribbonKey === 'roleplay' || specText.includes('roleplay')) filters.add('roleplay');
  if (specText.includes('memory') || specText.includes('persistent') || specText.includes('long-term')) {
    filters.add('memory');
  }
  if (specText.includes('nsfw') && !specText.includes('filtered') && !specText.includes('limited / opt-in')) {
    filters.add('nsfw');
  }
  if (specText.includes('ios') || specText.includes('android')) filters.add('mobile');
  if (specText.includes('voice') && !specText.includes('no')) filters.add('voice-messages');
  if (scoreFor(pick, 'privacy') >= 8.5) filters.add('privacy-high');
  if (!specText.includes('credit') && !freeTier.includes('credit')) filters.add('no-credit-system');

  if (pick.priceMonthly <= 0) filters.add('budget-free');
  else if (pick.priceMonthly < 15) filters.add('budget-under-15');
  else if (pick.priceMonthly <= 25) filters.add('budget-15-25');
  else filters.add('budget-over-25');

  return [...filters];
}

function buildPayments(pick: RoundupPick): string[] {
  const payments = new Set<string>(['pay-card']);
  const specText = pick.specs.map((s) => `${s.label} ${s.value}`).join(' ').toLowerCase();

  if (['candy-ai', 'crushon-ai', 'dreamgf', 'replika', 'character-ai'].includes(pick.id)) {
    payments.add('pay-paypal');
  }
  if (['kindroid', 'aura-ai', 'nectar-ai'].includes(pick.id)) {
    payments.add('pay-crypto');
  }
  if (pick.id === 'nectar-ai') {
    payments.delete('pay-card');
    payments.add('pay-crypto-only');
  }
  if (pick.id === 'replika' || specText.includes('discreet')) {
    payments.add('pay-discreet');
  }

  return [...payments];
}

function buildPlatforms(pick: RoundupPick): string[] {
  const platforms = pick.specs.find((s) => s.label === 'Platforms')?.value.toLowerCase() ?? 'web';
  const icons: string[] = [];
  if (platforms.includes('web')) icons.push('language');
  if (platforms.includes('ios')) icons.push('phone_iphone');
  if (platforms.includes('android')) icons.push('android');
  return icons.length ? icons : ['language'];
}

function buildHighlightScores(pick: RoundupPick): HomeExplorerApp['highlightScores'] {
  const chat = { label: 'Chat', score: scoreFor(pick, 'chat'), key: 'chat' };
  const images = { label: 'Images', score: scoreFor(pick, 'images'), key: 'images' };

  if (pick.ribbonKey === 'roleplay') {
    return [chat, { label: 'Roleplay', score: scoreFor(pick, 'characters'), key: 'characters' }, images];
  }
  if (pick.ribbonKey === 'voice') {
    return [chat, { label: 'Voice', score: scoreFor(pick, 'chat-features'), key: 'chat-features' }, images];
  }
  if (pick.ribbonKey === 'privacy') {
    return [chat, { label: 'Privacy', score: scoreFor(pick, 'privacy'), key: 'privacy' }, images];
  }
  if (pick.ribbonKey === 'free' || pick.ribbonKey === 'value') {
    return [chat, images, { label: 'Value', score: scoreFor(pick, 'pricing'), key: 'pricing' }];
  }
  if (pick.ribbonKey === 'video') {
    return [chat, { label: 'Video', score: scoreFor(pick, 'video'), key: 'video' }, images];
  }

  return [chat, images, { label: 'Custom', score: scoreFor(pick, 'customization'), key: 'customization' }];
}

function reviewCountFor(pick: RoundupPick): number {
  const base: Record<string, number> = {
    'candy-ai': 1240,
    'kindroid': 860,
    'crushon-ai': 720,
    'aura-ai': 540,
    'dreamgf': 610,
    'replika': 980,
    'character-ai': 1520,
    'nectar-ai': 430,
  };
  return base[pick.id] ?? 500;
}

function creditsNoteFor(pick: RoundupPick): string | undefined {
  if (pick.priceMonthly <= 0) return undefined;
  const freeTier = pick.specs.find((s) => s.label === 'Free tier')?.value.toLowerCase() ?? '';
  if (freeTier.includes('credit') || freeTier.includes('limited') || freeTier.includes('generous')) {
    return '+ optional credits';
  }
  return '+ optional credits';
}

function priceLabel(pick: RoundupPick): string {
  if (pick.priceMonthly <= 0) return 'Free';
  return `From $${pick.priceMonthly.toFixed(2)} / month`;
}

export function getRoundupRibbonLabel(pick: RoundupPick): string {
  if (pick.ribbonKey === 'overall') return 'Best AI girlfriend';
  return pick.ribbon;
}

export function getRoundupRibbonHref(pick: RoundupPick): string {
  return `/best/${aiGirlfriendRoundup.slug}#pick-${pick.id}`;
}

export function buildExplorerApps(): HomeExplorerApp[] {
  return aiGirlfriendRoundup.picks.map((pick) => ({
    ...pick,
    reviewUrl: pick.reviewUrl ?? (getProduct(pick.slug) ? `/reviews/${pick.slug}` : undefined),
    hasReview: Boolean(pick.reviewUrl ?? getProduct(pick.slug)),
    roundupHref: getRoundupRibbonHref(pick),
    roundupRibbonLabel: getRoundupRibbonLabel(pick),
    filters: buildFilters(pick),
    payments: buildPayments(pick),
    platforms: buildPlatforms(pick),
    highlightScores: buildHighlightScores(pick),
    priceLabel: priceLabel(pick),
    creditsNote: creditsNoteFor(pick),
    reviewCount: reviewCountFor(pick),
  }));
}

export function getExplorerPerformanceScores(app: HomeExplorerApp): { label: string; score: number; key: string }[] {
  return EXPLORER_METRIC_CARDS.map((metric) => ({
    key: metric.key,
    label: metric.label,
    score: app.categoryScores.find((c) => c.key === metric.key)?.score ?? app.overallScore,
  }));
}

export function appAcceptsCard(app: HomeExplorerApp): boolean {
  return app.payments.includes('pay-card');
}

export function appAcceptsPaypal(app: HomeExplorerApp): boolean {
  return app.payments.includes('pay-paypal');
}

export function appAcceptsCrypto(app: HomeExplorerApp): boolean {
  return app.payments.some((p) => p === 'pay-crypto' || p === 'pay-crypto-only');
}

export function buildExplorerPriceHistogram(apps: HomeExplorerApp[]): number[] {
  const buckets = [0, 0, 0, 0, 0, 0];
  apps.forEach((app) => {
    const price = app.priceMonthly;
    if (price <= 0) buckets[0] += 1;
    else if (price < 10) buckets[1] += 1;
    else if (price < 15) buckets[2] += 1;
    else if (price < 20) buckets[3] += 1;
    else if (price < 25) buckets[4] += 1;
    else buckets[5] += 1;
  });
  const max = Math.max(...buckets, 1);
  return buckets.map((count) => Math.round((count / max) * 100));
}

export const explorerMaxPrice = Math.max(...aiGirlfriendRoundup.picks.map((p) => p.priceMonthly), 30);

export const topPicks = aiGirlfriendRoundup.picks.slice(0, 3);

export const charactersOfWeek: StoryHighlightCharacter[] = [
  {
    name: 'Luna',
    archetype: 'Romantic dreamer',
    platform: 'Candy AI',
    avatar: img('home-char-luna', 200, 200),
    profileUrl: '/best/ai-girlfriend#pick-candy-ai',
    storySlides: [img('home-luna-1', 720, 1280), img('home-luna-2', 720, 1280), img('home-luna-3', 720, 1280)],
  },
  {
    name: 'Aria',
    archetype: 'Voice companion',
    platform: 'Kindroid',
    avatar: img('home-char-aria', 200, 200),
    profileUrl: '/best/ai-girlfriend#pick-kindroid',
    storySlides: [img('home-aria-1', 720, 1280), img('home-aria-2', 720, 1280)],
  },
  {
    name: 'Sophie',
    archetype: 'Roleplay lead',
    platform: 'CrushOn AI',
    avatar: img('home-char-sophie', 200, 200),
    profileUrl: '/best/ai-girlfriend#pick-crushon-ai',
    storySlides: [img('home-sophie-1', 720, 1280), img('home-sophie-2', 720, 1280), img('home-sophie-3', 720, 1280)],
  },
  {
    name: 'Finn',
    archetype: 'Adventurous storyteller',
    platform: 'Aura AI',
    avatar: img('home-char-finn', 200, 200),
    profileUrl: '/reviews/aura-ai',
    storySlides: [img('home-finn-1', 720, 1280), img('home-finn-2', 720, 1280)],
  },
  {
    name: 'Violet',
    archetype: 'Visual muse',
    platform: 'DreamGF',
    avatar: img('home-char-violet', 200, 200),
    profileUrl: '/best/ai-girlfriend#pick-dreamgf',
    storySlides: [img('home-violet-1', 720, 1280), img('home-violet-2', 720, 1280), img('home-violet-3', 720, 1280)],
  },
  {
    name: 'Maya',
    archetype: 'Everyday companion',
    platform: 'Replika',
    avatar: img('home-char-maya', 200, 200),
    profileUrl: '/best/ai-girlfriend#pick-replika',
    storySlides: [img('home-maya-1', 720, 1280), img('home-maya-2', 720, 1280)],
  },
  {
    name: 'Nova',
    archetype: 'Free-tier favorite',
    platform: 'Character.AI',
    avatar: img('home-char-nova', 200, 200),
    profileUrl: '/best/ai-girlfriend#pick-character-ai',
    storySlides: [img('home-nova-1', 720, 1280), img('home-nova-2', 720, 1280), img('home-nova-3', 720, 1280)],
  },
  {
    name: 'Elara',
    archetype: 'Fantasy lead',
    platform: 'DreamGF',
    avatar: img('home-char-elara', 200, 200),
    profileUrl: '/best/ai-girlfriend#pick-dreamgf',
    storySlides: [img('home-elara-1', 720, 1280), img('home-elara-2', 720, 1280)],
  },
  {
    name: 'Jade',
    archetype: 'Premium companion',
    platform: 'Nectar AI',
    avatar: img('home-char-jade', 200, 200),
    profileUrl: '/best/ai-girlfriend#pick-nectar-ai',
    storySlides: [img('home-jade-1', 720, 1280), img('home-jade-2', 720, 1280), img('home-jade-3', 720, 1280)],
  },
  {
    name: 'Sienna',
    archetype: 'Playful flirt',
    platform: 'Candy AI',
    avatar: img('home-char-sienna', 200, 200),
    profileUrl: '/best/ai-girlfriend#pick-candy-ai',
    storySlides: [img('home-sienna-1', 720, 1280), img('home-sienna-2', 720, 1280)],
  },
];

/** Homepage featured grid: row 1 then row 2 (5 × 2) */
export const featuredCharactersDisplayOrder: StoryHighlightCharacter[] = [
  charactersOfWeek[2], // Sophie
  charactersOfWeek[3], // Finn
  charactersOfWeek[4], // Violet
  charactersOfWeek[5], // Maya
  charactersOfWeek[6], // Nova
  charactersOfWeek[0], // Luna
  charactersOfWeek[1], // Aria
  charactersOfWeek[7], // Elara
  charactersOfWeek[8], // Jade
  charactersOfWeek[9], // Sienna
];

export const recentUpdates: HomeRecentUpdate[] = [
  {
    id: 'aura-retest',
    title: 'Aura AI Review',
    href: '/reviews/aura-ai',
    image: getProduct('aura-ai')?.gallery[0]?.full ?? aiGirlfriendRoundup.picks[3].gallery[0].full,
    imageAlt: 'Aura AI review update',
    date: 'Jul 22, 2026',
    summary: 'Overview & ratings UI refresh — comparison charts, search trends, and character story highlights updated.',
    score: getProduct('aura-ai')?.overallScore ?? 8.9,
    type: 'review',
    badge: 'Updated',
  },
  {
    id: 'roundup-refresh',
    title: 'Best AI Girlfriend Apps',
    href: '/best/ai-girlfriend',
    image: aiGirlfriendRoundup.featuredImage,
    imageAlt: aiGirlfriendRoundup.featuredImageAlt,
    date: 'Jul 21, 2026',
    summary: 'New side-by-side compare tool and refreshed 2026 rankings. Candy AI holds #1 overall.',
    type: 'roundup',
    badge: 'Roundup',
  },
  {
    id: 'candy-retest',
    title: 'Candy AI retested',
    href: '/best/ai-girlfriend#pick-candy-ai',
    image: aiGirlfriendRoundup.picks[0].gallery[0].full,
    imageAlt: 'Candy AI retest',
    date: 'Jun 28, 2026',
    summary: 'Major memory upgrade in v4.2 — chat reliability improved after a two-week retest.',
    score: 9.3,
    scoreDelta: 0.5,
    type: 'retest',
    badge: 'Retest',
  },
];

export const featuredGuides: HomeGuide[] = [
  {
    id: 'best-2026',
    title: 'Best AI Girlfriend Apps in 2026',
    excerpt: 'Our ranked list of the eight apps that survived 30+ days of hands-on testing.',
    href: '/best/ai-girlfriend',
    image: aiGirlfriendRoundup.featuredImage,
    imageAlt: 'Best AI girlfriend apps roundup',
    date: 'Jul 21, 2026',
    type: 'roundup',
  },
  {
    id: 'aura-review',
    title: 'Aura AI Review — Full Breakdown',
    excerpt: 'Eight category scores, safety audit, and video generation deep dive from our lead reviewer.',
    href: '/reviews/aura-ai',
    image: getProduct('aura-ai')?.gallery[0]?.full ?? aiGirlfriendRoundup.picks[3].gallery[0].full,
    imageAlt: 'Aura AI full review',
    date: 'Oct 25, 2024',
    type: 'guide',
  },
  {
    id: 'voice-compare',
    title: 'Kindroid vs Candy AI: Voice Quality',
    excerpt: 'Side-by-side voice call tests — latency, emotion, and realism scored with the same rubric.',
    href: '/best/ai-girlfriend#roundup-compare',
    image: aiGirlfriendRoundup.picks[1].gallery[0].full,
    imageAlt: 'Voice quality comparison',
    date: 'Jun 12, 2026',
    type: 'comparison',
  },
  {
    id: 'methodology',
    title: 'How We Score AI Companion Apps',
    excerpt: 'Transparent weights, measured evidence, and why we buy every plan ourselves.',
    href: '/tests/customization',
    image: aiGirlfriendRoundup.testing.videoPoster,
    imageAlt: 'Testing methodology',
    date: 'May 3, 2026',
    type: 'guide',
  },
];

export function getHomeSearchIndex(): SearchResult[] {
  return buildSearchIndex();
}

export const homeMeta = {
  title: 'AI Girlfriend Expert — Independent AI Companion Reviews',
  description:
    'We purchase, test, score, and compare AI girlfriend apps so you can choose with confidence. Browse 24+ tested apps, expert reviews, and side-by-side comparisons.',
  heroImage: aiGirlfriendRoundup.featuredImage,
  heroImageAlt: 'Editorial collage of AI companion apps tested by AI Girlfriend Expert',
};
