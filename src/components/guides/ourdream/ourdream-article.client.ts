function wrapCompareFigures(root: HTMLElement) {
  if (root.dataset.compareBound === 'true') return;
  const prose = root.querySelector<HTMLElement>('[data-ourdream-prose]');
  if (!prose) return;
  root.dataset.compareBound = 'true';

  const children = Array.from(prose.children);
  for (let i = 0; i < children.length - 1; i++) {
    const a = children[i];
    const b = children[i + 1];
    if (a.tagName !== 'FIGURE' || b.tagName !== 'FIGURE') continue;
    if (a.parentElement?.classList.contains('od-compare-grid')) continue;
    if (a.closest('.od-aige-test, .od-block--aige-test')) continue;

    const grid = document.createElement('div');
    grid.className = 'od-compare-grid';
    a.replaceWith(grid);
    grid.append(a, b);
    children.splice(i + 1, 1);
    i++;
  }
}

function bindCopyButtons(root: HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>('[data-od-copy]').forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', async () => {
      const target = button.closest('[data-od-copy-root]') ?? button.parentElement;
      const source =
        target?.querySelector<HTMLElement>('[data-od-copy-text]') ??
        target?.querySelector('pre, .od-prompt-card__text, .od-prompt__body');
      const text = source?.textContent?.trim();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const original = button.textContent;
        button.textContent = 'Copied';
        // The icon is a ::before mask keyed off this attribute, so it follows the
        // label rather than being clobbered by the textContent swap.
        button.dataset.copied = 'true';
        window.setTimeout(() => {
          button.textContent = original;
          delete button.dataset.copied;
        }, 1600);
      } catch {
        /* ignore */
      }
    });
  });
}

function bindPromptExpand(root: HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>('[data-od-expand]').forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      button.closest('.od-prompt')?.classList.add('is-expanded');
    });
  });
}

/**
 * The TOC list is capped at 420px (Figma 158:2582) and scrolls internally, so on a long
 * guide the scroll-spy can mark an item that is out of view. Mirror the active item into
 * the scroller. Scoped to the article page; the shared scroll-spy is left untouched.
 */
function bindTocFollow(root: HTMLElement) {
  const list = root.querySelector<HTMLElement>('.ourdream-article-toc__list');
  if (!list || list.dataset.tocFollowBound === 'true') return;
  list.dataset.tocFollowBound = 'true';

  const reveal = () => {
    const active = list.querySelector<HTMLElement>('.is-active');
    if (!active) return;
    const l = list.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    if (a.top >= l.top && a.bottom <= l.bottom) return;
    list.scrollTop += a.top < l.top ? a.top - l.top : a.bottom - l.bottom;
  };

  const observer = new MutationObserver(reveal);
  list.querySelectorAll('[data-toc-link]').forEach((link) => {
    observer.observe(link, { attributes: true, attributeFilter: ['class'] });
  });
  reveal();
}


/**
 * Evidence images open in the shared site lightbox (decision Q14). Article
 * figures, step media and the two-up image grid qualify; the small external
 * example thumbnails do not. Decorating at runtime rather than in the authored
 * HTML keeps every guide in step without touching four content files.
 */
function bindImageLightbox(root: HTMLElement) {
  if (root.dataset.lightboxBound === 'true') return;
  root.dataset.lightboxBound = 'true';

  const figures = root.querySelectorAll<HTMLElement>(
    'figure > img, .od-steps__media > img, .od-figure-grid figure > img',
  );

  figures.forEach((img) => {
    const src = img.getAttribute('src');
    if (!src) return;
    const caption = img.parentElement?.querySelector('figcaption')?.textContent?.trim() ?? '';
    // The shared lightbox reads the source from the VALUE of data-lightbox-open
    // (trigger.dataset.lightboxOpen), not from a separate attribute.
    img.setAttribute('data-lightbox-open', src);
    img.setAttribute('data-lightbox-alt', img.getAttribute('alt') ?? '');
    if (caption) img.setAttribute('data-lightbox-caption', caption);
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    img.setAttribute('aria-label', caption ? `Enlarge image: ${caption}` : 'Enlarge image');
    img.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      img.click();
    });
  });
}

function initOurDreamArticlePage() {
  document.querySelectorAll<HTMLElement>('[data-ourdream-article]').forEach((root) => {
    wrapCompareFigures(root);
    bindCopyButtons(root);
    bindPromptExpand(root);
    bindTocFollow(root);
    bindImageLightbox(root);
  });

  document.querySelectorAll<HTMLDetailsElement>('[data-ourdream-jump]').forEach((details) => {
    details.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => {
        details.open = false;
      });
    });
  });
}

initOurDreamArticlePage();
document.addEventListener('astro:page-load', initOurDreamArticlePage);
