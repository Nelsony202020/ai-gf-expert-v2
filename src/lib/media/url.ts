// Resolve a public URL for a media record (cached url or linked storage file).

import { cdnAsset } from './cdn';
import { cdnBaseUrlFromEnv } from './cdnClient';
import { isInstantDbFileUrl, isPermanentCdnUrl } from './permanentUrl';

/** Turn site-relative media paths into absolute CDN (or same-origin) URLs for public HTML. */
export function normalizePublicMediaUrl(url: string | undefined | null): string {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/api/')) {
    return cdnAsset(raw);
  }
  return raw;
}

function instantDbFileUrl(media: { file?: { url?: unknown } | null }): string {
  const fileUrl = media.file?.url;
  return fileUrl ? String(fileUrl) : '';
}

/**
 * Prefer Bunny CDN always.
 * InstantDB signed file URLs are only a last-resort fallback for unmigrated media.
 */
function resolveCachedUrl(cached: string, fileUrl: string): string {
  if (isPermanentCdnUrl(cached)) return cached;
  if (isPermanentCdnUrl(fileUrl)) return fileUrl;

  // Any non-InstantDB https URL on media.url beats InstantDB signed links.
  if (cached && !isInstantDbFileUrl(cached) && /^https?:\/\//i.test(cached)) {
    return cached;
  }

  // Legacy / unmigrated only.
  if (fileUrl) return fileUrl;
  return cached;
}

export function resolveMediaUrl(
  media: { url?: unknown; file?: { url?: unknown } } | Record<string, any> | null | undefined,
): string {
  if (!media) return '';
  const m = media as { url?: unknown; file?: { url?: unknown } | null; id?: string };
  const cached = m.url ? String(m.url) : '';
  const fileUrl = instantDbFileUrl(m);
  const resolved = resolveCachedUrl(cached, fileUrl);
  if (resolved) return normalizePublicMediaUrl(resolved);

  const cdnBase = cdnBaseUrlFromEnv();
  if (cdnBase && cached.startsWith('/') && !cached.startsWith('//')) {
    return normalizePublicMediaUrl(`${cdnBase}${cached}`);
  }

  return '';
}

/** URLs safe to embed on the public site (excludes blob/data/admin-only paths). */
export function isUsablePublicMediaUrl(url: string): boolean {
  const s = normalizePublicMediaUrl(String(url ?? '').trim());
  if (!s) return false;
  if (s.startsWith('blob:') || s.startsWith('data:')) return false;
  if (s.startsWith('/api/')) return false;
  if (s.startsWith('/') && !s.startsWith('//')) return true;
  return /^https?:\/\//i.test(s);
}

export function inferMediaTypeFromUrl(url: string): 'image' | 'video' {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url) ? 'video' : 'image';
}
