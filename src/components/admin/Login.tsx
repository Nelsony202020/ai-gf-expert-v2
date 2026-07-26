// Magic-code login for the admin panel.

import { useState } from 'react';
import type { getClientDb } from './instant';
import { AdminLogo } from './AdminLogo';
import { Button, TextInput, ErrorNote } from './ui';

export function Login({ db }: { db: ReturnType<typeof getClientDb> }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email });
      setStage('code');
    } catch (err: any) {
      setError(err?.body?.message ?? err.message ?? 'Failed to send code');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email, code });
    } catch (err: any) {
      setError(err?.body?.message ?? err.message ?? 'Invalid code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3">
            <AdminLogo variant="login" />
          </div>
          <h1 className="text-lg font-bold">Admin sign-in</h1>
          <p className="mt-1 text-sm text-slate-500">
            {stage === 'email'
              ? 'Enter your email to receive a one-time code.'
              : `We sent a code to ${email}.`}
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorNote message={error} />
          </div>
        )}

        {stage === 'email' ? (
          <form onSubmit={sendCode} className="space-y-3">
            <TextInput
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Button type="submit" disabled={busy || !email} className="w-full justify-center">
              {busy ? 'Sending…' : 'Send code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <TextInput
              inputMode="numeric"
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            <Button type="submit" disabled={busy || !code} className="w-full justify-center">
              {busy ? 'Verifying…' : 'Sign in'}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-slate-500 hover:underline"
              onClick={() => setStage('email')}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
