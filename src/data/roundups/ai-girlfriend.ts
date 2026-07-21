import type { Author, GalleryImage, RatingCategory, RatingChangelogEntry, Subscore } from '../products';
import { getProduct } from '../products';

const img = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const avatar = (id: number) => `https://i.pravatar.cc/80?img=${id}`;

export interface RoundupSubscore {
  name: string;
  score: number;
}

export interface RoundupCategoryScore {
  key: string;
  name: string;
  score: number;
  description: string;
  subscores?: RoundupSubscore[];
}

export interface RoundupSpec {
  label: string;
  value: string;
}

export interface RoundupPick {
  id: string;
  slug: string;
  name: string;
  logo: string;
  ribbon: string;
  ribbonKey: string;
  overallScore: number;
  overallSummary: string;
  priceMonthly: number;
  intro: string;
  gallery: GalleryImage[];
  categoryScores: RoundupCategoryScore[];
  specs: RoundupSpec[];
  pros: string[];
  cons: string[];
  ourTake: string;
  affiliateUrl: string;
  reviewUrl?: string;
}

export interface RoundupFaqItem {
  question: string;
  answer: string;
}

export interface RoundupConclusionAlternate {
  pickId: string;
  before: string;
  after: string;
}

export interface RoundupConclusion {
  eyebrow: string;
  heading: string;
  topPickId: string;
  lead: string;
  alternate?: RoundupConclusionAlternate;
  compareLabel: string;
}

export interface RoundupTestingStat {
  icon: string;
  title: string;
  subtitle?: string;
  lines?: string[];
}

export interface RoundupTesting {
  title: string;
  description: string;
  processHref: string;
  processLabel: string;
  videoPoster: string;
  videoSrc?: string;
  stats: RoundupTestingStat[];
}

export interface RoundupSelectionPillar {
  icon: string;
  title: string;
  description: string;
}

export interface RoundupSelection {
  eyebrow: string;
  title: string;
  description: string;
  pillars: RoundupSelectionPillar[];
  processHref: string;
  processLabel: string;
}

export interface Roundup {
  slug: string;
  title: string;
  titleYear: number;
  featuredImage: string;
  featuredImageAlt: string;
  metaDescription: string;
  reviewedDate: string;
  modifiedDate: string;
  methodology: string;
  authors: Author[];
  intro: string;
  testing: RoundupTesting;
  selection: RoundupSelection;
  picks: RoundupPick[];
  quickHeading: string;
  picksHeading: string;
  compareDefaultIds: [string, string, string];
  changelog: RatingChangelogEntry[];
  faq: RoundupFaqItem[];
  conclusion: RoundupConclusion;
  tocSections: { id: string; label: string; level?: 2 | 3 }[];
}

/** Same eight categories and order as full product reviews. */
export const ROUNDUP_CATEGORY_KEYS = [
  'characters',
  'customization',
  'chat',
  'chat-features',
  'images',
  'video',
  'privacy',
  'pricing',
] as const;

export const ROUNDUP_CATEGORY_NAMES: Record<(typeof ROUNDUP_CATEGORY_KEYS)[number], string> = {
  characters: 'Characters',
  customization: 'Customization',
  chat: 'Chat',
  'chat-features': 'Chat Features',
  images: 'Images',
  video: 'Video',
  privacy: 'Privacy',
  pricing: 'Price',
};

const categoryWeights: Record<string, number> = {
  characters: 10,
  customization: 15,
  chat: 20,
  'chat-features': 10,
  images: 15,
  video: 10,
  privacy: 10,
  pricing: 10,
};

const defaultSubscores: Record<string, [string, string, string]> = {
  characters: ['Variety', 'Discovery', 'Quality'],
  customization: ['Appearance', 'Personality', 'Control'],
  chat: ['Understanding', 'Realism', 'Reliability'],
  'chat-features': ['Media', 'Voice & calls', 'Memory'],
  images: ['Quality', 'Consistency', 'Speed'],
  video: ['Quality', 'Capabilities', 'Ease of use'],
  privacy: ['Data use', 'User control', 'Security'],
  pricing: ['Subscription', 'Extra costs', 'Value'],
};

