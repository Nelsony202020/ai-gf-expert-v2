import { getDb, isDbConfigured } from '../db/server';
import {
  assembleExplanationContextFromBundle,
  loadExplanationProductBundle,
} from './assembleContext';
import { listAllEvidenceGroups } from './groups';

/** Approved, non-stale explanations for public review drawers. */
export async function loadApprovedExplanationMap(
  productId: string,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!isDbConfigured()) return out;

  const db = getDb();
  const [{ evidenceExplanations }, bundle] = await Promise.all([
    (db.query as any)({
      evidenceExplanations: {
        $: { where: { 'product.id': productId, explanationStatus: 'approved' } },
        product: {},
      },
    }),
    loadExplanationProductBundle(productId).catch(() => null),
  ]);

  if (!bundle) return out;

  for (const row of (evidenceExplanations as any[]) ?? []) {
    if (!row.whatThisMeans?.trim() || !row.groupKey) continue;
    try {
      const context = assembleExplanationContextFromBundle(bundle, String(row.groupKey));
      if (row.inputHash && row.inputHash !== context.inputHash) continue;
      out.set(String(row.groupKey), String(row.whatThisMeans).trim());
    } catch {
      /* skip groups we cannot assemble */
    }
  }

  return out;
}

export async function loadApprovedExplanationMapBySlug(
  productSlug: string,
): Promise<Map<string, string>> {
  if (!isDbConfigured()) return new Map();
  const db = getDb();
  const { products } = await (db.query as any)({
    products: { $: { where: { slug: productSlug } } },
  });
  const product = (products as any[])?.find((p) => !p.deletedAt);
  if (!product) return new Map();
  return loadApprovedExplanationMap(product.id);
}

export function countGeneratableGroups(): number {
  return listAllEvidenceGroups().length;
}
