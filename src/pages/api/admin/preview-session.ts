export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../lib/api';
import { requireIdentity } from '../../../lib/db/auth';
import { mintPreviewToken, PREVIEW_COOKIE_NAME } from '../../../lib/previewSession';

// Issues the HttpOnly cookie that unlocks /reviews/preview/* in production.
// Called by the admin app after sign-in.
export const POST: APIRoute = handler(async ({ request }) => {
  await requireIdentity(request);
  const { value, maxAgeSeconds } = mintPreviewToken();
  const response = json({ ok: true });
  const secure = import.meta.env.PROD ? '; Secure' : '';
  response.headers.set(
    'Set-Cookie',
    `${PREVIEW_COOKIE_NAME}=${value}; Path=/reviews/preview; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`,
  );
  return response;
});
