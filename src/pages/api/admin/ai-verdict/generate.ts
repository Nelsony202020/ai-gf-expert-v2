export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { auditTx } from '../../../../lib/db/audit';
import { getDb } from '../../../../lib/db/server';
import { generateAiSuggestion } from '../../../../lib/ai-verdict/generate';
import { generateRequestSchema } from '../../../../lib/ai-verdict/suggestionSchema';

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'content.edit');
  const body = generateRequestSchema.parse(await readJson(request));

  await getDb().transact(
    auditTx({
      actorEmail: identity.email,
      action: 'ai_suggest_requested',
      recordType: 'aiEditorialSuggestion',
      recordId: body.productId,
      newValue: {
        scope: body.scope,
        categorySlug: body.categorySlug,
        targetField: body.targetField,
      },
    }),
  );

  const suggestion = await generateAiSuggestion(body, identity);
  return json({ suggestion });
});
