/**
 * One scroll freeze for every overlay on the site — the ratings evidence
 * drawer, the video lightbox, the image lightbox, the media gate.
 *
 * Contract: opening an overlay must not move the page by a single pixel, and
 * closing it must leave the reader on the exact same pixels.
 *
 * Why this is not the usual `position: fixed` on <body>:
 *
 *   1. `position: fixed` collapses the document scroll to 0, so every
 *      `position: sticky` element loses its sticky context while an overlay is
 *      open — on a review page that drops the tab bar out of the viewport.
 *   2. It forces a `window.scrollTo()` on close to put the reader back, and
 *      that restore is the visible jump we are trying to remove. If the scroll
 *      offset was captured while a smooth scroll was still in flight, the
 *      restore lands somewhere the reader never was.
 *
 * `overflow: hidden` on <html> freezes the page without touching the scroll
 * offset, so there is simply nothing to restore and nothing to get wrong.
 *
 * iOS Safari ignores `overflow: hidden` for touch scrolling, so there the
 * fixed-body technique is still required. On that path the offset is restored
 * synchronously in the same frame the styles are cleared, so the browser never
 * paints the page at the wrong offset.
 *
 * Locks are reference counted: opening the image lightbox from inside the
 * evidence drawer must not unfreeze the page when only the lightbox closes.
 */

type LockState = {
  depth: number;
  scrollY: number;
  usedFixedBody: boolean;
  prev: {
    htmlOverflow: string;
    htmlOverscroll: string;
    bodyPaddingRight: string;
    bodyPosition: string;
    bodyTop: string;
    bodyLeft: string;
    bodyRight: string;
    bodyWidth: string;
  };
};

const STATE_KEY = '__aigeScrollLock';

function getState(): LockState {
  const w = window as Window & { [STATE_KEY]?: LockState };
  if (!w[STATE_KEY]) {
    w[STATE_KEY] = {
      depth: 0,
      scrollY: 0,
      usedFixedBody: false,
      prev: {
        htmlOverflow: '',
        htmlOverscroll: '',
        bodyPaddingRight: '',
        bodyPosition: '',
        bodyTop: '',
        bodyLeft: '',
        bodyRight: '',
        bodyWidth: '',
      },
    };
  }
  return w[STATE_KEY] as LockState;
}

/** iOS (including iPadOS, which reports as a Mac but has touch). */
function needsFixedBody(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iP(hone|ad|od)/.test(ua);
  const iPadOS = /Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document;
  return iOS || iPadOS;
}

/**
 * Freeze the page. Safe to call while already locked — the page stays frozen
 * until the matching number of unlockScroll() calls have run.
 */
export function lockScroll(): void {
  if (typeof document === 'undefined') return;
  const state = getState();
  if (state.depth++ > 0) return;

  const html = document.documentElement;
  const body = document.body;

  state.scrollY = window.scrollY || html.scrollTop || 0;
  state.prev.htmlOverflow = html.style.overflow;
  state.prev.htmlOverscroll = html.style.overscrollBehavior;
  state.prev.bodyPaddingRight = body.style.paddingRight;
  state.prev.bodyPosition = body.style.position;
  state.prev.bodyTop = body.style.top;
  state.prev.bodyLeft = body.style.left;
  state.prev.bodyRight = body.style.right;
  state.prev.bodyWidth = body.style.width;

  // Hiding the scrollbar narrows the viewport and reflows the whole page.
  // Pad by exactly the scrollbar width so nothing shifts sideways.
  const scrollbarWidth = window.innerWidth - html.clientWidth;
  if (scrollbarWidth > 0) {
    const current = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${current + scrollbarWidth}px`;
  }

  html.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';

  state.usedFixedBody = needsFixedBody();
  if (state.usedFixedBody) {
    body.style.position = 'fixed';
    body.style.top = `-${state.scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
  }
}

/** Release one lock. The page unfreezes when the last one is released. */
export function unlockScroll(): void {
  if (typeof document === 'undefined') return;
  const state = getState();
  if (state.depth === 0) return;
  if (--state.depth > 0) return;

  const html = document.documentElement;
  const body = document.body;

  html.style.overflow = state.prev.htmlOverflow;
  html.style.overscrollBehavior = state.prev.htmlOverscroll;
  body.style.paddingRight = state.prev.bodyPaddingRight;

  if (state.usedFixedBody) {
    body.style.position = state.prev.bodyPosition;
    body.style.top = state.prev.bodyTop;
    body.style.left = state.prev.bodyLeft;
    body.style.right = state.prev.bodyRight;
    body.style.width = state.prev.bodyWidth;
    // Synchronous, same frame as the style reset, so the wrong offset is
    // never painted. 'auto' because a smooth restore is itself a visible jump.
    window.scrollTo(0, state.scrollY);
  }

  state.usedFixedBody = false;
}

/** True while any overlay holds the page frozen. */
export function isScrollLocked(): boolean {
  return getState().depth > 0;
}
