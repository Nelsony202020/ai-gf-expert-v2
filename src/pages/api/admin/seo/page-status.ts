export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission, HttpError } from '../../../../lib/db/auth';
import { setPageNoindex, setPageOverride } from '../../../../lib/seo/pageOverrides';

interface Payload {
  path?: string;
  status?: 'draft' | 'published';
  noindex?: boolean;
}

// Put any page (hard-coded, generated, CMS) into draft, or publish it again.
// Drafted pages are served as 404 and dropped from the XML sitemaps.
// Search visibility (noindex) uses the same pageOverrides map so static hubs
// can later be flipped to index from SEO → Pages without a code change.
export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'seo.edit');
  const payload = await readJson<Payload>(request);
  if (!payload?.path || !payload.path.startsWith('/')) {
    throw new HttpError(400, 'Missing or invalid "path"');
  }

  const hasStatus = payload.status === 'draft' || payload.status === 'published';
  const hasNoindex = typeof payload.noindex === 'boolean';
  if (!hasStatus && !hasNoindex) {
    throw new HttpError(400, 'Provide "status" (draft|published) and/or "noindex" (boolean)');
  }

  if (hasStatus) {
    await setPageOverride(payload.path, payload.status === 'draft', identity.email);
  }
  if (hasNoindex) {
    await setPageNoindex(payload.path, payload.noindex === true, identity.email);
  }
  return json({ ok: true });
});
