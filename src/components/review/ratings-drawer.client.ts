import { closeAnimatedDrawer } from '../../lib/drawer/animate';

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
let releaseScrollFade: (() => void) | null = null;

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

function updateScrollFade(panel: HTMLElement) {
  const body = panel.querySelector<HTMLElement>('.ratings-drawer-panel__body');
  if (!body) {
    panel.dataset.scrollMore = 'false';
    return;
  }
  const remaining = body.scrollHeight - body.scrollTop - body.clientHeight;
  panel.dataset.scrollMore = remaining > 8 ? 'true' : 'false';
}

function bindScrollFade(panel: HTMLElement) {
  releaseScrollFade?.();
  releaseScrollFade = null;

  const body = panel.querySelector<HTMLElement>('.ratings-drawer-panel__body');
  if (!body) return;

  const onScroll = () => updateScrollFade(panel);
  body.addEventListener('scroll', onScroll, { passive: true });
  requestAnimationFrame(() => updateScrollFade(panel));

  releaseScrollFade = () => {
    body.removeEventListener('scroll', onScroll);
    panel.dataset.scrollMore = 'false';
  };
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
      document.body.style.overflow = '';
      releaseFocus?.();
      releaseFocus = null;
      releaseScrollFade?.();
      releaseScrollFade = null;
      lastTrigger?.focus();
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

  document.body.style.overflow = 'hidden';
  releaseFocus?.();
  releaseFocus = trapFocus(panel);
  bindScrollFade(panel);
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

(window as Window & {
  ratingsCloseDrawer?: () => void;
  ratingsOpenDrawer?: (id: string, trigger?: HTMLElement) => void;
}).ratingsOpenDrawer = openDrawer;

export {};