function mockSubscores(key: string, score: number): RoundupSubscore[] {
  const names = defaultSubscores[key] ?? ['Factor 1', 'Factor 2', 'Factor 3'];
  return names.map((name, i) => ({
    name,
    score: Math.min(10, Math.max(0, Math.round((score + (i - 1) * 0.3) * 10) / 10)),
  }));
}

/** Build a RatingCategory for tooltip reuse on roundup pages. */
export function toRatingCategory(score: RoundupCategoryScore, productSlug?: string): RatingCategory {
  const product = productSlug ? getProduct(productSlug) : undefined;
  const full = product?.categories.find((c) => c.key === score.key);
  if (full) {
    return { ...full, score: score.score };
  }

  const weight = categoryWeights[score.key] ?? 12;
  const subs: Subscore[] = (score.subscores ?? mockSubscores(score.key, score.score)).map((sub, i) => ({
    name: sub.name,
    score: sub.score,
    weight: i === 0 ? 34 : i === 1 ? 33 : 33,
    description: '',
    contributors: [],
  }));

  return {
    key: score.key,
    name: score.name,
    score: score.score,
    weight,
    description: score.description,
    subscores: subs,
    evidence: [],
    proof: [],
    whatThisMeans: score.description,
  };
}

const categoryDescriptions: Record<string, string> = {
  characters: 'Measures the platform\'s ready-made character library.',
  customization: 'How deeply you can shape appearance, personality, and backstory.',
  chat: 'Measures the quality of the actual conversation.',
  'chat-features': 'Voice, calls, memory, and advanced chat capabilities.',
  images: 'Quality, consistency, and speed of AI-generated images.',
  video: 'Video generation quality and availability.',
  privacy: 'Data handling, billing discretion, and account controls.',
  pricing: 'Value for money across free and paid tiers.',
};

function scores(
  characters: number,
  customization: number,
  chat: number,
  chatFeatures: number,
  images: number,
  video: number,
  privacy: number,
  pricing: number,
): RoundupCategoryScore[] {
  const values = [characters, customization, chat, chatFeatures, images, video, privacy, pricing];
  return ROUNDUP_CATEGORY_KEYS.map((key, i) => ({
    key,
    name: ROUNDUP_CATEGORY_NAMES[key],
    score: values[i],
    description: categoryDescriptions[key],
    subscores: mockSubscores(key, values[i]),
  }));
}

function scoresFromProduct(slug: string): RoundupCategoryScore[] | null {
  const product = getProduct(slug);
  if (!product) return null;
  const mapped = ROUNDUP_CATEGORY_KEYS.map((key) => {
    const c = product.categories.find((cat) => cat.key === key);
    if (!c) return null;
    return {
      key: c.key,
      name: c.key === 'pricing' ? 'Price' : c.name,
      score: c.score,
      description: c.description,
      subscores: c.subscores.map((s) => ({ name: s.name, score: s.score })),
    };
  });
  if (mapped.some((m) => m === null)) return null;
  return mapped as RoundupCategoryScore[];
}

function gallery(seed: string): GalleryImage[] {
  return [
    { full: img(`${seed}-1`, 960, 640), thumb: img(`${seed}-1t`, 320, 213), alt: `${seed} screenshot 1` },
    { full: img(`${seed}-2`, 960, 640), thumb: img(`${seed}-2t`, 320, 213), alt: `${seed} screenshot 2` },
    { full: img(`${seed}-3`, 960, 640), thumb: img(`${seed}-3t`, 320, 213), alt: `${seed} screenshot 3` },
  ];
}

const aura = getProduct('aura-ai');

