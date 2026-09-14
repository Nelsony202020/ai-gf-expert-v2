import { extractPlainTextFromTipTap, type GlossaryEntryRecord } from './types';

/** Other published terms mentioned in this entry’s copy. */
export function relatedGlossaryTerms(
  entry: GlossaryEntryRecord,
  all: GlossaryEntryRecord[],
): Array<{ term: string; anchor: string }> {
  const hay = [
    entry.term,
    entry.tooltipDefinition,
    extractPlainTextFromTipTap(entry.fullDefinition),
    ...(entry.aliases ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return all
    .filter((other) => {
      if (other.id === entry.id) return false;
      const phrases = [other.term, ...(other.aliases ?? [])]
        .map((p) => p.trim().toLowerCase())
        .filter((p) => p.length >= 3);
      return phrases.some((phrase) => {
        const idx = hay.indexOf(phrase);
        if (idx < 0) return false;
        const before = idx === 0 ? '' : hay[idx - 1];
        const after = hay[idx + phrase.length] ?? '';
        const bound = (ch: string) => !ch || /[^a-z0-9]/.test(ch);
        return bound(before) && bound(after);
      });
    })
    .map((other) => ({ term: other.term, anchor: other.anchor }));
}
