// Publish tab: final review and quality-control screen. Combines the shared
// completion service (client, with direct fix links) and the server publish
// validation (source of truth) — publishing only happens through the server
// endpoint, never a status dropdown.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, dataApi } from '../../api';
import { useCan } from '../../context';
import { useToast } from '../../Toast';
import { Badge, Button, Icon, TextInput, statusTone } from '../../ui';
import { useWorkspace } from '../context';
import { workspaceTabPath, type MissingItem } from '../completion';
import { tabForServerMessage } from '../sidebar/publishMessages';
import { CompletionSidebar } from '../CompletionSidebar';

interface ServerValidation {
  errors: string[];
  warnings: string[];
}

export function PublishTab() {
  const ws = useWorkspace();
  const can = useCan();
  const canEdit = can('content.edit');
  const canPublish = can('content.publish');
  const { fields, completion } = ws;
  const status = String(fields.status ?? 'draft');

  const [serverCheck, setServerCheck] = useState<ServerValidation | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const toast = useToast();
  useEffect(() => {
    if (actionError) {
      toast.error(actionError);
      setActionError(null);
    }
  }, [actionError, toast]);

  useEffect(() => {
    void runChecks();
    // Run server validation once when opening Publish tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.productId]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  async function runChecks() {
    setChecking(true);
    setActionError(null);
    try {
      const result = await api.get<ServerValidation>(`/api/admin/products/${ws.productId}/publish`);
      setServerCheck(result);
      setCheckedAt(Date.now());
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  }

  async function withBusy(key: string, fn: () => Promise<void>) {
    setActionBusy(key);
    setActionError(null);
    setActionNotice(null);
    try {
      await fn();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setActionBusy(null);
    }
  }

  const saveDraft = () =>
    withBusy('save', async () => {
      const ok = await ws.save();
      if (ok) setActionNotice('Draft saved.');
    });

  const setStatus = (next: string, notice: string, extra: Record<string, unknown> = {}) =>
    withBusy(next, async () => {
      await dataApi.update('products', ws.productId, { status: next, ...extra });
      await ws.reloadProduct();
      setActionNotice(notice);
    });

  const publish = () =>
    withBusy('publish', async () => {
      const result = await api.post<{ warnings: string[] }>(`/api/admin/products/${ws.productId}/publish`);
      await ws.reloadProduct();
      setActionNotice(
        result.warnings.length > 0
          ? `Published with ${result.warnings.length} warning(s).`
          : 'Published. A site rebuild has been triggered.',
      );
      setServerCheck(null);
    });

  const unpublish = () =>
    withBusy('unpublish', async () => {
      if (!confirm('Unpublish this product? The public review page will be removed on the next rebuild.')) return;
      await api.del(`/api/admin/products/${ws.productId}/publish`);
      await ws.reloadProduct();
      setActionNotice('Unpublished — back to draft.');
    });

  const archive = () => {
    if (!confirm('Archive this product? It will be hidden everywhere until restored.')) return;
    void setStatus('archived', 'Product archived.');
  };

  const schedule = () => {
    const ms = scheduleDate ? new Date(scheduleDate).getTime() : NaN;
    if (!Number.isFinite(ms) || ms <= Date.now()) {
      setActionError('Pick a future date and time to schedule.');
      return;
    }
    void setStatus('scheduled', `Scheduled for ${new Date(ms).toLocaleString()}.`, { scheduledAt: ms });
  };

  const required = completion.missingRequired;
  const recommended = completion.missingRecommended;
  const blocked = required.length > 0 || (serverCheck?.errors.length ?? 0) > 0;
  const hasPublishedTestRun = ws.related.testRuns.some((r) => r.isCurrentPublished);
  const readyToPublish =
    status !== 'published' && status !== 'archived' && hasPublishedTestRun && !blocked;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-4">
        {actionNotice && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
            <Icon name="check_circle" className="!text-[16px]" /> {actionNotice}
          </div>
        )}

        {readyToPublish && canPublish && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-900/50 dark:bg-green-950/30">
            <p className="text-sm font-semibold text-green-900 dark:text-green-200">
              Ready to publish
            </p>
            <p className="mt-1 text-xs text-green-800 dark:text-green-300">
              Test run is live and required checks pass. Publish to make the review page public.
            </p>
            <Button className="mt-3" onClick={() => void publish()} disabled={actionBusy !== null}>
              <Icon name="rocket_launch" />
              {actionBusy === 'publish' ? 'Publishing…' : 'Publish now'}
            </Button>
          </div>
        )}

        {!hasPublishedTestRun && status !== 'published' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Publish the test run first
            </p>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
              Go to Testing, finish required questions, then click <strong>Publish changes</strong>.
            </p>
            <Link
              to={workspaceTabPath(ws.productId, 'testing')}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-pink-600 hover:underline dark:text-pink-400"
            >
              Open Testing tab
            </Link>
          </div>
        )}

        {/* Readiness header */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  status === 'published'
                    ? 'bg-green-100 text-green-600 dark:bg-green-950'
                    : blocked
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950'
                      : 'bg-green-100 text-green-600 dark:bg-green-950'
                }`}
              >
                <Icon name={status === 'published' ? 'public' : blocked ? 'report' : 'rocket_launch'} />
              </span>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Badge tone={statusTone(status)}>{status.replace('_', ' ')}</Badge>
                  {status === 'published'
                    ? 'This product is live.'
                    : blocked
                      ? `${required.length + (serverCheck?.errors.length ?? 0)} blocking issue(s) before publishing.`
                      : 'All required checks pass — ready to publish.'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Overall completion {completion.overallPct}% · {recommended.length} recommended item(s) open
                  {checkedAt ? ` · server checks run ${new Date(checkedAt).toLocaleTimeString()}` : ' · server checks not run yet'}
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => void runChecks()} disabled={checking}>
              <Icon name="fact_check" /> {checking ? 'Running checks…' : 'Run checks'}
            </Button>
          </div>
        </div>

        {/* Required */}
        <ChecklistSection
          title="Required"
          icon="error"
          emptyText="No required items missing."
          items={required}
          productId={ws.productId}
          tone="red"
          serverMessages={serverMessagesWithoutClientDuplicates(required, serverCheck?.errors ?? [])}
        />

        {/* Recommended */}
        <ChecklistSection
          title="Recommended"
          icon="tips_and_updates"
          emptyText="No recommended items open."
          items={recommended}
          productId={ws.productId}
          tone="amber"
          serverMessages={serverMessagesWithoutClientDuplicates(recommended, serverCheck?.warnings ?? [])}
        />

        {/* Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Actions</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Publishing runs server-side validation and triggers a static rebuild. It cannot be bypassed
            with a status dropdown.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canEdit && (
              <Button variant="secondary" onClick={() => void saveDraft()} disabled={actionBusy !== null || !ws.isDirty}>
                <Icon name="save" /> {actionBusy === 'save' ? 'Saving…' : 'Save draft'}
              </Button>
            )}
            {canEdit && (status === 'in_review' || status === 'scheduled') && (
              <Button
                variant="secondary"
                onClick={() => void setStatus('draft', 'Moved back to draft.')}
                disabled={actionBusy !== null}
              >
                <Icon name="undo" /> Back to draft
              </Button>
            )}
            {canPublish && status !== 'published' && status !== 'archived' && (
              <Button onClick={() => void publish()} disabled={actionBusy !== null || required.length > 0}>
                <Icon name="rocket_launch" /> {actionBusy === 'publish' ? 'Publishing…' : 'Publish'}
              </Button>
            )}
            {canPublish && status === 'published' && (
              <Button variant="danger" onClick={() => void unpublish()} disabled={actionBusy !== null}>
                <Icon name="unpublished" /> {actionBusy === 'unpublish' ? 'Unpublishing…' : 'Unpublish'}
              </Button>
            )}
            {canEdit && status !== 'archived' && status !== 'published' && (
              <Button variant="ghost" className="text-red-600" onClick={archive} disabled={actionBusy !== null}>
                <Icon name="inventory_2" /> Archive
              </Button>
            )}
            {canEdit && status === 'archived' && (
              <Button
                variant="secondary"
                onClick={() => void setStatus('draft', 'Restored to draft.')}
                disabled={actionBusy !== null}
              >
                <Icon name="restore" /> Restore to draft
              </Button>
            )}
          </div>

          {canPublish && status !== 'published' && status !== 'archived' && (
            <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Schedule publication</p>
                <TextInput
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-56"
                />
              </div>
              <Button variant="secondary" onClick={schedule} disabled={actionBusy !== null || !scheduleDate}>
                <Icon name="schedule" /> Schedule
              </Button>
              {status === 'scheduled' && fields.scheduledAt && (
                <p className="pb-2 text-xs text-slate-500">
                  Currently scheduled for {new Date(Number(fields.scheduledAt)).toLocaleString()}.
                </p>
              )}
            </div>
          )}

          {status === 'published' && (
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
              Live at{' '}
              <a
                href={`/reviews/${fields.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-pink-600 hover:underline dark:text-pink-400"
              >
                /reviews/{fields.slug}
              </a>
              {fields.publishedAt ? ` · published ${new Date(Number(fields.publishedAt)).toLocaleString()}` : ''}
            </p>
          )}

          {status !== 'published' && fields.slug && (
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-amber-800 dark:border-slate-800 dark:text-amber-300">
              <Badge tone="amber" className="mr-1.5 align-middle">
                Draft
              </Badge>
              Not on the live site. Test at{' '}
              <a
                href={`/reviews/${fields.slug}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-pink-600 hover:underline dark:text-pink-400"
              >
                /reviews/{fields.slug}
              </a>{' '}
              on localhost only.
            </p>
          )}
        </div>
      </div>

      <CompletionSidebar />
    </div>
  );
}

function serverMessagesWithoutClientDuplicates(
  items: MissingItem[],
  serverMessages: string[],
): string[] {
  if (serverMessages.length === 0) return [];
  const needles = items.map((item) => item.label.toLowerCase());
  return serverMessages.filter((msg) => {
    const lower = msg.toLowerCase();
    return !needles.some((label) => lower.includes(label));
  });
}

function ChecklistSection({
  title,
  icon,
  emptyText,
  items,
  productId,
  tone,
  serverMessages,
}: {
  title: string;
  icon: string;
  emptyText: string;
  items: MissingItem[];
  productId: string;
  tone: 'red' | 'amber';
  serverMessages: string[];
}) {
  const empty = items.length === 0 && serverMessages.length === 0;
  const toneClasses =
    tone === 'red' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Icon name={empty ? 'check_circle' : icon} className={`!text-[18px] ${empty ? 'text-green-600' : toneClasses}`} />
          {title}
        </h3>
        <span className="text-xs text-slate-400">
          {empty ? 'all clear' : `${items.length + serverMessages.length} open`}
        </span>
      </div>
      {empty ? (
        <p className="px-4 py-3 text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {items.map((item) => (
            <li key={`${item.tab}-${item.key}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
              <Link
                to={workspaceTabPath(productId, item.tab)}
                className="shrink-0 text-xs font-medium text-pink-600 hover:underline dark:text-pink-400"
              >
                Open {item.tab.charAt(0).toUpperCase() + item.tab.slice(1)}
              </Link>
            </li>
          ))}
          {serverMessages.map((msg) => {
            const tab = tabForServerMessage(msg);
            return (
              <li key={msg} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                  <Icon name="dns" className="!text-[13px] text-slate-400" aria-hidden="true" />
                  {msg}
                </span>
                <Link
                  to={workspaceTabPath(productId, tab)}
                  className="shrink-0 text-xs font-medium text-pink-600 hover:underline dark:text-pink-400"
                >
                  Open {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
