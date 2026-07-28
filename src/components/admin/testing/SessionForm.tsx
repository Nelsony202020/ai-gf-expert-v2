// Session form: compact answers (table or step view), proof in a side drawer,
// optional session-level bulk proof. One Save all for answers.

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState, type ReactNode } from 'react';
import { api, dataApi, type EntityRow } from '../api';
import { Button, ErrorNote, Icon, TextInput, useAsync } from '../ui';
import { ChatUnderstandingGrid } from './ChatUnderstandingGrid';
import { TestingHint } from './TestingHint';
import { EvidenceInput, type RawValue } from './EvidenceInput';
import { PricingBasicsForm } from './PricingBasicsForm';
import { QuestionLabel } from './QuestionLabel';
import { renderPublicResult } from './presentation';
import type { AutofillSuggestion } from './pricingAutofill';
import { SessionAnswerTable } from './SessionAnswerTable';
import { SessionProofZone } from './SessionProofZone';
import { ProofDrawer } from './ProofDrawer';
import { NoteDrawer } from './NoteDrawer';
import {
  formatAnswerSummary,
  rowState,
  statusDotClass,
  type SessionItem,
} from './sessionUi';
import { ChatModesField, parseChatModesDraft } from './ChatModesField';
import { BonusFeaturesField, formatBonusFeaturesSummary } from './BonusExtrasField';
import { SupportContactField, parseSupportContactDraft } from './SupportContactField';
import { COMBINED_EVIDENCE_SLUGS, type TestSessionDef } from './sessions';
import { readImageEditingStatus } from './capabilityGating';
import './testing-ui.css';
import { WorksheetGrid } from './WorksheetGrid';
import { WorksheetStepView } from './WorksheetStepView';
import { deriveWorksheetExtended } from './worksheetScoring';
import { pctFromRatio, ratioDenominatorFromSample } from './sampleRatio';
import { controlKind } from './presentation';
import { WORKSHEETS, capWorksheetRows, type DerivedColumn, type WorksheetRow } from './worksheets';

const SUPPORT_RATING_SLUGS = new Set(['support-reach', 'support-speed', 'support-helpfulness']);

export type { SessionItem };

export type SessionLayout = 'batch' | 'step';

interface Draft {
  raw: RawValue | undefined;
  na: boolean;
  dirty: boolean;
  internalNotes: string;
  notesDirty: boolean;
}

function initialDraft(result: EntityRow | undefined): Draft {
  return {
    raw: (result?.rawValue as RawValue | undefined) ?? undefined,
    na: Boolean(result?.notApplicable),
    dirty: false,
    internalNotes: String(result?.internalNotes ?? ''),
    notesDirty: false,
  };
}

export type SessionFormHandle = {
  /** Save dirty answers without triggering onSaved (no auto-advance). */
  saveWithoutContinue: () => Promise<boolean>;
};

