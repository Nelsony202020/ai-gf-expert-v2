import { countGlossaryOccurrences } from './match';
import type { GlossaryEntryRecord, PublishedGlossaryTerm } from './types';

export interface GlossaryUsageHit {
  productId: string;
  productName: string;
  productSlug: string;
  occurrences: number;
}

export interface GlossaryUsageSummary {
  reviewCount: number;
  occurrenceCount: number;
  reviews: GlossaryUsageHit[];
}

function plainTextFromBlocks(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const data = (block as { data?: Record<string, unknown> }).data ?? {};
    if (typeof data.text === 'string') parts.push(data.text);
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        if (typeof item === 'string') parts.push(item);
        else if (item && typeof item === 'object' && typeof (item as { text?: string }).text === 'string') {
          parts.push(String((item as { text: string }).text));
        }
      }
    }
  }
  return parts.join('\n');
}

/** Scan published product review bodies for term/alias occurrences (admin usage). */
export function calculateGlossaryUsage(
  entry: Pick<GlossaryEntryRecord, 'id' | 'term' | 'aliases' | 'anchor' | 'tooltipDefinition'>,
  products: Array<{
    id: string;
    name?: string;
    slug?: string;
    status?: string;
    reviewBlocks?: unknown;
    review?: { blocks?: unknown } | null;
  }>,
): GlossaryUsageSummary {
  const term: PublishedGlossaryTerm = {
    id: entry.id,
    term: entry.term,
    anchor: entry.anchor,
    tooltipDefinition: entry.tooltipDefinition || ' ',
    ctaLabel: '',
    aliases: entry.aliases ?? [],
    displayAliases: [],
    category: '',
  };

  const reviews: GlossaryUsageHit[] = [];
  let occurrenceCount = 0;

  for (const product of products) {
    if (product.status && product.status !== 'published') continue;
    const blocks = product.reviewBlocks ?? product.review?.blocks ?? [];
    const text = plainTextFromBlocks(blocks);
    const n = countGlossaryOccurrences(text, term);
    if (n <= 0) continue;
    occurrenceCount += n;
    reviews.push({
      productId: product.id,
      productName: String(product.name ?? product.slug ?? 'Review'),
      productSlug: String(product.slug ?? ''),
      occurrences: n,
    });
  }

  reviews.sort((a, b) => b.occurrences - a.occurrences || a.productName.localeCompare(b.productName));

  return {
    reviewCount: reviews.length,
    occurrenceCount,
    reviews,
  };
}
