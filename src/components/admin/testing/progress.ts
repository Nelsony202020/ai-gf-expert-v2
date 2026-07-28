// Tester-facing progress counts. The scoring engine still tracks all evidence
// definitions — these helpers describe how much work the tester actually does
// (sessions, grids, standalone questions). Required-only metrics drive the
// progress header; optional answers never inflate completion.

import type { EntityRow } from '../api';
import { evidenceRequirements } from './presentation';
import { WORKSHEETS } from './worksheets';
import type { SessionItem } from './sessionUi';

export type SessionStatus =
  | 'complete'
  | 'in_progress'
  | 'not_started'
  | 'skipped'
  | 'blocked'
  | 'needs_review';

export interface RequiredInputUnit {
  /** Stable id for the unit (worksheet id or def id). */
  id: string;
  defIds: string[];
  required: boolean;
}

export interface SessionProgressSnapshot {
  sessionIndex: number;
  sessionKey: string;
  categoryName: string;
  sessionTitle: string;
  status: SessionStatus;
  requiredTotal: number;
  requiredComplete: number;
  requiredRemaining: number;
  missingRequiredLabels: string[];
  /** Required inputs still incomplete — used for jump-to-item navigation. */
  missingRequiredItems: { defId: string; label: string }[];
}

export interface RunProgressSnapshot {
  totalRequired: number;
  completedRequired: number;
  remainingRequired: number;
  completionPct: number;
  sessions: SessionProgressSnapshot[];
  resumeIndex: number;
  nextIncompleteIndex: number;
  lastEditedAt: number | null;
}

export interface ProgressContext {
  hasValue: (defId: string) => boolean;
  getResult: (defId: string) => EntityRow | undefined;
  attachmentCount: (defId: string) => number;
  isSkipped: (sessionKey: string) => boolean;
}

/** How many things a tester fills in for one session (1 grid counts as 1). */
export function sessionInputCount(sessionId: string, evidenceCount: number): number {
  const worksheet = WORKSHEETS[sessionId];
  if (!worksheet) return evidenceCount;
  const covered = worksheet.columns.length;
  const standalone = Math.max(0, evidenceCount - covered);
  return standalone + 1;
}

export function totalSessionInputs(
  sessions: { session: { id: string }; items: unknown[] }[],
): number {
  return sessions.reduce((sum, s) => sum + sessionInputCount(s.session.id, s.items.length), 0);
}

function worksheetSlugSet(sessionId: string): Set<string> | null {
  const worksheet = WORKSHEETS[sessionId];
  if (!worksheet) return null;
  return new Set(worksheet.columns.map((c) => c.defSlug));
}

/** Required input units for one session (worksheet grid = 1 unit). */
export function sessionRequiredUnits(sessionId: string, items: SessionItem[]): RequiredInputUnit[] {
  const worksheetSlugs = worksheetSlugSet(sessionId);
  const units: RequiredInputUnit[] = [];
  const worksheetDefIds: string[] = [];
  const standalone: SessionItem[] = [];

  for (const item of items) {
    const slug = String(item.def.slug);
    if (worksheetSlugs?.has(slug)) {
      if (item.def.required) worksheetDefIds.push(item.def.id);
    } else if (item.def.required) {
      standalone.push(item);
    }
  }

  if (worksheetSlugs && worksheetDefIds.length > 0) {
    units.push({ id: `worksheet:${sessionId}`, defIds: worksheetDefIds, required: true });
  }

  for (const { def } of standalone) {
    units.push({ id: def.id, defIds: [def.id], required: true });
  }

  return units;
}

export function hasRequiredEvidence(def: EntityRow, attachmentCount: number): boolean {
  const reqs = evidenceRequirements(def);
  if (reqs.length === 0) return true;
  return attachmentCount >= reqs.length;
}

/** Check one required input unit using item lookup for definitions. */
export function unitCompleteWithItems(
  unit: RequiredInputUnit,
  items: SessionItem[],
  ctx: ProgressContext,
): boolean {
  const defById = new Map(items.map(({ def }) => [def.id, def]));
  return unit.defIds.every((defId) => {
    if (!ctx.hasValue(defId)) return false;
    const def = defById.get(defId);
    if (!def?.required) return true;
    return hasRequiredEvidence(def, ctx.attachmentCount(defId));
  });
}

export function sessionHasUnknownRequired(items: SessionItem[], ctx: ProgressContext): boolean {
  return items.some(({ def }) => {
    if (!def.required) return false;
    const r = ctx.getResult(def.id);
    return Boolean(r?.isUnknown);
  });
}

export function sessionHasBlockedRequired(items: SessionItem[], ctx: ProgressContext): boolean {
  return items.some(({ def }) => {
    if (!def.required) return false;
    if (!ctx.hasValue(def.id)) return false;
    return !hasRequiredEvidence(def, ctx.attachmentCount(def.id));
  });
}

