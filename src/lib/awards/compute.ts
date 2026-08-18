import type { Product } from '../../data/products';
import type { RoundupPick } from '../../data/roundups/ai-girlfriend';

/** Public editorial awards — only these are computed and shown platform-wide. */
export const PUBLIC_AWARD_DEFS = [
  { kind: 'best_overall', label: 'Best Overall', sortKey: 'overall', categoryKey: null as string | null },
  { kind: 'best_images', label: 'Best Images', sortKey: 'images', categoryKey: 'images' },
  { kind: 'best_videos', label: 'Best Videos', sortKey: 'videos', categoryKey: 'video' },
  { kind: 'best_roleplay', label: 'Best Roleplay', sortKey: 'roleplay', categoryKey: 'chat' },
  { kind: 'best_price', label: 'Best Price', sortKey: 'price', categoryKey: 'pricing' },
] as const;

export type PublicAwardKind = (typeof PUBLIC_AWARD_DEFS)[number]['kind'];

export interface ProductAwardBadge {
  kind: PublicAwardKind;
  label: string;
  sortKey: string;
}

export const AWARD_PRIORITY: PublicAwardKind[] = PUBLIC_AWARD_DEFS.map((d) => d.kind);

function scoreForProduct(product: Product, kind: PublicAwardKind): number | null {
  const def = PUBLIC_AWARD_DEFS.find((d) => d.kind === kind);
  if (!def) return null;
  if (kind === 'best_overall') {
    return product.overallScore ?? null;
  }
  if (!def.categoryKey) return null;
  const cat = product.categories.find((c) => c.key === def.categoryKey);
  return cat?.score ?? null;
}

/** Compute award winners from published products (supports ties). */
export function computeProductAwardIndex(products: Product[]): Map<string, ProductAwardBadge[]> {
  const index = new Map<string, ProductAwardBadge[]>();
  const eligible = products.filter((p) => p.overallScore != null);

  for (const def of PUBLIC_AWARD_DEFS) {
    const scored = eligible
      .map((product) => ({
        slug: product.slug,
        score: scoreForProduct(product, def.kind),
      }))
      .filter((row): row is { slug: string; score: number } => row.score != null && Number.isFinite(row.score));

    if (scored.length === 0) continue;

    const max = Math.max(...scored.map((row) => row.score));
    const winners = scored.filter((row) => row.score === max);

    for (const winner of winners) {
      const existing = index.get(winner.slug) ?? [];
      existing.push({ kind: def.kind, label: def.label, sortKey: def.sortKey });
      index.set(winner.slug, existing);
    }
  }

  return index;
}

export function getPrimaryAward(awards: ProductAwardBadge[]): ProductAwardBadge | null {
  if (!awards.length) return null;
  for (const kind of AWARD_PRIORITY) {
    const match = awards.find((a) => a.kind === kind);
    if (match) return match;
  }
  return awards[0] ?? null;
}

export function getSecondaryAwards(awards: ProductAwardBadge[]): ProductAwardBadge[] {
  const primary = getPrimaryAward(awards);
  if (!primary) return [];
  return awards.filter((a) => a.kind !== primary.kind);
}

export function getContextualAward(awards: ProductAwardBadge[], sortKey: string): ProductAwardBadge | null {
  return awards.find((a) => a.sortKey === sortKey) ?? null;
}

export function getAwardsForSlug(slug: string, products: Product[]): ProductAwardBadge[] {
  return computeProductAwardIndex(products).get(slug) ?? [];
}

export function attachAwardsToPicks(picks: RoundupPick[], products: Product[]): RoundupPick[] {
  const index = computeProductAwardIndex(products);
  return picks.map((pick) => {
    const awards = index.get(pick.slug) ?? [];
    const primary = getPrimaryAward(awards);
    return {
      ...pick,
      awards,
      ribbon: primary?.label ?? '',
      ribbonKey: primary?.sortKey ?? '',
    };
  });
}
