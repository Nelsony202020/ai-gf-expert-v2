import { APPS_PER_PAGE, appsPageUrl, parseAppsPage, parseAppsSort, totalPages } from '../../lib/app-directory';
import {
  DEFAULT_RANKING_PRIORITIES,
  DIRECTORY_FILTER_LABELS,
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
const RATING_THRESHOLDS: Record<string, number> = {
  'rating-any': 0,
  'rating-8': 8,
  'rating-85': 8.5,
  'rating-9': 9,
};
const BUDGET_PRESETS: Record<string, { min: number; max: number }> = {
  'budget-free': { min: 0, max: 0 },
  'budget-under-15': { min: 0, max: 14.99 },
  'budget-15-25': { min: 15, max: 25 },
  'budget-over-25': { min: 25, max: Infinity },
};

function track(event: string, detail: Record<string, unknown> = {}) {
  document.dispatchEvent(new CustomEvent('agfx:directory', { detail: { event, ...detail } }));
}

function getSortScore(card: HTMLElement, sortKey: string) {
  if (sortKey === 'price-asc' || sortKey === 'price-desc') {
    return Number(card.dataset.price ?? 0);
  }
  if (sortKey === 'popular') {
    return Number(card.dataset.reviewCount ?? 0);
  }
  if (sortKey === 'overall' || sortKey === 'rating' || sortKey === 'newest') {
    return Number(card.dataset.overallScore ?? 0);
  }
  try {
    const scores = JSON.parse(card.dataset.categoryScores ?? '{}') as Record<string, number>;
    if (sortKey === 'voice') return scores['chat-features'] ?? 0;
    if (sortKey === 'free' || sortKey === 'value') return scores.pricing ?? 0;
    return scores[sortKey] ?? Number(card.dataset.overallScore ?? 0);
  } catch {
    return Number(card.dataset.overallScore ?? 0);
  }
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

function cardMatchesPayment(cardPayments: string[], filterId: string) {
  if (filterId === 'pay-card') return cardPayments.includes('pay-card');
  if (filterId === 'pay-paypal') return cardPayments.includes('pay-paypal');
  if (filterId === 'pay-crypto') {
    return cardPayments.some((p) => p === 'pay-crypto' || p === 'pay-crypto-only');
  }
  if (filterId === 'pay-discreet') return cardPayments.includes('pay-discreet');
  return cardPayments.includes(filterId);
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initAppDirectory() {
  const section = document.querySelector<HTMLElement>('[data-app-directory]');
  const root = section?.querySelector<HTMLElement>('[data-home-explorer]');
  if (!section || !root || root.dataset.bound === 'true') return;
  root.dataset.bound = 'true';

  const basePath = section.dataset.basePath ?? '/ai-girlfriend-apps';
  const perPage = Number(section.dataset.perPage ?? APPS_PER_PAGE);
  const maxPriceDefault = Number(section.dataset.maxPrice ?? 30);

  const grid = root.querySelector<HTMLElement>('[data-home-grid]');
  const sortSelect = section.querySelector<HTMLSelectElement>('[data-home-sort]');
  const resultCountEl = section.querySelector<HTMLElement>('[data-home-result-count]');
  const filterCountEl = section.querySelector<HTMLElement>('[data-home-filter-count]');
  const sheetCountEls = [...root.querySelectorAll('[data-home-sheet-count], [data-home-sheet-count-mobile]')] as HTMLElement[];
  const emptyEl = root.querySelector<HTMLElement>('[data-home-empty]');
  const activeFiltersEl = root.querySelector<HTMLElement>('[data-home-active-filters]');
  const clearButtons = [
    ...section.querySelectorAll('[data-home-clear-filters], [data-home-clear-filters-sheet], [data-home-clear-filters-empty]'),
  ] as HTMLButtonElement[];
  const applyButtons = [
    ...root.querySelectorAll('[data-home-apply-filters], [data-home-apply-filters-mobile]'),
  ] as HTMLButtonElement[];
  const filterInputs = [...root.querySelectorAll('[data-home-filter]')] as HTMLInputElement[];
  const paymentInputs = [...root.querySelectorAll('[data-home-payment-filter]')] as HTMLInputElement[];
  const items = [...root.querySelectorAll('[data-home-app]')] as HTMLElement[];
  const priceMinInput = root.querySelector<HTMLInputElement>('[data-home-price-min]');
  const priceMaxInput = root.querySelector<HTMLInputElement>('[data-home-price-max]');
  const priceMinRange = root.querySelector<HTMLInputElement>('[data-home-price-min-range]');
  const priceMaxRange = root.querySelector<HTMLInputElement>('[data-home-price-max-range]');
  const priceFill = root.querySelector<HTMLElement>('[data-home-price-fill]');
  const budgetPresets = [...root.querySelectorAll('[data-home-budget-preset]')] as HTMLButtonElement[];
  const minRatingInputs = [...root.querySelectorAll('[data-home-min-rating]')] as HTMLInputElement[];
  const prioritySlots = [...root.querySelectorAll('[data-home-priority-slot]')] as HTMLElement[];
  const priorityInputs = [...root.querySelectorAll('[data-home-priority]')] as HTMLInputElement[];
  const prioritiesReset = root.querySelector('[data-home-priorities-reset]');
  const customizeStatus = root.querySelector<HTMLElement>('[data-home-customize-status]');
  const customizeToggle = section.querySelector<HTMLButtonElement>('[data-home-customize-toggle]');
  const customizePanel = section.querySelector<HTMLElement>('[data-home-customize-panel]');
  const popularMore = root.querySelector<HTMLElement>('[data-home-popular-more]');
  const popularMoreToggle = root.querySelector<HTMLButtonElement>('[data-home-popular-more-toggle]');
  const filtersPanel = root.querySelector<HTMLElement>('[data-home-filters-panel]');
  const filtersBackdrop = root.querySelector<HTMLElement>('[data-home-filters-backdrop]');
  const filtersOpen = section.querySelector<HTMLButtonElement>('[data-home-filters-open]');
  const filtersCloseButtons = [...section.querySelectorAll('[data-home-filters-close]')] as HTMLButtonElement[];
  const loadMoreBtn = root.querySelector<HTMLButtonElement>('[data-home-load-more]');
  const paginationNav = root.querySelector<HTMLElement>('[data-home-pagination]');
  const pageLinks = [...root.querySelectorAll('[data-home-page-link]')] as HTMLAnchorElement[];
  const pagePrev = root.querySelector<HTMLAnchorElement>('[data-home-page-prev]');
  const pageNext = root.querySelector<HTMLAnchorElement>('[data-home-page-next]');
  const viewButtons = [...section.querySelectorAll('[data-home-view]')] as HTMLButtonElement[];
  const savedToggle = section.querySelector<HTMLButtonElement>('[data-home-saved-toggle]');
  const savedCountEl = section.querySelector<HTMLElement>('[data-home-saved-count]');
  const saveButtons = [...section.querySelectorAll('[data-home-save]')] as HTMLButtonElement[];
  const prefsNotice = section.querySelector<HTMLElement>('[data-home-prefs-notice]');
  const prefsResetBtn = section.querySelector<HTMLButtonElement>('[data-home-prefs-reset]');

  const likeButtons = [...section.querySelectorAll('[data-home-like]')] as HTMLButtonElement[];
  const liked = loadSet(LIKED_KEY);

  let prefs = loadDirectoryPreferences();
  const saved = new Set<string>(prefs.saved);
  let loadedPages = parseAppsPage(window.location.search);
  let personalized = false;
  let savedOnly = false;
  let currentView: DirectoryView = prefs.view;
  let lastFocusedBeforeDrawer: HTMLElement | null = null;

  /* ------------------------------------------------------------------ */
  /* Selection helpers                                                    */
  /* ------------------------------------------------------------------ */

  function selectedMinRating() {
    const checked = minRatingInputs.find((input) => input.checked);
    return RATING_THRESHOLDS[checked?.value ?? 'rating-any'] ?? 0;
  }

  function selectedMinRatingId() {
    return minRatingInputs.find((input) => input.checked)?.value ?? 'rating-any';
  }

  function selectedPriceMin() {
    return Number(priceMinInput?.value ?? priceMinRange?.value ?? 0);
  }

  function selectedPriceMax() {
    return Number(priceMaxInput?.value ?? priceMaxRange?.value ?? maxPriceDefault);
  }

  function syncPriceInputs(min: number, max: number, source?: EventTarget | null) {
    let clampedMin = Math.max(0, Math.min(min, maxPriceDefault));
    let clampedMax = Math.min(maxPriceDefault, Math.max(max, 0));

    if (clampedMin > clampedMax) {
      if (source === priceMinRange || source === priceMinInput) clampedMax = clampedMin;
      else clampedMin = clampedMax;
    }

    if (priceMinInput) priceMinInput.value = String(clampedMin);
    if (priceMaxInput) priceMaxInput.value = String(clampedMax);
    if (priceMinRange) priceMinRange.value = String(clampedMin);
    if (priceMaxRange) priceMaxRange.value = String(clampedMax);

    if (priceFill && maxPriceDefault > 0) {
      const left = (clampedMin / maxPriceDefault) * 100;
      const right = (clampedMax / maxPriceDefault) * 100;
      priceFill.style.left = `${left}%`;
      priceFill.style.width = `${Math.max(right - left, 0)}%`;
    }
  }

  function activeFilters() {
    return [...new Set(filterInputs.filter((input) => input.checked).map((input) => input.value))];
  }

  function activePayments() {
    return [...new Set(paymentInputs.filter((input) => input.checked).map((input) => input.value))];
  }

  function activeFilterCount() {
    let count = activeFilters().length + activePayments().length;
    if (selectedPriceMin() > 0 || selectedPriceMax() < maxPriceDefault) count += 1;
    if (selectedMinRating() > 0) count += 1;
    return count;
  }

  function currentPriorities() {
    return priorityInputs.map((input) => input.value);
  }

  function isDefaultPriorities() {
    return currentPriorities().every((value, index) => value === DEFAULT_RANKING_PRIORITIES[index]);
  }

  /* ------------------------------------------------------------------ */
  /* Persistence                                                          */
  /* ------------------------------------------------------------------ */

  function persistState(extra: Partial<Parameters<typeof saveDirectoryPreferences>[0]> = {}) {
    prefs = saveDirectoryPreferences({
      view: currentView,
      filters: activeFilters(),
      payments: activePayments(),
      minRating: selectedMinRatingId(),
      priceMin: selectedPriceMin() > 0 ? selectedPriceMin() : null,
      priceMax: selectedPriceMax() < maxPriceDefault ? selectedPriceMax() : null,
      sort: sortSelect?.value ?? 'overall',
      priorities: personalized ? currentPriorities() : null,
      saved: [...saved],
      ...extra,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Priorities / personalized ranking                                    */
  /* ------------------------------------------------------------------ */

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
          applyFiltersAndSort();
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
    applyFiltersAndSort();
  }

  /* ------------------------------------------------------------------ */
  /* Matching                                                             */
  /* ------------------------------------------------------------------ */

  function cardMatches(card: HTMLElement) {
    if (savedOnly && !saved.has(card.dataset.homeApp ?? '')) return false;

    const filters = activeFilters();
    const payments = activePayments();
    const cardFilters = (card.dataset.filters ?? '').split(',').filter(Boolean);
    const cardPayments = (card.dataset.payments ?? '').split(',').filter(Boolean);
    const price = Number(card.dataset.price ?? 0);
    const score = Number(card.dataset.overallScore ?? 0);

    const matchesFilters = filters.length === 0 || filters.every((f) => cardFilters.includes(f));
    const matchesPayments = payments.length === 0 || payments.every((p) => cardMatchesPayment(cardPayments, p));
    const matchesRating = score >= selectedMinRating();
    const matchesPrice = price >= selectedPriceMin() && price <= selectedPriceMax();
    return matchesFilters && matchesPayments && matchesRating && matchesPrice;
  }

  function countMatchingCards() {
    return items.filter((card) => cardMatches(card));
  }

  /* ------------------------------------------------------------------ */
  /* Rendering helpers                                                    */
  /* ------------------------------------------------------------------ */

  function updateResultCount(matchedCount: number) {
    if (!resultCountEl) return;
    const hasFilters = activeFilterCount() > 0 || savedOnly;
    let text: string;
    if (personalized) {
      text = `${matchedCount} ${matchedCount === 1 ? 'app' : 'apps'} ranked for your priorities`;
    } else if (hasFilters) {
      text = `${matchedCount} ${matchedCount === 1 ? 'app matches' : 'apps match'} your filters`;
    } else {
      text = `${matchedCount} tested apps`;
    }
    resultCountEl.textContent = text;
  }

  function updateFilterCountBadge() {
    if (!filterCountEl) return;
    const count = activeFilterCount();
    filterCountEl.hidden = count === 0;
    filterCountEl.textContent = `· ${count}`;
  }

  function updateSavedUi() {
    if (savedCountEl) {
      savedCountEl.hidden = saved.size === 0;
      savedCountEl.textContent = `· ${saved.size}`;
    }
    saveButtons.forEach((btn) => {
      const id = btn.dataset.homeSave ?? '';
      const isSaved = saved.has(id);
      btn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
      btn.classList.toggle('is-saved', isSaved);
      const label = btn.querySelector('[data-save-label]');
      if (label) label.textContent = isSaved ? 'Saved' : 'Save';
    });
    likeButtons.forEach((btn) => {
      const id = btn.dataset.homeLike ?? '';
      btn.setAttribute('aria-pressed', liked.has(id) ? 'true' : 'false');
      btn.classList.toggle('is-liked', liked.has(id));
    });
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

  function updatePreviewCounts() {
    const matched = countMatchingCards();
    sheetCountEls.forEach((el) => {
      el.textContent = String(matched.length);
    });
  }

  function renderActiveChips(filters: string[], payments: string[]) {
    if (!activeFiltersEl) return;
    const chips: { type: string; id: string; label: string }[] = [];
    filters.forEach((id) => chips.push({ type: 'filter', id, label: DIRECTORY_FILTER_LABELS[id] ?? id }));
    payments.forEach((id) => chips.push({ type: 'payment', id, label: DIRECTORY_FILTER_LABELS[id] ?? id }));

    const minPrice = selectedPriceMin();
    const maxPrice = selectedPriceMax();
    if (minPrice > 0 || maxPrice < maxPriceDefault) {
      chips.push({ type: 'price', id: 'price-range', label: `$${minPrice}–$${maxPrice}/mo` });
    }
    const minRating = selectedMinRating();
    if (minRating > 0) {
      chips.push({ type: 'rating', id: 'min-rating', label: `${minRating}+ rating` });
    }

    const chipsHtml = chips
      .map(
        (item) =>
          `<button type="button" class="home-explorer__active-chip" data-remove-chip-type="${item.type}" data-remove-chip-id="${item.id}" aria-label="Remove filter: ${item.label}">
            <span>${item.label}</span>
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>`,
      )
      .join('');
    const clearAllHtml = chips.length > 0
      ? '<button type="button" class="home-explorer__active-clear" data-remove-chip-type="all" data-remove-chip-id="all">Clear all</button>'
      : '';
    activeFiltersEl.innerHTML = chipsHtml + clearAllHtml;
    activeFiltersEl.hidden = chips.length === 0;
  }

  function updatePaginationUi(filteredCount: number) {
    const pages = totalPages(filteredCount, perPage);
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

  function applyFiltersAndSort() {
    const filters = activeFilters();
    const payments = activePayments();
    const matched = items.filter((card) => cardMatches(card));

    matched.sort((a, b) => {
      if (personalized) {
        return getWeightedScore(b, currentPriorities()) - getWeightedScore(a, currentPriorities());
      }
      const sortKey = sortSelect?.value ?? 'overall';
      const aScore = getSortScore(a, sortKey);
      const bScore = getSortScore(b, sortKey);
      if (sortKey === 'price-asc') return aScore - bScore;
      if (sortKey === 'price-desc') return bScore - aScore;
      return bScore - aScore;
    });

    matched.forEach((card) => grid?.insertBefore(card, emptyEl));

    const visibleLimit = loadedPages * perPage;
    matched.forEach((card, index) => {
      card.hidden = index >= visibleLimit;
    });
    items.filter((card) => !cardMatches(card)).forEach((card) => {
      card.hidden = true;
      card.dataset.filtered = 'false';
    });
    matched.forEach((card) => {
      card.dataset.filtered = 'true';
    });

    sheetCountEls.forEach((el) => {
      el.textContent = String(matched.length);
    });
    if (emptyEl) emptyEl.hidden = matched.length > 0;
    if (matched.length === 0) track('no_results', { filters, payments });

    updatePaginationUi(matched.length);
    renderActiveChips(filters, payments);
    updateResultCount(matched.length);
    updateFilterCountBadge();
    updateVisibleScores();
    persistState();
  }

  /* ------------------------------------------------------------------ */
  /* Clearing                                                             */
  /* ------------------------------------------------------------------ */

  function clearChip(type: string, id: string) {
    if (type === 'all') {
      clearAllFilters();
      return;
    }
    if (type === 'filter') {
      filterInputs.filter((input) => input.value === id).forEach((input) => {
        input.checked = false;
      });
    } else if (type === 'payment') {
      paymentInputs.filter((input) => input.value === id).forEach((input) => {
        input.checked = false;
      });
    } else if (type === 'price') {
      syncPriceInputs(0, maxPriceDefault);
      budgetPresets.forEach((btn) => btn.classList.remove('is-active'));
    } else if (type === 'rating') {
      minRatingInputs.forEach((input, index) => {
        input.checked = index === 0;
      });
    }
    loadedPages = 1;
    pushPageUrl(1, true);
    track('filter_cleared', { type, id });
    applyFiltersAndSort();
    updatePreviewCounts();
  }

  function clearAllFilters() {
    filterInputs.forEach((input) => {
      input.checked = false;
    });
    paymentInputs.forEach((input) => {
      input.checked = false;
    });
    syncPriceInputs(0, maxPriceDefault);
    budgetPresets.forEach((btn) => btn.classList.remove('is-active'));
    minRatingInputs.forEach((input, index) => {
      input.checked = index === 0;
    });
    loadedPages = 1;
    pushPageUrl(1, true);
    track('filter_cleared', { type: 'all' });
    applyFiltersAndSort();
    updatePreviewCounts();
  }

  /* ------------------------------------------------------------------ */
  /* Filter drawer (a11y: focus trap + return focus)                      */
  /* ------------------------------------------------------------------ */

  function drawerKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeFiltersSheet();
      return;
    }
    if (event.key !== 'Tab' || !filtersPanel) return;
    const focusables = [...filtersPanel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
      (el) => el.offsetParent !== null,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openFiltersSheet() {
    lastFocusedBeforeDrawer = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    filtersPanel?.classList.add('is-open');
    if (filtersBackdrop) filtersBackdrop.hidden = false;
    document.body.classList.add('home-filters-open');
    document.addEventListener('keydown', drawerKeydown);
    updatePreviewCounts();
    const closeBtn = filtersPanel?.querySelector<HTMLElement>('[data-home-filters-close]');
    closeBtn?.focus();
    track('filter_drawer_opened');
  }

  function closeFiltersSheet() {
    filtersPanel?.classList.remove('is-open');
    if (filtersBackdrop) filtersBackdrop.hidden = true;
    document.body.classList.remove('home-filters-open');
    document.removeEventListener('keydown', drawerKeydown);
    (lastFocusedBeforeDrawer ?? filtersOpen)?.focus();
    lastFocusedBeforeDrawer = null;
  }

  /* ------------------------------------------------------------------ */
  /* View switching                                                       */
  /* ------------------------------------------------------------------ */

  function setView(view: DirectoryView, persist = true) {
    currentView = view;
    if (grid) grid.dataset.view = view;
    viewButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.homeView === view ? 'true' : 'false');
    });
    if (persist) {
      persistState();
      track('view_switched', { view });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Restore stored preferences                                           */
  /* ------------------------------------------------------------------ */

  function restorePreferences() {
    // View
    setView(prefs.view, false);

    // Filters
    filterInputs.forEach((input) => {
      input.checked = prefs.filters.includes(input.value);
    });
    paymentInputs.forEach((input) => {
      input.checked = prefs.payments.includes(input.value);
    });
    minRatingInputs.forEach((input) => {
      input.checked = input.value === prefs.minRating;
    });
    if (!minRatingInputs.some((input) => input.checked) && minRatingInputs[0]) {
      minRatingInputs[0].checked = true;
    }
    syncPriceInputs(prefs.priceMin ?? 0, prefs.priceMax ?? maxPriceDefault);

    // Sort
    if (sortSelect && [...sortSelect.options].some((opt) => opt.value === prefs.sort)) {
      sortSelect.value = prefs.sort;
    }

    // Ranking priorities
    if (prefs.priorities && prefs.priorities.length > 0) {
      const values = prefs.priorities.filter((value) => DIRECTORY_PRIORITY_OPTIONS_BY_VALUE[value]);
      if (values.length > 0) {
        setPriorities(values);
        setPersonalized(!isDefaultPriorities());
        if (personalized && customizePanel && customizeToggle) {
          customizePanel.hidden = false;
          customizeToggle.setAttribute('aria-expanded', 'true');
        }
      }
    }

    // Homepage quick-finder handoff
    if (prefs.homepage && prefsNotice) {
      prefsNotice.hidden = false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Event wiring                                                         */
  /* ------------------------------------------------------------------ */

  function onFilterInputChange() {
    updatePreviewCounts();
  }

  filterInputs.forEach((input) => input.addEventListener('change', () => {
    filterInputs
      .filter((other) => other !== input && other.value === input.value)
      .forEach((other) => {
        other.checked = input.checked;
      });
    onFilterInputChange();
  }));
  paymentInputs.forEach((input) => input.addEventListener('change', onFilterInputChange));
  minRatingInputs.forEach((input) => input.addEventListener('change', onFilterInputChange));

  sortSelect?.addEventListener('change', () => {
    setPersonalized(false);
    setPriorities([...DEFAULT_RANKING_PRIORITIES]);
    track('sort_changed', { sort: sortSelect.value, label: DIRECTORY_SORT_LABELS[sortSelect.value] });
    applyFiltersAndSort();
  });

  initPriorityPickers();

  customizeToggle?.addEventListener('click', () => {
    if (!customizePanel) return;
    const willOpen = customizePanel.hidden === true;
    customizePanel.hidden = !willOpen;
    customizeToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  });

  const onPriceInput = (source?: EventTarget | null) => {
    const min = Number(priceMinRange?.value ?? priceMinInput?.value ?? 0);
    const max = Number(priceMaxRange?.value ?? priceMaxInput?.value ?? maxPriceDefault);
    syncPriceInputs(min, max, source ?? document.activeElement);
    budgetPresets.forEach((btn) => btn.classList.remove('is-active'));
    onFilterInputChange();
  };

  priceMinRange?.addEventListener('input', (event) => onPriceInput(event.target));
  priceMaxRange?.addEventListener('input', (event) => onPriceInput(event.target));
  priceMinInput?.addEventListener('change', () => {
    syncPriceInputs(Number(priceMinInput.value), selectedPriceMax(), priceMinInput);
    onPriceInput(priceMinInput);
  });
  priceMaxInput?.addEventListener('change', () => {
    syncPriceInputs(selectedPriceMin(), Number(priceMaxInput.value), priceMaxInput);
    onPriceInput(priceMaxInput);
  });

  budgetPresets.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = BUDGET_PRESETS[btn.dataset.homeBudgetPreset ?? ''];
      if (!preset) return;
      budgetPresets.forEach((other) => other.classList.toggle('is-active', other === btn));
      const max = preset.max === Infinity ? maxPriceDefault : Math.ceil(preset.max);
      syncPriceInputs(Math.floor(preset.min), max);
      onFilterInputChange();
    });
  });

  popularMoreToggle?.addEventListener('click', () => {
    if (!popularMore || !popularMoreToggle) return;
    const isHidden = popularMore.hidden;
    popularMore.hidden = !isHidden;
    popularMoreToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    popularMoreToggle.textContent = isHidden ? 'Show fewer filters' : '+ Show more filters';
  });

  applyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      loadedPages = 1;
      pushPageUrl(1, true);
      track('filters_applied', { filters: activeFilters(), payments: activePayments() });
      applyFiltersAndSort();
      closeFiltersSheet();
    });
  });

  prioritiesReset?.addEventListener('click', resetPriorities);

  activeFiltersEl?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const chip = target.closest('[data-remove-chip-type]');
    if (!(chip instanceof HTMLElement)) return;
    clearChip(chip.dataset.removeChipType ?? '', chip.dataset.removeChipId ?? '');
  });

  clearButtons.forEach((btn) => btn.addEventListener('click', clearAllFilters));
  root.querySelectorAll('[data-home-reset-filters]').forEach((btn) => {
    btn.addEventListener('click', clearAllFilters);
  });

  root.querySelectorAll('[data-filter-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const key = (toggle as HTMLElement).dataset.filterToggle;
      const body = root.querySelector(`[data-filter-body="${key}"]`);
      const group = toggle.closest('.home-filter-group, .home-filter-subgroup');
      if (!body) return;
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      const willExpand = !expanded;
      toggle.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
      (body as HTMLElement).hidden = !willExpand;
      if (group instanceof HTMLElement) group.classList.toggle('is-open', willExpand);
    });
  });

  // View switcher
  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.homeView === 'list' ? 'list' : 'cards';
      if (view !== currentView) setView(view);
    });
  });

  // Saves
  saveButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.homeSave ?? '';
      if (!id) return;
      if (saved.has(id)) saved.delete(id);
      else saved.add(id);
      updateSavedUi();
      persistState();
      track('product_saved', { app: id, saved: saved.has(id) });
      if (savedOnly) applyFiltersAndSort();
    });
  });

  savedToggle?.addEventListener('click', () => {
    savedOnly = !savedOnly;
    savedToggle.setAttribute('aria-pressed', savedOnly ? 'true' : 'false');
    savedToggle.classList.toggle('is-active', savedOnly);
    loadedPages = 1;
    applyFiltersAndSort();
  });

  // Row expansion + external visits (delegated)
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

  // Homepage-preferences notice reset
  prefsResetBtn?.addEventListener('click', () => {
    if (prefsNotice) prefsNotice.hidden = true;
    setPriorities([...DEFAULT_RANKING_PRIORITIES]);
    setPersonalized(false);
    filterInputs.forEach((input) => {
      input.checked = false;
    });
    paymentInputs.forEach((input) => {
      input.checked = false;
    });
    syncPriceInputs(0, maxPriceDefault);
    minRatingInputs.forEach((input, index) => {
      input.checked = index === 0;
    });
    persistState({ homepage: null, priorities: null, filters: [], payments: [] });
    applyFiltersAndSort();
  });

  // Likes (unchanged behavior)
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
    applyFiltersAndSort();
  });

  paginationNav?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLAnchorElement)) return;
    if (target.dataset.homePageLink) {
      e.preventDefault();
      loadedPages = Number(target.dataset.homePageLink);
      pushPageUrl(loadedPages);
      applyFiltersAndSort();
    } else if (target === pagePrev) {
      e.preventDefault();
      loadedPages = Math.max(1, loadedPages - 1);
      pushPageUrl(loadedPages);
      applyFiltersAndSort();
    } else if (target === pageNext) {
      e.preventDefault();
      loadedPages += 1;
      pushPageUrl(loadedPages);
      applyFiltersAndSort();
    }
  });

  filtersOpen?.addEventListener('click', openFiltersSheet);
  filtersCloseButtons.forEach((btn) => btn.addEventListener('click', closeFiltersSheet));
  filtersBackdrop?.addEventListener('click', closeFiltersSheet);

  window.addEventListener('popstate', () => {
    loadedPages = parseAppsPage(window.location.search);
    applyFiltersAndSort();
  });

  /* ------------------------------------------------------------------ */
  /* Init                                                                 */
  /* ------------------------------------------------------------------ */

  const initialSort = parseAppsSort(window.location.search);
  if (initialSort && sortSelect && [...sortSelect.options].some((opt) => opt.value === initialSort)) {
    sortSelect.value = initialSort;
  }

  syncPriceInputs(0, maxPriceDefault);
  updatePrioritySlotIcons();
  restorePreferences();
  updateSavedUi();
  pushPageUrl(loadedPages, true);
  updatePreviewCounts();
  applyFiltersAndSort();
}

initAppDirectory();
document.addEventListener('astro:page-load', initAppDirectory);
