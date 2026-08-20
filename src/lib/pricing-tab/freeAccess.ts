/**
 * Server loader for free-access testing answers.
 * Pure types/builders live in freeAccessShared.ts (safe for admin client).
 */

import { getDb, isDbConfigured } from '../db/server';
import type { RawValue } from '../scoring/engine';
import {
  buildPricingFreeAccessFromRows,
  type PricingFreeAccess,
} from './freeAccessShared';

export * from './freeAccessShared';

/**
 * Load free-access answers from the product's published test run
 * (fallback: most recent run with any free-access answers).
 */
export async function loadFreeAccessFromTesting(
  productSlug: string,
): Promise<PricingFreeAccess | null> {
  if (!isDbConfigured()) return null;
  const db = getDb();
  const { products } = await db.query({
    products: {
      $: { where: { slug: productSlug } },
      testRuns: {},
      evidenceResults: {
        testRun: {},
        evidenceDefinition: { subscore: {} },
      },
    },
  });
  const product = (products as any[])?.[0];
  if (!product) return null;

  const runs = (product.testRuns ?? []) as Array<{
    id: string;
    isCurrentPublished?: boolean;
  }>;
  const published = runs.find((r) => r.isCurrentPublished);
  const results = (product.evidenceResults ?? []) as Array<{
    rawValue?: RawValue;
    notApplicable?: boolean;
    testRun?: { id?: string };
    evidenceDefinition?: { slug?: string; subscore?: { slug?: string } };
  }>;

  return buildPricingFreeAccessFromRows(
    results.map((r) => ({
      rawValue: r.rawValue,
      notApplicable: r.notApplicable,
      testRunId: r.testRun?.id ?? null,
      slug: r.evidenceDefinition?.slug ?? null,
      subscoreSlug: r.evidenceDefinition?.subscore?.slug ?? null,
    })),
    { publishedRunId: published?.id ?? null },
  );
}
