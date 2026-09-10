/** True for article/guide URLs under /guides/, not the /guides/ hub. */
export function isGuideSubpage(pathname: string): boolean {
  const path = String(pathname ?? '').split('?')[0].split('#')[0];
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  if (normalized === '/guides') return false;
  return normalized.startsWith('/guides/');
}
