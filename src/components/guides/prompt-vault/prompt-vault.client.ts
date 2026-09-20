/**
 * Prompt Vault behaviour. The HTML already holds every prompt; this script only
 * decides what is shown, keeps ?category= / ?q= in the address bar as UI state,
 * copies prompts and runs the detail dialog.
 *
 * Modes (data-mode on the root):
 *   browse — preview rows per category (3 desktop, the shelf picks on mobile)
 *   focus  — ?category=<chip or category>: the full grid, other categories hidden
 *   search — ?q=: every match, grouped by category, within the active category if any
 */
import {
  normaliseForSearch,
  parseVaultState,
  sameVaultState,
  serializeVaultState,
  type VaultUrlState,
} from '../../../lib/prompt-vault/url-state';
import { bindCopyButtons } from '../../../lib/ui/copyButtons';
import { lockScroll, unlockScroll } from '../../../lib/ui/scrollLock';

type Img = { src: string; srcset: string; width: number; height: number; alt: string } | null;
interface ClientData {
  filters: { key: string; label: string; categoryKeys: string[]; count: number }[];
  categories: {
    key: string;
    title: string;
    shortTitle: string;
    description: string;
    filterKey: string;
    count: number;
  }[];
  prompts: Record<
    string,
    {
      title: string;
      text: string;
      category: string;
      model: string;
      generator: string;
      meta: string;
      weight: string | null;
      images: Img[];
    }
  >;
  total: number;
}

const COPIED_MS = 2000;
const MOBILE = '(max-width: 767px)';

