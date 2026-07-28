// Migrate legacy browsing answers (free text / structured) to Yes/No + internal note.

import type { EntityRow } from '../api';
import type { RawValue } from './EvidenceInput';

type DraftSlice = {
  raw: RawValue | undefined;
  internalNotes: string;
};

export function migrateBrowsingDraft(
  def: EntityRow | undefined,
  draft: DraftSlice,
): DraftSlice {
  if (!def || String(def.slug) !== 'browsing') return draft;

  const raw = draft.raw;
  if (!raw) return draft;

  if ('status' in raw && (raw.status === 'yes' || raw.status === 'no')) {
    return draft;
  }

  if ('text' in raw && raw.text.trim()) {
    const text = raw.text.trim();
    return {
      raw: { status: 'yes' },
      internalNotes: draft.internalNotes.trim() || text,
    };
  }

  if ('value' in raw || 'structured' in raw) {
    const parts: string[] = [];
    if ('value' in raw) parts.push(`Legacy score: ${raw.value}`);
    if ('structured' in raw) parts.push(JSON.stringify(raw.structured));
    return {
      raw: { status: 'yes' },
      internalNotes: draft.internalNotes.trim() || parts.join('\n') || 'Migrated from legacy browsing answer',
    };
  }

  return draft;
}
