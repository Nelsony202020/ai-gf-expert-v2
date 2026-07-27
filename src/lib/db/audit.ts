// Audit log helper. Every sensitive mutation records who/what/when/why.

import { getDb, id } from './server';

export interface AuditEntry {
  actorEmail: string;
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'restore'
    | 'publish'
    | 'unpublish'
    | 'override'
    | 'slug_change'
    | 'login'
    | 'upload'
    | 'recalculate'
    | 'ai_suggest_requested'
    | 'ai_suggest_generated'
    | 'ai_suggest_failed'
    | 'ai_suggest_inserted'
    | 'ai_suggest_rejected'
    | 'ai_suggest_regenerated';
  recordType: string;
  recordId: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  scoreImpact?: unknown;
}

/** Build an audit transaction chunk (composable into a larger db.transact). */
export function auditTx(entry: AuditEntry) {
  const db = getDb();
  return db.tx.auditLog[id()].update({
    actorEmail: entry.actorEmail,
    action: entry.action,
    recordType: entry.recordType,
    recordId: entry.recordId,
    oldValue: sanitize(entry.oldValue),
    newValue: sanitize(entry.newValue),
    reason: entry.reason,
    scoreImpact: sanitize(entry.scoreImpact),
    createdAt: Date.now(),
  });
}

/** Write a standalone audit entry. */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  const db = getDb();
  await db.transact(auditTx(entry));
}

/** Strip undefined values so JSON columns stay clean. */
function sanitize(value: unknown): unknown {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

/** Diff two flat records, returning only changed keys (for audit old/new). */
export function diffRecords(
  oldRecord: Record<string, unknown> | null | undefined,
  newRecord: Record<string, unknown>,
): { oldValue: Record<string, unknown>; newValue: Record<string, unknown> } {
  const oldValue: Record<string, unknown> = {};
  const newValue: Record<string, unknown> = {};
  for (const key of Object.keys(newRecord)) {
    const before = oldRecord?.[key];
    const after = newRecord[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      if (before !== undefined) oldValue[key] = before;
      newValue[key] = after;
    }
  }
  return { oldValue, newValue };
}