export function initPromptVault(): void {
  const root = document.querySelector<HTMLElement>('[data-prompt-vault]');
  const dataEl = document.getElementById('prompt-vault-data');
  if (!root || !dataEl || root.dataset.bound === 'true') return;
  root.dataset.bound = 'true';
  const data = JSON.parse(dataEl.textContent || '{}') as ClientData;

  const filterByKey = new Map(data.filters.map((f) => [f.key, f]));
  const categoryByKey = new Map(data.categories.map((c) => [c.key, c]));
  const known = new Set<string>([...filterByKey.keys(), ...categoryByKey.keys()]);

  const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => scope.querySelector<T>(sel);
  const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) =>
    Array.from(scope.querySelectorAll<T>(sel));

  const sticky = $('[data-pv-sticky]')!;
  const hero = $('[data-pv-hero]')!;
  const mainSearch = $<HTMLInputElement>('[data-pv-search-main]')!;
  const searchInputs = $$<HTMLInputElement>('input[data-pv-search]');
  const chips = $$<HTMLButtonElement>('[data-pv-chip]');
  const catSections = $$('[data-pv-cat]');
  const groups = $$('[data-pv-group]');
  const gridCards = $$('.pv-groups [data-pv-card]');
  const focusHead = $('[data-pv-focus-head]')!;
  const searchHead = $('[data-pv-search-head]')!;
  const empty = $('[data-pv-empty]')!;
  const searchMore = $('[data-pv-search-more]')!;

  // ---------------------------------------------------------------- state
  const categoriesFor = (key: string | null): Set<string> | null => {
    if (!key) return null;
    const f = filterByKey.get(key);
    if (f) return new Set(f.categoryKeys);
    return categoryByKey.has(key) ? new Set([key]) : null;
  };
  const chipKeyFor = (key: string | null): string => {
    if (!key) return '';
    if (filterByKey.has(key)) return key;
    return categoryByKey.get(key)?.filterKey ?? '';
  };
  const tokens = (q: string) => normaliseForSearch(q).split(' ').filter(Boolean);
  const matches = (card: HTMLElement, toks: string[]) => {
    const hay = card.dataset.search ?? '';
    return toks.every((t) => hay.includes(t));
  };

  let state: VaultUrlState = parseVaultState(location.search, known);

  function render(): void {
    const toks = tokens(state.q);
    const searching = toks.length > 0;
    const allowed = categoriesFor(state.category);
    const mode = searching ? 'search' : allowed ? 'focus' : 'browse';
    root!.dataset.mode = mode;
    document.documentElement.classList.toggle('pv-focus', mode === 'focus');

    // Chips: active chip, and per-chip match counts while searching.
    const activeChip = chipKeyFor(state.category);
    const perFilter = new Map<string, number>();
    let totalMatches = 0;
    if (searching) {
      for (const card of gridCards) {
        if (!matches(card, toks)) continue;
        totalMatches += 1;
        const f = card.dataset.filter ?? '';
        perFilter.set(f, (perFilter.get(f) ?? 0) + 1);
      }
    }
    for (const chip of chips) {
      const key = chip.dataset.pvChip ?? '';
      const on = key === activeChip;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', String(on));
      const count = chip.querySelector('[data-filter-chip-count]');
      const n = searching ? (key ? perFilter.get(key) ?? 0 : totalMatches) : key ? filterByKey.get(key)?.count ?? 0 : data.total;
      if (count) count.textContent = String(n);
      const dead = searching && key !== '' && n === 0 && !on;
      chip.disabled = dead;
    }

    // Cards and sections.
    let shown = 0;
    const perCategory = new Map<string, number>();
    for (const section of catSections) {
      const key = section.dataset.pvCat!;
      const inScope = !allowed || allowed.has(key);
      let visible = 0;
      for (const card of $$('[data-pv-card]', section)) {
        const show = mode === 'browse' ? true : inScope && (!searching || matches(card, toks));
        card.hidden = !show;
        if (show) visible += 1;
      }
      section.hidden = mode !== 'browse' && visible === 0;
      if (mode !== 'browse') perCategory.set(key, visible);
      const countEl = $('[data-pv-cat-count]', section);
      if (countEl) countEl.textContent = mode === 'search' ? `${visible} ${visible === 1 ? 'result' : 'results'}` : countEl.dataset.total ?? '';
      if (mode !== 'browse') shown += visible;
    }
    for (const g of groups) g.hidden = mode !== 'browse' && !$('[data-pv-cat]:not([hidden])', g);

    // Focus head.
    focusHead.hidden = mode !== 'focus';
    if (mode === 'focus' && state.category) {
      const cat = categoryByKey.get(state.category);
      const filter = filterByKey.get(state.category);
      const single = filter && filter.categoryKeys.length === 1 ? categoryByKey.get(filter.categoryKeys[0]) : null;
      const c = cat ?? single;
      $('[data-pv-focus-title]')!.textContent = c ? c.title : `${filter!.label} prompts`;
      $('[data-pv-focus-count]')!.textContent = `${shown} tested prompts`;
      $('[data-pv-focus-desc]')!.textContent = c
        ? c.description
        : filter!.categoryKeys.map((k) => categoryByKey.get(k)?.shortTitle ?? k).join(' · ');
      root!.dataset.focusSingle = String(Boolean(c));
    } else {
      delete root!.dataset.focusSingle;
    }

    // Search head / empty state.
    searchHead.hidden = !(mode === 'search' && shown > 0);
    empty.hidden = !(mode === 'search' && shown === 0);
    searchMore.hidden = !(mode === 'search' && shown > 0 && toks.includes('hair'));
    if (mode === 'search') {
      $('[data-pv-search-title]')!.textContent = `${shown} ${shown === 1 ? 'result' : 'results'} for “${state.q}”`;
      const parts = [...perCategory.entries()]
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${n} ${(categoryByKey.get(k)?.shortTitle ?? k).toLowerCase()}`);
      $('[data-pv-search-summary]')!.textContent = `Matches prompt text, prompt names and categories. ${parts.join(' · ')}.`;
      $('[data-pv-empty-title]')!.textContent = `No prompts match “${state.q}”`;
    }

    // Search fields mirror each other.
    for (const input of searchInputs) {
      if (document.activeElement !== input && input.value !== state.q) input.value = state.q;
      const field = input.closest('[data-search-field]');
      field?.classList.toggle('is-filled', state.q.length > 0);
      const count = field?.querySelector('[data-search-field-count]');
      if (count) count.textContent = mode === 'search' ? `${shown} ${shown === 1 ? 'result' : 'results'}` : '';
    }

    updateSticky();
  }

  // ---------------------------------------------------------------- history
  const url = (s: VaultUrlState) => `${location.pathname}${serializeVaultState(s, location.search)}${location.hash}`;
  const saveScroll = () =>
    history.replaceState({ ...(history.state ?? {}), pv: true, scrollY: window.scrollY }, '', location.href);

  function commit(next: VaultUrlState, how: 'push' | 'replace', scroll?: 'top' | 'collection' | 'keep'): void {
    if (sameVaultState(next, state) && how === 'push') return;
    if (how === 'push') {
      saveScroll();
      const fromBrowse = !state.category && !state.q;
      state = next;
      history.pushState({ pv: true, scrollY: 0, fromBrowse }, '', url(next));
    } else {
      state = next;
      history.replaceState({ ...(history.state ?? {}), pv: true }, '', url(next));
    }
    render();
    if (scroll === 'top') window.scrollTo({ top: 0, behavior: 'instant' });
    if (scroll === 'collection') scrollToCollection();
  }

  function scrollToCollection(): void {
    const target = root!.dataset.mode === 'browse' ? hero : $('[data-pv-collection]')!;
    const offset = stickyHeight();
    const y = target.getBoundingClientRect().top + window.scrollY - offset - 8;
    if (window.scrollY > y) window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
  }

  window.addEventListener('popstate', (event) => {
    const next = parseVaultState(location.search, known);
    if (!sameVaultState(next, state)) {
      state = next;
      render();
    }
    const y = (event.state as { scrollY?: number } | null)?.scrollY;
    if (typeof y === 'number') {
      window.scrollTo({ top: y, behavior: 'instant' });
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
    }
  });

  // We restore scroll ourselves: the browser's restore runs before the view re-renders.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Normalise the address bar once (unknown category / empty q dropped) without a new entry.
  const normalised = serializeVaultState(state, location.search);
  if (normalised !== location.search) history.replaceState(history.state, '', url(state));

  // ---------------------------------------------------------------- controls
  root.addEventListener('click', (event) => {
    const t = event.target as HTMLElement;
    const chip = t.closest<HTMLButtonElement>('[data-pv-chip]');
    if (chip) {
      const key = chip.dataset.pvChip || null;
      const next = { ...state, category: key === state.category ? state.category : key };
      commit(next, 'push', state.q ? 'keep' : key ? 'top' : 'keep');
      return;
    }
    const viewAll = t.closest<HTMLElement>('[data-pv-view-all]');
    if (viewAll) {
      commit({ category: viewAll.dataset.pvViewAll ?? null, q: '' }, 'push', 'top');
      return;
    }
    if (t.closest('[data-pv-back], [data-pv-clear-category]')) {
      leaveFocus();
      return;
    }
    if (t.closest('[data-pv-clear-search], [data-search-field-clear]')) {
      commit({ ...state, q: '' }, 'push');
      if (t.closest('[data-search-field-clear]')) t.closest('[data-search-field]')?.querySelector('input')?.focus();
      return;
    }
  });

  /** Back to the full vault; restores the previous scroll when we came from it. */
  function leaveFocus(): void {
    if ((history.state as { fromBrowse?: boolean } | null)?.fromBrowse && !state.q) {
      history.back();
      return;
    }
    commit({ category: null, q: state.q }, 'push', 'top');
  }

  let typingEntry = false;
  for (const input of searchInputs) {
    input.addEventListener('input', () => {
      const q = input.value.replace(/\s+/g, ' ').trimStart().slice(0, 80);
      const next = { ...state, q: q.trim() };
      // The first keystroke of a search makes one history entry; the rest replace it,
      // so Back leaves the search in one step instead of letter by letter.
      if (!typingEntry && next.q && !state.q) {
        typingEntry = true;
        commit(next, 'push', 'keep');
      } else {
        commit(next, 'replace', 'keep');
      }
      if (!next.q) typingEntry = false;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && input.value) {
        e.preventDefault();
        input.value = '';
        commit({ ...state, q: '' }, 'replace');
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        typingEntry = false;
        scrollToCollection();
      }
    });
    input.addEventListener('blur', () => {
      typingEntry = false;
    });
  }

  // "/" focuses search, unless the reader is typing somewhere.
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement as HTMLElement | null;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    if (detail.open) return;
    e.preventDefault();
    const target = sticky.classList.contains('is-visible')
      ? sticky.querySelector<HTMLInputElement>('input')
      : mainSearch;
    target?.focus();
  });

  // ---------------------------------------------------------------- sticky toolbar
  let heroSearchVisible = true;
  function stickyHeight(): number {
    return sticky.classList.contains('is-visible') ? sticky.offsetHeight : 0;
  }
  function updateSticky(): void {
    const show = root!.dataset.mode === 'focus' || !heroSearchVisible;
    sticky.classList.toggle('is-visible', show);
    sticky.setAttribute('aria-hidden', String(!show));
    sticky.toggleAttribute('inert', !show);
    document.documentElement.classList.toggle('pv-sticky-on', show);
  }
  new IntersectionObserver(
    ([entry]) => {
      heroSearchVisible = entry.isIntersecting || entry.boundingClientRect.top > 0;
      updateSticky();
    },
    { threshold: 0 },
  ).observe(mainSearch.closest('[data-search-field]') ?? mainSearch);

  // ---------------------------------------------------------------- copy
  // 1. Copied checkmark = feedback: ~2s on the button, then back to "Copy prompt".
  const setCopied = (el: HTMLElement | null, on: boolean) => {
    if (!el) return;
    el.classList.toggle('is-copied', on);
    const label = el.querySelector('[data-pv-copy-label]');
    if (label) label.textContent = on ? 'Copied' : 'Copy prompt';
  };
  // 2. "Paste it in OurDream →" = destination: no timer. Exactly one card carries it —
  //    the one copied last. Copying another prompt moves it; nothing else removes it.
  let linkedCard: HTMLElement | null = null;
  const setLinked = (card: HTMLElement | null) => {
    if (!card || card === linkedCard) return;
    linkedCard?.classList.remove('is-linked');
    card.classList.add('is-linked');
    linkedCard = card;
  };
  bindCopyButtons(root, {
    selector: '[data-pv-copy]',
    swapLabel: false,
    durationMs: COPIED_MS,
    getText: (b) => b.closest('[data-pv-card]')?.querySelector('[data-pv-text]')?.textContent,
    onCopied: (b) => {
      const card = b.closest<HTMLElement>('[data-pv-card]');
      setCopied(card, true);
      setLinked(card);
    },
    onReset: (b) => setCopied(b.closest('[data-pv-card]'), false),
  });

  // The whole card copies; the image opens the detail; links and buttons do their own thing.
  root.addEventListener('click', (event) => {
    const t = event.target as HTMLElement;
    const card = t.closest<HTMLElement>('[data-pv-card]');
    if (!card) return;
    if (t.closest('[data-pv-open]')) {
      openDetail(card);
      return;
    }
    if (t.closest('a, button, input')) return;
    if (window.getSelection()?.toString()) return; // selecting prompt text by hand
    card.querySelector<HTMLButtonElement>('[data-pv-copy]')?.click();
  });

  // ---------------------------------------------------------------- detail
  const detail = $<HTMLDialogElement>('[data-pv-detail]')!;
  const d = <T extends Element = HTMLElement>(sel: string) => detail.querySelector<T>(sel)!;
  const dAll = (sel: string) => Array.from(detail.querySelectorAll<HTMLElement>(sel));
  let set: HTMLElement[] = [];
  let index = 0;
  let resultIndex = 0;
  let opener: HTMLElement | null = null;
  let restoreY = 0;

  function contextSet(card: HTMLElement): HTMLElement[] {
    // Hero examples and browse previews step through their own category;
    // focus and search step through exactly what is on screen.
    const inGrid = card.closest('.pv-groups');
    if (!inGrid || root!.dataset.mode === 'browse') {
      const cat = card.dataset.category;
      return $$(`.pv-groups [data-pv-cat="${cat}"] [data-pv-card]`);
    }
    return gridCards.filter((c) => !c.hidden && !c.closest('[hidden]'));
  }

  function openDetail(card: HTMLElement): void {
    set = contextSet(card);
    index = Math.max(0, set.findIndex((c) => c.dataset.key === card.dataset.key));
    opener = card.querySelector<HTMLElement>('[data-pv-open]');
    restoreY = window.scrollY;
    fillDetail(0);
    if (!detail.open) {
      window.clearTimeout(closeTimer);
      detail.style.removeProperty('--pv-drag');
      lockScroll();
      detail.showModal();
      // Start from the closed pose, then transition to open on the next frame.
      void detail.offsetWidth;
      requestAnimationFrame(() => detail.classList.add('is-open'));
    }
  }

  // Close animates out (fade + drop on desktop, slide down on mobile) and only then
  // closes the dialog, so the scrim and panel leave together.
  let closeTimer: number | undefined;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function closeDetail(): void {
    if (!detail.open || !detail.classList.contains('is-open')) return;
    detail.classList.remove('is-open', 'is-dragging');
    const ms = reduceMotion() ? 0 : window.matchMedia(MOBILE).matches ? 260 : 200;
    closeTimer = window.setTimeout(() => detail.close(), ms);
  }
  // Esc: animate instead of the browser's instant close.
  detail.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDetail();
  });
  detail.addEventListener('close', () => {
    detail.classList.remove('is-open', 'is-dragging');
    detail.style.removeProperty('--pv-drag');
    unlockScroll();
    window.scrollTo({ top: restoreY, behavior: 'instant' });
    opener?.focus({ preventScroll: true });
  });

  function renderImage(host: HTMLElement, img: Img, sizes: string): void {
    host.replaceChildren();
    if (!img) {
      const ph = document.createElement('span');
      ph.className = 'pv-card__placeholder';
      host.append(ph);
      return;
    }
    const el = document.createElement('img');
    el.src = img.src;
    el.srcset = img.srcset;
    el.sizes = sizes;
    el.width = img.width;
    el.height = img.height;
    el.alt = img.alt;
    el.decoding = 'async';
    host.append(el);
  }

  function fillDetail(result: number): void {
    const card = set[index];
    const p = data.prompts[card.dataset.key!];
    const cat = categoryByKey.get(p.category);
    resultIndex = result;
    for (const el of dAll('[data-pv-detail-category]')) el.textContent = cat?.shortTitle ?? '';
    d('[data-pv-detail-title]').textContent = p.title;
    d('[data-pv-detail-text]').textContent = p.text;
    d('[data-pv-detail-model]').textContent = p.model;
    d('[data-pv-detail-tag]').className = `pv-tag pv-tag--${p.generator}`;
    d('[data-pv-detail-meta]').textContent = p.meta;
    const weight = d('[data-pv-detail-weight]');
    weight.hidden = !p.weight;
    d('[data-pv-detail-weight-text]').textContent = p.weight ?? '';
    renderImage(d('[data-pv-detail-image]'), p.images[result] ?? null, '(min-width: 768px) 472px, 100vw');

    const switcher = d('[data-pv-detail-switcher]');
    const thumbs = d('[data-pv-detail-thumbs]');
    switcher.hidden = p.images.length < 2;
    thumbs.replaceChildren(
      ...p.images.map((img, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pv-detail__thumb';
        b.setAttribute('aria-label', `Result ${i + 1} of ${p.images.length}`);
        b.setAttribute('aria-pressed', String(i === result));
        if (i === result) b.classList.add('is-selected');
        renderImage(b, img, '44px');
        b.addEventListener('click', () => fillDetail(i));
        return b;
      }),
    );
    d('[data-pv-detail-result-label]').textContent = `Result ${result + 1} of ${p.images.length}`;

    d<HTMLButtonElement>('[data-pv-detail-prev]').disabled = set.length < 2;
    d<HTMLButtonElement>('[data-pv-detail-next]').disabled = set.length < 2;
    resetDetailCopy();
  }

  function step(delta: number): void {
    if (set.length < 2) return;
    index = (index + delta + set.length) % set.length;
    fillDetail(0);
  }

  // Detail copy: same shared behaviour, its own copied look.
  const detailCopy = d<HTMLButtonElement>('[data-pv-detail-copy]');
  const resetDetailCopy = () => {
    detailCopy.classList.remove('is-copied');
    d('[data-pv-detail-copy] [data-pv-copy-label]').textContent = 'Copy prompt';
  };
  bindCopyButtons(detail, {
    selector: '[data-pv-detail-copy]',
    swapLabel: false,
    durationMs: COPIED_MS,
    getText: () => d('[data-pv-detail-text]').textContent,
    onCopied: () => {
      detailCopy.classList.add('is-copied');
      // Copying from the detail moves the paste link to that prompt's card on the page.
      const key = set[index]?.dataset.key;
      setLinked(key ? $(`.pv-groups [data-pv-card][data-key="${key}"]`) : null);
      d('[data-pv-detail-copy] [data-pv-copy-label]').textContent = 'Copied';
    },
    onReset: resetDetailCopy,
  });

  detail.addEventListener('click', (event) => {
    const t = event.target as HTMLElement;
    if (t === detail) return closeDetail(); // scrim
    if (t.closest('[data-pv-detail-close]')) return closeDetail();
    if (t.closest('[data-pv-detail-prev]')) return step(-1);
    if (t.closest('[data-pv-detail-next]')) return step(1);
  });
  detail.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest('input, textarea')) return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // Mobile sheet: drag the header down to close.
  // The sheet follows the finger, then either slides away or springs back.
  const drag = d('[data-pv-detail-drag]');
  let startY: number | null = null;
  drag.addEventListener('pointerdown', (e) => {
    if (!window.matchMedia(MOBILE).matches || (e.target as HTMLElement).closest('button')) return;
    startY = e.clientY;
    drag.setPointerCapture(e.pointerId);
    detail.classList.add('is-dragging');
  });
  drag.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    detail.style.setProperty('--pv-drag', `${Math.max(0, e.clientY - startY)}px`);
  });
  const endDrag = (e: PointerEvent) => {
    if (startY === null) return;
    const dy = e.clientY - startY;
    startY = null;
    detail.classList.remove('is-dragging');
    detail.style.removeProperty('--pv-drag');
    if (dy > 90) closeDetail();
  };
  drag.addEventListener('pointerup', endDrag);
  drag.addEventListener('pointercancel', endDrag);

  render();
}
