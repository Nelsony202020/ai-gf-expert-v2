// Client-only skip markers for guided testing (navigation UX — not persisted to DB).

const KEY_PREFIX = 'testing-skipped-sessions:';

function storageKey(runId: string): string {
  return `${KEY_PREFIX}${runId}`;
}

export function sessionKey(categorySlug: string, sessionId: string): string {
  return `${categorySlug}:${sessionId}`;
}

export function readSkippedSessions(runId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(runId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

export function writeSkippedSessions(runId: string, keys: Set<string>): void {
  try {
    if (keys.size === 0) localStorage.removeItem(storageKey(runId));
    else localStorage.setItem(storageKey(runId), JSON.stringify([...keys]));
  } catch {
    /* quota / private mode */
  }
}

export function markSessionSkipped(runId: string, key: string): Set<string> {
  const next = readSkippedSessions(runId);
  next.add(key);
  writeSkippedSessions(runId, next);
  return next;
}

export function unmarkSessionSkipped(runId: string, key: string): Set<string> {
  const next = readSkippedSessions(runId);
  next.delete(key);
  writeSkippedSessions(runId, next);
  return next;
}
