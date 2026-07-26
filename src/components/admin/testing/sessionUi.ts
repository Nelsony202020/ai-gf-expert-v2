// Short labels for collapsed rows and table summaries.

import type { EntityRow } from '../api';
import type { RawValue } from './EvidenceInput';
import { testerQuestion } from './presentation';

export interface SessionItem {
  def: EntityRow;
  sub: EntityRow;
}

export type RowState = 'done' | 'na' | 'todo' | 'unsaved';

export function formatAnswerSummary(def: EntityRow, raw: RawValue | undefined, na: boolean): string {
  if (na) return 'N/A';
  if (!raw) return '—';
  if ('status' in raw) {
    if (raw.status === 'na') return 'N/A';
    if (raw.status === 'yes') return 'Yes';
    if (raw.status === 'no') return 'No';
    if (raw.status === 'limited') return 'Limited';
    if (raw.status === 'unknown') return 'Unknown';
    return String(raw.status);
  }
  if ('value' in raw) {
    const unit = def.unit ? ` ${def.unit}` : '';
    if (def.measurementType === 'percentage') return `${raw.value}%`;
    return `${raw.value}${unit}`;
  }
  if ('text' in raw) {
    const t = raw.text.trim();
    return t.length > 28 ? `${t.slice(0, 28)}…` : t || '—';
  }
  return '—';
}

export function rowState(
  def: EntityRow,
  draft: { raw: RawValue | undefined; na: boolean; dirty: boolean },
  result: EntityRow | undefined,
): RowState {
  if (draft.dirty) return 'unsaved';
  if (draft.na) return 'na';
  if (draft.raw !== undefined) return 'done';
  if (result && (result.rawValue || result.notApplicable)) return 'done';
  return 'todo';
}

export function statusDotClass(state: RowState): string {
  if (state === 'unsaved') return 'testing-status-dot testing-status-dot--unsaved';
  if (state === 'done') return 'testing-status-dot testing-status-dot--done';
  if (state === 'na') return 'testing-status-dot testing-status-dot--na';
  return 'testing-status-dot testing-status-dot--todo';
}

/** One-line label for collapsed / step summary rows. */
export function collapsedRowLabel(def: EntityRow, summary: string, state: RowState, categorySlug?: string): string {
  const q = testerQuestion(def, categorySlug);
  if (state === 'todo') return q;
  return `${q} — ${summary}`;
}
