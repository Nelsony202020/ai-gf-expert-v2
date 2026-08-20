/** Warn when leaving Pricing with unverified screenshots or unsaved page copy. */

let unverifiedPricingUploads = 0;
let pricingPageCopyDirty = false;

export function setPricingUnverifiedUploadCount(count: number) {
  unverifiedPricingUploads = Math.max(0, count);
}

export function incrementPricingUnverifiedUploads(by = 1) {
  unverifiedPricingUploads += by;
}

export function decrementPricingUnverifiedUploads(by = 1) {
  unverifiedPricingUploads = Math.max(0, unverifiedPricingUploads - by);
}

export function setPricingPageCopyDirty(dirty: boolean) {
  pricingPageCopyDirty = dirty;
}

export function isPricingPageCopyDirty(): boolean {
  return pricingPageCopyDirty;
}

function workspaceTabFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/products\/[^/]+\/([^/?#]+)/);
  return m?.[1] ?? null;
}

export function shouldBlockPricingNavigation(nextPath: string): boolean {
  const nextTab = workspaceTabFromPath(nextPath);
  if (nextTab === 'pricing') return false;
  return unverifiedPricingUploads > 0 || pricingPageCopyDirty;
}

export function confirmLeavePricingIfNeeded(nextPath: string): boolean {
  if (!shouldBlockPricingNavigation(nextPath)) return true;

  if (pricingPageCopyDirty) {
    return window.confirm(
      'You have unsaved Pricing page copy. Leave without saving? Your latest edits will be lost.',
    );
  }

  return window.confirm(
    'You uploaded pricing screenshots that are not verified yet. If you leave now, they stay attached to Pricing but will not appear in the media library until you click Mark verified today.',
  );
}
