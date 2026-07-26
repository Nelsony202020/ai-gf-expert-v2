export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../lib/api';
import { requirePermission } from '../../../lib/db/auth';
import { getDb } from '../../../lib/db/server';

const DAY = 24 * 60 * 60 * 1000;
const STALE_PRICE_DAYS = 60;
const RETEST_DAYS = 120;
const EXPIRY_WINDOW_DAYS = 7;

type PipelineStage = 'draft' | 'testing' | 'review' | 'ready_to_publish' | 'published';

function pipelineStage(product: any, runs: any[]): PipelineStage {
  if (product.status === 'published') return 'published';
  if (product.status === 'scheduled') return 'ready_to_publish';
  if (product.status === 'in_review') return 'review';

  const productRuns = runs.filter((r) => r.product?.id === product.id);
  if (productRuns.some((r) => r.status === 'in_progress')) return 'testing';
  if (productRuns.some((r) => r.status === 'ready_for_review' || r.status === 'approved')) {
    return 'review';
  }
  return 'draft';
}

function activityLabel(entry: any): { title: string; detail?: string; icon: string } {
  const nv = entry.newValue ?? {};
  const name = nv.name ?? nv.title ?? entry.recordId?.slice(0, 8);

  switch (entry.action) {
    case 'publish':
      if (entry.recordType === 'testRuns') {
        return {
          icon: 'science',
          title: `Test run completed${nv.productName ? ` for ${nv.productName}` : ''}`,
          detail: nv.overall != null ? `Overall score ${nv.overall}` : undefined,
        };
      }
      if (entry.recordType === 'products') {
        return { icon: 'publish', title: `Published ${name}` };
      }
      return { icon: 'publish', title: `Published ${entry.recordType}` };
    case 'unpublish':
      return { icon: 'unpublished', title: `Unpublished ${name}` };
    case 'create':
      if (entry.recordType === 'products') {
        return { icon: 'draft', title: `Draft created: ${name}` };
      }
      return { icon: 'add', title: `Created ${entry.recordType}` };
    case 'update':
      if (entry.recordType === 'subscriptionPlans') {
        return {
          icon: 'payments',
          title: `Price verified${nv.productName ? ` for ${nv.productName}` : ''}`,
          detail: nv.priceLabel ?? nv.name,
        };
      }
      if (entry.recordType === 'affiliateLinks') {
        return { icon: 'link', title: `Affiliate link updated`, detail: nv.cloakedSlug ?? name };
      }
      if (entry.recordType === 'homepageSlots') {
        return { icon: 'home', title: 'Homepage updated', detail: nv.label ?? nv.kind };
      }
      return { icon: 'edit', title: `Updated ${entry.recordType}`, detail: name };
    case 'recalculate':
      return { icon: 'calculate', title: 'Scores recalculated', detail: name };
    case 'slug_change':
      return { icon: 'link', title: `Slug changed`, detail: nv.slug ?? name };
    case 'upload':
      return { icon: 'upload', title: 'Media uploaded', detail: name };
    default:
      return { icon: 'history', title: `${entry.action} · ${entry.recordType}`, detail: name };
  }
}

