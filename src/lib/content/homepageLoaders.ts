import { filterLaunchProducts } from './launchProducts';
import type { RoundupPick } from '../../data/roundups/ai-girlfriend';
import type { HomeFeaturedCharacter, HomeGuide, HomeRecentUpdate } from '../../data/homepage';
import { getDb, isDbConfigured } from '../db/server';
import { loadFeaturedCharactersFromDb } from '../homepage/featuredCharacters';
import { reviewPageUrl } from '../slugs';
import { loadPublishedProducts } from './store';
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

/** Top homepage brand cards — admin homepageSlots only; published products only. */
export async function loadHomepageTopPicks(
  templatePicks: RoundupPick[],
): Promise<RoundupPick[]> {
  const launchTemplates = filterLaunchProducts(templatePicks);

  if (!isDbConfigured()) {
    return launchTemplates.slice(0, 3);
  }

  try {
    const db = getDb();
    const { homepageSlots } = await (db.query as any)({
      homepageSlots: {
        product: { logo: { file: {} }, featuredImage: { file: {} } },
      },
    });

    const templatesBySlug = new Map(templatePicks.map((p) => [p.slug, p]));
    const published = await loadPublishedProducts([]);
    const productsBySlug = new Map(published.map((p) => [p.slug, p]));

    const slots = (homepageSlots as any[])
      .filter((s) => s.kind === 'top_pick' && s.active !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const out: RoundupPick[] = [];
    for (const slot of slots) {
      const slug = slot.product?.slug as string | undefined;
      if (!slug) continue;
      const product = productsBySlug.get(slug);
      if (!product) continue;
      const template = templatesBySlug.get(slug);
      out.push(template ? productToRoundupPick(template, product) : minimalRoundupPickFromProduct(product));
    }
    const filtered = filterLaunchProducts(out);
    return filtered.length > 0 ? filtered : launchTemplates.slice(0, 3);
  } catch (error) {
    console.error('[content] homepage top picks load failed', error);
    return launchTemplates.slice(0, 3);
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
  const products = filterLaunchProducts(await loadPublishedProducts([]));
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
  const products = filterLaunchProducts(await loadPublishedProducts([]));
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

/** Hydrate explorer/directory apps from published product scores. */
export async function hydrateExplorerTemplatePicks(
  templatePicks: RoundupPick[],
): Promise<RoundupPick[]> {
  const launchTemplates = filterLaunchProducts(templatePicks);
  const published = filterLaunchProducts(await loadPublishedProducts([]));
  const bySlug = new Map(published.map((p) => [p.slug, p]));
  return hydrateRoundupPicks(launchTemplates, bySlug);
}
