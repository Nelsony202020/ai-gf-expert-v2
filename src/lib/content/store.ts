// Public-page content store.
//
// Pages keep rendering the exact same `Product` / `Roundup` shapes they use
// today, but published product data comes from InstantDB when configured.
// `loadPublishedProducts()` is the canonical loader for reviews, tooltips,
// nav, and sitemap. USE_DB_CONTENT still gates some editorial overlays
// (homepage slots) that predate the full DB migration.

import type {
  Product,
  Author,
  GalleryImage,
  RatingCategory,
  Subscore,
  DataRow,
  SafetyItem,
  FeatureSpec,
  RatingChangelogEntry,
  VerdictItem,
} from '../../data/products';
import { getSubscoreDescription, getCategoryTooltipDescription } from '../../data/subscore-descriptions';
import { getDb, isDbConfigured } from '../db/server';
import { env } from '../env';
import { lowestPlainMonthlyPrice } from '../pricing/calc';
import {
  getMediaPlacement,
  isHeroMedia,
  isPublicMedia,
  productMediaItems,
  collectProductMediaRows,
  sortGalleryMedia,
  sortHeroMedia,
  buildMediaLookup,
} from '../media/catalog';
import { resolveMediaUrl, isUsablePublicMediaUrl } from '../media/url';

/** Fixed public category order — matches methodology template. */
const CATEGORY_DISPLAY_ORDER = [
  'characters',
  'customization',
  'chat',
  'chat-features',
  'images',
  'video',
  'privacy',
  'pricing',
] as const;

function categorySortKey(slug: string, detail?: { displayOrder?: number }): number {
  const fromDetail = detail?.displayOrder;
  if (fromDetail != null && !Number.isNaN(fromDetail)) return fromDetail;
  const idx = CATEGORY_DISPLAY_ORDER.indexOf(slug as (typeof CATEGORY_DISPLAY_ORDER)[number]);
  return idx >= 0 ? idx : 999;
}
import { formatAudienceList, splitLegacyLines } from '../cms/format';
import { mapCharacterForPublic, selectPublicHighlightCharacters } from '../characters/public';
import { affiliateRel, DEFAULT_AFFILIATE_REL } from '../affiliate/rel';
import { cdnAsset } from '../media/cdn';
import { buildGroupedContributors } from '../ratings/groupContributors';
import type { Roundup, RoundupPick } from '../../data/roundups/ai-girlfriend';
import { hydrateRoundupPicks, minimalRoundupPickFromProduct } from './roundupPick';
import { launchCompareDefaultIds } from './launchProducts';
import { isDevReviewSlug } from './reviewDevProducts';

export type ProductDbPublishStatus = 'published' | 'draft' | 'missing';

export function useDbContent(): boolean {
  const flag = env('USE_DB_CONTENT') ?? '';
  return (flag === '1' || flag === 'true') && isDbConfigured();
}

function fmtDate(ms?: number | string | null): string {
  if (!ms) return '';
  const d = new Date(typeof ms === 'string' ? ms : Number(ms));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function youtubeIdFromUrl(url: string): string | null {
  const m =
    url.match(/[?&]v=([\w-]{6,})/) ??
    url.match(/youtu\.be\/([\w-]{6,})/) ??
    url.match(/\/embed\/([\w-]{6,})/);
  return m?.[1] ?? null;
}

function youtubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const id = youtubeIdFromUrl(trimmed);
  if (id) return `https://www.youtube.com/embed/${id}`;
  if (trimmed.includes('/embed/')) return trimmed;
  return null;
}

function buildOverallVerdict(
  dbProduct: any,
  overallScore: number | null,
  fileFallback?: Product,
): VerdictItem | null {
  const fileOverall = fileFallback?.verdicts?.find((v) => v.id === 'overall');
  const tagline = String(
    dbProduct.oneLineVerdict ?? fileFallback?.overallSummary ?? fileOverall?.tagline ?? '',
  ).trim();
  const summary = String(
    dbProduct.ourTake ?? fileFallback?.ourTake ?? fileOverall?.summary ?? '',
  ).trim();
  const pros = Array.isArray(dbProduct.pros)
    ? dbProduct.pros.map((p: string) => String(p).trim()).filter(Boolean)
    : (fileOverall?.pros ?? []);
  const cons = Array.isArray(dbProduct.cons)
    ? dbProduct.cons.map((c: string) => String(c).trim()).filter(Boolean)
    : (fileOverall?.cons ?? []);

  if (pros.length === 0 && dbProduct.mainStrength?.trim()) {
    pros.push(String(dbProduct.mainStrength).trim());
  }
  if (cons.length === 0 && dbProduct.mainLimitation?.trim()) {
    cons.push(String(dbProduct.mainLimitation).trim());
  }

  if (!tagline && !summary && pros.length === 0 && cons.length === 0) return null;

  return {
    id: 'overall',
    label: 'Overall Performance',
    tagline: tagline || undefined,
    summary,
    pros,
    cons,
    score: overallScore ?? undefined,
  };
}

function mapAuthor(a: any): Author {
  return {
    name: a?.name ?? 'Editorial Team',
    role: a?.role ?? 'Reviewer',
    avatar: a?.avatarUrl ? String(a.avatarUrl) : cdnAsset('/brand/herman-main-icon.svg'),
    verified: a?.verified ?? undefined,
    slug: a?.slug ?? undefined,
  };
}

/** Map one DB product (with links + snapshots) onto the site's Product shape. */
function resolveVideoReview(dbProduct: {
  youtubeReviewUrl?: string | null;
}): Product['videoReview'] {
  const raw = String(dbProduct.youtubeReviewUrl ?? '').trim();
  if (!raw) return undefined;
  const embed = youtubeEmbedUrl(raw);
  if (!embed) return undefined;
  return { embedUrl: embed, channelUrl: raw };
}

