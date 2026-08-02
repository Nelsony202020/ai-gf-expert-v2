import { getDb } from '../db/server';

/** All explanation rows for a product, keyed by groupKey. One query per request. */
export async function loadExplanationRowsByKey(productId: string): Promise<Map<string, any>> {
  const db = getDb();
  const { evidenceExplanations } = await (db.query as any)({
    evidenceExplanations: {
      $: { where: { 'product.id': productId } },
      product: {},
    },
  });
  const byKey = new Map<string, any>();
  for (const row of (evidenceExplanations as any[]) ?? []) {
    byKey.set(String(row.groupKey), row);
  }
  return byKey;
}

export function findExplanationInMap(byKey: Map<string, any>, groupKey: string): any | null {
  return byKey.get(groupKey) ?? null;
}
