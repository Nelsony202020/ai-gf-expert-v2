// Keeps product.homepageFeatured ↔ homepageSlots (top_pick) ↔ public homepage in sync.

import { getDb, id as newId, isDbConfigured } from '../db/server';
import { HttpError } from '../db/auth';

export const MAX_HOMEPAGE_TOP_PICKS = 3;

async function nextTopPickPosition(): Promise<number> {
  const db = getDb();
  const { homepageSlots } = await (db.query as any)({
    homepageSlots: { $: { where: { kind: 'top_pick' } } },
  });
  const max = (homepageSlots as any[]).reduce((m, s) => Math.max(m, s.position ?? 0), 0);
  return max + 1;
}

async function activeTopPickCount(excludeSlotId?: string): Promise<number> {
  const db = getDb();
  const { homepageSlots } = await (db.query as any)({
    homepageSlots: { $: { where: { kind: 'top_pick', active: true } } },
  });
  return (homepageSlots as any[]).filter((s) => s.id !== excludeSlotId).length;
}

export async function setProductHomepageFeaturedFlag(
  productId: string,
  featured: boolean,
): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  await db.transact([
    (db.tx as any).products[productId].update({ homepageFeatured: featured, updatedAt: Date.now() }),
  ]);
}

/** Create, reactivate, or deactivate the homepage top-pick slot for a product. */
export async function syncProductHomepageSlot(
  productId: string,
  featured: boolean,
  displayOrder?: number | null,
): Promise<void> {
  if (!isDbConfigured()) return;

  const db = getDb();
  const { products } = await (db.query as any)({
    products: { $: { where: { id: productId } }, homepageSlots: {} },
  });
  const product = (products as any[])?.[0];
  if (!product || product.deletedAt) return;

  const existingSlot = (product.homepageSlots ?? []).find((s: any) => s.kind === 'top_pick');

  if (!featured) {
    if (existingSlot && existingSlot.active !== false) {
      await db.transact([
        (db.tx as any).homepageSlots[existingSlot.id].update({
          active: false,
          updatedAt: Date.now(),
        }),
      ]);
    }
    return;
  }

  const position =
    typeof displayOrder === 'number' && displayOrder > 0
      ? displayOrder
      : existingSlot?.position ?? (await nextTopPickPosition());

  if (existingSlot) {
    await db.transact([
      (db.tx as any).homepageSlots[existingSlot.id]
        .update({ active: true, position, updatedAt: Date.now() })
        .link({ product: productId }),
    ]);
    return;
  }

  if ((await activeTopPickCount()) >= MAX_HOMEPAGE_TOP_PICKS) {
    throw new HttpError(
      409,
      `Homepage already has ${MAX_HOMEPAGE_TOP_PICKS} top picks. Remove one from Homepage → Top brands first.`,
    );
  }

  const slotId = newId();
  await db.transact([
    (db.tx as any).homepageSlots[slotId]
      .update({
        kind: 'top_pick',
        position,
        active: true,
        updatedAt: Date.now(),
      })
      .link({ product: productId }),
  ]);
}

/** Ensure every homepageFeatured product has an active top_pick slot (backfill). */
export async function reconcileFeaturedProductSlots(): Promise<number> {
  if (!isDbConfigured()) return 0;

  const db = getDb();
  const { products } = await (db.query as any)({
    products: { $: { where: { status: 'published', homepageFeatured: true } }, homepageSlots: {} },
  });

  let synced = 0;
  for (const product of products as any[]) {
    if (product.deletedAt) continue;
    const hasLiveSlot = (product.homepageSlots ?? []).some(
      (s: any) => s.kind === 'top_pick' && s.active !== false,
    );
    if (!hasLiveSlot) {
      try {
        await syncProductHomepageSlot(
          product.id,
          true,
          typeof product.displayOrder === 'number' ? product.displayOrder : null,
        );
        synced++;
      } catch (error) {
        if (error instanceof HttpError && error.status === 409) break;
        throw error;
      }
    }
  }
  return synced;
}

/** After homepage slot changes — keep product.homepageFeatured aligned. */
export async function syncHomepageSlotToProduct(
  slotId: string,
  kind: string,
  active: boolean,
  productId: string | null | undefined,
): Promise<void> {
  if (kind !== 'top_pick' || !productId || !isDbConfigured()) return;

  if (active) {
    await setProductHomepageFeaturedFlag(productId, true);
    return;
  }

  const db = getDb();
  const { homepageSlots } = await (db.query as any)({
    homepageSlots: {
      $: { where: { kind: 'top_pick', active: true } },
      product: {},
    },
  });
  const stillFeatured = (homepageSlots as any[]).some(
    (s) => s.id !== slotId && s.product?.id === productId,
  );
  if (!stillFeatured) {
    await setProductHomepageFeaturedFlag(productId, false);
  }
}

export async function onHomepageTopPickSlotRemoved(slot: any): Promise<void> {
  if (slot?.kind !== 'top_pick' || !slot.product?.id) return;
  await setProductHomepageFeaturedFlag(slot.product.id, false);
}
