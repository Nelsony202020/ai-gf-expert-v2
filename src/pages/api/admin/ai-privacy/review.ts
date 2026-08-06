export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { auditTx } from '../../../../lib/db/audit';
import { getDb } from '../../../../lib/db/server';
import { reviewPrivacyAnswer, reviewRequestSchema } from '../../../../lib/ai-privacy/review';

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'testing.edit');
  const body = reviewRequestSchema.parse(await readJson(request));
  const result = await reviewPrivacyAnswer(body, identity);

  const db = getDb();
  await db.transact(
    auditTx({
      actorEmail: identity.email,
      action: body.action === 'accept' ? 'ai_privacy_accepted' : 'ai_privacy_rejected',
      recordType: 'aiPrivacyAnalysis',
      recordId: body.testRunId,
      newValue: { slug: body.slug, action: body.action },
    }),
  );

  return json(result);
});
