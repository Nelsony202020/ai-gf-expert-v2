export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { getDb } from '../../../../lib/db/server';

interface LinkCheckResult {
  id: string;
  cloakedSlug: string;
  destinationUrl: string;
  status: 'ok' | 'redirect' | 'broken';
  httpStatus: number | null;
}

async function checkUrl(url: string): Promise<{ status: LinkCheckResult['status']; httpStatus: number | null }> {
  try {
    // HEAD first; some affiliate networks reject HEAD, so fall back to GET.
    let res = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(10000) });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(10000) });
    }
    if (res.status >= 200 && res.status < 300) return { status: 'ok', httpStatus: res.status };
    if (res.status >= 300 && res.status < 400) return { status: 'redirect', httpStatus: res.status };
    return { status: 'broken', httpStatus: res.status };
  } catch {
    return { status: 'broken', httpStatus: null };
  }
}

/**
 * Link health check: verifies every active affiliate destination and records
 * lastCheckStatus/lastVerifiedAt. Broken links surface on the dashboard.
 */
export const POST: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'affiliates.edit');
  const db = getDb();
  const { affiliateLinks } = await db.query({ affiliateLinks: {} });
  const active = (affiliateLinks as any[]).filter((l) => l.active);

  const now = Date.now();
  const results: LinkCheckResult[] = [];
  // Sequential-ish batches to avoid hammering destinations.
  const BATCH = 5;
  for (let i = 0; i < active.length; i += BATCH) {
    const batch = active.slice(i, i + BATCH);
    const checked = await Promise.all(
      batch.map(async (link) => {
        const { status, httpStatus } = await checkUrl(String(link.destinationUrl));
        return { id: link.id, cloakedSlug: link.cloakedSlug, destinationUrl: link.destinationUrl, status, httpStatus };
      }),
    );
    results.push(...checked);
  }

  if (results.length > 0) {
    await db.transact(
      results.map((r) =>
        db.tx.affiliateLinks[r.id].update({ lastCheckStatus: r.status, lastVerifiedAt: now }),
      ),
    );
  }

  const broken = results.filter((r) => r.status === 'broken');
  return json({
    checked: results.length,
    ok: results.filter((r) => r.status === 'ok').length,
    redirect: results.filter((r) => r.status === 'redirect').length,
    broken: broken.length,
    brokenLinks: broken,
  });
});
