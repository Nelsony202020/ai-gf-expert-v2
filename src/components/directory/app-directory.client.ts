import { APPS_PER_PAGE, appsPageUrl, parseAppsPage, parseAppsSort, totalPages } from '../../lib/app-directory';
import {
  DEFAULT_RANKING_PRIORITIES,
  DIRECTORY_PRIORITY_OPTIONS_BY_VALUE,
  DIRECTORY_SCORE_META_BY_VALUE,
  DIRECTORY_SORT_LABELS,
  getVisibleScoreKeys,
} from '../../lib/directory/meta';
import {
  loadDirectoryPreferences,
  saveDirectoryPreferences,
  type DirectoryView,
} from '../../lib/directory/preferences';

const LIKED_KEY = 'home-liked-apps';
const PRIORITY_WEIGHTS = [0.5, 0.3, 0.2];
const VIEW_SWITCH_MS = 180;
const CUSTOMIZE_ANIM_MS = 340;

function track(event: string, detail: Record<string, unknown> = {}) {
  document.dispatchEvent(new CustomEvent('agfx:directory', { detail: { event, ...detail } }));
}

function getSortScore(card: HTMLElement, sortKey: string) {
  if (sortKey === 'price-asc') {
    return Number(card.dataset.price ?? 0);
  }
  if (sortKey === 'popular') {
    return Number(card.dataset.reviewCount ?? 0);
  }
  return Number(card.dataset.overallScore ?? 0);
}

function getWeightedScore(card: HTMLElement, priorities: string[], weights = PRIORITY_WEIGHTS) {
  try {
    const scores = JSON.parse(card.dataset.categoryScores ?? '{}') as Record<string, number>;
    return priorities.reduce((sum, key, index) => {
      if (key === 'overall') return sum + Number(card.dataset.overallScore ?? 0) * (weights[index] ?? 0);
      return sum + (scores[key] ?? Number(card.dataset.overallScore ?? 0)) * (weights[index] ?? 0);
    }, 0);
  } catch {
    return Number(card.dataset.overallScore ?? 0);
  }
}

function loadSet(key: string) {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(key) ?? '[]'));
  } catch {
    return new Set<string>();
  }
}

function persistSet(key: string, values: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...values]));
  } catch {}
}

