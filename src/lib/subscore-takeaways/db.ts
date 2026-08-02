import { getDb } from '../db/server';

export async function loadTakeawayRowsByKey(productId: string): Promise<Map<string, any>> {
  const db = getDb();
  const { subscoreTakeaways } = await (db.query as any)({
    subscoreTakeaways: {
      $: { where: { 'product.id': productId } },
      product: {},
    },
  });
  const map = new Map<string, any>();
  for (const row of (subscoreTakeaways as any[]) ?? []) {
    if (row.subscoreKey) map.set(String(row.subscoreKey), row);
  }
  return map;
}

export function findTakeawayInMap(byKey: Map<string, any>, subscoreKey: string) {
  return byKey.get(subscoreKey);
}
