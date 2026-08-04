// Compact “all at once” worksheet table for experienced testers.

import { useState } from 'react';
import type { EntityRow } from '../api';
import {
  deriveWorksheetExtended,
  imageUsable,
  readDefects,
  worksheetColumnFooter,
  type TriValue,
  videoUsable,
} from './worksheetScoring';
import type { DerivedColumn, WorksheetConfig, WorksheetRow } from './worksheets';
import { ColumnTooltip } from './ColumnTooltip';
import './testing-ui.css';

function clampCount(raw: string, max?: number): number | undefined {
  if (raw === '') return undefined;
  const n = Math.max(0, Number(raw));
  if (!Number.isFinite(n)) return undefined;
  if (max !== undefined) return Math.min(max, n);
  return n;
}

export function WorksheetGrid({
  config,
  sessionId,
  defsBySlug,
  initialRows,
  disabled,
  onChange,
}: {
  config: WorksheetConfig;
  sessionId: string;
  defsBySlug: Map<string, EntityRow>;
  initialRows?: WorksheetRow[];
  disabled?: boolean;
  onChange: (rows: WorksheetRow[], derived: DerivedColumn[]) => void;
}) {
  const columns = config.columns.filter((c) => defsBySlug.has(c.defSlug) && c.kind !== 'avg_tri');
  const [rows, setRows] = useState<WorksheetRow[]>(() => {
    const base: WorksheetRow[] = [];
    for (let i = 0; i < config.rowCount; i++) base.push({ ...(initialRows?.[i] ?? {}) });
    return base;
  });

  if (columns.length === 0) return null;

  const derived = deriveWorksheetExtended(config, rows, sessionId);

  function emit(next: WorksheetRow[]) {
    onChange(next, deriveWorksheetExtended(config, next, sessionId));
  }

  function setCell(rowIdx: number, slug: string, value: number | boolean | TriValue | undefined) {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === rowIdx ? { ...r, [slug]: value } : r));
      emit(next);
      return next;
    });
  }

  const isMedia = sessionId === 'image-batch-review' || sessionId === 'video-batch-review';
  const isConsistency = sessionId === 'image-consistency';

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      {config.instruction && (
        <p className="border-b border-slate-100 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          {config.instruction}
        </p>
      )}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-left dark:border-slate-800">
            <th className="px-3 py-2 font-medium text-slate-500">#</th>
            {columns.map((col) => (
              <th
                key={col.defSlug}
                className="min-w-[4rem] px-2 py-2 text-center font-medium text-slate-600 dark:text-slate-300"
              >
                <span className="inline-flex items-center justify-center">
                  {col.label}
                  {col.hint && <ColumnTooltip hint={col.hint} />}
                </span>
              </th>
            ))}
            {isMedia && (
              <th className="px-2 py-2 text-center font-medium text-slate-600">Defects</th>
            )}
            {isMedia && (
              <th className="px-2 py-2 text-center font-medium text-slate-600">Usable</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const skipTri = isConsistency && i === 0;
            const usableFn = sessionId === 'video-batch-review' ? videoUsable : imageUsable;
            const usable = isMedia ? usableFn(row) : null;
            return (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-600">{i + 1}</td>
                {columns.map((col) => (
                  <td key={col.defSlug} className="px-2 py-1.5 text-center">
                    {skipTri && col.kind === 'tri' ? (
                      <span className="text-slate-400">Ref</span>
                    ) : col.kind === 'pass' ? (
                      <input
                        type="checkbox"
                        className="testing-checkbox h-4 w-4 rounded border-slate-300"
                        checked={Boolean(row[col.defSlug])}
                        disabled={disabled}
                        onChange={(e) => setCell(i, col.defSlug, e.target.checked)}
                      />
                    ) : col.kind === 'tri' ? (
                      <select
                        className="rounded border border-slate-200 bg-white px-1 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                        value={(row[col.defSlug] as string) ?? ''}
                        disabled={disabled}
                        onChange={(e) =>
                          setCell(i, col.defSlug, (e.target.value || undefined) as TriValue | undefined)
                        }
                      >
                        <option value="">—</option>
                        <option value="yes">Yes</option>
                        <option value="mostly">Mostly</option>
                        <option value="no">No</option>
                      </select>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={col.max}
                        className="w-12 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-center text-xs dark:border-slate-700 dark:bg-slate-900"
                        value={row[col.defSlug] === undefined ? '' : String(row[col.defSlug])}
                        disabled={disabled}
                        onChange={(e) => {
                          const n = clampCount(e.target.value, col.max);
                          setCell(i, col.defSlug, n);
                        }}
                      />
                    )}
                  </td>
                ))}
                {isMedia && (
                  <td className="px-2 py-1.5 text-center text-slate-500">{readDefects(row).length}</td>
                )}
                {isMedia && (
                  <td className="px-2 py-1.5 text-center">
                    {usable === null ? '—' : usable ? 'Yes' : 'No'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <td className="px-3 py-2 font-medium text-slate-500">Score</td>
            {columns.map((col) => {
              const d = derived.find((x) => x.defSlug === col.defSlug);
              return (
                <td key={col.defSlug} className="px-2 py-2 text-center font-semibold text-pink-600">
                  {worksheetColumnFooter(col, d, rows)}
                </td>
              );
            })}
            {isMedia && <td colSpan={2} />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
