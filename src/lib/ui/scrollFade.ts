const FADE_CLASS = 'ui-scroll-fade';

function isScrollable(scroller: HTMLElement): boolean {
  const style = getComputedStyle(scroller);
  const overflowY = style.overflowY;
  const allowsScroll =
    overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  if (!allowsScroll && scroller.scrollHeight <= scroller.clientHeight + 1) return false;
  return scroller.scrollHeight > scroller.clientHeight + 1;
}

function hasMoreBelow(scroller: HTMLElement): boolean {
  if (!isScrollable(scroller)) return false;
  const remaining = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
  return remaining > 8;
}

export function ensureScrollFade(host: HTMLElement): HTMLElement {
  let fade = host.querySelector<HTMLElement>(`.${FADE_CLASS}`);
  if (!fade) {
    fade = document.createElement('div');
    fade.className = FADE_CLASS;
    fade.setAttribute('aria-hidden', 'true');
    host.appendChild(fade);
  }
  return fade;
}

export function updateScrollFade(scroller: HTMLElement, host?: HTMLElement): void {
  const fadeHost = host ?? scroller.closest<HTMLElement>('.ui-scroll-fade-host') ?? scroller.parentElement;
  if (!fadeHost) return;
  fadeHost.classList.add('ui-scroll-fade-host');
  ensureScrollFade(fadeHost);
  fadeHost.dataset.scrollMore = hasMoreBelow(scroller) ? 'true' : 'false';
}

/** Bind bottom fade for a scrollable region; only shows when content overflows and isn't scrolled to end. */
export function bindScrollFade(scroller: HTMLElement, host?: HTMLElement): () => void {
  const fadeHost = host ?? scroller.parentElement ?? scroller;
  fadeHost.classList.add('ui-scroll-fade-host');
  ensureScrollFade(fadeHost);

  const refresh = () => updateScrollFade(scroller, fadeHost);
  scroller.addEventListener('scroll', refresh, { passive: true });
  const resizeObserver = new ResizeObserver(refresh);
  resizeObserver.observe(scroller);

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', refresh, { passive: true });
  }

  requestAnimationFrame(refresh);

  return () => {
    scroller.removeEventListener('scroll', refresh);
    resizeObserver.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', refresh);
    }
    fadeHost.dataset.scrollMore = 'false';
  };
}

/** Find the primary scroll container inside a ratings tooltip panel. */
export function tooltipScrollTarget(panel: HTMLElement): HTMLElement | null {
  return panel.querySelector<HTMLElement>('.ratings-tooltip-panel__body');
}
