/**
 * Canonical public URL paths. The site uses trailing slashes on all HTML pages
 * (canonical + production `trailingSlash: 'always'`). Use these helpers anywhere a path is
 * stored, compared, or submitted to sitemaps / the SEO registry.
 */

function splitPath(path: string): { pathname: string; suffix: string } {
  const hashIdx = path.indexOf('#');
  const queryIdx = path.indexOf('?');
  let end = path.length;
  if (hashIdx >= 0) end = Math.min(end, hashIdx);
  if (queryIdx >= 0) end = Math.min(end, queryIdx);
  const pathname = path.slice(0, end) || '/';
  return { pathname: pathname.startsWith('/') ? pathname : `/${pathname}`, suffix: path.slice(end) };
}

/** Paths that keep their exact form (no forced trailing slash). */
function isSlashExempt(pathname: string): boolean {
  if (pathname === '/') return true;
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  if (pathname.startsWith('/api/') || pathname.startsWith('/go/')) return true;
  if (pathname.startsWith('/admin')) return true;
  return false;
}

/** Canonical public page path — trailing slash on all HTML routes. */
export function publicPagePath(path: string): string {
  const { pathname, suffix } = splitPath(path);
  if (isSlashExempt(pathname)) return `${pathname}${suffix}`;
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${withSlash}${suffix}`;
}

/** Dedup / override / sitemap-exclusion key (pathname only, no hash/query). */
export function pathMatchKey(path: string): string {
  return publicPagePath(path.split('#')[0].split('?')[0]);
}
