/**
 * Homepage v3 — content values taken literally from the approved Figma frames
 * (10 · Homepage → "Homepage — Desktop 1440" / "Homepage — Mobile 390").
 *
 * PHASE 1: static on purpose. Phase 2 swaps this for the live data sources
 * (InstantDB products/scores + the content loaders) without touching the markup.
 */

/** Product icons — exported from the Figma App Icon component set. */
export const icons: Record<string, string> = {
  ourdream: '/brand/home-v3/app-ourdream-ai.png',
  candy: '/brand/home-v3/app-candy-ai.png',
  girlfriendgpt: '/brand/home-v3/app-girlfriendgpt.png',
  nectar: '/brand/home-v3/app-nectar-ai.png',
  juicychat: '/brand/home-v3/app-juicychat-ai.png',
};

export const hero = {
  eyebrow: 'Independent AI companion testing lab',
  eyebrowMobile: 'Independent AI companion testing',
  h1Lines: ['Find the best', 'AI girlfriend app', 'for '],
  h1Mobile: 'Find the best AI girlfriend app for ',
  h1Accent: 'you.',
  sub: 'We buy, test, score and compare AI companion apps — so you can choose with confidence, not marketing hype.',
  primary: { label: 'See the 2026 rankings', href: '/best/ai-girlfriend/' },
  secondary: { label: 'Browse all reviews', href: '/ai-girlfriend-reviews/' },
  proofText: 'The 5 finalists in our 2026 rankings',
  stack: ['ourdream', 'candy', 'girlfriendgpt', 'nectar', 'juicychat'],
  herman: '/brand/branded/herman-scientist.png',
};

export const leaderboard = {
  title: 'Leaderboard',
  updated: 'Jul 2026',
  rows: [
    { rank: '1', name: 'OurDream AI', icon: 'ourdream', score: '8.8', tone: 'high' },
    { rank: '2', name: 'Candy AI', icon: 'candy', score: '7.8', tone: 'mid' },
    { rank: '3', name: 'GirlfriendGPT', icon: 'girlfriendgpt', score: '7.7', tone: 'mid' },
  ],
};

export const winnerCard = {
  name: 'OurDream AI',
  icon: 'ourdream',
  award: 'Best overall',
  score: '8.8',
  bars: [
    { label: 'Images', value: '9.6' },
    { label: 'Characters', value: '9.4' },
    { label: 'Chat', value: '9.2' },
  ],
};

/** Mobile-only compact winner strip (Module / Hero Winner Strip (Mobile)). */
export const winnerStrip = {
  rank: '#1',
  name: 'OurDream AI',
  icon: 'ourdream',
  award: 'Best overall',
  detail: 'Images 9.6 · Chat 9.2',
  score: '8.8',
};

export const proofMetrics = [
  { value: '24+', label: 'Apps tested', labelMobile: 'Apps tested' },
  { value: '8', label: 'Rating categories', labelMobile: 'Rating categories' },
  { value: '100%', label: 'Paid accounts', labelMobile: 'Paid accounts' },
  { value: '30+ days', label: 'Hands-on per finalist', labelMobile: 'Hands-on testing' },
  { value: 'Weekly', label: 'Score updates', labelMobile: 'Updates' },
];

