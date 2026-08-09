/** Shared overlay fade + panel motion timing (ms). */
export const OVERLAY_MS = 340;

export function overlayDurationMs(): number {
  if (typeof window === 'undefined') return OVERLAY_MS;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : OVERLAY_MS;
}

/** Double rAF so CSS transitions run after display change. */
export function afterDisplayReady(callback: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

export function playOverlayOpen(root: HTMLElement, visibleClass = 'is-visible'): void {
  afterDisplayReady(() => root.classList.add(visibleClass));
}

export function playOverlayClose(
  root: HTMLElement,
  onHidden: () => void,
  visibleClass = 'is-visible',
): void {
  root.classList.remove(visibleClass);
  window.setTimeout(onHidden, overlayDurationMs());
}
