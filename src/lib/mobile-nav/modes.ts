/** Mobile navigation modes — desktop is unaffected. */
export type MobileNavMode = 'site' | 'hub' | 'review';

export type BottomNavId =
  | 'home'
  | 'reviews'
  | 'best-apps'
  | 'buying-guide'
  | 'how-we-test'
  | 'testing'
  | 'contents'
  | 'more';

const BUYING_GUIDE_PATH = '/guides/how-to-choose-an-ai-girlfriend-app';
const ROUNDUP_PATH = '/best/ai-girlfriend';

function normalizePath(pathname: string): string {
  const path = pathname.split('?')[0]?.split('#')[0] ?? '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

/** True for /reviews/[slug] and /reviews/preview/[slug]. */
export function isIndividualReviewPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path.startsWith('/reviews/preview/') && path.split('/').length === 4) return true;
  if (!path.startsWith('/reviews/')) return false;
  const segments = path.split('/').filter(Boolean);
  return segments.length === 2 && segments[0] === 'reviews' && segments[1] !== 'preview';
}

export function isHubPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === ROUNDUP_PATH || path === BUYING_GUIDE_PATH || path === '/test' || path.startsWith('/test/');
}

export function getMobileNavMode(pathname: string): MobileNavMode {
  if (isIndividualReviewPath(pathname)) return 'review';
  if (isHubPath(pathname)) return 'hub';
  return 'site';
}

export function getActiveBottomNavItem(pathname: string): BottomNavId | null {
  const path = normalizePath(pathname);
  const mode = getMobileNavMode(pathname);

  if (mode === 'hub') {
    if (path === ROUNDUP_PATH) return 'best-apps';
    if (path === BUYING_GUIDE_PATH) return 'buying-guide';
    if (path === '/test' || path.startsWith('/test/')) return 'how-we-test';
  }

  if (mode === 'site') {
    if (path === '/') return 'home';
    if (path === '/reviews' || path === '/ai-girlfriend-apps') return 'reviews';
    if (path.startsWith('/reviews/')) return 'reviews';
  }

  return null;
}

export function showMobileBottomNav(mode: MobileNavMode): boolean {
  return mode === 'site' || mode === 'hub';
}
