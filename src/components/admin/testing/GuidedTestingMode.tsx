// Guided testing mode: one session at a time with batch or step layout,
// proof in a side drawer, brand-aligned testing UI.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EntityRow } from '../api';
import { Button, Icon } from '../ui';
import { STEP_DEFAULT_SESSIONS } from './capabilityGating';
import type { AutofillSuggestion } from './pricingAutofill';
import {
  isEvidenceAnswerComplete,
  repairChatModesRaw,
} from '../../../lib/testing/evidenceComplete';
import {
  computeRunProgress,
  lastEditedFromResults,
  sessionRequiredComplete,
  type ProgressContext,
} from './progress';
import { SessionForm, type SessionFormHandle, type SessionItem, type SessionLayout, type ProofUploadedEvent } from './SessionForm';
import type { TestSessionDef } from './sessions';
import {
  markSessionSkipped,
  sessionKey,
  unmarkSessionSkipped,
  readSkippedSessions,
} from './sessionProgressStorage';
import { TestingProgressHeader, TestingResumeRow } from './TestingProgressHeader';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { CategoryCheckpoint } from './CategoryCheckpoint';
import { categoryCheckpoints, checkpointAfterSession } from './categoryBoundaries';
import './testing-ui.css';
import { WORKSHEETS } from './worksheets';

export type { SessionItem, ProofUploadedEvent };

export interface GuidedSession {
  cat: EntityRow;
  session: TestSessionDef;
  items: SessionItem[];
}

function defaultLayout(sessionId: string): SessionLayout {
  return STEP_DEFAULT_SESSIONS.has(sessionId) ? 'step' : 'batch';
}

function buildProgressContext(
  results: Map<string, EntityRow>,
  attachmentCountByDef: Map<string, number>,
  skipped: Set<string>,
  evidenceDefs?: EntityRow[],
  suggestions?: Map<string, AutofillSuggestion>,
): ProgressContext {
  const defById = new Map((evidenceDefs ?? []).map((d) => [d.id, d]));
  const relatedAnswersBySlug: Record<string, unknown> = {};
  for (const [defId, row] of results) {
    const slug = defById.get(defId)?.slug;
    if (slug && row.rawValue) relatedAnswersBySlug[String(slug)] = row.rawValue;
  }
  if (relatedAnswersBySlug['chat-modes'] != null || relatedAnswersBySlug['mode-types'] != null) {
    relatedAnswersBySlug['chat-modes'] = repairChatModesRaw(
      relatedAnswersBySlug['chat-modes'],
      relatedAnswersBySlug['mode-types'],
    );
  }

  const hasValue = (defId: string) => {
    const r = results.get(defId);
    const def = defById.get(defId);
    if (!def) {
      if (!r) return false;
      if (r.notApplicable || r.isUnknown) return true;
      return Boolean(r.rawValue);
    }
    return isEvidenceAnswerComplete({
      slug: String(def.slug),
      rawValue: r?.rawValue,
      notApplicable: r?.notApplicable,
      isUnknown: r?.isUnknown,
      relatedAnswers: relatedAnswersBySlug,
      hasAutofillSuggestion: suggestions?.has(defId),
    });
  };
  return {
    hasValue,
    getResult: (defId) => results.get(defId),
    attachmentCount: (defId) => attachmentCountByDef.get(defId) ?? 0,
    isSkipped: (key) => skipped.has(key),
  };
}

