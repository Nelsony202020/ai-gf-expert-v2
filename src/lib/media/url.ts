// Resolve a public URL for a media record (cached url or linked storage file).

export function resolveMediaUrl(
  media: { url?: unknown; file?: { url?: unknown } } | null | undefined,
): string {
  if (!media) return '';
  const url = media.file?.url ?? media.url;
  return url ? String(url) : '';
}
