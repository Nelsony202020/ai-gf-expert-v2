// Full checklist drawer: required, recommended, optional, warnings, and publish blockers.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DRAWER_UNMOUNT_MS } from '../../../../lib/drawer/animate';
import { api } from '../../api';
import { Button, Icon } from '../../ui';
import {
  workspaceTabPath,
  type MissingItem,
  type ProductCompletion,
  type WorkspaceTabId,
} from '../completion';
import { tabForServerMessage, type PublishValidationResult } from './publishMessages';

interface CharacterStats {
  active: number;
  inactive: number;
  total: number;
}

export type ChecklistSection = 'required' | 'recommended' | 'optional' | 'warnings' | 'blockers';

interface ChecklistDrawerProps {
  productId: string;
  completion: ProductCompletion;
  charStats: CharacterStats;
  status: string;
  initialSection?: ChecklistSection;
  onClose: () => void;
}

function ChecklistLink({
  productId,
  tab,
  label,
  severity,
}: {
  productId: string;
  tab: WorkspaceTabId;
  label: string;
  severity: 'required' | 'recommended' | 'warning' | 'blocker';
}) {
  const tone =
    severity === 'blocker' || severity === 'required'
      ? 'text-red-700 dark:text-red-400'
      : severity === 'warning'
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-slate-600 dark:text-slate-400';

  return (
    <Link
      to={workspaceTabPath(productId, tab)}
      className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/70"
    >
      <Icon name="arrow_forward" className={`mt-0.5 !text-[14px] shrink-0 ${tone}`} />
      <span className="text-slate-800 dark:text-slate-200">{label}</span>
    </Link>
  );
}

function Section({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen && count > 0);
  if (count === 0) return null;

  return (
    <section className="border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 py-2 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}{' '}
          <span className="font-normal normal-case text-slate-400">({count})</span>
        </span>
        <Icon name={open ? 'expand_less' : 'expand_more'} className="!text-[18px] text-slate-400" />
      </button>
      {open && <ul className="space-y-0.5">{children}</ul>}
    </section>
  );
}

function optionalItems(charStats: CharacterStats): MissingItem[] {
  if (charStats.total > 0) return [];
  return [{ key: 'characters', label: 'Add product characters (optional)', severity: 'recommended', tab: 'characters' }];
}

