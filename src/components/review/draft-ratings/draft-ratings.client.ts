function getRoot() {
  return document.querySelector<HTMLElement>('[data-draft-ratings-root]');
}

function setDetailLevel(root: HTMLElement, level: string) {
  root.dataset.draftDetailLevel = level;
  const input = root.querySelector<HTMLInputElement>(`[data-draft-detail-input="${level}"]`);
  if (input) input.checked = true;
}

function showCategoryPanel(root: HTMLElement, slug: string) {
  root.dataset.draftActiveCategory = slug;

  root.querySelectorAll<HTMLElement>('[data-draft-category-panel]').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.draftCategoryPanel !== slug);
  });

  root.querySelectorAll<HTMLElement>('[data-draft-nav-category]').forEach((btn) => {
    const active = btn.dataset.draftNavCategory === slug;
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
    btn.classList.toggle('draft-category-icon-nav__btn--active', active);
  });
}

function getCategoryBlock(root: HTMLElement, categorySlug: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `[data-draft-category-panel="${categorySlug}"] [data-draft-category="${categorySlug}"]`,
  );
}

function setSelectedSubscore(categoryBlock: HTMLElement, subscoreSlug: string) {
  categoryBlock.dataset.draftSelectedSubscore = subscoreSlug;

  categoryBlock.querySelectorAll<HTMLElement>('[data-draft-subscore-tab]').forEach((tab) => {
    const active = tab.dataset.draftSubscoreTab === subscoreSlug;
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    tab.tabIndex = active ? 0 : -1;
    tab.classList.toggle('draft-area-tabs__btn--active', active);
  });

  categoryBlock.querySelectorAll<HTMLElement>('[data-draft-subscore-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.draftSubscorePanel !== subscoreSlug;
  });

  categoryBlock.querySelectorAll<HTMLElement>('[data-draft-evidence-subscore]').forEach((section) => {
    section.hidden = section.dataset.draftEvidenceSubscore !== subscoreSlug;
  });
}

function bindSubscoreSelector(root: HTMLElement) {
  root.addEventListener('click', (e) => {
    const tab = (e.target as HTMLElement).closest<HTMLElement>('[data-draft-subscore-tab]');
    if (!tab) return;

    const subscoreSlug = tab.dataset.draftSubscoreTab;
    const categorySlug = tab.dataset.draftSubscoreCategory;
    if (!subscoreSlug || !categorySlug) return;

    const categoryBlock = getCategoryBlock(root, categorySlug);
    if (!categoryBlock) return;

    setSelectedSubscore(categoryBlock, subscoreSlug);
  });

  root.addEventListener('keydown', (e) => {
    const tab = (e.target as HTMLElement).closest<HTMLElement>('[data-draft-subscore-tab]');
    if (!tab || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;

    const categorySlug = tab.dataset.draftSubscoreCategory;
    if (!categorySlug) return;

    const categoryBlock = getCategoryBlock(root, categorySlug);
    if (!categoryBlock) return;

    const tabs = [...categoryBlock.querySelectorAll<HTMLElement>('[data-draft-subscore-tab]')];
    const index = tabs.indexOf(tab);
    if (index === -1) return;

    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    const nextSlug = next.dataset.draftSubscoreTab;
    if (!nextSlug) return;

    setSelectedSubscore(categoryBlock, nextSlug);
    next.focus();
  });
}

function initSubscoreState(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-draft-category]').forEach((categoryBlock) => {
    const stored = categoryBlock.dataset.draftSelectedSubscore;
    const firstTab = categoryBlock.querySelector<HTMLElement>('[data-draft-subscore-tab]');
    const slug = stored || firstTab?.dataset.draftSubscoreTab;
    if (slug) setSelectedSubscore(categoryBlock, slug);
  });
}

function bindCategoryIconNav(root: HTMLElement) {
  const navBtns = root.querySelectorAll<HTMLElement>('[data-draft-nav-category]');
  navBtns.forEach((btn) => {
    const slug = btn.dataset.draftNavCategory;
    if (!slug) return;

    btn.addEventListener('click', () => showCategoryPanel(root, slug));

    const mq = window.matchMedia('(min-width: 1024px) and (hover: hover)');
    const onEnter = () => {
      if (mq.matches) showCategoryPanel(root, slug);
    };
    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('focus', () => showCategoryPanel(root, slug));
  });

  const initial = root.dataset.draftActiveCategory || navBtns[0]?.dataset.draftNavCategory;
  if (initial) showCategoryPanel(root, initial);
}

function bindDetailLevel(root: HTMLElement) {
  if (root.dataset.detailClientBound === 'true') return;
  root.dataset.detailClientBound = 'true';

  root.addEventListener('draft-detail-change', ((e: CustomEvent<{ level: string }>) => {
    root.dataset.draftDetailLevel = e.detail.level;
  }) as EventListener);

  const closeDrawer = (window as Window & { draftRatingsCloseDrawer?: () => void }).draftRatingsCloseDrawer;
  root.addEventListener('draft-detail-change', () => {
    closeDrawer?.();
  });
}

function initDraftRatingsClient() {
  const root = getRoot();
  if (!root || root.dataset.clientBound === 'true') return;
  root.dataset.clientBound = 'true';

  bindCategoryIconNav(root);
  bindSubscoreSelector(root);
  bindDetailLevel(root);
  initSubscoreState(root);

  if (!root.dataset.draftDetailLevel) {
    setDetailLevel(root, 'summary');
  }
}

initDraftRatingsClient();
document.addEventListener('astro:page-load', initDraftRatingsClient);

export {};
