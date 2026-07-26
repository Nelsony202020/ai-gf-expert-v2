// Auth state without @instantdb/react hooks — avoids duplicate-React "Invalid hook call"
// crashes in Astro islands (db.useAuth() internally calls React hooks from another copy).

import { useEffect, useState } from 'react';
import type { AuthState } from '@instantdb/core';
import type { getClientDb } from './instant';

type ClientDb = ReturnType<typeof getClientDb>;

const INITIAL: AuthState = { isLoading: true, user: undefined, error: undefined };

export function useInstantAuth(db: ClientDb): AuthState {
  const [state, setState] = useState<AuthState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setState({ isLoading: false, user: null, error: undefined });
      }
    }, 8000);

    const unsub = db.subscribeAuth((auth) => {
      if (cancelled) return;
      window.clearTimeout(timeout);
      if (auth.error) {
        setState({ isLoading: false, user: undefined, error: auth.error });
      } else {
        setState({ isLoading: false, user: auth.user ?? null, error: undefined });
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      unsub();
    };
  }, [db]);

  return state;
}
