import { getDb } from './server';
import { isPermanentCdnUrl } from '../media/permanentUrl';
import {
  listTestRunsForProduct,
  linkedRecordId,
  normalizeInstantId,
  type TestRunRow,
} from './listTestRunsForProduct';

export type ScoreHistoryRun = {
  runId: string;
  runName: string;
  status: string;
  isCurrentPublished: boolean;
  methodologyVersion: string | null;
  publishedAt: number | null;
  overall: number | null;
  categories: { slug: string; value: number; weight?: number }[];
};

export type ProductWorkspaceRelated = {
  authors: Record<string, unknown>[];
  mediaAll: Record<string, unknown>[];
  media: Record<string, unknown>[];
  testRuns: TestRunRow[];
  plans: Record<string, unknown>[];
  packages: Record<string, unknown>[];
  paymentProfile: Record<string, unknown> | null;
  characters: Record<string, unknown>[];
  affiliateLinks: Record<string, unknown>[];
  review: Record<string, unknown> | null;
  categories: Record<string, unknown>[];
  scoreHistory: ScoreHistoryRun[];
  pricingSnapshots: Record<string, unknown>[];
  featureCosts: Record<string, unknown>[];
  pricingPromotions: Record<string, unknown>[];
};

function asRecords(value: unknown): Record<string, any>[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((r) => r && typeof r === 'object' && r.id) as Record<string, any>[];
  }
  if (typeof value === 'object' && value && 'id' in value) return [value as Record<string, any>];
  return [];
}

function asOne(value: unknown): Record<string, any> | null {
  return asRecords(value)[0] ?? null;
}

function refreshMediaUrl(mediaRow: any) {
  if (!mediaRow || typeof mediaRow !== 'object') return;
  const cached = mediaRow.url ? String(mediaRow.url) : '';
  if (isPermanentCdnUrl(cached)) return;
  if (mediaRow.file?.url) mediaRow.url = mediaRow.file.url;
}

async function querySafe(query: Record<string, unknown>): Promise<any | null> {
  try {
    return await (getDb().query as any)(query);
  } catch (err) {
    console.warn('[loadProductWorkspace] InstantDB query failed:', err);
    return null;
  }
}

function mapScoreHistory(runs: TestRunRow[]): ScoreHistoryRun[] {
  return runs
    .filter((r) => r.status === 'published' || r.status === 'superseded')
    .sort(
      (a, b) =>
        Number((b as { publishedAt?: number }).publishedAt ?? 0) -
        Number((a as { publishedAt?: number }).publishedAt ?? 0),
    )
    .map((r) => {
      const snapshots = asRecords((r as { scoreSnapshots?: unknown }).scoreSnapshots);
      const overall = snapshots.find((s) => s.kind === 'overall');
      const categories = snapshots
        .filter((s) => s.kind === 'category')
        .sort((a, b) => String(a.refSlug).localeCompare(String(b.refSlug)))
        .map((s) => ({ slug: s.refSlug, value: s.score, weight: s.weight }));
      return {
        runId: r.id,
        runName: String((r as { name?: string }).name ?? ''),
        status: String(r.status ?? ''),
        isCurrentPublished: Boolean(r.isCurrentPublished),
        methodologyVersion:
          (r as { methodologyVersion?: { version?: string } }).methodologyVersion?.version ?? null,
        publishedAt: ((r as { publishedAt?: number }).publishedAt ?? null) as number | null,
        overall: overall?.score ?? null,
        categories,
      };
    });
}

/**
 * Load every InstantDB record the product workspace needs by walking the
 * product's reverse links (same pattern as the public site). Global list-then-
 * filter is a fallback only — Instant truncates large namespaces, and one
 * failed list used to blank every tab.
 */
