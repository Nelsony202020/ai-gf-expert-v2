import { bindCopyButtons } from '../../../lib/ui/copyButtons';

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

/**
 * The guide video plays where it sits.
 *
 * The block ships as a facade — a poster and a button — so no YouTube code
 * loads on page view. On activation the button is replaced by a frame of the
 * same class carrying the iframe, so the 16:9 box is identical before and
 * after and nothing on the page moves. The button gives Enter and Space for
 * free; there is no keydown handler to get wrong.
 *
 * Its own attribute and handler: `data-video-lightbox-open` still belongs to
 * the review pages' shared modal, and guides no longer use it.
 */
function bindGuideVideo(root: HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>('[data-guide-video]').forEach((trigger) => {
    if (trigger.dataset.bound === 'true') return;
    trigger.dataset.bound = 'true';

    trigger.addEventListener('click', () => {
      const src = trigger.dataset.videoEmbed;
      if (!src) return;

      const frame = document.createElement('div');
      frame.className = 'od-video__frame';

      const iframe = document.createElement('iframe');
      iframe.className = 'od-video__iframe';
      iframe.title = trigger.dataset.videoTitle || 'Video';
      iframe.src = src;
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.setAttribute('frameborder', '0');

      frame.append(iframe);
      trigger.replaceWith(frame);
      // The player takes keyboard focus, so a reader who pressed Enter is
      // already inside it rather than back at the top of the document.
      iframe.focus({ preventScroll: true });
    });
  });
}

/**
 * maxresdefault does not exist for every video, and YouTube answers a missing
 * one with a grey 120x90 placeholder rather than a 404 — so the swap is keyed
 * on the decoded width, not on an error event alone.
 */
function swapMissingPosters(root: HTMLElement) {
  root
    .querySelectorAll<HTMLImageElement>('.od-video__poster[data-poster-fallback]')
    .forEach((img) => {
      const fallback = img.dataset.posterFallback;
      if (!fallback) return;
      const check = () => {
        if (img.naturalWidth > 0 && img.naturalWidth < 300 && img.src !== fallback) {
          img.src = fallback;
        }
        delete img.dataset.posterFallback;
      };
      img.addEventListener('error', () => { img.src = fallback; }, { once: true });
      if (img.complete) check();
      else img.addEventListener('load', check, { once: true });
    });
}

function initOurDreamArticlePage() {
  document.querySelectorAll<HTMLElement>('[data-ourdream-article]').forEach((root) => {
    wrapCompareFigures(root);
    bindCopyButtons(root);
    bindPromptExpand(root);
    bindTocFollow(root);
    bindImageLightbox(root);
    bindGuideVideo(root);
    swapMissingPosters(root);
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
