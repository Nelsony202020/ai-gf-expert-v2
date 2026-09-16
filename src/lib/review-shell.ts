import type { Product } from '../data/products';
import { getTestCategories } from './test-framework';
import { getScoreVisual } from './scores';
import type { FeaturedIn } from './content/store';

export const REVIEW_TAB_IDS = {
  overview: 'overview',
  ratings: 'ratings',
  review: 'review',
  pricing: 'pricing',
  alternatives: 'alternatives',
} as const;

export const HIDDEN_REVIEW_TAB_IDS = {
  photos: 'photos',
  marketData: 'market-data',
} as const;

export type VisibleReviewTabId =
  (typeof REVIEW_TAB_IDS)[keyof typeof REVIEW_TAB_IDS];

export type HiddenReviewTabId =
  (typeof HIDDEN_REVIEW_TAB_IDS)[keyof typeof HIDDEN_REVIEW_TAB_IDS];

export type ReviewTabDef = {
  id: string;
  label: string;
  tocLabel?: string;
};

export const VISIBLE_REVIEW_TABS: ReviewTabDef[] = [
  { id: REVIEW_TAB_IDS.overview, label: 'Overview' },
  { id: REVIEW_TAB_IDS.ratings, label: 'Ratings & Tests', tocLabel: 'Ratings' },
  { id: REVIEW_TAB_IDS.review, label: 'Full Review', tocLabel: 'Review' },
  { id: REVIEW_TAB_IDS.pricing, label: 'Pricing' },
  { id: REVIEW_TAB_IDS.alternatives, label: 'Alternatives' },
];

export const HIDDEN_REVIEW_TABS: ReviewTabDef[] = [
  { id: HIDDEN_REVIEW_TAB_IDS.photos, label: 'Media', tocLabel: 'Photos' },
  { id: HIDDEN_REVIEW_TAB_IDS.marketData, label: 'Market Data' },
];

export function buildReviewTabs(options?: {
  includeMarketData?: boolean;
}): {
  tabs: ReviewTabDef[];
  hiddenTabs: ReviewTabDef[];
} {
  const hiddenTabs = [
    HIDDEN_REVIEW_TABS.find((tab) => tab.id === HIDDEN_REVIEW_TAB_IDS.photos)!,
  ];
  if (options?.includeMarketData) {
    hiddenTabs.push(
      HIDDEN_REVIEW_TABS.find((tab) => tab.id === HIDDEN_REVIEW_TAB_IDS.marketData)!,
    );
  }
  return { tabs: VISIBLE_REVIEW_TABS, hiddenTabs };
}

export function heroGalleryImages(product: Product) {
  if (product.heroGallery?.length) return product.heroGallery;
  if (product.featuredImage) return [product.featuredImage];
  return product.gallery ?? [];
}

export function featuredHeroImage(product: Product) {
  return heroGalleryImages(product)[0] ?? product.featuredImage;
}

export function getScoreBadgeColor(score: number | null | undefined): string {
  if (typeof score !== 'number' || Number.isNaN(score)) return '#8a8991';
  if (score >= 8) return '#16a34a';
  if (score >= 6) return '#e8760a';
  return '#dc2626';
}

export function getScoreRingDeg(score: number | null | undefined): number {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  const clamped = Math.max(0, Math.min(10, score));
  return (clamped / 10) * 360;
}

/** Figma overall score ring stroke color (green / amber / red). */
export function getScoreRingColor(score: number | null | undefined): string {
  return getScoreBadgeColor(score);
}

export function getScoreFillClass(score: number | null | undefined): string {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'bg-gray-400';
  return getScoreVisual(score).bg;
}

export function formatReviewedOn(value: string | Date | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export type ReviewProofMeta = {
  categoryCount: number;
  subscoreCount: number;
};

export function getReviewProofMeta(product: Product): ReviewProofMeta {
  const framework = getTestCategories();
  const productCats = product.categories ?? [];
  const categoryCount = productCats.length || framework.length;
  const subscoreCount =
    productCats.reduce((sum, cat) => sum + (cat.subscores?.length ?? 0), 0) ||
    framework.reduce((sum, cat) => sum + (cat.subscores?.length ?? 0), 0);
  return { categoryCount, subscoreCount };
}

export type ReviewQuickFact = {
  label: string;
  value: string;
};

export function getReviewQuickFacts(product: Product): ReviewQuickFact[] {
  const specs = (product.featureSpecs ?? [])
    .filter((spec) => spec.available !== false && spec.value.trim())
    .map((spec) => ({ label: spec.name, value: spec.value }));
  if (specs.length) return specs;

  const caps = product.capabilities;
  if (!caps) return [];

  const facts: ReviewQuickFact[] = [];
  const yesNo = (value: boolean | undefined) => (value ? 'Yes' : value === false ? 'No' : '');

  const rows: Array<[string, string]> = [
    ['Realistic characters', yesNo(caps.realisticCharacters)],
    ['Anime characters', yesNo(caps.animeCharacters)],
    ['Voice calls', yesNo(caps.voiceCalls)],
    ['Voice messages', yesNo(caps.voiceMessages)],
    ['Token system', yesNo(caps.tokenSystem)],
    ['Free plan', yesNo(caps.freePlan)],
    ['Image generation', yesNo(caps.imageGeneration)],
    ['Video generation', yesNo(caps.videoGeneration)],
  ];
  for (const [label, value] of rows) {
    if (value) facts.push({ label, value });
  }
  return facts;
}

export function featuredInHref(item: FeaturedIn): string {
  return `/best/${item.slug}`;
}

export function featuredInDesktopLabel(item: FeaturedIn): string {
  if (item.position != null) return `${item.title} · #${item.position}`;
  return item.awardLabel ? `${item.title} · ${item.awardLabel}` : item.title;
}

export function featuredInMobileLabel(item: FeaturedIn): string {
  if (item.position != null) return `#${item.position} in ${item.title}`;
  return item.awardLabel ? `${item.awardLabel} · ${item.title}` : item.title;
}

export const featuredInLabel = featuredInDesktopLabel;

export function getBestFeaturedIn(items: FeaturedIn[]): FeaturedIn | null {
  if (!items.length) return null;
  const ranked = items.filter((item) => item.position != null);
  if (ranked.length) {
    return ranked.reduce((best, item) =>
      (item.position ?? Infinity) < (best.position ?? Infinity) ? item : best,
    );
  }
  return items[0];
}

export const getScoreRingSweep = getScoreRingDeg;

export const CATEGORY_ROW_ICONS: Record<string, string> = {
  characters: 'users',
  customization: 'sliders',
  chat: 'message',
  'chat-features': 'layers',
  images: 'image',
  video: 'video',
  privacy: 'shield',
  pricing: 'credit-card',
};

export function categoryRowIcon(id: string): string {
  return CATEGORY_ROW_ICONS[id] ?? 'info';
}
