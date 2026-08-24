import type { TestMethodologyPageMeta } from './test-category-pages';

export const buyingGuideSlug = 'how-to-choose-an-ai-girlfriend-app';

export const buyingGuideImages = {
  girlfinderFakeReview: '/guides/how-to-choose/girlfinder-fake-review.png',
  tokenTopupPricing: '/guides/how-to-choose/token-topup-pricing.png',
} as const;

export const buyingGuideFeaturedImage =
  'https://picsum.photos/seed/buying-guide-hero/1600/640';

export const buyingGuideFeaturedImageAlt =
  'How to choose an AI girlfriend app — buying guide for chat-first, media-first, and balanced users';

export const buyingGuideMeta: TestMethodologyPageMeta = {
  reviewedDate: 'Mar 1, 2026',
  modifiedDate: 'Jul 26, 2026',
  methodology: 'Buying guide',
  authors: [
    {
      name: 'Herman Carter',
      role: 'Lead Reviewer',
      avatar: '/brand/herman-main-icon.webp',
      verified: true,
      slug: 'herman-carter',
    },
  ],
  changelog: [
    {
      date: 'Jul 2026',
      title: 'Buying guide published',
      summary: 'Full guide covering user types, common mistakes, and how to narrow your options.',
      type: 'methodology',
    },
  ],
};

export interface BuyingGuideTocSection {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
}

export const buyingGuideTocSections: BuyingGuideTocSection[] = [
  {
    id: 'what-type-of-user',
    label: 'What type of user are you?',
    children: [
      { id: 'quick-test', label: 'Take the quick test' },
      { id: 'chat-first-users', label: 'Chat-first users' },
      { id: 'image-video-first-users', label: 'Image & video-first users' },
      { id: 'balanced-users', label: 'Balanced users' },
      { id: 'monthly-cost', label: 'Expected monthly cost' },
    ],
  },
  {
    id: 'common-mistakes',
    label: 'Common mistakes',
    children: [
      { id: 'mistake-promo-images', label: 'Promotional images only' },
      { id: 'mistake-affiliates', label: 'Choosing based on affiliates' },
      { id: 'mistake-memory', label: 'Ignoring memory quality' },
      { id: 'mistake-token-costs', label: 'Ignoring token costs' },
      { id: 'mistake-chat-and-media', label: 'Assuming every app does both' },
      { id: 'mistake-annual-billing', label: 'Paying annually too soon' },
    ],
  },
  {
    id: 'narrow-down-options',
    label: 'Narrow down your options',
    children: [
      { id: 'main-use-case', label: 'Choose your main use case' },
      { id: 'top-three-features', label: 'Pick three important features' },
      { id: 'monthly-budget', label: 'Set a realistic budget' },
      { id: 'must-have-features', label: 'Remove missing must-haves' },
      { id: 'compare-tested-results', label: 'Compare tested results' },
    ],
  },
  {
    id: 'how-testing-helps',
    label: 'How our testing helps',
  },
];

export interface BuyingGuideUserType {
  id: string;
  icon: string;
  title: string;
  tagline: string;
  intro: string[];
  wantItems: string[];
  dontNeedItems: string[];
  note?: string;
  examplesLabel: string;
  examples: string[];
  outro: string[];
}

