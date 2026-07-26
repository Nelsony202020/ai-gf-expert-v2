// Public-page content store.
//
// Pages keep rendering the exact same `Product` / `Roundup` shapes they use
// today, but the data can come from InstantDB instead of the hardcoded
// `src/data/*` files. The switch is the USE_DB_CONTENT env flag:
//
//   - off (default): file data only — safe until migration parity is verified
//   - on: published DB records are mapped over the file data (DB wins for
//     canonical fields; file data remains as fallback for products that are
//     not yet published in the DB)
//
// This implements the plan's migration strategy: old files stay until score
// parity is verified, then USE_DB_CONTENT=1 flips reads to the database.

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
import { getDb, isDbConfigured } from '../db/server';
import { env } from '../env';
import { lowestMonthlyPrice, lowestPlainMonthlyPrice } from '../pricing/calc';
import { formatAudienceList, splitLegacyLines } from '../cms/format';

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

function mapAuthor(a: any): Author {
  return {
    name: a?.name ?? 'Editorial Team',
    role: a?.role ?? 'Reviewer',
    avatar: a?.avatarUrl ?? '/brand/herman-main-icon.svg',
    verified: a?.verified ?? undefined,
    slug: a?.slug ?? undefined,
  };
}

/** Map one DB product (with links + snapshots) onto the site's Product shape. */
function mapProduct(dbProduct: any, fileFallback: Product | undefined): Product | null {
  const snapshots: any[] = (dbProduct.scoreSnapshots ?? []).filter(
    (s: any) => s.testRun?.isCurrentPublished,
  );
  const overall = snapshots.find((s) => s.kind === 'overall')?.score;

  // A DB product only replaces file content once it has published scores.
  if (overall === undefined || overall === null) return fileFallback ?? null;

  const review = dbProduct.review;
  const evidenceResults: any[] = (dbProduct.evidenceResults ?? []).filter(
    (r: any) => r.testRun?.isCurrentPublished,
  );

  // Categories from snapshots; descriptions/weights come with the snapshot
  // detail, contributor rows from evidence results.
  const catSnapshots = snapshots.filter((s) => s.kind === 'category');
  const subSnapshots = snapshots.filter((s) => s.kind === 'subscore');

  const categories: RatingCategory[] = catSnapshots.map((cat) => {
    const subs: Subscore[] = subSnapshots
      .filter((s) => s.parentSlug === cat.refSlug)
      .map((sub) => {
        const contributorSlugs: string[] = (sub.detail?.evidence ?? []).map((e: any) => e.slug);
        const contributors: DataRow[] = evidenceResults
          .filter((r) => contributorSlugs.includes(r.evidenceDefinition?.slug))
          .map((r) => ({
            label: r.evidenceDefinition?.name ?? r.evidenceDefinition?.slug ?? '',
            value: r.publicResult ?? '—',
            internalScore: r.normalizedScore ?? undefined,
          }));
        return {
          name: titleCase(sub.refSlug),
          score: sub.score,
          weight: sub.weight ?? 33,
          description: '',
          contributors,
        };
      });

    const fileCat = fileFallback?.categories.find((c) => c.key === cat.refSlug);
    return {
      key: cat.refSlug,
      name: fileCat?.name ?? titleCase(cat.refSlug),
      score: cat.score,
      weight: cat.weight ?? 10,
      description: fileCat?.description ?? '',
      subscores: subs.length > 0 ? subs : fileCat?.subscores ?? [],
      evidence: fileCat?.evidence ?? [],
      proof: fileCat?.proof ?? [],
      whatThisMeans: fileCat?.whatThisMeans ?? '',
    };
  });

  const gallery: GalleryImage[] = (dbProduct.media ?? [])
    .filter((m: any) => m.approved && !m.deletedAt && m.mediaType === 'image' && m.role === 'gallery' && m.url)
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((m: any) => ({ full: m.url, thumb: m.url, alt: m.altText ?? '' }));

  const activeLink = (dbProduct.affiliateLinks ?? []).find((l: any) => l.active);
  const plans = (dbProduct.subscriptionPlans ?? []).filter((p: any) => p.active);
  // Cheapest plain-monthly billing option across tiers (billingOptions-aware
  // with legacy flat-field fallback); yearly-only catalogs fall back to the
  // monthly equivalent so they are no longer invisible.
  const plainMonthly = lowestPlainMonthlyPrice(plans);
  const monthlyEquiv = lowestMonthlyPrice(plans);
  const monthlyPriceLabel =
    plainMonthly !== null
      ? `$${plainMonthly.toFixed(2)}/mo`
      : monthlyEquiv !== null
        ? `$${monthlyEquiv.toFixed(2)}/mo eq.`
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
        score: cat.score,
      };
    })
    .filter((v): v is VerdictItem => v !== null);

  const verdicts: VerdictItem[] =
    structuredVerdicts.length > 0
      ? structuredVerdicts
      : (review?.sections ?? []).find((s: any) => s.id === 'verdicts')?.items ??
        fileFallback?.verdicts ??
        [];

  const changelog: RatingChangelogEntry[] = fileFallback?.ratingChangelog ?? [];

  const methodologyVersion = snapshots[0]?.methodologyVersion ?? 'v3.1';

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
    gallery: gallery.length > 0 ? gallery : fileFallback?.gallery ?? [],
    overallScore: overall,
    overallSummary: dbProduct.oneLineVerdict ?? fileFallback?.overallSummary ?? '',
    ourTake: review?.ourTake ?? dbProduct.ourTake ?? fileFallback?.ourTake ?? '',
    safetyAudit,
    featureSpecs,
    overview: mergeOverview(fileFallback?.overview, deriveOverview(dbProduct, monthlyPriceLabel)),
    ratingChangelog: changelog,
    categories: categories.length > 0 ? categories : fileFallback?.categories ?? [],
    verdicts,
    expertOpinion: dbProduct.expertOpinion ?? review?.intro ?? fileFallback?.expertOpinion ?? '',
    pricingDisplay: {
      monthly: monthlyPriceLabel ?? fileFallback?.pricingDisplay.monthly ?? '—',
      storeLabel: fileFallback?.pricingDisplay.storeLabel ?? 'Visit site',
    },
    videoReview: dbProduct.youtubeReviewUrl
      ? {
          embedUrl: dbProduct.youtubeReviewUrl,
          channelUrl: dbProduct.youtubeReviewUrl,
        }
      : fileFallback?.videoReview,
  };
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
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
    characters: (p.characters ?? [])
      .filter((c: any) => c.active && !c.deletedAt)
      .slice(0, 6)
      .map((c: any) => {
        // Ordered active story slides from the structured entity; the ring
        // stays empty (viewer disabled) until slides exist.
        const slides: string[] = (c.storySlides ?? [])
          .filter((s: any) => s.active && !s.deletedAt && s.media?.url)
          .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((s: any) => s.media.url);
        const activeProductLink = (p.affiliateLinks ?? []).find((l: any) => l.active);
        const cta = c.affiliateLink?.active
          ? `/go/${c.affiliateLink.cloakedSlug}`
          : activeProductLink
            ? `/go/${activeProductLink.cloakedSlug}`
            : undefined;
        return {
          name: c.name,
          archetype: (c.personalityTags ?? [])[0] ?? '',
          avatar: c.image?.url ?? '',
          storySlides: slides,
          profileUrl: cta,
        };
      }),
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
  if (!useDbContent()) return [];
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

