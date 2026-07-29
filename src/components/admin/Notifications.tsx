// Admin notification bell + right-side drawer. Notifications are
// system-generated (see /api/cron/notifications) and deduplicated server-side;
// read/dismiss state is per-admin. Clicking a notification marks it read and
// deep-links to the screen where the issue can be fixed.

import { DRAWER_UNMOUNT_MS } from '../../lib/drawer/animate';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';
import { useToastInbox } from './Toast';
import { Badge, Button, DrawerCloseButton, Icon } from './ui';

interface NotificationRow {
  id: string;
  category: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string | null;
  productId: string | null;
  actionUrl: string | null;
  occurrenceCount: number;
  createdAt: number;
  updatedAt: number;
  read: boolean;
}

const SEVERITY_META: Record<string, { icon: string; className: string }> = {
  info: { icon: 'info', className: 'text-blue-500' },
  success: { icon: 'check_circle', className: 'text-green-500' },
  warning: { icon: 'warning', className: 'text-amber-500' },
  critical: { icon: 'error', className: 'text-red-500' },
};

const CATEGORIES = ['pricing', 'testing', 'publishing', 'affiliates', 'seo', 'system'] as const;

const POLL_MS = 60_000;

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

export function NotificationBell({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [serverUnread, setServerUnread] = useState(0);
  const { unreadInboxCount } = useToastInbox();
  const unreadCount = serverUnread + unreadInboxCount;

  const refreshCount = useCallback(async () => {
    try {
      const data = await api.get<{ unreadCount: number }>('/api/admin/notifications?filter=unread');
      setServerUnread(data.unreadCount);
    } catch {
      // Silent: the bell must never break the admin shell.
    }
  }, []);

  useEffect(() => {
    void refreshCount();
    const t = window.setInterval(() => void refreshCount(), POLL_MS);
    return () => window.clearInterval(t);
  }, [refreshCount]);

  function openDrawer() {
    setMounted(true);
    requestAnimationFrame(() => setVisible(true));
  }

  function closeDrawer() {
    setVisible(false);
    window.setTimeout(() => {
      setMounted(false);
      void refreshCount();
    }, DRAWER_UNMOUNT_MS);
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        title={compact ? 'Notifications' : undefined}
        className={`relative flex items-center rounded-lg text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 ${
          compact ? 'mx-auto justify-center p-2' : 'w-full gap-2 px-2.5 py-2'
        }`}
        onClick={openDrawer}
      >
        <Icon name="notifications" className="!text-[18px]" />
        {!compact && <span className="flex-1 text-left">Notifications</span>}
        {unreadCount > 0 && (
          <span
            className={`flex items-center justify-center rounded-full bg-pink-600 text-[11px] font-bold text-white ${
              compact
                ? 'absolute -right-0.5 -top-0.5 h-4 min-w-4 px-0.5'
                : 'h-5 min-w-5 px-1.5'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {mounted && <NotificationDrawer visible={visible} onClose={closeDrawer} />}
    </>
  );
}

function NotificationDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { inbox, markInboxRead, markAllInboxRead, dismissInbox } = useToastInbox();
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [category, setCategory] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ filter });
      if (category) params.set('category', category);
      const data = await api.get<{ rows: NotificationRow[] }>(
        `/api/admin/notifications?${params.toString()}`,
      );
      setRows(data.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filter, category]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function act(id: string, action: 'read' | 'unread' | 'dismiss') {
    try {
      await api.post('/api/admin/notifications', { action, id });
      if (action === 'dismiss' || (action === 'read' && filter === 'unread')) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      } else if (action === 'read') {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, read: true } : r)));
      } else if (action === 'unread') {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, read: false } : r)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function readAll() {
    try {
      await api.post('/api/admin/notifications', { action: 'readAll' });
      if (filter === 'unread') setRows([]);
      else setRows((prev) => prev.map((r) => ({ ...r, read: true })));
      markAllInboxRead();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function openNotification(n: NotificationRow) {
    if (!n.read) void act(n.id, 'read');
    if (n.actionUrl) {
      onClose();
      navigate(n.actionUrl);
    }
  }

  const visibleInbox = filter === 'unread' ? inbox.filter((n) => !n.read) : inbox;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Notifications">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden rounded-l-[10px] border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-900 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
          <span className="flex-1" />
          <Button variant="ghost" className="!py-1 text-xs" onClick={() => void readAll()}>
            Mark all read
          </Button>
          <DrawerCloseButton onClick={onClose} ariaLabel="Close notifications" />
        </div>

        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
          <div className="flex rounded-md border border-slate-200 p-0.5 text-xs dark:border-slate-700">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`rounded px-2 py-0.5 font-medium capitalize ${
                  filter === f
                    ? 'bg-pink-600 text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
          {visibleInbox.length > 0 && (
            <ul className="divide-y divide-slate-100 border-b border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              {visibleInbox.map((n) => {
                const meta = SEVERITY_META[n.severity] ?? SEVERITY_META.info;
                return (
                  <li key={n.id} className={n.read ? 'opacity-70' : ''}>
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex w-full cursor-pointer items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      onClick={() => {
                        markInboxRead(n.id);
                        if (n.actionUrl) {
                          onClose();
                          navigate(n.actionUrl);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          markInboxRead(n.id);
                          if (n.actionUrl) {
                            onClose();
                            navigate(n.actionUrl);
                          }
                        }
                      }}
                    >
                      <Icon name={meta.icon} className={`mt-0.5 !text-[18px] ${meta.className}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                        {n.message && <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>}
                        <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <Badge tone="gray">recent</Badge>
                          {timeAgo(n.createdAt)}
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-pink-600" aria-label="unread" />
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Dismiss notification"
                        className="rounded p-1 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissInbox(n.id);
                        }}
                      >
                        <Icon name="close" className="!text-[14px]" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {loading ? (
            <p className="px-4 py-6 text-sm text-slate-400">Loading…</p>
          ) : rows.length === 0 && visibleInbox.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Icon name="notifications_off" className="!text-[28px] text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">
                {filter === 'unread' ? 'No unread notifications.' : 'Nothing needs your attention.'}
              </p>
            </div>
          ) : rows.length > 0 ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((n) => {
                const meta = SEVERITY_META[n.severity] ?? SEVERITY_META.info;
                return (
                  <li key={n.id} className={n.read ? 'opacity-70' : ''}>
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex w-full cursor-pointer items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      onClick={() => openNotification(n)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openNotification(n);
                      }}
                    >
                      <Icon name={meta.icon} className={`mt-0.5 !text-[18px] ${meta.className}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                        {n.message && <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>}
                        <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <Badge tone="gray">{n.category}</Badge>
                          {timeAgo(n.updatedAt ?? n.createdAt)}
                          {n.occurrenceCount > 1 && <span>× {n.occurrenceCount}</span>}
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-pink-600" aria-label="unread" />}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Dismiss notification"
                        className="rounded p-1 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          void act(n.id, 'dismiss');
                        }}
                      >
                        <Icon name="close" className="!text-[14px]" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800">
          Notifications are generated automatically (pricing checks run daily). Dismissed items
          re-appear if the issue persists after two weeks.
        </p>
      </aside>
    </div>
  );
}
