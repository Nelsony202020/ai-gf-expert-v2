// Right-hand workspace sidebar: product summary + per-tab completion status
// (from the shared completion service) with direct links to each section.

import { Link } from 'react-router-dom';
import { Badge, Icon, statusTone } from '../ui';
import { useWorkspace } from './context';
import { fmtRelativeTime, workspaceTabPath, type TabCompletion } from './completion';

function tabStatusLabel(tab: TabCompletion): { text: string; className: string } {
  if (tab.id === 'publish') {
    if (tab.pct === 100) return { text: 'Published', className: 'text-green-700 dark:text-green-400' };
    if (tab.blocked) return { text: 'Blocked', className: 'text-red-600 dark:text-red-400' };
    return { text: 'Ready', className: 'text-green-700 dark:text-green-400' };
  }
  if (tab.pct === null) return { text: 'Optional', className: 'text-slate-400' };
  if (tab.pct === 100) return { text: '100%', className: 'text-green-700 dark:text-green-400' };
  if (tab.missingRequired.length > 0)
    return { text: `${tab.pct}%`, className: 'text-amber-700 dark:text-amber-400' };
  return { text: `${tab.pct}%`, className: 'text-slate-600 dark:text-slate-300' };
}

export function CompletionSidebar() {
  const ws = useWorkspace();
  const { fields, completion } = ws;

  return (
    <aside className="space-y-3 xl:sticky xl:top-40 xl:self-start">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Product summary</h3>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Status</dt>
            <dd>
              <Badge tone={statusTone(String(fields.status ?? 'draft'))}>
                {String(fields.status ?? 'draft').replace('_', ' ')}
              </Badge>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">URL</dt>
            <dd className="truncate font-mono text-xs text-slate-800 dark:text-slate-200">
              {fields.slug ? `/reviews/${fields.slug}` : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Updated</dt>
            <dd className="text-slate-800 dark:text-slate-200">{fmtRelativeTime(fields.updatedAt)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Created</dt>
            <dd className="text-slate-800 dark:text-slate-200">{fmtRelativeTime(fields.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Workflow</h3>
          <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">
            {completion.overallPct}%
          </span>
        </div>
        <ul className="mt-3 space-y-1">
          {completion.tabs.map((tab) => {
            const status = tabStatusLabel(tab);
            return (
              <li key={tab.id}>
                <Link
                  to={workspaceTabPath(ws.productId, tab.id)}
                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70"
                >
                  <span className="flex items-center gap-1.5">
                    {tab.pct === 100 || (tab.id === 'publish' && tab.pct === 100) ? (
                      <Icon name="check_circle" className="!text-[15px] text-green-600" />
                    ) : (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          tab.missingRequired.length > 0 || tab.blocked
                            ? 'bg-amber-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    {tab.label}
                  </span>
                  <span className={`text-xs font-medium ${status.className}`}>{status.text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
