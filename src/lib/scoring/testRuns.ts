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
import { isEvidenceApplicable } from '../testing/capabilityGating';
import { computePricingSuggestions } from '../testing/pricingAutofill';
import { PRICING_AUTOFILL_SLUGS } from '../testing/pricingEvidenceSlugs';
import { repairChatModesRaw } from '../testing/evidenceComplete';

function isEditingAccuracyScoredForRun(resultBySlug: Map<string, { notApplicable?: boolean; rawValue?: unknown }>): boolean {
  const imageEdit = resultBySlug.get('image-editing');
  const raw = imageEdit?.rawValue as { status?: string } | undefined;
  if (imageEdit?.notApplicable || raw?.status === 'na') return false;
  if (raw?.status === 'no') return false;
  return true;
}

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

async function loadProductPricing(productId: string) {
  const db = getDb();
  const { products } = await db.query({
    products: {
      $: { where: { id: productId } },
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
    },
  });
  const product = products[0];
  if (!product) return { plans: [], packages: [], featureCosts: [] };
  return {
    plans: (product.subscriptionPlans ?? []) as Record<string, unknown>[],
    packages: (product.creditPackages ?? []) as Record<string, unknown>[],
    featureCosts: (product.featureCosts ?? []) as Record<string, unknown>[],
  };
}

/** Write pricing-tab-derived answers into evidence results when missing. */
async function syncPricingEvidence(
  testRunId: string,
  productId: string,
  mv: { categories?: any[] },
  resultByDef: Map<string, any>,
) {
  const pricing = await loadProductPricing(productId);
  const suggestions = computePricingSuggestions(pricing);
  if (suggestions.size === 0) return;

  const db = getDb();
  const now = Date.now();
  const writes: unknown[] = [];

  for (const cat of mv.categories ?? []) {
    if (String(cat.slug) !== 'pricing' && !['images', 'video'].includes(String(cat.slug))) continue;
    for (const sub of cat.subscores ?? []) {
      for (const def of sub.evidenceDefinitions ?? []) {
        if (!def.active || !PRICING_AUTOFILL_SLUGS.has(String(def.slug))) continue;
        const key = `${cat.slug}/${def.slug}`;
        const suggestion = suggestions.get(key);
        if (!suggestion) continue;
        const existing = resultByDef.get(def.id);
        if (existing?.rawValue) continue;

        if (existing) {
          writes.push(
            db.tx.evidenceResults[existing.id].update({
              rawValue: suggestion.raw,
              notApplicable: false,
              isUnknown: false,
              testDate: now,
              updatedAt: now,
            }),
          );
          resultByDef.set(existing.id, { ...existing, rawValue: suggestion.raw, notApplicable: false });
        } else {
          const rid = newId();
          writes.push(
            db.tx.evidenceResults[rid]
              .update({
                rawValue: suggestion.raw,
                notApplicable: false,
                isUnknown: false,
                testDate: now,
                createdAt: now,
                updatedAt: now,
              })
              .link({ testRun: testRunId, evidenceDefinition: def.id, product: productId }),
          );
          resultByDef.set(def.id, { id: rid, rawValue: suggestion.raw, evidenceDefinition: def });
        }
      }
    }
  }

  if (writes.length > 0) await db.transact(writes);
}

async function repairChatModesEvidence(
  resultByDef: Map<string, any>,
  resultBySlug: Map<string, any>,
) {
  const chat = resultBySlug.get('chat-modes');
  if (!chat?.id) return;

  const modeTypes = resultBySlug.get('mode-types');
  const repaired = repairChatModesRaw(chat.rawValue, modeTypes?.rawValue);
  if (!repaired || JSON.stringify(repaired) === JSON.stringify(chat.rawValue)) return;

  const db = getDb();
  const now = Date.now();
  await db.transact([db.tx.evidenceResults[chat.id].update({ rawValue: repaired, updatedAt: now })]);

  const updated = { ...chat, rawValue: repaired };
  resultBySlug.set('chat-modes', updated);
  if (chat.evidenceDefinition?.id) resultByDef.set(chat.evidenceDefinition.id, updated);
}

export async function calculateRun(testRunId: string): Promise<{
  tree: ScoreTree;
  run: Awaited<ReturnType<typeof loadRunContext>>;
}> {
  const run = await loadRunContext(testRunId);
  const mv = run.methodologyVersion!;
  const productId = run.product!.id;

  const resultByDef = new Map<string, any>();
  const resultBySlug = new Map<string, any>();
  for (const r of run.evidenceResults ?? []) {
    if (r.evidenceDefinition?.id) {
      resultByDef.set(r.evidenceDefinition.id, r);
      if (r.evidenceDefinition.slug) resultBySlug.set(String(r.evidenceDefinition.slug), r);
    }
  }

  await repairChatModesEvidence(resultByDef, resultBySlug);
  await syncPricingEvidence(testRunId, productId, mv, resultByDef);

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

  const productFields = (run.product ?? {}) as Record<string, unknown>;

  const evidence: EvidenceInput[] = (mv.categories ?? []).flatMap((c: any) =>
    (c.subscores ?? []).flatMap((s: any) =>
      (s.evidenceDefinitions ?? [])
        .filter((d: any) => d.active)
        .map((d: any) => {
          const result = resultByDef.get(d.id);
          const capabilityGated = !isEvidenceApplicable(c.slug, d, productFields);
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
            notApplicable:
              result?.notApplicable ||
              capabilityGated ||
              (c.slug === 'images' &&
                d.slug === 'editing-accuracy' &&
                !isEditingAccuracyScoredForRun(resultBySlug)),
            isUnknown: result?.isUnknown,
            manualOverrideScore: result?.manualOverrideScore ?? undefined,
            manualOverrideReason: result?.manualOverrideReason ?? undefined,
            relatedAnswers: Object.fromEntries(
              (s.evidenceDefinitions ?? [])
                .filter((d: any) => d.active)
                .map((d: any) => [d.slug, resultByDef.get(d.id)?.rawValue]),
            ),
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
