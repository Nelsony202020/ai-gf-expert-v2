export function isMobileMultiValue(): boolean {
  return window.matchMedia('(max-width: 767px)').matches;
}

export function initMultiValuePopovers(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-multi-value-root]').forEach((wrap) => {
    const uid = wrap.dataset.multiValueRoot;
    if (!uid || wrap.dataset.mvInit === '1') return;
    wrap.dataset.mvInit = '1';

    const trigger = wrap.querySelector<HTMLButtonElement>(`[data-multi-value-trigger="${uid}"]`);
    const popover = wrap.querySelector<HTMLElement>(`[data-multi-value-popover="${uid}"]`);
    const backdrop = wrap.querySelector<HTMLElement>(`[data-multi-value-backdrop="${uid}"]`);
    const closeBtn = wrap.querySelector<HTMLButtonElement>(`[data-multi-value-close="${uid}"]`);
    if (!trigger || !popover) return;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const show = () => {
      if (hideTimer) clearTimeout(hideTimer);
      popover.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      if (isMobileMultiValue()) {
        backdrop?.removeAttribute('hidden');
        document.body.classList.add('multi-value-open');
      }
    };

    const hide = () => {
      if (isMobileMultiValue()) {
        popover.hidden = true;
        backdrop?.setAttribute('hidden', '');
        trigger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('multi-value-open');
        return;
      }
      hideTimer = setTimeout(() => {
        popover.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      }, 120);
    };

    trigger.addEventListener('mouseenter', () => {
      if (!isMobileMultiValue()) show();
    });
    trigger.addEventListener('mouseleave', () => {
      if (!isMobileMultiValue()) hide();
    });
    trigger.addEventListener('focus', () => {
      if (!isMobileMultiValue()) show();
    });
    trigger.addEventListener('blur', () => {
      if (!isMobileMultiValue()) hide();
    });
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (popover.hidden) show();
      else hide();
    });

    popover.addEventListener('mouseenter', () => {
      if (!isMobileMultiValue()) show();
    });
    popover.addEventListener('mouseleave', () => {
      if (!isMobileMultiValue()) hide();
    });

    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hide();
    });

    backdrop?.addEventListener('click', hide);
  });
}
