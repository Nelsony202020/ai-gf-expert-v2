const SCROLL_OFFSET = 100;

function initTestHubTocRoot(root: HTMLElement) {
  if (root.dataset.tocBound === 'true') return;
  root.dataset.tocBound = 'true';

  const tocLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'));
  const childToParent = new Map<string, string>();
  const sectionIds = new Set<string>();

  root.querySelectorAll<HTMLElement>('[data-toc-section]').forEach((li) => {
    const sectionId = li.dataset.tocSection;
    if (!sectionId) return;
    sectionIds.add(sectionId);
    li.querySelectorAll<HTMLAnchorElement>('[data-toc-link]').forEach((link) => {
      const id = link.dataset.tocLink;
      if (id && id !== sectionId) childToParent.set(id, sectionId);
    });
  });

  const sections = tocLinks
    .map((link) => {
      const id = link.dataset.tocLink!;
      const el = document.getElementById(id);
      return el ? { link, el } : null;
    })
    .filter((x): x is { link: HTMLAnchorElement; el: HTMLElement } => !!x);

  if (!sections.length) return;

  function updateTocActive() {
    let current: string | null = null;
    for (const { link, el } of sections) {
      if (el.getBoundingClientRect().top - SCROLL_OFFSET <= 0) {
        current = link.dataset.tocLink!;
      }
    }

    tocLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.tocLink === current);
    });

    let expandedSection: string | null = null;
    if (current) {
      expandedSection = childToParent.get(current) ?? (sectionIds.has(current) ? current : null);
    }

    root.querySelectorAll<HTMLElement>('[data-toc-section]').forEach((li) => {
      li.classList.toggle('is-expanded', li.dataset.tocSection === expandedSection);
    });
  }

  updateTocActive();
  window.addEventListener('scroll', updateTocActive, { passive: true });
  window.addEventListener('resize', updateTocActive);
}

export function initTestHubTocNav() {
  document
    .querySelectorAll<HTMLElement>(
      '.test-hub-sidebar, .test-hub-nav-sheet, .test-category-nav-sheet, .buying-guide-sidebar, .buying-guide-nav-sheet',
    )
    .forEach(initTestHubTocRoot);
}

initTestHubTocNav();
document.addEventListener('astro:page-load', initTestHubTocNav);
