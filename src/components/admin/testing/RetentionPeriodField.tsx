// Data retention — amount + unit, or Unknown / Not stated.

import { Select, TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';
import type { RawValue as EngineRawValue } from '../../../lib/scoring/engine';
import {
  formatRetentionPeriodSummary,
  parseRetentionPeriod,
  retentionPeriodToRaw,
  type RetentionUnit,
} from '../../../lib/testing/retentionPeriod';

const UNIT_OPTIONS: { value: Exclude<RetentionUnit, ''>; label: string }[] = [
  { value: 'weeks', label: 'weeks' },
  { value: 'months', label: 'months' },
  { value: 'years', label: 'years' },
];

type RetentionMode = 'duration' | 'unknown' | 'not_stated' | '';

function parseMode(raw: RawValue | undefined): RetentionMode {
  if (!raw) return '';
  if ('status' in raw) {
    if (raw.status === 'unknown') return 'unknown';
    if (raw.status === 'not_stated') return 'not_stated';
  }
  if ('value' in raw) return 'duration';
  return '';
}

export function RetentionPeriodField({
  disabled,
  raw,
  onChange,
}: {
  disabled?: boolean;
  raw: RawValue | undefined;
  onChange: (v: RawValue | undefined) => void;
}) {
  const mode = parseMode(raw);
  const parsed = parseRetentionPeriod(raw as EngineRawValue | undefined);

  function sync(amount: number | undefined, unit: RetentionUnit) {
    onChange(retentionPeriodToRaw({ amount, unit }) as RawValue | undefined);
  }

  return (
    <div className="testing-input-wide space-y-2 w-full min-w-0 max-w-md">
      <Select
        value={mode === 'duration' ? 'duration' : mode}
        disabled={disabled}
        className="!py-2 text-sm"
        onChange={(e) => {
          const next = e.target.value as RetentionMode | 'duration';
          if (!next) {
            onChange(undefined);
            return;
          }
          if (next === 'unknown') {
            onChange({ status: 'unknown', detail: { retentionMode: 'unknown' } });
            return;
          }
          if (next === 'not_stated') {
            onChange({ status: 'not_stated', detail: { retentionMode: 'not_stated' } });
            return;
          }
          sync(parsed.amount, parsed.unit || '');
        }}
      >
        <option value="">Choose…</option>
        <option value="duration">Stated duration</option>
        <option value="unknown">Unknown</option>
        <option value="not_stated">Not stated</option>
      </Select>

      {mode === 'duration' && (
        <div className="flex w-full min-w-0 items-center gap-2">
          <TextInput
            type="number"
            min={1}
            step={1}
            value={parsed.amount ?? ''}
            disabled={disabled}
            placeholder="e.g. 3"
            className="!w-24 !py-2 text-sm"
            onChange={(e) => {
              const rawVal = e.target.value.trim();
              const amount = rawVal === '' ? undefined : Math.max(1, Number(rawVal));
              sync(Number.isFinite(amount) ? amount : undefined, parsed.unit);
            }}
          />
          <Select
            value={parsed.unit}
            disabled={disabled}
            className="!py-2 text-sm"
            onChange={(e) => sync(parsed.amount, e.target.value as RetentionUnit)}
          >
            <option value="">Unit…</option>
            {UNIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}

export { formatRetentionPeriodSummary, parseRetentionPeriod };
