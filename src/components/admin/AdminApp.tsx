// Admin panel root: InstantDB magic-code auth + role-gated React app.

import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { getClientDb } from './instant';
import { useInstantAuth } from './useInstantAuth';
import { api, setRefreshToken } from './api';
import { Login } from './Login';
import { AdminLayout } from './Layout';
import { AdminErrorBoundary } from './ErrorBoundary';
import { MeContext, type Me } from './context';
import { ToastProvider } from './Toast';
import { Spinner, ErrorNote } from './ui';

export default function AdminApp({ appId }: { appId: string }) {
  const db = getClientDb(appId);
  const { isLoading, user, error } = useInstantAuth(db);
  const [me, setMe] = useState<Me | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user) {
      setMe(null);
      setMeError(null);
      setRefreshToken(null);
      return;
    }
    setRefreshToken(user.refresh_token);
    setMeError(null);
    setChecking(true);
    api
      .get<Me>('/api/admin/me')
      .then(setMe)
      .catch((e) => {
        setMeError(e.message);
      })
      .finally(() => setChecking(false));
  }, [user?.id, user?.refresh_token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <Spinner />
      </div>
    );
  }
  if (error) return <div className="p-8"><ErrorNote message={error.message} /></div>;
  if (!user) return <Login db={db} />;
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <Spinner />
      </div>
    );
  }

  if (meError || !me) {
    return (
      <div className="mx-auto mt-16 max-w-md space-y-4 p-4">
        <ErrorNote
          message={
            meError?.includes('Cannot reach InstantDB') ||
            meError?.includes('InstantDB is not configured')
              ? `${meError} Stop other dev servers and run \`npm run dev\` — it now clears stale ports and always uses http://localhost:4321/admin.`
              : meError?.includes('Not authenticated') || meError?.includes('403')
                ? 'This account does not have admin access.'
                : meError ?? 'This account does not have admin access.'
          }
        />
        <p className="text-sm text-slate-500">
          Signed in as <strong>{user.email}</strong>. Admin accounts are provisioned by the owner
          (or via <code>ADMIN_OWNER_EMAIL</code> in .env for the first login).
        </p>
        <button
          className="text-sm font-medium text-pink-600 hover:underline"
          onClick={() => db.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
      <MeContext.Provider value={me}>
        <ToastProvider>
          <BrowserRouter basename="/admin">
            <AdminLayout onSignOut={() => db.auth.signOut()} />
          </BrowserRouter>
        </ToastProvider>
      </MeContext.Provider>
    </AdminErrorBoundary>
  );
}

// Re-export hooks for backwards compatibility with existing imports.
export { useMe, useCan, type Me } from './context';
