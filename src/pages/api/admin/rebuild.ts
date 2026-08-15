export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../lib/api';
import { requirePermission } from '../../../lib/db/auth';
import { triggerRebuild } from '../../../lib/db/publish';

/**
 * POST /api/admin/rebuild
 * Triggers a Vercel deploy so static public pages pick up InstantDB edits
 * (review article, verdict, etc.).
 */
export const POST: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'content.edit');
  let reason = 'admin rebuild';
  try {
    const body = (await request.json()) as { reason?: string };
    if (body?.reason && typeof body.reason === 'string') {
      reason = body.reason.slice(0, 200);
    }
  } catch {
    /* empty body ok */
  }
  const rebuildTriggered = await triggerRebuild(reason);
  return json({ ok: true, rebuildTriggered });
});
