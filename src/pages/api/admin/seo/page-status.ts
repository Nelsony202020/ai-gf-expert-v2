export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission, HttpError } from '../../../../lib/db/auth';
import { setPageOverride } from '../../../../lib/seo/pageOverrides';

interface Payload {
  path?: string;
  status?: 'draft' | 'published';
}

// Put any page (hard-coded, generated, CMS) into draft, or publish it again.
// Drafted pages are served as 404 and dropped from the XML sitemaps.
export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'seo.edit');
  const payload = await readJson<Payload>(request);
  if (!payload?.path || !payload.path.startsWith('/')) {
    throw new HttpError(400, 'Missing or invalid "path"');
  }
  if (payload.status !== 'draft' && payload.status !== 'published') {
    throw new HttpError(400, '"status" must be "draft" or "published"');
  }

  await setPageOverride(payload.path, payload.status === 'draft', identity.email);
  return json({ ok: true });
});
