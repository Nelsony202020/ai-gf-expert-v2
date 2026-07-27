// Simplified chat-understanding worksheet: script copy + 5-row table.

import { Fragment, useState } from 'react';
import type { EntityRow } from '../api';
import { Button, Icon } from '../ui';
import { CHAT_UNDERSTANDING_SCRIPT } from './chatTestScript';
import type { DerivedColumn, WorksheetConfig, WorksheetRow } from './worksheets';
import { deriveWorksheetExtended } from './worksheetScoring';
import './testing-ui.css';

function ColumnTooltip({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="ml-0.5 inline-flex align-middle text-slate-400 hover:text-pink-500"
        aria-label="Column help"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="info" className="!text-[14px]" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-10 mt-1 w-48 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-2 text-left text-[11px] font-normal leading-snug text-slate-600 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {hint}
        </span>
      )}
    </span>
  );
}

function clampCount(raw: string, max?: number): number | undefined {
  if (raw === '') return undefined;
  const n = Math.max(0, Number(raw));
  if (!Number.isFinite(n)) return undefined;
  if (max !== undefined) return Math.min(max, n);
  return n;
}

export function ChatUnderstandingGrid({
  config,
  sessionId,
  defsBySlug,
  initialRows,
  disabled,
  onChange,
  onRowProof,
}: {
  config: WorksheetConfig;
  sessionId: string;
  defsBySlug: Map<string, EntityRow>;
  initialRows?: WorksheetRow[];
  disabled?: boolean;
  onChange: (rows: WorksheetRow[], derived: DerivedColumn[]) => void;
  onRowProof?: (rowIndex: number) => void;
}) {
  const columns = config.columns.filter((c) => defsBySlug.has(c.defSlug));
  const [rows, setRows] = useState<WorksheetRow[]>(() => {
    const base: WorksheetRow[] = [];
    for (let i = 0; i < config.rowCount; i++) base.push({ ...(initialRows?.[i] ?? {}) });
    return base;
  });
  const [copied, setCopied] = useState(false);

  if (columns.length === 0) return null;

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(CHAT_UNDERSTANDING_SCRIPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function emit(next: WorksheetRow[]) {
    onChange(next, deriveWorksheetExtended(config, next, sessionId));
  }

  function setCell(rowIdx: number, slug: string, value: number | boolean | undefined) {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === rowIdx ? { ...r, [slug]: value } : r));
      emit(next);
      return next;
    });
  }

  function setNote(rowIdx: number, note: string) {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === rowIdx ? { ...r, _note: note } : r));
      emit(next);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {config.instruction && (
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{config.instruction}</p>
      )}

      <Button type="button" variant="secondary" onClick={() => void copyScript()} disabled={disabled}>
        <Icon name="content_copy" className="!text-[16px]" />
        {copied ? 'Copied!' : 'Copy full test script'}
      </Button>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-left dark:border-slate-800 dark:bg-slate-800/50">
              <th className="px-3 py-2 font-medium text-slate-500">Chat</th>
              {columns.map((col) => (
                <th
                  key={col.defSlug}
                  className="min-w-[5rem] px-2 py-2 text-center font-medium text-slate-600 dark:text-slate-300"
                >
                  <span className="inline-flex items-center justify-center gap-0.5">
                    {col.label}
                    {col.hint && <ColumnTooltip hint={col.hint} />}
                  </span>
                </th>
              ))}
              <th className="px-2 py-2 text-left font-medium text-slate-500">Note / proof</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <Fragment key={i}>
                <tr className="border-b border-slate-50 dark:border-slate-800/50">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-600 dark:text-slate-300">
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
                          className="w-14 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-center text-xs focus:border-pink-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
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
                  <td className="px-2 py-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="testing-link text-[11px] font-medium"
                        disabled={disabled}
                        onClick={() => onRowProof?.(i)}
                      >
                        Upload evidence
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-slate-50 dark:border-slate-800/50">
                  <td colSpan={columns.length + 2} className="px-3 pb-2 pt-0">
                    <input
                      type="text"
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      placeholder="Optional note for this chat"
                      value={typeof row._note === 'string' ? row._note : ''}
                      disabled={disabled}
                      onChange={(e) => setNote(i, e.target.value)}
                    />
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
