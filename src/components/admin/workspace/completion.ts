// Shared product completion service.
//
// ONE place computes overall completion, per-tab completion, and the list of
// missing required/recommended items (each with a direct tab target). Every
// workspace tab and the shared header read from this — tabs never compute
// their own separate percentages.

import type { EntityRow } from '../api';
import { isHeroMedia } from '../../../lib/media/catalog';
import { isMissingAltText } from '../../../lib/media/altText';
import { SETUP_CHARACTER_CAPABILITIES } from '../productCapabilities';

export const WORKSPACE_TABS = [
  { id: 'setup', label: 'Setup' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'testing', label: 'Testing' },
  { id: 'verdict', label: 'Verdict' },
  { id: 'review', label: 'Review' },
  { id: 'media', label: 'Media' },
  { id: 'characters', label: 'Characters' },
  { id: 'seo', label: 'SEO' },
  { id: 'publish', label: 'Publish' },
] as const;

export type WorkspaceTabId = (typeof WORKSPACE_TABS)[number]['id'];

export interface CompletionInput {
  fields: Record<string, unknown>;
  links: Record<string, string | null>;
  /** Related records already scoped to this product. */
  testRuns: EntityRow[];
  plans: EntityRow[];
  paymentProfile: EntityRow | null;
  characters: EntityRow[];
  media: EntityRow[];
  affiliateLinks: EntityRow[];
  review: EntityRow | null;
}

export interface MissingItem {
  key: string;
  label: string;
  severity: 'required' | 'recommended';
  tab: WorkspaceTabId;
}

export interface TabCompletion {
  id: WorkspaceTabId;
  label: string;
  /** null = optional tab (no completion tracking, e.g. Characters). */
  pct: number | null;
  filled: number;
  total: number;
  missingRequired: MissingItem[];
  missingRecommended: MissingItem[];
  /** Publish tab only: blocked while required items are missing. */
  blocked?: boolean;
}

/** Visual status for tab nav indicators (header + sidebar). */
export type TabVisualStatus = 'complete' | 'attention' | 'not_started' | 'blocked';

/** Tabs where recommended checks still matter for the yellow indicator. */
const RECOMMENDED_TRACKED_TABS = new Set<WorkspaceTabId>(['pricing', 'review', 'seo']);

export function tabVisualStatus(tab: TabCompletion): TabVisualStatus {
  if (tab.id === 'publish') {
    if (tab.pct === 100) return 'complete';
    if (tab.blocked) return 'blocked';
    return 'not_started';
  }
  if (tab.pct === null) return 'not_started';
  if (tab.pct === 100) return 'complete';
  if (tab.missingRequired.length > 0) return 'attention';
  if (tab.filled === 0) {
    if (tab.id === 'pricing') return 'attention';
    return 'not_started';
  }
  if (RECOMMENDED_TRACKED_TABS.has(tab.id) && tab.missingRecommended.length > 0) {
    return 'attention';
  }
  // Required complete — green even when optional/recommended items remain (setup, verdict, …).
  return 'complete';
}

export interface ProductCompletion {
  overallPct: number;
  missingRequired: MissingItem[];
  missingRecommended: MissingItem[];
  tabs: TabCompletion[];
  tabById: Record<WorkspaceTabId, TabCompletion>;
}

interface Check {
  key: string;
  label: string;
  severity: 'required' | 'recommended';
  done: (i: CompletionInput) => boolean;
}

const STALE_PRICE_DAYS = 60;
const MIN_CHARACTERS_FOR_COMPLETE = 3;

function activeMedia(media: EntityRow[]): EntityRow[] {
  return media.filter((m) => !m.deletedAt);
}

function mediaNeedingAlt(m: EntityRow): boolean {
  return m.mediaType !== 'video';
}

function activeCharacters(characters: EntityRow[]): EntityRow[] {
  return characters.filter((c) => !c.deletedAt && c.active !== false);
}

function textFilled(v: unknown): boolean {
  return v !== undefined && v !== null && String(v).trim() !== '';
}

function arrayFilled(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0;
}

