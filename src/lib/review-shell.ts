import type { Product } from '../data/products';
import { getTestCategories } from './test-framework';
import { getScoreVisual } from './scores';
import { aiGirlfriendRoundup } from '../data/roundups/ai-girlfriend';
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

/** Approved Overview Quick Facts rows (Figma Review / Quick Facts). */
const QUICK_FACT_ROWS: Array<{ label: string; aliases: string[] }> = [
  { label: 'Character library', aliases: ['character library', 'library size', 'characters'] },
  { label: 'Community-made', aliases: ['community-made', 'community made', 'ugc'] },
  { label: 'Video length', aliases: ['video length', 'max video', 'video duration'] },
  { label: 'Character styles', aliases: ['character styles', 'styles'] },
  { label: 'AI phone calls', aliases: ['ai phone calls', 'voice calls', 'phone calls'] },
  { label: 'Voice messages', aliases: ['voice messages'] },
  { label: 'Discreet billing', aliases: ['discreet billing', 'billing privacy'] },
  { label: 'Free plan', aliases: ['free plan'] },
];

function specValue(product: Product, aliases: string[]): string {
  const specs = product.featureSpecs ?? [];
  for (const spec of specs) {
    if (spec.available === false || !spec.value.trim()) continue;
    const name = spec.name.trim().toLowerCase();
    if (aliases.some((alias) => name === alias || name.includes(alias))) {
      return spec.value.trim();
    }
  }
  return '';
}

function yesNo(value: boolean | undefined): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '';
}

export function getReviewQuickFacts(product: Product): ReviewQuickFact[] {
  const caps = product.capabilities;
  const billing = product.safetyAudit.find((item) =>
    /billing|discreet/i.test(item.label),
  );

  const styleBits: string[] = [];
  if (caps?.realisticCharacters) styleBits.push('Realistic');
  if (caps?.animeCharacters) styleBits.push('Anime');

  const fallbacks: Record<string, string> = {
    'AI phone calls': yesNo(caps?.voiceCalls),
    'Voice messages': yesNo(caps?.voiceMessages),
    'Free plan': yesNo(caps?.freePlan),
    'Character styles':
      styleBits.length > 1 ? String(styleBits.length) : styleBits[0] ?? '',
    'Discreet billing':
      billing?.status && /discreet|yes/i.test(billing.status) ? 'Yes' : billing?.status ?? '',
  };

  const facts: ReviewQuickFact[] = [];
  const usedSpecNames = new Set<string>();
  for (const row of QUICK_FACT_ROWS) {
    const fromSpec = specValue(product, row.aliases);
    const value = fromSpec || fallbacks[row.label] || '';
    if (fromSpec) {
      const match = (product.featureSpecs ?? []).find((spec) =>
        row.aliases.some((alias) => spec.name.trim().toLowerCase().includes(alias)),
      );
      if (match) usedSpecNames.add(match.name);
    }
    if (value) facts.push({ label: row.label, value });
  }
  for (const spec of product.featureSpecs ?? []) {
    if (facts.length >= 8) break;
    if (spec.available === false || !spec.value.trim()) continue;
    if (usedSpecNames.has(spec.name)) continue;
    facts.push({ label: spec.name, value: spec.value.trim() });
  }
  return facts;
}

export function getOverviewHeadline(product: Product): string {
  const tagline = product.tagline?.trim();
  if (tagline) return tagline;
  const summary = product.overallSummary?.trim();
  if (summary) return summary;
  return '';
}

export function authorMobileCredential(educationTitle?: string): string {
  if (!educationTitle) return '';
  if (/AI Ethics/i.test(educationTitle)) return 'M.A. AI Ethics & Society';
  return educationTitle.replace(/^Master’?s in /i, 'M.A. ').split(',')[0].trim();
}

export function uniqueMetaParts(parts: Array<string | undefined>): string {
  const out: string[] = [];
  for (const raw of parts) {
    const part = raw?.trim();
    if (!part) continue;
    const normalized = part.replace(/\s+/g, ' ').toLowerCase();
    if (out.some((existing) => {
      const ex = existing.replace(/\s+/g, ' ').toLowerCase();
      return ex === normalized || ex.includes(normalized) || normalized.includes(ex);
    })) {
      continue;
    }
    out.push(part);
  }
  return out.join(' · ');
}

export function authorRoleLabel(role?: string, profileTitle?: string): string {
  if (profileTitle && /Lead Tester/i.test(profileTitle)) return 'Lead Tester';
  const stripped = role?.replace(/\s*·.*$/, '').trim();
  return stripped || 'Lead Tester';
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

/** File-roundup fallback so the ranking row still renders when InstantDB is empty. */
export function getStaticFeaturedIn(productSlug: string): FeaturedIn[] {
  const roundup = aiGirlfriendRoundup;
  const idx = roundup.picks.findIndex((pick) => pick.slug === productSlug);
  if (idx < 0) return [];
  return [
    {
      title: roundup.title,
      slug: roundup.slug,
      position: idx + 1,
    },
  ];
}

export function resolveFeaturedIn(productSlug: string, items: FeaturedIn[]): FeaturedIn[] {
  if (items.length) return items;
  const fromRoundup = getStaticFeaturedIn(productSlug);
  if (fromRoundup.length) return fromRoundup;
  if (import.meta.env.DEV && productSlug === 'aura-ai') {
    return [
      {
        title: 'Best AI Girlfriend Apps',
        slug: 'ai-girlfriend',
        position: 1,
      },
    ];
  }
  return [];
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
