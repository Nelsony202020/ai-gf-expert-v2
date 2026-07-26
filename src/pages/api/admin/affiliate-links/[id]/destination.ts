export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handler, json, readJson } from '../../../../../lib/api';
import { requirePermission, HttpError } from '../../../../../lib/db/auth';
import { getDb, id as newId } from '../../../../../lib/db/server';
import { auditTx } from '../../../../../lib/db/audit';

/**
 * Change an affiliate link destination WITHOUT touching any page — every CTA
 * renders /go/[cloakedSlug], so the change is instant sitewide. The previous
 * destination is preserved in affiliateLinkHistory.
 */
export const POST: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'affiliates.edit');
  const body = await readJson<{ destinationUrl: string; reason?: string }>(request);
  const parsed = z.string().url().safeParse(body.destinationUrl);
  if (!parsed.success) throw new HttpError(400, 'Invalid destination URL');

  const db = getDb();
  const { affiliateLinks } = await db.query({
    affiliateLinks: { $: { where: { id: params.id! } } },
  });
  const link = affiliateLinks[0];
  if (!link) throw new HttpError(404, 'Affiliate link not found');
  if (link.destinationUrl === parsed.data) return json({ changed: false });

  const historyId = newId();
  await db.transact([
    db.tx.affiliateLinks[params.id!].update({
      destinationUrl: parsed.data,
      lastVerifiedAt: Date.now(),
      lastCheckStatus: 'unchecked',
    }),
    db.tx.affiliateLinkHistory[historyId]
      .update({
        previousUrl: link.destinationUrl,
        newUrl: parsed.data,
        changedBy: identity.email,
        changedAt: Date.now(),
        reason: body.reason,
      })
      .link({ affiliateLink: params.id! }),
    auditTx({
      actorEmail: identity.email,
      action: 'update',
      recordType: 'affiliateLinks',
      recordId: params.id!,
      oldValue: { destinationUrl: link.destinationUrl },
      newValue: { destinationUrl: parsed.data },
      reason: body.reason,
    }),
  ]);

  return json({ changed: true });
});
