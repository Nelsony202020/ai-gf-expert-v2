// Resolve a public URL for a media record (cached url or linked storage file).

export function resolveMediaUrl(
  media: { url?: unknown; file?: { url?: unknown } } | Record<string, any> | null | undefined,
): string {
  if (!media) return '';
  const m = media as { url?: unknown; file?: { url?: unknown } | null };
  const url = m.file?.url ?? m.url;
  return url ? String(url) : '';
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
