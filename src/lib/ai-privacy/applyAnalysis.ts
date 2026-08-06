// Apply AI privacy proposals onto evidenceResults (rawValue, proofLinks, calculationDetails).

import { getDb, id as newId } from '../db/server';
import { HttpError } from '../db/auth';
import {
  AI_PRIVACY_SLUGS,
  privacyStructuredOutputSchema,
  type AiPrivacyCalculationDetails,
  type AiPrivacySlug,
  type PrivacyAnswerProposal,
  type PrivacyStructuredOutput,
} from './types';
import { getLatestPrivacyAnalysis } from './store';
import { validatePrivacyAnswer } from './normalizeOutput';

function rawEqual(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function mergeProofLinks(
  existing: unknown,
  evidence: PrivacyAnswerProposal['evidence'],
): Array<{ url: string; label?: string }> {
  const links: Array<{ url: string; label?: string }> = [];
  const seen = new Set<string>();
  if (Array.isArray(existing)) {
    for (const row of existing) {
      if (!row || typeof row !== 'object') continue;
      const url = typeof (row as { url?: unknown }).url === 'string' ? (row as { url: string }).url.trim() : '';
      if (!url || seen.has(url)) continue;
      seen.add(url);
      const label =
        typeof (row as { label?: unknown }).label === 'string'
          ? (row as { label: string }).label
          : undefined;
      links.push({ url, ...(label ? { label } : {}) });
    }
  }
  for (const ev of evidence) {
    const url = (ev.sourceUrl ?? '').trim();
    if (!url || seen.has(url)) continue;
    try {
      new URL(url);
    } catch {
      continue;
    }
    seen.add(url);
    links.push({ url, label: ev.sourceLabel });
  }
  return links;
}

function usableRaw(answer: PrivacyAnswerProposal): boolean {
  if (!answer.raw || typeof answer.raw !== 'object') return false;
  if (answer.status === 'not_found' || answer.status === 'not_applicable') return false;
  return true;
}

function isUnknownRaw(raw: unknown): boolean {
  return Boolean(raw && typeof raw === 'object' && 'status' in raw && (raw as { status: string }).status === 'unknown');
}

async function loadPrivacyDefs(): Promise<Map<string, { id: string; slug: string }>> {
  const db = getDb();
  const { evidenceDefinitions } = await (db.query as any)({
    evidenceDefinitions: {
      $: {},
      subscore: { category: {} },
    },
  });
  const map = new Map<string, { id: string; slug: string }>();
  for (const def of evidenceDefinitions ?? []) {
    const slug = String(def.slug ?? '');
    if (!AI_PRIVACY_SLUGS.includes(slug as AiPrivacySlug)) continue;
    const cat = def.subscore?.category?.slug;
    if (slug === 'refunds') {
      if (cat !== 'pricing') continue;
    } else if (cat && cat !== 'privacy') {
      continue;
    }
    map.set(slug, { id: def.id, slug });
  }
  return map;
}

export async function applyPrivacyAnalysis(opts: {
  productId: string;
  testRunId: string;
  analysisId?: string;
  /** Only apply these slugs (for rescan). */
  onlySlugs?: AiPrivacySlug[];
}): Promise<{ applied: string[]; skipped: string[] }> {
  const db = getDb();
  const analysis = await getLatestPrivacyAnalysis(opts.testRunId);
  if (!analysis) throw new HttpError(404, 'No privacy analysis found');
  if (opts.analysisId && opts.analysisId !== analysis.id) {
    throw new HttpError(400, 'Analysis id mismatch');
  }
  if (analysis.productId && analysis.productId !== opts.productId) {
    throw new HttpError(400, 'Analysis belongs to a different product');
  }

  const parsed = privacyStructuredOutputSchema.safeParse(analysis.structuredOutput);
  if (!parsed.success) throw new HttpError(422, 'Analysis has no valid structured output — run Analyze first.');

  const output: PrivacyStructuredOutput = parsed.data;
  const defs = await loadPrivacyDefs();

  const { evidenceResults } = await (db.query as any)({
    evidenceResults: {
      $: { where: { 'testRun.id': opts.testRunId } },
      evidenceDefinition: {},
    },
  });

  const resultByDefId = new Map<string, any>();
  for (const row of evidenceResults ?? []) {
    if (row.evidenceDefinition?.id) resultByDefId.set(row.evidenceDefinition.id, row);
  }

  const applied: string[] = [];
  const skipped: string[] = [];
  const txs: any[] = [];
  const now = Date.now();

  for (const answer of output.answers) {
    if (opts.onlySlugs && !opts.onlySlugs.includes(answer.slug)) continue;
    const def = defs.get(answer.slug);
    if (!def) {
      skipped.push(answer.slug);
      continue;
    }

    const existing = resultByDefId.get(def.id);
    const existingDetails =
      existing?.calculationDetails && typeof existing.calculationDetails === 'object'
        ? (existing.calculationDetails as Record<string, unknown>)
        : {};
    const existingAi = existingDetails.aiPrivacy as AiPrivacyCalculationDetails | undefined;

    if (existingAi?.reviewStatus === 'accepted') {
      skipped.push(answer.slug);
      continue;
    }

    // Preserve manual edits: if reviewer changed raw away from last proposal, skip overwrite.
    if (
      existing &&
      existingAi?.proposalRaw &&
      existing.rawValue &&
      !rawEqual(existing.rawValue, existingAi.proposalRaw)
    ) {
      skipped.push(answer.slug);
      continue;
    }

    const prepared = validatePrivacyAnswer(answer);
    const aiPrivacy: AiPrivacyCalculationDetails = {
      analysisId: analysis.id,
      slug: prepared.slug,
      reviewStatus:
        existingAi?.reviewStatus === 'rejected' ? 'rejected' : 'pending_review',
      fillStatus: prepared.status,
      confidence: prepared.confidence,
      proposalRaw: prepared.raw,
      rationale: prepared.rationale,
      evidence: prepared.evidence,
      ...(existingAi?.legacyRationale ? { legacyRationale: existingAi.legacyRationale } : {}),
      ...(existingAi?.reviewStatus === 'rejected' && existingAi.rejectedAt
        ? { rejectedAt: existingAi.rejectedAt, rejectedBy: existingAi.rejectedBy }
        : {}),
    };

    const proofLinks = mergeProofLinks(existing?.proofLinks, prepared.evidence);
    const calculationDetails = { ...existingDetails, aiPrivacy };

    if (existing) {
      const fields: Record<string, unknown> = {
        calculationDetails,
        updatedAt: now,
        testDate: existing.testDate ?? now,
      };
      if (usableRaw(prepared)) {
        fields.rawValue = prepared.raw;
        fields.notApplicable = false;
        fields.isUnknown = isUnknownRaw(prepared.raw);
      }
      if (proofLinks.length > 0) fields.proofLinks = proofLinks;
      txs.push(db.tx.evidenceResults[existing.id].update(fields));
    } else {
      const resultId = newId();
      const fields: Record<string, unknown> = {
        calculationDetails,
        updatedAt: now,
        testDate: now,
        proofLinks: proofLinks.length > 0 ? proofLinks : undefined,
      };
      if (usableRaw(prepared)) {
        fields.rawValue = prepared.raw;
        fields.isUnknown = isUnknownRaw(prepared.raw);
      }
      txs.push(db.tx.evidenceResults[resultId].update(fields));
      txs.push(
        db.tx.evidenceResults[resultId].link({
          testRun: opts.testRunId,
          evidenceDefinition: def.id,
          product: opts.productId,
        }),
      );
    }
    applied.push(answer.slug);
  }

  txs.push(
    db.tx.aiPrivacyAnalyses[analysis.id].update({
      status: 'applied',
      updatedAt: now,
    }),
  );

  if (txs.length > 0) await db.transact(txs);
  return { applied, skipped };
}

export function summarizePrivacyOutput(output: PrivacyStructuredOutput | undefined): {
  filled: number;
  needsReview: number;
  notFound: number;
  conflicting: number;
  total: number;
  high: number;
  medium: number;
  low: number;
} {
  const answers = output?.answers ?? [];
  return {
    total: answers.length,
    filled: answers.filter((a) => a.status === 'filled').length,
    needsReview: answers.filter((a) => a.status === 'needs_review').length,
    notFound: answers.filter((a) => a.status === 'not_found').length,
    conflicting: answers.filter((a) => a.status === 'conflicting').length,
    high: answers.filter((a) => a.confidence === 'high').length,
    medium: answers.filter((a) => a.confidence === 'medium').length,
    low: answers.filter((a) => a.confidence === 'low').length,
  };
}
