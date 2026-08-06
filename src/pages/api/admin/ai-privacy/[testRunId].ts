export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../lib/api';
import { requirePermission, HttpError } from '../../../../lib/db/auth';
import { getLatestPrivacyAnalysis } from '../../../../lib/ai-privacy/store';
import { summarizePrivacyOutput } from '../../../../lib/ai-privacy/applyAnalysis';
import { privacyStructuredOutputSchema } from '../../../../lib/ai-privacy/types';

export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'testing.edit');
  const testRunId = params.testRunId;
  if (!testRunId) throw new HttpError(400, 'Missing testRunId');

  const analysis = await getLatestPrivacyAnalysis(testRunId);
  if (!analysis) return json({ analysis: null, summary: null });

  const parsed = privacyStructuredOutputSchema.safeParse(analysis.structuredOutput);
  const summary = parsed.success ? summarizePrivacyOutput(parsed.data) : null;
  return json({ analysis, summary });
});