/** Actionable-issues dashboard (not decorative analytics). */
export const GET: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'content.view');
  const db = getDb();
  const now = Date.now();

  const [
    { products },
    { testRuns },
    { subscriptionPlans },
    { affiliateLinks },
    { homepageSlots },
    { auditLog },
  ] = await Promise.all([
    db.query({ products: { testRuns: {} } }),
    db.query({ testRuns: { product: {} } }),
    db.query({ subscriptionPlans: { product: {} } }),
    db.query({ affiliateLinks: { product: {} } }),
    db.query({
      homepageSlots: {
        product: { logo: {} },
        character: { image: {} },
      },
    }),
    db.query({
      auditLog: {
        $: { order: { createdAt: 'desc' as const }, limit: 12 },
      },
    }),
  ]);

  const live = (products as any[]).filter((p) => !p.deletedAt);
  const allRuns = testRuns as any[];

  const draftProducts = live
    .filter((p) => p.status === 'draft' || p.status === 'in_review')
    .map((p) => ({ id: p.id, name: p.name, status: p.status }));

  const productsWithoutPublishedRun = live
    .filter((p) => p.status === 'published' && !(p.testRuns ?? []).some((r: any) => r.isCurrentPublished))
    .map((p) => ({ id: p.id, name: p.name }));

  const runsAwaitingReview = (testRuns as any[])
    .filter((r) => r.status === 'ready_for_review' || r.status === 'approved')
    .map((r) => ({ id: r.id, name: r.name, status: r.status, product: r.product?.name }));

  const dueForRetest = live
    .filter(
      (p) =>
        p.status === 'published' &&
        p.lastTestedAt &&
        now - p.lastTestedAt > RETEST_DAYS * DAY,
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      daysSinceTest: Math.floor((now - p.lastTestedAt) / DAY),
    }));

  const stalePrices = (subscriptionPlans as any[])
    .filter((pl) => pl.active && (!pl.lastVerifiedAt || now - pl.lastVerifiedAt > STALE_PRICE_DAYS * DAY))
    .map((pl) => ({
      id: pl.id,
      name: pl.name,
      product: pl.product?.name,
      daysSinceVerified: pl.lastVerifiedAt ? Math.floor((now - pl.lastVerifiedAt) / DAY) : null,
    }));

  const problemLinks = (affiliateLinks as any[])
    .filter(
      (l) =>
        (l.active && l.lastCheckStatus === 'broken') ||
        (l.active && l.endAt && l.endAt < now),
    )
    .map((l) => ({
      id: l.id,
      cloakedSlug: l.cloakedSlug,
      product: l.product?.name,
      issue: l.lastCheckStatus === 'broken' ? 'broken' : 'expired',
    }));

  const missingSeo = live
    .filter((p) => p.status === 'published' && (!p.seoTitle || !p.seoDescription))
    .map((p) => ({ id: p.id, name: p.name }));

  const scheduled = live
    .filter((p) => p.status === 'scheduled')
    .map((p) => ({ id: p.id, name: p.name, scheduledAt: p.scheduledAt }));

  const productsMissingTestRun = live
    .filter((p) => !(p.testRuns ?? []).some((r: any) => r.status !== 'not_started'))
    .map((p) => ({ id: p.id, name: p.name }));

  const draftCount = live.filter((p) => p.status === 'draft' || p.status === 'in_review').length;
  const publishedCount = live.filter((p) => p.status === 'published').length;

  const pipelineStages: Record<PipelineStage, { id: string; name: string }[]> = {
    draft: [],
    testing: [],
    review: [],
    ready_to_publish: [],
    published: [],
  };
  for (const p of live) {
    const stage = pipelineStage(p, allRuns);
    pipelineStages[stage].push({ id: p.id, name: p.name });
  }
  for (const key of Object.keys(pipelineStages) as PipelineStage[]) {
    pipelineStages[key].sort((a, b) => a.name.localeCompare(b.name));
  }

  const activePlans = (subscriptionPlans as any[]).filter((pl) => pl.active);
  const freshPlans = activePlans.filter(
    (pl) => pl.lastVerifiedAt && now - pl.lastVerifiedAt <= STALE_PRICE_DAYS * DAY,
  );
  const totalLinks = (affiliateLinks as any[]).length;
  const healthyLinks = totalLinks - problemLinks.length;
  const publishedLive = live.filter((p) => p.status === 'published');
  const seoComplete = publishedLive.filter((p) => p.seoTitle && p.seoDescription);
  const withPublishedRun = live.filter((p) =>
    (p.testRuns ?? []).some((r: any) => r.isCurrentPublished || r.status === 'published'),
  );

  const siteHealth = {
    testingCoverage: {
      ok: withPublishedRun.length,
      total: live.length,
      pct: live.length ? Math.round((withPublishedRun.length / live.length) * 1000) / 10 : 100,
    },
    retesting: {
      due: dueForRetest.length,
      ok: dueForRetest.length === 0,
    },
    pricingFreshness: {
      ok: freshPlans.length,
      total: activePlans.length,
      pct: activePlans.length
        ? Math.round((freshPlans.length / activePlans.length) * 1000) / 10
        : 100,
    },
    affiliateLinks: {
      ok: healthyLinks,
      total: totalLinks,
      pct: totalLinks ? Math.round((healthyLinks / totalLinks) * 1000) / 10 : 100,
    },
    seoMetadata: {
      ok: seoComplete.length,
      total: publishedLive.length,
      pct: publishedLive.length
        ? Math.round((seoComplete.length / publishedLive.length) * 1000) / 10
        : 100,
    },
  };

  const needAttentionCount =
    draftProducts.length +
    stalePrices.length +
    productsMissingTestRun.length +
    dueForRetest.length +
    missingSeo.length +
    problemLinks.length +
    productsWithoutPublishedRun.length +
    runsAwaitingReview.length;

  const recentActivity = (auditLog as any[]).map((a) => {
    const { title, detail, icon } = activityLabel(a);
    return {
      id: a.id,
      icon,
      title,
      detail,
      createdAt: a.createdAt,
      actor: a.actorEmail,
      recordType: a.recordType,
      recordId: a.recordId,
    };
  });

  const activeSlots = (homepageSlots as any[]).filter((s) => s.active);
  const featuredNow = activeSlots
    .filter((s) => (!s.startAt || s.startAt <= now) && (!s.endAt || s.endAt >= now))
    .map((s) => ({
      id: s.id,
      kind: s.kind,
      label: s.label,
      name: s.product?.name ?? s.character?.name,
      position: s.position,
      endAt: s.endAt,
      avatarUrl:
        s.kind === 'featured_character'
          ? (s.character?.image?.url ?? null)
          : (s.product?.logo?.url ?? null),
    }));
  const expiringSoon = featuredNow.filter(
    (s) => s.endAt && s.endAt - now < EXPIRY_WINDOW_DAYS * DAY,
  );

  const topPicks = featuredNow
    .filter((s) => s.kind === 'top_pick')
    .sort((a, b) => a.position - b.position);
  const featuredCharacters = featuredNow
    .filter((s) => s.kind === 'featured_character')
    .sort((a, b) => a.position - b.position);

  return json({
    counts: {
      products: live.length,
      drafts: draftCount,
      published: publishedCount,
      needAttention: needAttentionCount,
      testRuns: allRuns.length,
      affiliateLinks: totalLinks,
    },
    pipeline: Object.fromEntries(
      (Object.keys(pipelineStages) as PipelineStage[]).map((stage) => [
        stage,
        {
          count: pipelineStages[stage].length,
          products: pipelineStages[stage],
        },
      ]),
    ),
    siteHealth,
    draftProducts,
    productsWithoutPublishedRun,
    productsMissingTestRun,
    runsAwaitingReview,
    dueForRetest,
    stalePrices,
    problemLinks,
    missingSeo,
    scheduled,
    recentActivity,
    featuredNow,
    topPicks,
    featuredCharacters,
    expiringSoon,
  });
});
