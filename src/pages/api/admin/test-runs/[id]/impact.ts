export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { HttpError, requirePermission } from '../../../../../lib/db/auth';
import { getDb } from '../../../../../lib/db/server';

/**
 * Score-change impact report: compares this run's snapshots against the
 * previous published run for the same product — per-category deltas, overall
 * delta, and the published roundups the product appears in.
 */
export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const db = getDb();

  const { testRuns } = await (db.query as any)({
    testRuns: { $: {}, product: {}, scoreSnapshots: {} },
  });
  const run = (testRuns as any[]).find((r) => r.id === params.id);
  if (!run) throw new HttpError(404, 'Test run not found');
  if (!run.scoreSnapshots?.length) {
    throw new HttpError(409, 'This run has no score snapshots yet — publish it first.');
  }

  const productId = run.product?.id;
  const previous = (testRuns as any[])
    .filter(
      (r) =>
        r.id !== run.id &&
        r.product?.id === productId &&
        (r.status === 'published' || r.status === 'superseded') &&
        (r.publishedAt ?? 0) < (run.publishedAt ?? Number.MAX_SAFE_INTEGER),
    )
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))[0];

  function snapshotMap(snapshots: any[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const s of snapshots ?? []) {
      if (s.kind === 'overall') map.set('overall', s.score);
      else if (s.kind === 'category') map.set(`category:${s.refSlug}`, s.score);
    }
    return map;
  }

  const current = snapshotMap(run.scoreSnapshots);
  const prior = previous ? snapshotMap(previous.scoreSnapshots ?? []) : new Map<string, number>();

  const categories = [...current.keys()]
    .filter((k) => k.startsWith('category:'))
    .map((key) => {
      const slug = key.slice('category:'.length);
      const now = current.get(key)!;
      const before = prior.get(key) ?? null;
      return {
        slug,
        current: now,
        previous: before,
        delta: before === null ? null : Math.round((now - before) * 10) / 10,
      };
    })
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));

  const overallNow = current.get('overall') ?? null;
  const overallBefore = prior.get('overall') ?? null;

  // Published roundups affected by this product's score change
  const { roundupEntries } = await (db.query as any)({
    roundupEntries: { $: {}, product: {}, roundup: {} },
  });
  const affectedRoundups = (roundupEntries as any[])
    .filter((e) => e.included && e.product?.id === productId && e.roundup?.status === 'published')
    .map((e) => ({
      title: e.roundup.title,
      slug: e.roundup.slug,
      publishedPosition: e.publishedPosition ?? null,
    }));

  return json({
    run: { id: run.id, name: run.name, publishedAt: run.publishedAt ?? null },
    previousRun: previous
      ? { id: previous.id, name: previous.name, publishedAt: previous.publishedAt ?? null }
      : null,
    overall: {
      current: overallNow,
      previous: overallBefore,
      delta:
        overallNow !== null && overallBefore !== null
          ? Math.round((overallNow - overallBefore) * 10) / 10
          : null,
    },
    categories,
    affectedRoundups,
  });
});
