import type { RoundupFaqItem } from './roundups/ai-girlfriend';

export type TestHubTocSection = {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
};

export type TestHubRelatedLink = {
  label: string;
  href: string;
};

export const testHubTocSections: TestHubTocSection[] = [
  { id: 'how-scores-work', label: 'How our rating system works' },
  { id: 'overall-score', label: 'Overall performance score' },
  { id: 'category-scores', label: 'Our eight testing categories' },
  { id: 'subscores', label: 'How subscores work' },
  { id: 'evidence', label: 'Evidence groups' },
  { id: 'full-framework', label: 'Explore our full testing framework' },
  { id: 'in-practice', label: 'How we test AI girlfriend apps in practice' },
  {
    id: 'across-site',
    label: 'Where you will see our scores',
    children: [{ id: 'tooltips-and-score-breakdowns', label: 'Tooltips and score breakdowns' }],
  },
  {
    id: 'beyond-the-score',
    label: 'Beyond the score',
    children: [{ id: 'scored-vs-informational', label: 'Scored vs informational' }],
  },
  { id: 'consistency', label: 'How we keep scores consistent' },
  { id: 'updates', label: 'Updates and methodology versions' },
  { id: 'faq', label: 'Frequently asked questions' },
];

/** Hub TOC with per-category anchors under Category scores. */
export function buildTestHubTocSections(
  categories: { key: string; name: string }[],
): TestHubTocSection[] {
  return testHubTocSections.map((section) => {
    if (section.id !== 'category-scores') return section;
    return {
      ...section,
      children: categories.map((cat) => ({
        id: `category-${cat.key}`,
        label: cat.name,
      })),
    };
  });
}

export const testHubRelatedMethodology: TestHubRelatedLink[] = [
  { label: 'How score tooltips work', href: '/test/tooltips/' },
  { label: 'Market data methodology', href: '/test/market-data/' },
  { label: 'Editorial standards', href: '/editorial-guidelines/' },
];

/** Sidebar links on subscore methodology pages. */
export function buildSubscoreRelatedMethodology(
  category: { subscores: { name: string; slug: string; href: string }[] },
  currentSubscoreSlug: string,
): TestHubRelatedLink[] {
  return [
    { label: 'How We Test', href: '/test/' },
    ...testHubRelatedMethodology,
    ...category.subscores
      .filter((sub) => sub.slug !== currentSubscoreSlug)
      .map((sub) => ({ label: sub.name, href: sub.href })),
  ];
}

export const testHubScoreLocations = [
  {
    label: 'Reviews',
    description: 'Full overall, category, subscore, and evidence-level results for one app.',
    icon: 'reviews',
  },
  {
    label: 'Roundups',
    description: 'Condensed results used to compare and rank several apps.',
    icon: 'leaderboard',
  },
  {
    label: 'Comparisons',
    description: 'Side-by-side category and evidence comparisons.',
    icon: 'balance',
  },
  {
    label: 'App directory',
    description: 'Summary scores, pricing information, and key strengths for browsing and filtering.',
    icon: 'apps',
  },
];

export const testHubProcessSteps = [
  {
    title: 'We purchase access',
    body: 'We buy the paid plans ourselves and test the same versions available to regular customers. We do not rely on sponsored access or limited demos. We go through the same customer journey as everyone else.',
  },
  {
    title: 'We create a test plan',
    body: 'Each app is tested using the same category framework, structured tasks, and fixed evidence requirements.',
  },
  {
    title: 'We use the app like a real customer',
    body: 'We create characters, hold conversations, generate media, including NSFW content, test account controls, and examine the real cost of regular use.',
  },
  {
    title: 'We collect evidence',
    body: 'We record counts, percentages, timings, feature availability, failures, limits, and qualitative test results.',
  },
  {
    title: 'We calculate the scores',
    body: 'Scored tests contribute to subscores. Subscores create category scores, and the weighted category scores produce the overall performance score.',
  },
  {
    title: 'We write and fact-check the review',
    body: 'Our editorial conclusions explain the data rather than replace it.',
  },
  {
    title: 'We include personal experience and a video review',
    body: 'One of our experts creates a detailed review, which may also include a YouTube video. This does not contribute to the performance rating, but it helps explain our scores.',
  },
  {
    title: 'We retest and update',
    body: 'We update scores when pricing, features, models, policies, or output quality change in a meaningful way. We check every review at least once every three months, but many are updated more often because the industry changes quickly.',
  },
];