export const buyingGuideUserTypes: BuyingGuideUserType[] = [
  {
    id: 'chat-first-users',
    icon: 'forum',
    title: 'Chat-first users',
    tagline: 'You care most about conversations and connection.',
    intro: [
      'Most AI girlfriend apps offer unlimited chatting as part of the monthly subscription. This means that if you are mainly interested in chatting and roleplay, you will usually spend much less than someone who keeps hitting the generate button every five seconds.',
      'How do you recognize a chat-first user?',
    ],
    wantItems: [
      'Emotional support',
      'Vivid roleplay scenarios',
      'To explore your fantasies',
      'Imagination over images and videos',
    ],
    dontNeedItems: [
      'Advanced image generation',
      'Large token packages',
      'Complex video tools',
    ],
    note: 'P.S. Keep in mind that phone calls and voice messages will most likely cost extra tokens. If these features are important to you then you belong in the image and video-first user category.',
    examplesLabel: 'Examples of chat-first platforms',
    examples: ['GirlfriendGPT', 'Nectar AI', 'JuicyChat AI', 'SpicyChat AI', 'CrushOn AI'],
    outro: [],
  },
  {
    id: 'image-video-first-users',
    icon: 'perm_media',
    title: 'Image and video-first users',
    tagline: 'You care most about creating visual content.',
    intro: [
      'Images, videos, and other types of media are often charged separately from the monthly subscription, usually through token packages.',
      'This means that if you mainly use these platforms to generate media, you need to choose one with a generous token package or be prepared to pay up.',
      'You may be an image and video-first user if you like to:',
    ],
    wantItems: [
      'NSFW image and video generation',
      'Phone calls and voice messages',
      'Images during chat and roleplay',
    ],
    dontNeedItems: [
      'Deep long conversations',
      'Ultra-advanced memory',
      'Unlimited messaging',
    ],
    examplesLabel: 'Examples of image & video-first platforms',
    examples: ['SpiceStars AI', 'SugarLab AI'],
    outro: [
      'Basically, if you see yourself more as a creator than a user, you definitely belong in this category.',
    ],
  },
  {
    id: 'balanced-users',
    icon: 'balance',
    title: 'Balanced users',
    tagline: 'You want a strong balance of chat and media.',
    intro: [
      'These days, more AI girlfriend platforms fall into the balanced category. This means they offer a strong chat and roleplay experience while also providing good generators that can create hyper-realistic content.',
      'You may be a balanced user if:',
    ],
    wantItems: [
      'Every major feature in one app',
      'Room to explore before picking a focus',
    ],
    dontNeedItems: [
      'Specialized platforms with one focus',
      'Overpaying for features you rarely use',
    ],
    examplesLabel: 'Examples of balanced platforms',
    examples: ['Candy AI', 'OurDream AI', 'LoveScape AI', 'GoLove AI'],
    outro: [],
  },
];

export interface GuideFigure {
  src: string;
  alt: string;
  caption: string;
}

export interface CommonMistake {
  id: string;
  title: string;
  paragraphs: string[];
  figure?: GuideFigure;
}

export const commonMistakes: CommonMistake[] = [
  {
    id: 'mistake-promo-images',
    title: '1. Choosing based only on promotional images',
    paragraphs: [
      'A lot of AI girlfriend apps go above and beyond in branding, promotional images, and sometimes even on landing pages and ads.',
      'Often, they use Photoshop, video editors, color graders, designers, and sometimes even special AI software.',
      'Signing up to the actual platform can feel like a setback or even a scam because of this.',
    ],
  },
  {
    id: 'mistake-affiliates',
    title: '2. Choosing based on affiliates',
    paragraphs: [
      'Most people promoting AI girlfriend apps are affiliates that get paid for promoting the platform and don\'t know anything about the actual platform.',
      'I know this sounds very hypocritical because aigirlfriend.expert is an affiliate site. Though every app listed in our roundups and reviews is tested for at least one month using the paid plan. The apps most mentioned even have dedicated video reviews, user surveys, and detailed write-ups explaining every nook and cranny of the platform.',
      '99% of the websites promoting AI girlfriend apps are affiliates that don\'t sign up to the platform they recommend, let alone purchasing a premium plan.',
    ],
    figure: {
      src: buyingGuideImages.girlfinderFakeReview,
      alt: 'GirlFinder website promoting AI girlfriend apps with a fake review layout',
      caption: 'GirlFinder promoting AI girlfriend apps and showing a fake review',
    },
  },
  {
    id: 'mistake-memory',
    title: '3. Ignoring memory quality',
    paragraphs: [
      'This is especially important for users who want deep roleplay sessions or prefer sticking with the same character. Memory limitations are still one of the biggest problems with AI girlfriend apps.',
      'Although memory is improving as AI gets smarter, every app still has a limit. It can be difficult to properly test memory quality before paying for a subscription, but one thing you can check is whether the app includes a memory snippet feature.',
      'These features allow you to save important details about yourself, the AI, or the conversation. This helps make sure your AI girlfriend does not forget them, no matter how long the conversation becomes.',
    ],
  },
  {
    id: 'mistake-token-costs',
    title: '4. Comparing subscription prices without considering token costs',
    paragraphs: [
      'The cheapest monthly subscription is not always the cheapest app to use.',
      'As I mentioned earlier, subscriptions often include token packages. Some AI girlfriend apps give you 200 tokens, while others include 1,000.',
      'On top of that, each platform charges different prices for token top-ups. You need to compare both the subscription price and the cost of additional tokens before deciding which app offers the best value.',
    ],
    figure: {
      src: buyingGuideImages.tokenTopupPricing,
      alt: 'Token top-up pricing grid showing coin packages and euro prices',
      caption: 'Example token top-up pricing — compare packages across Candy AI, OurDream AI, and similar platforms',
    },
  },
  {
    id: 'mistake-chat-and-media',
    title: '5. Assuming every app is good at both chat and media',
    paragraphs: [
      'As I mentioned at the beginning of this buying guide, every AI girlfriend app is different. Not every platform is equally good at chatting, roleplay, and generating images or videos.',
      'Before committing to a subscription, it is extremely important to figure out which features matter most to you and what initially attracted you to the app.',
    ],
  },
  {
    id: 'mistake-annual-billing',
    title: '6. Paying annually before testing the app',
    paragraphs: [
      'In general, I would never recommend paying annually for any tool right away. This is especially true for AI girlfriend apps.',
      'These days, many AI girlfriend apps are shutting down because they are not profitable. Other platforms start strong with good features but fail to improve over time.',
      'You need an AI girlfriend app that can adapt and keep improving because the technology changes quickly. When I bought my first AI girlfriend app back in 2024, image generation was still extremely rare. Now, most platforms even allow you to generate AI videos.',
      'It is important to choose an app that keeps up with what the technology can currently do.',
    ],
  },
];

