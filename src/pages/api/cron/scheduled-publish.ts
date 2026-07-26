export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../lib/api';
import { HttpError, type AdminIdentity } from '../../../lib/db/auth';
import { getDb, isDbConfigured } from '../../../lib/db/server';
import { publishProduct } from '../../../lib/db/publish';
import { env } from '../../../lib/env';

const SYSTEM_IDENTITY = { email: 'scheduler', role: 'admin' } as AdminIdentity;

/**
 * Scheduled publishing — run by Vercel cron (see vercel.json). Publishes any
 * product with status "scheduled" whose scheduledAt has passed. Products that
 * fail publish validation stay scheduled and are reported for the dashboard.
 */
export const GET: APIRoute = handler(async ({ request }) => {
  const secret = env('CRON_SECRET');
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    throw new HttpError(401, 'Unauthorized');
  }
  if (!isDbConfigured()) return json({ ok: true, skipped: 'db not configured' });

  const db = getDb();
  const now = Date.now();
  const { products } = await db.query({ products: {} });
  const due = (products as any[]).filter(
    (p) => !p.deletedAt && p.status === 'scheduled' && p.scheduledAt && Number(p.scheduledAt) <= now,
  );

  const published: string[] = [];
  const failed: { name: string; errors: string[] }[] = [];

  for (const product of due) {
    try {
      await publishProduct(product.id, SYSTEM_IDENTITY);
      published.push(product.name);
    } catch (error) {
      failed.push({
        name: product.name,
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
  }

  return json({ ok: true, due: due.length, published, failed });
});
