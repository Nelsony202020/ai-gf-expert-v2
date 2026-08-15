/** True when the URL is a stable Bunny CDN URL (not an expiring InstantDB signed link). */
export function isPermanentCdnUrl(url: string): boolean {
  const s = String(url ?? '').trim();
  if (!s) return false;
  if (s.includes('files.instantdb.com')) return false;
  if (s.startsWith('blob:') || s.startsWith('data:')) return false;
  if (!/^https?:\/\//i.test(s)) return false;
  try {
    const host = new URL(s).hostname.toLowerCase();
    return host === 'aigirlfriendpull.b-cdn.net' || host.endsWith('.b-cdn.net');
  } catch {
    return false;
  }
}

/** InstantDB signed storage URLs — temporary fallback only; never preferred on the public site. */
export function isInstantDbFileUrl(url: string): boolean {
  return String(url ?? '').includes('files.instantdb.com');
}
