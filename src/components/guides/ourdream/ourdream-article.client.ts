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
        window.setTimeout(() => {
          button.textContent = original;
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

function initOurDreamArticlePage() {
  document.querySelectorAll<HTMLElement>('[data-ourdream-article]').forEach((root) => {
    wrapCompareFigures(root);
    bindCopyButtons(root);
    bindPromptExpand(root);
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
