import { env } from '../env';

export { isPermanentCdnUrl } from './permanentUrl';

/** Default pull zone — used on Vercel when env vars are not set yet. */
const DEFAULT_CDN_HOST = 'aigirlfriendpull.b-cdn.net';

/** Pull zone hostname, e.g. aigirlfriendpull.b-cdn.net */
export function bunnyCdnHostname(): string {
  return (
    env('PUBLIC_CDN_URL')?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '') ||
    env('BUNNY_CDN_HOSTNAME')?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '') ||
    (typeof process !== 'undefined' && process.env.VERCEL === '1' ? DEFAULT_CDN_HOST : '')
  );
}

export function getCdnBaseUrl(): string {
  const host = bunnyCdnHostname();
  return host ? `https://${host}` : '';
}

/** Site brand marks that ship with the app — don't require a CDN upload to render. */
const SAME_ORIGIN_PUBLIC_PATHS = new Set([
  '/brand/girlfriend-expert-logo.png',
  '/brand/girlfriend-expert-logo-white.png',
]);

function isDevRuntime(): boolean {
  const metaEnv = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env;
  if (metaEnv?.DEV) return true;
  return typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
}

/** Prefix a /public asset path with the Bunny pull zone when configured. */
export function cdnAsset(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;

  // Local dev + unreleased brand files: serve from Astro/public, not the pull zone.
  if (isDevRuntime() || SAME_ORIGIN_PUBLIC_PATHS.has(normalized)) {
    return normalized;
  }

  const base = getCdnBaseUrl();
  if (!base) return normalized;
  return `${base}${normalized}`;
}

export function isBunnyConfigured(): boolean {
  return Boolean(
    env('BUNNY_STORAGE_ZONE')?.trim() &&
      env('BUNNY_STORAGE_API_KEY')?.trim() &&
      env('BUNNY_CDN_HOSTNAME')?.trim(),
  );
}

export function bunnyPublicUrl(storagePath: string): string {
  const host = bunnyCdnHostname() || env('BUNNY_CDN_HOSTNAME')!.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cleanPath = storagePath.replace(/^\//, '');
  return `https://${host}/${cleanPath}`;
}

/** Upload a file buffer to Bunny Storage; returns the public pull-zone URL. */
export async function uploadToBunny(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const zone = env('BUNNY_STORAGE_ZONE')!.trim();
  const key = env('BUNNY_STORAGE_API_KEY')!.trim();
  const path = storagePath.replace(/^\//, '');
  const endpoint = `https://storage.bunnycdn.com/${encodeURIComponent(zone)}/${path}`;

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      AccessKey: key,
      'Content-Type': contentType,
    },
    body: buffer,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Bunny upload failed (${res.status}): ${detail || res.statusText}`);
  }

  return bunnyPublicUrl(path);
}
