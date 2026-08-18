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

export function ensureScrollFade(host: HTMLElement, edge: 'top' | 'bottom' = 'bottom'): HTMLElement {
  const sel = edge === 'top' ? `.${FADE_CLASS}--top` : `.${FADE_CLASS}:not(.${FADE_CLASS}--top)`;
  let fade = host.querySelector<HTMLElement>(sel);
  if (!fade) {
    fade = document.createElement('div');
    fade.className = edge === 'top' ? `${FADE_CLASS} ${FADE_CLASS}--top` : FADE_CLASS;
    fade.setAttribute('aria-hidden', 'true');
    host.appendChild(fade);
  }
  return fade;
}

export function updateScrollFade(scroller: HTMLElement, host?: HTMLElement): void {
  const fadeHost = host ?? scroller.closest<HTMLElement>('.ui-scroll-fade-host') ?? scroller.parentElement;
  if (!fadeHost) return;
  fadeHost.classList.add('ui-scroll-fade-host');
  ensureScrollFade(fadeHost, 'bottom');
  ensureScrollFade(fadeHost, 'top');
  fadeHost.dataset.scrollMore = hasMoreBelow(scroller) ? 'true' : 'false';
  fadeHost.dataset.scrollMoreAbove = scroller.scrollTop > 8 && isScrollable(scroller) ? 'true' : 'false';
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

const drawerBound = new WeakSet<HTMLElement>();

/** Bottom/top fades on More, On this page, and any other sheet that can scroll. */
export function bindDrawerScrollFades(root: ParentNode = document): void {
  const scrollers = [
    ...root.querySelectorAll<HTMLElement>('.mobile-sheet__body'),
    ...root.querySelectorAll<HTMLElement>('[data-sheet-scroll]'),
  ];

  for (const scroller of scrollers) {
    if (drawerBound.has(scroller)) continue;
    drawerBound.add(scroller);

    const host =
      scroller.closest<HTMLElement>('.sheet-scroll-host') ??
      scroller.parentElement;
    if (!host) continue;

    bindScrollFade(scroller, host);

    const sheet = scroller.closest<HTMLElement>('.mobile-sheet, .roundup-sheet');
    if (sheet) {
      const refresh = () => {
        requestAnimationFrame(() => updateScrollFade(scroller, host));
      };
      const attrObs = new MutationObserver(refresh);
      attrObs.observe(sheet, { attributes: true, attributeFilter: ['hidden', 'class', 'aria-hidden'] });
      const childObs = new MutationObserver(refresh);
      childObs.observe(scroller, { childList: true, subtree: true });
    }
  }
}
