import type { PublishedGlossaryTerm } from './types';
import { glossaryOtherNamesText, resolveGlossaryCtaLabel } from './types';
import { findGlossaryMatches } from './match';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface GlossaryDecorateState {
  /** termId → set of section keys that already received a tooltip */
  usedInSection: Map<string, Set<string>>;
  /** Current major section key (H2). Empty string = page-level fallback. */
  sectionKey: string;
}

export function createGlossaryDecorateState(): GlossaryDecorateState {
  return { usedInSection: new Map(), sectionKey: '' };
}

export function setGlossarySection(state: GlossaryDecorateState, sectionKey: string) {
  state.sectionKey = sectionKey || '';
}

function canPlace(state: GlossaryDecorateState, termId: string): boolean {
  const section = state.sectionKey || '__page__';
  let set = state.usedInSection.get(termId);
  if (!set) {
    set = new Set();
    state.usedInSection.set(termId, set);
  }
  if (set.has(section)) return false;
  set.add(section);
  return true;
}

function triggerHtml(match: {
  phrase: string;
  termId: string;
  term: string;
  anchor: string;
  tooltipDefinition: string;
  ctaLabel: string;
  aliases: string[];
  displayAliases: string[];
  category: string;
}): string {
  const phrase = escapeHtml(match.phrase);
  const term = escapeHtml(match.term);
  const anchor = escapeHtml(match.anchor);
  const tip = escapeHtml(match.tooltipDefinition);
  const cta = escapeHtml(resolveGlossaryCtaLabel(match.ctaLabel));
  const otherNames = escapeHtml(
    glossaryOtherNamesText(match.term, match.aliases, match.displayAliases),
  );
  const id = escapeHtml(match.termId);
  const category = escapeHtml(match.category || 'General');
  return (
    `<button type="button" class="glossary-trigger" data-glossary-trigger ` +
    `data-glossary-id="${id}" data-glossary-term="${term}" data-glossary-anchor="${anchor}" ` +
    `data-glossary-definition="${tip}" data-glossary-cta="${cta}" ` +
    `data-glossary-also-called="${otherNames}" data-glossary-category="${category}" ` +
    `aria-expanded="false" aria-label="Define ${term}">` +
    `${phrase}</button>`
  );
}

/**
 * Decorate plain text with glossary triggers (first occurrence per section per term).
 * Input must be raw text (not HTML). Output is safe HTML fragments.
 */
export function decorateGlossaryPlainText(
  text: string,
  terms: PublishedGlossaryTerm[],
  state: GlossaryDecorateState,
): string {
  if (!text || terms.length === 0) return escapeHtml(text);
  const matches = findGlossaryMatches(text, terms);
  if (matches.length === 0) return escapeHtml(text);

  let out = '';
  let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) continue;
    out += escapeHtml(text.slice(cursor, match.start));
    if (canPlace(state, match.termId)) {
      out += triggerHtml(match);
    } else {
      out += escapeHtml(match.phrase);
    }
    cursor = match.end;
  }
  out += escapeHtml(text.slice(cursor));
  return out;
}
