// Shared sticky header + tab navigation used by every product workspace tab.

import { Link, NavLink } from 'react-router-dom';
import { Badge, Button, Icon, statusTone } from '../ui';
import { useCan } from '../context';
import { useWorkspace } from './context';
import { confirmLeaveExplanationsIfNeeded } from '../testing/explanations/explanationLeaveGuard';
import { WORKSPACE_TABS, fmtRelativeTime, workspaceTabPath, tabVisualStatus, type TabCompletion } from './completion';
import { reviewPageUrl, reviewPreviewPageUrl } from '../../../lib/slugs';
import { resolveMediaUrl } from '../../../lib/media/url';

function fmtMonthYear(ms?: number | null): string {
  if (!ms) return 'never';
  return new Date(Number(ms)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function TabIndicator({ tab }: { tab: TabCompletion }) {
  const status = tabVisualStatus(tab);
  if (status === 'complete') {
    return <Icon name="check_circle" className="!text-[14px] text-green-600" aria-label="Complete" />;
  }
  if (status === 'attention') {
    return <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" title="Needs attention" />;
  }
  if (status === 'blocked') {
    return <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" title="Blocked" />;
  }
  return <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" title="Not started" />;
}

export function ProductWorkspaceHeader() {
  const ws = useWorkspace();
  const can = useCan();
  const { fields, links, related, completion } = ws;

  const logoUrl = links.logo
    ? resolveMediaUrl(related.mediaAll.find((m) => m.id === links.logo)) || null
    : null;
  const status = String(fields.status ?? 'draft');
  const isPublished = status === 'published';
  const reviewUrl = fields.slug
    ? isPublished
      ? reviewPageUrl(String(fields.slug))
      : reviewPreviewPageUrl(String(fields.slug))
    : null;
  const overall = related.scoreHistory.find((h) => h.isCurrentPublished)?.overall ?? null;
  const requiredCount = completion.missingRequired.length;

  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-slate-100/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:-mx-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/products"
            onClick={(e) => {
              if (!confirmLeaveExplanationsIfNeeded('/products')) e.preventDefault();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Back to all products"
          >
            <Icon name="arrow_back" />
          </Link>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {logoUrl ? (
              <img src={String(logoUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name="image" className="!text-[20px] text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">
                {fields.name || 'Untitled product'}
              </h2>
              <Badge tone={statusTone(status)}>{status.replace('_', ' ')}</Badge>
              {overall !== null && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
                  title="Current published overall score"
                >
                  <Icon name="star" className="!text-[12px]" /> {overall}
                </span>
              )}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">{completion.overallPct}% complete</span>
              <span aria-hidden="true">·</span>
              {requiredCount > 0 ? (
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  {requiredCount} required item{requiredCount === 1 ? '' : 's'} missing
                </span>
              ) : (
                <span className="font-medium text-green-700 dark:text-green-400">
                  All required items complete
                </span>
              )}
              <span aria-hidden="true">·</span>
              <span>
                Last saved{' '}
                {ws.lastSavedAt ? fmtRelativeTime(ws.lastSavedAt) : fmtRelativeTime(fields.updatedAt)}
              </span>
              <span aria-hidden="true">·</span>
              <span>Last tested {fmtMonthYear(fields.lastTestedAt)}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {ws.isDirty && (
            <span className="hidden items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              Unsaved changes
            </span>
          )}
          {!ws.isDirty && ws.lastSavedAt && (
            <span className="hidden items-center gap-1 text-xs text-green-700 dark:text-green-400 sm:inline-flex">
              <Icon name="check" className="!text-[14px]" /> Saved
            </span>
          )}
          {reviewUrl && (
            <a href={reviewUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary">
                <Icon name="open_in_new" /> {isPublished ? 'View live page' : 'Preview review'}
              </Button>
            </a>
          )}
          {can('content.edit') && (
            <Button onClick={() => void ws.save()} disabled={ws.saving || !ws.isDirty}>
              {ws.saving ? 'Saving…' : status === 'published' ? 'Save' : 'Save draft'}
            </Button>
          )}
        </div>
      </div>

      {/* Overall workflow completion bar */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={completion.overallPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall product completion"
      >
        <div
          className="h-full rounded-full bg-pink-600 transition-all duration-300"
          style={{ width: `${completion.overallPct}%` }}
        />
      </div>

      <nav className="flex gap-1 overflow-x-auto" aria-label="Product sections">
        {WORKSPACE_TABS.map((t) => {
          const tabCompletion = completion.tabById[t.id];
          return (
            <NavLink
              key={t.id}
              to={workspaceTabPath(ws.productId, t.id)}
              onClick={(e) => {
                if (!confirmLeaveExplanationsIfNeeded(workspaceTabPath(ws.productId, t.id))) {
                  e.preventDefault();
                }
              }}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-pink-600 text-pink-700 dark:text-pink-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
            >
              {t.label}
              <TabIndicator tab={tabCompletion} />
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