export const SessionForm = forwardRef<SessionFormHandle, {
  session: TestSessionDef;
  items: SessionItem[];
  resultByDef: Map<string, EntityRow>;
  resultBySlug?: Map<string, EntityRow>;
  runId: string;
  productId?: string;
  categorySlug?: string;
  onSaved: () => Promise<void> | void;
  onRowSaved?: () => Promise<void> | void;
  suggestions?: Map<string, AutofillSuggestion>;
  layout?: SessionLayout;
  submitLabel?: string;
  secondaryActions?: ReactNode;
  onBusyChange?: (busy: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
  productFields?: Record<string, unknown>;
  productSlug?: string;
  /** Scroll to and highlight this row when the form opens. */
  initialFocusDefId?: string | null;
  /** Bumps when the same row should be re-focused without changing sessions. */
  focusNonce?: number;
}>(function SessionForm(
  {
    session,
    items,
    resultByDef,
    resultBySlug,
    runId,
    productId,
    categorySlug,
    onSaved,
    onRowSaved,
    suggestions,
    layout = 'batch',
    submitLabel = 'Save all results',
    secondaryActions,
    onBusyChange,
    onDirtyChange,
    productFields,
    productSlug,
    initialFocusDefId,
    focusNonce = 0,
  },
  ref,
) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const map: Record<string, Draft> = {};
    for (const { def } of items) map[def.id] = initialDraft(resultByDef.get(def.id));
    return map;
  });
  const [drawerDefId, setDrawerDefId] = useState<string | null>(null);
  const [noteDefId, setNoteDefId] = useState<string | null>(null);
  const [activeDefId, setActiveDefId] = useState<string | null>(null);
  const [highlightDefId, setHighlightDefId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [proofCounts, setProofCounts] = useState<Map<string, number>>(new Map());
  const [dropTargetDefId, setDropTargetDefId] = useState<string | null>(null);
  const sampleStorageKey = `testing-sample:${runId}:${session.id}`;
  const [sampleSize, setSampleSize] = useState<number>(() => {
    if (!session.sampleSizeField) return 25;
    try {
      const stored = localStorage.getItem(sampleStorageKey);
      if (stored) return Number(stored) || session.sampleSizeField.default || 25;
    } catch {
      /* ignore */
    }
    return session.sampleSizeField.default ?? 25;
  });
  const { busy, error, run } = useAsync();
  const [saving, setSaving] = useState(false);

  const isBlocked = saving || busy;

  const imageEditingLocked =
    session.id === 'image-editing-test' &&
    resultBySlug &&
    readImageEditingStatus(resultBySlug) === 'no';

  const editingAccuracyDef = useMemo(
    () => items.find(({ def }) => String(def.slug) === 'editing-accuracy')?.def,
    [items],
  );

  useEffect(() => {
    if (!imageEditingLocked || !editingAccuracyDef) return;
    setDrafts((prev) => {
      const cur = prev[editingAccuracyDef.id];
      if (cur?.na) return prev;
      return {
        ...prev,
        [editingAccuracyDef.id]: {
          ...(cur ?? { raw: undefined, na: false, dirty: false }),
          raw: { status: 'na' },
          na: true,
          dirty: true,
        },
      };
    });
  }, [imageEditingLocked, editingAccuracyDef?.id]);

  function fixedDenominatorFor(def: EntityRow): number | undefined {
    if (!session.sampleSizeField) return undefined;
    return ratioDenominatorFromSample(String(def.slug ?? ''), sampleSize);
  }

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
    () => items.filter(({ def }) => drafts[def.id]?.dirty || drafts[def.id]?.notesDirty).length,
    [items, drafts],
  );

  useEffect(() => {
    onDirtyChange?.(dirtyCount > 0);
  }, [dirtyCount, onDirtyChange]);

  const worksheet = WORKSHEETS[session.id];
  const simplifiedWorksheet = Boolean(
    worksheet &&
      ['chat-understanding', 'image-batch-review', 'image-consistency', 'video-batch-review'].includes(
        session.id,
      ),
  );
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

  const modeTypesDef = useMemo(
    () => items.find(({ def }) => String(def.slug) === 'mode-types')?.def,
    [items],
  );

  const liveCamDef = useMemo(
    () => items.find(({ def }) => String(def.slug) === 'live-cam')?.def,
    [items],
  );

  const supportChannelsDef = useMemo(
    () => items.find(({ def }) => String(def.slug) === 'support-channels')?.def,
    [items],
  );

  const supportUnavailable = useMemo(() => {
    const def = items.find(({ def: d }) => String(d.slug) === 'support-available')?.def;
    if (!def) return false;
    const d = drafts[def.id] ?? initialDraft(resultByDef.get(def.id));
    return Boolean(d.raw && 'status' in d.raw && d.raw.status === 'no');
  }, [items, drafts, resultByDef]);

  const visibleStandaloneItems = useMemo(
    () =>
      standaloneItems.filter(({ def }) => {
        if (COMBINED_EVIDENCE_SLUGS.has(String(def.slug ?? ''))) return false;
        if (supportUnavailable && SUPPORT_RATING_SLUGS.has(String(def.slug ?? ''))) return false;
        return true;
      }),
    [standaloneItems, supportUnavailable],
  );

  const worksheetItems = useMemo(
    () =>
      worksheet && worksheetDefs.size > 0
        ? items.filter(({ def }) => worksheetDefIds.has(def.id))
        : [],
    [items, worksheet, worksheetDefs, worksheetDefIds],
  );

  const useTable = layout === 'batch' && visibleStandaloneItems.length >= 3 && !worksheet;

  const initialWorksheetRows = useMemo(() => {
    if (!worksheet) return undefined;
    let found: WorksheetRow[] | undefined;
    for (const def of worksheetDefs.values()) {
      const raw = resultByDef.get(def.id)?.rawValue as RawValue | undefined;
      const rows =
        raw && 'detail' in raw ? (raw.detail?.worksheetRows as WorksheetRow[] | undefined) : undefined;
      if (Array.isArray(rows) && rows.length > 0) {
        found = rows;
        break;
      }
    }
    return capWorksheetRows(session.id, worksheet, found, productSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, productSlug]);

  const initialWorksheetRowsJson = useMemo(
    () => JSON.stringify(initialWorksheetRows ?? []),
    [initialWorksheetRows],
  );

  const suggestionItems = useMemo(
    () => items.filter(({ def }) => suggestions?.has(def.id) && !worksheetDefIds.has(def.id)),
    [items, suggestions, worksheetDefIds],
  );

  const unfilledSuggestions = suggestionItems.filter(({ def }) => {
    const draft = drafts[def.id];
    return !draft?.na && draft?.raw === undefined;
  });

  const stepItems = visibleStandaloneItems;
  const currentStep = stepItems[Math.min(stepIndex, Math.max(stepItems.length - 1, 0))];

  useEffect(() => {
    if (layout === 'step' && currentStep) setActiveDefId(currentStep.def.id);
  }, [layout, stepIndex, currentStep?.def.id]);

  useEffect(() => {
    if (!initialFocusDefId) return;
    const inSession = items.some(({ def }) => def.id === initialFocusDefId);
    if (!inSession) return;

    if (layout === 'step') {
      const idx = stepItems.findIndex(({ def }) => def.id === initialFocusDefId);
      if (idx >= 0) setStepIndex(idx);
    }
    setActiveDefId(initialFocusDefId);
    setHighlightDefId(initialFocusDefId);
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-session-row="${initialFocusDefId}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      document
        .querySelector(`[data-testing-def="${initialFocusDefId}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    const timer = window.setTimeout(() => setHighlightDefId(null), 4000);
    return () => window.clearTimeout(timer);
  }, [initialFocusDefId, focusNonce, layout, stepItems, items]);

  useEffect(() => {
    if (useTable && !activeDefId && standaloneItems[0]) {
      setActiveDefId(standaloneItems[0].def.id);
    }
  }, [useTable, activeDefId, standaloneItems]);

  function focusNextRow(fromDefId?: string | null) {
    const ids = standaloneItems.map(({ def }) => def.id);
    const idx = fromDefId ? ids.indexOf(fromDefId) : ids.indexOf(activeDefId ?? '');
    const next = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : ids[0];
    if (next) {
      setActiveDefId(next);
      requestAnimationFrame(() => {
        const row = document.querySelector(`[data-session-row="${next}"]`);
        const input = row?.querySelector('input, textarea, select, button[type="button"]') as HTMLElement | null;
        input?.focus();
      });
    }
  }

  useEffect(() => {
    if (!useTable) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab' || e.shiftKey) return;
      const el = e.target as HTMLElement | null;
      if (!el?.closest('[data-session-table]')) return;
      if (!el.matches('input, textarea, select')) return;
      e.preventDefault();
      focusNextRow(activeDefId);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [useTable, activeDefId, standaloneItems]);

  async function uploadFilesToDef(defId: string, files: FileList | File[]) {
    const item = standaloneItems.find(({ def }) => def.id === defId);
    if (!item) return;
    const def = item.def;
    const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    const accepted = Array.from(files).filter((f) => ACCEPTED.includes(f.type));
    if (accepted.length === 0) return;
    setDrawerDefId(defId);
    await run(async () => {
      let resultId = resultByDef.get(defId)?.id;
      if (!resultId) {
        const created = await dataApi.create(
          'evidenceResults',
          { testDate: Date.now() },
          { testRun: runId, evidenceDefinition: defId, product: productId ?? null },
        );
        resultId = created.id;
      }
      for (const file of accepted) {
        const form = new FormData();
        form.set('file', file);
        form.set('adult', '0');
        form.set('role', 'proof');
        form.set('altText', `Evidence: ${def.name}`);
        form.set('evidenceResultId', resultId);
        if (productId) form.set('productId', productId);
        await api.upload('/api/admin/media/upload', form);
      }
      await reloadProofCounts();
      await (onRowSaved ?? onSaved)();
      return true;
    });
  }

  async function uploadWorksheetProof(files: File[]): Promise<{ id: string; url?: string }[]> {
    const def = worksheetItems[0]?.def;
    if (!def) return [];
    const ACCEPTED =
      session.id === 'video-batch-review'
        ? ['video/mp4', 'video/webm', 'video/quicktime']
        : ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const accepted = files.filter((f) => ACCEPTED.includes(f.type));
    if (accepted.length === 0) return [];
    let resultId = resultByDef.get(def.id)?.id;
    if (!resultId) {
      const created = await dataApi.create(
        'evidenceResults',
        { testDate: Date.now() },
        { testRun: runId, evidenceDefinition: def.id, product: productId ?? null },
      );
      resultId = created.id;
    }
    const uploaded: { id: string; url?: string }[] = [];
    for (const file of accepted) {
      const form = new FormData();
      form.set('file', file);
      form.set('adult', '0');
      form.set('role', 'proof');
      form.set('altText', `Evidence: ${def.name}`);
      form.set('evidenceResultId', resultId);
      if (productId) form.set('productId', productId);
      uploaded.push(await api.upload<{ id: string; url?: string }>('/api/admin/media/upload', form));
    }
    void reloadProofCounts();
    return uploaded;
  }

  async function markUndone(defId: string) {
    patchDraft(defId, { raw: undefined, na: false });
    setSaving(true);
    onBusyChange?.(true);
    try {
      const existing = resultByDef.get(defId);
      const fields = {
        rawValue: null,
        notApplicable: false,
        isUnknown: false,
        testDate: Date.now(),
      };
      if (existing) {
        await dataApi.update('evidenceResults', existing.id, fields);
      }
      setDrafts((prev) => ({
        ...prev,
        [defId]: { raw: undefined, na: false, dirty: false },
      }));
      await onRowSaved?.();
    } finally {
      setSaving(false);
      onBusyChange?.(false);
    }
  }

  function patchDraft(defId: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [defId]: {
        ...(prev[defId] ?? initialDraft(resultByDef.get(defId))),
        ...patch,
        dirty: true,
      },
    }));
  }

  function patchNotes(defId: string, internalNotes: string) {
    setDrafts((prev) => ({
      ...prev,
      [defId]: {
        ...(prev[defId] ?? initialDraft(resultByDef.get(defId))),
        internalNotes,
        notesDirty: true,
      },
    }));
  }

  function patchDraftWithCascade(defId: string, patch: Partial<Draft>) {
    patchDraft(defId, patch);
    const def = items.find(({ def: d }) => d.id === defId)?.def;
    if (
      def &&
      String(def.slug) === 'save-memories' &&
      patch.raw &&
      'status' in patch.raw &&
      patch.raw.status === 'no'
    ) {
      const editDef = items.find(({ def: d }) => String(d.slug) === 'edit-memories')?.def;
      if (editDef) patchDraft(editDef.id, { raw: { status: 'no' } });
    }
  }

  function isEditMemoriesBlocked(): boolean {
    const saveDef = items.find(({ def: d }) => String(d.slug) === 'save-memories')?.def;
    if (!saveDef) return false;
    const saveDraft = drafts[saveDef.id] ?? initialDraft(resultByDef.get(saveDef.id));
    return Boolean(
      saveDraft.raw && 'status' in saveDraft.raw && saveDraft.raw.status === 'no',
    );
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
    const computed = deriveWorksheetExtended(worksheet!, rows, session.id);
    const rowsJson = JSON.stringify(rows);
    const rowsDirty = rowsJson !== initialWorksheetRowsJson;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const col of computed) {
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
      if (rowsDirty && worksheetItems[0]) {
        const def = worksheetItems[0].def;
        const cur = next[def.id] ?? initialDraft(resultByDef.get(def.id));
        const raw = cur.raw && typeof cur.raw === 'object' && 'value' in cur.raw ? cur.raw : { value: 0 };
        next[def.id] = {
          ...cur,
          raw: {
            ...raw,
            detail: {
              ...(raw.detail && typeof raw.detail === 'object' ? raw.detail : {}),
              worksheetRows: rows,
            },
          },
          dirty: true,
        };
      }
      return next;
    });
  }

  /** Keep ratio denominators in sync with the session sample size (hidden from tester). */
  useEffect(() => {
    if (!session.sampleSizeField) return;
    setDrafts((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const { def } of standaloneItems) {
        if (controlKind(def) !== 'ratio') continue;
        const fixed = ratioDenominatorFromSample(String(def.slug ?? ''), sampleSize);
        if (fixed === undefined) continue;
        const cur = next[def.id] ?? initialDraft(resultByDef.get(def.id));
        if (cur.na) continue;
        const raw = cur.raw;
        const detail =
          raw && 'detail' in raw ? (raw.detail as Record<string, unknown> | undefined) : undefined;
        const numerator = detail?.numerator;
        const prevDen = detail?.denominator;
        if (prevDen === fixed && (cur.dirty || numerator === undefined)) continue;
        const num = typeof numerator === 'number' ? numerator : null;
        const computed = num !== null ? pctFromRatio(num, fixed) : null;
        next[def.id] = {
          ...cur,
          raw: {
            value: computed ?? (raw && 'value' in raw ? raw.value : 0),
            detail: {
              ...(detail ?? {}),
              denominator: fixed,
              ...(num !== null ? { numerator: num } : {}),
              ...(computed === null ? { incomplete: true } : { incomplete: false }),
            },
          },
          dirty: cur.dirty,
        };
        changed = true;
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleSize, session.id, standaloneItems.length]);

  async function persistChanges(): Promise<boolean> {
    if (saving) return false;
    setSaving(true);
    onBusyChange?.(true);
    try {
      const changed = items.filter(
        ({ def }) => drafts[def.id]?.dirty || drafts[def.id]?.notesDirty,
      );
      if (changed.length === 0) return true;
      const ok = await run(async () => {
        await Promise.all(
          changed.map(async ({ def }) => {
            const draft = drafts[def.id];
            const existing = resultByDef.get(def.id);
            let raw = draft.na ? ({ status: 'na' } as RawValue) : draft.raw;
            if (!draft.na && raw && 'detail' in raw && controlKind(def) === 'ratio') {
              const fixed = fixedDenominatorFor(def);
              if (fixed !== undefined) {
                const detail = (raw.detail ?? {}) as Record<string, unknown>;
                raw = {
                  ...raw,
                  detail: { ...detail, denominator: fixed },
                };
              }
            }
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
              internalNotes: draft.internalNotes.trim() || undefined,
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
          }),
        );
        return true;
      });
      if (ok) {
        setDrafts((prev) => {
          const next = { ...prev };
          for (const id of Object.keys(next)) {
            next[id] = { ...next[id], dirty: false, notesDirty: false };
          }
          return next;
        });
        await onRowSaved?.();
      }
      return Boolean(ok);
    } finally {
      setSaving(false);
      onBusyChange?.(false);
    }
  }

  async function saveAll() {
    const changed = items.filter(({ def }) => drafts[def.id]?.dirty);
    if (changed.length === 0) {
      await onSaved();
      return;
    }
    const ok = await persistChanges();
    if (ok) await onSaved();
  }

  useImperativeHandle(ref, () => ({
    saveWithoutContinue: persistChanges,
  }));

  const drawerDef = drawerDefId ? items.find(({ def }) => def.id === drawerDefId)?.def : null;

  function patchChatModesChat(chatRaw: RawValue | undefined) {
    const chatDef = items.find(({ def }) => String(def.slug) === 'chat-modes')?.def;
    if (chatDef) patchDraft(chatDef.id, { raw: chatRaw });
  }

  function patchChatModesMode(modeRaw: RawValue | undefined) {
    if (modeTypesDef) patchDraft(modeTypesDef.id, { raw: modeRaw });
  }

  function patchLiveCam(liveRaw: RawValue | undefined) {
    if (liveCamDef) patchDraft(liveCamDef.id, { raw: liveRaw });
  }

  function patchSupportChannels(channelsRaw: RawValue | undefined) {
    if (supportChannelsDef) patchDraft(supportChannelsDef.id, { raw: channelsRaw });
  }

  async function ensureResultForDef(defId: string): Promise<string> {
    let resultId = resultByDef.get(defId)?.id;
    if (!resultId) {
      const created = await dataApi.create(
        'evidenceResults',
        { testDate: Date.now() },
        { testRun: runId, evidenceDefinition: defId, product: productId ?? null },
      );
      resultId = created.id;
      await (onRowSaved ?? onSaved)?.();
    }
    return resultId;
  }

  function renderEvidenceControl(def: EntityRow, draft: { raw: RawValue | undefined; na: boolean }) {
    if (String(def.slug) === 'chat-modes' && modeTypesDef) {
      const modeDraft = drafts[modeTypesDef.id] ?? initialDraft(resultByDef.get(modeTypesDef.id));
      const chatRaw =
        draft.raw && 'status' in draft.raw && draft.raw.status === 'na' ? undefined : draft.raw;
      const modeRaw =
        modeDraft.raw && 'status' in modeDraft.raw && modeDraft.raw.status === 'na'
          ? undefined
          : modeDraft.raw;
      return (
        <ChatModesField
          disabled={isBlocked}
          chatRaw={chatRaw}
          modeRaw={modeRaw}
          onChatChange={patchChatModesChat}
          onModeChange={patchChatModesMode}
        />
      );
    }
    if (String(def.slug) === 'platform-extras-list' && liveCamDef) {
      const listRaw =
        draft.raw && 'status' in draft.raw && draft.raw.status === 'na' ? undefined : draft.raw;
      const liveDraft =
        drafts[liveCamDef.id] ?? initialDraft(resultByDef.get(liveCamDef.id));
      const liveRaw =
        liveDraft.raw && 'status' in liveDraft.raw && liveDraft.raw.status === 'na'
          ? undefined
          : liveDraft.raw;
      const result = resultByDef.get(def.id);
      const liveCamResult = liveCamDef ? resultByDef.get(liveCamDef.id) : undefined;
      return (
        <BonusFeaturesField
          disabled={isBlocked}
          def={def}
          liveCamDef={liveCamDef}
          listRaw={listRaw}
          liveRaw={liveRaw}
          listResultId={result?.id}
          liveCamResultId={liveCamResult?.id}
          productId={productId}
          ensureListResultId={() => ensureResultForDef(def.id)}
          ensureLiveCamResultId={() => ensureResultForDef(liveCamDef.id)}
          onListChange={(v) => patchDraftWithCascade(def.id, { raw: v })}
          onLiveChange={patchLiveCam}
          onUploaded={() => void reloadProofCounts()}
        />
      );
    }
    if (String(def.slug) === 'support-available' && supportChannelsDef) {
      const channelsDraft =
        drafts[supportChannelsDef.id] ?? initialDraft(resultByDef.get(supportChannelsDef.id));
      const availRaw =
        draft.raw && 'status' in draft.raw && draft.raw.status === 'na' ? undefined : draft.raw;
      const channelsRaw =
        channelsDraft.raw && 'status' in channelsDraft.raw && channelsDraft.raw.status === 'na'
          ? undefined
          : channelsDraft.raw;
      return (
        <SupportContactField
          disabled={isBlocked}
          availRaw={availRaw}
          channelsRaw={channelsRaw}
          onAvailChange={(v) => patchDraftWithCascade(def.id, { raw: v })}
          onChannelsChange={patchSupportChannels}
        />
      );
    }
    return (
      <EvidenceInput
        def={def}
        categorySlug={categorySlug}
        productFields={productFields}
        fixedDenominator={fixedDenominatorFor(def)}
        value={draft.raw && 'status' in draft.raw && draft.raw.status === 'na' ? undefined : draft.raw}
        onChange={(v) => patchDraftWithCascade(def.id, { raw: v })}
        disabled={isBlocked || (String(def.slug) === 'edit-memories' && isEditMemoriesBlocked())}
      />
    );
  }

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
          <div className="flex items-center gap-2">
            {state === 'done' && !draft.na && (
              <button
                type="button"
                className="text-[11px] font-medium text-slate-400 hover:text-pink-600 dark:hover:text-pink-400"
                disabled={isBlocked}
                onClick={() => void markUndone(def.id)}
              >
                Mark undone
              </button>
            )}
            <span className={statusDotClass(state)} title={state} />
          </div>
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          <QuestionLabel def={def} categorySlug={categorySlug} required={Boolean(def.required)} />
        </h3>
        {!draft.na && renderEvidenceControl(def, draft)}
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
              disabled={isBlocked}
              onChange={(e) => patchDraft(def.id, { na: e.target.checked })}
            />
            Not applicable — feature not available
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

      {session.intro && !simplifiedWorksheet && !imageEditingLocked && (
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <span className="font-medium text-slate-600 dark:text-slate-400">Session tip</span>
          <TestingHint text={session.intro} />
        </p>
      )}

      {session.sampleSizeField && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/40">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {session.sampleSizeField.label}
          </label>
          <TextInput
            type="number"
            min={1}
            className="!w-24 !py-1 text-sm"
            value={sampleSize}
            onChange={(e) => {
              const n = Math.max(1, Number(e.target.value) || 1);
              setSampleSize(n);
              try {
                localStorage.setItem(sampleStorageKey, String(n));
              } catch {
                /* ignore */
              }
            }}
          />
          <span className="text-xs text-slate-500">
            Sample size is set once — enter only how many passed below.
          </span>
        </div>
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

      {imageEditingLocked && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          <p className="font-medium text-slate-800 dark:text-slate-100">Not applicable — no image editing</p>
          <p className="mt-1 text-xs">
            You answered <strong>No</strong> to image editing in Generation experience &amp; tools, so this
            accuracy test is excluded from the score.
          </p>
        </div>
      )}

      {worksheet && worksheetDefs.size > 0 && !imageEditingLocked && (
        <>
          {session.id === 'chat-understanding' ? (
            <ChatUnderstandingGrid
              key={session.id}
              config={worksheet}
              sessionId={session.id}
              defsBySlug={worksheetDefs}
              initialRows={initialWorksheetRows}
              disabled={isBlocked}
              onChange={handleWorksheetChange}
              onRowProof={(rowIdx) => {
                const def = worksheetDefs.get('memory');
                if (def) setDrawerDefId(def.id);
              }}
            />
          ) : layout === 'step' ? (
            <WorksheetStepView
              key={`${session.id}:step`}
              sessionId={session.id}
              config={worksheet}
              defsBySlug={worksheetDefs}
              initialRows={initialWorksheetRows}
              productSlug={productSlug}
              disabled={isBlocked}
              onChange={handleWorksheetChange}
              onOpenProof={() => {
                const first = worksheetItems[0]?.def;
                if (first) setDrawerDefId(first.id);
              }}
              onUploadProof={uploadWorksheetProof}
            />
          ) : (
            <WorksheetGrid
              key={session.id}
              config={worksheet}
              sessionId={session.id}
              defsBySlug={worksheetDefs}
              initialRows={initialWorksheetRows}
              disabled={isBlocked}
              onChange={handleWorksheetChange}
            />
          )}
          {!simplifiedWorksheet && renderWorksheetProofLinks()}
        </>
      )}

      {session.id === 'subscription-basics' && categorySlug === 'pricing' ? (
        <PricingBasicsForm
          items={items}
          categorySlug={categorySlug}
          drafts={drafts}
          disabled={isBlocked}
          onPatch={(defId, raw) => patchDraft(defId, { raw })}
        />
      ) : layout === 'step' && !worksheet ? (
        renderStepView()
      ) : useTable && !imageEditingLocked ? (
        <SessionAnswerTable
          items={visibleStandaloneItems}
          categorySlug={categorySlug}
          drafts={drafts}
          resultByDef={resultByDef}
          proofCounts={proofCounts}
          activeDefId={activeDefId}
          highlightDefId={highlightDefId}
          dropTargetDefId={dropTargetDefId}
          busy={isBlocked}
          productFields={productFields}
          fixedDenominatorFor={fixedDenominatorFor}
          modeTypesDef={modeTypesDef}
          liveCamDef={liveCamDef}
          supportChannelsDef={supportChannelsDef}
          productId={productId}
          onPatchChatModesChat={patchChatModesChat}
          onPatchChatModesMode={patchChatModesMode}
          onPatchLiveCam={patchLiveCam}
          onPatchSupportChannels={patchSupportChannels}
          ensureResultForDef={ensureResultForDef}
          onProofUploaded={() => void reloadProofCounts()}
          onPatch={patchDraftWithCascade}
          editMemoriesBlocked={isEditMemoriesBlocked()}
          onOpenProof={setDrawerDefId}
          onOpenNote={setNoteDefId}
          onFocusRow={setActiveDefId}
          onDragOverRow={setDropTargetDefId}
          onDragLeaveTable={() => setDropTargetDefId(null)}
          onDropFiles={(defId, files) => void uploadFilesToDef(defId, files)}
        />
      ) : (
        visibleStandaloneItems.length > 0 &&
        !imageEditingLocked && (
          <div className="space-y-2">
            {visibleStandaloneItems.map(({ def }) => {
              const draft = drafts[def.id] ?? initialDraft(resultByDef.get(def.id));
              const result = resultByDef.get(def.id);
              const state = rowState(def, draft, result);
              const isActive = activeDefId === def.id;
              const summary = (() => {
                if (String(def.slug) === 'chat-modes' && modeTypesDef) {
                  const modeDraft = drafts[modeTypesDef.id];
                  const p = parseChatModesDraft(draft.raw, modeDraft?.raw);
                  if (p.hasModes === 'no') return 'No';
                  if (p.hasModes !== 'yes') return '—';
                  const rated = p.modes.filter((m) => m.rating).length;
                  return `${p.count || '?'} modes · ${rated}/2 rated`;
                }
                if (String(def.slug) === 'platform-extras-list' && liveCamDef) {
                  const liveDraft = drafts[liveCamDef.id];
                  return formatBonusFeaturesSummary(draft.raw, liveDraft?.raw);
                }
                if (String(def.slug) === 'support-available' && supportChannelsDef) {
                  const channelsDraft = drafts[supportChannelsDef.id];
                  const p = parseSupportContactDraft(draft.raw, channelsDraft?.raw);
                  if (p.hasSupport === 'no') return 'No support';
                  if (p.hasSupport === 'yes') {
                    const n = Object.values(p.channels).filter((v) => v.trim()).length;
                    return n > 0 ? `Yes · ${n} link${n === 1 ? '' : 's'}` : 'Yes';
                  }
                  return '—';
                }
                return formatAnswerSummary(def, draft.raw, draft.na);
              })();
              const proofN = result?.id ? (proofCounts.get(result.id) ?? 0) : 0;
              const suggestion = suggestions?.get(def.id);

            const isHighlighted = highlightDefId === def.id;

              if (!isActive && visibleStandaloneItems.length > 1) {
                return (
                  <button
                    key={def.id}
                    data-testing-def={def.id}
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left hover:border-[var(--testing-accent-border)] hover:bg-[var(--testing-accent-soft)] dark:border-slate-700 ${
                      isHighlighted
                        ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400 dark:border-amber-600 dark:bg-amber-950/30'
                        : 'border-slate-200'
                    }`}
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
                  data-testing-def={def.id}
                  className={`rounded-lg border bg-white p-3 shadow-sm dark:bg-slate-900/40 ${
                    isHighlighted
                      ? 'border-amber-400 ring-2 ring-amber-400 dark:border-amber-600'
                      : 'border-[var(--testing-accent-border)]/80 dark:border-[var(--testing-accent-border)]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      <QuestionLabel def={def} categorySlug={categorySlug} required={Boolean(def.required)} />
                    </p>
                    <span className={statusDotClass(state)} />
                  </div>
                  {!draft.na && <div className="mt-2">{renderEvidenceControl(def, draft)}</div>}
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
                        disabled={isBlocked}
                        onChange={(e) => patchDraft(def.id, { na: e.target.checked })}
                      />
                      Not applicable — feature not available
                    </label>
                    <button
                      type="button"
                      className="testing-link text-xs font-medium hover:underline"
                      onClick={() => setDrawerDefId(def.id)}
                    >
                      Proof &amp; notes{proofN > 0 ? ` (${proofN})` : ''}
                    </button>
                    {state === 'done' && !draft.na && (
                      <button
                        type="button"
                        className="text-xs text-slate-400 hover:text-pink-600"
                        disabled={isBlocked}
                        onClick={() => void markUndone(def.id)}
                      >
                        Mark undone
                      </button>
                    )}
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
          drafts={drafts}
          liveCamDef={liveCamDef}
          onUploaded={() => void reloadProofCounts().then(() => onRowSaved?.())}
        />
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700">
        <div className="flex items-center gap-2">{secondaryActions}</div>
        <Button
          type="button"
          className="testing-btn-primary focus-visible:!ring-[var(--testing-accent)]"
          onClick={() => void saveAll()}
          disabled={isBlocked}
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Icon name="progress_activity" className="!text-[16px] animate-spin" />
              Saving…
            </span>
          ) : dirtyCount > 0 ? (
            `${submitLabel} (${dirtyCount})`
          ) : (
            submitLabel
          )}
        </Button>
      </div>

      {drawerDef && (
        <ProofDrawer
          def={drawerDef}
          categorySlug={categorySlug}
          runId={runId}
          productId={productId}
          existing={resultByDef.get(drawerDef.id) ?? null}
          onClose={() => setDrawerDefId(null)}
          onSaved={async () => {
            await reloadProofCounts();
            await (onRowSaved ?? onSaved)();
          }}
        />
      )}

      {noteDefId && (() => {
        const noteDef = items.find(({ def }) => def.id === noteDefId)?.def;
        if (!noteDef) return null;
        const noteDraft = drafts[noteDef.id] ?? initialDraft(resultByDef.get(noteDef.id));
        return (
          <NoteDrawer
            def={noteDef}
            categorySlug={categorySlug}
            notes={noteDraft.internalNotes}
            onClose={() => setNoteDefId(null)}
            onSave={(notes) => patchNotes(noteDef.id, notes)}
          />
        );
      })()}
    </div>
  );
});
