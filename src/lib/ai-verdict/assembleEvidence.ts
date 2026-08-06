import { getDb } from '../db/server';
import { HttpError } from '../db/auth';
import type { AiVerdictScope } from './config';
import { inputHash } from './hash';
import { isMetaDescriptionField } from './fieldPromptHelpers';
import {
  applyPricingAutofillToEvidence,
  type PricingAutofillDef,
} from '../testing/pricingAutofill';

export interface AssembledEvidenceItem {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  subscoreSlug: string;
  subscoreName?: string;
  required: boolean;
  weight: number;
  publicResult: string | null;
  publicExplanation: string | null;
  normalizedScore: number | null;
  verificationStatus: string | null;
  confidence: string | null;
  notApplicable: boolean;
  isUnknown: boolean;
  internalNotes?: string;
}

export interface AssembledScore {
  kind: string;
  refSlug: string;
  parentSlug?: string;
  score: number;
  weight?: number;
}

export interface AssembledBenchmark {
  kind: 'category' | 'subscore' | 'overall';
  refSlug: string;
  productScore: number | null;
  siteAverage: number | null;
  siteMedian: number | null;
  percentile: number | null;
  sampleSize: number;
}

export interface AssembledProductEditorial {
  oneLineVerdict?: string;
  ourTake?: string;
  pros?: string[];
  cons?: string[];
  bestFor?: string[];
  notIdealFor?: string[];
  mainStrength?: string;
  mainLimitation?: string;
}

