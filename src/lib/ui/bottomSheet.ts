const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function trapFocus(panel: HTMLElement, onEscape?: () => void): () => void {
  const focusable = () =>
    Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.closest('[hidden]') && el.offsetParent !== null,
    );

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onEscape?.();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  panel.addEventListener('keydown', onKeyDown);
  return () => panel.removeEventListener('keydown', onKeyDown);
}

export function lockBodyScroll(lock: boolean, className = 'mobile-sheet-open'): void {
  document.body.classList.toggle(className, lock);
}

export function sheetDurationMs(): number {
  if (typeof window === 'undefined') return 320;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
  if (window.matchMedia('(max-width: 767px)').matches) return 480;
  return 320;
}

export function openSheet(
  root: HTMLElement,
  panel: HTMLElement,
  options?: { onOpen?: () => void; focusSelector?: string },
): () => void {
  root.hidden = false;
  root.setAttribute('aria-hidden', 'false');
  lockBodyScroll(true);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.add('is-open');
      options?.onOpen?.();
      const focusEl = options?.focusSelector
        ? panel.querySelector<HTMLElement>(options.focusSelector)
        : panel.querySelector<HTMLElement>(FOCUSABLE);
      focusEl?.focus();
    });
  });
  return trapFocus(panel, () => closeSheet(root));
}

export function closeSheet(root: HTMLElement, releaseFocus?: () => void): void {
  if (root.hidden) return;
  root.classList.remove('is-open');
  releaseFocus?.();
  window.setTimeout(() => {
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    lockBodyScroll(false);
  }, sheetDurationMs());
}
