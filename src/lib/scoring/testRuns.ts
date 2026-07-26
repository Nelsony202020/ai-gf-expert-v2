// Test-run scoring service: loads the methodology tree + evidence results,
// runs the calculation engine, and handles publish (snapshot + supersede).

import { getDb, id as newId } from '../db/server';
import { HttpError, type AdminIdentity } from '../db/auth';
import { auditTx } from '../db/audit';
import {
  computeScores,
  CALCULATION_VERSION,
  type ScoreTree,
  type EvidenceInput,
} from './engine';
import { triggerRebuild } from '../db/publish';

export async function loadRunContext(testRunId: string) {
  const db = getDb();
  const { testRuns } = await db.query({
    testRuns: {
      $: { where: { id: testRunId } },
      product: {},
      methodologyVersion: { categories: { subscores: { evidenceDefinitions: {} } } },
      evidenceResults: { evidenceDefinition: {} },
    },
  });
  const run = testRuns[0];
  if (!run) throw new HttpError(404, 'Test run not found');
  if (!run.methodologyVersion) throw new HttpError(400, 'Test run has no methodology version');
  if (!run.product) throw new HttpError(400, 'Test run has no product');
  return run;
}

export async function calculateRun(testRunId: string): Promise<{
  tree: ScoreTree;
  run: Awaited<ReturnType<typeof loadRunContext>>;
}> {
  const run = await loadRunContext(testRunId);
  const mv = run.methodologyVersion!;

  const categories = (mv.categories ?? [])
    .filter((c: any) => c.active)
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
    .map((c: any) => ({ slug: c.slug, name: c.name, weight: c.weight }));

  const subscores = (mv.categories ?? []).flatMap((c: any) =>
    (c.subscores ?? [])
      .filter((s: any) => s.active)
      .map((s: any) => ({
        slug: s.slug,
        name: s.name,
        categorySlug: c.slug,
        weight: s.weight,
      })),
  );

  const resultByDef = new Map<string, any>();
  for (const r of run.evidenceResults ?? []) {
    if (r.evidenceDefinition?.id) resultByDef.set(r.evidenceDefinition.id, r);
  }

  const evidence: EvidenceInput[] = (mv.categories ?? []).flatMap((c: any) =>
    (c.subscores ?? []).flatMap((s: any) =>
      (s.evidenceDefinitions ?? [])
        .filter((d: any) => d.active)
        .map((d: any) => {
          const result = resultByDef.get(d.id);
          return {
            definitionId: d.id,
            slug: d.slug,
            name: d.name,
            subscoreSlug: s.slug,
            categorySlug: c.slug,
            weight: d.weight,
            required: d.required,
            measurementType: d.measurementType,
            scoringRule: d.scoringRule,
            resultId: result?.id,
            rawValue: result?.rawValue,
            notApplicable: result?.notApplicable,
            isUnknown: result?.isUnknown,
            manualOverrideScore: result?.manualOverrideScore ?? undefined,
            manualOverrideReason: result?.manualOverrideReason ?? undefined,
          } satisfies EvidenceInput;
        }),
    ),
  );

  const tree = computeScores(categories, subscores, evidence);

  // Persist normalized scores back onto evidence results (raw preserved).
  const db = getDb();
  const updates = [];
  for (const cat of tree.categories) {
    for (const sub of cat.subscores) {
      for (const ev of sub.evidence) {
        const result = resultByDef.get(ev.definitionId);
        if (result && ev.normalizedScore !== null && result.normalizedScore !== ev.normalizedScore) {
          updates.push(
            db.tx.evidenceResults[result.id].update({
              normalizedScore: ev.normalizedScore,
              calculationDetails: { detail: ev.detail, calculationVersion: CALCULATION_VERSION },
              updatedAt: Date.now(),
            }),
          );
        }
      }
    }
  }
  if (updates.length > 0) await db.transact(updates);

  return { tree, run };
}

