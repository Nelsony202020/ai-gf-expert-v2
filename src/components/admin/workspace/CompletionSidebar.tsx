// Compact product workspace sidebar — workflow list + required-task count only.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui';
import { confirmLeaveExplanationsIfNeeded } from '../testing/explanations/explanationLeaveGuard';
import { confirmLeavePricingIfNeeded } from '../testing/pricingLeaveGuard';
import { useWorkspace } from './context';
import { workspaceTabPath } from './completion';
import { statusTone, type SidebarContext, workflowStatusLabel } from './sidebar/nextActions';

function WorkflowList({ onNavigate }: { onNavigate?: () => void }) {
  const ws = useWorkspace();
  const { fields, related, completion } = ws;
  const requiredCount = completion.missingRequired.length;

  const ctx: SidebarContext = useMemo(
    () => ({
      completion,
      fields,
      characters: related.characters,
      media: related.media,
      plans: related.plans,
      pricingSnapshots: related.pricingSnapshots,
      review: related.review,
      status: String(fields.status ?? 'draft'),
    }),
    [completion, fields, related],
  );

  return (
    <div className="w-[200px] shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Workflow</p>
      <ul className="space-y-0.5">
        {completion.tabs.map((tab) => {
          const label = workflowStatusLabel(tab, ctx);
          return (
            <li key={tab.id}>
              <Link
                to={workspaceTabPath(ws.productId, tab.id)}
                onClick={(e) => {
                  const next = workspaceTabPath(ws.productId, tab.id);
                  if (!confirmLeaveExplanationsIfNeeded(next)) {
                    e.preventDefault();
                    return;
                  }
                  if (!confirmLeavePricingIfNeeded(next)) {
                    e.preventDefault();
                    return;
                  }
                  onNavigate?.();
                }}
                className="flex items-baseline justify-between gap-3 rounded px-1 py-0.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/70"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">{tab.label}</span>
                <span className={`shrink-0 text-right ${statusTone(tab, label)}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {requiredCount > 0 && (
        <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-amber-700 dark:border-slate-800 dark:text-amber-400">
          {requiredCount} required task{requiredCount === 1 ? '' : 's'} remain
        </p>
      )}
    </div>
  );
}

export function CompletionSidebar() {
  return (
    <div className="hidden shrink-0 xl:block xl:self-start">
      <WorkflowList />
    </div>
  );
}

export function WorkflowMobileButton() {
  const ws = useWorkspace();
  const requiredCount = ws.completion.missingRequired.length;
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 xl:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <Icon name="checklist" className="!text-[16px] text-pink-600" />
          Workflow
          {requiredCount > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">{requiredCount}</span>
          )}
        </button>
      </div>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[55] bg-slate-900/40 xl:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-16 right-4 z-[56] xl:hidden">
            <WorkflowList onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
