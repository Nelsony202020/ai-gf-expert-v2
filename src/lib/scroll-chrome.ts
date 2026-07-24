/** Shared scroll-direction chrome for auto-hiding header + sticky sub-nav */

export const SCROLL_CHROME_DURATION_MS = 280;
export const SCROLL_CHROME_EASING = 'ease';
export const SCROLL_DIRECTION_THRESHOLD = 6;
export const SCROLL_TOP_REVEAL = 64;

export type ScrollDirection = 'up' | 'down' | 'none';

export function readScrollDirection(currentY: number, lastY: number): ScrollDirection {
  const delta = currentY - lastY;
  if (Math.abs(delta) < SCROLL_DIRECTION_THRESHOLD) return 'none';
  return delta > 0 ? 'down' : 'up';
}

export function applyScrollDirectionBodyClass(direction: ScrollDirection) {
  document.body.classList.toggle('is-scrolling-down', direction === 'down');
  document.body.classList.toggle('is-scrolling-up', direction === 'up');
}

export function shouldHideSiteHeader(currentY: number, direction: ScrollDirection, hubStuck: boolean): boolean {
  if (currentY <= SCROLL_TOP_REVEAL) return false;
  if (direction === 'up') return false;
  if (direction === 'down') return true;
  if (hubStuck) return document.body.classList.contains('is-scrolling-down');
  return false;
}
