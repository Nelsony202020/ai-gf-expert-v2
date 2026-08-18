import type { RoundupPick } from '../../data/roundups/ai-girlfriend';
import type { HomeFeaturedCharacter, HomeGuide, HomeRecentUpdate } from '../../data/homepage';
import { getDb, isDbConfigured } from '../db/server';
import { loadFeaturedCharactersFromDb } from '../homepage/featuredCharacters';
import { MAX_HOMEPAGE_TOP_PICKS } from '../homepage/featuredProducts';
import { reviewPageUrl } from '../slugs';
import { loadPublishedProducts } from './store';
import { attachAwardsToPicks } from '../awards/compute';
import {
  hydrateRoundupPicks,
  minimalRoundupPickFromProduct,
  productToRoundupPick,
} from './roundupPick';

function fmtDisplayDate(ms?: number | string | null): string {
  if (!ms) return '';
  const d = new Date(typeof ms === 'string' ? ms : Number(ms));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pickFromProduct(
  slug: string,
  templatesBySlug: Map<string, RoundupPick>,
  productsBySlug: Map<string, import('../../data/products').Product>,
): RoundupPick | null {
  const product = productsBySlug.get(slug);
  if (!product) return null;
  const template = templatesBySlug.get(slug);
  return template ? productToRoundupPick(template, product) : minimalRoundupPickFromProduct(product);
}

/** Top homepage brand cards — homepageSlots + homepageFeatured; published products only. */
export async function loadHomepageTopPicks(
  templatePicks: RoundupPick[],
): Promise<RoundupPick[]> {
  const templatesBySlug = new Map(templatePicks.map((p) => [p.slug, p]));
  const published = await loadPublishedProducts([]);

  if (!isDbConfigured()) {
    const productsBySlug = new Map(published.map((p) => [p.slug, p]));
    const picks = templatePicks.slice(0, MAX_HOMEPAGE_TOP_PICKS).map((template) => {
      const product = productsBySlug.get(template.slug);
      return product ? productToRoundupPick(template, product) : template;
    });
    return attachAwardsToPicks(picks, published);
  }

  try {
    const db = getDb();
    const { homepageSlots } = await (db.query as any)({
      homepageSlots: {
        product: { logo: { file: {} }, featuredImage: { file: {} } },
      },
    });

    const productsBySlug = new Map(published.map((p) => [p.slug, p]));

    const slots = (homepageSlots as any[])
      .filter((s) => s.kind === 'top_pick' && s.active !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const out: RoundupPick[] = [];
    const seen = new Set<string>();

    for (const slot of slots) {
      const slug = slot.product?.slug as string | undefined;
      if (!slug || seen.has(slug)) continue;
      const pick = pickFromProduct(slug, templatesBySlug, productsBySlug);
      if (!pick) continue;
      seen.add(slug);
      out.push(pick);
    }

    if (out.length < MAX_HOMEPAGE_TOP_PICKS) {
      const { products: featuredRows } = await (db.query as any)({
        products: { $: { where: { status: 'published', homepageFeatured: true } } },
      });
      const extras = (featuredRows as any[])
        .filter((p) => !p.deletedAt && p.homepageFeatured === true)
        .sort(
          (a, b) =>
            (a.displayOrder ?? 999) - (b.displayOrder ?? 999) ||
            String(a.name ?? '').localeCompare(String(b.name ?? '')),
        );

      for (const row of extras) {
        const slug = String(row.slug ?? '');
        if (!slug || seen.has(slug)) continue;
        const pick = pickFromProduct(slug, templatesBySlug, productsBySlug);
        if (!pick) continue;
        seen.add(slug);
        out.push(pick);
        if (out.length >= MAX_HOMEPAGE_TOP_PICKS) break;
      }
    }

    const fallback = templatePicks.slice(0, MAX_HOMEPAGE_TOP_PICKS);
    return attachAwardsToPicks(out.length > 0 ? out.slice(0, MAX_HOMEPAGE_TOP_PICKS) : fallback, published);
  } catch (error) {
    console.error('[content] homepage top picks load failed', error);
    const fallback = templatePicks.slice(0, MAX_HOMEPAGE_TOP_PICKS);
    return attachAwardsToPicks(fallback, published);
  }
}

/** Featured character carousel — DB slots only when InstantDB is configured. */
export async function loadHomepageFeaturedCharacters(
  fileFallback: HomeFeaturedCharacter[],
): Promise<HomeFeaturedCharacter[]> {
  if (!isDbConfigured()) return fileFallback;
  const dbCharacters = await loadFeaturedCharactersFromDb();
  return dbCharacters ?? [];
}

/** Recent homepage updates from published reviews (no static placeholder links). */
export async function loadHomepageRecentUpdates(): Promise<HomeRecentUpdate[]> {
  const products = await loadPublishedProducts([]);
  return products
    .filter((p) => p.overallScore != null)
    .slice(0, 4)
    .map((p) => ({
      id: `review-${p.slug}`,
      title: `${p.name} Review`,
      href: reviewPageUrl(p.slug),
      image: p.featuredImage?.full ?? p.gallery[0]?.full ?? '',
      imageAlt: `${p.name} review`,
      date: p.modifiedDate || p.reviewedDate || '',
      summary: p.overallSummary || p.tagline,
      score: p.overallScore ?? undefined,
      type: 'review' as const,
      badge: 'Review',
    }));
}

/** Guides / featured articles from published reviews only. */
export async function loadHomepageGuides(): Promise<HomeGuide[]> {
  const products = await loadPublishedProducts([]);
  return products.slice(0, 6).map((p) => ({
    id: `guide-${p.slug}`,
    title: `${p.name} Review`,
    excerpt: p.overallSummary || p.tagline,
    href: reviewPageUrl(p.slug),
    image: p.featuredImage?.full ?? p.gallery[0]?.full ?? '',
    imageAlt: `${p.name} review`,
    date: p.modifiedDate || p.reviewedDate || '',
    type: 'review' as const,
  }));
}

/** Directory apps from published products flagged publishedInDirectory. */
export async function loadDirectoryPicks(templatePicks: RoundupPick[]): Promise<RoundupPick[]> {
  const templatesBySlug = new Map(templatePicks.map((p) => [p.slug, p]));
  const published = await loadPublishedProducts([]);
  const productsBySlug = new Map(published.map((p) => [p.slug, p]));

  if (!isDbConfigured()) {
    return attachAwardsToPicks(hydrateRoundupPicks(templatePicks, productsBySlug), published);
  }

  try {
    const db = getDb();
    const { products: rows } = await (db.query as any)({
      products: { $: { where: { status: 'published' } } },
    });

    const directoryRows = (rows as any[])
      .filter((p) => !p.deletedAt && p.publishedInDirectory === true)
      .sort(
        (a, b) =>
          (a.displayOrder ?? 999) - (b.displayOrder ?? 999) ||
          String(a.name ?? '').localeCompare(String(b.name ?? '')),
      );

    const picks: RoundupPick[] = [];
    const seen = new Set<string>();

    for (const row of directoryRows) {
      const slug = String(row.slug ?? '');
      if (!slug || seen.has(slug)) continue;
      const pick = pickFromProduct(slug, templatesBySlug, productsBySlug);
      if (!pick) continue;
      seen.add(slug);
      picks.push(pick);
    }

    return picks.length > 0 ? attachAwardsToPicks(picks, published) : attachAwardsToPicks(hydrateRoundupPicks(templatePicks, productsBySlug), published);
  } catch (error) {
    console.error('[content] directory picks load failed', error);
    return attachAwardsToPicks(hydrateRoundupPicks(templatePicks, productsBySlug), published);
  }
}

/** @deprecated Use loadDirectoryPicks — kept for import compatibility. */
export async function hydrateExplorerTemplatePicks(
  templatePicks: RoundupPick[],
): Promise<RoundupPick[]> {
  return loadDirectoryPicks(templatePicks);
}
