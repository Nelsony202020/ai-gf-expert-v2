/** Infer a supported MIME type from a File (handles empty browser type on .webp downloads). */
export function inferImageMimeType(file: File): string | null {
  if (file.type.startsWith('image/') || file.type.startsWith('video/')) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    webp: 'image/webp',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
  };
  return ext ? map[ext] ?? null : null;
}

export function isAcceptedMediaFile(file: File): boolean {
  return inferImageMimeType(file) !== null;
}

/** Re-wrap file with inferred MIME when the browser leaves type empty. */
export function fileWithInferredMime(file: File): File {
  const mime = inferImageMimeType(file);
  if (!mime || file.type === mime) return file;
  return new File([file], file.name, { type: mime, lastModified: file.lastModified });
}
