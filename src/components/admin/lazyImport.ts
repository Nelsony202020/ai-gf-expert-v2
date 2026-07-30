import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type ImportFactory<T> = () => Promise<{ default: T }>;

function debugLog(location: string, message: string, data: Record<string, unknown>, hypothesisId: string) {
  // #region agent log
  fetch('http://127.0.0.1:7312/ingest/3642bd41-13da-4f13-9a24-64f7a557b0e1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '28e868' },
    body: JSON.stringify({
      sessionId: '28e868',
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

/** Lazy import with one retry — helps recover from stale Vite HMR module URLs in dev. */
export function lazyImport<T extends ComponentType<any>>(
  factory: ImportFactory<T>,
  label: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    debugLog('lazyImport.ts:start', 'lazy import started', { label }, 'H1');
    try {
      const mod = await factory();
      debugLog('lazyImport.ts:success', 'lazy import succeeded', { label }, 'H1');
      return mod;
    } catch (firstError) {
      const firstMsg = firstError instanceof Error ? firstError.message : String(firstError);
      debugLog('lazyImport.ts:retry', 'lazy import failed, retrying', { label, error: firstMsg }, 'H1');
      await new Promise((r) => setTimeout(r, 250));
      try {
        const mod = await factory();
        debugLog('lazyImport.ts:success-retry', 'lazy import succeeded on retry', { label }, 'H1');
        return mod;
      } catch (secondError) {
        const secondMsg = secondError instanceof Error ? secondError.message : String(secondError);
        debugLog('lazyImport.ts:fail', 'lazy import failed after retry', { label, error: secondMsg }, 'H2');
        throw secondError;
      }
    }
  });
}
