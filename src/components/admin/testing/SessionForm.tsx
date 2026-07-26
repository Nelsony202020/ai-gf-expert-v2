// Session form: compact answers (table or step view), proof in a side drawer,
// optional session-level bulk proof. One Save all for answers.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { dataApi, type EntityRow } from '../api';
import { Button, ErrorNote, Icon, useAsync } from '../ui';
import { TestingHint } from './TestingHint';
import { EvidenceInput, type RawValue } from './EvidenceInput';
import { ProofDrawer } from './ProofDrawer';
import { QuestionLabel } from './QuestionLabel';
import { renderPublicResult } from './presentation';
import type { AutofillSuggestion } from './pricingAutofill';
import { SessionAnswerTable } from './SessionAnswerTable';
import { SessionProofZone } from './SessionProofZone';
import {
  formatAnswerSummary,
  rowState,
  statusDotClass,
  type SessionItem,
} from './sessionUi';
import type { TestSessionDef } from './sessions';
import './testing-ui.css';
import { WorksheetGrid } from './WorksheetGrid';
import { WORKSHEETS, type DerivedColumn, type WorksheetRow } from './worksheets';

export type { SessionItem };

export type SessionLayout = 'batch' | 'step';

interface Draft {
  raw: RawValue | undefined;
  na: boolean;
  dirty: boolean;
}

function initialDraft(result: EntityRow | undefined): Draft {
  return {
    raw: (result?.rawValue as RawValue | undefined) ?? undefined,
    na: Boolean(result?.notApplicable),
    dirty: false,
  };
}

