import type { Author, GalleryImage, RatingCategory, RatingChangelogEntry, Subscore } from '../products';
import { getProduct } from '../products';
import type { ProductAwardBadge } from '../../lib/awards/compute';

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

/** Rich tooltip for pricing estimates on roundup cards. */
export interface AtGlanceTooltip {
  title: string;
  amount: string;
  description: string;
  breakdown?: string[];
  pricingHref: string;
}

/** One scannable stat in the roundup at-a-glance grids. */
export interface AtGlanceStat {
  id: string;
  icon: string;
  label: string;
  value: string;
  tooltip?: AtGlanceTooltip;
}

export interface AtGlanceData {
  features: AtGlanceStat[];
  pricing: AtGlanceStat[];
}

export interface RoundupPick {
  id: string;
  slug: string;
  name: string;
  logo: string;
  ribbon: string;
  ribbonKey: string;
  /** Computed editorial awards from central score logic. */
  awards?: ProductAwardBadge[];
  overallScore: number;
  overallSummary: string;
  priceMonthly: number;
  intro: string;
  gallery: GalleryImage[];
  categoryScores: RoundupCategoryScore[];
  specs: RoundupSpec[];
  /** Structured feature + pricing stats — hydrated from product + pricing data. */
  atGlance?: AtGlanceData;
  pros: string[];
  cons: string[];
  ourTake: string;
  affiliateUrl: string;
  reviewUrl?: string;
}

export interface RoundupFaqItem {
  question: string;
  answer: string;
  /** Optional bullet list rendered between the answer intro and answerAfter. */
  answerList?: string[];
  /** Optional closing paragraph after answerList. */
  answerAfter?: string;
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
  /** Rich paragraphs — wrap product names in **double asterisks** for pick links. */
  paragraphs: string[];
  compareLabel: string;
  /** @deprecated Use paragraphs instead */
  lead?: string;
  /** @deprecated Use paragraphs instead */
  alternate?: RoundupConclusionAlternate;
}

export interface RoundupTestingStat {
  icon: string;
  title: string;
  subtitle?: string;
  lines?: string[];
}

export interface RoundupTesting {
  eyebrow: string;
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
  bridge: string;
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
  pricing: ['Subscription', 'Free trial', 'Pay-as-you-go', 'Value'],
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

function gallery(seed: string): GalleryImage[] {
  return [
    { full: img(`${seed}-1`, 960, 640), thumb: img(`${seed}-1t`, 320, 213), alt: `${seed} screenshot 1` },
    { full: img(`${seed}-2`, 960, 640), thumb: img(`${seed}-2t`, 320, 213), alt: `${seed} screenshot 2` },
    { full: img(`${seed}-3`, 960, 640), thumb: img(`${seed}-3t`, 320, 213), alt: `${seed} screenshot 3` },
  ];
}

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
    reviewUrl: '/reviews/candy-ai/',
  },
  {
    id: 'ourdream-ai',
    slug: 'ourdream-ai',
    name: 'OurDream AI',
    logo: img('ourdream-logo', 128, 128),
    ribbon: 'Best for Media',
    ribbonKey: 'video',
    overallScore: 8.8,
    overallSummary: 'Feature-rich platform with strong scores across chat, images, and video.',
    priceMonthly: 19.99,
    intro:
      'OurDream AI packs a wide feature set into one subscription — a strong pick when you want chat, images, and video in a single app.',
    gallery: gallery('ourdream'),
    categoryScores: scores(8.5, 8.6, 8.7, 8.8, 8.9, 9.0, 8.4, 8.0),
    specs: [
      { label: 'Starting price', value: '$19.99 / mo' },
      { label: 'Free tier', value: 'Limited' },
      { label: 'Voice calls', value: 'Yes' },
      { label: 'Video gen', value: 'Yes' },
      { label: 'Memory', value: 'Long-term' },
      { label: 'Platforms', value: 'Web' },
    ],
    pros: [
      'High quality AI porn',
      'NSFW videos with audio',
      'Fast image generator',
      'Diverse AI girlfriends',
      'Discreet Billing',
    ],
    cons: ['Some negative press'],
    ourTake:
      'OurDream AI scored very well across all categories in our tests — one of the most complete platforms in the category.',
    affiliateUrl: 'https://example.com/go/ourdream-ai',
    reviewUrl: '/reviews/ourdream-ai/',
  },
  {
    id: 'girlfriendgpt',
    slug: 'girlfriendgpt',
    name: 'GirlfriendGPT',
    logo: img('girlfriendgpt-logo', 128, 128),
    ribbon: 'Best for Roleplay',
    ribbonKey: 'roleplay',
    overallScore: 7.7,
    overallSummary: 'One of the best adult roleplay experiences we have tested.',
    priceMonthly: 15.0,
    intro:
      'GirlfriendGPT is built for long-form roleplay and adult scenarios — the standout pick when conversation depth matters most.',
    gallery: gallery('girlfriendgpt'),
    categoryScores: scores(8.0, 7.8, 8.5, 8.2, 7.5, 6.8, 7.8, 7.6),
    specs: [
      { label: 'Starting price', value: '$15.00 / mo' },
      { label: 'Free tier', value: 'Limited' },
      { label: 'Voice calls', value: 'No' },
      { label: 'NSFW', value: 'Yes' },
      { label: 'Memory', value: 'Scenario-aware' },
      { label: 'Platforms', value: 'Web' },
    ],
    pros: ['Excellent adult roleplay', 'Deep scenario support', 'Active community'],
    cons: ['Image quality trails top picks', 'No voice or video calling'],
    ourTake:
      'GirlfriendGPT offers one of the best adult roleplay experiences we have tested — ideal for story-driven sessions.',
    affiliateUrl: 'https://example.com/go/girlfriendgpt',
    reviewUrl: '/reviews/girlfriendgpt/',
  },
];

