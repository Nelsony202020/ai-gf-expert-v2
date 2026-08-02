import { getDb, isDbConfigured } from '../db/server';
import { loadExplanationProductBundle } from '../ai-explanations/assembleContext';
import { assembleSubscoreTakeawayFromBundle } from './assembleContext';

/** Approved, non-stale key takeaways for public subscore calc drawers. */
export async function loadApprovedTakeawayMap(productId: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!isDbConfigured()) return out;

  const db = getDb();
  const [{ subscoreTakeaways }, bundle] = await Promise.all([
    (db.query as any)({
      subscoreTakeaways: {
        $: { where: { 'product.id': productId, takeawayStatus: 'approved' } },
        product: {},
      },
    }),
    loadExplanationProductBundle(productId).catch(() => null),
  ]);

  if (!bundle) return out;

  for (const row of (subscoreTakeaways as any[]) ?? []) {
    if (!row.keyTakeaway?.trim() || !row.subscoreKey) continue;
    try {
      const context = assembleSubscoreTakeawayFromBundle(bundle, String(row.subscoreKey));
      if (row.inputHash && row.inputHash !== context.inputHash) continue;
      out.set(String(row.subscoreKey), String(row.keyTakeaway).trim());
    } catch {
      /* skip */
    }
  }

  return out;
}

export async function loadApprovedTakeawayMapBySlug(productSlug: string): Promise<Map<string, string>> {
  if (!isDbConfigured()) return new Map();
  const db = getDb();
  const { products } = await (db.query as any)({
    products: { $: { where: { slug: productSlug } } },
  });
  const product = (products as any[])?.find((p) => !p.deletedAt);
  if (!product) return new Map();
  return loadApprovedTakeawayMap(product.id);
}
