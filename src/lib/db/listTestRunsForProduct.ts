import { getDb } from './server';

export type TestRunRow = Record<string, unknown> & {
  id: string;
  status?: string;
  isCurrentPublished?: boolean;
  createdAt?: number;
  updatedAt?: number;
  startedAt?: number;
  product?: { id?: string } | null;
};

function sortTestRuns(rows: TestRunRow[]): TestRunRow[] {
  return [...rows].sort(
    (a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0),
  );
}

/**
 * All test runs linked to a product. Prefer indexed link filter; fall back to
 * full scan (same pattern as score-history) when the link filter returns nothing.
 */
export async function listTestRunsForProduct(productId: string): Promise<TestRunRow[]> {
  const db = getDb();
  const linkIncludes = { product: {}, methodologyVersion: {} };

  const { testRuns: linked } = await (db.query as any)({
    testRuns: {
      $: { where: { 'product.id': productId } },
      ...linkIncludes,
    },
  });
  let rows = ((linked as TestRunRow[]) ?? []).filter((r) => !r.deletedAt);

  if (rows.length === 0) {
    const { products } = await (db.query as any)({
      products: {
        $: { where: { id: productId } },
        testRuns: linkIncludes,
      },
    });
    const fromProduct = (products as any[])?.[0]?.testRuns as TestRunRow[] | undefined;
    if (fromProduct?.length) {
      rows = fromProduct.filter((r) => !r.deletedAt);
    }
  }

  if (rows.length === 0) {
    const { testRuns: all } = await (db.query as any)({
      testRuns: { $: {}, ...linkIncludes },
    });
    rows = ((all as TestRunRow[]) ?? []).filter(
      (r) => !r.deletedAt && r.product?.id === productId,
    );
  }

  return sortTestRuns(rows);
}
