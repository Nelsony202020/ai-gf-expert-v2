import type { Product } from '../../data/products';
import type { RoundupPick, RoundupCategoryScore } from '../../data/roundups/ai-girlfriend';
import { reviewPageUrl } from '../slugs';

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

  const hero = product.featuredImage?.full ?? product.gallery[0]?.full ?? template.logo;
  const overall = product.verdicts.find((v) => v.id === 'overall');

  return {
    ...template,
    slug: product.slug,
    id: template.id || product.slug,
    name: product.name,
    logo: hero,
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

/** Minimal pick shell when a product is homepage-slotted but has no roundup template row. */
export function minimalRoundupPickFromProduct(product: Product): RoundupPick {
  return productToRoundupPick(
    {
      id: product.slug,
      slug: product.slug,
      name: product.name,
      logo: product.featuredImage?.full ?? product.gallery[0]?.full ?? '',
      ribbon: 'Featured',
      ribbonKey: 'overall',
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
