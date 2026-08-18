import type { Product } from '../../data/products';
import type { Roundup, RoundupPick, RoundupCategoryScore } from '../../data/roundups/ai-girlfriend';
import { reviewPageUrl } from '../slugs';
import { launchCompareDefaultIds } from './launchProducts';
import { buildAtGlanceStats } from '../roundup/atGlance';
import { loadPricingTabViewModel } from '../pricing-tab/loadPricingTab';
import { attachAwardsToPicks } from '../awards/compute';

export interface RoundupEntryMeta {
  slug: string;
  included: boolean;
  publishedPosition?: number | null;
  calculatedPosition?: number | null;
  editorialOverride?: boolean;
  awardLabel?: string | null;
  reason?: string | null;
}

function parseMonthlyPrice(label: string): number | null {
  const m = String(label ?? '').match(/\$([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

/** Merge live product scores/media into a roundup pick template. */
export function productToRoundupPick(template: RoundupPick, product: Product): RoundupPick {
  const categoryScores: RoundupCategoryScore[] = product.categories
    .filter((c) => c.score != null)
    .map((c) => ({
      key: c.key,
      name: c.key === 'pricing' ? 'Price' : c.name,
      score: c.score!,
      description: c.description,
      subscores: c.subscores
        .filter((s) => s.score != null)
        .map((s) => ({ name: s.name, score: s.score! })),
    }));

  const logo = product.logo?.trim() || template.logo;
  const overall = product.verdicts.find((v) => v.id === 'overall');

  return {
    ...template,
    slug: product.slug,
    id: template.id || product.slug,
    name: product.name,
    logo,
    overallScore: product.overallScore ?? template.overallScore,
    overallSummary: product.overallSummary?.trim() || template.overallSummary,
    intro: product.tagline?.trim() || template.intro,
    gallery: product.gallery.length > 0 ? product.gallery : template.gallery,
    categoryScores: categoryScores.length > 0 ? categoryScores : template.categoryScores,
    ourTake: product.ourTake?.trim() || template.ourTake,
    pros: overall?.pros?.length ? overall.pros : template.pros,
    cons: overall?.cons?.length ? overall.cons : template.cons,
    reviewUrl: reviewPageUrl(product.slug),
    affiliateUrl: product.affiliateUrl || template.affiliateUrl,
    priceMonthly: parseMonthlyPrice(product.pricingDisplay.monthly) ?? template.priceMonthly,
  };
}

export function hydrateRoundupPicks(
  templates: RoundupPick[],
  productsBySlug: Map<string, Product>,
): RoundupPick[] {
  return templates.map((template) => {
    const product = productsBySlug.get(template.slug);
    return product ? productToRoundupPick(template, product) : template;
  });
}

function compareRoundupPickOrder(
  a: RoundupPick,
  b: RoundupPick,
  entryBySlug: Map<string, RoundupEntryMeta>,
  productsBySlug: Map<string, Product>,
): number {
  const ea = entryBySlug.get(a.slug);
  const eb = entryBySlug.get(b.slug);

  // Default public order: live overall performance score from the product record.
  const scoreA = productsBySlug.get(a.slug)?.overallScore ?? a.overallScore ?? 0;
  const scoreB = productsBySlug.get(b.slug)?.overallScore ?? b.overallScore ?? 0;
  if (scoreB !== scoreA) return scoreB - scoreA;

  // Tiebreaker: formula-calculated position from the roundup entry.
  const ca = ea?.calculatedPosition ?? null;
  const cb = eb?.calculatedPosition ?? null;
  if (ca != null && cb != null) return ca - cb;
  if (ca != null) return -1;
  if (cb != null) return 1;

  return a.name.localeCompare(b.name);
}

/**
 * Build roundup picks from published reviews. Includes every published product
 * with an overall score unless a DB entry explicitly sets included: false.
 * Default order: live overall score (desc), then calculatedPosition, then name.
 */
export function resolveRoundupPicks(
  filePicks: RoundupPick[],
  publishedProducts: Product[],
  entries: RoundupEntryMeta[] = [],
): RoundupPick[] {
  const fileBySlug = new Map(filePicks.map((p) => [p.slug, p]));
  const productsBySlug = new Map(publishedProducts.map((p) => [p.slug, p]));
  const entryBySlug = new Map(entries.filter((e) => e.slug).map((e) => [e.slug, e]));

  const slugs: string[] = [];
  const seen = new Set<string>();

  for (const product of publishedProducts) {
    if (product.overallScore == null) continue;
    const entry = entryBySlug.get(product.slug);
    if (entry && !entry.included) continue;
    if (!seen.has(product.slug)) {
      slugs.push(product.slug);
      seen.add(product.slug);
    }
  }

  if (slugs.length === 0) {
    for (const pick of filePicks) {
      if (!seen.has(pick.slug)) {
        slugs.push(pick.slug);
        seen.add(pick.slug);
      }
    }
  }

  const templates: RoundupPick[] = [];
  for (const slug of slugs) {
    const product = productsBySlug.get(slug);
    const template = fileBySlug.get(slug) ?? (product ? minimalRoundupPickFromProduct(product) : null);
    if (!template) continue;

    let pick = { ...template };
    const entry = entryBySlug.get(slug);
    if (entry?.awardLabel) pick.ribbon = entry.awardLabel;
    if (entry?.reason) pick.overallSummary = entry.reason;
    templates.push(pick);
  }

  templates.sort((a, b) => compareRoundupPickOrder(a, b, entryBySlug, productsBySlug));

  const hydrated = hydrateRoundupPicks(templates, productsBySlug);
  return attachAwardsToPicks(hydrated, publishedProducts);
}

/** Hydrate at-a-glance stats from live product + pricing records. */
export async function enrichPicksWithAtGlance(
  picks: RoundupPick[],
  productsBySlug: Map<string, Product>,
): Promise<RoundupPick[]> {
  return Promise.all(
    picks.map(async (pick) => {
      const product = productsBySlug.get(pick.slug);
      if (!product) return pick;
      try {
        const pricingVm = await loadPricingTabViewModel(product);
        return { ...pick, atGlance: buildAtGlanceStats(product, pricingVm) };
      } catch {
        return pick;
      }
    }),
  );
}

/** Keep main TOC sections in display order (quick overview before how we test). */
function orderRoundupMainToc(sections: Roundup['tocSections']): Roundup['tocSections'] {
  const level2 = sections.filter((s) => s.level !== 3);
  const preferred = [
    'roundup-quick-picks',
    'roundup-testing',
    'roundup-selection',
    'roundup-detailed-picks',
    'roundup-compare',
    'roundup-faq',
    'roundup-conclusion',
  ];
  const byId = new Map(level2.map((s) => [s.id, s]));
  const ordered: Roundup['tocSections'] = [];
  for (const id of preferred) {
    const section = byId.get(id);
    if (section) ordered.push(section);
  }
  for (const section of level2) {
    if (!ordered.includes(section)) ordered.push(section);
  }
  return ordered;
}

function enrichTestingStats(testing: Roundup['testing'], appCount: number): Roundup['testing'] {
  const countLabel = `${appCount} app${appCount === 1 ? '' : 's'}`;
  return {
    ...testing,
    stats: testing.stats.map((stat) =>
      stat.icon === 'grid_view' ? { ...stat, title: countLabel } : stat,
    ),
  };
}
/** Sync roundup headings, TOC, compare defaults, and conclusion with resolved picks. */
export function enrichRoundupWithPicks(fileTemplate: Roundup, picks: RoundupPick[]): Roundup {
  const pickToc = picks.map((p) => ({
    id: `pick-${p.id}`,
    label: p.name,
    level: 3 as const,
  }));
  const mainToc = orderRoundupMainToc(fileTemplate.tocSections);
  const topPick = picks[0];

  return {
    ...fileTemplate,
    picks,
    testing: enrichTestingStats(fileTemplate.testing, picks.length),
    picksHeading:
      picks.length > 0
        ? `Our ${picks.length} Best AI Girlfriend App${picks.length === 1 ? '' : 's'}`
        : fileTemplate.picksHeading,
    compareDefaultIds: launchCompareDefaultIds(picks, []),
    tocSections: [...mainToc, ...pickToc],
    conclusion: {
      ...fileTemplate.conclusion,
      topPickId: topPick?.id ?? fileTemplate.conclusion.topPickId,
    },
  };
}

/** Minimal pick shell when a product is homepage-slotted but has no roundup template row. */
export function minimalRoundupPickFromProduct(product: Product): RoundupPick {
  const awardRibbon = product.overview?.highlights?.bestFor?.trim();
  return productToRoundupPick(
    {
      id: product.slug,
      slug: product.slug,
      name: product.name,
      logo: product.logo ?? '',
      ribbon: '',
      ribbonKey: '',
      awards: [],
      overallScore: product.overallScore ?? 0,
      overallSummary: product.overallSummary || product.tagline,
      priceMonthly: parseMonthlyPrice(product.pricingDisplay.monthly) ?? 0,
      intro: product.tagline,
      gallery: product.gallery,
      categoryScores: [],
      specs: [],
      pros: [],
      cons: [],
      ourTake: product.ourTake,
      affiliateUrl: product.affiliateUrl,
      reviewUrl: reviewPageUrl(product.slug),
    },
    product,
  );
}
