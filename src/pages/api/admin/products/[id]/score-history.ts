export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission } from '../../../../../lib/db/auth';
import { getDb } from '../../../../../lib/db/server';

/**
 * Score history for a product: every published (current or superseded) test
 * run with its immutable score snapshots, newest first. Published scores are
 * never overwritten — each run's snapshots are preserved.
 */
export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const db = getDb();
  const { testRuns } = await (db.query as any)({
    testRuns: {
      $: {},
      product: {},
      methodologyVersion: {},
      scoreSnapshots: {},
    },
  });

  const runs = (testRuns as any[])
    .filter(
      (r) =>
        r.product?.id === params.id &&
        (r.status === 'published' || r.status === 'superseded'),
    )
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
    .map((r) => {
      const snapshots = (r.scoreSnapshots ?? []) as any[];
      const overall = snapshots.find((s) => s.kind === 'overall');
      const categories = snapshots
        .filter((s) => s.kind === 'category')
        .sort((a, b) => String(a.refSlug).localeCompare(String(b.refSlug)))
        .map((s) => ({ slug: s.refSlug, value: s.score, weight: s.weight }));
      return {
        runId: r.id,
        runName: r.name,
        status: r.status,
        isCurrentPublished: Boolean(r.isCurrentPublished),
        methodologyVersion: r.methodologyVersion?.version ?? null,
        publishedAt: r.publishedAt ?? null,
        overall: overall?.score ?? null,
        categories,
      };
    });

  return json({ history: runs });
});
