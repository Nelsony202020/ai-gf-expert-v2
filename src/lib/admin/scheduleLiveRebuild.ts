/** Debounced client helper: rebuild the static live site after InstantDB edits. */

import { api } from '../../components/admin/api';

const COALESCE_MS = 45_000;

let timer: ReturnType<typeof setTimeout> | null = null;
let lastReason = 'content updated';

export type RebuildScheduleResult = {
  rebuildTriggered: boolean;
};

/**
 * Queue a live-site rebuild. Returns a promise that resolves when the request fires.
 * `rebuildTriggered: false` means InstantDB was saved but VERCEL_DEPLOY_HOOK_URL is missing.
 */
export function scheduleLiveRebuild(reason: string): Promise<RebuildScheduleResult> {
  if (typeof window === 'undefined') return Promise.resolve({ rebuildTriggered: false });
  lastReason = reason;
  if (timer) clearTimeout(timer);
  return new Promise((resolve) => {
    timer = setTimeout(() => {
      timer = null;
      void api
        .post<{ ok?: boolean; rebuildTriggered?: boolean }>('/api/admin/rebuild', { reason: lastReason })
        .then((res) => resolve({ rebuildTriggered: Boolean(res?.rebuildTriggered) }))
        .catch(() => resolve({ rebuildTriggered: false }));
    }, COALESCE_MS);
  });
}

/** Fire soon (e.g. tab hide / explicit publish-to-live). Still coalesces rapid calls. */
export function flushLiveRebuild(reason: string): Promise<RebuildScheduleResult> {
  if (typeof window === 'undefined') return Promise.resolve({ rebuildTriggered: false });
  lastReason = reason;
  if (timer) clearTimeout(timer);
  return new Promise((resolve) => {
    timer = setTimeout(() => {
      timer = null;
      void api
        .post<{ ok?: boolean; rebuildTriggered?: boolean }>('/api/admin/rebuild', { reason: lastReason })
        .then((res) => resolve({ rebuildTriggered: Boolean(res?.rebuildTriggered) }))
        .catch(() => resolve({ rebuildTriggered: false }));
    }, 2_000);
  });
}