export const topRated = {
  eyebrow: 'Rankings · updated Jul 21, 2026',
  eyebrowMobile: 'Rankings · Jul 21, 2026',
  h2: 'Our highest-rated AI girlfriend apps',
  intro: 'Based on the same 8-category testing system used across our reviews.',
  cta: { label: 'View full ranking', href: '/best/ai-girlfriend/' },
  cards: [
    {
      rank: '1', name: 'OurDream AI', icon: 'ourdream', award: 'Best overall', score: 8.8,
      scores: [{ label: 'Chat', value: 9.2 }, { label: 'Images', value: 9.6 }, { label: 'Video', value: 8.5 }],
      price: '$19.99/mo', visit: '/go/ourdream-ai', review: '/reviews/ourdream-ai/',
    },
    {
      rank: '2', name: 'Candy AI', icon: 'candy', award: '', score: 7.8,
      scores: [{ label: 'Chat', value: 8.4 }, { label: 'Images', value: 8.8 }, { label: 'Video', value: 5.9 }],
      price: '$13.99/mo', visit: '/go/candy-ai', review: '/reviews/candy-ai/',
    },
    {
      rank: '3', name: 'GirlfriendGPT', icon: 'girlfriendgpt', award: '', score: 7.7,
      scores: [{ label: 'Chat', value: 9.0 }, { label: 'Images', value: 6.9 }, { label: 'Video', value: 7.7 }],
      price: '$15.00/mo', visit: '/go/girlfriendgpt', review: '/reviews/girlfriendgpt/',
    },
  ],
};

export const selector = {
  eyebrow: 'Decision shortcuts',
  h2Before: 'Pick what ',
  h2Accent: 'matters most',
  h2After: ' to you',
  intro: 'Choose a priority to see which tested app scores highest for it — and jump straight into that ranking.',
  listLabel: 'What matters most?',
  options: [
    { key: 'overall', label: 'Overall', icon: 'trophy' },
    { key: 'chat', label: 'Chat', icon: 'chat' },
    { key: 'images', label: 'Images', icon: 'image' },
    { key: 'video', label: 'Video', icon: 'video' },
    { key: 'price', label: 'Price', icon: 'card' },
  ],
  /** Figma shows Selected=Images; every panel reuses the same structure. */
  defaultKey: 'images',
  results: {
    overall: {
      eyebrow: 'Best for overall', name: 'OurDream AI', icon: 'ourdream', award: 'Best overall',
      value: '8.8', metricLabel: 'overall',
      reason: 'Highest weighted score across all 8 categories, led by images (9.6) and chat (9.2).',
      runners: [
        { rank: '2', name: 'Candy AI', icon: 'candy', score: '7.8' },
        { rank: '3', name: 'GirlfriendGPT', icon: 'girlfriendgpt', score: '7.7' },
      ],
      cta: 'View full ranking', href: '/best/ai-girlfriend/',
    },
    chat: {
      eyebrow: 'Best for chat', name: 'OurDream AI', icon: 'ourdream', award: 'Best chat',
      value: '9.2', metricLabel: 'for Chat',
      reason: 'The most natural back-and-forth in our scripted conversation tests, with the fewest memory slips.',
      runners: [
        { rank: '2', name: 'GirlfriendGPT', icon: 'girlfriendgpt', score: '9.0' },
        { rank: '3', name: 'Candy AI', icon: 'candy', score: '8.4' },
      ],
      cta: 'View chat ranking', href: '/best/ai-girlfriend/?rank=chat',
    },
    images: {
      eyebrow: 'Best for images', name: 'OurDream AI', icon: 'ourdream', award: 'Best images',
      value: '9.6', metricLabel: 'for Images',
      reason: 'Most realistic images and the best prompt accuracy we measured — fast enough to use inside chats.',
      runners: [
        { rank: '2', name: 'Candy AI', icon: 'candy', score: '8.8' },
        { rank: '3', name: 'Nectar AI', icon: 'nectar', score: '8.6' },
      ],
      cta: 'View image ranking', href: '/best/ai-girlfriend/?rank=images',
    },
    video: {
      eyebrow: 'Best for video', name: 'OurDream AI', icon: 'ourdream', award: 'Best video',
      value: '8.5', metricLabel: 'for Video',
      reason: '60-second clips with audio, generated from the same character, without leaving the chat.',
      runners: [
        { rank: '2', name: 'GirlfriendGPT', icon: 'girlfriendgpt', score: '7.7' },
        { rank: '3', name: 'Candy AI', icon: 'candy', score: '5.9' },
      ],
      cta: 'View video ranking', href: '/best/ai-girlfriend/?rank=video',
    },
    price: {
      eyebrow: 'Best for price', name: 'OurDream AI', icon: 'ourdream', award: 'Best price',
      value: '8.9', metricLabel: 'for Price',
      reason: 'What you actually get per month against what you pay, including the credits every feature burns.',
      runners: [
        { rank: '2', name: 'Candy AI', icon: 'candy', score: '8.4' },
        { rank: '3', name: 'Nectar AI', icon: 'nectar', score: '8.1' },
      ],
      cta: 'View price ranking', href: '/best/ai-girlfriend/?rank=price',
    },
  } as Record<string, any>,
  reviewCta: { label: 'Read OurDream AI review', href: '/reviews/ourdream-ai/' },
};

