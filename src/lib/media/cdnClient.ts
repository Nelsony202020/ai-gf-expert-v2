/** Client-safe Bunny pull-zone helpers (no Node built-ins). */

const DEFAULT_CDN_HOST = 'aigirlfriendpull.b-cdn.net';

export function cdnHostnameFromEnv(): string {
  const meta = (import.meta as { env?: Record<string, string> }).env;
  const fromPublic = meta?.PUBLIC_CDN_URL?.trim();
  if (fromPublic) return fromPublic.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (typeof process !== 'undefined' && process.env.VERCEL === '1') return DEFAULT_CDN_HOST;
  return '';
}

export function cdnBaseUrlFromEnv(): string {
  const host = cdnHostnameFromEnv();
  return host ? `https://${host}` : '';
}
