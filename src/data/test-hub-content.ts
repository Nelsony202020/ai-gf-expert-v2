export const testHubTrustMetrics = [
  { value: '24+ apps tested', icon: 'apps' },
  { value: '100% paid accounts', icon: 'payments' },
  { value: '30+ days of testing', icon: 'calendar_today' },
  { value: '8 rating categories', icon: 'category' },
  { value: 'Updated regularly', icon: 'update' },
];

export const testHubTocSections = [
  { id: 'how-scores-work', label: 'How our scores work' },
  { id: 'overall-score', label: 'Overall performance score' },
  { id: 'category-scores', label: 'Rating categories' },
  { id: 'subscores', label: 'Subscores' },
  { id: 'evidence', label: 'Evidence points' },
  { id: 'full-framework', label: 'Our eight rating categories' },
  { id: 'in-practice', label: 'How we test in practice' },
  { id: 'important-tests', label: 'Important individual tests' },
  { id: 'across-site', label: 'Where scores appear' },
  { id: 'beyond-the-score', label: 'Beyond the score' },
  { id: 'consistency', label: 'Keeping scores fair' },
  { id: 'updates', label: 'Updates and versions' },
  { id: 'faq', label: 'Frequently asked questions' },
];

export const testHubProcessSteps = [
  {
    title: 'We purchase access',
    body: 'We buy paid plans ourselves and test the same versions available to regular customers. We do not rely on sponsored access or limited demos.',
  },
  {
    title: 'We create a test plan',
    body: 'Each app is tested using the same category framework, structured tasks, and fixed evidence requirements.',
  },
  {
    title: 'We use the app like a real customer',
    body: 'We create characters, hold conversations, generate media, test account controls, and examine the real cost of regular use.',
  },
  {
    title: 'We collect evidence',
    body: 'We record counts, percentages, timings, feature availability, failures, limits, and qualitative test results.',
  },
  {
    title: 'We calculate scores',
    body: 'Evidence points contribute to subscores. Subscores create category scores. Weighted category scores produce the overall performance score.',
  },
  {
    title: 'We write and fact-check the review',
    body: 'Our editorial conclusions explain the data rather than replacing it.',
  },
  {
    title: 'We retest and update',
    body: 'We update scores when pricing, features, models, policies, or output quality change meaningfully.',
  },
];

export const testHubImportantTests = [
  { label: 'Memory test', href: '/test/chat/understanding/#memory', desc: 'Fixed facts recalled across later conversations.' },
  { label: 'Reply speed test', href: '/test/chat/reliability/#speed', desc: 'Median response time across a fixed sample.' },
  { label: 'Conversation realism test', href: '/test/chat/realism/#naturalness', desc: 'Naturalness, personality, and roleplay quality.' },
  { label: 'Character consistency test', href: '/test/images/accuracy/#character-consistency', desc: 'Identity preserved across repeated generations.' },
  { label: 'Prompt accuracy test', href: '/test/images/accuracy/#prompt-accuracy', desc: 'How closely outputs match the request.' },
  { label: 'Image error test', href: '/test/images/quality/#visual-errors', desc: 'Artifacts and anatomy failures in generated images.' },
  { label: 'Video motion quality test', href: '/test/video/quality/#motion', desc: 'Smooth, believable movement in generated video.' },
  { label: 'Privacy policy test', href: '/test/privacy/data-use/#policy-clarity', desc: 'Whether policies clearly explain data use.' },
  { label: 'Billing discretion test', href: '/test/privacy/security/#billing-descriptor', desc: 'How charges appear on statements.' },
  { label: 'Real monthly cost test', href: '/test/pricing/value/#real-cost', desc: 'Estimated spend for typical and heavy use.' },
];

export const testHubFaq = [
  {
    q: 'Do companies pay for higher ratings?',
    a: 'No. Scores come from our testing framework only. Affiliate relationships do not influence ratings.',
  },
  {
    q: 'Do you use free or paid accounts?',
    a: 'We test with paid accounts that match what regular customers can buy.',
  },
  {
    q: 'How long do you test each app?',
    a: 'Most apps are used for at least 30 days before a score is published, with ongoing retesting after launch.',
  },
  {
    q: 'How often are scores updated?',
    a: 'When pricing, features, models, policies, or output quality change in ways that affect our evidence.',
  },
  {
    q: 'Why do some apps have no video score?',
    a: 'If video generation is unavailable, we score the category as not offered rather than guessing.',
  },
  {
    q: 'How is the overall score calculated?',
    a: 'Eight weighted category scores combine into one overall performance score — not a simple average.',
  },
  {
    q: 'Are subjective judgments used?',
    a: 'Some quality assessments require expert judgment, but they use fixed samples and written criteria.',
  },
  {
    q: 'What happens when information is unknown?',
    a: 'Unknown privacy or policy information is not treated as a positive result.',
  },
  {
    q: 'Can a product’s score decrease?',
    a: 'Yes. Scores change when retesting shows worse results or when methodology is updated.',
  },
  {
    q: 'How do you prevent double scoring?',
    a: 'Image and video costs are measured in their sections but affect the final rating under Pricing.',
  },
];

export const testHubVersions = [
  { version: 'V3.1', date: 'July 2026', change: 'Updated image and pricing tests' },
  { version: 'V3.0', date: 'January 2026', change: 'Introduced eight-category framework' },
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
    href: '/test/chat/reliability/#speed',
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
