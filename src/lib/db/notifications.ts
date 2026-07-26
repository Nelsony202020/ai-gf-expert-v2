// Admin notification storage: system-generated, deduplicated by dedupKey.
// Generators (cron, publish hooks) call upsertNotification; the drawer API
// reads and mutates per-admin read/dismiss state stored as JSON maps.

import { getDb, id as newId } from './server';

export interface NotificationInput {
  dedupKey: string;
  category: 'pricing' | 'testing' | 'publishing' | 'affiliates' | 'seo' | 'system';
  type: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message?: string;
  productId?: string;
  actionUrl?: string;
  secondaryActionUrl?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: number;
}

/**
 * Create or refresh a notification. An existing row with the same dedupKey is
 * updated in place (occurrenceCount bumped, content refreshed) instead of
 * creating a duplicate; dismissed state is preserved so admins are not
 * re-notified about an issue they already dismissed unless it re-fires after
 * `renotifyAfterMs`.
 */
export async function upsertNotification(
  input: NotificationInput,
  opts: { renotifyAfterMs?: number } = {},
): Promise<{ id: string; created: boolean }> {
  const db = getDb();
  const now = Date.now();
  const { notifications } = await db.query({
    notifications: { $: { where: { dedupKey: input.dedupKey } } },
  });
  const existing = (notifications as any[])[0];

  if (existing) {
    const dismissedBy = { ...(existing.dismissedBy ?? {}) } as Record<string, number>;
    const renotify = opts.renotifyAfterMs;
    if (renotify != null) {
      // Re-surface for admins whose dismissal is older than the window.
      for (const [user, ts] of Object.entries(dismissedBy)) {
        if (now - Number(ts) > renotify) delete dismissedBy[user];
      }
    }
    await db.transact(
      db.tx.notifications[existing.id].update({
        ...input,
        metadata: input.metadata ?? existing.metadata,
        occurrenceCount: Number(existing.occurrenceCount ?? 1) + 1,
        dismissedBy,
        updatedAt: now,
      }),
    );
    return { id: existing.id, created: false };
  }

  const id = newId();
  await db.transact(
    db.tx.notifications[id].update({
      ...input,
      occurrenceCount: 1,
      readBy: {},
      dismissedBy: {},
      createdAt: now,
      updatedAt: now,
    }),
  );
  return { id, created: true };
}

/** Remove a notification when its underlying condition no longer holds. */
export async function resolveNotification(dedupKey: string): Promise<boolean> {
  const db = getDb();
  const { notifications } = await db.query({
    notifications: { $: { where: { dedupKey } } },
  });
  const existing = (notifications as any[])[0];
  if (!existing) return false;
  await db.transact(db.tx.notifications[existing.id].delete());
  return true;
}