const SETUP_CHECKS: Check[] = [
  { key: 'name', label: 'Product name', severity: 'required', done: (i) => textFilled(i.fields.name) },
  { key: 'slug', label: 'Slug', severity: 'required', done: (i) => textFilled(i.fields.slug) },
  { key: 'websiteUrl', label: 'Official website URL', severity: 'required', done: (i) => textFilled(i.fields.websiteUrl) },
  { key: 'logo', label: 'Product logo', severity: 'required', done: (i) => Boolean(i.links.logo) },
  { key: 'author', label: 'Author', severity: 'required', done: (i) => Boolean(i.links.author) },
  { key: 'tagline', label: 'Tagline', severity: 'recommended', done: (i) => textFilled(i.fields.tagline) },
  { key: 'featuredImage', label: 'Featured image', severity: 'recommended', done: (i) => Boolean(i.links.featuredImage) },
  { key: 'youtubeReviewUrl', label: 'YouTube review URL', severity: 'recommended', done: (i) => textFilled(i.fields.youtubeReviewUrl) },
  { key: 'factChecker', label: 'Fact checker', severity: 'recommended', done: (i) => Boolean(i.links.factChecker) },
  {
    key: 'affiliateLink',
    label: 'Active affiliate link',
    severity: 'recommended',
    done: (i) => i.affiliateLinks.some((l) => l.active),
  },
  {
    key: 'capabilities',
    label: 'Character options reviewed',
    severity: 'recommended',
    done: (i) =>
      SETUP_CHARACTER_CAPABILITIES.some(
        (c) => i.fields[c.name] !== undefined && i.fields[c.name] !== null,
      ),
  },
];

const TESTING_CHECKS: Check[] = [
  {
    key: 'testRunStarted',
    label: 'Test run started',
    severity: 'recommended',
    done: (i) => i.testRuns.length > 0,
  },
  {
    key: 'publishedTestRun',
    label: 'Published test run',
    severity: 'required',
    done: (i) => i.testRuns.some((r) => r.isCurrentPublished),
  },
];

const VERDICT_CHECKS: Check[] = [
  { key: 'oneLineVerdict', label: 'One-line verdict', severity: 'required', done: (i) => textFilled(i.fields.oneLineVerdict) },
  { key: 'ourTake', label: '"Our Take"', severity: 'required', done: (i) => textFilled(i.fields.ourTake) },
  { key: 'pros', label: 'At least one pro', severity: 'recommended', done: (i) => arrayFilled(i.fields.pros) },
  { key: 'cons', label: 'At least one con', severity: 'recommended', done: (i) => arrayFilled(i.fields.cons) },
  {
    key: 'bestFor',
    label: 'Best for (at least one)',
    severity: 'recommended',
    done: (i) => arrayFilled(i.fields.bestFor) || textFilled(i.fields.recommendedFor),
  },
  {
    key: 'notIdealFor',
    label: 'Not ideal for (at least one)',
    severity: 'recommended',
    done: (i) => arrayFilled(i.fields.notIdealFor) || textFilled(i.fields.notRecommendedFor),
  },
  { key: 'mainStrength', label: 'Main strength', severity: 'recommended', done: (i) => textFilled(i.fields.mainStrength) },
  { key: 'mainLimitation', label: 'Main limitation', severity: 'recommended', done: (i) => textFilled(i.fields.mainLimitation) },
  { key: 'directoryDescription', label: 'Short directory description', severity: 'recommended', done: (i) => textFilled(i.fields.directoryDescription) },
  {
    key: 'categoryVerdicts',
    label: 'Category verdicts',
    severity: 'recommended',
    done: (i) => {
      const cv = i.fields.categoryVerdicts;
      if (!cv || typeof cv !== 'object') return false;
      return Object.values(cv as Record<string, { verdict?: string }>).some((v) => textFilled(v?.verdict));
    },
  },
];

function reviewHasContent(review: EntityRow | null): boolean {
  if (!review) return false;
  if (Array.isArray(review.blocks) && review.blocks.length > 0) return true;
  if (Array.isArray(review.sections) && review.sections.length > 0) return true;
  return textFilled(review.intro);
}

const REVIEW_CHECKS: Check[] = [
  {
    key: 'reviewWritten',
    label: 'Written review article',
    severity: 'recommended',
    done: (i) => reviewHasContent(i.review),
  },
];

const MEDIA_CHECKS: Check[] = [
  {
    key: 'featuredImage',
    label: 'Featured image',
    severity: 'recommended',
    done: (i) =>
      Boolean(i.links.featuredImage) || activeMedia(i.media).some((m) => isHeroMedia(m)),
  },
  {
    key: 'altText',
    label: 'Alt text on all images',
    severity: 'recommended',
    done: (i) => {
      const images = activeMedia(i.media).filter(mediaNeedingAlt);
      return images.length > 0 && images.every((m) => !isMissingAltText(m.altText));
    },
  },
  {
    key: 'galleryMedia',
    label: 'Approved public gallery media',
    severity: 'recommended',
    done: (i) =>
      activeMedia(i.media).some(
        (m) => (m.role === 'gallery' || m.role === 'character') && m.approved,
      ),
  },
];

const CHARACTERS_CHECKS: Check[] = [
  {
    key: 'minCharacters',
    label: `At least ${MIN_CHARACTERS_FOR_COMPLETE} characters`,
    severity: 'recommended',
    done: (i) => activeCharacters(i.characters).length >= MIN_CHARACTERS_FOR_COMPLETE,
  },
];

