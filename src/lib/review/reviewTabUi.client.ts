export function reviewPrefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const PANEL_MS = 160;

export function initReviewTabIndicator(tabbar: HTMLElement): void {
  if (tabbar.dataset.indicatorBound === 'true') return;
  tabbar.dataset.indicatorBound = 'true';

  const rail = tabbar.querySelector<HTMLElement>('[data-tabbar-rail]');
  const list = tabbar.querySelector<HTMLElement>('[data-tabbar-list]');
  if (!rail || !list) return;

  let indicator = rail.querySelector<HTMLElement>('[data-tab-indicator]');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'review-tabbar__indicator';
    indicator.dataset.tabIndicator = '';
    indicator.setAttribute('aria-hidden', 'true');
    rail.appendChild(indicator);
  }

  const reduced = reviewPrefersReducedMotion();
  if (reduced) {
    indicator.style.transition = 'none';
  }

  function syncIndicator() {
    if (!indicator) return;
    const active = tabbar.querySelector<HTMLElement>('.review-tabbar__btn[aria-current="true"]');
    if (!active) {
      indicator.style.opacity = '0';
      return;
    }
    const railRect = rail!.getBoundingClientRect();
    const btnRect = active.getBoundingClientRect();
    indicator.style.opacity = '1';
    indicator.style.width = `${btnRect.width}px`;
    indicator.style.transform = `translateX(${btnRect.left - railRect.left}px)`;
  }

  tabbar.querySelectorAll('.review-tabbar__btn').forEach((btn) => {
    const observer = new MutationObserver(syncIndicator);
    observer.observe(btn, { attributes: true, attributeFilter: ['aria-current'] });
  });

  list.addEventListener('scroll', syncIndicator, { passive: true });
  window.addEventListener('resize', syncIndicator);
  document.addEventListener('review-tabbar:sync-indicator', syncIndicator);
  syncIndicator();
}

export function swapReviewTabPanel(
  panels: HTMLElement[],
  nextId: string,
  instant = false,
): Promise<HTMLElement | null> {
  const next = panels.find((p) => p.dataset.tabPanel === nextId) ?? null;
  if (!next) return Promise.resolve(null);

  const current = panels.find((p) => !p.classList.contains('hidden')) ?? null;
  if (current?.dataset.tabPanel === nextId) {
    return Promise.resolve(next);
  }

  const reduced = instant || reviewPrefersReducedMotion();
  if (reduced || !current) {
    panels.forEach((p) => {
      p.classList.remove('review-tab-panel--leave', 'review-tab-panel--enter');
      p.classList.toggle('hidden', p !== next);
    });
    return Promise.resolve(next);
  }

  return new Promise((resolve) => {
    current.classList.add('review-tab-panel--leave');
    window.setTimeout(() => {
      current.classList.add('hidden');
      current.classList.remove('review-tab-panel--leave');
      next.classList.remove('hidden');
      next.classList.add('review-tab-panel--enter');
      requestAnimationFrame(() => {
        next.classList.remove('review-tab-panel--enter');
        resolve(next);
      });
    }, PANEL_MS);
  });
}
