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
import { isGenderCountApplicable } from '../testing/genderCountGating';
import { isRetiredEvidenceSlug } from '../testing/retiredEvidence';
import { computePricingSuggestions } from '../testing/pricingAutofill';
import { PRICING_AUTOFILL_SLUGS } from '../testing/pricingEvidenceSlugs';
import { relatedAnswerFromResult, repairChatModesRaw } from '../testing/evidenceComplete';
import { deferUsageCostScores } from '../ratings/evidenceIcons';

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

/** Flatten a methodology version tree for admin UI (same source as calculateRun). */
export function flattenMethodologyStructure(mv: {
  id?: string;
  version?: string;
  categories?: any[];
}) {
  const categories: Record<string, unknown>[] = [];
  const subscores: Record<string, unknown>[] = [];
  const definitions: Record<string, unknown>[] = [];

  for (const c of (mv.categories ?? []).filter((x: any) => x.active !== false)) {
    categories.push({
      id: c.id,
      slug: c.slug,
      name: c.name,
      active: c.active,
      displayOrder: c.displayOrder,
      weight: c.weight,
      methodologyVersion: { id: mv.id, version: mv.version },
    });
    for (const s of (c.subscores ?? []).filter((x: any) => x.active !== false)) {
      subscores.push({
        id: s.id,
        slug: s.slug,
        name: s.name,
        active: s.active,
        displayOrder: s.displayOrder,
        weight: s.weight,
        category: { id: c.id, slug: c.slug },
      });
      for (const d of (s.evidenceDefinitions ?? []).filter((x: any) => x.active !== false)) {
        definitions.push({
          id: d.id,
          slug: d.slug,
          name: d.name,
          active: d.active,
          displayOrder: d.displayOrder,
          weight: d.weight,
          required: d.required,
          measurementType: d.measurementType,
          subscore: { id: s.id, slug: s.slug, category: { id: c.id, slug: c.slug } },
        });
      }
    }
  }

  categories.sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));
  subscores.sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));
  definitions.sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));

  return { categories, subscores, definitions };
}

export async function loadRunMethodologyStructure(testRunId: string) {
  const run = await loadRunContext(testRunId);
  const flat = flattenMethodologyStructure(run.methodologyVersion!);
  return {
    runId: run.id,
    methodologyVersion: {
      id: run.methodologyVersion!.id,
      version: run.methodologyVersion!.version,
    },
    ...flat,
  };
}