export const methodology = {
  eyebrow: 'How we test · methodology v3.1',
  h2Before: 'Nothing gets a score ',
  h2Accent: 'for free',
  steps: [
    { num: '01', title: 'We pay for it', desc: 'The cheapest monthly plan of every app. No free press accounts.' },
    { num: '02', title: 'We use it', desc: '30+ days hands-on per finalist, the same tasks on every app.' },
    { num: '03', title: 'We score it', desc: '8 weighted categories, each backed by subscores and evidence.' },
    { num: '04', title: 'We re-test it', desc: 'Scores move when apps change — and the change log says why.' },
  ],
  cta: { label: 'Read the full methodology', href: '/test/how-we-test/' },
  poster: '/roundups/how-we-test-lab-poster.jpg',
  video: '/roundups/how-we-test-lab.mp4',
  chapter: 'Inside the testing lab',
  caption: 'Footage from our paid testing accounts',
};

export const score = {
  eyebrow: 'The AIGE score',
  h2Before: 'One number.',
  h2Accent: 'Eight tests.',
  intro: 'Every app gets the same weighted 8-category test. The overall score comes from those results, not a gut feeling.',
  bands: [
    { chip: '8.0+', tone: 'high', label: 'Strong', labelMobile: 'Strong' },
    { chip: '5.0–7.9', tone: 'mid', label: 'Average — real trade-offs', labelMobile: 'Average' },
    { chip: '< 5.0', tone: 'low', label: 'Weak', labelMobile: 'Weak' },
  ],
  cta: { label: 'How the AIGE Score works', href: '/test/tooltips/' },
  overall: {
    value: '8.8',
    app: 'OurDream AI · overall score',
    band: 'Strong',
    explain: 'Weighted average of the 8 category tests below.',
  },
  rows: [
    { name: 'Characters', weight: '10% weight', value: 9.4, icon: 'users' },
    { name: 'Customization', weight: '15% weight', value: 8.9, icon: 'sliders' },
    { name: 'Chat', weight: '20% weight', value: 9.2, icon: 'chat' },
    { name: 'Chat Features', weight: '10% weight', value: 6.8, icon: 'sparkle' },
    { name: 'Images', weight: '15% weight', value: 9.6, icon: 'image' },
    { name: 'Video', weight: '10% weight', value: 8.5, icon: 'video' },
    { name: 'Privacy', weight: '10% weight', value: 8.6, icon: 'shield' },
    { name: 'Price', weight: '10% weight', value: 8.9, icon: 'card' },
  ],
};

export const latest = {
  eyebrow: 'Latest',
  h2: 'Latest testing & guides',
  cta: { label: 'All reviews & guides', href: '/guides/' },
  featured: {
    image: '/brand/home-v3/ourdream-ai-review-featured.jpg',
    type: 'Review',
    date: 'Updated Sep 2026',
    title: 'OurDream AI Review',
    result: '8.8/10 after 3+ months of testing',
    desc: '60-second videos with audio, 50,000+ characters and fast in-chat images. Weakest category: Chat Features (6.8).',
    link: 'Read the review',
    href: '/reviews/ourdream-ai/',
  },
  rows: [
    { type: 'Guide', date: 'Sep 2026', title: 'OurDream AI Image Generator', desc: 'How the image generator works, what it costs and what it produces.', href: '/guides/how-to-use-ourdream-ai-image-generator/' },
    { type: 'Roundup', date: 'Sep 2026', title: 'Best AI Girlfriend Apps', desc: 'Every tested app ranked on the same 8 categories.', href: '/best/ai-girlfriend/' },
    { type: 'Guide', date: 'Aug 2026', title: 'OurDream AI Image Prompt Guide', desc: 'Prompt structure, tested examples and the results they produced.', href: '/guides/ourdream-ai-image-prompt/' },
    { type: 'Methodology', date: 'Aug 2026', title: 'How We Score Apps', desc: 'What each of the 8 categories measures and how it is weighted.', href: '/test/how-we-test/' },
  ],
};

