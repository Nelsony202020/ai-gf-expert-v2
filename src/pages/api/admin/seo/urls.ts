export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { buildUrlRegistry, type UrlRegistry } from '../../../../lib/seo/urlRegistry';

// The registry hits InstantDB + Sanity; cache briefly so tab switches between
// SEO pages don't re-aggregate everything.
const CACHE_TTL_MS = 60_000;
let cache: { at: number; payload: UrlRegistry } | null = null;

export const GET: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'seo.edit');

  const refresh = new URL(request.url).searchParams.get('refresh') === '1';
  if (!refresh && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return json(cache.payload);
  }

  const payload = await buildUrlRegistry();
  cache = { at: Date.now(), payload };
  return json(payload);
});