export interface AssembledPayload {
  product: { id: string; name: string; slug: string } & AssembledProductEditorial;
  testRun: { id: string; name: string; status: string; methodologyVersion: string | null };
  scope: AiVerdictScope;
  categorySlug?: string;
  targetField?: string;
  scores: AssembledScore[];
  overallScore: number | null;
  evidence: AssembledEvidenceItem[];
  evidenceIds: string[];
  benchmarks: AssembledBenchmark[];
  pricing?: {
    verified: boolean;
    snapshotId: string | null;
    summary: string | null;
  };
  previousRun?: { runName: string; overall: number | null };
  inputHash: string;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function percentileRank(value: number, all: number[]): number | null {
  if (!all.length) return null;
  const below = all.filter((v) => v < value).length;
  return Math.round((below / all.length) * 100);
}

async function loadBenchmarks(
  currentProductId: string,
  snapshots: AssembledScore[],
  methodologyVersion: string | null,
): Promise<AssembledBenchmark[]> {
  const db = getDb();
  const { testRuns } = await (db.query as any)({
    testRuns: {
      $: { where: { status: 'published' } },
      product: {},
      scoreSnapshots: {},
    },
  });

  const runs = (testRuns as any[]).filter((r) => r.product?.id && r.isCurrentPublished);
  const byKindSlug = new Map<string, number[]>();

  for (const run of runs) {
    if (run.product.id === currentProductId) continue;
    for (const snap of run.scoreSnapshots ?? []) {
      if (methodologyVersion && snap.methodologyVersion !== methodologyVersion) continue;
      const key = `${snap.kind}:${snap.refSlug}`;
      const list = byKindSlug.get(key) ?? [];
      list.push(Number(snap.score));
      byKindSlug.set(key, list);
    }
  }

  const out: AssembledBenchmark[] = [];
  for (const s of snapshots) {
    const key = `${s.kind}:${s.refSlug}`;
    const peers = byKindSlug.get(key) ?? [];
    out.push({
      kind: s.kind as AssembledBenchmark['kind'],
      refSlug: s.refSlug,
      productScore: s.score,
      siteAverage: average(peers),
      siteMedian: median(peers),
      percentile: s.score != null ? percentileRank(s.score, peers) : null,
      sampleSize: peers.length,
    });
  }
  return out;
}

export async function assembleEvidence(opts: {
  productId: string;
  testRunId: string;
  scope: AiVerdictScope;
  categorySlug?: string;
  targetField?: string;
  includeTesterNotes?: boolean;
}): Promise<AssembledPayload> {
  const db = getDb();
  const { products, testRuns } = await (db.query as any)({
    products: {
      $: { where: { id: opts.productId } },
      pricingSnapshots: {},
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
      paymentProfile: {},
    },
    testRuns: {
      $: { where: { id: opts.testRunId } },
      product: {},
      methodologyVersion: { categories: { subscores: { evidenceDefinitions: {} } } },
      evidenceResults: { evidenceDefinition: {} },
      scoreSnapshots: {},
      previousRun: { scoreSnapshots: {} },
    },
  });

  const product = products[0];
  if (!product) throw new HttpError(404, 'Product not found');

  const pricingSnapshots = product.pricingSnapshots ?? [];

  const run = testRuns[0];
  if (!run) throw new HttpError(404, 'Test run not found');
  if (run.product?.id !== opts.productId) {
    throw new HttpError(400, 'Test run does not belong to this product');
  }

  const mv = run.methodologyVersion;
  const methodologyVersion = mv?.version ?? null;

  const resultByDef = new Map<string, any>();
  for (const r of run.evidenceResults ?? []) {
    if (r.evidenceDefinition?.id) resultByDef.set(r.evidenceDefinition.id, r);
  }

  const evidence: AssembledEvidenceItem[] = [];
  const autofillDefs = new Map<string, PricingAutofillDef>();
  for (const cat of mv?.categories ?? []) {
    if (!cat.active) continue;
    if (opts.categorySlug && cat.slug !== opts.categorySlug) {
      continue;
    }
    for (const sub of cat.subscores ?? []) {
      if (!sub.active) continue;
      for (const def of sub.evidenceDefinitions ?? []) {
        if (!def.active) continue;
        const result = resultByDef.get(def.id);
        autofillDefs.set(`${cat.slug}/${def.slug}`, {
          measurementType: String(def.measurementType ?? ''),
          scoringRule: def.scoringRule,
          unit: def.unit ? String(def.unit) : undefined,
        });
        evidence.push({
          id: def.id,
          slug: def.slug,
          name: def.name,
          categorySlug: cat.slug,
          subscoreSlug: sub.slug,
          subscoreName: String(sub.name ?? sub.slug),
          required: Boolean(def.required),
          weight: def.weight ?? 1,
          publicResult: result?.publicResult ?? null,
          publicExplanation: result?.publicExplanation ?? null,
          normalizedScore: result?.normalizedScore ?? null,
          verificationStatus: result?.verificationStatus ?? null,
          confidence: result?.confidence ?? null,
          notApplicable: Boolean(result?.notApplicable),
          isUnknown: Boolean(result?.isUnknown),
          internalNotes: opts.includeTesterNotes ? result?.internalNotes ?? undefined : undefined,
        });
      }
    }
  }

  if (opts.categorySlug && evidence.length === 0) {
    throw new HttpError(400, `No evidence found for category ${opts.categorySlug}`);
  }

  applyPricingAutofillToEvidence(evidence, autofillDefs, {
    plans: (product.subscriptionPlans ?? []) as Record<string, unknown>[],
    packages: (product.creditPackages ?? []) as Record<string, unknown>[],
    featureCosts: (product.featureCosts ?? []) as Record<string, unknown>[],
    paymentProfile: (product.paymentProfile ?? null) as Record<string, unknown> | null,
  });

  let scores: AssembledScore[] = (run.scoreSnapshots ?? []).map((s: any) => ({
    kind: s.kind,
    refSlug: s.refSlug,
    parentSlug: s.parentSlug,
    score: s.score,
    weight: s.weight,
  }));

  if (opts.categorySlug) {
    scores = scores.filter(
      (s) =>
        (s.kind === 'category' && s.refSlug === opts.categorySlug) ||
        (s.kind === 'subscore' && s.parentSlug === opts.categorySlug),
    );
  }

  const overallScore = opts.categorySlug
    ? (scores.find((s) => s.kind === 'category' && s.refSlug === opts.categorySlug)?.score ?? null)
    : (scores.find((s) => s.kind === 'overall')?.score ?? null);
  const benchmarks = await loadBenchmarks(opts.productId, scores, methodologyVersion);

  const activePricing = (pricingSnapshots as any[]).find(
    (s) => s.status === 'active' && s.verifiedAt,
  );
  let pricing: AssembledPayload['pricing'];
  if (opts.scope === 'category' && opts.categorySlug === 'pricing') {
    if (!activePricing) {
      throw new HttpError(
        400,
        'Pricing has not been verified — mark the active snapshot verified in the Pricing tab first.',
      );
    }
    pricing = {
      verified: true,
      snapshotId: activePricing.id,
      summary: activePricing.publicNote ?? activePricing.changeSummary ?? null,
    };
  } else if (activePricing) {
    pricing = {
      verified: true,
      snapshotId: activePricing.id,
      summary: activePricing.publicNote ?? null,
    };
  }

  let previousRun: AssembledPayload['previousRun'];
  if (run.previousRun) {
    const prevOverall = (run.previousRun.scoreSnapshots ?? []).find(
      (s: any) => s.kind === 'overall',
    );
    previousRun = {
      runName: run.previousRun.name,
      overall: prevOverall?.score ?? null,
    };
  }

  const productBase: AssembledPayload['product'] = {
    id: product.id,
    name: product.name,
    slug: product.slug,
  };
  if (isMetaDescriptionField(opts.targetField)) {
    if (product.oneLineVerdict) productBase.oneLineVerdict = String(product.oneLineVerdict);
    if (product.ourTake) productBase.ourTake = String(product.ourTake);
    if (Array.isArray(product.pros) && product.pros.length > 0) {
      productBase.pros = product.pros.map(String);
    }
    if (Array.isArray(product.cons) && product.cons.length > 0) {
      productBase.cons = product.cons.map(String);
    }
    if (Array.isArray(product.bestFor) && product.bestFor.length > 0) {
      productBase.bestFor = product.bestFor.map(String);
    }
    if (Array.isArray(product.notIdealFor) && product.notIdealFor.length > 0) {
      productBase.notIdealFor = product.notIdealFor.map(String);
    }
    if (product.mainStrength) productBase.mainStrength = String(product.mainStrength);
    if (product.mainLimitation) productBase.mainLimitation = String(product.mainLimitation);
  }

  const payload: Omit<AssembledPayload, 'inputHash'> = {
    product: productBase,
    testRun: {
      id: run.id,
      name: run.name,
      status: run.status,
      methodologyVersion,
    },
    scope: opts.scope,
    categorySlug: opts.categorySlug,
    targetField: opts.targetField,
    scores,
    overallScore,
    evidence,
    evidenceIds: evidence.map((e) => e.id),
    benchmarks,
    pricing,
    previousRun,
  };

  return { ...payload, inputHash: inputHash(payload) };
}

export async function resolveTestRunId(productId: string, testRunId?: string): Promise<string> {
  if (testRunId) return testRunId;
  const db = getDb();
  const { testRuns } = await (db.query as any)({
    testRuns: { $: { where: { 'product.id': productId } }, product: {} },
  });
  const runs = (testRuns as any[]) ?? [];
  const published = runs.find((r) => r.isCurrentPublished && r.status === 'published');
  if (published) return published.id;
  const inProgress = runs
    .filter((r) => ['in_progress', 'ready_for_review', 'approved'].includes(r.status))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  if (inProgress[0]) return inProgress[0].id;
  throw new HttpError(400, 'No test run available — publish a test run or start testing first.');
}
