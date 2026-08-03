// Checkbox multi-select with repeatable "Other" rows (checkbox + text each).

import { useEffect, useId, useRef, useState } from 'react';
import { TextInput } from '../ui';
import type { DefOption } from './presentation';
import type { RawValue } from './EvidenceInput';

interface OtherRow {
  id: string;
  checked: boolean;
  text: string;
}

function parseOtherEntries(detail: Record<string, unknown>): string[] {
  if (Array.isArray(detail.otherEntries)) {
    return (detail.otherEntries as unknown[])
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean);
  }
  const legacy = typeof detail.other === 'string' ? detail.other : '';
  return legacy
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function rowsFromDetail(detail: Record<string, unknown>): OtherRow[] {
  const entries = parseOtherEntries(detail);
  const rows = entries.map((text, i) => ({
    id: `saved-${i}`,
    checked: true,
    text,
  }));
  rows.push({ id: 'draft', checked: false, text: '' });
  return rows;
}

function serializeOtherRows(rows: OtherRow[]): string[] {
  return rows.filter((r) => r.checked && r.text.trim()).map((r) => r.text.trim());
}

interface MultiSelectFieldProps {
  options: DefOption[];
  value: RawValue | undefined;
  disabled?: boolean;
  compact?: boolean;
  onChange: (v: RawValue | undefined) => void;
}

export function MultiSelectField({
  options,
  value,
  disabled,
  compact,
  onChange,
}: MultiSelectFieldProps) {
  const detail = (value && 'detail' in value ? value.detail : undefined) ?? {};
  const selected = new Set(Array.isArray(detail.selected) ? (detail.selected as string[]) : []);

  const [otherRows, setOtherRows] = useState<OtherRow[]>(() => rowsFromDetail(detail));
  const addMoreId = useId();
  const skipSyncRef = useRef(false);
  const detailKey = JSON.stringify(parseOtherEntries(detail));

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    setOtherRows(rowsFromDetail(detail));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailKey]);

  function emit(nextSelected: Set<string>, rows: OtherRow[]) {
    const extras = serializeOtherRows(rows);
    if (nextSelected.size === 0 && extras.length === 0) {
      onChange(undefined);
      return;
    }
    onChange({
      value: nextSelected.size + extras.length,
      detail: {
        selected: options.map((o) => o.label).filter((l) => nextSelected.has(l)),
        ...(extras.length
          ? { other: extras.join(', '), otherEntries: extras }
          : {}),
      },
    });
  }

  function setRows(updater: (prev: OtherRow[]) => OtherRow[]) {
    skipSyncRef.current = true;
    setOtherRows((prev) => {
      const next = updater(prev);
      emit(selected, next);
      return next;
    });
  }

  function toggleOption(label: string) {
    const next = new Set(selected);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    emit(next, otherRows);
  }

  function updateOtherRow(id: string, patch: Partial<Pick<OtherRow, 'checked' | 'text'>>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addOtherRow() {
    setRows((prev) => [
      ...prev,
      { id: `extra-${Date.now()}`, checked: false, text: '' },
    ]);
  }

  function removeOtherRow(id: string) {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length > 0 ? next : [{ id: 'draft', checked: false, text: '' }];
    });
  }

  const wide = compact ? 'w-full min-w-[12rem]' : 'w-full max-w-md';

  return (
    <div className={compact ? 'w-full min-w-[18rem]' : 'space-y-2'}>
      <ul className="grid grid-cols-2 gap-1">
        {options.map((o) => (
          <li key={String(o.value)}>
            <label
              className={`flex cursor-pointer items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors ${
                selected.has(o.label)
                  ? 'border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/25'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              title={o.description}
            >
              <input
                type="checkbox"
                className="testing-checkbox h-3.5 w-3.5 shrink-0 rounded"
                checked={selected.has(o.label)}
                disabled={disabled}
                onChange={() => toggleOption(o.label)}
              />
              <span className="truncate font-medium">{o.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Other groups</p>
        {otherRows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-1.5">
            <label
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors ${
                row.checked
                  ? 'border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/25'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                className="testing-checkbox h-3.5 w-3.5 shrink-0 rounded"
                checked={row.checked}
                disabled={disabled}
                onChange={(e) => updateOtherRow(row.id, { checked: e.target.checked })}
              />
              <span className="font-medium">Other</span>
            </label>
            <TextInput
              value={row.text}
              disabled={disabled || !row.checked}
              placeholder="Type group name…"
              className={`${wide} min-w-0 flex-1`}
              onChange={(e) => updateOtherRow(row.id, { text: e.target.value })}
              onBlur={() => {
                if (row.checked && row.text.trim() && index === otherRows.length - 1) {
                  addOtherRow();
                }
              }}
            />
            {otherRows.length > 1 && (
              <button
                type="button"
                className="shrink-0 rounded px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                disabled={disabled}
                aria-label="Remove other group"
                onClick={() => removeOtherRow(row.id)}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          id={addMoreId}
          className="testing-link text-xs font-medium hover:underline disabled:opacity-50"
          disabled={disabled}
          onClick={addOtherRow}
        >
          + Add more
        </button>
      </div>
    </div>
  );
}
