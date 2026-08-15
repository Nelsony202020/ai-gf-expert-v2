/** Debounced client helper: rebuild the static live site after InstantDB edits. */

import { api } from '../../components/admin/api';

const COALESCE_MS = 45_000;

let timer: ReturnType<typeof setTimeout> | null = null;
let lastReason = 'content updated';

export function scheduleLiveRebuild(reason: string): void {
  if (typeof window === 'undefined') return;
  lastReason = reason;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void api.post('/api/admin/rebuild', { reason: lastReason }).catch(() => {
      /* rebuild is best-effort; admin toast not required */
    });
  }, COALESCE_MS);
}

/** Fire soon (e.g. tab hide / explicit publish-to-live). Still coalesces rapid calls. */
export function flushLiveRebuild(reason: string): void {
  if (typeof window === 'undefined') return;
  lastReason = reason;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void api.post('/api/admin/rebuild', { reason: lastReason }).catch(() => {});
  }, 2_000);
}
