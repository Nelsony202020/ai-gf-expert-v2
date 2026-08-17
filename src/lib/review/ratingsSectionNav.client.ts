import { parseReviewRatingsHash, subscoreSlugFromLabel } from './ratingsDeepLink';

export type ToggleAccordionFn = (toggle: HTMLElement, force?: boolean) => void;

export async function navigateToRatingsSection(
  options: {
    categoryKey?: string;
    subscoreSlug?: string;
    scroll?: boolean;
    highlight?: boolean;
  },
  deps: {
    getScrollOffset: () => number;
    toggleAccordion: ToggleAccordionFn;
    setActiveTab: (id: string, scroll?: boolean, hashOverride?: string) => void | Promise<void>;
  },
): Promise<void> {
  const { categoryKey, subscoreSlug, scroll = true, highlight = true } = options;
  const hash = categoryKey
    ? `#ratings--${categoryKey}${subscoreSlug ? `--${subscoreSlug}` : ''}`
    : '#ratings';

  await deps.setActiveTab('ratings', false, hash);

  const ratingsRoot = document.querySelector<HTMLElement>('[data-ratings-root]');
  if (ratingsRoot && ratingsRoot.dataset.detailLevel !== 'all-in' && subscoreSlug) {
    document.dispatchEvent(new CustomEvent('detail-level-set', { detail: { level: 'all-in' } }));
  }

  if (!categoryKey) {
    if (scroll) {
      const ratingsPanel = document.querySelector<HTMLElement>('[data-tab-panel="ratings"]');
      const anchor = ratingsRoot ?? ratingsPanel;
      if (anchor) {
        const y = anchor.getBoundingClientRect().top + window.scrollY - deps.getScrollOffset();
        window.scrollTo({ top: y > 0 ? y : 0, behavior: 'smooth' });
      }
    }
    return;
  }

  const categoryEl = document.querySelector<HTMLElement>(`[data-category="${categoryKey}"]`);
  const toggle = categoryEl?.querySelector<HTMLElement>('[data-accordion-toggle]');
  if (toggle) deps.toggleAccordion(toggle, true);

  let highlightEl: HTMLElement | null = categoryEl;

  if (subscoreSlug && categoryEl) {
    const cards = Array.from(categoryEl.querySelectorAll<HTMLElement>('[data-subscore-select]'));
    const match = cards.find((card) => {
      const label = card.querySelector('[data-subscore-label]')?.textContent?.trim();
      return label ? subscoreSlugFromLabel(label) === subscoreSlug : false;
    });
    const index = match?.dataset.subscoreIndex ?? '0';
    (categoryEl as HTMLElement & { selectSubscore?: (i: string, scrollTo?: boolean) => void }).selectSubscore?.(
      index,
      scroll,
    );
    highlightEl = match ?? categoryEl;
  }

  if (scroll && highlightEl) {
    if (highlight) highlightEl.classList.add('results-highlight');
    const y = highlightEl.getBoundingClientRect().top + window.scrollY - deps.getScrollOffset() - 12;
    window.scrollTo({ top: y > 0 ? y : 0, behavior: 'smooth' });
    if (highlight) {
      setTimeout(() => highlightEl?.classList.remove('results-highlight'), 2400);
    }
  }
}

export function applyReviewRatingsHashFromLocation(
  deps: {
    getScrollOffset: () => number;
    toggleAccordion: ToggleAccordionFn;
    setActiveTab: (id: string, scroll?: boolean, hashOverride?: string) => void | Promise<void>;
    isTabHash: (hash: string) => boolean;
  },
): boolean {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return false;

  const deep = parseReviewRatingsHash(hash);
  if (deep) {
    void navigateToRatingsSection(
      {
        categoryKey: deep.categoryKey,
        subscoreSlug: deep.subscoreSlug,
        scroll: true,
      },
      deps,
    );
    return true;
  }

  if (deps.isTabHash(hash)) {
    void deps.setActiveTab(hash, false);
    return true;
  }

  return false;
}
