export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { auditTx } from '../../../../lib/db/audit';
import { getDb } from '../../../../lib/db/server';
import { rescanPrivacySlug, rescanRequestSchema } from '../../../../lib/ai-privacy/review';

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'testing.edit');
  const body = rescanRequestSchema.parse(await readJson(request));
  const result = await rescanPrivacySlug(body, identity);

  const db = getDb();
  await db.transact(
    auditTx({
      actorEmail: identity.email,
      action: 'ai_privacy_rescanned',
      recordType: 'aiPrivacyAnalysis',
      recordId: body.testRunId,
      newValue: { slug: body.slug, applied: result.applyResult.applied },
    }),
  );

  return json(result);
});
