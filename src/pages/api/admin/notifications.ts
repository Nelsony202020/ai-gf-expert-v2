export const prerender = false;

// Admin notifications API.
// GET  /api/admin/notifications?filter=unread&category=pricing → list for me
// POST /api/admin/notifications { action: 'read'|'unread'|'dismiss'|'readAll', id? }
// Read/dismiss state is per-admin (JSON maps keyed by adminUserId) so one
// admin's actions never hide notifications from the rest of the team.

import type { APIRoute } from 'astro';
import { handler, json } from '../../../lib/api';
import { HttpError, requirePermission } from '../../../lib/db/auth';
import { getDb } from '../../../lib/db/server';

const MAX_RESULTS = 100;

export const GET: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'content.view');
  const url = new URL(request.url);
  const filter = url.searchParams.get('filter') ?? 'all'; // all | unread
  const category = url.searchParams.get('category');

  const db = getDb();
  const { notifications } = await db.query({ notifications: {} });
  const now = Date.now();

  const rows = (notifications as any[])
    .filter((n) => {
      if (n.expiresAt != null && Number(n.expiresAt) < now) return false;
      if ((n.dismissedBy ?? {})[identity.adminUserId] != null) return false;
      if (category && n.category !== category) return false;
      if (filter === 'unread' && (n.readBy ?? {})[identity.adminUserId] != null) return false;
      return true;
    })
    .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));

  const unreadCount = (notifications as any[]).filter(
    (n) =>
      (n.expiresAt == null || Number(n.expiresAt) >= now) &&
      (n.dismissedBy ?? {})[identity.adminUserId] == null &&
      (n.readBy ?? {})[identity.adminUserId] == null,
  ).length;

  return json({
    unreadCount,
    rows: rows.slice(0, MAX_RESULTS).map((n) => ({
      id: n.id,
      category: n.category,
      type: n.type,
      severity: n.severity,
      title: n.title,
      message: n.message ?? null,
      productId: n.productId ?? null,
      actionUrl: n.actionUrl ?? null,
      secondaryActionUrl: n.secondaryActionUrl ?? null,
      occurrenceCount: n.occurrenceCount ?? 1,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      read: (n.readBy ?? {})[identity.adminUserId] != null,
    })),
  });
});

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'content.view');
  const body = (await request.json().catch(() => ({}))) as { action?: string; id?: string };
  const db = getDb();
  const now = Date.now();

  if (body.action === 'readAll') {
    const { notifications } = await db.query({ notifications: {} });
    const txs = (notifications as any[])
      .filter(
        (n) =>
          (n.readBy ?? {})[identity.adminUserId] == null &&
          (n.dismissedBy ?? {})[identity.adminUserId] == null,
      )
      .map((n) =>
        db.tx.notifications[n.id].update({
          readBy: { ...(n.readBy ?? {}), [identity.adminUserId]: now },
          updatedAt: now,
        }),
      );
    if (txs.length > 0) await db.transact(txs);
    return json({ ok: true, updated: txs.length });
  }

  if (!body.id) throw new HttpError(400, 'id required');
  const { notifications } = await db.query({
    notifications: { $: { where: { id: body.id } } },
  });
  const row = (notifications as any[])[0];
  if (!row) throw new HttpError(404, 'Notification not found');

  if (body.action === 'read' || body.action === 'unread') {
    const readBy = { ...(row.readBy ?? {}) } as Record<string, number>;
    if (body.action === 'read') readBy[identity.adminUserId] = now;
    else delete readBy[identity.adminUserId];
    await db.transact(db.tx.notifications[row.id].update({ readBy, updatedAt: now }));
    return json({ ok: true });
  }

  if (body.action === 'dismiss') {
    await db.transact(
      db.tx.notifications[row.id].update({
        dismissedBy: { ...(row.dismissedBy ?? {}), [identity.adminUserId]: now },
        readBy: { ...(row.readBy ?? {}), [identity.adminUserId]: now },
        updatedAt: now,
      }),
    );
    return json({ ok: true });
  }

  throw new HttpError(400, `Unknown action: ${body.action}`);
});