const fileRoundup: Roundup = {
  slug: 'ai-girlfriend',
  title: 'Best AI Girlfriend Apps',
  titleYear: 2026,
  featuredImage: '/brand/herman-youtube-review.png',
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
  ],
  intro:
    'OurDream AI is the best AI girlfriend app of 2026. It scored extremely well for its character library, with tons of unique AI girlfriends that have different backgrounds and personalities. It also scored really well in customization because you can build your own AI girlfriend from head to toe with very few restrictions. Both the image and video generators are surprisingly good: fast, realistic, and capable of fully uncensored content like nudes and even AI porn. The price is similar to direct competitors like Candy AI, but you get a lot more images and videos, making it a much better choice.',
  testing: {
    eyebrow: 'Testing process',
    title: 'How We Test AI Girlfriend Apps',
    description:
      'We purchase the cheapest monthly subscription for every AI girlfriend app and score each platform across the same 8 categories used in our full AI girlfriend reviews. Our rankings are based on real, hands-on, data-driven testing—not marketing pages.',
    processHref: '/test/',
    processLabel: 'Full testing process',
    videoPoster: '/brand/herman-youtube-review.png',
    stats: [
      { icon: 'grid_view', title: '24 apps', subtitle: 'Tested in this roundup cycle' },
      { icon: 'calendar_today', title: '30+ days', subtitle: 'Minimum hands-on per finalist' },
      { icon: 'payments', title: '100% paid', subtitle: 'Accounts we purchased ourselves' },
      {
        icon: 'balance',
        title: 'Same test for every app',
        lines: ['No sponsored scores or paid rankings'],
      },
    ],
  },
  selection: {
    eyebrow: 'Ranking process',
    title: 'How We Select the Winners',
    description:
      'We don\u2019t pick winners based on which app pays the most or has the best marketing. Every app goes through the same testing system first. We then use those results to rank the apps overall and find the best options for specific types of users.',
    bridge:
      'Testing gives us the scores. Then we use those results to decide which apps deserve the top spots and our Best For awards.',
    pillars: [
      {
        icon: 'checklist',
        title: 'Overall score',
        description:
          'Every app gets the same 8-category test. Its weighted overall score decides the default ranking.',
      },
      {
        icon: 'center_focus_strong',
        title: 'Best for specific uses',
        description:
          'We look at individual test results to find standouts for things like roleplay, images, video, privacy, and price.',
      },
      {
        icon: 'fact_check',
        title: 'Final hands-on check',
        description:
          'Before we give an award, we check for deal-breakers we noticed during real use, like aggressive token costs, missing features, or poor long-term usability.',
      },
    ],
    processHref: '/test/customization/',
    processLabel: 'Full selection process',
  },
  quickHeading: 'Quick overview',
  picksHeading: 'Our 3 Best AI Girlfriend Apps',
  compareDefaultIds: ['candy-ai', 'ourdream-ai', 'girlfriendgpt'],
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
      question: 'What is the best AI girlfriend app for NSFW content?',
      answer:
        '**OurDream AI** is the best AI girlfriend app we tested for NSFW content. It is especially good at generating realistic AI nudes and AI porn. It also has the best NSFW video generator we tested, allowing you to create AI porn videos up to 60 seconds long with audio.',
    },
    {
      question: 'Which AI girlfriend app has the best roleplay?',
      answer:
        '**OurDream AI** is our top choice for roleplay with realistic-style characters. If you prefer anime-style characters, **GirlfriendGPT** is the better choice. It has a huge range of characters and is especially good at longer, more detailed roleplay scenarios.',
    },
    {
      question: 'Which AI girlfriend app makes the best images and videos?',
      answer:
        '**OurDream AI** makes the best images and videos we tested. Its images scored highest for realism, overall quality, and prompt adherence, meaning the results actually look like what you asked for. It also has one of the strongest video generators, including support for longer NSFW videos with audio.',
    },
    {
      question: 'What is the cheapest AI girlfriend app to actually use?',
      answer:
        'It depends on which features you use. **Nectar AI** has the cheapest monthly subscription at just $9.99, but several features, including AI video generation, are locked behind more expensive plans.',
      answerAfter:
        '**OurDream AI** costs slightly more to get started at $13.99, but the subscription includes tokens and gives you access to all of its main features. That can make it cheaper in real use if you generate a lot of images and videos.',
    },
    {
      question: 'Are there any good free AI girlfriend apps?',
      answer:
        'Not really. Running a good AI girlfriend platform costs money, especially when you start generating images, videos, and voice messages. There isn\'t anyone out there spending a ton of money on AI models and servers just so you can use everything for free.',
      answerAfter:
        'Most apps have some kind of free tier, but the best AI girlfriend apps are paid services if you actually want to use all their features.',
    },
    {
      question: 'Are AI girlfriend chats private?',
      answer:
        'In general, yes, but it depends on the platform. Some AI girlfriend apps, such as **Candy AI**, may use chat data to help train and improve their AI. Candy AI lets you opt out of this in your profile settings.',
      answerAfter:
        'Also keep in mind that private does not mean you can do absolutely anything. Most AI girlfriend apps have community guidelines. If your account is flagged for breaking those rules, such as trying to generate illegal content, a real person may need to review the account or content before deciding whether to unblock it.',
    },
  ],
  conclusion: {
    eyebrow: 'Final recommendation',
    heading: 'Our verdict after testing every finalist',
    topPickId: 'ourdream-ai',
    paragraphs: [
      '**OurDream AI** is the best AI girlfriend app of 2026. It outperformed almost every other app we tested across the board, while still being cheaper than most of its competitors. It has a ton of features, but what really stands out is the NSFW content. You can generate high-quality images and videos, including videos with audio, which most AI girlfriend apps still don\'t offer.',
      'If you\'re more interested in anime-style characters and roleplay, I\'d go with **JuicyChat AI** or **GirlfriendGPT** instead. Both are much more focused on chatting, characters, and roleplay.',
    ],
    compareLabel: 'Compare top 3 apps',
  },
  picks,
  tocSections: [
    { id: 'roundup-quick-picks', label: 'Quick overview', level: 2 },
    { id: 'roundup-testing', label: 'How we test', level: 2 },
    { id: 'roundup-selection', label: 'How we rank', level: 2 },
    { id: 'roundup-detailed-picks', label: 'Full rankings', level: 2 },
    { id: 'roundup-compare', label: 'Compare apps', level: 2 },
    { id: 'roundup-faq', label: 'FAQ', level: 2 },
    { id: 'roundup-conclusion', label: 'Our verdict', level: 2 },
    ...picks.map((p) => ({ id: `pick-${p.id}`, label: p.name, level: 3 as const })),
  ],
};

// Static template — public pages must call loadRoundupForPublic().
export const fileAiGirlfriendRoundup: Roundup = fileRoundup;

/** @deprecated Template only; use loadRoundupForPublic for live pages. */
export const aiGirlfriendRoundup: Roundup = fileRoundup;

export function getRoundupSortScore(pick: RoundupPick, sortKey: string): number {
  if (sortKey === 'overall') return pick.overallScore;
  const categoryMap: Record<string, string> = {
    images: 'images',
    videos: 'video',
    roleplay: 'chat',
    price: 'pricing',
  };
  const catKey = categoryMap[sortKey] ?? sortKey;
  const cat = pick.categoryScores.find((c) => c.key === catKey);
  return cat?.score ?? pick.overallScore;
}
