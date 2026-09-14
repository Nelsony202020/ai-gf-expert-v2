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

    const grid = document.createElement('div');
    grid.className = 'od-compare-grid';
    a.replaceWith(grid);
    grid.append(a, b);
    children.splice(i + 1, 1);
    i++;
  }
}

function initOurDreamArticlePage() {
  document.querySelectorAll<HTMLElement>('[data-ourdream-article]').forEach(wrapCompareFigures);

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
