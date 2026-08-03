import { getDb } from '../db/server';
import { HttpError } from '../db/auth';
import { inputHash } from '../ai-verdict/hash';
import { getTestSubscoreMethodology } from '../../data/test-subscore-methodology';
import { getEvidenceMethodology } from '../../data/evidence-drawer-methodology';
import { enhancedScopeDescription } from '../draft-ratings/evidenceDrawerContent';
import { resolveEvidenceDisplayValue } from '../draft-ratings/resolveEvidenceDisplay';
import { buildPublicHowWeTested } from '../draft-ratings/evidenceDrawerContent';
import { computeWeightedGroupScore } from '../ratings/evidenceGroupScoring';
import { buildEvidenceIndex, type EvidenceIndex } from '../ratings/evidenceIndex';
import {
  findEvidenceGroup,
  memberSlugsForGroup,
  parseGroupKey,
} from './groups';
import type {
  AssembledExplanationContext,
  ExplanationMemberResult,
  ExplanationMethodologyContext,
  ExplanationProductBundle,
} from './types';


function groupScoreFromResults(
  categorySlug: string,
  subscoreSlug: string,
  groupName: string,
  memberSlugs: string[],
  results: ExplanationMemberResult[],
): number | null {
  const members = memberSlugs.map((slug) => {
    const row = results.find((r) => r.slug === slug);
    return { slug, score: row?.normalizedScore ?? null };
  });
  return computeWeightedGroupScore(categorySlug, subscoreSlug, groupName, members);
}

function hasUsableResult(row: any): boolean {
  if (!row) return false;
  if (row.notApplicable || row.isUnknown) return false;
  const value = resolveEvidenceDisplayValue(row.evidenceDefinition ?? {}, row);
  return Boolean(value && value !== '—');
}

function buildMethodologyContext(
  categorySlug: string,
  subscoreSlug: string,
  groupSlug: string,
  groupName: string,
  productName: string,
): ExplanationMethodologyContext {
  const subMethodology = getTestSubscoreMethodology(categorySlug, subscoreSlug);
  const groupContent = subMethodology?.evidenceGroupContent?.[groupSlug];
  const drawer = getEvidenceMethodology(categorySlug, subscoreSlug, groupSlug);
  const memberSlugs = memberSlugsForGroup(`${categorySlug}/${subscoreSlug}/${groupSlug}`);

  let whatThisMeasures =
    drawer?.whatItMeasures ??
    groupContent?.intro?.join(' ') ??
    enhancedScopeDescription(groupSlug, groupName) ??
    `What we checked for ${groupName.toLowerCase()} during hands-on testing.`;

  if (!drawer?.whatItMeasures && !groupContent?.intro?.length && subMethodology?.evidenceSections?.length) {
    const memberSections = subMethodology.evidenceSections.filter((s) =>
      memberSlugs.includes(s.id),
    );
    if (memberSections.length > 0) {
      whatThisMeasures = memberSections.map((s) => s.whatItMeasures).join(' ');
    }
  }

  const whyItMatters = groupContent?.whyItMatters;
  const limitations = subMethodology?.limitations?.paragraphs?.slice(0, 1).join(' ');

  const howWeTested =
    drawer?.howWeTested ??
    buildPublicHowWeTested(productName, categorySlug, groupSlug, undefined);

  return {
    whatThisMeasures,
    whyItMatters,
    howWeTested,
    limitations,
  };
}

function buildResultFingerprint(
  memberSlugs: string[],
  categorySlug: string,
  subscoreSlug: string,
  index: EvidenceIndex<unknown>,
  methodologyVersion: string | null,
): unknown {
  return {
    methodologyVersion,
    members: memberSlugs.map((slug) => {
      const row = index.get(categorySlug, subscoreSlug, slug) as any;
      if (!row) return { slug, missing: true };
      return {
        slug,
        rawValue: row.rawValue ?? null,
        publicResult: row.publicResult ?? null,
        normalizedScore: row.notApplicable ? null : row.normalizedScore ?? null,
        updatedAt: row.updatedAt ?? null,
        notApplicable: row.notApplicable ?? false,
        isUnknown: row.isUnknown ?? false,
      };
    }),
  };
}

function pickTestRunId(runs: any[], explicitId?: string): string {
  if (explicitId) return explicitId;
  const published = runs.find((r) => r.isCurrentPublished && r.status === 'published');
  if (published) return published.id;
  const inProgress = runs
    .filter((r) => ['in_progress', 'ready_for_review', 'approved'].includes(r.status))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  if (inProgress[0]) return inProgress[0].id;
  throw new HttpError(400, 'No test run available — publish a test run or start testing first.');
}

