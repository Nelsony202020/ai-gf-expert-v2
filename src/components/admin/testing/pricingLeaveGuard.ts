/** Warn when leaving Pricing with screenshots not yet verified for the media library. */

let unverifiedPricingUploads = 0;

export function setPricingUnverifiedUploadCount(count: number) {
  unverifiedPricingUploads = Math.max(0, count);
}

export function incrementPricingUnverifiedUploads(by = 1) {
  unverifiedPricingUploads += by;
}

export function decrementPricingUnverifiedUploads(by = 1) {
  unverifiedPricingUploads = Math.max(0, unverifiedPricingUploads - by);
}

function workspaceTabFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/products\/[^/]+\/([^/?#]+)/);
  return m?.[1] ?? null;
}

export function shouldBlockPricingNavigation(nextPath: string): boolean {
  if (unverifiedPricingUploads <= 0) return false;
  const nextTab = workspaceTabFromPath(nextPath);
  return nextTab !== 'pricing';
}

export function confirmLeavePricingIfNeeded(nextPath: string): boolean {
  if (!shouldBlockPricingNavigation(nextPath)) return true;
  return window.confirm(
    'You uploaded pricing screenshots that are not verified yet. If you leave now, they stay attached to Pricing but will not appear in the media library until you click Mark verified today.',
  );
}
