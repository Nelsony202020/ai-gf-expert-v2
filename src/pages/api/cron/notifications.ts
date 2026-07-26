export const prerender = false;

// Notification generator — run daily by Vercel cron (see vercel.json).
// Materializes "needs attention" signals into the notifications entity with
// stable dedup keys, and resolves notifications whose condition cleared.
// Currently pricing-focused; other categories plug in the same way.

import type { APIRoute } from 'astro';
import { handler, json } from '../../../lib/api';
import { HttpError } from '../../../lib/db/auth';
import { getDb, isDbConfigured } from '../../../lib/db/server';
import { resolveNotification, upsertNotification } from '../../../lib/db/notifications';
import { env } from '../../../lib/env';

const DAY = 24 * 60 * 60 * 1000;
const STALE_PRICE_DAYS = 60;
const PENDING_REVIEW_DAYS = 7;
const RENOTIFY_MS = 14 * DAY; // re-surface dismissed reminders after two weeks

export const GET: APIRoute = handler(async ({ request }) => {
  const secret = env('CRON_SECRET');
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    throw new HttpError(401, 'Unauthorized');
  }
  if (!isDbConfigured()) return json({ ok: true, skipped: 'db not configured' });

  const db = getDb();
  const now = Date.now();
  const { products } = await db.query({
    products: {
      subscriptionPlans: {},
      pricingSnapshots: {},
      pricingPromotions: {},
    },
  });

  let created = 0;
  let refreshed = 0;
  let resolved = 0;

  async function upsert(input: Parameters<typeof upsertNotification>[0]) {
    const r = await upsertNotification(input, { renotifyAfterMs: RENOTIFY_MS });
    if (r.created) created += 1;
    else refreshed += 1;
  }

  async function resolve(dedupKey: string) {
    if (await resolveNotification(dedupKey)) resolved += 1;
  }

  for (const p of products as any[]) {
    if (p.deletedAt) continue;
    const isLive = p.status === 'published' || p.status === 'scheduled';
    const pricingUrl = `/products/${p.id}/pricing`;
    const snapshots = (p.pricingSnapshots ?? []).filter((s: any) => !s.deletedAt);
    const activePlans = (p.subscriptionPlans ?? []).filter((pl: any) => pl.active);

    // --- Pricing verification freshness (live products with pricing data)
    const staleKey = `pricing-stale:${p.id}`;
    const verifiedTimes = [
      ...snapshots.map((s: any) => Number(s.verifiedAt ?? 0)),
      ...activePlans.map((pl: any) => Number(pl.lastVerifiedAt ?? 0)),
    ].filter((t) => t > 0);
    const lastVerified = verifiedTimes.length > 0 ? Math.max(...verifiedTimes) : null;
    const hasPricing = activePlans.length > 0 || snapshots.length > 0;
    const staleDays = lastVerified !== null ? Math.floor((now - lastVerified) / DAY) : null;
    const isStale = isLive && hasPricing && (lastVerified === null || staleDays! >= STALE_PRICE_DAYS);
    if (isStale) {
      await upsert({
        dedupKey: staleKey,
        category: 'pricing',
        type: 'verification_overdue',
        severity: staleDays !== null && staleDays >= STALE_PRICE_DAYS * 2 ? 'critical' : 'warning',
        title: `Pricing verification overdue: ${p.name}`,
        message:
          lastVerified === null
            ? 'Pricing has never been verified for this live product.'
            : `Last verified ${staleDays} days ago (limit ${STALE_PRICE_DAYS} days).`,
        productId: p.id,
        actionUrl: pricingUrl,
      });
    } else {
      await resolve(staleKey);
    }

    // --- Drafts sitting in review
    for (const s of snapshots) {
      const pendingKey = `pricing-pending-review:${s.id}`;
      const pendingSince = Number(s.updatedAt ?? s.createdAt ?? 0);
      if (s.status === 'pending_review' && now - pendingSince > PENDING_REVIEW_DAYS * DAY) {
        await upsert({
          dedupKey: pendingKey,
          category: 'pricing',
          type: 'pending_review',
          severity: 'info',
          title: `Pricing draft awaiting review: ${p.name}`,
          message: `A pricing draft has been pending review since ${new Date(pendingSince).toLocaleDateString()}.`,
          productId: p.id,
          actionUrl: pricingUrl,
        });
      } else {
        await resolve(pendingKey);
      }
    }

    // --- Promotions past their end date but still marked active
    for (const promo of (p.pricingPromotions ?? []) as any[]) {
      const promoKey = `promotion-expired:${promo.id}`;
      const endAt = promo.endAt != null ? Number(promo.endAt) : null;
      if (promo.status === 'active' && endAt !== null && endAt < now) {
        await upsert({
          dedupKey: promoKey,
          category: 'pricing',
          type: 'promotion_expired',
          severity: 'warning',
          title: `Promotion ended but still active: ${p.name}`,
          message: `"${promo.name}" ended ${new Date(endAt).toLocaleDateString()} — mark it expired or extend it.`,
          productId: p.id,
          actionUrl: pricingUrl,
        });
      } else {
        await resolve(promoKey);
      }
    }
  }

  return json({ ok: true, created, refreshed, resolved });
});
