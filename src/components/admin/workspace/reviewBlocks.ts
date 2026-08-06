// Review block model shared by the workspace editor. Mirrors the server-side
// whitelist in src/lib/validation/schemas.ts (REVIEW_BLOCK_TYPES) — editors
// can only compose these approved blocks; no raw HTML, scripts, or styling.

import type { EntityRow } from '../api';

export type ReviewBlockType =
  | 'paragraph'
  | 'h2'
  | 'h3'
  | 'bulletList'
  | 'numberedList'
  | 'image'
  | 'video'
  | 'table'
  | 'quote'
  | 'callout'
  | 'prosCons'
  | 'faq'
  | 'relatedGuide'
  | 'cta'
  | 'scoreOverall'
  | 'scoreCategory'
  | 'pricingTable'
  | 'characterGallery'
  | 'publicGallery'
  | 'evidenceSummary'
  | 'methodologyLink';

export interface ReviewBlock {
  id: string;
  type: ReviewBlockType;
  data?: Record<string, unknown>;
}

export function newBlockId(): string {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export function makeBlock(type: ReviewBlockType, data: Record<string, unknown> = {}): ReviewBlock {
  return { id: newBlockId(), type, data };
}

export interface BlockMeta {
  type: ReviewBlockType;
  label: string;
  icon: string;
  group: 'Text' | 'Media' | 'Structured' | 'Dynamic data';
  dynamic?: boolean;
  description?: string;
}

export const BLOCK_META: BlockMeta[] = [
  { type: 'paragraph', label: 'Paragraph', icon: 'notes', group: 'Text' },
  { type: 'h2', label: 'Heading (H2)', icon: 'format_h2', group: 'Text' },
  { type: 'h3', label: 'Heading (H3)', icon: 'format_h3', group: 'Text' },
  { type: 'bulletList', label: 'Bullet list', icon: 'format_list_bulleted', group: 'Text' },
  { type: 'numberedList', label: 'Numbered list', icon: 'format_list_numbered', group: 'Text' },
  { type: 'quote', label: 'Quote', icon: 'format_quote', group: 'Text' },
  { type: 'callout', label: 'Callout', icon: 'lightbulb', group: 'Text' },
  { type: 'image', label: 'Image', icon: 'image', group: 'Media' },
  { type: 'video', label: 'Video', icon: 'smart_display', group: 'Media' },
  { type: 'table', label: 'Table', icon: 'table', group: 'Structured' },
  { type: 'prosCons', label: 'Pros and cons', icon: 'thumbs_up_down', group: 'Structured' },
  { type: 'faq', label: 'FAQ', icon: 'quiz', group: 'Structured' },
  { type: 'relatedGuide', label: 'Related guide', icon: 'menu_book', group: 'Structured' },
  { type: 'cta', label: 'CTA button', icon: 'ads_click', group: 'Structured' },
  {
    type: 'scoreOverall',
    label: 'Overall score',
    icon: 'star',
    group: 'Dynamic data',
    dynamic: true,
    description: 'Renders the current published overall score.',
  },
  {
    type: 'scoreCategory',
    label: 'Category score',
    icon: 'grade',
    group: 'Dynamic data',
    dynamic: true,
    description: 'Renders one category score from the published test run.',
  },
  {
    type: 'pricingTable',
    label: 'Pricing table',
    icon: 'payments',
    group: 'Dynamic data',
    dynamic: true,
    description: 'Renders active pricing plans — never duplicate prices in copy.',
  },
  {
    type: 'characterGallery',
    label: 'Character gallery',
    icon: 'group',
    group: 'Dynamic data',
    dynamic: true,
    description: 'Renders the product’s active characters.',
  },
  {
    type: 'publicGallery',
    label: 'Public gallery',
    icon: 'photo_library',
    group: 'Dynamic data',
    dynamic: true,
    description: 'Renders approved public gallery media.',
  },
  {
    type: 'evidenceSummary',
    label: 'Evidence summary',
    icon: 'fact_check',
    group: 'Dynamic data',
    dynamic: true,
    description: 'Renders published test evidence (optionally one category).',
  },
  {
    type: 'methodologyLink',
    label: 'Methodology link',
    icon: 'link',
    group: 'Dynamic data',
    dynamic: true,
    description: 'Links to the testing methodology page.',
  },
];

export function blockMeta(type: ReviewBlockType): BlockMeta {
  return BLOCK_META.find((m) => m.type === type) ?? BLOCK_META[0];
}

/** Section headings for the admin “Start from template” review outline. */
export function reviewTemplateHeadings(productName: string): string[] {
  const name = productName.trim() || 'This App';
  return [
    'First Impressions',
    'Meeting the AI Girlfriends',
    'Chat and NSFW Roleplay',
    'Images, Videos and Voice',
    `What ${name} Does Best`,
    'What Annoyed Me',
    'What It Really Costs',
    'My Final Take',
  ];
}

/** Default review template. Sections can be reordered, renamed, or removed. */
export function buildDefaultTemplate(productName = ''): ReviewBlock[] {
  return reviewTemplateHeadings(productName).flatMap((heading) => [
    makeBlock('h3', { text: heading }),
    makeBlock('paragraph', { text: '' }),
  ]);
}

/** Persist section headings as H3 blocks (page title is the only H2 on the public review). */
export function normalizeReviewHeadingLevels(blocks: ReviewBlock[]): ReviewBlock[] {
  return blocks.map((block) => (block.type === 'h2' ? { ...block, type: 'h3' } : block));
}

/** @deprecated Prefer reviewTemplateHeadings — category-scored outline kept for reference. */
export function buildCategoryScoredTemplate(categories: EntityRow[]): ReviewBlock[] {
  const bySlugOrName = (needle: string): string => {
    const lower = needle.toLowerCase();
    const cat = categories.find(
      (c) => String(c.slug).toLowerCase() === lower || String(c.name).toLowerCase() === lower,
    );
    return cat ? String(cat.slug) : '';
  };

  const section = (heading: string, extras: ReviewBlock[] = []): ReviewBlock[] => [
    makeBlock('h3', { text: heading }),
    makeBlock('paragraph', { text: '' }),
    ...extras,
  ];

  return [
    ...section('Introduction', [makeBlock('scoreOverall')]),
    ...section('Character Selection', [
      makeBlock('scoreCategory', { categorySlug: bySlugOrName('characters') }),
      makeBlock('characterGallery'),
    ]),
    ...section('Character Customization', [
      makeBlock('scoreCategory', { categorySlug: bySlugOrName('customization') }),
    ]),
    ...section('Chat Experience', [makeBlock('scoreCategory', { categorySlug: bySlugOrName('chat') })]),
    ...section('Chat Features', [
      makeBlock('scoreCategory', { categorySlug: bySlugOrName('chat-features') || bySlugOrName('chat features') }),
    ]),
    ...section('Image Generation', [
      makeBlock('scoreCategory', { categorySlug: bySlugOrName('images') }),
      makeBlock('publicGallery'),
    ]),
    ...section('Video Generation', [makeBlock('scoreCategory', { categorySlug: bySlugOrName('video') })]),
    ...section('Privacy', [makeBlock('scoreCategory', { categorySlug: bySlugOrName('privacy') })]),
    ...section('Pricing', [
      makeBlock('scoreCategory', { categorySlug: bySlugOrName('pricing') }),
      makeBlock('pricingTable'),
    ]),
    ...section('Final Verdict', [
      makeBlock('prosCons', { source: 'product' }),
      makeBlock('cta', { label: 'Try it now' }),
      makeBlock('methodologyLink'),
    ]),
  ];
}