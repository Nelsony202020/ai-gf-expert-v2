// Editor preview gate: /reviews/preview/[slug] loads unpublished products, so
// in production it requires a short-lived HMAC cookie. The admin app requests
// the cookie (POST /api/admin/preview-session) right after sign-in, so preview
// links from the workspace keep working in the same browser.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env';

export const PREVIEW_COOKIE_NAME = 'agfe_preview';
const TTL_MS = 12 * 60 * 60 * 1000;

function sign(expiresAt: number): string {
  // The Instant admin token is the only always-present server secret.
  const secret = env('INSTANT_APP_ADMIN_TOKEN') ?? 'dev-preview-secret';
  return createHmac('sha256', secret).update(String(expiresAt)).digest('hex');
}

export function mintPreviewToken(): { value: string; maxAgeSeconds: number } {
  const expiresAt = Date.now() + TTL_MS;
  return {
    value: `${expiresAt}.${sign(expiresAt)}`,
    maxAgeSeconds: Math.floor(TTL_MS / 1000),
  };
}

export function verifyPreviewToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split('.');
  const expiresAt = Number(expRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !sig) return false;
  const expected = sign(expiresAt);
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
