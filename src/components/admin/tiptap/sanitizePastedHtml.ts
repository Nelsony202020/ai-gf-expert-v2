/** Sanitize HTML from Google Docs / Word / browsers into a TipTap-friendly subset. */

const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'A',
  'UL',
  'OL',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'DIV',
  'IMG',
]);

function unwrapElement(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function normalizeHeading(el: HTMLElement, minLevel: number, maxLevel: number) {
  const level = Number(el.tagName.slice(1));
  const nextLevel = Math.min(maxLevel, Math.max(minLevel, level));
  const next = `H${nextLevel}`;
  if (el.tagName === next) return;
  const replacement = document.createElement(next.toLowerCase());
  while (el.firstChild) replacement.appendChild(el.firstChild);
  el.replaceWith(replacement);
}

/**
 * Keep structure TipTap can represent; strip Google Docs / Word presentation junk
 * (fonts, colors, spans, classes, inline styles) while preserving paragraphs,
 * headings, bold/italic, lists, and links.
 */
export function sanitizePastedHtml(
  html: string,
  opts?: { preserveImages?: boolean; minHeading?: 2 | 3; maxHeading?: 3 | 4 },
): string {
  if (!html || typeof document === 'undefined') return html;
  const preserveImages = opts?.preserveImages === true;
  const minHeading = opts?.minHeading ?? 3;
  const maxHeading = opts?.maxHeading ?? 4;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.body;

  // Remove comments and non-content nodes.
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  const comments: Comment[] = [];
  while (walker.nextNode()) comments.push(walker.currentNode as Comment);
  for (const c of comments) c.remove();

  const all = Array.from(root.querySelectorAll('*'));
  for (const el of all) {
    const tag = el.tagName;

    if (tag === 'META' || tag === 'STYLE' || tag === 'SCRIPT' || tag === 'XML' || tag === 'O:P') {
      el.remove();
      continue;
    }

    if (tag === 'IMG' && !preserveImages) {
      el.remove();
      continue;
    }

    // Strip presentation attributes everywhere.
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name === 'href' && tag === 'A') continue;
      if (tag === 'IMG' && (name === 'src' || name === 'alt' || name === 'data-media-id')) continue;
      if (name === 'style' || name === 'class' || name === 'id' || name.startsWith('data-')) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (
        name === 'face' ||
        name === 'size' ||
        name === 'color' ||
        name === 'bgcolor' ||
        name === 'align' ||
        name.startsWith('xmlns')
      ) {
        el.removeAttribute(attr.name);
      }
    }

    if (tag === 'SPAN' || tag === 'FONT') {
      unwrapElement(el);
      continue;
    }

    if (/^H[1-6]$/.test(tag)) {
      normalizeHeading(el as HTMLElement, minHeading, maxHeading);
      continue;
    }

    if (tag === 'DIV') {
      // Prefer paragraphs for block divs with text.
      const replacement = document.createElement('p');
      while (el.firstChild) replacement.appendChild(el.firstChild);
      el.replaceWith(replacement);
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      unwrapElement(el);
    }
  }

  // Normalize <b>/<i> → strong/em for TipTap marks.
  root.querySelectorAll('b').forEach((el) => {
    const strong = document.createElement('strong');
    while (el.firstChild) strong.appendChild(el.firstChild);
    el.replaceWith(strong);
  });
  root.querySelectorAll('i').forEach((el) => {
    const em = document.createElement('em');
    while (el.firstChild) em.appendChild(el.firstChild);
    el.replaceWith(em);
  });

  return root.innerHTML;
}
