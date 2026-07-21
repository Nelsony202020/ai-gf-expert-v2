import type { RoundupPick } from './roundups/ai-girlfriend';
import { aiGirlfriendRoundup } from './roundups/ai-girlfriend';
import { getProduct } from './products';
import { buildSearchIndex, type SearchResult } from './site-search';

export interface HomeExplorerApp extends RoundupPick {
  filters: string[];
  highlightScores: { label: string; score: number }[];
  priceLabel: string;
  hasReview: boolean;
}

export interface HomeFilterGroup {
  id: string;
  title: string;
  options: { id: string; label: string }[];
}

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

export const explorerFilterGroups: HomeFilterGroup[] = [
  {
    id: 'experience',
    title: 'Experience',
    options: [
      { id: 'chat', label: 'Chat' },
      { id: 'roleplay', label: 'Roleplay' },
      { id: 'images', label: 'Images' },
      { id: 'video', label: 'Video' },
      { id: 'voice', label: 'Voice calls' },
      { id: 'memory', label: 'Long-term memory' },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing',
    options: [
      { id: 'free', label: 'Free plan' },
      { id: 'under-15', label: 'Under $15/mo' },
      { id: '15-25', label: '$15–$25/mo' },
      { id: 'over-25', label: 'Over $25/mo' },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    options: [
      { id: 'nsfw', label: 'NSFW support' },
      { id: 'mobile', label: 'Mobile app' },
      { id: 'custom', label: 'Custom characters' },
      { id: 'voice-messages', label: 'Voice messages' },
    ],
  },
];

function scoreFor(pick: RoundupPick, key: string): number {
  return pick.categoryScores.find((c) => c.key === key)?.score ?? pick.overallScore;
}

function buildFilters(pick: RoundupPick): string[] {
  const filters = new Set<string>(['chat', 'custom']);
  const specText = pick.specs.map((s) => `${s.label} ${s.value}`).join(' ').toLowerCase();

  if (pick.ribbonKey === 'roleplay' || specText.includes('roleplay') || specText.includes('rp')) {
    filters.add('roleplay');
  }
  if (scoreFor(pick, 'images') >= 8) filters.add('images');
  if (scoreFor(pick, 'video') >= 7.5 || specText.includes('video')) filters.add('video');
  if (specText.includes('voice') || pick.ribbonKey === 'voice') filters.add('voice');
  if (specText.includes('memory') || specText.includes('persistent') || specText.includes('long-term')) {
    filters.add('memory');
  }
  if (specText.includes('nsfw') && !specText.includes('filtered') && !specText.includes('limited / opt-in')) {
    filters.add('nsfw');
  }
  if (specText.includes('ios') || specText.includes('android')) filters.add('mobile');
  if (specText.includes('voice') && !specText.includes('no')) filters.add('voice-messages');

  if (pick.priceMonthly <= 0) filters.add('free');
  else if (pick.priceMonthly < 15) filters.add('under-15');
  else if (pick.priceMonthly <= 25) filters.add('15-25');
  else filters.add('over-25');

  return [...filters];
}

function priceLabel(pick: RoundupPick): string {
  if (pick.priceMonthly <= 0) return 'Free';
  return `From $${pick.priceMonthly.toFixed(2)} / mo`;
}

export function buildExplorerApps(): HomeExplorerApp[] {
  return aiGirlfriendRoundup.picks.map((pick) => ({
    ...pick,
    reviewUrl: pick.reviewUrl ?? (getProduct(pick.slug) ? `/reviews/${pick.slug}` : undefined),
    hasReview: Boolean(pick.reviewUrl ?? getProduct(pick.slug)),
    filters: buildFilters(pick),
    highlightScores: [
      { label: 'Chat', score: scoreFor(pick, 'chat') },
      { label: 'Images', score: scoreFor(pick, 'images') },
      { label: 'Customization', score: scoreFor(pick, 'customization') },
    ],
    priceLabel: priceLabel(pick),
  }));
}

export const topPicks = aiGirlfriendRoundup.picks.slice(0, 5);

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
