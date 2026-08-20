/** Query flag that activates the standalone review Safe View interstitial. */
export const SAFE_VIEW_PARAM = 'safe';
export const SAFE_VIEW_VALUE = '1';
export const SAFE_ENTRY_STORAGE_KEY = 'safeEntryConfirmed';

const PUBLIC_REVIEW_PATH = /^\/reviews\/([a-z0-9-]+)\/?$/i;
const PREVIEW_REVIEW_PATH = /^\/reviews\/preview\/([a-z0-9-]+)\/?$/i;

export function isSafeViewParam(url: URL): boolean {
  return url.searchParams.get(SAFE_VIEW_PARAM) === SAFE_VIEW_VALUE;
}

export function reviewSlugFromPath(pathname: string): string | null {
  const preview = pathname.match(PREVIEW_REVIEW_PATH);
  if (preview) return preview[1];
  const match = pathname.match(PUBLIC_REVIEW_PATH);
  if (!match) return null;
  if (match[1].toLowerCase() === 'preview') return null;
  return match[1];
}

/** True when this request must render the standalone Safe View page. */
export function isReviewSafeView(url: URL): boolean {
  return isSafeViewParam(url) && Boolean(reviewSlugFromPath(url.pathname));
}

/** Remove only `safe=1`; keep every other query param and the hash. */
export function stripSafeViewSearch(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete(SAFE_VIEW_PARAM);
  const next = params.toString();
  return next ? `?${next}` : '';
}

export function titleFromReviewSlug(slug: string): string {
  const name = slug
    .split('-')
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === 'ai') return 'AI';
      if (lower === 'gpt') return 'GPT';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
  return `${name} Review`;
}