export function GuidedTestingMode({
  productName,
  runName,
  runId,
  productId,
  productFields,
  productSlug,
  sessions,
  results,
  resultRows,
  media,
  runUpdatedAt,
  startIndex,
  focusDefId: initialFocusDefId,
  focusNonce: externalFocusNonce = 0,
  suggestions,
  evidenceDefs,
  onClose,
  onResultSaved,
  onProofUploaded,
}: {
  productName: string;
  runName: string;
  runId: string;
  productId: string;
  productFields?: Record<string, unknown>;
  productSlug?: string;
  sessions: GuidedSession[];
  results: Map<string, EntityRow>;
  /** Raw result rows for last-edited timestamp. */
  resultRows: EntityRow[];
  media: EntityRow[];
  runUpdatedAt?: number | null;
  startIndex: number;
  /** Jump to and highlight this evidence definition when its session opens. */
  focusDefId?: string | null;
  focusNonce?: number;
  suggestions?: Map<string, AutofillSuggestion>;
  /** All evidence definitions (for cross-session slug lookups). */
  evidenceDefs?: EntityRow[];
  onClose: () => void;
  onResultSaved: (opts?: { proofOnly?: boolean; refreshResults?: boolean }) => Promise<void> | void;
  onProofUploaded?: (event: ProofUploadedEvent) => void | Promise<void>;
}) {
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), Math.max(sessions.length - 1, 0)));
  const [focusDefId, setFocusDefId] = useState<string | null>(initialFocusDefId ?? null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [finished, setFinished] = useState(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState<ReturnType<typeof checkpointAfterSession>>(null);
  const [saving, setSaving] = useState(false);
  const [skippedSessions, setSkippedSessions] = useState(() => readSkippedSessions(runId));
  const [layout, setLayout] = useState<SessionLayout>(() =>
    defaultLayout(sessions[Math.min(Math.max(startIndex, 0), sessions.length - 1)]?.session.id ?? ''),
  );
  const [sessionDirty, setSessionDirty] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState<
    | { kind: 'close' }
    | { kind: 'navigate'; index: number }
    | { kind: 'layout'; layout: SessionLayout }
    | { kind: 'skip' }
    | null
  >(null);
  const sessionFormRef = useRef<SessionFormHandle>(null);

  const attachmentCountByDef = useMemo(() => {
    const resultIdToDef = new Map<string, string>();
    for (const [defId, row] of results) resultIdToDef.set(row.id, defId);
    const map = new Map<string, number>();
    for (const m of media) {
      if (m.deletedAt) continue;
      const erId = m.evidenceResult?.id;
      if (!erId) continue;
      const defId = resultIdToDef.get(erId);
      if (defId) map.set(defId, (map.get(defId) ?? 0) + 1);
    }
    return map;
  }, [media, results]);

  const progressCtx = useMemo(
    () => buildProgressContext(results, attachmentCountByDef, skippedSessions, evidenceDefs, suggestions),
    [results, attachmentCountByDef, skippedSessions, evidenceDefs, suggestions],
  );

  const runProgress = useMemo(
    () =>
      computeRunProgress(
        sessions,
        progressCtx,
        lastEditedFromResults(resultRows, runUpdatedAt),
      ),
    [sessions, progressCtx, resultRows, runUpdatedAt],
  );

  const checkpointAfterIndices = useMemo(
    () => categoryCheckpoints(sessions).map((c) => c.afterSessionIndex),
    [sessions],
  );

  const resultBySlug = useMemo(() => {
    const map = new Map<string, EntityRow>();
    for (const def of evidenceDefs ?? []) {
      const r = results.get(def.id);
      if (r) map.set(String(def.slug), r);
    }
    return map;
  }, [evidenceDefs, results]);

  const showResumeBanner =
    runProgress.remainingRequired > 0 &&
    index !== runProgress.resumeIndex &&
    runProgress.sessions[runProgress.resumeIndex]?.status !== 'complete';

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    setLayout(defaultLayout(sessions[index]?.session.id ?? ''));
  }, [index, sessions]);

  useEffect(() => {
    if (initialFocusDefId) setFocusDefId(initialFocusDefId);
  }, [initialFocusDefId]);

  useEffect(() => {
    if (externalFocusNonce > 0) setFocusNonce(externalFocusNonce);
  }, [externalFocusNonce]);

  useEffect(() => {
    setIndex(Math.min(Math.max(startIndex, 0), Math.max(sessions.length - 1, 0)));
  }, [startIndex, sessions.length]);

  useEffect(() => {
    setSessionDirty(false);
  }, [index]);

  function resumeToNextIncomplete() {
    const snap = runProgress.sessions[runProgress.resumeIndex];
    const nextDef = snap?.missingRequiredItems[0]?.defId ?? null;
    setFocusDefId(nextDef);
    setFocusNonce((n) => n + 1);
    if (runProgress.resumeIndex === index) return;
    requestGoToSession(runProgress.resumeIndex);
  }

  function jumpToMissingInSession(sessionIndex: number, defId: string) {
    setFocusDefId(defId);
    setFocusNonce((n) => n + 1);
    if (sessionIndex === index) return;
    requestGoToSession(sessionIndex);
  }

  function requestLeave(next: NonNullable<typeof leaveConfirm>) {
    if (sessionDirty && !saving) {
      setLeaveConfirm(next);
      return;
    }
    applyLeave(next);
  }

  function applyLeave(next: NonNullable<typeof leaveConfirm>) {
    if (next.kind === 'close') onClose();
    else if (next.kind === 'navigate') goToSession(next.index);
    else if (next.kind === 'layout') setLayout(next.layout);
    else if (next.kind === 'skip') skipSession();
  }

  function requestClose() {
    requestLeave({ kind: 'close' });
  }

  async function handleSaveAndLeave() {
    const ok = await sessionFormRef.current?.saveWithoutContinue();
    if (!ok) return;
    const pending = leaveConfirm;
    setLeaveConfirm(null);
    setSessionDirty(false);
    if (pending) applyLeave(pending);
  }

  function handleDiscardAndLeave() {
    const pending = leaveConfirm;
    setLeaveConfirm(null);
    setSessionDirty(false);
    if (pending) applyLeave(pending);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) requestClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving, sessionDirty]);

  if (sessions.length === 0) return null;
  const current = sessions[index];
  const currentKey = sessionKey(String(current.cat.slug), current.session.id);
  const currentSnapshot = runProgress.sessions[index] ?? null;
  const hasWorksheet = Boolean(WORKSHEETS[current.session.id]);
  const isLast = index === sessions.length - 1;

  function advance() {
    if (sessionRequiredComplete(current.session.id, current.items, progressCtx)) {
      setSkippedSessions(unmarkSessionSkipped(runId, currentKey));
    }
    const boundary = checkpointAfterSession(index, sessions);
    if (boundary) {
      setActiveCheckpoint(boundary);
      return;
    }
    if (isLast) setFinished(true);
    else setIndex((i) => i + 1);
  }

  function beginCheckpoint() {
    if (!activeCheckpoint) return;
    setActiveCheckpoint(null);
    setIndex(activeCheckpoint.nextSessionIndex);
    setFinished(false);
  }

  function skipSession() {
    setSkippedSessions(markSessionSkipped(runId, currentKey));
    if (isLast) setFinished(true);
    else setIndex((i) => i + 1);
  }

  function requestSkipSession() {
    requestLeave({ kind: 'skip' });
  }

  function goToSession(nextIndex: number) {
    setActiveCheckpoint(null);
    setIndex(Math.min(Math.max(nextIndex, 0), sessions.length - 1));
    setFinished(false);
  }

  function requestGoToSession(nextIndex: number) {
    if (nextIndex === index) return;
    requestLeave({ kind: 'navigate', index: nextIndex });
  }

  function requestLayout(nextLayout: SessionLayout) {
    if (nextLayout === layout) return;
    requestLeave({ kind: 'layout', layout: nextLayout });
  }

  return (
    <div className="testing-workspace fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[min(920px,calc(100dvh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div
          className={`flex min-h-0 flex-1 flex-col transition-opacity duration-150 ${saving ? 'pointer-events-none opacity-50' : ''}`}
        >
          <TestingProgressHeader
            productName={productName}
            runName={runName}
            currentCategoryName={String(current.cat.name)}
            currentSessionTitle={current.session.title}
            sessionNumber={index + 1}
            totalSessions={sessions.length}
            runProgress={runProgress}
            currentSessionProgress={currentSnapshot}
            currentSessionIndex={index}
            onSelectSession={requestGoToSession}
            onJumpToMissing={jumpToMissingInSession}
            checkpointAfterIndices={checkpointAfterIndices}
            trailing={
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                  <button
                    type="button"
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      layout === 'batch'
                        ? 'testing-toggle-active'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    onClick={() => requestLayout('batch')}
                    disabled={saving}
                  >
                    All at once
                  </button>
                  <button
                    type="button"
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      layout === 'step'
                        ? 'testing-toggle-active'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    onClick={() => requestLayout('step')}
                    disabled={saving}
                  >
                    One by one
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Close guided testing"
                  disabled={saving}
                  onClick={requestClose}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-40 dark:hover:bg-slate-700"
                >
                  <Icon name="close" className="!text-[20px]" />
                </button>
              </div>
            }
          />

          {showResumeBanner && (
            <TestingResumeRow onResume={resumeToNextIncomplete} />
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            {finished ? (
              <div className="py-8 text-center">
                <Icon name="check_circle" className="testing-icon-accent !text-[40px]" />
                <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                  End of the session list
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  {runProgress.completedRequired} of {runProgress.totalRequired} required answers
                  recorded
                  {runProgress.remainingRequired > 0 &&
                    ` · ${runProgress.remainingRequired} still remaining`}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  {runProgress.remainingRequired > 0 && (
                    <Button
                      variant="secondary"
                      onClick={resumeToNextIncomplete}
                    >
                      Resume next incomplete
                    </Button>
                  )}
                  <Button onClick={onClose}>Back to overview</Button>
                </div>
              </div>
            ) : activeCheckpoint ? (
              <CategoryCheckpoint
                completedCategory={activeCheckpoint.completedCategoryName}
                nextCategory={activeCheckpoint.nextCategoryName}
                onBegin={beginCheckpoint}
                onBack={() => setActiveCheckpoint(null)}
              />
            ) : (
              <SessionForm
                ref={sessionFormRef}
                key={`${current.session.id}:${current.cat.id}:${layout}`}
                session={current.session}
                items={current.items}
                categorySlug={String(current.cat.slug)}
                resultByDef={results}
                resultBySlug={resultBySlug}
                runId={runId}
                productId={productId}
                productFields={productFields}
                productSlug={productSlug}
                suggestions={suggestions}
                productMedia={media}
                initialFocusDefId={
                  focusDefId && current.items.some(({ def }) => def.id === focusDefId)
                    ? focusDefId
                    : null
                }
                focusNonce={focusNonce}
                layout={hasWorksheet && current.session.id === 'chat-understanding' ? 'batch' : layout}
                submitLabel={isLast ? 'Save and finish' : 'Save and continue →'}
                onBusyChange={setSaving}
                onDirtyChange={setSessionDirty}
                onProofUploaded={onProofUploaded}
                onSaved={async () => {
                  await onResultSaved();
                  setSessionDirty(false);
                  advance();
                }}
                onRowSaved={onResultSaved}
                secondaryActions={
                  hasWorksheet ? (
                    <Button variant="ghost" type="button" disabled={saving} className="!px-2 !py-1 text-xs" onClick={requestSkipSession}>
                      Skip
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        type="button"
                        disabled={index === 0 || saving}
                        className="!px-2 !py-1 text-xs"
                        onClick={() => requestGoToSession(index - 1)}
                      >
                        ← Previous
                      </Button>
                      <Button variant="ghost" type="button" disabled={saving} className="!px-2 !py-1 text-xs" onClick={requestSkipSession}>
                        Skip
                      </Button>
                    </>
                  )
                }
              />
            )}
          </div>
        </div>

        {saving && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">
              <Icon name="progress_activity" className="!text-[18px] animate-spin" />
              Saving…
            </div>
          </div>
        )}
      </div>

      {leaveConfirm && (
        <UnsavedChangesDialog
          title={
            leaveConfirm.kind === 'close'
              ? 'Close without saving?'
              : leaveConfirm.kind === 'layout'
                ? 'Switch layout without saving?'
                : leaveConfirm.kind === 'skip'
                  ? 'Skip without saving?'
                  : 'Leave this session?'
          }
          message="You have unsaved changes. Save before leaving, or your uploads and answers will be lost."
          saving={saving}
          onStay={() => setLeaveConfirm(null)}
          onDiscard={handleDiscardAndLeave}
          onSave={() => void handleSaveAndLeave()}
        />
      )}
    </div>
  );
}
