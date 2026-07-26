export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../lib/api';
import { HttpError } from '../../../lib/db/auth';
import { createSlugChangeRedirect } from '../../../lib/db/redirects';
import { isDbConfigured } from '../../../lib/db/server';
import { triggerRebuild } from '../../../lib/db/publish';
import { env } from '../../../lib/env';

interface SanityWebhookPayload {
  operation?: string; // create | update | delete
  documentId?: string;
  slug?: string;
  previousSlug?: string;
  type?: string;
}

/**
 * Sanity webhook: guide publish/unpublish triggers a static rebuild; a slug
 * change on a published guide additionally creates a 301 redirect in the
 * central redirect manager. Authenticated by shared secret
 * (?secret= or sanity-webhook-secret header).
 */
export const POST: APIRoute = handler(async ({ request, url }) => {
  const secret = env('SANITY_WEBHOOK_SECRET');
  const provided =
    url.searchParams.get('secret') ?? request.headers.get('sanity-webhook-secret');
  if (!secret || provided !== secret) {
    throw new HttpError(401, 'Invalid webhook secret');
  }

  const payload = (await request.json().catch(() => ({}))) as SanityWebhookPayload;
  if (payload.type && payload.type !== 'guide') {
    return json({ ok: true, skipped: 'not a guide' });
  }

  const actions: string[] = [];

  if (
    payload.previousSlug &&
    payload.slug &&
    payload.previousSlug !== payload.slug &&
    isDbConfigured()
  ) {
    try {
      await createSlugChangeRedirect(
        `/guides/${payload.previousSlug}`,
        `/guides/${payload.slug}`,
        { email: 'sanity-webhook', role: 'admin' } as any,
      );
      actions.push(`redirect /guides/${payload.previousSlug} -> /guides/${payload.slug}`);
    } catch (error) {
      // A duplicate redirect is fine (e.g. webhook retries); anything else surfaces.
      if (!(error instanceof HttpError && error.status === 409)) throw error;
      actions.push('redirect already exists');
    }
  }

  await triggerRebuild(`sanity guide ${payload.operation ?? 'update'}: ${payload.slug ?? payload.documentId ?? ''}`);
  actions.push('rebuild requested');

  return json({ ok: true, actions });
});
