function trapFocus(panel: HTMLElement) {
  const focusable = panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDrawer();
      return;
    }
    if (e.key !== 'Tab' || focusable.length === 0) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  panel.addEventListener('keydown', onKeyDown);
  return () => panel.removeEventListener('keydown', onKeyDown);
}

let releaseFocus: (() => void) | null = null;
let lastTrigger: HTMLElement | null = null;

function closeDrawer() {
  document.querySelectorAll<HTMLElement>('[data-ratings-drawer-panel]').forEach((panel) => {
    panel.dataset.open = 'false';
    panel.hidden = true;
  });
  const root = document.querySelector<HTMLElement>('[data-ratings-drawer-root]');
  const backdrop = document.querySelector<HTMLElement>('[data-ratings-drawer-backdrop]');
  if (backdrop) backdrop.dataset.open = 'false';
  if (root) root.hidden = true;
  document.body.style.overflow = '';
  releaseFocus?.();
  releaseFocus = null;
  lastTrigger?.focus();
  lastTrigger = null;
}

function openDrawer(id: string, trigger?: HTMLElement) {
  const root = document.querySelector<HTMLElement>('[data-ratings-drawer-root]');
  const backdrop = document.querySelector<HTMLElement>('[data-ratings-drawer-backdrop]');
  const panel = document.querySelector<HTMLElement>(`[data-ratings-drawer-panel="${id}"]`);
  if (!root || !backdrop || !panel) return;

  const isDrawerNav =
    trigger?.dataset.ratingsDrawerNav === 'next' ||
    trigger?.dataset.ratingsDrawerNav === 'back';

  document.querySelectorAll<HTMLElement>('[data-ratings-drawer-panel]').forEach((p) => {
    if (p !== panel) {
      p.hidden = true;
      p.dataset.open = 'false';
    }
  });

  if (!isDrawerNav) {
    lastTrigger = trigger ?? null;
  }
  root.hidden = false;
  backdrop.dataset.open = 'true';
  panel.hidden = false;
  requestAnimationFrame(() => {
    panel.dataset.open = 'true';
    if (isDrawerNav) {
      panel.querySelector<HTMLElement>('.ratings-drawer-panel__body')?.scrollTo({ top: 0 });
    }
  });
  document.body.style.overflow = 'hidden';
  releaseFocus?.();
  releaseFocus = trapFocus(panel);
  panel.querySelector<HTMLElement>('[data-ratings-close-drawer]')?.focus();
}

function bindDrawer() {
  const root = document.querySelector<HTMLElement>('[data-ratings-root]');
  if (!root || root.dataset.drawerBound === 'true') return;
  root.dataset.drawerBound = 'true';

  root.addEventListener('click', (e) => {
    const openBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-ratings-open-drawer]');
    if (openBtn) {
      const id = openBtn.dataset.ratingsOpenDrawer;
      if (id) openDrawer(id, openBtn);
      return;
    }

    const closeBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-ratings-close-drawer]');
    if (closeBtn) closeDrawer();
  });

  document.querySelector('[data-ratings-drawer-backdrop]')?.addEventListener('click', closeDrawer);
}

bindDrawer();
document.addEventListener('astro:page-load', bindDrawer);

(window as Window & { ratingsCloseDrawer?: () => void }).ratingsCloseDrawer = closeDrawer;

export {};