const picks: RoundupPick[] = [
  {
    id: 'candy-ai',
    slug: 'candy-ai',
    name: 'Candy AI',
    logo: img('candy-logo', 128, 128),
    ribbon: 'Best Overall',
    ribbonKey: 'overall',
    overallScore: 9.3,
    overallSummary: 'Top-rated all-rounder for chat, images, and customization in 2026.',
    priceMonthly: 12.99,
    intro:
      'Candy AI leads our 2026 roundup with the most balanced mix of chat realism, image quality, and customization — the safest default if you want one app that does everything well.',
    gallery: gallery('candy'),
    categoryScores: scores(9.3, 9.1, 9.4, 9.0, 9.2, 8.6, 8.8, 8.5),
    specs: [
      { label: 'Starting price', value: '$12.99 / mo' },
      { label: 'Free tier', value: 'Limited messages' },
      { label: 'Voice calls', value: 'Yes' },
      { label: 'NSFW', value: 'Yes' },
      { label: 'Memory', value: 'Long-term' },
      { label: 'Platforms', value: 'Web, iOS' },
    ],
    pros: ['Incredibly natural conversations', 'Strong character customization', 'Fast, consistent image generation'],
    cons: ['Premium features locked behind higher tiers', 'No native Android app yet'],
    ourTake:
      'Candy AI is the app we recommend when someone asks for a single best AI girlfriend in 2026. It rarely tops every individual category, but it avoids weak spots better than any rival.',
    affiliateUrl: 'https://example.com/go/candy-ai',
  },
  {
    id: 'kindroid',
    slug: 'kindroid',
    name: 'Kindroid',
    logo: img('kindroid-logo', 128, 128),
    ribbon: 'Best for Voice',
    ribbonKey: 'voice',
    overallScore: 9.1,
    overallSummary: 'Best pick for voice quality and realistic phone-call companionship.',
    priceMonthly: 13.99,
    intro:
      'Kindroid stands out for voice quality and phone-call realism — if spoken conversation matters more than images, start here.',
    gallery: gallery('kindroid'),
    categoryScores: scores(7.8, 8.4, 9.3, 9.6, 8.0, 7.8, 9.0, 7.9),
    specs: [
      { label: 'Starting price', value: '$13.99 / mo' },
      { label: 'Free tier', value: 'Trial only' },
      { label: 'Voice calls', value: 'Yes · best-in-class' },
      { label: 'NSFW', value: 'Yes' },
      { label: 'Memory', value: 'Persistent' },
      { label: 'Platforms', value: 'Web, Android' },
    ],
    pros: ['Best-in-class voice and phone calls', 'Emotionally responsive TTS', 'Strong privacy defaults'],
    cons: ['Image generation lags top rivals', 'Smaller preset character library'],
    ourTake:
      'Kindroid feels closest to talking to a real person over the phone. Voice-first users should prioritize it over flashier image-heavy apps.',
    affiliateUrl: 'https://example.com/go/kindroid',
  },
  {
    id: 'crushon-ai',
    slug: 'crushon-ai',
    name: 'CrushOn AI',
    logo: img('crushon-logo', 128, 128),
    ribbon: 'Best for Roleplay',
    ribbonKey: 'roleplay',
    overallScore: 8.9,
    overallSummary: 'Strong roleplay depth with a large community character library.',
    priceMonthly: 9.99,
    intro:
      'CrushOn AI excels at long-form roleplay, scenario depth, and community-created characters — ideal for story-driven sessions.',
    gallery: gallery('crushon'),
    categoryScores: scores(9.2, 8.8, 9.1, 8.7, 8.5, 7.5, 8.2, 9.1),
    specs: [
      { label: 'Starting price', value: '$9.99 / mo' },
      { label: 'Free tier', value: 'Generous daily credits' },
      { label: 'Voice calls', value: 'No' },
      { label: 'NSFW', value: 'Yes' },
      { label: 'Memory', value: 'Scenario-aware' },
      { label: 'Platforms', value: 'Web' },
    ],
    pros: ['Deep scenario and RP tools', 'Huge community character library', 'Strong value on lower tiers'],
    cons: ['No voice or video calling', 'UI feels dated compared to premium rivals'],
    ourTake:
      'If your sessions run long and plot-heavy, CrushOn AI keeps context better than most apps at this price. It is our go-to RP pick even when it is not the prettiest interface.',
    affiliateUrl: 'https://example.com/go/crushon-ai',
  },
  {
    id: 'aura-ai',
    slug: 'aura-ai',
    name: 'Aura AI',
    logo: img('aura-logo', 128, 128),
    ribbon: 'Best for Video',
    ribbonKey: 'video',
    overallScore: aura?.overallScore ?? 8.9,
    overallSummary: aura?.overallSummary ?? 'Industry-leading video generation with strong chat and character variety.',
    priceMonthly: 12.99,
    intro:
      'Aura AI delivers the strongest video generation and media pipeline in our tests — best when photos and short clips are part of the experience.',
    gallery: aura?.gallery.slice(0, 3) ?? gallery('aura'),
    categoryScores: scoresFromProduct('aura-ai') ?? scores(9.1, 8.9, 9.1, 9.4, 8.7, 9.2, 8.0, 8.5),
    specs: [
      { label: 'Starting price', value: '$12.99 / mo' },
      { label: 'Free tier', value: 'Limited' },
      { label: 'Voice calls', value: 'Yes' },
      { label: 'Video gen', value: 'Yes · industry-leading' },
      { label: 'Memory', value: 'Long-term' },
      { label: 'Platforms', value: 'Web, iOS' },
    ],
    pros: ['Best video generation in our tests', 'Large character library', 'Realistic chat with strong memory'],
    cons: ['Image generation slower than Candy AI', 'Premium tier required for best video quality'],
    ourTake: aura?.ourTake ?? 'Aura AI remains a top-tier pick when media quality matters as much as conversation.',
    affiliateUrl: aura?.affiliateUrl ?? 'https://example.com/go/aura-ai',
    reviewUrl: '/reviews/aura-ai',
  },
  {
    id: 'dreamgf',
    slug: 'dreamgf',
    name: 'DreamGF',
    logo: img('dreamgf-logo', 128, 128),
    ribbon: 'Best for Images',
    ribbonKey: 'images',
    overallScore: 8.7,
    overallSummary: 'Visual-first pick with excellent image quality and consistency.',
    priceMonthly: 11.99,
    intro:
      'DreamGF prioritizes visual fidelity — character portraits and scene images look sharper and more consistent than most competitors.',
    gallery: gallery('dreamgf'),
    categoryScores: scores(7.6, 8.5, 7.8, 7.9, 9.4, 8.0, 8.0, 8.3),
    specs: [
      { label: 'Starting price', value: '$11.99 / mo' },
      { label: 'Free tier', value: 'Daily images' },
      { label: 'Voice calls', value: 'Limited' },
      { label: 'NSFW', value: 'Yes' },
      { label: 'Memory', value: 'Standard' },
      { label: 'Platforms', value: 'Web' },
    ],
    pros: ['Excellent image quality and consistency', 'Fast generation times', 'Solid appearance customization'],
    cons: ['Chat feels less natural than top picks', 'Video features still maturing'],
    ourTake:
      'DreamGF is the visual-first choice. Users who care most about how their companion looks in photos will notice the gap immediately versus chat-first apps.',
    affiliateUrl: 'https://example.com/go/dreamgf',
  },
  {
    id: 'replika',
    slug: 'replika',
    name: 'Replika',
    logo: img('replika-logo', 128, 128),
    ribbon: 'Best for Privacy',
    ribbonKey: 'privacy',
    overallScore: 8.5,
    overallSummary: 'Most mature privacy controls and clearest data policies in the category.',
    priceMonthly: 19.99,
    intro:
      'Replika offers the most mature privacy controls and the clearest data policies — a safer pick for users who want discretion and transparency.',
    gallery: gallery('replika'),
    categoryScores: scores(8.0, 7.8, 8.5, 8.2, 7.5, 6.8, 9.5, 6.5),
    specs: [
      { label: 'Starting price', value: '$19.99 / mo' },
      { label: 'Free tier', value: 'Basic chat' },
      { label: 'Voice calls', value: 'Yes' },
      { label: 'NSFW', value: 'Limited / opt-in' },
      { label: 'Memory', value: 'Long-term' },
      { label: 'Platforms', value: 'Web, iOS, Android' },
    ],
    pros: ['Industry-leading privacy controls', 'Discreet billing options', 'Available on all major platforms'],
    cons: ['Higher monthly price', 'NSFW and image features more restricted'],
    ourTake:
      'Replika is not always the most exciting companion app, but it is the one we trust most when privacy and billing discretion are non-negotiable.',
    affiliateUrl: 'https://example.com/go/replika',
  },
  {
    id: 'character-ai',
    slug: 'character-ai',
    name: 'Character.AI',
    logo: img('cai-logo', 128, 128),
    ribbon: 'Best Free Option',
    ribbonKey: 'free',
    overallScore: 8.2,
    overallSummary: 'Best free entry point with a huge community and responsive chat.',
    priceMonthly: 0,
    intro:
      'Character.AI offers the strongest free experience in the category — a practical starting point before upgrading to a dedicated AI girlfriend app.',
    gallery: gallery('cai'),
    categoryScores: scores(9.5, 8.0, 8.2, 7.8, 6.5, 5.0, 8.8, 9.8),
    specs: [
      { label: 'Starting price', value: 'Free' },
      { label: 'Free tier', value: 'Generous' },
      { label: 'Voice calls', value: 'Beta' },
      { label: 'NSFW', value: 'Filtered' },
      { label: 'Memory', value: 'Session-based' },
      { label: 'Platforms', value: 'Web, iOS, Android' },
    ],
    pros: ['Best free tier in the category', 'Massive character community', 'Fast, responsive chat'],
    cons: ['Strict SFW filters', 'No dedicated romance / NSFW features'],
    ourTake:
      'Character.AI is the right zero-cost entry point. Power users will outgrow it, but it is unbeatable for testing whether AI companionship fits your routine.',
    affiliateUrl: 'https://example.com/go/character-ai',
  },
  {
    id: 'nectar-ai',
    slug: 'nectar-ai',
    name: 'Nectar AI',
    logo: img('nectar-logo', 128, 128),
    ribbon: 'Best Value',
    ribbonKey: 'value',
    overallScore: 8.4,
    overallSummary: 'Best value pick — premium-style features at a lower monthly price.',
    priceMonthly: 7.99,
    intro:
      'Nectar AI packs surprising depth into a lower price — the best value pick if you want premium-style features without a premium subscription.',
    gallery: gallery('nectar'),
    categoryScores: scores(7.5, 8.2, 8.0, 8.0, 8.1, 7.2, 8.3, 9.3),
    specs: [
      { label: 'Starting price', value: '$7.99 / mo' },
      { label: 'Free tier', value: 'Yes' },
      { label: 'Voice calls', value: 'No' },
      { label: 'NSFW', value: 'Yes' },
      { label: 'Memory', value: 'Standard' },
      { label: 'Platforms', value: 'Web' },
    ],
    pros: ['Lowest price among our finalists', 'Solid customization for the cost', 'Good image quality per dollar'],
    cons: ['No voice or video calling', 'Smaller team means slower feature updates'],
    ourTake:
      'Nectar AI proves you do not need to spend $15+/mo for a capable AI girlfriend. It is the budget-conscious pick that still feels premium enough for daily use.',
    affiliateUrl: 'https://example.com/go/nectar-ai',
  },
];

