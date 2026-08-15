import { getDb } from './server';
import { awardsConflict, type ProductAward } from '../awards';

/**
 * Each award label may only be assigned to one product.
 * When product A takes a label, clear it from every other product that had it.
 */
export async function clearConflictingProductAwards(
  productId: string,
  award: ProductAward | null | undefined,
): Promise<void> {
  if (!award || award.kind === 'none' || award.active === false) return;

  const db = getDb();
  const { products } = await (db.query as any)({
    products: { $: {} },
  });

  const txChunks: any[] = [];
  for (const row of (products ?? []) as any[]) {
    if (!row?.id || row.id === productId || row.deletedAt) continue;
    if (!awardsConflict(award, row.award)) continue;
    txChunks.push(
      db.tx.products[row.id].update({
        award: { kind: 'none', active: false },
        bestForLabel: '',
      }),
    );
  }

  if (txChunks.length === 0) return;
  await db.transact(txChunks);
}
