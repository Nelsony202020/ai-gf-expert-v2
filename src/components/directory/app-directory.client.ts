import { APPS_PER_PAGE, appsPageUrl, parseAppsPage, totalPages } from '../../lib/app-directory';

const SAVED_KEY = 'home-saved-apps';
const LIKED_KEY = 'home-liked-apps';
const DEFAULT_PRIORITIES = ['chat', 'images', 'pricing'];
const PRIORITY_WEIGHTS = [0.5, 0.3, 0.2];
const PRIORITY_META: Record<string, { icon: string; color: string; label: string }> = {
  chat: { icon: 'chat_bubble', color: '#db2777', label: 'Chat quality' },
  images: { icon: 'image', color: '#9333ea', label: 'Image quality' },
  pricing: { icon: 'paid', color: '#ea580c', label: 'Pricing / value' },
  customization: { icon: 'tune', color: '#db2777', label: 'Customization' },
  'chat-features': { icon: 'call', color: '#16a34a', label: 'Voice & calls' },
  video: { icon: 'videocam', color: '#7c3aed', label: 'Video quality' },
  privacy: { icon: 'shield', color: '#4f46e5', label: 'Privacy' },
  characters: { icon: 'groups', color: '#9333ea', label: 'Character variety' },
  overall: { icon: 'balance', color: '#64748b', label: 'Overall balance' },
};
const QUICK_SORT_LABELS: Record<string, string> = {
  overall: 'Overall rating',
  popular: 'Most popular',
  newest: 'Newest',
  value: 'Best value',
  rating: 'Highest rated',
};
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
const FILTER_LABELS: Record<string, string> = {
  'realistic-chat': 'Realistic chat',
  roleplay: 'Roleplay',
  memory: 'Memory',
  images: 'Images',
  video: 'Video',
  voice: 'Voice calls',
  custom: 'Custom characters',
  nsfw: 'NSFW',
  mobile: 'Mobile app',
  'voice-messages': 'Voice messages',
  'free-plan': 'Free tier',
  'privacy-high': 'Strong privacy',
  'no-credit-system': 'No credit system',
  'pay-card': 'Card',
  'pay-paypal': 'PayPal',
  'pay-crypto': 'Cryptocurrency',
  'pay-discreet': 'Discreet billing',
};

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