export async function loadProductWorkspaceRelated(
  productIdRaw: string,
): Promise<ProductWorkspaceRelated> {
  const productId = normalizeInstantId(productIdRaw);

  const [
    editorial,
    pricing,
    people,
    testing,
    mediaQ,
    catalogs,
    globalMedia,
  ] = await Promise.all([
    querySafe({
      products: {
        $: { where: { id: productId } },
        review: { author: {}, factChecker: {} },
        affiliateLinks: {},
      },
    }),
    querySafe({
      products: {
        $: { where: { id: productId } },
        paymentProfile: {},
        subscriptionPlans: {},
        creditPackages: {},
        pricingSnapshots: {},
        featureCosts: {},
        pricingPromotions: {},
      },
    }),
    querySafe({
      products: {
        $: { where: { id: productId } },
        characters: { image: { file: {} } },
      },
    }),
    querySafe({
      products: {
        $: { where: { id: productId } },
        testRuns: { product: {}, methodologyVersion: {}, scoreSnapshots: {} },
        scoreSnapshots: { testRun: {} },
        evidenceResults: { testRun: { product: {}, methodologyVersion: {} } },
      },
    }),
    querySafe({
      products: {
        $: { where: { id: productId } },
        media: { file: {} },
      },
    }),
    querySafe({
      authors: {},
      categories: {},
    }),
    querySafe({
      media: { file: {} },
    }),
  ]);

  const editorialProduct = editorial?.products?.[0];
  const pricingProduct = pricing?.products?.[0];
  const peopleProduct = people?.products?.[0];
  const testingProduct = testing?.products?.[0];
  const mediaProduct = mediaQ?.products?.[0];

  const media = asRecords(mediaProduct?.media);
  for (const row of media) refreshMediaUrl(row);

  const mediaAll = asRecords(globalMedia?.media);
  for (const row of mediaAll) refreshMediaUrl(row);
  const mediaAllById = new Map(mediaAll.map((m) => [m.id, m]));
  for (const row of media) mediaAllById.set(row.id, row);

  const nestedRuns = [
    ...asRecords(testingProduct?.testRuns),
    ...asRecords(testingProduct?.evidenceResults).flatMap((row) => asRecords(row.testRun)),
    ...asRecords(testingProduct?.scoreSnapshots).flatMap((row) => asRecords(row.testRun)),
  ] as TestRunRow[];
  const listedRuns =
    nestedRuns.length > 0 ? [] : await listTestRunsForProduct(productId);
  const runsById = new Map<string, TestRunRow>();
  for (const run of [...nestedRuns, ...listedRuns]) {
    if (!run?.id || run.deletedAt) continue;
    const prev = runsById.get(run.id);
    if (!prev || Object.keys(run).length > Object.keys(prev).length) runsById.set(run.id, run);
  }

  const testRuns = [...runsById.values()].sort(
    (a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0),
  );

  const characters = asRecords(peopleProduct?.characters);
  for (const row of characters) refreshMediaUrl(row.image);

  const categories = asRecords(catalogs?.categories)
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return {
    authors: asRecords(catalogs?.authors),
    mediaAll: [...mediaAllById.values()],
    media: media.filter((m) => !m.deletedAt),
    testRuns,
    plans: asRecords(pricingProduct?.subscriptionPlans).filter((r) => !r.deletedAt),
    packages: asRecords(pricingProduct?.creditPackages).filter((r) => !r.deletedAt),
    paymentProfile: asOne(pricingProduct?.paymentProfile),
    characters: characters.filter((c) => !c.deletedAt),
    affiliateLinks: asRecords(editorialProduct?.affiliateLinks).filter((r) => !r.deletedAt),
    review: asOne(editorialProduct?.review),
    categories,
    scoreHistory: mapScoreHistory(testRuns),
    pricingSnapshots: asRecords(pricingProduct?.pricingSnapshots)
      .filter((r) => !r.deletedAt)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    featureCosts: asRecords(pricingProduct?.featureCosts).filter((r) => !r.deletedAt),
    pricingPromotions: asRecords(pricingProduct?.pricingPromotions).filter((r) => !r.deletedAt),
  };
}

export function belongsToProduct(row: { product?: unknown }, productId: string): boolean {
  return linkedRecordId(row.product) === productId;
}