export function initAppDirectory() {
  const section = document.querySelector<HTMLElement>('[data-app-directory]');
  const root = section?.querySelector<HTMLElement>('[data-home-explorer]');
  if (!section || !root || root.dataset.bound === 'true') return;
  root.dataset.bound = 'true';

  const basePath = section.dataset.basePath ?? '/ai-girlfriend-apps';
  const perPage = Number(section.dataset.perPage ?? APPS_PER_PAGE);

  const grid = root.querySelector<HTMLElement>('[data-home-grid]');
  const sortInput = section.querySelector<HTMLInputElement>('[data-home-sort]');
  const sortOpen = section.querySelector<HTMLButtonElement>('[data-home-sort-open]');
  const sortMenu = section.querySelector<HTMLElement>('[data-home-sort-menu]');
  const sortLabel = section.querySelector<HTMLElement>('[data-home-sort-label]');
  const sortOptions = [...section.querySelectorAll<HTMLButtonElement>('[data-home-sort-option]')];
  const resultCountEl = section.querySelector<HTMLElement>('[data-home-result-count]');
  const items = [...root.querySelectorAll('[data-home-app]')] as HTMLElement[];
  const prioritySlots = [...root.querySelectorAll('[data-home-priority-slot]')] as HTMLElement[];
  const priorityInputs = [...root.querySelectorAll('[data-home-priority]')] as HTMLInputElement[];
  const prioritiesReset = root.querySelector('[data-home-priorities-reset]');
  const customizeStatus = root.querySelector<HTMLElement>('[data-home-customize-status]');
  const customizeToggle = section.querySelector<HTMLButtonElement>('[data-home-customize-toggle]');
  const customizePanel = section.querySelector<HTMLElement>('[data-home-customize-panel]');
  const loadMoreBtn = root.querySelector<HTMLButtonElement>('[data-home-load-more]');
  const paginationNav = root.querySelector<HTMLElement>('[data-home-pagination]');
  const pageLinks = [...root.querySelectorAll('[data-home-page-link]')] as HTMLAnchorElement[];
  const pagePrev = root.querySelector<HTMLAnchorElement>('[data-home-page-prev]');
  const pageNext = root.querySelector<HTMLAnchorElement>('[data-home-page-next]');
  const viewButtons = [...section.querySelectorAll('[data-home-view]')] as HTMLButtonElement[];
  const prefsNotice = section.querySelector<HTMLElement>('[data-home-prefs-notice]');
  const prefsResetBtn = section.querySelector<HTMLButtonElement>('[data-home-prefs-reset]');
  const likeButtons = [...section.querySelectorAll('[data-home-like]')] as HTMLButtonElement[];
  const liked = loadSet(LIKED_KEY);

  let prefs = loadDirectoryPreferences();
  let loadedPages = parseAppsPage(window.location.search);
  let personalized = false;
  let currentView: DirectoryView = prefs.view;

  function currentPriorities() {
    return priorityInputs.map((input) => input.value);
  }

  function isDefaultPriorities() {
    return currentPriorities().every((value, index) => value === DEFAULT_RANKING_PRIORITIES[index]);
  }

  function persistState(extra: Partial<Parameters<typeof saveDirectoryPreferences>[0]> = {}) {
    prefs = saveDirectoryPreferences({
      view: currentView,
      filters: [],
      payments: [],
      minRating: 'rating-any',
      priceMin: null,
      priceMax: null,
      priceBucket: null,
      bestAt: null,
      sort: sortInput?.value ?? 'overall',
      priorities: personalized ? currentPriorities() : null,
      saved: prefs.saved,
      ...extra,
    });
  }

  function updatePrioritySlotIcons() {
    prioritySlots.forEach((slot) => {
      const input = slot.querySelector<HTMLInputElement>('[data-home-priority]');
      const iconWrap = slot.querySelector<HTMLElement>('[data-home-priority-icon]');
      if (!input || !iconWrap) return;
      const meta = DIRECTORY_PRIORITY_OPTIONS_BY_VALUE[input.value];
      if (!meta) return;
      iconWrap.style.background = `${meta.color}20`;
      iconWrap.style.color = meta.color;
      const iconEl = iconWrap.querySelector('.material-symbols-outlined');
      if (iconEl) iconEl.textContent = meta.icon;
    });
  }

  function setPriorities(values: string[]) {
    prioritySlots.forEach((slot, index) => {
      const hidden = slot.querySelector<HTMLInputElement>('[data-home-priority]');
      const value = values[index] ?? DEFAULT_RANKING_PRIORITIES[index] ?? 'chat';
      if (hidden) hidden.value = value;
      const triggerLabel = slot.querySelector('.home-priority-picker__trigger-label');
      const meta = DIRECTORY_PRIORITY_OPTIONS_BY_VALUE[value];
      if (triggerLabel && meta) triggerLabel.textContent = meta.label;
      slot.querySelectorAll('[data-priority-option]').forEach((opt) => {
        opt.setAttribute('aria-selected', (opt as HTMLElement).dataset.priorityOption === value ? 'true' : 'false');
      });
    });
    updatePrioritySlotIcons();
  }

  function setPersonalized(active: boolean) {
    personalized = active;
    if (customizeStatus) customizeStatus.hidden = !active;
  }

  function closeAllPriorityMenus() {
    root!.querySelectorAll('[data-priority-menu]').forEach((menu) => {
      (menu as HTMLElement).hidden = true;
      const trigger = menu.closest('[data-home-priority-picker]')?.querySelector('[data-priority-trigger]');
      trigger?.setAttribute('aria-expanded', 'false');
    });
  }

  function initPriorityPickers() {
    root!.querySelectorAll('[data-home-priority-picker]').forEach((picker) => {
      const trigger = picker.querySelector<HTMLButtonElement>('[data-priority-trigger]');
      const menu = picker.querySelector<HTMLElement>('[data-priority-menu]');
      const hidden = picker.querySelector<HTMLInputElement>('[data-home-priority]');
      const triggerLabel = picker.querySelector('.home-priority-picker__trigger-label');
      if (!trigger || !menu || !hidden) return;

      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        closeAllPriorityMenus();
        if (!isOpen) {
          menu.hidden = false;
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      picker.querySelectorAll('[data-priority-option]').forEach((option) => {
        option.addEventListener('click', () => {
          const value = (option as HTMLElement).dataset.priorityOption ?? '';
          hidden.value = value;
          if (triggerLabel) triggerLabel.textContent = (option as HTMLElement).dataset.priorityLabel ?? '';
          picker.querySelectorAll('[data-priority-option]').forEach((opt) => {
            opt.setAttribute('aria-selected', opt === option ? 'true' : 'false');
          });
          menu.hidden = true;
          trigger.setAttribute('aria-expanded', 'false');
          updatePrioritySlotIcons();
          setPersonalized(!isDefaultPriorities());
          track('ranking_customized', { priorities: currentPriorities() });
          applySortAndPagination();
        });
      });
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('[data-home-priority-picker]')) return;
      closeAllPriorityMenus();
    });
  }

  function resetPriorities() {
    setPriorities([...DEFAULT_RANKING_PRIORITIES]);
    setPersonalized(false);
    applySortAndPagination();
  }

  function setCustomizeOpen(open: boolean) {
    if (!customizePanel || !customizeToggle) return;
    if (open) {
      customizePanel.hidden = false;
      requestAnimationFrame(() => customizePanel.classList.add('is-open'));
      customizeToggle.setAttribute('aria-expanded', 'true');
    } else {
      customizePanel.classList.remove('is-open');
      customizeToggle.setAttribute('aria-expanded', 'false');
      window.setTimeout(() => {
        if (!customizePanel.classList.contains('is-open')) customizePanel.hidden = true;
      }, CUSTOMIZE_ANIM_MS);
    }
  }

  function updateResultCount(totalCount: number) {
    if (!resultCountEl) return;
    resultCountEl.textContent = personalized
      ? `${totalCount} ${totalCount === 1 ? 'app' : 'apps'} ranked for your priorities`
      : `${totalCount} tested apps`;
  }

  function updateVisibleScores() {
    const keys = personalized ? getVisibleScoreKeys(currentPriorities()) : getVisibleScoreKeys(null);
    items.forEach((item) => {
      let scores: Record<string, number> = {};
      try {
        scores = JSON.parse(item.dataset.categoryScores ?? '{}');
      } catch {}
      const fallback = Number(item.dataset.overallScore ?? 0);

      const cardSlots = [...item.querySelectorAll<HTMLElement>('.home-app-card [data-metric-slot]')];
      cardSlots.forEach((slot, index) => {
        const key = keys[index];
        if (!key) return;
        const meta = DIRECTORY_SCORE_META_BY_VALUE[key];
        const iconEl = slot.querySelector<HTMLElement>('[data-metric-icon]');
        const labelEl = slot.querySelector('[data-metric-label]');
        const valueEl = slot.querySelector('[data-metric-value]');
        if (iconEl && meta) {
          iconEl.textContent = meta.icon;
          iconEl.style.color = meta.color;
        }
        if (labelEl && meta) labelEl.textContent = meta.label;
        if (valueEl) valueEl.textContent = (scores[key] ?? fallback).toFixed(1);
      });
    });
  }

  function updatePaginationUi(totalCount: number) {
    const pages = totalPages(totalCount, perPage);
    if (loadedPages > pages) loadedPages = pages;

    pageLinks.forEach((link) => {
      const page = Number(link.dataset.homePageLink);
      link.hidden = page > pages;
      link.setAttribute('aria-current', page === loadedPages ? 'page' : 'false');
      link.href = appsPageUrl(page, basePath);
    });

    if (pagePrev) {
      pagePrev.hidden = loadedPages <= 1;
      pagePrev.href = appsPageUrl(Math.max(1, loadedPages - 1), basePath);
    }
    if (pageNext) {
      pageNext.hidden = loadedPages >= pages;
      pageNext.href = appsPageUrl(Math.min(pages, loadedPages + 1), basePath);
    }
    if (loadMoreBtn) loadMoreBtn.hidden = loadedPages >= pages;
  }

  function pushPageUrl(page: number, replace = false) {
    if (basePath === '/') return;
    const url = appsPageUrl(page, basePath);
    const state = { page };
    if (replace) window.history.replaceState(state, '', url);
    else window.history.pushState(state, '', url);
  }

  function applySortAndPagination() {
    const sorted = [...items];

    sorted.sort((a, b) => {
      if (personalized) {
        return getWeightedScore(b, currentPriorities()) - getWeightedScore(a, currentPriorities());
      }
      const sortKey = sortInput?.value ?? 'overall';
      const aScore = getSortScore(a, sortKey);
      const bScore = getSortScore(b, sortKey);
      if (sortKey === 'price-asc') return aScore - bScore;
      return bScore - aScore;
    });

    sorted.forEach((card) => grid?.appendChild(card));

    const visibleLimit = loadedPages * perPage;
    sorted.forEach((card, index) => {
      card.hidden = index >= visibleLimit;
    });

    updatePaginationUi(sorted.length);
    updateResultCount(sorted.length);
    updateVisibleScores();
    persistState();
  }

  function setView(view: DirectoryView, persist = true) {
    const domView = grid?.dataset.view;
    if (view === currentView && domView === view) return;

    const apply = () => {
      currentView = view;
      if (grid) grid.dataset.view = view;
      viewButtons.forEach((btn) => {
        btn.setAttribute('aria-pressed', btn.dataset.homeView === view ? 'true' : 'false');
      });
      if (persist) {
        persistState();
        track('view_switched', { view });
      }
    };

    // Initial restore: apply immediately so list/cards don't flash.
    if (!persist) {
      apply();
      return;
    }

    grid?.classList.add('is-switching');
    window.setTimeout(() => {
      apply();
      requestAnimationFrame(() => grid?.classList.remove('is-switching'));
    }, VIEW_SWITCH_MS);
  }

  function setSortValue(value: string, persist = true) {
    if (!sortInput) return;
    if (!DIRECTORY_SORT_LABELS[value]) return;
    sortInput.value = value;
    if (sortLabel) sortLabel.textContent = DIRECTORY_SORT_LABELS[value] ?? value;
    sortOptions.forEach((btn) => {
      const active = btn.dataset.homeSortOption === value;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (persist) persistState();
  }

  function closeSortMenu() {
    if (!sortMenu || !sortOpen) return;
    sortMenu.hidden = true;
    sortOpen.setAttribute('aria-expanded', 'false');
  }

  function restorePreferences() {
    setView(prefs.view, false);

    if (prefs.sort && DIRECTORY_SORT_LABELS[prefs.sort]) {
      setSortValue(prefs.sort, false);
    }

    if (prefs.priorities && prefs.priorities.length > 0) {
      const values = prefs.priorities.filter((value) => DIRECTORY_PRIORITY_OPTIONS_BY_VALUE[value]);
      if (values.length > 0) {
        setPriorities(values);
        setPersonalized(!isDefaultPriorities());
        if (personalized) setCustomizeOpen(true);
      }
    }

    if (prefs.homepage && prefsNotice) {
      prefsNotice.hidden = false;
    }
  }

  sortOpen?.addEventListener('click', () => {
    if (!sortMenu || !sortOpen) return;
    const open = sortMenu.hidden;
    sortMenu.hidden = !open;
    sortOpen.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  sortOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.homeSortOption ?? 'overall';
      setSortValue(value);
      setPersonalized(false);
      setPriorities([...DEFAULT_RANKING_PRIORITIES]);
      track('sort_changed', { sort: value, label: DIRECTORY_SORT_LABELS[value] });
      closeSortMenu();
      applySortAndPagination();
    });
  });

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('[data-dir-sort]')) return;
    closeSortMenu();
  });

  initPriorityPickers();

  customizeToggle?.addEventListener('click', () => {
    if (!customizePanel) return;
    setCustomizeOpen(!customizePanel.classList.contains('is-open'));
  });

  prioritiesReset?.addEventListener('click', resetPriorities);

  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.homeView === 'list' ? 'list' : 'cards';
      setView(view);
    });
  });

  grid?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const scoresToggle = target.closest('[data-card-scores-toggle]');
    if (scoresToggle instanceof HTMLButtonElement) {
      const insights = scoresToggle.closest('[data-card-scores]');
      if (insights instanceof HTMLElement) {
        const expanded = insights.classList.toggle('is-expanded');
        scoresToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        scoresToggle.setAttribute(
          'aria-label',
          expanded ? 'Show fewer category ratings' : 'Show all category ratings',
        );
      }
      return;
    }

    const visit = target.closest('[data-directory-visit]');
    if (visit instanceof HTMLElement) {
      track('external_app_visited', { app: visit.dataset.directoryVisit });
    }
  });

  prefsResetBtn?.addEventListener('click', () => {
    if (prefsNotice) prefsNotice.hidden = true;
    setPriorities([...DEFAULT_RANKING_PRIORITIES]);
    setPersonalized(false);
    persistState({ homepage: null, priorities: null });
    applySortAndPagination();
  });

  likeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.homeLike ?? '';
      if (!id) return;
      if (liked.has(id)) liked.delete(id);
      else liked.add(id);
      persistSet(LIKED_KEY, liked);
      btn.setAttribute('aria-pressed', liked.has(id) ? 'true' : 'false');
    });
  });
  likeButtons.forEach((btn) => btn.setAttribute('aria-pressed', liked.has(btn.dataset.homeLike ?? '') ? 'true' : 'false'));
  likeButtons.forEach((btn) => btn.classList.toggle('is-liked', liked.has(btn.dataset.homeLike ?? '')));

  loadMoreBtn?.addEventListener('click', () => {
    loadedPages += 1;
    pushPageUrl(loadedPages);
    applySortAndPagination();
  });

  paginationNav?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLAnchorElement)) return;
    if (target.dataset.homePageLink) {
      e.preventDefault();
      loadedPages = Number(target.dataset.homePageLink);
      pushPageUrl(loadedPages);
      applySortAndPagination();
    } else if (target === pagePrev) {
      e.preventDefault();
      loadedPages = Math.max(1, loadedPages - 1);
      pushPageUrl(loadedPages);
      applySortAndPagination();
    } else if (target === pageNext) {
      e.preventDefault();
      loadedPages += 1;
      pushPageUrl(loadedPages);
      applySortAndPagination();
    }
  });

  window.addEventListener('popstate', () => {
    loadedPages = parseAppsPage(window.location.search);
    applySortAndPagination();
  });

  const initialSort = parseAppsSort(window.location.search);
  if (initialSort && DIRECTORY_SORT_LABELS[initialSort]) {
    setSortValue(initialSort, false);
  }

  updatePrioritySlotIcons();
  restorePreferences();
  pushPageUrl(loadedPages, true);
  applySortAndPagination();
}

initAppDirectory();
document.addEventListener('astro:page-load', initAppDirectory);