export const testHubImportantTests = [
  { label: 'Memory test', href: '/test/chat/understanding/#memory', desc: 'Fixed facts recalled across later conversations.' },
  { label: 'Reply speed test', href: '/test/chat/reliability/#reply-speed', desc: 'Median response time across a fixed sample.' },
  { label: 'Conversation realism test', href: '/test/chat/realism/#naturalness', desc: 'Naturalness, personality, and roleplay quality.' },
  { label: 'Character consistency test', href: '/test/images/accuracy/#character-consistency', desc: 'Identity preserved across repeated generations.' },
  { label: 'Prompt accuracy test', href: '/test/images/accuracy/#prompt-accuracy', desc: 'How closely outputs match the request.' },
  { label: 'Image error test', href: '/test/images/quality/#visual-errors', desc: 'Artifacts and anatomy failures in generated images.' },
  { label: 'Video motion quality test', href: '/test/video/quality/#motion', desc: 'Smooth, believable movement in generated video.' },
  { label: 'Privacy policy test', href: '/test/privacy/data-use/#policy-clarity', desc: 'Whether policies clearly explain data use.' },
  { label: 'Billing discretion test', href: '/test/privacy/security/#billing-descriptor', desc: 'How charges appear on statements.' },
  { label: 'Monthly spend test', href: '/test/pricing/usage-costs/#monthly-spend', desc: 'Estimated monthly spend for regular use.' },
];

export const testHubFaq: RoundupFaqItem[] = [
  {
    question: 'Can companies pay for a higher score?',
    answer:
      'No. Companies cannot buy a better rating, change their test results, or pay to appear higher in our rankings. Scores come from the same testing method for every app. We may earn a commission when someone uses one of our links, but this does not affect the score.',
  },
  {
    question: 'Do you test free or paid accounts?',
    answer:
      'We mainly test paid accounts because they show what a regular customer receives after subscribing. We also test free access separately when an app offers a free plan or trial.',
  },
  {
    question: 'How long do you test each app?',
    answer:
      'We normally use an app for at least 30 days before publishing its score. This gives us enough time to test features such as memory, proactive messages, customer support, and account controls that cannot be judged in one day.',
  },
  {
    question: 'How often do you update scores?',
    answer:
      'We update a score when an important part of the app changes. This may include its pricing, features, AI model, privacy policy, limits, or image and video quality. We also retest products over time to check whether their performance has improved or become worse.',
  },
  {
    question: 'Why do some apps have no video score?',
    answer:
      'Some apps do not offer video generation. In that case, we mark Video as not available instead of giving the app a made-up score. The remaining available categories are then used to calculate the overall result.',
  },
  {
    question: 'How is the overall score calculated?',
    answer: 'The overall score combines eight categories:',
    answerList: [
      'Characters',
      'Customization',
      'Chat',
      'Chat Features',
      'Images',
      'Video',
      'Privacy',
      'Pricing',
    ],
    answerAfter:
      'Each category has a different weight, so the overall score is not a simple average. More important categories have a larger effect on the final result.',
  },
  {
    question: 'Are any scores based on opinion?',
    answer:
      'Some tests require human judgment, especially when we rate realism, writing quality, image errors, or video motion. To keep this fair, we use fixed sample sizes, the same testing steps, and written scoring rules for every app.',
  },
  {
    question: 'What happens when information is unclear or unknown?',
    answer:
      'We never treat missing information as proof that an app is safe or trustworthy. When we cannot confirm something, we mark it as Unknown and explain what information was missing.',
  },
  {
    question: 'Can an app\u2019s score go down?',
    answer:
      'Yes. A score can decrease when retesting shows worse performance, prices increase, features are removed, policies become less clear, or our methodology is improved.',
  },
  {
    question: 'How do you avoid counting the same feature twice?',
    answer:
      'We may test the same feature in more than one place because it can answer different questions. For example, we record image and video costs in their feature sections, but those costs only affect the final score under Pricing. This prevents one result from unfairly adding points or penalties more than once.',
  },
];

export const testHubVersions = [
  { version: 'V3.1', date: 'August 2026', change: 'Updated image and pricing tests' },
  { version: 'V3.0', date: 'July 2026', change: 'Introduced eight-category framework' },
  { version: 'V2', date: 'Early 2025', change: 'Expanded categories using a survey of AI girlfriend users' },
  { version: 'V1', date: 'October 2024', change: 'Initial ratings based on personal experience' },
];

export const testHubEvidenceExamples = [
  {
    title: 'Memory',
    body: 'We give the app a fixed set of facts during conversations and later test how many it recalls correctly.',
    result: '82% of tested facts remembered',
    href: '/test/chat/understanding/#memory',
  },
  {
    title: 'Reply speed',
    body: 'We record response times across a fixed sample and calculate the median.',
    result: '3.8-second median response time',
    href: '/test/chat/reliability/#reply-speed',
  },
  {
    title: 'Character consistency',
    body: 'We generate repeated images of the same character and measure how consistently identity and appearance are preserved.',
    result: '84% character consistency',
    href: '/test/images/accuracy/#character-consistency',
  },
];

export const testHubOverallExample = [
  { label: 'Characters', score: '9.0' },
  { label: 'Customization', score: '9.2' },
  { label: 'Chat', score: '9.4' },
  { label: 'Chat Features', score: '8.8' },
  { label: 'Images', score: '9.1' },
  { label: 'Video', score: '8.5' },
  { label: 'Privacy', score: '9.0' },
  { label: 'Pricing', score: '8.6' },
];
