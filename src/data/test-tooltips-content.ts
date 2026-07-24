export type TestTooltipUsageItem = {
  icon: string;
  label: string;
};

export type TestTooltipPartItem = {
  n: number;
  icon: string;
  anchorId: string;
  label: string;
  desc: string;
};

export const testTooltipsTocSections = [
  { id: 'why-tooltips', label: 'Why we use tooltips' },
  { id: 'product-info', label: 'Product information tooltips' },
  { id: 'overall', label: 'Overall performance tooltips' },
  { id: 'category', label: 'Category score tooltips' },
  { id: 'subscore', label: 'Subscore tooltips' },
  { id: 'additional-info', label: 'Additional information tooltips' },
  { id: 'faq', label: 'FAQ' },
];

export const testTooltipsRelatedMethodology = [
  { label: 'How our scores work', href: '/test/' },
  { label: 'Editorial standards', href: '/editorial-guidelines/' },
];

export const testTooltipsProductUsage: TestTooltipUsageItem[] = [
  { icon: 'apps', label: 'Used in app directories' },
  { icon: 'home', label: 'Used on our homepage' },
];

export const testTooltipsProductParts: TestTooltipPartItem[] = [
  {
    n: 1,
    icon: 'smart_toy',
    anchorId: 'product-part-1',
    label: 'Product summary',
    desc: 'A short description of what the platform is and how it is positioned.',
  },
  {
    n: 2,
    icon: 'group',
    anchorId: 'product-part-2',
    label: 'Best for',
    desc: 'Who the platform suits best and the kind of experience it is built around.',
  },
  {
    n: 3,
    icon: 'warning',
    anchorId: 'product-part-3',
    label: 'Watch out for',
    desc: 'An important limitation or trade-off worth knowing before you sign up.',
  },
];

export const testTooltipsOverallUsage: TestTooltipUsageItem[] = [
  { icon: 'rate_review', label: 'Used on review pages' },
  { icon: 'leaderboard', label: 'Used on roundup pages' },
  { icon: 'info', label: 'Opens from score icon' },
];

export type TestTooltipAnnotationItem = {
  n: number;
  icon: string;
  label: string;
  desc: string;
};

export type TestTooltipAnnotationConnector = {
  n: string;
  side: 'left' | 'right' | 'above';
};

export type TestTooltipAnnotationCalloutPlacement = {
  n: number;
  row: 'top' | 'bottom' | 'middle';
};

export type TestTooltipAboveCalloutPlacement = {
  n: number;
  align: 'left' | 'right';
};

export const testTooltipsProductAnnotations: TestTooltipAnnotationItem[] = [
  {
    n: 1,
    icon: 'smart_toy',
    label: 'Product summary',
    desc: 'A short description of what the platform is and how it is positioned.',
  },
  {
    n: 2,
    icon: 'group',
    label: 'Best for',
    desc: 'Who the platform suits best and the kind of experience it is built around.',
  },
  {
    n: 3,
    icon: 'warning',
    label: 'Watch out for',
    desc: 'An important limitation or trade-off worth knowing before you sign up.',
  },
];

export const testTooltipsCategoryAnnotations: TestTooltipAnnotationItem[] = [
  {
    n: 1,
    icon: 'description',
    label: 'Quick explanation',
    desc: 'The app’s score for that category.',
  },
  {
    n: 2,
    icon: 'monitoring',
    label: 'Site average',
    desc: 'The average category score across all the apps we have reviewed.',
  },
  {
    n: 3,
    icon: 'splitscreen',
    label: 'Subscores',
    desc: 'The subscores that make up the category rating.',
  },
  {
    n: 4,
    icon: 'bar_chart',
    label: 'Score distribution',
    desc: 'A score distribution showing how the app compares with other apps.',
  },
];

export const testTooltipsSubscoreAnnotations: TestTooltipAnnotationItem[] = [
  {
    n: 1,
    icon: 'description',
    label: 'Quick explanation',
    desc: 'A quick explanation of what the subscore measures.',
  },
  {
    n: 2,
    icon: 'monitoring',
    label: 'Subscore and average',
    desc: 'The app’s subscore and the average subscore across all the apps we have reviewed.',
  },
  {
    n: 3,
    icon: 'fact_check',
    label: 'Evidence points',
    desc: 'The evidence used to calculate the score.',
  },
  {
    n: 4,
    icon: 'bar_chart',
    label: 'Score distribution',
    desc: 'A score distribution comparing the app with others.',
  },
];

