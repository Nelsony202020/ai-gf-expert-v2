export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { auditTx } from '../../../../lib/db/audit';
import { getDb } from '../../../../lib/db/server';
import { altTextRequestSchema, generateAltTexts } from '../../../../lib/ai-alt-text/generate';

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'content.edit');
  const body = altTextRequestSchema.parse(await readJson(request));

  const db = getDb();
  try {
    const altTexts = await generateAltTexts(body, identity);
    await db.transact(
      auditTx({
        actorEmail: identity.email,
        action: 'ai_suggest_generated',
        recordType: 'altText',
        recordId: body.productId,
        newValue: { images: body.mediaIds.length, returned: altTexts.length },
      }),
    );
    return json({ altTexts });
  } catch (e) {
    await db.transact(
      auditTx({
        actorEmail: identity.email,
        action: 'ai_suggest_failed',
        recordType: 'altText',
        recordId: body.productId,
        newValue: { error: e instanceof Error ? e.message : String(e) },
      }),
    );
    throw e;
  }
});