/**
 * Overlay DB roundup entries (order, awards, reasons) onto the file roundup.
 * Pick content still comes from the file until those products are published
 * in the DB; ranking control moves to the admin immediately.
 */
export async function overlayRoundupWithDb<T extends {
  slug: string;
  picks: { slug: string; ribbon: string; overallSummary: string }[];
}>(fileRoundup: T): Promise<T> {
  if (!useDbContent()) return fileRoundup;
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

    const bySlug = new Map(fileRoundup.picks.map((p) => [p.slug, p]));
    const ordered = (dbRoundup.entries as any[])
      .filter((e) => e.included && e.product?.slug && bySlug.has(e.product.slug))
      .sort(
        (a, b) =>
          (a.publishedPosition ?? a.calculatedPosition ?? 999) -
          (b.publishedPosition ?? b.calculatedPosition ?? 999),
      )
      .map((e) => {
        const pick = { ...bySlug.get(e.product.slug)! };
        if (e.awardLabel) pick.ribbon = e.awardLabel;
        if (e.reason) pick.overallSummary = e.reason;
        return pick;
      });
    if (ordered.length === 0) return fileRoundup;
    // Keep any file picks missing from the DB at the end (safety).
    const orderedSlugs = new Set(ordered.map((p) => p.slug));
    for (const pick of fileRoundup.picks) {
      if (!orderedSlugs.has(pick.slug)) ordered.push(pick);
    }
    return { ...fileRoundup, picks: ordered };
  } catch (error) {
    console.error('[content] roundup overlay failed — using file data', error);
    return fileRoundup;
  }
}