async function loadProductPricing(productId: string) {
  const db = getDb();
  const { products } = await db.query({
    products: {
      $: { where: { id: productId } },
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
      paymentProfile: {},
    },
  });
  const product = products[0];
  if (!product) return { plans: [], packages: [], featureCosts: [], paymentProfile: null };
  return {
    plans: (product.subscriptionPlans ?? []) as Record<string, unknown>[],
    packages: (product.creditPackages ?? []) as Record<string, unknown>[],
    featureCosts: (product.featureCosts ?? []) as Record<string, unknown>[],
    paymentProfile: (product.paymentProfile ?? null) as Record<string, unknown> | null,
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

async function repairModeTypesWhenChatModesNa(
  resultByDef: Map<string, any>,
  resultBySlug: Map<string, any>,
) {
  const chat = resultBySlug.get('chat-modes');
  if (!chat?.id) return;

  const chatNa =
    Boolean(chat.notApplicable) ||
    (chat.rawValue &&
      typeof chat.rawValue === 'object' &&
      'status' in chat.rawValue &&
      chat.rawValue.status === 'na');
  if (!chatNa) return;

  const modeTypes = resultBySlug.get('mode-types');
  if (!modeTypes?.id) return;

  const modeNa =
    Boolean(modeTypes.notApplicable) ||
    (modeTypes.rawValue &&
      typeof modeTypes.rawValue === 'object' &&
      'status' in modeTypes.rawValue &&
      modeTypes.rawValue.status === 'na');
  if (modeNa) return;

  const db = getDb();
  const now = Date.now();
  const fields = { rawValue: { status: 'na' }, notApplicable: true, updatedAt: now };
  await db.transact([db.tx.evidenceResults[modeTypes.id].update(fields)]);

  const updated = { ...modeTypes, ...fields };
  resultBySlug.set('mode-types', updated);
  if (modeTypes.evidenceDefinition?.id) {
    resultByDef.set(modeTypes.evidenceDefinition.id, updated);
  }
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
  await repairModeTypesWhenChatModesNa(resultByDef, resultBySlug);
  await syncPricingEvidence(testRunId, productId, mv, resultByDef);
  for (const row of resultByDef.values()) {
    const slug = row.evidenceDefinition?.slug;
    if (slug) resultBySlug.set(String(slug), row);
  }

  const categories = (mv.categories ?? [])
    .filter((c: any) => c.active)
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
    .map((c: any) => ({ slug: c.slug, name: c.name, weight: c.weight }));

  const subscores = (mv.categories ?? []).flatMap((c: any) =>
    (c.subscores ?? [])
      .filter((s: any) => s.active)
      .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((s: any) => ({
        slug: s.slug,
        name: s.name,
        categorySlug: c.slug,
        weight: s.weight,
      })),
  );

  const productFields = (run.product ?? {}) as Record<string, unknown>;
  const productSlug = String(run.product?.slug ?? '');
  const gendersRaw = resultBySlug.get('genders')?.rawValue;

  const evidence: EvidenceInput[] = (mv.categories ?? [])
    .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .flatMap((c: any) =>
      (c.subscores ?? [])
        .filter((s: any) => s.active)
        .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .flatMap((s: any) =>
          (s.evidenceDefinitions ?? [])
            .filter((d: any) => d.active)
            .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
            .map((d: any) => {
              const result = resultByDef.get(d.id);
              const capabilityGated = !isEvidenceApplicable(c.slug, d, productFields);
              const genderGated =
                c.slug === 'characters' &&
                !isGenderCountApplicable(c.slug, String(d.slug ?? ''), gendersRaw);
              const retired = isRetiredEvidenceSlug(String(d.slug ?? ''));
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
                  genderGated ||
                  retired ||
                  deferUsageCostScores(productSlug, s.slug) ||
                  (c.slug === 'images' &&
                    d.slug === 'editing-accuracy' &&
                    !isEditingAccuracyScoredForRun(resultBySlug)),
                isUnknown: result?.isUnknown,
                manualOverrideScore: result?.manualOverrideScore ?? undefined,
                manualOverrideReason: result?.manualOverrideReason ?? undefined,
                relatedAnswers: Object.fromEntries(
                  (s.evidenceDefinitions ?? [])
                    .filter((d: any) => d.active)
                    .map((d: any) => {
                      const result = resultByDef.get(d.id);
                      const val = relatedAnswerFromResult(result);
                      return val !== undefined ? [d.slug, val] : null;
                    })
                    .filter((entry): entry is [string, unknown] => entry !== null),
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

/** Recalculate and replace score snapshots for a run (preview / post-migration refresh). */
export async function refreshScoreSnapshots(testRunId: string) {
  const { tree, run } = await calculateRun(testRunId);
  const db = getDb();
  const productId = run.product!.id;
  const mvVersion = run.methodologyVersion!.version;
  const mv = run.methodologyVersion!;
  const now = Date.now();

  const catOrder = new Map<string, number>();
  const subOrder = new Map<string, number>();
  const subNames = new Map<string, string>();
  for (const c of mv.categories ?? []) {
    catOrder.set(String(c.slug), Number(c.displayOrder ?? 0));
    for (const s of c.subscores ?? []) {
      if (s.active === false) continue;
      subOrder.set(String(s.slug), Number(s.displayOrder ?? 0));
      subNames.set(String(s.slug), String(s.name ?? s.slug));
    }
  }

  const { scoreSnapshots: existingSnaps } = await db.query({
    scoreSnapshots: { $: { where: { 'testRun.id': testRunId } } },
  });

  const chunks: any[] = [];
  for (const s of existingSnaps) {
    chunks.push(db.tx.scoreSnapshots[s.id].delete());
  }

  function snapshot(
    kind: string,
    refSlug: string,
    score: number | null,
    weight?: number,
    parentSlug?: string,
    detail?: unknown,
  ) {
    const sid = newId();
    chunks.push(
      db.tx.scoreSnapshots[sid]
        .update({
          kind,
          refSlug,
          parentSlug,
          score: score ?? undefined,
          weight,
          calculationVersion: tree.calculationVersion,
          methodologyVersion: mvVersion,
          detail: detail ? JSON.parse(JSON.stringify(detail)) : undefined,
          createdAt: now,
        })
        .link({ testRun: testRunId, product: productId }),
    );
  }

  if (tree.overall !== null) snapshot('overall', 'overall', tree.overall);
  for (const cat of tree.categories) {
    if (cat.score !== null) {
      snapshot('category', cat.slug, cat.score, cat.weight, undefined, {
        displayOrder: catOrder.get(cat.slug) ?? 0,
      });
    }
    for (const sub of cat.subscores) {
      if (sub.score === null) continue;
      snapshot('subscore', sub.slug, sub.score, sub.weight, cat.slug, {
        displayOrder: subOrder.get(sub.slug) ?? 0,
        name: subNames.get(sub.slug) ?? sub.name,
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

  if (chunks.length > 0) await db.transact(chunks);
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
  const mv = run.methodologyVersion!;
  const now = Date.now();

  const catOrder = new Map<string, number>();
  const subOrder = new Map<string, number>();
  const subNames = new Map<string, string>();
  for (const c of mv.categories ?? []) {
    catOrder.set(String(c.slug), Number(c.displayOrder ?? 0));
    for (const s of c.subscores ?? []) {
      subOrder.set(String(s.slug), Number(s.displayOrder ?? 0));
      subNames.set(String(s.slug), String(s.name ?? s.slug));
    }
  }

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

  // Republish-safe: replace prior snapshots for this run.
  const { scoreSnapshots: existingSnaps } = await db.query({
    scoreSnapshots: { $: { where: { 'testRun.id': testRunId } } },
  });
  for (const s of existingSnaps) {
    chunks.push(db.tx.scoreSnapshots[s.id].delete());
  }

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
    if (cat.score !== null) {
      snapshot('category', cat.slug, cat.score, cat.weight, undefined, {
        displayOrder: catOrder.get(cat.slug) ?? 0,
      });
    }
    for (const sub of cat.subscores) {
      if (sub.score !== null) {
        snapshot('subscore', sub.slug, sub.score, sub.weight, cat.slug, {
          displayOrder: subOrder.get(sub.slug) ?? 0,
          name: subNames.get(sub.slug) ?? sub.name,
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