export const testTooltipsOverallAnnotations: TestTooltipAnnotationItem[] = [
  {
    n: 1,
    icon: 'description',
    label: 'Quick explanation',
    desc: 'What the rating stands for at a glance.',
  },
  {
    n: 2,
    icon: 'monitoring',
    label: 'Overall score and average',
    desc: 'The app’s score compared with the average across tested apps.',
  },
  {
    n: 3,
    icon: 'account_tree',
    label: 'Score roadmap',
    desc: 'Shows how the overall score connects to categories, subscores, and evidence.',
  },
  {
    n: 4,
    icon: 'grid_view',
    label: 'Category scores',
    desc: 'Performance across the eight main categories.',
  },
];

export const testTooltipsOverallParts: TestTooltipPartItem[] = [
  {
    n: 1,
    icon: 'description',
    anchorId: 'overall-part-1',
    label: 'Quick explanation',
    desc: 'What the rating stands for at a glance.',
  },
  {
    n: 2,
    icon: 'monitoring',
    anchorId: 'overall-part-2',
    label: 'Overall score and average',
    desc: 'The app’s score compared with the average across tested apps.',
  },
  {
    n: 3,
    icon: 'account_tree',
    anchorId: 'overall-part-3',
    label: 'Score roadmap',
    desc: 'Shows how the overall score connects to categories, subscores, and evidence.',
  },
  {
    n: 4,
    icon: 'grid_view',
    anchorId: 'overall-part-4',
    label: 'Category scores',
    desc: 'Performance across the eight main categories.',
  },
];

export const testTooltipsCategoryUsage: TestTooltipUsageItem[] = [
  { icon: 'rate_review', label: 'Used on review pages' },
  { icon: 'leaderboard', label: 'Used on roundup pages' },
  { icon: 'info', label: 'Opens from category score icon' },
];

export const testTooltipsCategoryParts: TestTooltipPartItem[] = [
  {
    n: 1,
    icon: 'description',
    anchorId: 'category-part-1',
    label: 'Category score',
    desc: 'The app’s score for that category.',
  },
  {
    n: 2,
    icon: 'monitoring',
    anchorId: 'category-part-2',
    label: 'Site average',
    desc: 'The average category score across all the apps we have reviewed.',
  },
  {
    n: 3,
    icon: 'splitscreen',
    anchorId: 'category-part-3',
    label: 'Subscores',
    desc: 'The subscores that make up the category rating.',
  },
  {
    n: 4,
    icon: 'bar_chart',
    anchorId: 'category-part-4',
    label: 'Score distribution',
    desc: 'A score distribution showing how the app compares with other apps.',
  },
];

export const testTooltipsSubscoreUsage: TestTooltipUsageItem[] = [
  { icon: 'rate_review', label: 'Used on review pages' },
  { icon: 'leaderboard', label: 'Used on roundup pages' },
  { icon: 'info', label: 'Opens from subscore icon' },
];

export const testTooltipsSubscoreParts: TestTooltipPartItem[] = [
  {
    n: 1,
    icon: 'description',
    anchorId: 'subscore-part-1',
    label: 'Subscore definition',
    desc: 'A quick explanation of what the subscore measures.',
  },
  {
    n: 2,
    icon: 'monitoring',
    anchorId: 'subscore-part-2',
    label: 'Subscore and average',
    desc: 'The app’s subscore and the average subscore across all the apps we have reviewed.',
  },
  {
    n: 3,
    icon: 'fact_check',
    anchorId: 'subscore-part-3',
    label: 'Evidence points',
    desc: 'The evidence used to calculate the score.',
  },
  {
    n: 4,
    icon: 'bar_chart',
    anchorId: 'subscore-part-4',
    label: 'Score distribution',
    desc: 'A score distribution comparing the app with others.',
  },
];

export const testTooltipsFaq = [
  {
    q: 'Why not show all methodology directly on every review?',
    a: 'Reviews already contain a large amount of testing data. Tooltips let us keep pages scannable while still giving curious readers a clear path to the full methodology when they want it.',
  },
  {
    q: 'Do tooltips affect the score?',
    a: 'No. Tooltips explain scores. They do not calculate, change, or override any rating.',
  },
  {
    q: 'Are tooltip results updated when reviews change?',
    a: 'Yes. When we retest an app or update methodology, the underlying score data changes and the tooltip content reflects the current result.',
  },
  {
    q: 'Can I open tooltips on mobile?',
    a: 'Yes. On touch devices, tooltips open after tapping the info icon and can be dismissed without leaving the page.',
  },
  {
    q: 'Where can I see the complete testing methodology?',
    a: 'Start with our main testing hub at /test/, then follow category, subscore, and evidence links from any tooltip or review ratings tab.',
  },
];
