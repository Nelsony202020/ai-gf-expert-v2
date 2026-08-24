/**
 * Runs `fn` once the browser is idle, instead of during the initial script
 * evaluation pass.
 *
 * This codebase has no client:load/client:visible/client:idle directives —
 * there are no hydrated component islands, every behavior is a plain Astro
 * <script> that calls its own initX() at module top level. This is the
 * client:idle equivalent for that pattern: below-the-fold or closed-until-
 * interaction UI (hidden tab panels, closed sheets, on-demand tooltips) can
 * bind its listeners after idle instead of racing the LCP image for the
 * main thread. Falls back to a 1-tick setTimeout on Safari, which has no
 * requestIdleCallback.
 */
export function deferUntilIdle(fn: () => void, timeout = 2000): void {
  const ric = (window as Window & { requestIdleCallback?: typeof requestIdleCallback })
    .requestIdleCallback;
  if (typeof ric === 'function') {
    ric(() => fn(), { timeout });
  } else {
    setTimeout(fn, 1);
  }
}
