/**
 * Lock background scroll without a visible jump on unlock.
 *
 * Avoid overflow:hidden on <html> (Chrome resets scrollY to 0 when that
 * toggles) and restore scroll in the same turn as releasing position:fixed.
 */

let locked = false;
let lockedScrollY = 0;

const BODY_CLASS = 'body-scroll-locked';

export function lockBodyScroll() {
  if (typeof window === 'undefined' || locked) return;
  lockedScrollY = window.scrollY;
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.classList.add(BODY_CLASS);
  locked = true;
}

export function unlockBodyScroll() {
  if (typeof window === 'undefined' || !locked) return;
  const y = lockedScrollY;
  locked = false;
  document.body.classList.remove(BODY_CLASS);
  document.body.style.top = '';
  window.scrollTo(y, 0);
}
