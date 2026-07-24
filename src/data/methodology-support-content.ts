export const testHubScoredVsInformational = [
  { item: 'Structured category tests', affectsScore: true },
  { item: 'Pricing evidence', affectsScore: true },
  { item: 'Personal written review', affectsScore: false },
  { item: 'YouTube video review', affectsScore: false },
  { item: 'Photos and videos gallery', affectsScore: false, note: 'Supporting evidence only' },
  { item: 'Google Trends and market data', affectsScore: false },
  { item: 'Expert analysis and key takeaways', affectsScore: false },
];

export const reviewProcessSections = [
  {
    title: 'How written reviews are produced',
    body: 'Every full review starts with structured testing under our eight-category framework. Once evidence is collected and scores calculated, a reviewer writes the narrative — explaining what the numbers mean, where the app excels, and where it falls short. The written review is edited, fact-checked against our test log, and published alongside the score breakdown.',
  },
  {
    title: 'Personal experience and structured results',
    body: 'Hands-on use over weeks informs tone, examples, and practical advice in the review. Personal experience helps readers understand what daily use feels like — but it does not override structured test results. If our testing shows weak image consistency, the review says so even when casual use felt acceptable.',
  },
  {
    title: 'How screenshots are selected',
    body: 'Screenshots show real product interfaces captured during testing: chat windows, character creators, settings pages, and billing screens. We choose images that illustrate features mentioned in the review and avoid marketing renders supplied by the company.',
  },
  {
    title: 'How generated images and videos are selected',
    body: 'Media samples in reviews come from our own test accounts using the same prompts and characters from structured image and video tests. We include representative outputs — strong results, typical results, and notable failures — so readers can judge quality beyond a single cherry-picked example.',
  },
  {
    title: 'Photos & Videos section',
    body: 'The Photos & Videos section on each review collects curated screenshots, generated images, and generated video clips from our testing. Items are labeled by test context where helpful (e.g., character consistency batch, NSFW prompt test). This section provides visual proof; it does not produce a separate score.',
  },
  {
    title: 'YouTube video reviews',
    body: 'Some reviews include a YouTube video walkthrough. Videos are scripted from the same test evidence and written review — showing key features, conversation samples, and media generation live. They are produced after scoring is complete, not before.',
  },
  {
    title: 'Same evidence, different format',
    body: 'Video reviews draw on the same testing evidence as the written review. They do not introduce new measurements or a parallel scoring process. If a video highlights a strength or weakness, that point is already reflected in the structured results or explained in the written review.',
  },
  {
    title: 'Written review is canonical',
    body: 'The written review remains the most complete source on AI Girlfriend Expert. It includes full category breakdowns, evidence tables, pricing analysis, and editorial conclusions. Video reviews summarize and demonstrate; they do not replace the written record.',
  },
  {
    title: 'Video does not change the rating',
    body: 'YouTube video reviews do not create a separate score and cannot independently raise or lower the overall performance score. Popularity, view counts, and presenter opinion play no role in rating calculations.',
  },
  {
    title: 'Not every review has a video',
    body: 'We add YouTube video reviews when they meaningfully complement the written review — typically for major apps or when visual demonstration adds clear value. Many reviews publish without a video; absence of a video is not a negative signal about the product or our confidence in the score.',
  },
];

export const marketDataSections = [
  {
    title: 'Google Trends data',
    body: 'We track Google Trends interest for product names and related search terms. Trends data shows relative search popularity over time — useful context for how much attention an app receives compared to rivals, not how well it performs in hands-on testing.',
  },
  {
    title: 'Search interest over time',
    body: 'Search interest charts plot normalized query volume across weeks and months. Spikes often follow product launches, viral moments, or major feature updates. We present this as market context alongside reviews, not as a quality signal.',
  },
  {
    title: 'Twelve-month growth',
    body: 'We calculate approximate year-over-year or trailing-twelve-month growth in search interest where data is available. Growth indicates rising or falling demand; it does not measure conversation quality, image accuracy, or privacy practices.',
  },
  {
    title: 'Internal popularity and ranking data',
    body: 'We aggregate anonymized on-site signals — page views, compare usage, directory clicks, and outbound referral patterns — to understand which apps readers research most. Internal popularity reflects audience interest on AI Girlfriend Expert, not an endorsement or performance score.',
  },
  {
    title: 'Competitive market comparisons',
    body: 'Market comparison panels place an app next to category peers on search interest, pricing position, and internal popularity. These comparisons help readers see competitive context; they do not feed into category or overall performance scores.',
  },
  {
    title: 'Pricing position against the market',
    body: 'We compare subscription price, real monthly cost estimates, and per-use charges against the apps in our database. Market pricing context appears in reviews and roundups for value comparison. Structured pricing scores come only from our Pricing category tests.',
  },
  {
    title: 'Data sources',
    body: 'Primary sources include Google Trends (public search interest), our internal analytics, published pricing pages, and our structured test database. We document the source for each market data point shown on a review.',
  },
  {
    title: 'Update frequency',
    body: 'Google Trends and search interest data refresh monthly or when a review is substantially updated. Internal popularity metrics update on a rolling basis. Pricing market position updates when we retest or when competitors change prices.',
  },
  {
    title: 'Calculation methods',
    body: 'Search interest uses Google Trends normalized indices (0–100 scale). Growth percentages compare current and prior twelve-month averages. Internal popularity ranks apps by relative on-site engagement within the same period. All calculations are documented in review footnotes where shown.',
  },
  {
    title: 'Limitations',
    body: 'Google Trends reflects search behavior, not user satisfaction. Internal popularity skews toward apps we cover most prominently. Market data can lag real-world events. We treat all market metrics as directional context with known blind spots.',
  },
  {
    title: 'Why market data does not affect scores',
    body: 'Product scores measure hands-on performance through structured tests. Popularity, search demand, and competitive buzz do not make an app remember context better, generate cleaner images, or protect privacy more effectively. Keeping market data separate preserves score integrity.',
  },
];

export const editorialGuidelinesSections = [
  {
    title: 'Editorial independence',
    body: 'Ratings come from our testing framework, not from manufacturers, affiliate managers, or advertising partners. Companies cannot pay for higher scores, preferred placement in rankings, or positive editorial conclusions. Commercial relationships are disclosed; they do not dictate review outcomes.',
  },
  {
    title: 'Fact-checking',
    body: 'Before publication, reviews are checked against test logs, screenshots, pricing pages, and privacy policies. Claims about features, limits, and costs must match evidence collected during testing. Second reviewers verify score calculations and major factual statements.',
  },
  {
    title: 'Corrections',
    body: 'When we identify factual errors — wrong pricing, outdated features, misquoted policies — we correct the review promptly and note the change where material. Score corrections follow the same process when retesting shows different results. See our correction policy for the full workflow.',
  },
  {
    title: 'Affiliate relationships',
    body: 'Some outbound links earn referral fees. Affiliate income funds testing and editorial work; it does not influence which apps we review, how we test them, or the scores we publish. Affiliate disclosure appears on pages with commercial links.',
  },
  {
    title: 'Review updates',
    body: 'Reviews update when products change meaningfully or when our methodology evolves. Update notes explain what changed — new features, retested scores, corrected facts — and when the review was last verified. Scores may increase or decrease on retest.',
  },
  {
    title: 'Separation from commercial relationships',
    body: 'Sponsored access, press demos, and partnership inquiries do not replace paid-account testing. Free trials alone are not sufficient for a full score. Editorial conclusions, video scripts, and market data commentary are produced independently of affiliate performance metrics.',
  },
];