export function SessionForm({
  session,
  items,
  resultByDef,
  runId,
  productId,
  categorySlug,
  onSaved,
  onRowSaved,
  suggestions,
  layout = 'batch',
  submitLabel = 'Save all results',
  secondaryActions,
}: {
  session: TestSessionDef;
  items: SessionItem[];
  resultByDef: Map<string, EntityRow>;
  runId: string;
  productId?: string;
  /** Category slug for short question lookup (e.g. "characters"). */
  categorySlug?: string;
  onSaved: () => Promise<void> | void;
  onRowSaved?: () => Promise<void> | void;
  suggestions?: Map<string, AutofillSuggestion>;
  /** batch = all questions on one screen; step = one question at a time */
  layout?: SessionLayout;
  submitLabel?: string;
  secondaryActions?: ReactNode;
}) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const map: Record<string, Draft> = {};
    for (const { def } of items) map[def.id] = initialDraft(resultByDef.get(def.id));
    return map;
  });
  const [drawerDefId, setDrawerDefId] = useState<string | null>(null);
  const [activeDefId, setActiveDefId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [proofCounts, setProofCounts] = useState<Map<string, number>>(new Map());
  const { busy, error, run } = useAsync();

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const { def } of items) {
        if (!next[def.id]?.dirty) next[def.id] = initialDraft(resultByDef.get(def.id));
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultByDef]);

  async function reloadProofCounts() {
    try {
      const res = await dataApi.list('media');
      const counts = new Map<string, number>();
      for (const m of res.rows) {
        const rid = m.evidenceResult?.id;
        if (rid && !m.deletedAt) counts.set(rid, (counts.get(rid) ?? 0) + 1);
      }
      setProofCounts(counts);
    } catch {
      /* optional */
    }
  }

  useEffect(() => {
    void reloadProofCounts();
  }, [resultByDef]);

  const dirtyCount = useMemo(
    () => items.filter(({ def }) => drafts[def.id]?.dirty).length,
    [items, drafts],
  );

  const worksheet = WORKSHEETS[session.id];
  const worksheetDefs = useMemo(() => {
    if (!worksheet) return new Map<string, EntityRow>();
    const bySlug = new Map<string, EntityRow>();
    for (const { def } of items) bySlug.set(String(def.slug), def);
    const covered = new Map<string, EntityRow>();
    for (const col of worksheet.columns) {
      const def = bySlug.get(col.defSlug);
      if (def) covered.set(col.defSlug, def);
    }
    return covered;
  }, [worksheet, items]);

  const worksheetDefIds = useMemo(
    () => new Set(Array.from(worksheetDefs.values()).map((d) => d.id)),
    [worksheetDefs],
  );

  const standaloneItems = useMemo(
    () =>
      worksheet && worksheetDefs.size > 0
        ? items.filter(({ def }) => !worksheetDefIds.has(def.id))
        : items,
    [items, worksheet, worksheetDefs, worksheetDefIds],
  );

  const worksheetItems = useMemo(
    () =>
      worksheet && worksheetDefs.size > 0
        ? items.filter(({ def }) => worksheetDefIds.has(def.id))
        : [],
    [items, worksheet, worksheetDefs, worksheetDefIds],
  );

  const useTable = layout === 'batch' && standaloneItems.length >= 3 && !worksheet;

  const initialWorksheetRows = useMemo(() => {
    for (const def of worksheetDefs.values()) {
      const raw = resultByDef.get(def.id)?.rawValue as RawValue | undefined;
      const rows =
        raw && 'detail' in raw ? (raw.detail?.worksheetRows as WorksheetRow[] | undefined) : undefined;
      if (Array.isArray(rows) && rows.length > 0) return rows;
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const suggestionItems = useMemo(
    () => items.filter(({ def }) => suggestions?.has(def.id) && !worksheetDefIds.has(def.id)),
    [items, suggestions, worksheetDefIds],
  );

  const unfilledSuggestions = suggestionItems.filter(({ def }) => {
    const draft = drafts[def.id];
    return !draft?.na && draft?.raw === undefined;
  });

  const stepItems = standaloneItems;
  const currentStep = stepItems[Math.min(stepIndex, Math.max(stepItems.length - 1, 0))];

  useEffect(() => {
    if (layout === 'step' && currentStep) setActiveDefId(currentStep.def.id);
  }, [layout, stepIndex, currentStep?.def.id]);

  useEffect(() => {
    if (useTable && !activeDefId && standaloneItems[0]) {
      setActiveDefId(standaloneItems[0].def.id);
    }
  }, [useTable, activeDefId, standaloneItems]);

  function patchDraft(defId: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [defId]: { ...(prev[defId] ?? { raw: undefined, na: false, dirty: false }), ...patch, dirty: true },
    }));
  }

  function applySuggestions() {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const { def } of suggestionItems) {
        const s = suggestions?.get(def.id);
        const cur = next[def.id];
        if (!s || cur?.na) continue;
        next[def.id] = { ...(cur ?? { raw: undefined, na: false, dirty: false }), raw: s.raw, dirty: true };
      }
      return next;
    });
  }

  function handleWorksheetChange(rows: WorksheetRow[], derived: DerivedColumn[]) {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const col of derived) {
        if (col.filledRows === 0) continue;
        const def = worksheetDefs.get(col.defSlug);
        if (!def) continue;
        next[def.id] = {
          ...(next[def.id] ?? { raw: undefined, na: false, dirty: false }),
          raw: {
            value: col.pct,
            detail: { numerator: col.numerator, denominator: col.denominator, worksheetRows: rows },
          },
          dirty: true,
        };
      }
      return next;
    });
  }

  async function saveAll() {
    const changed = items.filter(({ def }) => drafts[def.id]?.dirty);
    if (changed.length === 0) {
      await onSaved();
      return;
    }
    const ok = await run(async () => {
      for (const { def } of changed) {
        const draft = drafts[def.id];
        const existing = resultByDef.get(def.id);
        const raw = draft.na ? ({ status: 'na' } as RawValue) : draft.raw;
        const isUnknown = Boolean(raw && 'status' in raw && raw.status === 'unknown');

        let publicResult = (existing?.publicResult as string | undefined) ?? undefined;
        if (!draft.na && draft.raw && !publicResult) {
          const rawVal =
            'value' in draft.raw
              ? draft.raw.value
              : 'text' in draft.raw
                ? draft.raw.text
                : 'status' in draft.raw
                  ? draft.raw.status
                  : null;
          if (rawVal !== null) {
            const templated = renderPublicResult(def, rawVal);
            if (templated) publicResult = templated;
          }
        }

        const fields: Record<string, unknown> = {
          rawValue: raw,
          notApplicable: draft.na,
          isUnknown,
          testDate: Date.now(),
          ...(publicResult !== undefined ? { publicResult } : {}),
        };

        if (existing) {
          await dataApi.update('evidenceResults', existing.id, fields);
        } else {
          await dataApi.create('evidenceResults', fields, {
            testRun: runId,
            evidenceDefinition: def.id,
            product: productId ?? null,
          });
        }
      }
      return true;
    });
    if (ok) {
      setDrafts((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(next)) next[id] = { ...next[id], dirty: false };
        return next;
      });
      await onSaved();
    }
  }

  const drawerDef = drawerDefId ? items.find(({ def }) => def.id === drawerDefId)?.def : null;
  const drawerDraft = drawerDefId ? drafts[drawerDefId] : undefined;

  function renderStepView() {
    if (!currentStep) return null;
    const { def } = currentStep;
    const draft = drafts[def.id] ?? initialDraft(resultByDef.get(def.id));
    const result = resultByDef.get(def.id);
    const state = rowState(def, draft, result);
    const suggestion = suggestions?.get(def.id);
    const proofN = result?.id ? (proofCounts.get(result.id) ?? 0) : 0;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="testing-step-pill">
            Question {stepIndex + 1} of {stepItems.length}
          </p>
          <span className={statusDotClass(state)} title={state} />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          <QuestionLabel def={def} categorySlug={categorySlug} required={Boolean(def.required)} />
        </h3>
        {!draft.na && (
          <EvidenceInput
            def={def}
            value={draft.raw && 'status' in draft.raw && draft.raw.status === 'na' ? undefined : draft.raw}
            onChange={(v) => patchDraft(def.id, { raw: v })}
            disabled={busy}
          />
        )}
        {suggestion && (
          <p className="flex items-start gap-1 text-xs text-[var(--testing-accent-muted)]">
            <Icon name="auto_awesome" className="mt-px !text-[13px] shrink-0 testing-icon-accent" />
            {suggestion.note}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              className="testing-checkbox h-3.5 w-3.5 rounded border-slate-300 focus:ring-[var(--testing-accent)]"
              checked={draft.na}
              disabled={busy}
              onChange={(e) => patchDraft(def.id, { na: e.target.checked })}
            />
            Not applicable
          </label>
          <button
            type="button"
            className="testing-link text-xs font-medium hover:underline"
            onClick={() => setDrawerDefId(def.id)}
          >
            Proof &amp; notes{proofN > 0 ? ` (${proofN})` : ''}
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            ← Previous question
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={stepIndex >= stepItems.length - 1}
            onClick={() => setStepIndex((i) => Math.min(stepItems.length - 1, i + 1))}
          >
            Next question →
          </Button>
        </div>
      </div>
    );
  }

  function renderWorksheetProofLinks() {
    if (worksheetItems.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {worksheetItems.map(({ def }) => {
          const result = resultByDef.get(def.id);
          const proofN = result?.id ? (proofCounts.get(result.id) ?? 0) : 0;
          const draft = drafts[def.id];
          const pct = draft?.raw && 'value' in draft.raw ? `${draft.raw.value}%` : null;
          return (
            <button
              key={def.id}
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-[var(--testing-accent-border)] hover:text-[var(--testing-accent-muted)] dark:border-slate-700 dark:bg-slate-900"
              onClick={() => setDrawerDefId(def.id)}
            >
              {pct ?? '—'} {String(def.name)}
              {proofN > 0 && <Icon name="attach_file" className="!text-[13px]" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="testing-workspace space-y-3">
      {error && <ErrorNote message={error} />}

      {session.intro && (
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <span className="font-medium text-slate-600 dark:text-slate-400">Session tip</span>
          <TestingHint text={session.intro} />
        </p>
      )}

      {suggestionItems.length > 0 && (
        <div className="testing-suggest-banner flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
          <div className="flex items-start gap-2 text-sm text-[var(--testing-accent-muted)]">
            <Icon name="auto_awesome" className="mt-0.5 !text-[16px] shrink-0 testing-icon-accent" />
            <p>
              {suggestionItems.length} answer{suggestionItems.length === 1 ? '' : 's'} can be filled
              from the Pricing tab.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={applySuggestions}>
            {unfilledSuggestions.length > 0
              ? `Fill ${unfilledSuggestions.length} suggested`
              : 'Refill suggested'}
          </Button>
        </div>
      )}

      {worksheet && worksheetDefs.size > 0 && (
        <>
          <WorksheetGrid
            key={session.id}
            config={worksheet}
            defsBySlug={worksheetDefs}
            initialRows={initialWorksheetRows}
            disabled={busy}
            onChange={handleWorksheetChange}
          />
          {renderWorksheetProofLinks()}
        </>
      )}

      {layout === 'step' && !worksheet ? (
        renderStepView()
      ) : useTable ? (
        <SessionAnswerTable
          items={standaloneItems}
          categorySlug={categorySlug}
          drafts={drafts}
          resultByDef={resultByDef}
          proofCounts={proofCounts}
          activeDefId={activeDefId}
          busy={busy}
          onPatch={patchDraft}
          onOpenProof={setDrawerDefId}
          onFocusRow={setActiveDefId}
        />
      ) : (
        standaloneItems.length > 0 && (
          <div className="space-y-2">
            {standaloneItems.map(({ def }) => {
              const draft = drafts[def.id] ?? initialDraft(resultByDef.get(def.id));
              const result = resultByDef.get(def.id);
              const state = rowState(def, draft, result);
              const isActive = activeDefId === def.id;
              const summary = formatAnswerSummary(def, draft.raw, draft.na);
              const proofN = result?.id ? (proofCounts.get(result.id) ?? 0) : 0;
              const suggestion = suggestions?.get(def.id);

              if (!isActive && standaloneItems.length > 1) {
                return (
                  <button
                    key={def.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-[var(--testing-accent-border)] hover:bg-[var(--testing-accent-soft)] dark:border-slate-700"
                    onClick={() => setActiveDefId(def.id)}
                  >
                    <span className={statusDotClass(state)} />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                      <QuestionLabel def={def} categorySlug={categorySlug} className="truncate" />{' '}
                      <span className="text-slate-500">— {summary}</span>
                    </span>
                    {proofN > 0 && <Icon name="attach_file" className="!text-[14px] testing-icon-accent" />}
                  </button>
                );
              }

              return (
                <div
                  key={def.id}
                  className="rounded-lg border border-[var(--testing-accent-border)]/80 bg-white p-3 shadow-sm dark:border-[var(--testing-accent-border)]/40 dark:bg-slate-900/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      <QuestionLabel def={def} categorySlug={categorySlug} required={Boolean(def.required)} />
                    </p>
                    <span className={statusDotClass(state)} />
                  </div>
                  {!draft.na && (
                    <div className="mt-2">
                      <EvidenceInput
                        def={def}
                        value={
                          draft.raw && 'status' in draft.raw && draft.raw.status === 'na'
                            ? undefined
                            : draft.raw
                        }
                        onChange={(v) => patchDraft(def.id, { raw: v })}
                        disabled={busy}
                      />
                    </div>
                  )}
                  {suggestion && (
                    <p className="mt-1.5 flex items-start gap-1 text-xs text-[var(--testing-accent-muted)]">
                      <Icon name="auto_awesome" className="mt-px !text-[13px] shrink-0 testing-icon-accent" />
                      {suggestion.note}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        className="testing-checkbox h-3.5 w-3.5 rounded border-slate-300 focus:ring-[var(--testing-accent)]"
                        checked={draft.na}
                        disabled={busy}
                        onChange={(e) => patchDraft(def.id, { na: e.target.checked })}
                      />
                      Not applicable
                    </label>
                    <button
                      type="button"
                      className="testing-link text-xs font-medium hover:underline"
                      onClick={() => setDrawerDefId(def.id)}
                    >
                      Proof &amp; notes{proofN > 0 ? ` (${proofN})` : ''}
                    </button>
                    {standaloneItems.length > 1 && (
                      <button
                        type="button"
                        className="text-xs text-slate-400 hover:text-slate-600"
                        onClick={() => setActiveDefId(null)}
                      >
                        Collapse
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {layout === 'batch' && standaloneItems.length >= 2 && (
        <SessionProofZone
          items={standaloneItems}
          categorySlug={categorySlug}
          runId={runId}
          productId={productId}
          resultByDef={resultByDef}
          onUploaded={() => void reloadProofCounts().then(() => onRowSaved?.())}
        />
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700">
        <div className="flex items-center gap-2">{secondaryActions}</div>
        <Button
          type="button"
          className="testing-btn-primary focus-visible:!ring-[var(--testing-accent)]"
          onClick={() => void saveAll()}
          disabled={busy}
        >
          {busy ? 'Saving…' : dirtyCount > 0 ? `${submitLabel} (${dirtyCount})` : submitLabel}
        </Button>
      </div>

      {drawerDef && (
        <ProofDrawer
          def={drawerDef}
          categorySlug={categorySlug}
          runId={runId}
          productId={productId}
          existing={resultByDef.get(drawerDef.id) ?? null}
          answerRaw={
            drawerDraft?.na
              ? undefined
              : drawerDraft?.raw && !('status' in drawerDraft.raw && drawerDraft.raw.status === 'na')
                ? drawerDraft.raw
                : (resultByDef.get(drawerDef.id)?.rawValue as RawValue | undefined)
          }
          onClose={() => setDrawerDefId(null)}
          onSaved={async () => {
            await reloadProofCounts();
            await (onRowSaved ?? onSaved)();
          }}
        />
      )}
    </div>
  );
}