function mapProduct(
  dbProduct: any,
  fileFallback: Product | undefined,
  opts?: { preview?: boolean },
): Product | null {
  const preview = opts?.preview ?? false;
  const allSnapshots: any[] = dbProduct.scoreSnapshots ?? [];
  const publishedRun = (dbProduct.testRuns ?? []).find((r: any) => r.isCurrentPublished);

  let publishedSnapshots = allSnapshots.filter((s: any) => s.testRun?.isCurrentPublished);

  // Snapshots are linked at publish time; if the nested testRun join is missing,
  // match snapshots to the current published run by id before dropping the product.
  if (publishedSnapshots.length === 0 && publishedRun && !preview) {
    publishedSnapshots = allSnapshots.filter(
      (s: any) => s.testRun?.id === publishedRun.id || s.testRunId === publishedRun.id,
    );
  }

  const snapshots =
    preview && publishedSnapshots.length === 0 ? allSnapshots : publishedSnapshots;

  let overall = snapshots.find((s: any) => s.kind === 'overall')?.score ?? null;
  const hasCalculatedScores = overall != null && !Number.isNaN(overall);

  // Live pages require a published score; preview can show unscored placeholders.
  if (!preview && !hasCalculatedScores) return fileFallback ?? null;

  const review = dbProduct.review;
  const allEvidence: any[] = dbProduct.evidenceResults ?? [];
  const evidenceResults = preview
    ? allEvidence.filter((r: any) => r.testRun?.isCurrentPublished).length > 0
      ? allEvidence.filter((r: any) => r.testRun?.isCurrentPublished)
      : allEvidence
    : allEvidence.filter((r: any) => r.testRun?.isCurrentPublished);

  // Categories from snapshots; descriptions/weights come with the snapshot
  // detail, contributor rows from evidence results.
  const catSnapshots = snapshots
    .filter((s) => s.kind === 'category')
    .sort(
      (a, b) =>
        categorySortKey(String(a.refSlug), a.detail) - categorySortKey(String(b.refSlug), b.detail),
    );
  const subSnapshots = snapshots.filter((s) => s.kind === 'subscore');

  const categories: RatingCategory[] = catSnapshots.map((cat) => {
    const fileCat = fileFallback?.categories.find((c) => c.key === cat.refSlug);
    const subs: Subscore[] = subSnapshots
      .filter((s) => s.parentSlug === cat.refSlug)
      .sort(
        (a, b) =>
          Number(a.detail?.displayOrder ?? 999) - Number(b.detail?.displayOrder ?? 999),
      )
      .map((sub) => {
        const contributorSlugs: string[] = (sub.detail?.evidence ?? []).map((e: any) => e.slug);
        const resultBySlug = new Map<string, any>();
        for (const r of evidenceResults) {
          const slug = r.evidenceDefinition?.slug;
          const cat = r.evidenceDefinition?.subscore?.category?.slug;
          const sub = r.evidenceDefinition?.subscore?.slug;
          if (slug) {
            resultBySlug.set(String(slug), r);
            if (cat && sub) resultBySlug.set(`${cat}/${sub}/${slug}`, r);
          }
        }
        const subName = sub.detail?.name ?? titleCase(sub.refSlug);
        const fileSub = fileCat?.subscores.find(
          (s) => s.name === subName,
        );
        const contributors = buildGroupedContributors(
          String(cat.refSlug),
          String(sub.refSlug),
          contributorSlugs,
          resultBySlug,
          fileSub?.contributors ?? [],
          String(dbProduct.slug),
        );
        return {
          name: subName,
          score: sub.score,
          weight: sub.weight ?? 33,
          description:
            fileSub?.description ||
            getSubscoreDescription(String(cat.refSlug), subName),
          contributors,
        };
      });

    return {
      key: cat.refSlug,
      name: fileCat?.name ?? titleCase(cat.refSlug),
      score: cat.score,
      weight: cat.weight ?? 10,
      description: fileCat?.description || getCategoryTooltipDescription(String(cat.refSlug)) || '',
      subscores: subs.length > 0 ? subs : [],
      evidence: fileCat?.evidence ?? [],
      proof: fileCat?.proof ?? [],
      whatThisMeans: fileCat?.whatThisMeans ?? '',
    };
  });

  const publicMedia = collectProductMediaRows(dbProduct).filter((m: any) => isPublicMedia(m));

  const mediaItems = productMediaItems(dbProduct);
  const reviewMediaById = buildMediaLookup(collectProductMediaRows(dbProduct));

  const heroGalleryRaw: GalleryImage[] = sortHeroMedia(publicMedia.filter((m: any) => isHeroMedia(m)))
    .map((m: any) => {
      const url = resolveMediaUrl(m);
      if (!url || !isUsablePublicMediaUrl(url)) return null;
      return {
        full: url,
        thumb: url,
        alt: m.altText ?? '',
        mediaType: m.mediaType === 'video' ? 'video' : 'image',
      } satisfies GalleryImage;
    })
    .filter((g): g is GalleryImage => g !== null);

  const featuredMedia = dbProduct.featuredImage;
  const featuredUrl = resolveMediaUrl(featuredMedia);
  const featuredImage: GalleryImage | undefined =
    featuredUrl && isUsablePublicMediaUrl(featuredUrl)
      ? { full: featuredUrl, thumb: featuredUrl, alt: featuredMedia?.altText ?? '', mediaType: 'image' }
      : fileFallback?.featuredImage ?? fileFallback?.gallery?.[0];

  const prependFeatured = (images: GalleryImage[]): GalleryImage[] => {
    if (!featuredImage?.full) return images;
    const rest = images.filter((img) => img.full !== featuredImage.full);
    return [featuredImage, ...rest];
  };

  // Featured image first, then hero-tagged media (deduped). Fall back to featured-only when no heroes.
  const heroGallery: GalleryImage[] =
    heroGalleryRaw.length > 0
      ? prependFeatured(heroGalleryRaw)
      : featuredImage?.full
        ? [featuredImage]
        : [];

  const gallerySource = heroGallery.length
    ? heroGallery
    : prependFeatured(
        sortGalleryMedia(publicMedia.filter((m: any) => getMediaPlacement(m) === 'gallery' && m.mediaType === 'image'))
          .map((m: any) => {
            const url = resolveMediaUrl(m);
            if (!url || !isUsablePublicMediaUrl(url)) return null;
            return { full: url, thumb: url, alt: m.altText ?? '' };
          })
          .filter((g): g is GalleryImage => g !== null),
      );

  const gallery: GalleryImage[] = gallerySource;

  const activeLink = (dbProduct.affiliateLinks ?? []).find((l: any) => l.active);
  const plans = (dbProduct.subscriptionPlans ?? []).filter((p: any) => p.active);
  // Cheapest true 1-month billing option across tiers (never annual÷12).
  const plainMonthly = lowestPlainMonthlyPrice(plans);
  const monthlyPriceLabel =
    plainMonthly !== null ? `$${plainMonthly.toFixed(2)}/mo` : null;
  const typicalMonthly =
    dbProduct.typicalMonthlyCost != null && Number.isFinite(Number(dbProduct.typicalMonthlyCost))
      ? `$${Number(dbProduct.typicalMonthlyCost).toFixed(2)}/mo`
      : null;

  const safetyAudit: SafetyItem[] = fileFallback?.safetyAudit ?? deriveSafetyAudit(dbProduct);
  const featureSpecs: FeatureSpec[] =
    fileFallback?.featureSpecs ?? deriveFeatureSpecs(dbProduct);

  const authors: Author[] = [];
  if (dbProduct.author) authors.push(mapAuthor(dbProduct.author));
  if (dbProduct.factChecker) {
    authors.push({ ...mapAuthor(dbProduct.factChecker), role: 'Fact Checker' });
  }
  if (authors.length === 0 && fileFallback) authors.push(...fileFallback.authors);

  // Category verdicts: prefer the structured admin editor (product record),
  // then legacy review sections, then file data.
  const adminCatVerdicts = (dbProduct.categoryVerdicts ?? {}) as Record<
    string,
    {
      headline?: string;
      verdict?: string;
      pros?: string[];
      cons?: string[];
    }
  >;
  const structuredVerdicts: VerdictItem[] = categories
    .map((cat): VerdictItem | null => {
      const v = adminCatVerdicts[cat.key];
      if (!v || (!v.verdict?.trim() && !v.headline?.trim())) return null;
      return {
        id: cat.key,
        label: cat.name,
        tagline: v.headline || undefined,
        summary: v.verdict ?? '',
        pros: Array.isArray(v.pros) ? v.pros : [],
        cons: Array.isArray(v.cons) ? v.cons : [],
        score: cat.score ?? undefined,
      };
    })
    .filter((v): v is VerdictItem => v !== null);

  const overallVerdict = buildOverallVerdict(
    dbProduct,
    hasCalculatedScores ? overall : null,
    fileFallback,
  );
  const dbCategoryVerdicts = structuredVerdicts.filter((v) => v.id !== 'overall');
  const fileCategoryVerdicts = (fileFallback?.verdicts ?? []).filter((v) => v.id !== 'overall');
  const categoryVerdicts =
    dbCategoryVerdicts.length > 0 ? dbCategoryVerdicts : fileCategoryVerdicts;

  const verdicts: VerdictItem[] =
    overallVerdict || categoryVerdicts.length > 0
      ? [...(overallVerdict ? [overallVerdict] : []), ...categoryVerdicts]
      : ((review?.sections ?? []).find((s: any) => s.id === 'verdicts')?.items ??
          fileFallback?.verdicts ??
          []) as VerdictItem[];

  const changelog: RatingChangelogEntry[] = fileFallback?.ratingChangelog ?? [];

  const methodologyVersion = snapshots[0]?.methodologyVersion ?? 'v3.1';

  const derivedOverview = deriveOverview(dbProduct, monthlyPriceLabel);

  const logoMediaUrl = resolveMediaUrl(dbProduct.logo);
  const logo =
    logoMediaUrl && isUsablePublicMediaUrl(logoMediaUrl)
      ? logoMediaUrl
      : fileFallback?.logo;

  return {
    slug: dbProduct.slug,
    name: dbProduct.name,
    tagline: dbProduct.tagline ?? fileFallback?.tagline ?? '',
    reviewedDate: fmtDate(dbProduct.lastTestedAt) || fileFallback?.reviewedDate || '',
    modifiedDate: fmtDate(dbProduct.updatedAt) || fileFallback?.modifiedDate || '',
    methodology: `Methodology ${methodologyVersion}`,
    authors,
    websiteUrl: dbProduct.websiteUrl ?? fileFallback?.websiteUrl ?? '',
    affiliateUrl: activeLink
      ? `/go/${activeLink.cloakedSlug}`
      : dbProduct.websiteUrl ?? fileFallback?.affiliateUrl ?? '',
    affiliateRel: affiliateRel(activeLink?.relTags),
    logo,
    featuredImage,
    gallery: gallery.length > 0 ? gallery : fileFallback?.gallery ?? [],
    heroGallery: heroGallery.length > 0 ? heroGallery : fileFallback?.heroGallery,
    mediaItems: mediaItems.length > 0 ? mediaItems : fileFallback?.mediaItems,
    overallScore: hasCalculatedScores ? overall : null,
    overallSummary: dbProduct.oneLineVerdict ?? fileFallback?.overallSummary ?? '',
    ourTake: review?.ourTake ?? dbProduct.ourTake ?? fileFallback?.ourTake ?? '',
    safetyAudit,
    featureSpecs,
    overview: mergeOverview(fileFallback?.overview, derivedOverview),
    ratingChangelog: changelog,
    categories:
      categories.length > 0
        ? categories
        : fileFallback?.categories
          ? stripCategoryScores(fileFallback.categories)
          : [],
    verdicts,
    expertOpinion: dbProduct.expertOpinion ?? review?.intro ?? fileFallback?.expertOpinion ?? '',
    pricingDisplay: {
      monthly: monthlyPriceLabel ?? fileFallback?.pricingDisplay.monthly ?? '—',
      typicalMonthly: typicalMonthly ?? fileFallback?.pricingDisplay.typicalMonthly ?? null,
      storeLabel: fileFallback?.pricingDisplay.storeLabel ?? 'Visit site',
    },
    videoReview: resolveVideoReview(dbProduct),
    reviewBlocks: Array.isArray(review?.blocks)
      ? (review.blocks as Product['reviewBlocks'])
      : fileFallback?.reviewBlocks ?? [],
    reviewMediaById:
      Object.keys(reviewMediaById).length > 0 ? reviewMediaById : fileFallback?.reviewMediaById,
    directoryDescription: dbProduct.directoryDescription ?? fileFallback?.directoryDescription,
    seo: {
      seoTitle: dbProduct.seoTitle ?? fileFallback?.seo?.seoTitle,
      seoDescription: dbProduct.seoDescription ?? fileFallback?.seo?.seoDescription,
      h1Override: dbProduct.h1Override ?? fileFallback?.seo?.h1Override,
      canonicalUrl: dbProduct.canonicalUrl ?? fileFallback?.seo?.canonicalUrl,
      noindex: dbProduct.noindex ?? fileFallback?.seo?.noindex,
      nofollow: dbProduct.nofollow ?? fileFallback?.seo?.nofollow,
      ogTitle: dbProduct.ogTitle ?? fileFallback?.seo?.ogTitle,
      ogDescription: dbProduct.ogDescription ?? fileFallback?.seo?.ogDescription,
      ogImageUrl: dbProduct.ogImageUrl ?? fileFallback?.seo?.ogImageUrl,
      socialImageUrl: dbProduct.socialImageUrl ?? fileFallback?.seo?.socialImageUrl,
      searchExcerpt: dbProduct.searchExcerpt ?? fileFallback?.seo?.searchExcerpt,
      breadcrumbLabel: dbProduct.breadcrumbLabel ?? fileFallback?.seo?.breadcrumbLabel,
    },
  };
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Keep category structure for display but drop placeholder scores. */
function stripCategoryScores(categories: RatingCategory[]): RatingCategory[] {
  return categories.map((category) => ({
    ...category,
    score: null,
    subscores: category.subscores.map((sub) => ({ ...sub, score: null })),
  }));
}

function yn(v: boolean | undefined, yes: string, no: string, unknown = 'Unknown'): string {
  return v === undefined ? unknown : v ? yes : no;
}

function deriveSafetyAudit(p: any): SafetyItem[] {
  return [
    { label: 'Discreet billing', status: yn(p.capDiscreetBilling, 'Yes', 'No'), icon: 'credit_card' },
    { label: 'E2E encryption', status: yn(p.capE2eEncryption, 'Yes', 'No'), icon: 'lock' },
    { label: 'NSFW content', status: yn(p.capNsfw, 'Supported', 'Not supported'), icon: 'explicit' },
    { label: 'Free plan', status: yn(p.capFreePlan, 'Available', 'None'), icon: 'money_off' },
  ];
}

function deriveFeatureSpecs(p: any): FeatureSpec[] {
  const spec = (name: string, available: boolean | undefined, icon: string): FeatureSpec => ({
    name,
    value: yn(available, 'Yes', 'No'),
    icon,
    available: Boolean(available),
  });
  return [
    spec('Image generation', p.capImageGeneration, 'image'),
    spec('Video generation', p.capVideoGeneration, 'movie'),
    spec('Voice messages', p.capVoiceMessages, 'mic'),
    spec('Voice calls', p.capVoiceCalls, 'call'),
    spec('Custom characters', p.capCustomCharacters, 'person_add'),
    spec('Long-term memory', p.capLongTermMemory, 'psychology'),
    spec('Group chat', p.capGroupChat, 'groups'),
    spec('Custom scenarios', p.capCustomScenarios, 'theater_comedy'),
  ];
}

const AWARD_LABELS: Record<string, string> = {
  best_overall: 'Best Overall',
  best_chat: 'Best for Chat',
  best_images: 'Best for Images',
  best_video: 'Best for Video',
  best_roleplay: 'Best for Roleplay',
  best_voice: 'Best for Voice',
  best_memory: 'Best for Memory',
  best_value: 'Best Value',
  best_free: 'Best Free Option',
};

/** Resolve the structured award to a display label (null when none/inactive/expired). */
function awardLabel(p: any): string | null {
  const a = p.award;
  if (!a || a.kind === 'none' || a.active === false) return null;
  const now = Date.now();
  if (typeof a.startAt === 'number' && now < a.startAt) return null;
  if (typeof a.endAt === 'number' && now > a.endAt) return null;
  if (a.kind === 'custom') return a.customLabel?.trim() || null;
  return AWARD_LABELS[a.kind] ?? null;
}

function deriveOverview(p: any, monthlyPriceLabel: string | null): Product['overview'] {
  return {
    highlights: {
      bestFor: awardLabel(p) ?? p.bestForLabel ?? '',
      standout: p.mainStrength ?? '',
      drawback: p.mainLimitation ?? '',
      startingPrice: monthlyPriceLabel ?? '—',
    },
    characters: (selectPublicHighlightCharacters(p.characters ?? [], 6))
      .map((c: any) => mapCharacterForPublic(c, p))
      .filter(Boolean) as Product['overview']['characters'],
    featureCards: [],
    comparisonMetrics: [],
    searchTrends: {
      productName: p.name,
      currentInterest: 0,
      peakInterest: 0,
      changePercent: 0,
      changeDirection: 'up',
      popularityRank: 0,
      totalReviewed: 0,
    },
    // Structured decision lists first, then the legacy newline strings, and
    // finally the historical pros/cons mapping so existing pages keep content.
    bestForList: Array.isArray(p.bestFor)
      ? p.bestFor
      : splitLines(p.recommendedFor) ?? (Array.isArray(p.pros) ? p.pros : []),
    notIdealList: Array.isArray(p.notIdealFor)
      ? p.notIdealFor
      : splitLines(p.notRecommendedFor) ?? (Array.isArray(p.cons) ? p.cons : []),
  };
}

/**
 * File overview wins for legacy products, except characters: once DB
 * characters exist (admin-managed, with story slides) they replace the
 * hardcoded file list so admin edits show on live pages.
 */
function mergeOverview(
  fileOverview: Product['overview'] | undefined,
  derived: Product['overview'],
): Product['overview'] {
  if (!fileOverview) return derived;
  if (derived.characters.length === 0) return fileOverview;
  return { ...fileOverview, characters: derived.characters };
}

/** Split legacy newline-separated text into list items (null when empty). */
function splitLines(text: unknown): string[] | null {
  if (typeof text !== 'string' || !text.trim()) return null;
  const items = text
    .split('\n')
    .map((s) => s.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

export interface FeaturedIn {
  title: string;
  slug: string; // /best/[slug]
  position: number | null;
  awardLabel?: string;
}

/**
 * Internal relationships: which published roundups feature this product.
 * Rendered on review pages as "Also featured in: …".
 */
export async function getProductFeaturedIn(productSlug: string): Promise<FeaturedIn[]> {
  if (!isDbConfigured()) return [];
  try {
    const db = getDb();
    const { roundupEntries } = await (db.query as any)({
      roundupEntries: { $: {}, product: {}, roundup: {} },
    });
    return (roundupEntries as any[])
      .filter(
        (e) =>
          e.included &&
          e.product?.slug === productSlug &&
          e.roundup?.status === 'published' &&
          !e.roundup?.deletedAt,
      )
      .map((e) => ({
        title: e.roundup.title,
        slug: e.roundup.slug,
        position: e.publishedPosition ?? e.calculatedPosition ?? null,
        awardLabel: e.awardLabel ?? undefined,
      }))
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  } catch {
    return [];
  }
}

function orderRoundupPicksFromDbEntries(
  filePicks: RoundupPick[],
  entries: any[],
  productsBySlug: Map<string, Product>,
): RoundupPick[] {
  const bySlug = new Map(filePicks.map((p) => [p.slug, p]));
  const included = entries
    .filter((e) => e.included && e.product?.slug)
    .sort(
      (a, b) =>
        (a.publishedPosition ?? a.calculatedPosition ?? 999) -
        (b.publishedPosition ?? b.calculatedPosition ?? 999),
    );

  if (included.length === 0) return filePicks;

  const ordered: RoundupPick[] = [];
  for (const e of included) {
    const slug = String(e.product.slug);
    const product = productsBySlug.get(slug);
    const template =
      bySlug.get(slug) ?? (product ? minimalRoundupPickFromProduct(product) : null);
    if (!template) continue;
    const pick = { ...template };
    if (e.awardLabel) pick.ribbon = e.awardLabel;
    if (e.reason) pick.overallSummary = e.reason;
    ordered.push(pick);
  }

  return ordered.length > 0 ? ordered : filePicks;
}

export interface RoundupPublicLoad {
  roundup: Roundup;
  /** True when the DB roundup is missing, draft, or otherwise not published. */
  isDraft: boolean;
}

/**
 * Load a roundup for a public page. Always starts from the static file template
 * so progress bar, compare defaults, FAQ, and all template picks remain present.
 * Overlays DB metadata when a roundup record exists and hydrates individual picks
 * from published products where available.
 */
export async function loadRoundupForPublic(
  slug: string,
  fileTemplate: Roundup,
): Promise<RoundupPublicLoad> {
  if (!isDbConfigured()) {
    return {
      roundup: {
        ...fileTemplate,
        picks: fileTemplate.picks,
        compareDefaultIds: launchCompareDefaultIds(fileTemplate.picks, fileTemplate.compareDefaultIds),
      },
      isDraft: false,
    };
  }

  try {
    const db = getDb();
    const { roundups } = await (db.query as any)({
      roundups: {
        $: { where: { slug } },
        entries: { product: {} },
      },
    });
    const dbRoundup = (roundups as any[])?.find((r) => !r.deletedAt);
    const isDraft = !dbRoundup || dbRoundup.status !== 'published';

    const publishedProducts = await loadPublishedProducts([]);
    const productsBySlug = new Map(publishedProducts.map((p) => [p.slug, p]));

    let picks = fileTemplate.picks;
    if (dbRoundup?.entries?.length) {
      picks = orderRoundupPicksFromDbEntries(fileTemplate.picks, dbRoundup.entries, productsBySlug);
    }
    picks = hydrateRoundupPicks(picks, productsBySlug);

    const roundup: Roundup = {
      ...fileTemplate,
      ...(dbRoundup
        ? {
            title: dbRoundup.title ?? fileTemplate.title,
            metaDescription: dbRoundup.seoDescription ?? fileTemplate.metaDescription,
            featuredImage: dbRoundup.ogImageUrl ?? fileTemplate.featuredImage,
          }
        : {}),
      picks,
      compareDefaultIds: launchCompareDefaultIds(picks, fileTemplate.compareDefaultIds),
    };

    return { roundup, isDraft };
  } catch (error) {
    console.error('[content] roundup public load failed — using file template', error);
    return { roundup: fileTemplate, isDraft: true };
  }
}

/**
 * Load a published roundup for the live site. Returns null → 404 when the DB
 * roundup exists but is not published, or when the DB is configured and no
 * published roundup record exists.
 */
export async function loadPublishedRoundupBySlug(
  slug: string,
  fileTemplate: Roundup,
): Promise<Roundup | null> {
  const { roundup, isDraft } = await loadRoundupForPublic(slug, fileTemplate);
  return isDraft ? null : roundup;
}

/**
 * Roundup slugs that have a live public route today. Only /best/ai-girlfriend.astro
 * exists; when a dynamic /best/[slug] route is added, drop this gate so every
 * published DB roundup gets a page and sitemap entry automatically.
 */
const ROUNDUP_PAGE_SLUGS = new Set(['ai-girlfriend']);

export interface PublishedRoundupSummary {
  title: string;
  slug: string;
}

/**
 * Published roundups with a live public route — feeds the HTML and XML sitemaps.
 * Falls back to the file roundup when InstantDB is not configured.
 */
export async function loadPublishedRoundupSummaries(): Promise<PublishedRoundupSummary[]> {
  const fallback: PublishedRoundupSummary[] = [
    { title: 'Best AI Girlfriend Apps', slug: 'ai-girlfriend' },
  ];
  if (!isDbConfigured()) return fallback;

  try {
    const db = getDb();
    const { roundups } = await (db.query as any)({
      roundups: { $: { where: { status: 'published' } } },
    });
    return (roundups as any[])
      .filter((r) => !r.deletedAt && r.slug && ROUNDUP_PAGE_SLUGS.has(String(r.slug)))
      .map((r) => ({ title: String(r.title ?? r.slug), slug: String(r.slug) }));
  } catch (error) {
    console.error('[content] published roundups load failed — using file data', error);
    return fallback;
  }
}

/**
 * @deprecated Prefer loadPublishedRoundupBySlug for public pages.
 * Overlays DB entry order onto file picks and hydrates scores from published products.
 */
export async function overlayRoundupWithDb<T extends {
  slug: string;
  picks: RoundupPick[];
}>(fileRoundup: T): Promise<T> {
  if (!isDbConfigured()) return fileRoundup;
  try {
    const db = getDb();
    const { roundups } = await (db.query as any)({
      roundups: {
        $: { where: { slug: fileRoundup.slug, status: 'published' } },
        entries: { product: {} },
      },
    });
    const dbRoundup = (roundups as any[])[0];
    if (!dbRoundup?.entries?.length) return fileRoundup;

    const publishedProducts = await loadPublishedProducts([]);
    const productsBySlug = new Map(publishedProducts.map((p) => [p.slug, p]));
    const ordered = orderRoundupPicksFromDbEntries(fileRoundup.picks, dbRoundup.entries, productsBySlug);
    const picks = hydrateRoundupPicks(ordered, productsBySlug);

    return { ...fileRoundup, picks };
  } catch (error) {
    console.error('[content] roundup overlay failed — using file data', error);
    return fileRoundup;
  }
}

const PUBLISHED_PRODUCTS_QUERY = {
  review: { author: {}, factChecker: {} },
  author: {},
  factChecker: {},
  media: { file: {} },
  logo: { file: {} },
  featuredImage: { file: {} },
  subscriptionPlans: {},
  affiliateLinks: {},
  characters: { image: { file: {} }, affiliateLink: {}, storySlides: { media: { file: {} } } },
  testRuns: {},
  scoreSnapshots: { testRun: {} },
  evidenceResults: { testRun: {}, evidenceDefinition: { subscore: { category: {} } }, attachments: { file: {} } },
};

/**
 * Load all published products with scores from InstantDB when configured.
 * File fallbacks fill gaps for products not yet published in the admin.
 * Used for tooltips, nav, sitemap, and the global products catalog.
 */
export async function loadPublishedProducts(fileProducts: Product[] = []): Promise<Product[]> {
  if (!isDbConfigured()) return fileProducts;

  try {
    const db = getDb();
    const { products: dbProducts } = await (db.query as any)({
      products: {
        $: { where: { status: 'published' } },
        ...PUBLISHED_PRODUCTS_QUERY,
      },
    });

    const bySlug = new Map(fileProducts.map((p) => [p.slug, p]));
    const out: Product[] = [];
    const dbSlugs = new Set<string>();

    const allSlugsInDb = new Set<string>();
    try {
      const { products: allRows } = await (db.query as any)({
        products: { $: { where: {} } },
      });
      for (const row of allRows as any[]) {
        if (!row.deletedAt && row.slug) allSlugsInDb.add(String(row.slug));
      }
    } catch {
      /* optional */
    }

    for (const dbProduct of dbProducts as any[]) {
      if (dbProduct.deletedAt) continue;
      const mapped = mapProduct(dbProduct, bySlug.get(dbProduct.slug));
      if (mapped) {
        out.push(mapped);
        dbSlugs.add(dbProduct.slug);
      }
    }
    for (const fp of fileProducts) {
      if (!dbSlugs.has(fp.slug) && !allSlugsInDb.has(fp.slug)) out.push(fp);
    }
    return out;
  } catch (error) {
    console.error('[content] published products load failed — using file data', error);
    return fileProducts;
  }
}

/**
 * Load products: file data by default; DB-published products when InstantDB
 * is configured. USE_DB_CONTENT still gates roundup/homepage editorial overlays.
 */
export async function loadProductsWithDb(fileProducts: Product[]): Promise<Product[]> {
  return loadPublishedProducts(fileProducts);
}

/** Slug and display-name → logo URL for products stored in InstantDB. */
export async function loadProductLogoMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!isDbConfigured()) return map;

  try {
    const db = getDb();
    const { products: dbProducts } = await (db.query as any)({
      products: { logo: { file: {} } },
    });

    for (const product of dbProducts as any[]) {
      if (product.deletedAt) continue;
      const url = resolveMediaUrl(product.logo);
      if (!url) continue;
      map.set(product.slug, url);
      if (product.name) map.set(String(product.name).toLowerCase(), url);
    }
  } catch (error) {
    console.error('[content] product logo map failed — using roundup logos only', error);
  }

  return map;
}

/**
 * Overlay admin editorial fields onto directory / homepage explorer apps.
 * Uses published DB products when the database is configured.
 */
export async function overlayExplorerAppsWithDb<
  T extends {
    slug: string;
    logo: string;
    payments: string[];
    tagline: string;
    directoryDescription: string;
    bestFor: string;
    watchOutFor: string;
    priceLabel: string;
    paidAccountTested: boolean;
    lastTestedLabel: string;
    pricingVerifiedLabel: string;
  },
>(apps: T[]): Promise<T[]> {
  if (!isDbConfigured()) return apps;

  try {
    const { buildExplorerPaymentsFromProfile } = await import('../directory/payments');
    const db = getDb();
    const { products: dbProducts } = await (db.query as any)({
      products: {
        $: { where: { status: 'published' } },
        logo: { file: {} },
        subscriptionPlans: {},
        paymentProfile: {},
      },
    });

    const bySlug = new Map<string, any>();
    for (const product of dbProducts as any[]) {
      if (product.deletedAt) continue;
      bySlug.set(product.slug, product);
    }
    if (bySlug.size === 0) return apps;

    return apps.map((app) => {
      const dbProduct = bySlug.get(app.slug);
      if (!dbProduct) return app;

      const bestFor = formatAudienceList(
        dbProduct.bestFor,
        formatAudienceList(splitLegacyLines(dbProduct.recommendedFor), app.bestFor),
      );
      const watchOutFor = formatAudienceList(
        dbProduct.notIdealFor,
        formatAudienceList(splitLegacyLines(dbProduct.notRecommendedFor), app.watchOutFor),
      );

      const plans = (dbProduct.subscriptionPlans ?? []).filter((plan: any) => plan.active);
      const plainMonthly = lowestPlainMonthlyPrice(plans);
      const priceLabel =
        plainMonthly !== null
          ? `From $${plainMonthly.toFixed(2)} / month`
          : app.priceLabel;

      const lastVerifiedMs = plans.reduce((latest: number, plan: any) => {
        const ms = Number(plan.lastVerifiedAt ?? 0);
        return ms > latest ? ms : latest;
      }, 0);

      const logoUrl = resolveMediaUrl(dbProduct.logo);
      const logo =
        logoUrl && isUsablePublicMediaUrl(logoUrl) ? logoUrl : app.logo;

      const payments = dbProduct.paymentProfile
        ? buildExplorerPaymentsFromProfile(dbProduct.paymentProfile)
        : app.payments;

      return {
        ...app,
        logo,
        payments,
        tagline: dbProduct.tagline?.trim() || app.tagline,
        directoryDescription: dbProduct.directoryDescription?.trim() || app.directoryDescription,
        bestFor,
        watchOutFor,
        priceLabel,
        paidAccountTested: Boolean(dbProduct.lastTestedAt),
        lastTestedLabel: fmtDate(dbProduct.lastTestedAt) || app.lastTestedLabel,
        pricingVerifiedLabel: lastVerifiedMs ? fmtDate(lastVerifiedMs) : app.pricingVerifiedLabel,
      };
    });
  } catch (error) {
    console.error('[content] explorer apps overlay failed — using file data', error);
    return apps;
  }
}

const PREVIEW_PRODUCT_QUERY = {
  review: { author: {}, factChecker: {} },
  author: {},
  factChecker: {},
  media: { file: {} },
  logo: { file: {} },
  featuredImage: { file: {} },
  subscriptionPlans: {},
  affiliateLinks: {},
  characters: { image: { file: {} }, affiliateLink: {}, storySlides: { media: { file: {} } } },
  testRuns: {},
  scoreSnapshots: { testRun: {} },
  evidenceResults: { testRun: {}, evidenceDefinition: { subscore: { category: {} } }, attachments: { file: {} } },
};

/** Build a minimal review Product from a roundup pick (placeholder content). */
function productFromRoundupPick(pick: {
  slug: string;
  name: string;
  intro: string;
  overallScore: number;
  overallSummary: string;
  ourTake: string;
  gallery: GalleryImage[];
  categoryScores: { key: string; name: string; score: number; description: string; subscores?: { name: string; score: number }[] }[];
  specs: { label: string; value: string }[];
  pros: string[];
  cons: string[];
  affiliateUrl?: string;
}): Product {
  const categories: RatingCategory[] = pick.categoryScores.map((c) => ({
    key: c.key,
    name: c.name,
    score: c.score,
    weight: Math.round(100 / pick.categoryScores.length),
    description: c.description,
    subscores: (c.subscores ?? []).map((s) => ({
      name: s.name,
      score: s.score,
      weight: 100,
      description: getSubscoreDescription(c.key, s.name),
      contributors: [],
    })),
    evidence: [],
    proof: [],
    whatThisMeans: '',
  }));

  const priceSpec = pick.specs.find((s) => s.label.toLowerCase().includes('price'));

  return {
    slug: pick.slug,
    name: pick.name,
    tagline: pick.intro,
    reviewedDate: '',
    modifiedDate: '',
    methodology: 'Methodology v3.1',
    authors: [
      {
        name: 'Herman Carter',
        role: 'Lead Reviewer',
        avatar: cdnAsset('/brand/herman-main-icon.svg'),
        verified: true,
        slug: 'herman-carter',
      },
    ],
    websiteUrl: '',
    affiliateUrl: pick.affiliateUrl ?? '#',
    affiliateRel: DEFAULT_AFFILIATE_REL,
    gallery: pick.gallery,
    overallScore: pick.overallScore,
    overallSummary: pick.overallSummary,
    ourTake: pick.ourTake,
    safetyAudit: [],
    featureSpecs: [],
    overview: {
      highlights: {
        bestFor: pick.pros[0] ?? '',
        standout: pick.pros[1] ?? '',
        drawback: pick.cons[0] ?? '',
        startingPrice: priceSpec?.value ?? '—',
      },
      characters: [],
      featureCards: [],
      comparisonMetrics: [],
      searchTrends: {
        productName: pick.name,
        currentInterest: 0,
        peakInterest: 0,
        changePercent: 0,
        changeDirection: 'up',
        popularityRank: 0,
        totalReviewed: 0,
      },
      bestForList: pick.pros,
      notIdealList: pick.cons,
    },
    ratingChangelog: [],
    categories,
    verdicts: [],
    expertOpinion: pick.ourTake,
    pricingDisplay: {
      monthly: priceSpec?.value ?? '—',
      storeLabel: 'Visit site',
    },
  };
}

async function roundupProductFallbackAsync(slug: string): Promise<Product | null> {
  try {
    const { aiGirlfriendRoundup } = await import('../../data/roundups/ai-girlfriend');
    const pick = aiGirlfriendRoundup.picks.find((p) => p.slug === slug);
    return pick ? productFromRoundupPick(pick) : null;
  } catch {
    return null;
  }
}

/**
 * Load a published product for the live review route (/reviews/[slug]).
 * Requires status=published in the DB and a published test-run score.
 * Falls back to static file data when the DB is unavailable.
 */
export async function loadPublishedProductBySlug(slug: string): Promise<Product | null> {
  const { getProduct } = await import('../../data/products');
  const fileProduct = getProduct(slug);

  if (!isDbConfigured()) {
    return fileProduct ?? null;
  }

  try {
    const db = getDb();
    const { products: rows } = await (db.query as any)({
      products: {
        $: { where: { slug } },
        ...PREVIEW_PRODUCT_QUERY,
      },
    });
    const dbProduct = (rows as any[])?.find((p) => !p.deletedAt);
    if (dbProduct) {
      if (dbProduct.status !== 'published') return null;
      const mapped = mapProduct(dbProduct, fileProduct ?? undefined);
      if (mapped) return mapped;
      console.error('[content] published product mapping failed — using catalog fallback if available', {
        slug,
        productId: dbProduct.id,
      });
      if (fileProduct) return fileProduct;
      return null;
    }
  } catch (error) {
    console.error('[content] published product load failed', error);
  }

  return fileProduct ?? null;
}

/** Slugs for prerendering live review pages at build time. */
export async function loadPublishedReviewSlugs(): Promise<string[]> {
  const { fileProductsBaseline } = await import('../../data/products');
  const products = await loadPublishedProducts(fileProductsBaseline);
  return products.map((p) => p.slug);
}

/**
 * Load a product for the admin preview route — any status, unpublished scores OK.
 * Falls back to static file data, then roundup placeholder content.
 */
export async function loadProductPreviewBySlug(slug: string): Promise<Product | null> {
  const { getProduct } = await import('../../data/products');
  const fileProduct = getProduct(slug);
  const roundupFallback = await roundupProductFallbackAsync(slug);

  if (!isDbConfigured()) {
    return fileProduct ?? roundupFallback;
  }

  try {
    const db = getDb();
    const { products: rows } = await (db.query as any)({
      products: {
        $: { where: { slug } },
        ...PREVIEW_PRODUCT_QUERY,
      },
    });
    const dbProduct = (rows as any[])?.find((p) => !p.deletedAt);
    if (dbProduct) {
      const mapped = mapProduct(dbProduct, fileProduct ?? roundupFallback ?? undefined, {
        preview: true,
      });
      if (mapped) return mapped;
    }
  } catch (error) {
    console.error('[content] preview load failed — using fallbacks', error);
  }

  return fileProduct ?? roundupFallback;
}

/** DB publish state for a product slug (missing when no row or DB off). */
export async function getProductDbPublishStatus(slug: string): Promise<ProductDbPublishStatus> {
  if (!isDbConfigured()) return 'missing';

  try {
    const db = getDb();
    const { products: rows } = await (db.query as any)({
      products: { $: { where: { slug } } },
    });
    const dbProduct = (rows as any[])?.find((p) => !p.deletedAt);
    if (!dbProduct) return 'missing';
    return dbProduct.status === 'published' ? 'published' : 'draft';
  } catch {
    return 'missing';
  }
}

export interface ReviewPageLoad {
  product: Product;
  /** True when the product is not published — dev test pages only on localhost. */
  isDraft: boolean;
  /** Use draft ratings view model (preview scores, unpublished test runs). */
  useDraftRatings: boolean;
}

/**
 * Load a review page product for /reviews/[slug].
 * Published products use live data. Draft dev test slugs (e.g. aura-ai) stay
 * reachable on localhost with preview data.
 */
export async function loadReviewPageProduct(slug: string): Promise<ReviewPageLoad | null> {
  const dbStatus = await getProductDbPublishStatus(slug);
  const isDev = import.meta.env.DEV;

  if (dbStatus === 'published') {
    const product = await loadPublishedProductBySlug(slug);
    if (product) {
      return { product, isDraft: false, useDraftRatings: false };
    }
  }

  if (isDev && isDevReviewSlug(slug)) {
    const product = await loadProductPreviewBySlug(slug);
    if (product) {
      return {
        product,
        isDraft: dbStatus !== 'published',
        useDraftRatings: true,
      };
    }
  }

  if (dbStatus === 'missing') {
    const product = await loadPublishedProductBySlug(slug);
    if (product) {
      return { product, isDraft: false, useDraftRatings: false };
    }
  }

  return null;
}