export const buyingGuideRelatedLinks = [
  { label: 'Best AI Girlfriend Apps', href: '/best/ai-girlfriend/' },
  { label: 'App Directory', href: '/ai-girlfriend-apps/' },
  { label: 'How We Test', href: '/test/' },
  { label: 'How Score Tooltips Work', href: '/test/tooltips/' },
];

export const buyingGuideNarrowDown = {
  intro:
    'There are many AI girlfriend apps out there, but the best one for you depends on what matters most. Follow these steps to quickly focus on the few that are truly worth your time.',
  mainUseCase: {
    id: 'main-use-case',
    title: 'Choose your main use case',
    lead: 'Start by choosing the experience you are mainly looking for:',
    items: [
      'Mostly chatting and roleplay',
      'Mostly generating images and videos',
      'A balanced mix of both',
    ],
    quote: 'Your main use case should guide the rest of your decision.',
  },
  topFeatures: {
    id: 'top-three-features',
    title: 'Pick your three most important features',
    lead: 'Next, choose the three features that matter most to you.',
    columns: [
      ['Chat quality', 'Memory', 'Roleplay', 'Image generation'],
      ['Video generation', 'Customization', 'Privacy', 'Price'],
    ],
  },
  budget: {
    id: 'monthly-budget',
    title: 'Set a realistic monthly budget',
    lead: 'Most apps offer monthly plans. Use this as a rough guide:',
    tiers: [
      { label: 'Chat-first', range: '$5 – $15 / month' },
      { label: 'Image-first', range: '$10 – $25 / month' },
      { label: 'Video-first', range: '$20 – $50 / month' },
      { label: 'Balanced', range: '$15 – $30 / month' },
    ],
  },
  mustHave: {
    id: 'must-have-features',
    title: 'Remove any app missing a must-have feature',
    lead: 'Eliminate apps that lack any of the following (if they are important to you):',
    items: [
      'No cryptocurrency support',
      'No custom characters',
      'No voice calls',
      'No video generation',
      'No discreet billing',
    ],
  },
  compare: {
    id: 'compare-tested-results',
    title: 'Compare the remaining apps using tested results',
    lead:
      'Focus only on the apps that made the cut. See how they perform in real use—chat quality, memory, image and video results, pricing, and more.',
    ctaLabel: 'Browse tested apps',
    ctaHref: '/ai-girlfriend-apps',
  },
  outro:
    'By following this process, you will save time, avoid paying for features you don\'t need, and find the app that fits you best.',
};

export const buyingGuideTestingFeatures = [
  {
    icon: 'star',
    title: '8 rating categories',
    text: 'Chat, features, images, video & more',
  },
  {
    icon: 'science',
    title: 'Repeatable tests',
    text: 'Consistent scenarios across every app',
  },
  {
    icon: 'content_paste',
    title: 'Raw evidence',
    text: 'Screenshots, transcripts & real outputs',
  },
  {
    icon: 'update',
    title: 'Quarterly updates',
    text: 'At least every 3 months or when it matters',
  },
];