/** One product + test-run query; reuse for every evidence group on the same request. */
export async function loadExplanationProductBundle(
  productId: string,
  opts?: { testRunId?: string },
): Promise<ExplanationProductBundle> {
  const db = getDb();
  const { products } = await (db.query as any)({
    products: {
      $: { where: { id: productId } },
      evidenceResults: {
        testRun: {},
        evidenceDefinition: { subscore: { category: {} } },
      },
      testRuns: { methodologyVersion: {} },
    },
  });

  const product = (products as any[])?.[0];
  if (!product) throw new HttpError(404, 'Product not found');

  const runs = (product.testRuns ?? []) as any[];
  const testRunId = pickTestRunId(runs, opts?.testRunId);
  const run = runs.find((r) => r.id === testRunId);
  const methodologyVersion =
    run?.methodologyVersion?.version ?? run?.methodologyVersion ?? null;

  type IndexedRow = {
    slug: string;
    categorySlug?: string;
    subscoreSlug?: string;
    rawValue?: unknown;
    publicResult?: string | null;
    normalizedScore?: number | null;
    notApplicable?: boolean;
    isUnknown?: boolean;
    updatedAt?: number;
    evidenceDefinition?: { slug?: string; name?: string };
  };

  const indexedRows: IndexedRow[] = [];
  const resultBySlug = new Map<string, unknown>();
  for (const row of (product.evidenceResults ?? []) as any[]) {
    if (row.testRun?.id !== testRunId) continue;
    const def = row.evidenceDefinition ?? {};
    const sub = def.subscore ?? {};
    const cat = sub.category ?? {};
    const slug = def.slug ? String(def.slug) : '';
    if (!slug) continue;
    const indexed: IndexedRow = {
      ...row,
      slug,
      categorySlug: cat.slug ? String(cat.slug) : undefined,
      subscoreSlug: sub.slug ? String(sub.slug) : undefined,
    };
    indexedRows.push(indexed);
    resultBySlug.set(slug, row);
  }
  const resultIndex = buildEvidenceIndex(indexedRows);

  return {
    product: { id: product.id, name: product.name, slug: product.slug },
    testRunId,
    methodologyVersion,
    resultBySlug,
    resultIndex,
  };
}

export function assembleExplanationContextFromBundle(
  bundle: ExplanationProductBundle,
  groupKey: string,
  opts?: { reviewerNote?: string },
): AssembledExplanationContext {
  const group = findEvidenceGroup(groupKey);
  if (!group) throw new HttpError(404, `Unknown evidence group: ${groupKey}`);

  const memberSlugs = memberSlugsForGroup(groupKey);
  const results: ExplanationMemberResult[] = memberSlugs.map((slug) => {
    const row = bundle.resultIndex.get(group.categorySlug, group.subscoreSlug, slug) as any;
    const def = row?.evidenceDefinition ?? { slug, name: slug };
    const value = row ? resolveEvidenceDisplayValue(def, row) : '—';
    return {
      slug,
      label: String(def.name ?? slug),
      value: value || '—',
      normalizedScore: row?.notApplicable ? null : row?.normalizedScore ?? null,
    };
  });

  const usable = memberSlugs.some((slug) =>
    hasUsableResult(bundle.resultIndex.get(group.categorySlug, group.subscoreSlug, slug)),
  );
  const methodology = buildMethodologyContext(
    group.categorySlug,
    group.subscoreSlug,
    group.groupSlug,
    group.groupName,
    bundle.product.name,
  );

  const hashPayload = buildResultFingerprint(
    memberSlugs,
    group.categorySlug,
    group.subscoreSlug,
    bundle.resultIndex,
    bundle.methodologyVersion,
  );

  return {
    product: bundle.product,
    group,
    score: groupScoreFromResults(
      group.categorySlug,
      group.subscoreSlug,
      group.groupName,
      memberSlugs,
      results,
    ),
    methodology,
    results,
    reviewerNote: opts?.reviewerNote,
    methodologyVersion: bundle.methodologyVersion,
    inputHash: inputHash(hashPayload),
    hasUsableResults: usable,
  };
}

export async function assembleExplanationContext(
  productId: string,
  groupKey: string,
  opts?: { testRunId?: string; reviewerNote?: string },
): Promise<AssembledExplanationContext> {
  const bundle = await loadExplanationProductBundle(productId, opts);
  return assembleExplanationContextFromBundle(bundle, groupKey, opts);
}

export { parseGroupKey };
