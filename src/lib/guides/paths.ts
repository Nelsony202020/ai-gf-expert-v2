const GUIDE_HUB_PATHS = new Set([
  '/guides',
  '/guides/ourdream-ai',
  '/guides/candy-ai',
  '/guides/nectar-ai',
  '/guides/girlfriendgpt',
  '/guides/girlfriend-gpt',
  '/guides/juicychat-ai',
]);

/** True for article/guide URLs under /guides/, not the /guides/ hub. */
export function isGuideSubpage(pathname: string): boolean {
  const path = String(pathname ?? '').split('?')[0].split('#')[0];
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  if (GUIDE_HUB_PATHS.has(normalized)) return false;
  return normalized.startsWith('/guides/');
}
