/** True when the URL is a stable public CDN URL (not an expiring InstantDB signed link). */
export function isPermanentCdnUrl(url: string): boolean {
  const s = String(url ?? '').trim();
  if (!s) return false;
  if (s.includes('files.instantdb.com')) return false;
  if (s.startsWith('blob:') || s.startsWith('data:')) return false;
  return /^https?:\/\//i.test(s);
}
