import {
  createGlossaryDecorateState,
  decorateGlossaryPlainText,
  setGlossarySection,
} from './decorate';
import { findGlossaryMatches } from './match';
import type { PublishedGlossaryTerm } from './types';

/**
 * Hard rule: glossary tooltips only appear in prose `<p>` content.
 * Never site chrome, headings, tables, bullets, at-a-glance, compare, or pros/cons.
 */
const REJECT_ROOT_SELECTOR = [
  'nav',
  'aside',
  'ul',
  'ol',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'dl',
  'dt',
  'dd',
  'button',
  'summary',
  'label',
  'figcaption',
  'script',
  'style',
  'noscript',
  'svg',
  'a',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  '[data-glossary-skip]',
  '[data-glossary-trigger]',
  '.glossary-trigger',
  '.roundup-at-glance',
  '.roundup-compare',
  '.roundup-pros-cons',
  '.roundup-faq__header',
  '.roundup-faq__question-row',
  '.roundup-faq__answer-list',
  '.roundup-sidebar',
  '.site-header',
  '#site-header',
  '[data-site-header]',
].join(', ');

function isRejectedRoot(el: Element): boolean {
  return el.matches(REJECT_ROOT_SELECTOR);
}

/** Only decorate text that lives inside a prose `<p>` outside rejected chrome. */
function isAllowedParagraphText(textNode: Text): boolean {
  const parent = textNode.parentElement;
  if (!parent) return false;
  if (parent.closest('[data-glossary-trigger], .glossary-trigger, [data-glossary-skip]')) {
    return false;
  }

  const paragraph = parent.closest('p');
  if (!paragraph) return false;
  if (paragraph.closest(REJECT_ROOT_SELECTOR)) return false;

  return true;
}

/**
 * Walk text nodes under `root` and wrap the first glossary match per term per H2 section.
 * Hard rule: only inside prose `<p>` — never headers, tables, bullets, or site chrome.
 */
export function decorateGlossaryDom(root: ParentNode, terms: PublishedGlossaryTerm[]): number {
  if (!root || terms.length === 0) return 0;

  const state = createGlossaryDecorateState();
  const jobs: Array<{ node: Text; sectionKey: string }> = [];
  let sectionKey = '';

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.tagName === 'H2') {
          sectionKey = el.id || el.textContent?.trim() || '';
          return NodeFilter.FILTER_REJECT;
        }
        if (isRejectedRoot(el)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_SKIP;
      }
      const text = node.nodeValue ?? '';
      if (!text.trim()) return NodeFilter.FILTER_REJECT;
      if (!isAllowedParagraphText(node as Text)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      jobs.push({ node: current as Text, sectionKey });
    }
    current = walker.nextNode();
  }

  let placed = 0;
  for (const job of jobs) {
    if (!isAllowedParagraphText(job.node)) continue;

    const text = job.node.nodeValue ?? '';
    if (!findGlossaryMatches(text, terms).length) continue;

    setGlossarySection(state, job.sectionKey);
    const html = decorateGlossaryPlainText(text, terms, state);
    if (!html.includes('data-glossary-trigger')) continue;

    const wrap = document.createElement('span');
    wrap.innerHTML = html;
    const frag = document.createDocumentFragment();
    while (wrap.firstChild) frag.appendChild(wrap.firstChild);
    job.node.replaceWith(frag);
    placed += 1;
  }

  return placed;
}
