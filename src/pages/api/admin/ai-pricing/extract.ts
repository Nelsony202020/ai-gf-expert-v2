export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { auditTx } from '../../../../lib/db/audit';
import { getDb } from '../../../../lib/db/server';
import {
  extractPricingFromScreenshots,
  extractRequestSchema,
} from '../../../../lib/ai-pricing/extract';

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'content.edit');
  const body = extractRequestSchema.parse(await readJson(request));

  const db = getDb();
  await db.transact(
    auditTx({
      actorEmail: identity.email,
      action: 'ai_suggest_requested',
      recordType: 'pricingExtraction',
      recordId: body.productId,
      newValue: { mediaIds: body.mediaIds },
    }),
  );

  try {
    const draft = await extractPricingFromScreenshots(body, identity);
    await db.transact(
      auditTx({
        actorEmail: identity.email,
        action: 'ai_suggest_generated',
        recordType: 'pricingExtraction',
        recordId: body.productId,
        newValue: {
          model: draft.model,
          images: body.mediaIds.length,
          plans: draft.plans.length,
          packages: draft.packages.length,
          featureCosts: draft.featureCosts.length,
          promotions: draft.promotions.length,
        },
      }),
    );
    return json({ draft });
  } catch (e) {
    await db.transact(
      auditTx({
        actorEmail: identity.email,
        action: 'ai_suggest_failed',
        recordType: 'pricingExtraction',
        recordId: body.productId,
        newValue: { error: e instanceof Error ? e.message : String(e) },
      }),
    );
    throw e;
  }
});