export const tester = {
  eyebrow: 'Meet the tester',
  name: 'Herman Carter',
  role: 'Lead Reviewer · M.A. AI Ethics & Society',
  bio: 'I personally test the apps we review using paid accounts and the same scoring framework.',
  avatar: '/authors/herman-carter.png',
  metrics: [
    { value: '100+', label: 'Apps tested' },
    { value: '50+', label: 'Full reviews' },
    { value: '0', label: 'Free press accounts' },
  ],
  links: [
    { label: 'About Herman', href: '/author/herman-carter/' },
    { label: 'How we test', href: '/test/how-we-test/' },
    { label: 'Editorial guidelines', href: '/editorial-guidelines/' },
  ],
};

export const closing = {
  h2Line1: 'Stop guessing.',
  h2Line2: 'Start with the ',
  h2Accent: 'rankings.',
  note: '5 finalists · updated Jul 21, 2026 · no sponsored rankings',
  noteMobile: '5 finalists · updated Jul 21, 2026',
  cta: { label: 'See the 2026 rankings', href: '/best/ai-girlfriend/' },
};

export const footer = {
  logo: '/brand/girlfriend-expert-logo-white.png',
  tagline: 'Independent AI companion reviews —\ntested honestly, scored transparently,\nupdated regularly.',
  channelsLabel: 'CHANNELS & COMMUNITY',
  channels: [
    { icon: 'youtube', label: 'AIGE Reviews', desc: 'Reviews, rankings & app testing', href: 'https://www.youtube.com/@aigirlfriendexpert' },
    { icon: 'youtube', label: 'AI Girlfriend Help Desk', desc: 'Tutorials, FAQs & how-to guides', href: 'https://www.youtube.com/@ai-girlfriend-help-desk' },
    { icon: 'tiktok', label: 'TikTok', desc: '', href: 'https://www.tiktok.com/@aigirlfriendexpert' },
    { icon: 'reddit', label: 'Reddit Community', desc: 'New community coming soon', href: '' },
  ],
  columns: [
    { title: 'EXPLORE', links: [['Roundups', '/best/'], ['Reviews', '/ai-girlfriend-reviews/'], ['Guides', '/guides/'], ['AI Girlfriend Apps', '/ai-girlfriend-apps/']] },
    { title: 'TESTING', links: [['How We Test', '/test/how-we-test/'], ['Testing Categories', '/test/'], ['How Scoring Works', '/test/tooltips/'], ['Market Data Methodology', '/test/market-data/']] },
    { title: 'RESOURCES', links: [['Glossary', '/glossary/'], ['Site Index', '/sitemap/']] },
    { title: 'COMPANY', links: [['About Us', '/about/'], ['Herman Carter', '/author/herman-carter/'], ['Contact', '/contact/'], ['Editorial Guidelines', '/editorial-guidelines/'], ['Affiliate Disclosure', '/legal/affiliate-disclosure/']] },
  ],
  legal: [['Privacy Policy', '/legal/privacy-policy/'], ['Terms of Service', '/legal/terms/'], ['Accessibility', '/legal/accessibility/']],
  copyright: '© 2026 Nelson Digital FZ-LLC. All rights reserved.',
};

export function tone(v: number): 'high' | 'mid' | 'low' {
  if (v >= 8) return 'high';
  if (v >= 5) return 'mid';
  return 'low';
}
