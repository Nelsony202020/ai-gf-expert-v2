export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { auditTx } from '../../../../lib/db/audit';
import { getDb } from '../../../../lib/db/server';
import { analyzeRequestSchema, analyzePrivacyPolicies } from '../../../../lib/ai-privacy/extract';
import { applyPrivacyAnalysis, summarizePrivacyOutput } from '../../../../lib/ai-privacy/applyAnalysis';

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'testing.edit');
  const body = analyzeRequestSchema.parse(await readJson(request));
  const db = getDb();

  await db.transact(
    auditTx({
      actorEmail: identity.email,
      action: 'ai_suggest_requested',
      recordType: 'aiPrivacyAnalysis',
      recordId: body.testRunId,
      newValue: { productId: body.productId },
    }),
  );

  try {
    const { analysis, output } = await analyzePrivacyPolicies(body, identity);
    const applyResult = await applyPrivacyAnalysis({
      productId: body.productId,
      testRunId: body.testRunId,
      analysisId: analysis.id,
    });
    const summary = summarizePrivacyOutput(output);

    await db.transact(
      auditTx({
        actorEmail: identity.email,
        action: 'ai_suggest_generated',
        recordType: 'aiPrivacyAnalysis',
        recordId: analysis.id,
        newValue: {
          model: analysis.model,
          applied: applyResult.applied,
          skipped: applyResult.skipped,
          summary,
        },
      }),
    );

    return json({
      analysis: { ...analysis, status: 'applied', structuredOutput: output },
      summary,
      applyResult,
    });
  } catch (e) {
    await db.transact(
      auditTx({
        actorEmail: identity.email,
        action: 'ai_suggest_failed',
        recordType: 'aiPrivacyAnalysis',
        recordId: body.testRunId,
        newValue: { error: e instanceof Error ? e.message : String(e) },
      }),
    );
    throw e;
  }
});
