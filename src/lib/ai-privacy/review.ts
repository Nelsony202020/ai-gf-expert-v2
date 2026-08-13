import { z } from 'zod';
import { getDb } from '../db/server';
import { HttpError, type AdminIdentity } from '../db/auth';
import { AI_PRIVACY_SLUGS, type AiPrivacyCalculationDetails, type AiPrivacySlug } from './types';
import { analyzePrivacyPolicies } from './extract';
import { applyPrivacyAnalysis } from './applyAnalysis';
import { getLatestPrivacyAnalysis } from './store';

export const reviewRequestSchema = z.object({
  productId: z.string().min(1),
  testRunId: z.string().min(1),
  slug: z.enum(AI_PRIVACY_SLUGS),
  action: z.enum(['accept', 'reject']),
});

export const rescanRequestSchema = z.object({
  productId: z.string().min(1),
  testRunId: z.string().min(1),
  slug: z.enum(AI_PRIVACY_SLUGS),
});

function rawEqual(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

async function findResultForSlug(testRunId: string, slug: AiPrivacySlug) {
  const db = getDb();
  const { evidenceResults } = await (db.query as any)({
    evidenceResults: {
      $: { where: { 'testRun.id': testRunId } },
      evidenceDefinition: { subscore: { category: { methodologyVersion: {} } } },
    },
  });
  const { testRuns } = await (db.query as any)({
    testRuns: {
      $: { where: { id: testRunId } },
      methodologyVersion: {},
    },
  });
  const mvId = testRuns?.[0]?.methodologyVersion?.id as string | undefined;
  const matches = (evidenceResults ?? []).filter(
    (r: any) => String(r.evidenceDefinition?.slug) === slug,
  );
  if (matches.length === 0) return null;
  if (!mvId) return matches[0];
  const scoped = matches.find(
    (r: any) => r.evidenceDefinition?.subscore?.category?.methodologyVersion?.id === mvId,
  );
  return scoped ?? matches[0];
}

export async function reviewPrivacyAnswer(
  body: z.infer<typeof reviewRequestSchema>,
  identity: AdminIdentity,
): Promise<{ ok: true; reviewStatus: 'accepted' | 'rejected' }> {
  const db = getDb();
  const row = await findResultForSlug(body.testRunId, body.slug);
  if (!row) throw new HttpError(404, 'No evidence result for this question yet.');

  const details =
    row.calculationDetails && typeof row.calculationDetails === 'object'
      ? ({ ...(row.calculationDetails as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  const ai = details.aiPrivacy as AiPrivacyCalculationDetails | undefined;
  if (!ai) throw new HttpError(400, 'No AI privacy evidence on this result.');

  const now = Date.now();

  if (body.action === 'accept') {
    const next: AiPrivacyCalculationDetails = {
      ...ai,
      reviewStatus: 'accepted',
      acceptedAt: now,
      acceptedBy: identity.email,
      rejectedAt: undefined,
      rejectedBy: undefined,
    };
    await db.transact([
      db.tx.evidenceResults[row.id].update({
        calculationDetails: { ...details, aiPrivacy: next },
        updatedAt: now,
      }),
    ]);
    return { ok: true, reviewStatus: 'accepted' };
  }

  // Reject: clear AI-filled raw only if it still matches the proposal.
  const clearRaw = ai.proposalRaw && rawEqual(row.rawValue, ai.proposalRaw);
  const next: AiPrivacyCalculationDetails = {
    ...ai,
    reviewStatus: 'rejected',
    rejectedAt: now,
    rejectedBy: identity.email,
    acceptedAt: undefined,
    acceptedBy: undefined,
  };

  // Keep rejected evidence for audit on the analysis entity.
  const analysis = await getLatestPrivacyAnalysis(body.testRunId);
  const txs: any[] = [
    db.tx.evidenceResults[row.id].update({
      calculationDetails: { ...details, aiPrivacy: next },
      ...(clearRaw ? { rawValue: null, isUnknown: false } : {}),
      updatedAt: now,
    }),
  ];

  if (analysis) {
    const prev =
      analysis.structuredOutput && typeof analysis.structuredOutput === 'object'
        ? (analysis.structuredOutput as Record<string, unknown>)
        : {};
    const priorAudit = Array.isArray(prev._rejectedAudit) ? prev._rejectedAudit : [];
    txs.push(
      db.tx.aiPrivacyAnalyses[analysis.id].update({
        structuredOutput: {
          ...prev,
          _rejectedAudit: [
            ...priorAudit,
            {
              slug: body.slug,
              rejectedAt: now,
              rejectedBy: identity.email,
              proposal: ai,
            },
          ],
        },
        updatedAt: now,
      }),
    );
  }

  await db.transact(txs);
  return { ok: true, reviewStatus: 'rejected' };
}

/** Re-run full analysis then re-apply only the requested slug. */
export async function rescanPrivacySlug(
  body: z.infer<typeof rescanRequestSchema>,
  identity: AdminIdentity,
) {
  const { analysis, output } = await analyzePrivacyPolicies(
    { productId: body.productId, testRunId: body.testRunId },
    identity,
  );

  // Force re-apply this slug even if previously accepted by clearing review on that result first.
  const db = getDb();
  const row = await findResultForSlug(body.testRunId, body.slug);
  if (row?.calculationDetails && typeof row.calculationDetails === 'object') {
    const details = { ...(row.calculationDetails as Record<string, unknown>) };
    const ai = details.aiPrivacy as AiPrivacyCalculationDetails | undefined;
    if (ai) {
      await db.transact([
        db.tx.evidenceResults[row.id].update({
          calculationDetails: {
            ...details,
            aiPrivacy: { ...ai, reviewStatus: 'pending_review' },
          },
          updatedAt: Date.now(),
        }),
      ]);
    }
  }

  const applyResult = await applyPrivacyAnalysis({
    productId: body.productId,
    testRunId: body.testRunId,
    analysisId: analysis.id,
    onlySlugs: [body.slug],
  });

  const answer = output.answers.find((a) => a.slug === body.slug);
  return { analysis, answer, applyResult };
}
