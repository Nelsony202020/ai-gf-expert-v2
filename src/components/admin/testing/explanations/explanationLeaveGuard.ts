import { confirmLeaveReview } from './ExplanationEditor';

export interface ExplanationLeaveGuardState {
  needsReviewCount: number;
  editorDirty: boolean;
}

let activeGuard: ExplanationLeaveGuardState | null = null;

export function setExplanationLeaveGuard(state: ExplanationLeaveGuardState | null) {
  activeGuard = state;
}

function workspaceTabFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/products\/[^/]+\/([^/?#]+)/);
  return m?.[1] ?? null;
}

/** True when explanations panel is open and navigation should prompt before leaving Testing. */
export function shouldBlockWorkspaceNavigation(nextPath: string): boolean {
  if (!activeGuard) return false;
  if (activeGuard.needsReviewCount === 0 && !activeGuard.editorDirty) return false;

  const nextTab = workspaceTabFromPath(nextPath);
  // Allow any navigation that stays on the testing tab (search params only).
  if (nextTab === 'testing') return false;

  return true;
}

/** Returns true if navigation should proceed. */
export function confirmLeaveExplanationsIfNeeded(nextPath: string): boolean {
  if (!shouldBlockWorkspaceNavigation(nextPath)) return true;
  if (!activeGuard) return true;
  return confirmLeaveReview({
    dirty: activeGuard.editorDirty,
    needsReviewCount: activeGuard.needsReviewCount,
  });
}
