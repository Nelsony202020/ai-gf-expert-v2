import { closeAnimatedDrawer } from '../../../lib/drawer/animate';

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
  const root = document.querySelector<HTMLElement>('[data-draft-drawer-root]');
  const backdrop = document.querySelector<HTMLElement>('[data-draft-drawer-backdrop]');
  const panels = document.querySelectorAll<HTMLElement>('[data-draft-drawer-panel]');

  closeAnimatedDrawer({
    root,
    backdrop,
    panels,
    onComplete: () => {
      document.body.style.overflow = '';
      releaseFocus?.();
      releaseFocus = null;
      lastTrigger?.focus();
      lastTrigger = null;
    },
  });
}

function openDrawer(groupId: string, trigger?: HTMLElement) {
  const root = document.querySelector<HTMLElement>('[data-draft-drawer-root]');
  const backdrop = document.querySelector<HTMLElement>('[data-draft-drawer-backdrop]');
  const panel = document.querySelector<HTMLElement>(`[data-draft-drawer-panel="${groupId}"]`);
  if (!root || !backdrop || !panel) return;

  document.querySelectorAll<HTMLElement>('[data-draft-drawer-panel]').forEach((p) => {
    p.hidden = p !== panel;
    p.dataset.open = 'false';
  });

  lastTrigger = trigger ?? null;
  root.hidden = false;
  delete root.dataset.drawerClosing;
  backdrop.dataset.open = 'true';
  panel.hidden = false;
  requestAnimationFrame(() => {
    panel.dataset.open = 'true';
  });
  document.body.style.overflow = 'hidden';
  releaseFocus?.();
  releaseFocus = trapFocus(panel);
  panel.querySelector<HTMLElement>('[data-draft-close-drawer]')?.focus();
}

function bindDrawer() {
  const root = document.querySelector<HTMLElement>('[data-draft-ratings-root]');
  if (!root || root.dataset.drawerBound === 'true') return;
  root.dataset.drawerBound = 'true';

  root.addEventListener('click', (e) => {
    const openBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-draft-open-drawer]');
    if (openBtn) {
      const id = openBtn.dataset.draftOpenDrawer;
      if (id) openDrawer(id, openBtn);
      return;
    }
    const closeBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-draft-close-drawer]');
    if (closeBtn) closeDrawer();
  });

  document.querySelector('[data-draft-drawer-backdrop]')?.addEventListener('click', closeDrawer);
}

bindDrawer();
document.addEventListener('astro:page-load', bindDrawer);

(window as Window & { draftRatingsCloseDrawer?: () => void }).draftRatingsCloseDrawer = closeDrawer;
(window as Window & { draftRatingsOpenDrawer?: (id: string, trigger?: HTMLElement) => void }).draftRatingsOpenDrawer =
  openDrawer;

export {};
