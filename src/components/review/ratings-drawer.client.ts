import { closeAnimatedDrawer } from '../../lib/drawer/animate';
import { lockBackgroundScroll, unlockBackgroundScroll } from '../../lib/ui/scrollLock';
import { bindScrollFade } from '../../lib/ui/scrollFade';

function trapFocus(panel: HTMLElement) {
  const focusable = panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (document.querySelector('.image-lightbox.is-visible')) return;
      closeDrawer();
      return;
    }
    if (e.key !== 'Tab' || focusable.length === 0) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus({ preventScroll: true });
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus({ preventScroll: true });
    }
  };

  panel.addEventListener('keydown', onKeyDown);
  return () => panel.removeEventListener('keydown', onKeyDown);
}

function focusWithoutScroll(el: HTMLElement | null | undefined) {
  el?.focus({ preventScroll: true });
}

let releaseFocus: (() => void) | null = null;
let lastTrigger: HTMLElement | null = null;
let releaseScrollFade: (() => void) | null = null;
let backgroundScrollLocked = false;

/**
 * Background freeze. Delegated to the shared lock so the drawer, the video
 * review lightbox and the media lightbox all behave identically: the page keeps
 * its exact scroll position on open and on close, with no restore step that
 * could be seen.
 */
function lockDrawerBackground() {
  if (backgroundScrollLocked) return;
  backgroundScrollLocked = true;
  lockBackgroundScroll();
  document.documentElement.classList.add('ratings-drawer-open');
  document.body.classList.add('ratings-drawer-open');
}

function unlockDrawerBackground() {
  if (!backgroundScrollLocked) return;
  backgroundScrollLocked = false;
  document.documentElement.classList.remove('ratings-drawer-open');
  document.body.classList.remove('ratings-drawer-open');
  unlockBackgroundScroll();
}

function mountDrawerOnBody(root: HTMLElement) {
  if (root.parentElement !== document.body) {
    document.body.appendChild(root);
  }
  if (root.dataset.drawerRootBound === 'true') return;
  root.dataset.drawerRootBound = 'true';
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
}

function getDrawerPanels() {
  const mount = document.querySelector<HTMLElement>('[data-ratings-drawer-mount]');
  return mount
    ? Array.from(mount.querySelectorAll<HTMLElement>('[data-ratings-drawer-panel]'))
    : Array.from(document.querySelectorAll<HTMLElement>('[data-ratings-drawer-panel]'));
}

function getOrCreatePanel(id: string): HTMLElement | null {
  const mount = document.querySelector<HTMLElement>('[data-ratings-drawer-mount]');
  if (!mount) {
    return document.querySelector<HTMLElement>(`[data-ratings-drawer-panel="${id}"]`);
  }

  const existing = mount.querySelector<HTMLElement>(`[data-ratings-drawer-panel="${id}"]`);
  if (existing) return existing;

  const template = document.querySelector<HTMLTemplateElement>(
    `template[data-ratings-drawer-template="${id}"]`,
  );
  if (!template) return null;

  mount.appendChild(template.content.cloneNode(true));
  return mount.querySelector<HTMLElement>(`[data-ratings-drawer-panel="${id}"]`);
}

function bindGalleryExpand(panel: HTMLElement) {
  const gallery = panel.querySelector<HTMLElement>('[data-rdv-gallery]');
  const moreBtn = panel.querySelector<HTMLButtonElement>('[data-rdv-gallery-more]');
  if (!gallery || !moreBtn || moreBtn.dataset.bound === 'true') return;
  moreBtn.dataset.bound = 'true';
  moreBtn.addEventListener('click', () => {
    gallery.dataset.galleryCollapsed = 'false';
    moreBtn.hidden = true;
  });
}

function bindDrawerScrollFade(panel: HTMLElement) {
  releaseScrollFade?.();
  releaseScrollFade = null;

  const body = panel.querySelector<HTMLElement>('.ratings-drawer-panel__body');
  if (!body) return;

  releaseScrollFade = bindScrollFade(body, panel);
}

function closeDrawer() {
  const root = document.querySelector<HTMLElement>('[data-ratings-drawer-root]');
  const backdrop = document.querySelector<HTMLElement>('[data-ratings-drawer-backdrop]');
  const panels = getDrawerPanels();

  closeAnimatedDrawer({
    root,
    backdrop,
    panels,
    instantClass: 'ratings-drawer-panel--instant',
    onComplete: () => {
      unlockDrawerBackground();
      releaseFocus?.();
      releaseFocus = null;
      releaseScrollFade?.();
      releaseScrollFade = null;
      lastTrigger?.focus({ preventScroll: true });
      lastTrigger = null;
    },
  });
}

function openDrawer(id: string, trigger?: HTMLElement) {
  const root = document.querySelector<HTMLElement>('[data-ratings-drawer-root]');
  const backdrop = document.querySelector<HTMLElement>('[data-ratings-drawer-backdrop]');
  const panel = getOrCreatePanel(id);
  if (!root || !backdrop || !panel) return;

  const isDrawerNav =
    trigger?.dataset.ratingsDrawerNav === 'next' ||
    trigger?.dataset.ratingsDrawerNav === 'back';

  bindGalleryExpand(panel);

  getDrawerPanels().forEach((p) => {
    if (p !== panel) {
      p.hidden = true;
      p.dataset.open = 'false';
      p.classList.remove('ratings-drawer-panel--instant');
    }
  });

  if (!isDrawerNav) {
    lastTrigger = trigger ?? null;
  }
  mountDrawerOnBody(root);
  lockDrawerBackground();
  root.hidden = false;
  delete root.dataset.drawerClosing;
  backdrop.dataset.open = 'true';
  panel.hidden = false;

  if (isDrawerNav) {
    panel.classList.add('ratings-drawer-panel--instant');
    panel.dataset.open = 'true';
    panel.querySelector<HTMLElement>('.ratings-drawer-panel__body')?.scrollTo({ top: 0 });
  } else {
    panel.classList.remove('ratings-drawer-panel--instant');
    panel.dataset.open = 'false';
    requestAnimationFrame(() => {
      panel.dataset.open = 'true';
    });
  }

  releaseFocus?.();
  releaseFocus = trapFocus(panel);
  bindDrawerScrollFade(panel);
  focusWithoutScroll(panel.querySelector<HTMLElement>('[data-ratings-close-drawer]'));
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

(window as Window & {
  ratingsCloseDrawer?: () => void;
  ratingsOpenDrawer?: (id: string, trigger?: HTMLElement) => void;
}).ratingsOpenDrawer = openDrawer;

export {};
