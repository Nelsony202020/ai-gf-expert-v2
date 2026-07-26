// Audit log viewer.

import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Spinner, ErrorNote, EmptyState, Badge, TextInput, fmtDate } from '../ui';

interface AuditRow {
  id: string;
  actorEmail: string;
  action: string;
  recordType: string;
  recordId: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  createdAt: number;
}

const ACTION_TONES: Record<string, 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'pink'> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  restore: 'amber',
  publish: 'pink',
  unpublish: 'amber',
  override: 'red',
  slug_change: 'amber',
  upload: 'gray',
  recalculate: 'blue',
};

export function AuditPage() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ rows: AuditRow[] }>('/api/admin/audit?limit=300')
      .then((r) => setRows(r.rows))
      .catch((e) => setError(e.message));
  }, []);

  const filtered = rows?.filter(
    (r) =>
      !filter ||
      [r.actorEmail, r.action, r.recordType, r.recordId, r.reason]
        .join(' ')
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Audit log</h2>
          <p className="text-sm text-slate-500">
            Every sensitive change: who, what, old and new values, and required reasons.
          </p>
        </div>
        <TextInput
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-64"
        />
      </div>

      {error && <ErrorNote message={error} />}

      <Card>
        {!filtered ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState message="No audit entries." />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <div key={row.id} className="py-2">
                <button
                  className="flex w-full items-center gap-3 text-left"
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                >
                  <Badge tone={ACTION_TONES[row.action] ?? 'gray'}>{row.action}</Badge>
                  <span className="text-sm font-medium">{row.recordType}</span>
                  <span className="text-xs text-slate-400">{row.recordId.slice(0, 8)}…</span>
                  <span className="ml-auto text-xs text-slate-500">{row.actorEmail}</span>
                  <span className="text-xs text-slate-400">{fmtDate(row.createdAt)}</span>
                </button>
                {expanded === row.id && (
                  <div className="mt-2 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 text-xs">
                    <div>
                      <div className="mb-1 font-semibold text-slate-500">Old value</div>
                      <pre className="overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(row.oldValue ?? null, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="mb-1 font-semibold text-slate-500">New value</div>
                      <pre className="overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(row.newValue ?? null, null, 2)}
                      </pre>
                    </div>
                    {row.reason && (
                      <div className="col-span-2">
                        <span className="font-semibold text-slate-500">Reason: </span>
                        {row.reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
