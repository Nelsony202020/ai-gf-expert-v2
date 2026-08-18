import { aliasKey, glossaryMatchPhrases, type PublishedGlossaryTerm } from './types';
import { casingAllowsMatch } from './matchPolicy';

export interface GlossaryMatch {
  start: number;
  end: number;
  termId: string;
  phrase: string;
  term: string;
  anchor: string;
  tooltipDefinition: string;
  ctaLabel: string;
  aliases: string[];
  displayAliases: string[];
  category: string;
}

interface PhraseIndex {
  phrase: string;
  lower: string;
  term: PublishedGlossaryTerm;
}

function isWordChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return /[A-Za-z0-9]/.test(ch);
}

function isBoundary(text: string, start: number, end: number): boolean {
  const before = start > 0 ? text[start - 1] : undefined;
  const after = end < text.length ? text[end] : undefined;
  return !isWordChar(before) && !isWordChar(after);
}

/** Build longest-first phrase index for matching. */
export function buildPhraseIndex(terms: PublishedGlossaryTerm[]): PhraseIndex[] {
  const rows: PhraseIndex[] = [];
  const seen = new Set<string>();
  for (const term of terms) {
    for (const phrase of glossaryMatchPhrases(term)) {
      const key = aliasKey(phrase);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ phrase, lower: key, term });
    }
  }
  rows.sort((a, b) => b.phrase.length - a.phrase.length || a.phrase.localeCompare(b.phrase));
  return rows;
}

/**
 * Find non-overlapping glossary matches in plain text.
 * Longest phrase wins; whole-word/phrase boundaries.
 * Everyday single-word terms (Steps, Temperature, …) require exact casing.
 */
export function findGlossaryMatches(text: string, terms: PublishedGlossaryTerm[]): GlossaryMatch[] {
  if (!text || terms.length === 0) return [];
  const index = buildPhraseIndex(terms);
  const lower = text.toLowerCase();
  const taken = new Array<boolean>(text.length).fill(false);
  const matches: GlossaryMatch[] = [];

  for (const row of index) {
    const needle = row.lower;
    if (!needle) continue;
    let from = 0;
    while (from < lower.length) {
      const at = lower.indexOf(needle, from);
      if (at < 0) break;
      const end = at + needle.length;
      from = at + 1;
      if (!isBoundary(text, at, end)) continue;
      if (!casingAllowsMatch(text, at, end, row.phrase)) continue;
      let overlap = false;
      for (let i = at; i < end; i++) {
        if (taken[i]) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;
      for (let i = at; i < end; i++) taken[i] = true;
      matches.push({
        start: at,
        end,
        termId: row.term.id,
        phrase: text.slice(at, end),
        term: row.term.term,
        anchor: row.term.anchor,
        tooltipDefinition: row.term.tooltipDefinition,
        ctaLabel: row.term.ctaLabel,
        aliases: row.term.aliases ?? [],
        displayAliases: row.term.displayAliases ?? [],
        category: row.term.category || 'General',
      });
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

/** Count raw occurrences of term/aliases in text (overlapping allowed for admin usage). */
export function countGlossaryOccurrences(text: string, term: PublishedGlossaryTerm): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let total = 0;
  for (const phrase of glossaryMatchPhrases(term)) {
    const needle = aliasKey(phrase);
    if (!needle) continue;
    let from = 0;
    while (from < lower.length) {
      const at = lower.indexOf(needle, from);
      if (at < 0) break;
      const end = at + needle.length;
      from = at + 1;
      if (!isBoundary(text, at, end)) continue;
      if (!casingAllowsMatch(text, at, end, phrase)) continue;
      total += 1;
    }
  }
  return total;
}
