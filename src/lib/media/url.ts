// Resolve a public URL for a media record (cached url or linked storage file).

import { cdnBaseUrlFromEnv } from './cdnClient';
import { isPermanentCdnUrl } from './permanentUrl';

function instantDbFileUrl(media: { file?: { url?: unknown } | null }): string {
  const fileUrl = media.file?.url;
  return fileUrl ? String(fileUrl) : '';
}

/**
 * Prefer a permanent CDN URL (Bunny) when present.
 * InstantDB signed file URLs are only a fallback for unmigrated media.
 */
function resolveCachedUrl(cached: string, fileUrl: string): string {
  if (!cached) return fileUrl;
  if (isPermanentCdnUrl(cached)) return cached;
  return fileUrl || cached;
}

export function resolveMediaUrl(
  media: { url?: unknown; file?: { url?: unknown } } | Record<string, any> | null | undefined,
): string {
  if (!media) return '';
  const m = media as { url?: unknown; file?: { url?: unknown } | null; id?: string };
  const cached = m.url ? String(m.url) : '';
  const fileUrl = instantDbFileUrl(m);
  const resolved = resolveCachedUrl(cached, fileUrl);
  if (resolved) return resolved;

  const cdnBase = cdnBaseUrlFromEnv();
  if (cdnBase && cached.startsWith('/') && !cached.startsWith('//')) {
    return `${cdnBase}${cached}`;
  }

  return '';
}

/** URLs safe to embed on the public site (excludes blob/data/admin-only paths). */
export function isUsablePublicMediaUrl(url: string): boolean {
  const s = String(url ?? '').trim();
  if (!s) return false;
  if (s.startsWith('blob:') || s.startsWith('data:')) return false;
  if (s.startsWith('/api/')) return false;
  return /^https?:\/\//i.test(s);
}

export function inferMediaTypeFromUrl(url: string): 'image' | 'video' {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url) ? 'video' : 'image';
}
