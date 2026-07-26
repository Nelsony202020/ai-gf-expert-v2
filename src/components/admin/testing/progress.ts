// Tester-facing progress counts. The scoring engine still tracks all 144
// evidence definitions — these helpers describe how much work the tester
// actually does (sessions, grids, standalone questions).

import { WORKSHEETS } from './worksheets';

/** How many things a tester fills in for one session (1 grid counts as 1). */
export function sessionInputCount(sessionId: string, evidenceCount: number): number {
  const worksheet = WORKSHEETS[sessionId];
  if (!worksheet) return evidenceCount;
  const covered = worksheet.columns.length;
  const standalone = Math.max(0, evidenceCount - covered);
  return standalone + 1; // one worksheet grid + any questions outside it
}

export function totalSessionInputs(
  sessions: { session: { id: string }; items: unknown[] }[],
): number {
  return sessions.reduce((sum, s) => sum + sessionInputCount(s.session.id, s.items.length), 0);
}

/** A session is done when every evidence definition in it has a result. */
export function sessionComplete(
  items: { def: { id: string } }[],
  hasValue: (defId: string) => boolean,
): boolean {
  return items.length > 0 && items.every(({ def }) => hasValue(def.id));
}
