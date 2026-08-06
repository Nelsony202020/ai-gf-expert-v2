export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { auditTx } from '../../../../lib/db/audit';
import { getDb } from '../../../../lib/db/server';
import { saveDocumentsRequestSchema, savePrivacyDocuments } from '../../../../lib/ai-privacy/store';

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'testing.edit');
  const body = saveDocumentsRequestSchema.parse(await readJson(request));
  const analysis = await savePrivacyDocuments(body);

  const db = getDb();
  await db.transact(
    auditTx({
      actorEmail: identity.email,
      action: 'ai_privacy_documents_saved',
      recordType: 'aiPrivacyAnalysis',
      recordId: analysis.id,
      newValue: { testRunId: body.testRunId, documentCount: body.documents.length },
    }),
  );

  return json({ analysis });
});
