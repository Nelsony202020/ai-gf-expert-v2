import { getDb } from './server';

export type TestRunRow = Record<string, unknown> & {
  id: string;
  status?: string;
  isCurrentPublished?: boolean;
  createdAt?: number;
  updatedAt?: number;
  startedAt?: number;
  product?: unknown;
  deletedAt?: unknown;
};

/** Instant IDs are UUIDs; route params can pick up a trailing path segment on Vercel. */
export function normalizeInstantId(raw: string): string {
  const match = String(raw).match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  return match ? match[0] : String(raw).trim();
}

/** Instant has-one links may serialize as `{ id }`, `[{ id }]`, or a bare id string. */
export function linkedRecordId(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return linkedRecordId(value[0]);
  if (typeof value === 'object' && 'id' in (value as object)) {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' && id ? id : null;
  }
  return null;
}

function sortTestRuns(rows: TestRunRow[]): TestRunRow[] {
  return [...rows].sort(
    (a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0),
  );
}

function asRuns(value: unknown): TestRunRow[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((r) => r && typeof r === 'object' && r.id) as TestRunRow[];
  if (typeof value === 'object' && value && 'id' in value) return [value as TestRunRow];
  return [];
}

async function querySafe(query: Record<string, unknown>): Promise<any | null> {
  try {
    return await (getDb().query as any)(query);
  } catch (err) {
    console.warn('[listTestRunsForProduct] InstantDB query failed:', err);
    return null;
  }
}

function addRun(byId: Map<string, TestRunRow>, run: TestRunRow | null | undefined) {
  if (!run?.id || run.deletedAt) return;
  const existing = byId.get(run.id);
  if (!existing) {
    byId.set(run.id, run);
    return;
  }
  const existingKeys = Object.keys(existing).length;
  const nextKeys = Object.keys(run).length;
  if (nextKeys > existingKeys) byId.set(run.id, run);
}

/**
 * All test runs for a product. InstantDB link filters are unreliable across
 * admin SDK versions (where `'product.id'` can throw; has-one `product` can be
 * an array), so we merge every path that can recover a run:
 * product reverse link, evidence/snapshot nested runs, link where, full scan.
 */
export async function listTestRunsForProduct(productIdRaw: string): Promise<TestRunRow[]> {
  const productId = normalizeInstantId(productIdRaw);
  const byId = new Map<string, TestRunRow>();
  const includes = { product: {}, methodologyVersion: {} };

  const [fromProduct, fromWhereDot, fromWhereLink, allRuns] = await Promise.all([
    querySafe({
      products: {
        $: { where: { id: productId } },
        testRuns: includes,
        evidenceResults: { testRun: includes },
        scoreSnapshots: { testRun: includes },
      },
    }),
    querySafe({
      testRuns: {
        $: { where: { 'product.id': productId } },
        ...includes,
      },
    }),
    querySafe({
      testRuns: {
        $: { where: { product: productId } },
        ...includes,
      },
    }),
    querySafe({
      testRuns: includes,
    }),
  ]);

  const product = fromProduct?.products?.[0];
  for (const run of asRuns(product?.testRuns)) addRun(byId, run);
  for (const row of asRuns(product?.evidenceResults)) addRun(byId, asRuns(row.testRun)[0]);
  for (const row of asRuns(product?.scoreSnapshots)) addRun(byId, asRuns(row.testRun)[0]);

  for (const run of asRuns(fromWhereDot?.testRuns)) addRun(byId, run);
  for (const run of asRuns(fromWhereLink?.testRuns)) addRun(byId, run);

  for (const run of asRuns(allRuns?.testRuns)) {
    if (linkedRecordId(run.product) === productId) addRun(byId, run);
  }

  return sortTestRuns([...byId.values()]);
}