export function sessionRequiredProgress(
  sessionId: string,
  items: SessionItem[],
  ctx: ProgressContext,
): { total: number; complete: number; remaining: number; units: RequiredInputUnit[] } {
  const units = sessionRequiredUnits(sessionId, items);
  const complete = units.filter((u) => unitCompleteWithItems(u, items, ctx)).length;
  return {
    units,
    total: units.length,
    complete,
    remaining: Math.max(0, units.length - complete),
  };
}

/** A session is done when every required input has a value and required proof. */
export function sessionRequiredComplete(
  sessionId: string,
  items: SessionItem[],
  ctx: ProgressContext,
): boolean {
  const { total, complete } = sessionRequiredProgress(sessionId, items, ctx);
  if (total === 0) return true;
  return complete >= total;
}

/** Legacy: all items (required + optional) answered. */
export function sessionComplete(
  items: { def: { id: string } }[],
  hasValue: (defId: string) => boolean,
): boolean {
  return items.length > 0 && items.every(({ def }) => hasValue(def.id));
}

export function deriveSessionStatus(
  sessionId: string,
  items: SessionItem[],
  ctx: ProgressContext,
  sessionKey: string,
): SessionStatus {
  const { total, complete } = sessionRequiredProgress(sessionId, items, ctx);
  if (total === 0) {
    if (items.length === 0) return 'not_started';
    const answered = items.filter(({ def }) => ctx.hasValue(def.id)).length;
    if (answered === 0) return 'not_started';
    if (answered >= items.length) return 'complete';
    return 'in_progress';
  }

  if (complete >= total) {
    if (sessionHasUnknownRequired(items, ctx)) return 'needs_review';
    return 'complete';
  }

  if (sessionHasBlockedRequired(items, ctx)) return 'blocked';
  if (ctx.isSkipped(sessionKey)) return 'skipped';
  if (complete === 0) return 'not_started';
  return 'in_progress';
}

export function sessionStatusLabel(status: SessionStatus): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in_progress':
      return 'In progress';
    case 'not_started':
      return 'Not started';
    case 'skipped':
      return 'Skipped';
    case 'blocked':
      return 'Blocked';
    case 'needs_review':
      return 'Needs review';
  }
}

export function computeRunProgress(
  sessions: {
    cat: EntityRow;
    session: { id: string; title: string };
    items: SessionItem[];
  }[],
  ctx: ProgressContext,
  lastEditedAt: number | null,
): RunProgressSnapshot {
  let totalRequired = 0;
  let completedRequired = 0;
  const snapshots: SessionProgressSnapshot[] = [];

  sessions.forEach((s, sessionIndex) => {
    const key = `${String(s.cat.slug)}:${s.session.id}`;
    const prog = sessionRequiredProgress(s.session.id, s.items, ctx);
    totalRequired += prog.total;
    completedRequired += prog.complete;

    const missingRequiredItems = prog.units
      .filter((u) => !unitCompleteWithItems(u, s.items, ctx))
      .flatMap((u) =>
        u.defIds.map((id) => {
          const item = s.items.find(({ def }) => def.id === id);
          return {
            defId: id,
            label: item ? String(item.def.questionLabel ?? item.def.name) : id,
          };
        }),
      );

    const missingRequiredLabels = missingRequiredItems.map((m) => m.label).slice(0, 6);

    snapshots.push({
      sessionIndex,
      sessionKey: key,
      categoryName: String(s.cat.name),
      sessionTitle: s.session.title,
      status: deriveSessionStatus(s.session.id, s.items, ctx, key),
      requiredTotal: prog.total,
      requiredComplete: prog.complete,
      requiredRemaining: prog.remaining,
      missingRequiredLabels,
      missingRequiredItems,
    });
  });

  const remainingRequired = Math.max(0, totalRequired - completedRequired);
  const completionPct =
    totalRequired === 0 ? 0 : Math.round((completedRequired / totalRequired) * 100);

  const nextIncompleteIndex = snapshots.findIndex(
    (s) => s.status !== 'complete' && s.requiredTotal > 0,
  );
  const resumeIndex = (() => {
    const blockedOrProgress = snapshots.findIndex(
      (s) =>
        s.requiredTotal > 0 &&
        (s.status === 'in_progress' || s.status === 'blocked' || s.status === 'needs_review'),
    );
    if (blockedOrProgress >= 0) return blockedOrProgress;
    if (nextIncompleteIndex >= 0) return nextIncompleteIndex;
    return 0;
  })();

  return {
    totalRequired,
    completedRequired,
    remainingRequired,
    completionPct,
    sessions: snapshots,
    resumeIndex,
    nextIncompleteIndex: nextIncompleteIndex >= 0 ? nextIncompleteIndex : 0,
    lastEditedAt,
  };
}

export function lastEditedFromResults(results: EntityRow[], runUpdatedAt?: number | null): number | null {
  let max: number | null = runUpdatedAt ?? null;
  for (const r of results) {
    const t = Number(r.updatedAt ?? r.testDate ?? 0);
    if (t && (!max || t > max)) max = t;
  }
  return max;
}