export function ChecklistDrawer({
  productId,
  completion,
  charStats,
  status,
  initialSection,
  onClose,
}: ChecklistDrawerProps) {
  const [open, setOpen] = useState(false);
  const [serverCheck, setServerCheck] = useState<PublishValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api
      .get<PublishValidationResult>(`/api/admin/products/${productId}/publish`)
      .then((result) => {
        if (!cancelled) setServerCheck(result);
      })
      .catch(() => {
        if (!cancelled) setServerCheck(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  function handleClose() {
    setOpen(false);
    window.setTimeout(onClose, DRAWER_UNMOUNT_MS);
  }

  const blockers = [
    ...completion.missingRequired.map((item) => ({ ...item, source: 'client' as const })),
    ...(serverCheck?.errors ?? []).map((msg, i) => ({
      key: `server-error-${i}`,
      label: msg,
      severity: 'required' as const,
      tab: tabForServerMessage(msg),
      source: 'server' as const,
    })),
  ];

  const warnings = serverCheck?.warnings ?? [];
  const optional = optionalItems(charStats);
  const requiredCount = completion.missingRequired.length;
  const blockerCount = blockers.length;

  return (
    <>
      <button
        type="button"
        aria-label="Close checklist"
        className={`fixed inset-0 z-[60] bg-slate-900/30 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        className={`testing-proof-drawer fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl outline-none transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-labelledby="checklist-drawer-title"
        aria-describedby="checklist-drawer-desc"
      >
        <div className="shrink-0 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 id="checklist-drawer-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Full checklist
              </h2>
              <p id="checklist-drawer-desc" className="mt-0.5 text-xs text-slate-500">
                {completion.overallPct}% complete
                {requiredCount > 0 && ` · ${requiredCount} required missing`}
                {status === 'published' && ' · Published'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={handleClose}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700"
            >
              <Icon name="close" className="!text-[20px]" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {loading && (
            <p className="px-2 py-4 text-xs text-slate-500">Loading publish checks…</p>
          )}

          <Section title="Publish blockers" count={blockerCount} defaultOpen={initialSection === 'blockers' || blockerCount > 0}>
            {blockers.map((item) => (
              <li key={item.key}>
                <ChecklistLink productId={productId} tab={item.tab} label={item.label} severity="blocker" />
              </li>
            ))}
          </Section>

          <Section title="Required" count={completion.missingRequired.length} defaultOpen={initialSection === 'required'}>
            {completion.missingRequired.map((item) => (
              <li key={`${item.tab}-${item.key}`}>
                <ChecklistLink productId={productId} tab={item.tab} label={item.label} severity="required" />
              </li>
            ))}
          </Section>

          <Section title="Recommended" count={completion.missingRecommended.length} defaultOpen={initialSection === 'recommended'}>
            {completion.missingRecommended.map((item) => (
              <li key={`${item.tab}-${item.key}`}>
                <ChecklistLink productId={productId} tab={item.tab} label={item.label} severity="recommended" />
              </li>
            ))}
          </Section>

          <Section title="Optional" count={optional.length} defaultOpen={initialSection === 'optional'}>
            {optional.map((item) => (
              <li key={item.key}>
                <ChecklistLink productId={productId} tab={item.tab} label={item.label} severity="recommended" />
              </li>
            ))}
          </Section>

          <Section title="Warnings" count={warnings.length} defaultOpen={initialSection === 'warnings'}>
            {warnings.map((msg, i) => (
              <li key={`warn-${i}`}>
                <ChecklistLink
                  productId={productId}
                  tab={tabForServerMessage(msg)}
                  label={msg}
                  severity="warning"
                />
              </li>
            ))}
          </Section>

          {!loading && blockerCount === 0 && completion.missingRequired.length === 0 && warnings.length === 0 && (
            <div className="rounded-lg bg-green-50 px-3 py-4 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">
              <Icon name="check_circle" className="mr-1 !text-[16px] align-text-bottom" />
              All required checks pass. Review publish settings when ready.
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <Link to={workspaceTabPath(productId, 'publish')} onClick={handleClose}>
            <Button className="w-full justify-center">Go to publish tab</Button>
          </Link>
        </div>
      </aside>
    </>
  );
}

/** Compact drawer listing publish blockers and server warnings only. */
export function BlockersDrawer({
  productId,
  completion,
  onClose,
}: {
  productId: string;
  completion: ProductCompletion;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [serverCheck, setServerCheck] = useState<PublishValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void api
      .get<PublishValidationResult>(`/api/admin/products/${productId}/publish`)
      .then((result) => {
        if (!cancelled) setServerCheck(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  function handleClose() {
    setOpen(false);
    window.setTimeout(onClose, DRAWER_UNMOUNT_MS);
  }

  const blockers = [
    ...completion.missingRequired.map((item) => ({ ...item })),
    ...(serverCheck?.errors ?? []).map((msg, i) => ({
      key: `server-error-${i}`,
      label: msg,
      severity: 'required' as const,
      tab: tabForServerMessage(msg),
    })),
  ];
  const warnings = serverCheck?.warnings ?? [];

  return (
    <>
      <button
        type="button"
        aria-label="Close blockers panel"
        className={`fixed inset-0 z-[60] bg-slate-900/30 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        className={`testing-proof-drawer fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl outline-none transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-labelledby="blockers-drawer-title"
      >
        <div className="shrink-0 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 id="blockers-drawer-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Publish blockers
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {loading ? 'Checking…' : `${blockers.length} blocking issue${blockers.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <button type="button" aria-label="Close" onClick={handleClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700">
              <Icon name="close" className="!text-[20px]" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-4">
          {blockers.length === 0 && !loading && (
            <p className="text-sm text-green-700 dark:text-green-400">No client-side blockers detected.</p>
          )}
          {blockers.length > 0 && (
            <ul className="space-y-0.5">
              {blockers.map((item) => (
                <li key={item.key}>
                  <ChecklistLink productId={productId} tab={item.tab} label={item.label} severity="blocker" />
                </li>
              ))}
            </ul>
          )}
          {warnings.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Warnings (non-blocking)</p>
              <ul className="space-y-0.5">
                {warnings.map((msg, i) => (
                  <li key={`w-${i}`}>
                    <ChecklistLink productId={productId} tab={tabForServerMessage(msg)} label={msg} severity="warning" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