export const aiGirlfriendRoundup: Roundup = {
  slug: 'ai-girlfriend',
  title: 'Best AI Girlfriend Apps',
  titleYear: 2026,
  featuredImage: img('roundup-ai-gf-hero', 1600, 640),
  featuredImageAlt: 'Collage of top AI girlfriend app interfaces tested in 2026',
  metaDescription:
    'We tested and ranked the best AI girlfriend apps of 2026. Compare conversation quality, customization, images, privacy, and pricing — updated by independent reviewers.',
  reviewedDate: 'Jan 15, 2026',
  modifiedDate: 'Jul 21, 2026',
  methodology: 'Methodology v3.0',
  authors: [
    {
      name: 'Herman Carter',
      role: 'Lead Reviewer',
      avatar: '/brand/herman-main-icon.svg',
      verified: true,
      slug: 'herman-carter',
    },
    { name: 'Sarah Jenkins', role: 'Fact-Checker', avatar: avatar(45), verified: true },
  ],
  intro:
    'The best AI girlfriend app in 2026 is Candy AI — it balances natural conversation, strong customization, and reliable image generation better than any rival we tested. If you want voice-first companionship, choose Kindroid; for roleplay depth, pick CrushOn AI; for video and media, go with Aura AI. Below we rank every finalist with the same scoring system we use in our full reviews, so you can compare apps on customization, chat features, images, video, privacy, and price before you commit.',
  testing: {
    title: 'How We Test AI Girlfriend Apps',
    description:
      'We purchase every plan, run real conversations for weeks, and score each app with the same eight-category framework we use in our full reviews — so rankings reflect hands-on testing, not marketing pages.',
    processHref: '/tests/customization',
    processLabel: 'See our full testing process',
    videoPoster: img('roundup-testing-lab', 1280, 720),
    stats: [
      { icon: 'grid_view', title: '24 apps', subtitle: 'Tested in this roundup cycle' },
      { icon: 'calendar_today', title: '30+ days', subtitle: 'Minimum hands-on per finalist' },
      { icon: 'payments', title: '100% paid', subtitle: 'Accounts we purchased ourselves' },
      {
        icon: 'verified_user',
        title: 'No shortcuts',
        lines: ['No free trials · No sponsorships', 'Real bots · Real testers'],
      },
    ],
  },
  selection: {
    eyebrow: 'Ranking process',
    title: 'How we selected the winners',
    description:
      'This list opens with the highest overall scores from our testing — the fairest default when you are comparing eight apps at once. But “best AI girlfriend” is a broad search. You might care more about images, video, voice, roleplay, privacy, or price. Use the Sort control in the sidebar (or the icons above the full rankings on mobile) to re-order picks for your use case without changing our underlying scores.',
    pillars: [
      {
        icon: 'emoji_events',
        title: 'Overall performance',
        description: 'Weighted score across customization, chat, images, video, privacy, and price — the default ranking you see first.',
      },
      {
        icon: 'track_changes',
        title: 'Best for a specific use',
        description: 'Re-sort by voice, roleplay, video, images, privacy, value, or free tier when one strength matters more than the rest.',
      },
      {
        icon: 'balance',
        title: 'Hands-on judgement',
        description: 'Ribbons and final order still reflect deal-breakers, long-term usability, and limits you will not see in a single number.',
      },
    ],
    processHref: '/tests/customization',
    processLabel: 'See our full selection process',
  },
  quickHeading: 'Quick overview',
  picksHeading: 'Our 8 Best AI Girlfriend Apps',
  compareDefaultIds: ['candy-ai', 'kindroid', 'crushon-ai'],
  changelog: [
    {
      date: 'Jul 21, 2026',
      title: 'Added interactive comparison table and refreshed rankings',
      summary: 'New side-by-side compare tool; Candy AI holds #1 overall.',
      type: 'data',
    },
    {
      date: 'Jun 12, 2026',
      title: 'Aura AI video scores updated after v2 launch',
      summary: 'Video category weighting unchanged; Aura AI gains +0.4 in video.',
      type: 'score',
    },
    {
      date: 'May 3, 2026',
      title: 'Methodology v3.0 applied to all picks',
      summary: 'Privacy and pricing subscores recalculated across the list.',
      type: 'methodology',
    },
  ],
  faq: [
    {
      question: 'What is the best AI girlfriend app in 2026?',
      answer:
        'Candy AI is our top overall pick — it balances chat quality, customization, and image generation better than any rival we tested. Your best choice depends on priorities: Kindroid for voice, CrushOn AI for roleplay, Aura AI for video.',
    },
    {
      question: 'Are AI girlfriend apps safe and private?',
      answer:
        'Privacy varies widely. Replika and Candy AI offer the clearest data policies in our tests. Always read each app\'s privacy settings, avoid sharing real personal details, and use a dedicated email where possible.',
    },
    {
      question: 'Do I need to pay for a good AI girlfriend experience?',
      answer:
        'Character.AI and Nectar AI offer usable free tiers. Premium apps ($8–$20/mo) unlock voice, NSFW content, better memory, and faster image generation. Free tiers are fine for trying the category; daily users will want a paid plan.',
    },
    {
      question: 'How do you score and rank these apps?',
      answer:
        'We use the same six-category framework as our full reviews: character customization, chat features, images, video, privacy, and price. Overall scores are weighted averages — never paid placements.',
    },
    {
      question: 'Can I switch apps after starting with one?',
      answer:
        'Yes. Most apps let you export or recreate characters manually. Memory and conversation history usually do not transfer, so expect a fresh start when switching.',
    },
  ],
  conclusion: {
    eyebrow: 'Final recommendation',
    heading: 'Our verdict after testing every finalist',
    topPickId: 'candy-ai',
    lead:
      'It balances chat realism, customization depth, and image quality better than any rival we tested — the safest default if you want one subscription that covers the basics well.',
    alternate: {
      pickId: 'kindroid',
      before: 'If voice quality and phone-call companionship matter more than images,',
      after: 'is our strongest alternative — it leads our lineup on chat features and privacy, even when it is not the flashiest pick overall.',
    },
    compareLabel: 'Compare top 3 apps',
  },
  picks,
  tocSections: [
    { id: 'roundup-testing', label: 'How we test', level: 2 },
    { id: 'roundup-quick-picks', label: 'Quick overview', level: 2 },
    { id: 'roundup-selection', label: 'How we rank', level: 2 },
    { id: 'roundup-detailed-picks', label: 'Full rankings', level: 2 },
    { id: 'roundup-compare', label: 'Compare apps', level: 2 },
    { id: 'roundup-faq', label: 'FAQ', level: 2 },
    { id: 'roundup-conclusion', label: 'Our verdict', level: 2 },
    ...picks.map((p) => ({ id: `pick-${p.id}`, label: p.name, level: 3 as const })),
  ],
};

export function getRoundupSortScore(pick: RoundupPick, sortKey: string): number {
  if (sortKey === 'overall') return pick.overallScore;
  if (sortKey === 'price-asc') return -pick.priceMonthly;
  if (sortKey === 'price-desc') return pick.priceMonthly;
  const categoryMap: Record<string, string> = {
    voice: 'chat-features',
    roleplay: 'chat-features',
    video: 'video',
    images: 'images',
    privacy: 'privacy',
    value: 'pricing',
    free: 'pricing',
  };
  const catKey = categoryMap[sortKey] ?? sortKey;
  const cat = pick.categoryScores.find((c) => c.key === catKey);
  return cat?.score ?? pick.overallScore;
}
