// Worksheet grid UI with plain-English instructions.

import { useState } from 'react';
import type { EntityRow } from '../api';
import {
  deriveWorksheet,
  type DerivedColumn,
  type WorksheetConfig,
  type WorksheetRow,
} from './worksheets';
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
  defsBySlug,
  initialRows,
  disabled,
  onChange,
}: {
  config: WorksheetConfig;
  defsBySlug: Map<string, EntityRow>;
  initialRows?: WorksheetRow[];
  disabled?: boolean;
  onChange: (rows: WorksheetRow[], derived: DerivedColumn[]) => void;
}) {
  const columns = config.columns.filter((c) => defsBySlug.has(c.defSlug));
  const [rows, setRows] = useState<WorksheetRow[]>(() => {
    const base: WorksheetRow[] = [];
    for (let i = 0; i < config.rowCount; i++) base.push({ ...(initialRows?.[i] ?? {}) });
    return base;
  });

  if (columns.length === 0) return null;

  const derived = deriveWorksheet(config, rows);
  const derivedBySlug = new Map(derived.map((d) => [d.defSlug, d]));

  function setCell(rowIdx: number, slug: string, value: number | boolean | undefined) {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === rowIdx ? { ...r, [slug]: value } : r));
      onChange(next, deriveWorksheet(config, next));
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-pink-200 dark:border-pink-900/40">
      <div className="border-b border-pink-100 bg-pink-50/80 p-4 dark:border-pink-900/30 dark:bg-pink-950/20">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{config.title}</h4>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {config.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-left dark:border-slate-800">
              <th className="px-3 py-2 font-medium text-slate-500 dark:text-slate-400">#</th>
              {columns.map((col) => (
                <th
                  key={col.defSlug}
                  className="min-w-[4.5rem] px-2 py-2 text-center font-medium text-slate-600 dark:text-slate-300"
                >
                  <span className="block">{col.label}</span>
                  {col.hint && (
                    <span className="mt-0.5 block text-[10px] font-normal leading-tight text-slate-400">
                      {col.hint}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300">
                  {i + 1}
                </td>
                {columns.map((col) => (
                  <td key={col.defSlug} className="px-2 py-1.5 text-center">
                    {col.kind === 'pass' ? (
                      <input
                        type="checkbox"
                        className="testing-checkbox h-4 w-4 rounded border-slate-300"
                        checked={Boolean(row[col.defSlug])}
                        disabled={disabled}
                        onChange={(e) => setCell(i, col.defSlug, e.target.checked)}
                      />
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={col.max}
                        className="w-14 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-center text-xs text-slate-700 focus:border-pink-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <td className="px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Score</td>
              {columns.map((col) => {
                const d = derivedBySlug.get(col.defSlug);
                return (
                  <td
                    key={col.defSlug}
                    className="whitespace-nowrap px-2 py-2 text-center font-semibold text-pink-600 dark:text-pink-400"
                  >
                    {d && d.filledRows > 0 ? `${d.pct}%` : '—'}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