const PRICING_CHECKS: Check[] = [
  {
    key: 'activePlan',
    label: 'Active pricing plan',
    severity: 'recommended',
    done: (i) => i.plans.some((p) => p.active),
  },
  {
    key: 'paymentProfile',
    label: 'Payment-methods profile',
    severity: 'recommended',
    done: (i) => Boolean(i.paymentProfile),
  },
  {
    key: 'freshPricing',
    label: `Prices verified in the last ${STALE_PRICE_DAYS} days`,
    severity: 'recommended',
    done: (i) => {
      const active = i.plans.filter((p) => p.active);
      if (active.length === 0) return false;
      const cutoff = Date.now() - STALE_PRICE_DAYS * 24 * 60 * 60 * 1000;
      return active.every((p) => p.lastVerifiedAt && p.lastVerifiedAt >= cutoff);
    },
  },
];

const SEO_CHECKS: Check[] = [
  { key: 'seoTitle', label: 'SEO title', severity: 'required', done: (i) => textFilled(i.fields.seoTitle) },
  { key: 'seoDescription', label: 'Meta description', severity: 'required', done: (i) => textFilled(i.fields.seoDescription) },
  { key: 'ogTitle', label: 'Open Graph title', severity: 'recommended', done: (i) => textFilled(i.fields.ogTitle) || textFilled(i.fields.seoTitle) },
  { key: 'ogDescription', label: 'Open Graph description', severity: 'recommended', done: (i) => textFilled(i.fields.ogDescription) || textFilled(i.fields.seoDescription) },
  {
    key: 'socialImage',
    label: 'Social sharing image',
    severity: 'recommended',
    done: (i) =>
      textFilled(i.fields.ogImageUrl) || textFilled(i.fields.socialImageUrl) || Boolean(i.links.featuredImage),
  },
];

const TAB_CHECKS: Partial<Record<WorkspaceTabId, Check[]>> = {
  setup: SETUP_CHECKS,
  testing: TESTING_CHECKS,
  verdict: VERDICT_CHECKS,
  review: REVIEW_CHECKS,
  media: MEDIA_CHECKS,
  characters: CHARACTERS_CHECKS,
  pricing: PRICING_CHECKS,
  seo: SEO_CHECKS,
};

/** Tabs with no completion tracking. */
const OPTIONAL_TABS: WorkspaceTabId[] = [];

export function computeProductCompletion(input: CompletionInput): ProductCompletion {
  const tabs: TabCompletion[] = [];
  const missingRequired: MissingItem[] = [];
  const missingRecommended: MissingItem[] = [];
  let filledTotal = 0;
  let checkTotal = 0;

  for (const { id, label } of WORKSPACE_TABS) {
    if (id === 'publish') continue;

    if (OPTIONAL_TABS.includes(id)) {
      tabs.push({ id, label, pct: null, filled: 0, total: 0, missingRequired: [], missingRecommended: [] });
      continue;
    }

    const checks = TAB_CHECKS[id] ?? [];
    const tabMissingRequired: MissingItem[] = [];
    const tabMissingRecommended: MissingItem[] = [];
    let filled = 0;

    for (const check of checks) {
      const done = check.done(input);
      if (done) filled++;
      else {
        const item: MissingItem = { key: check.key, label: check.label, severity: check.severity, tab: id };
        if (check.severity === 'required') tabMissingRequired.push(item);
        else tabMissingRecommended.push(item);
      }
    }

    filledTotal += filled;
    checkTotal += checks.length;
    missingRequired.push(...tabMissingRequired);
    missingRecommended.push(...tabMissingRecommended);

    tabs.push({
      id,
      label,
      pct: checks.length === 0 ? 100 : Math.round((filled / checks.length) * 100),
      filled,
      total: checks.length,
      missingRequired: tabMissingRequired,
      missingRecommended: tabMissingRecommended,
    });
  }

  // Publish tab: blocked while any required item is missing anywhere.
  const blocked = missingRequired.length > 0;
  const publishTab: TabCompletion = {
    id: 'publish',
    label: 'Publish',
    pct: input.fields.status === 'published' ? 100 : null,
    filled: 0,
    total: 0,
    missingRequired: [],
    missingRecommended: [],
    blocked,
  };
  tabs.push(publishTab);

  const tabById = Object.fromEntries(tabs.map((t) => [t.id, t])) as Record<WorkspaceTabId, TabCompletion>;

  return {
    overallPct: checkTotal === 0 ? 0 : Math.round((filledTotal / checkTotal) * 100),
    missingRequired,
    missingRecommended,
    tabs,
    tabById,
  };
}

/** Route for a workspace tab. */
export function workspaceTabPath(productId: string, tab: WorkspaceTabId): string {
  return `/products/${productId}/${tab}`;
}

export function fmtRelativeTime(ms?: number | null): string {
  if (!ms) return '—';
  const diff = Date.now() - Number(ms);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(Number(ms)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
