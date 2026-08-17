/** Match right-side drawer slide transition (see drawer panel CSS). */
export const DRAWER_TRANSITION_MS = 520;

/** Wait slightly longer than the CSS transition before unmounting. */
export const DRAWER_UNMOUNT_MS = DRAWER_TRANSITION_MS + 24;

function unmountDelayMs(): number {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 0;
  }
  return DRAWER_UNMOUNT_MS;
}

export type AnimatedDrawerCloseOptions = {
  root?: HTMLElement | null;
  backdrop?: HTMLElement | null;
  panels: Iterable<HTMLElement>;
  instantClass?: string;
  onComplete: () => void;
};

/**
 * Play slide-out + backdrop fade, then run cleanup (hide panels / unmount root).
 * No-op when the drawer is already closed.
 */
export function closeAnimatedDrawer(options: AnimatedDrawerCloseOptions): void {
  const { root, backdrop, panels, instantClass, onComplete } = options;

  if (root?.dataset.drawerClosing === 'true') return;

  const panelList = [...panels];
  const openPanels = panelList.filter((panel) => !panel.hidden && panel.dataset.open === 'true');
  const backdropOpen = backdrop?.dataset.open === 'true';

  if (openPanels.length === 0 && !backdropOpen) {
    if (root && !root.hidden) root.hidden = true;
    onComplete();
    return;
  }

  if (root) root.dataset.drawerClosing = 'true';

  if (backdrop) backdrop.dataset.open = 'false';

  for (const panel of openPanels) {
    if (instantClass) panel.classList.remove(instantClass);
    panel.dataset.open = 'false';
  }

  window.setTimeout(() => {
    for (const panel of panelList) {
      panel.hidden = true;
      panel.dataset.open = 'false';
      if (instantClass) panel.classList.remove(instantClass);
    }
    if (root) {
      root.hidden = true;
      delete root.dataset.drawerClosing;
    }
    onComplete();
  }, unmountDelayMs());
}