export function initAppDirectory() {
  const section = document.querySelector('[data-app-directory]');
  const root = section?.querySelector('[data-home-explorer]');
  if (!root || root.dataset.bound === 'true') return;
  root.dataset.bound = 'true';

  const basePath = section?.dataset.basePath ?? '/apps';
  const perPage = Number(section?.dataset.perPage ?? APPS_PER_PAGE);
  const maxPriceDefault = Number(section?.dataset.maxPrice ?? 30);

  const grid = root.querySelector('[data-home-grid]');
  const sortSelect = root.querySelector('[data-home-sort]') as HTMLSelectElement | null;
  const sortLabelEl = root.querySelector('[data-home-sort-label]');
  const countEl = root.querySelector('[data-home-count]');
  const sheetCountEls = [...root.querySelectorAll('[data-home-sheet-count], [data-home-sheet-count-mobile]')] as HTMLElement[];
  const emptyEl = root.querySelector('[data-home-empty]');
  const activeFiltersEl = root.querySelector('[data-home-active-filters]');
  const clearButtons = [
    ...document.querySelectorAll('[data-home-clear-filters], [data-home-clear-filters-sheet]'),
  ] as HTMLButtonElement[];
  const applyButtons = [
    ...root.querySelectorAll('[data-home-apply-filters], [data-home-apply-filters-mobile]'),
  ] as HTMLButtonElement[];
  const filterInputs = [...root.querySelectorAll('[data-home-filter]')] as HTMLInputElement[];
  const paymentInputs = [...root.querySelectorAll('[data-home-payment-filter]')] as HTMLInputElement[];
  const cards = [...root.querySelectorAll('[data-home-app]')] as HTMLElement[];
  const priceMinInput = root.querySelector('[data-home-price-min]') as HTMLInputElement | null;
  const priceMaxInput = root.querySelector('[data-home-price-max]') as HTMLInputElement | null;
  const priceMinRange = root.querySelector('[data-home-price-min-range]') as HTMLInputElement | null;
  const priceMaxRange = root.querySelector('[data-home-price-max-range]') as HTMLInputElement | null;
  const priceFill = root.querySelector('[data-home-price-fill]') as HTMLElement | null;
  const budgetPresets = [...root.querySelectorAll('[data-home-budget-preset]')] as HTMLButtonElement[];
  const minRatingInputs = [...root.querySelectorAll('[data-home-min-rating]')] as HTMLInputElement[];
  const priorityList = root.querySelector('[data-home-priority-list]');
  let prioritySlots = [...root.querySelectorAll('[data-home-priority-slot]')] as HTMLElement[];
  let priorityInputs = [...root.querySelectorAll('[data-home-priority]')] as HTMLInputElement[];
  const initialSlotOrder = [...prioritySlots];
  const prioritiesReset = root.querySelector('[data-home-priorities-reset]');
  const customizeStatus = root.querySelector('[data-home-customize-status]');
  const quickSortButtons = [...root.querySelectorAll('[data-home-quick-sort]')] as HTMLButtonElement[];
  const popularMore = root.querySelector('[data-home-popular-more]');
  const popularMoreToggle = root.querySelector('[data-home-popular-more-toggle]');
  const filtersPanel = root.querySelector('[data-home-filters-panel]');
  const filtersBackdrop = root.querySelector('[data-home-filters-backdrop]');
  const filtersOpen = document.querySelector('[data-home-filters-open]');
  const filtersCloseButtons = [...document.querySelectorAll('[data-home-filters-close]')] as HTMLButtonElement[];
  const loadMoreBtn = root.querySelector('[data-home-load-more]') as HTMLButtonElement | null;
  const paginationNav = root.querySelector('[data-home-pagination]');
  const pageLinks = [...root.querySelectorAll('[data-home-page-link]')] as HTMLAnchorElement[];
  const pagePrev = root.querySelector('[data-home-page-prev]') as HTMLAnchorElement | null;
  const pageNext = root.querySelector('[data-home-page-next]') as HTMLAnchorElement | null;

  const savedToggle = document.querySelector('[data-home-saved-toggle]');
  const savedCountEl = document.querySelector('[data-home-saved-count]');
  const saveButtons = [...document.querySelectorAll('[data-home-save]')] as HTMLButtonElement[];
  const likeButtons = [...document.querySelectorAll('[data-home-like]')] as HTMLButtonElement[];
  const compareButtons = [...document.querySelectorAll('[data-home-compare-btn]')] as HTMLButtonElement[];

  const tray = document.querySelector('[data-home-compare-tray]');
  const comparePills = tray?.querySelector('[data-home-compare-pills]');
  const compareClear = tray?.querySelector('[data-home-compare-clear]');
  const compareGo = tray?.querySelector('[data-home-compare-go]');

  const selected = new Map<string, { name: string; score: string }>();
  const saved = loadSet(SAVED_KEY);
  const liked = loadSet(LIKED_KEY);
  let savedOnly = false;
  let loadedPages = parseAppsPage(window.location.search);
  let personalized = false;
  let quickSortMode = 'overall';

  function selectedMinRating() {
    const checked = minRatingInputs.find((input) => input.checked);
    return RATING_THRESHOLDS[checked?.value ?? 'rating-any'] ?? 0;
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
    return paymentInputs.filter((input) => input.checked).map((input) => input.value);
  }

  function hasPendingFilters() {
    const filters = activeFilters();
    const payments = activePayments();
    const minRating = selectedMinRating();
    const minPrice = selectedPriceMin();
    const maxPrice = selectedPriceMax();
    return (
      filters.length > 0 ||
      payments.length > 0 ||
      minRating > 0 ||
      minPrice > 0 ||
      maxPrice < maxPriceDefault
    );
  }

  function updateClearButtons() {
    clearButtons.forEach((btn) => {
      btn.hidden = false;
    });
  }

  function currentPriorities() {
    return priorityInputs.map((input) => input.value);
  }

  function updatePrioritySlotIcons() {
    prioritySlots.forEach((slot) => {
      const input = slot.querySelector('[data-home-priority]') as HTMLInputElement | null;
      const iconWrap = slot.querySelector('[data-home-priority-icon]') as HTMLElement | null;
      if (!input || !iconWrap) return;
      const meta = PRIORITY_META[input.value];
      if (!meta) return;
      iconWrap.style.background = `${meta.color}20`;
      iconWrap.style.color = meta.color;
      const iconEl = iconWrap.querySelector('.material-symbols-outlined');
      if (iconEl) iconEl.textContent = meta.icon;
    });
  }

  function refreshPrioritySlots() {
    prioritySlots = [...root.querySelectorAll('[data-home-priority-slot]')] as HTMLElement[];
    priorityInputs = [...root.querySelectorAll('[data-home-priority]')] as HTMLInputElement[];
    updatePriorityRanks();
    updatePrioritySlotIcons();
  }

  function closeAllPriorityMenus() {
    root.querySelectorAll('[data-priority-menu]').forEach((menu) => {
      (menu as HTMLElement).hidden = true;
      const trigger = menu.closest('[data-home-priority-picker]')?.querySelector('[data-priority-trigger]');
      trigger?.setAttribute('aria-expanded', 'false');
    });
  }

  function initPriorityPickers() {
    root.querySelectorAll('[data-home-priority-picker]').forEach((picker) => {
      const trigger = picker.querySelector('[data-priority-trigger]') as HTMLButtonElement | null;
      const menu = picker.querySelector('[data-priority-menu]') as HTMLElement | null;
      const hidden = picker.querySelector('[data-home-priority]') as HTMLInputElement | null;
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

  function initPriorityDrag() {
    root.querySelectorAll('[data-home-priority-drag]').forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        if (!(event instanceof PointerEvent) || !priorityList) return;
        const slot = handle.closest('[data-home-priority-slot]') as HTMLElement | null;
        if (!slot) return;
        event.preventDefault();
        handle.setPointerCapture(event.pointerId);
        slot.classList.add('is-dragging');
        document.body.classList.add('home-priority-dragging');

        const move = (ev: PointerEvent) => {
          const hit = document.elementFromPoint(ev.clientX, ev.clientY);
          const target = hit?.closest('[data-home-priority-slot]') as HTMLElement | null;
          if (!target || target === slot) return;
          const rect = target.getBoundingClientRect();
          const before = ev.clientX < rect.left + rect.width / 2;
          if (before) {
            if (slot.previousElementSibling !== target) target.before(slot);
          } else if (slot.nextElementSibling !== target) {
            target.after(slot);
          }
          refreshPrioritySlots();
        };

        const end = () => {
          slot.classList.remove('is-dragging');
          document.body.classList.remove('home-priority-dragging');
          try {
            handle.releasePointerCapture(event.pointerId);
          } catch {}
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', end);
          refreshPrioritySlots();
          setPersonalized(true);
          applyFiltersAndSort();
        };

        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', end);
      });
    });
  }

  function updatePriorityRanks() {
    prioritySlots.forEach((slot, index) => {
      const rank = slot.querySelector('.home-explorer__priority-rank');
      if (rank) rank.textContent = String(index + 1);
    });
  }

  function isDefaultPriorities() {
    return currentPriorities().every((value, index) => value === DEFAULT_PRIORITIES[index]);
  }

  function setPersonalized(active: boolean) {
    personalized = active;
    if (customizeStatus) customizeStatus.hidden = !active;
  }

  function updateSortLabel() {
    if (!sortLabelEl) return;
    if (personalized) {
      sortLabelEl.textContent = 'Personalized by your top priorities';
      return;
    }
    const label = QUICK_SORT_LABELS[quickSortMode] ?? sortSelect?.selectedOptions[0]?.textContent ?? 'Overall rating';
    sortLabelEl.textContent = `Sorted by ${label}`;
  }

  function updatePreviewCounts() {
    const matched = countMatchingCards();
    sheetCountEls.forEach((el) => {
      el.textContent = String(matched.length);
    });
    updateClearButtons();
  }

  function cardMatches(card: HTMLElement) {
    const filters = activeFilters();
    const payments = activePayments();
    const cardFilters = (card.dataset.filters ?? '').split(',').filter(Boolean);
    const cardPayments = (card.dataset.payments ?? '').split(',').filter(Boolean);
    const price = Number(card.dataset.price ?? 0);
    const score = Number(card.dataset.overallScore ?? 0);
    const id = card.dataset.homeApp ?? '';

    const matchesFilters = filters.length === 0 || filters.every((f) => cardFilters.includes(f));
    const matchesPayments = payments.length === 0 || payments.every((p) => cardMatchesPayment(cardPayments, p));
    const matchesRating = score >= selectedMinRating();
    const matchesPrice = price >= selectedPriceMin() && price <= selectedPriceMax();
    const matchesSaved = !savedOnly || saved.has(id);
    return matchesFilters && matchesPayments && matchesRating && matchesPrice && matchesSaved;
  }

  function countMatchingCards() {
    return cards.filter((card) => cardMatches(card));
  }

  function renderActiveChips(filters: string[], payments: string[]) {
    if (!activeFiltersEl) return;
    const items: { type: string; id: string; label: string }[] = [];
    filters.forEach((id) => items.push({ type: 'filter', id, label: FILTER_LABELS[id] ?? id }));
    payments.forEach((id) => items.push({ type: 'payment', id, label: FILTER_LABELS[id] ?? id }));

    const minPrice = selectedPriceMin();
    const maxPrice = selectedPriceMax();
    if (minPrice > 0 || maxPrice < maxPriceDefault) {
      items.push({ type: 'price', id: 'price-range', label: `$${minPrice}–$${maxPrice}/mo` });
    }
    const minRating = selectedMinRating();
    if (minRating > 0) {
      items.push({ type: 'rating', id: 'min-rating', label: `${minRating}+ rating` });
    }

    activeFiltersEl.innerHTML = items
      .map(
        (item) =>
          `<button type="button" class="home-explorer__active-chip" data-remove-chip-type="${item.type}" data-remove-chip-id="${item.id}">
            <span>${item.label}</span>
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>`,
      )
      .join('');
    activeFiltersEl.hidden = items.length === 0;
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
    const matched = cards.filter((card) => cardMatches(card));

    matched.sort((a, b) => {
      if (personalized) {
        return getWeightedScore(b, currentPriorities()) - getWeightedScore(a, currentPriorities());
      }
      const sortKey = quickSortMode === 'overall' ? (sortSelect?.value ?? 'overall') : quickSortMode;
      const aScore = getSortScore(a, sortKey);
      const bScore = getSortScore(b, sortKey);
      if (sortKey === 'price-asc') return aScore - bScore;
      if (sortKey === 'price-desc') return bScore - aScore;
      return bScore - aScore;
    });

    matched.forEach((card) => grid?.appendChild(card));

    const visibleLimit = loadedPages * perPage;
    matched.forEach((card, index) => {
      card.hidden = index >= visibleLimit;
    });
    cards.filter((card) => !cardMatches(card)).forEach((card) => {
      card.hidden = true;
      card.dataset.filtered = 'false';
    });
    matched.forEach((card) => {
      card.dataset.filtered = 'true';
    });

    if (countEl) countEl.textContent = String(matched.length);
    sheetCountEls.forEach((el) => {
      el.textContent = String(matched.length);
    });
    if (emptyEl) emptyEl.hidden = matched.length > 0;

    updatePaginationUi(matched.length);
    renderActiveChips(filters, payments);
    updateSortLabel();
    updateClearButtons();
  }

  function renderCompareTray() {
    const compareCountEl = tray?.querySelector('[data-home-compare-count]');
    if (!tray || !comparePills || !compareCountEl) return;
    comparePills.innerHTML = '';
    compareCountEl.textContent = String(selected.size);
    tray.dataset.visible = selected.size > 0 ? 'true' : 'false';
    tray.hidden = selected.size === 0;

    selected.forEach((item, id) => {
      const pill = document.createElement('span');
      pill.className = 'home-compare-tray__pill';
      pill.innerHTML = `${item.name} <button type="button" class="home-compare-tray__pill-remove material-symbols-outlined text-[14px]" data-remove-compare="${id}" aria-label="Remove ${item.name}">close</button>`;
      comparePills.appendChild(pill);
    });

    compareButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', selected.has(btn.dataset.homeCompareBtn ?? '') ? 'true' : 'false');
    });
  }

  function clearChip(type: string, id: string) {
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
    applyFiltersAndSort();
    updatePreviewCounts();
  }

  function resetPriorities() {
    if (priorityList) {
      initialSlotOrder.forEach((slot) => priorityList.appendChild(slot));
    }
    prioritySlots.forEach((slot, index) => {
      const hidden = slot.querySelector('[data-home-priority]') as HTMLInputElement | null;
      const defaultValue = DEFAULT_PRIORITIES[index] ?? 'overall';
      if (hidden) hidden.value = defaultValue;
      const triggerLabel = slot.querySelector('.home-priority-picker__trigger-label');
      const meta = PRIORITY_META[defaultValue];
      if (triggerLabel && meta) triggerLabel.textContent = meta.label;
      slot.querySelectorAll('[data-priority-option]').forEach((opt) => {
        opt.setAttribute('aria-selected', (opt as HTMLElement).dataset.priorityOption === defaultValue ? 'true' : 'false');
      });
    });
    refreshPrioritySlots();
    setPersonalized(false);
    quickSortMode = 'overall';
    quickSortButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.homeQuickSort === 'overall' ? 'true' : 'false');
    });
    if (sortSelect) sortSelect.value = 'overall';
    applyFiltersAndSort();
  }

  function openFiltersSheet() {
    filtersPanel?.classList.add('is-open');
    if (filtersBackdrop) filtersBackdrop.hidden = false;
    document.body.classList.add('home-filters-open');
  }

  function closeFiltersSheet() {
    filtersPanel?.classList.remove('is-open');
    if (filtersBackdrop) filtersBackdrop.hidden = true;
    document.body.classList.remove('home-filters-open');
  }

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
    quickSortMode = 'overall';
    quickSortButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.homeQuickSort === 'overall' ? 'true' : 'false');
    });
    applyFiltersAndSort();
  });

  initPriorityPickers();
  initPriorityDrag();

  quickSortButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.homeQuickSort ?? 'overall';
      quickSortMode = mode;
      setPersonalized(false);
      quickSortButtons.forEach((other) => {
        other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
      });
      if (mode === 'overall' && sortSelect) sortSelect.value = 'overall';
      applyFiltersAndSort();
    });
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
      body.hidden = !willExpand;
      if (group instanceof HTMLElement) group.classList.toggle('is-open', willExpand);
    });
  });

  syncPriceInputs(0, maxPriceDefault);
  updatePrioritySlotIcons();

  saveButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.homeSave ?? '';
      if (!id) return;
      if (saved.has(id)) saved.delete(id);
      else saved.add(id);
      persistSet(SAVED_KEY, saved);
      btn.setAttribute('aria-pressed', saved.has(id) ? 'true' : 'false');
      if (savedCountEl) savedCountEl.textContent = String(saved.size);
      applyFiltersAndSort();
      updatePreviewCounts();
    });
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

  savedToggle?.addEventListener('click', () => {
    savedOnly = !savedOnly;
    savedToggle.setAttribute('aria-pressed', savedOnly ? 'true' : 'false');
    loadedPages = 1;
    pushPageUrl(1, true);
    applyFiltersAndSort();
    updatePreviewCounts();
  });

  compareButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.homeCompareBtn ?? '';
      const name = btn.dataset.homeCompareName ?? id;
      const score = btn.dataset.homeCompareScore ?? '';
      if (!id) return;
      if (selected.has(id)) selected.delete(id);
      else {
        if (selected.size >= 3) return;
        selected.set(id, { name, score });
      }
      renderCompareTray();
    });
  });

  comparePills?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const removeId = target.dataset.removeCompare;
    if (!removeId) return;
    selected.delete(removeId);
    renderCompareTray();
  });

  compareClear?.addEventListener('click', () => {
    selected.clear();
    renderCompareTray();
  });

  compareGo?.addEventListener('click', () => {
    const ids = [...selected.keys()];
    if (!ids.length) return;
    window.location.href = '/best/ai-girlfriend#roundup-compare';
    try {
      sessionStorage.setItem('home-compare-ids', JSON.stringify(ids));
    } catch {}
  });

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

  saveButtons.forEach((btn) => btn.setAttribute('aria-pressed', saved.has(btn.dataset.homeSave ?? '') ? 'true' : 'false'));
  if (savedCountEl) savedCountEl.textContent = String(saved.size);
  likeButtons.forEach((btn) => btn.setAttribute('aria-pressed', liked.has(btn.dataset.homeLike ?? '') ? 'true' : 'false'));

  pushPageUrl(loadedPages, true);
  renderCompareTray();
  updatePreviewCounts();
  applyFiltersAndSort();
}

initAppDirectory();
document.addEventListener('astro:page-load', initAppDirectory);
