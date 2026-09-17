/**
 * Shared background scroll lock for every overlay on the site (ratings evidence
 * drawer, video review lightbox, media lightbox).
 *
 * The rule is: opening or closing an overlay must not move the page by a single
 * pixel.
 *
 * Why this approach:
 *   The old drawer lock used `position: fixed` on <body> plus `top: -scrollY`,
 *   and restored the offset with `window.scrollTo()` on close. That pattern has
 *   two unavoidable jumps:
 *     1. `position: fixed` takes <body> out of flow, so `position: sticky`
 *        elements (global header, review tab bar) lose their scrollport and
 *        snap back to their static position — visible movement of background
 *        content.
 *     2. Unlocking resets the document scroll to 0 before `scrollTo()` puts it
 *        back, and because `html { scroll-behavior: smooth }` is set globally
 *        that restore could animate — the "jumps to the top, then scrolls back"
 *        symptom.
 *
 *   Setting `overflow: hidden` on the scrolling element instead keeps the
 *   document scroll offset intact in every modern browser: nothing is
 *   repositioned, nothing is restored, sticky elements keep working, so there is
 *   no jump to hide. The only side effect is the scrollbar disappearing, which
 *   we compensate for by reserving its width as padding (see global.css).
 *
 * Nested/overlapping overlays are reference-counted, so the last one to close
 * releases the lock.
 */

const LOCK_ATTR = 'overlayScrollLock';
const GUTTER_VAR = '--overlay-scrollbar-gutter';

let depth = 0;

/** Width of the classic scrollbar, or 0 with overlay scrollbars (macOS/iOS). */
function scrollbarGutter(): number {
  const width = window.innerWidth - document.documentElement.clientWidth;
  return width > 0 ? width : 0;
}

/** Freeze the page exactly where it is. Safe to call more than once. */
export function lockBackgroundScroll(): void {
  if (typeof document === 'undefined') return;
  if (depth++ > 0) return;

  const root = document.documentElement;
  root.style.setProperty(GUTTER_VAR, `${scrollbarGutter()}px`);
  root.dataset[LOCK_ATTR] = 'true';
}

/** Release the freeze. The page stays on the exact same pixels. */
export function unlockBackgroundScroll(): void {
  if (typeof document === 'undefined') return;
  if (depth === 0) return;
  if (--depth > 0) return;

  const root = document.documentElement;
  delete root.dataset[LOCK_ATTR];
  root.style.removeProperty(GUTTER_VAR);
}

/** True while any overlay holds the lock. */
export function isBackgroundScrollLocked(): boolean {
  return depth > 0;
}

/**
 * Drop every outstanding lock. Only for page transitions, where the overlays
 * that took the locks are gone and can never release them.
 */
export function resetBackgroundScrollLock(): void {
  depth = 0;
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  delete root.dataset[LOCK_ATTR];
  root.style.removeProperty(GUTTER_VAR);
}
