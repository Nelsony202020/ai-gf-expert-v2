// Ephemeral toasts (bottom-right) + inbox history shown in the notification bell.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import './toast.css';
import { useAsync } from './ui';
import { Icon } from './ui';

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ToastInboxItem {
  id: string;
  severity: ToastSeverity;
  title: string;
  message?: string;
  createdAt: number;
  read: boolean;
  actionUrl?: string;
}

interface ActiveToast extends ToastInboxItem {
  exiting?: boolean;
  durationMs: number;
}

interface ToastOptions {
  message?: string;
  actionUrl?: string;
  /** Default 3000ms */
  durationMs?: number;
}

interface ToastContextValue {
  toast: (severity: ToastSeverity, title: string, options?: ToastOptions) => void;
  inbox: ToastInboxItem[];
  unreadInboxCount: number;
  markInboxRead: (id: string) => void;
  markAllInboxRead: () => void;
  dismissInbox: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const SEVERITY_STYLES: Record<
  ToastSeverity,
  { bar: string; bg: string; border: string; icon: string; iconClass: string }
> = {
  info: {
    bar: 'bg-blue-500',
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    icon: 'info',
    iconClass: 'text-blue-400',
  },
  success: {
    bar: 'bg-green-500',
    bg: 'bg-slate-900',
    border: 'border-green-800/60',
    icon: 'check_circle',
    iconClass: 'text-green-400',
  },
  warning: {
    bar: 'bg-amber-500',
    bg: 'bg-slate-900',
    border: 'border-amber-800/60',
    icon: 'warning',
    iconClass: 'text-amber-400',
  },
  error: {
    bar: 'bg-red-500',
    bg: 'bg-slate-900',
    border: 'border-red-800/60',
    icon: 'error',
    iconClass: 'text-red-400',
  },
};

const DEFAULT_DURATION = 6500;
const EXIT_ANIMATION_MS = 450;
const INBOX_KEY = 'admin-toast-inbox-v1';
const MAX_INBOX = 50;

function loadInbox(): ToastInboxItem[] {
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ToastInboxItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_INBOX) : [];
  } catch {
    return [];
  }
}

function saveInbox(items: ToastInboxItem[]) {
  try {
    localStorage.setItem(INBOX_KEY, JSON.stringify(items.slice(0, MAX_INBOX)));
  } catch {
    // ignore quota errors
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveToast[]>([]);
  const [inbox, setInbox] = useState<ToastInboxItem[]>(() => loadInbox());
  const timers = useRef<Map<string, number>>(new Map());

  const persistInbox = useCallback((updater: (prev: ToastInboxItem[]) => ToastInboxItem[]) => {
    setInbox((prev) => {
      const next = updater(prev);
      saveInbox(next);
      return next;
    });
  }, []);

  const dismissActive = useCallback((id: string) => {
    setActive((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    window.setTimeout(() => {
      setActive((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (severity: ToastSeverity, title: string, options?: ToastOptions) => {
      const id = crypto.randomUUID();
      const duration = options?.durationMs ?? DEFAULT_DURATION;
      const item: ActiveToast = {
        id,
        severity,
        title,
        message: options?.message,
        actionUrl: options?.actionUrl,
        createdAt: Date.now(),
        read: false,
        durationMs: duration,
      };
      setActive((prev) => [...prev, item]);

      const timer = window.setTimeout(() => {
        dismissActive(id);
        persistInbox((prev) => [{ ...item, read: false }, ...prev.filter((x) => x.id !== id)]);
      }, duration);
      timers.current.set(id, timer);
    },
    [dismissActive, persistInbox],
  );

  const markInboxRead = useCallback(
    (id: string) => {
      persistInbox((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [persistInbox],
  );

  const markAllInboxRead = useCallback(() => {
    persistInbox((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [persistInbox]);

  const dismissInbox = useCallback(
    (id: string) => {
      persistInbox((prev) => prev.filter((n) => n.id !== id));
    },
    [persistInbox],
  );

  useEffect(() => {
    return () => {
      for (const t of timers.current.values()) clearTimeout(t);
    };
  }, []);

  const unreadInboxCount = useMemo(() => inbox.filter((n) => !n.read).length, [inbox]);

  const value = useMemo(
    () => ({ toast, inbox, unreadInboxCount, markInboxRead, markAllInboxRead, dismissInbox }),
    [toast, inbox, unreadInboxCount, markInboxRead, markAllInboxRead, dismissInbox],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={active} onDismiss={dismissActive} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast outside ToastProvider');
  return {
    toast: ctx.toast,
    info: (title: string, opts?: ToastOptions) => ctx.toast('info', title, opts),
    success: (title: string, opts?: ToastOptions) => ctx.toast('success', title, opts),
    warning: (title: string, opts?: ToastOptions) => ctx.toast('warning', title, opts),
    error: (title: string, opts?: ToastOptions) => ctx.toast('error', title, opts),
  };
}

export function useToastInbox() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastInbox outside ToastProvider');
  return ctx;
}

/** Like useAsync, but surfaces errors as bottom-right toasts instead of inline banners. */
export function useAsyncToast() {
  const toast = useToast();
  const { error, setError, busy, run } = useAsync();

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError, toast]);

  return { error, setError, busy, run };
}

/** Toast a string error once, then clear it via the provided callback. */
export function useToastError(error: string | null, clear: () => void) {
  const toast = useToast();
  useEffect(() => {
    if (error) {
      toast.error(error);
      clear();
    }
  }, [error, clear, toast]);
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ActiveToast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-md flex-col gap-3"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ActiveToast; onDismiss: () => void }) {
  const meta = SEVERITY_STYLES[toast.severity];

  return (
    <div
      className={`pointer-events-auto overflow-hidden rounded-xl border shadow-2xl ${meta.bg} ${meta.border} ${
        toast.exiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3 px-4 py-4">
        <Icon name={meta.icon} className={`mt-0.5 !text-[22px] shrink-0 ${meta.iconClass}`} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-snug text-white">{toast.title}</p>
          {toast.message && (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{toast.message}</p>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:text-white"
          onClick={onDismiss}
        >
          <Icon name="close" className="!text-[18px]" />
        </button>
      </div>
      <div className="h-1 w-full bg-slate-800">
        <div
          className={`h-full ${meta.bar} animate-toast-timer origin-left`}
          style={{ animationDuration: `${toast.durationMs}ms` }}
        />
      </div>
    </div>
  );
}