/**
 * Publish a test run:
 * 1. Recalculate and refuse if blocking errors remain.
 * 2. Write immutable score snapshots (overall + categories + subscores).
 * 3. Mark previous published run superseded (history preserved).
 * 4. Update product cache fields (lastTestedAt).
 * 5. Audit + trigger rebuild.
 */
export async function publishRun(testRunId: string, identity: AdminIdentity) {
  const { tree, run } = await calculateRun(testRunId);
  if (tree.blockingErrors.length > 0) {
    throw new HttpError(422, tree.blockingErrors.join(' '));
  }
  if (tree.overall === null) {
    throw new HttpError(422, 'Cannot publish: overall score could not be calculated.');
  }

  const db = getDb();
  const productId = run.product!.id;
  const mvVersion = run.methodologyVersion!.version;
  const now = Date.now();

  // Find currently published run for this product (to supersede).
  const { testRuns: published } = await db.query({
    testRuns: {
      $: { where: { isCurrentPublished: true } },
      product: {},
    },
  });
  const previous = published.filter(
    (r: any) => r.product?.id === productId && r.id !== testRunId,
  );

  const chunks: any[] = [];

  // Snapshots
  const snapshotIds: string[] = [];
  function snapshot(kind: string, refSlug: string, score: number, weight?: number, parentSlug?: string, detail?: unknown) {
    const sid = newId();
    snapshotIds.push(sid);
    chunks.push(
      db.tx.scoreSnapshots[sid]
        .update({
          kind,
          refSlug,
          parentSlug,
          score,
          weight,
          calculationVersion: tree.calculationVersion,
          methodologyVersion: mvVersion,
          detail: detail ? JSON.parse(JSON.stringify(detail)) : undefined,
          createdAt: now,
        })
        .link({ testRun: testRunId, product: productId }),
    );
  }

  snapshot('overall', 'overall', tree.overall);
  for (const cat of tree.categories) {
    if (cat.score !== null) snapshot('category', cat.slug, cat.score, cat.weight);
    for (const sub of cat.subscores) {
      if (sub.score !== null) {
        snapshot('subscore', sub.slug, sub.score, sub.weight, cat.slug, {
          evidence: sub.evidence.map((e) => ({
            slug: e.slug,
            score: e.normalizedScore,
            weight: e.effectiveWeight,
            status: e.status,
            overridden: e.overridden,
          })),
        });
      }
    }
  }

  // Supersede previous runs (never delete or overwrite their snapshots).
  for (const prev of previous) {
    chunks.push(
      db.tx.testRuns[prev.id].update({
        isCurrentPublished: false,
        status: 'superseded',
        updatedAt: now,
      }),
    );
  }

  chunks.push(
    db.tx.testRuns[testRunId]
      .update({
        status: 'published',
        isCurrentPublished: true,
        publishedAt: now,
        updatedAt: now,
      })
      .link(previous.length > 0 ? { previousRun: previous[0].id } : {}),
  );

  chunks.push(
    db.tx.products[productId].update({
      lastTestedAt: now,
      updatedAt: now,
    }),
  );

  // Which roundups include this product? (impact report)
  const { roundupEntries } = await db.query({
    roundupEntries: { $: {}, product: {}, roundup: {} },
  });
  const affectedRoundups = roundupEntries
    .filter((e: any) => e.product?.id === productId && e.included)
    .map((e: any) => e.roundup?.title)
    .filter(Boolean);

  chunks.push(
    auditTx({
      actorEmail: identity.email,
      action: 'publish',
      recordType: 'testRuns',
      recordId: testRunId,
      newValue: {
        overall: tree.overall,
        categories: Object.fromEntries(tree.categories.map((c) => [c.slug, c.score])),
      },
      scoreImpact: { affectedRoundups },
    }),
  );

  await db.transact(chunks);
  await triggerRebuild(`test run published for product ${productId}`);

  return { tree, affectedRoundups, snapshots: snapshotIds.length };
}