/**
 * Order homepage featured characters by active DB slots when enabled.
 * Falls back to the file list untouched.
 */
export async function overlayFeaturedCharactersWithDb<T extends { name: string }>(
  fileCharacters: T[],
): Promise<T[]> {
  if (!useDbContent()) return fileCharacters;
  try {
    const db = getDb();
    const { homepageSlots } = await (db.query as any)({
      homepageSlots: {
        $: { where: { kind: 'featured_character', active: true } },
        character: {},
      },
    });
    const nowMs = Date.now();
    const live = (homepageSlots as any[])
      .filter(
        (s) =>
          (!s.startAt || Number(s.startAt) <= nowMs) && (!s.endAt || Number(s.endAt) >= nowMs),
      )
      .sort((a, b) => a.position - b.position);
    if (live.length === 0) return fileCharacters;

    const byName = new Map(fileCharacters.map((c) => [c.name.toLowerCase(), c]));
    const ordered: T[] = [];
    for (const slot of live) {
      const match = byName.get(String(slot.character?.name ?? '').toLowerCase());
      if (match) ordered.push(match);
    }
    return ordered.length > 0 ? ordered : fileCharacters;
  } catch (error) {
    console.error('[content] homepage overlay failed — using file data', error);
    return fileCharacters;
  }
}

/**
 * Load products: file data by default; DB-published products mapped over it
 * when USE_DB_CONTENT is enabled.
 */
export async function loadProductsWithDb(fileProducts: Product[]): Promise<Product[]> {
  if (!useDbContent()) return fileProducts;
  try {
    const db = getDb();
    const { products: dbProducts } = await (db.query as any)({
      products: {
        $: { where: { status: 'published' } },
        review: { author: {}, factChecker: {} },
        author: {},
        factChecker: {},
        media: {},
        logo: {},
        subscriptionPlans: {},
        affiliateLinks: {},
        characters: { image: {}, affiliateLink: {}, storySlides: { media: {} } },
        scoreSnapshots: { testRun: {} },
        evidenceResults: { testRun: {}, evidenceDefinition: {} },
      },
    });

    const bySlug = new Map(fileProducts.map((p) => [p.slug, p]));
    const out: Product[] = [];
    const dbSlugs = new Set<string>();

    for (const dbProduct of dbProducts as any[]) {
      if (dbProduct.deletedAt) continue;
      const mapped = mapProduct(dbProduct, bySlug.get(dbProduct.slug));
      if (mapped) {
        out.push(mapped);
        dbSlugs.add(dbProduct.slug);
      }
    }
    // Keep file products that don't exist (published) in the DB yet.
    for (const fp of fileProducts) {
      if (!dbSlugs.has(fp.slug)) out.push(fp);
    }
    return out;
  } catch (error) {
    console.error('[content] DB load failed — using file data', error);
    return fileProducts;
  }
}

/** Slug and display-name → logo URL for products stored in InstantDB. */
export async function loadProductLogoMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!useDbContent()) return map;

  try {
    const db = getDb();
    const { products: dbProducts } = await (db.query as any)({
      products: { logo: {} },
    });

    for (const product of dbProducts as any[]) {
      if (product.deletedAt) continue;
      const url = product.logo?.url;
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
    const db = getDb();
    const { products: dbProducts } = await (db.query as any)({
      products: {
        $: { where: { status: 'published' } },
        subscriptionPlans: {},
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
      const monthlyEquiv = lowestMonthlyPrice(plans);
      const priceLabel =
        plainMonthly !== null
          ? `From $${plainMonthly.toFixed(2)} / month`
          : monthlyEquiv !== null
            ? `From $${monthlyEquiv.toFixed(2)} / month eq.`
            : app.priceLabel;

      const lastVerifiedMs = plans.reduce((latest: number, plan: any) => {
        const ms = Number(plan.lastVerifiedAt ?? 0);
        return ms > latest ? ms : latest;
      }, 0);

      return {
        ...app,
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
