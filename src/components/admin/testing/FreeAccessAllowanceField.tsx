// Free access allowance — count + period dropdown (Total / Per day / Per month).

import { Select, TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';
import type { RawValue as EngineRawValue } from '../../../lib/scoring/engine';
import {
  DEFAULT_FREE_ACCESS_PERIOD,
  FREE_ACCESS_PERIOD_OPTIONS,
  formatFreeAccessAllowanceSummary,
  freeAccessAllowanceToRaw,
  freeAccessUnitLabel,
  parseFreeAccessAllowance,
  type FreeAccessPeriod,
} from '../../../lib/testing/freeAccessAllowance';

export function FreeAccessAllowanceField({
  disabled,
  slug,
  raw,
  onChange,
}: {
  disabled?: boolean;
  slug?: string;
  raw: RawValue | undefined;
  onChange: (v: RawValue | undefined) => void;
}) {
  const parsed = parseFreeAccessAllowance(raw as EngineRawValue | undefined);
  const unit = freeAccessUnitLabel(slug);

  function sync(amount: number | undefined, period: FreeAccessPeriod) {
    onChange(freeAccessAllowanceToRaw({ amount, period }) as RawValue | undefined);
  }

  return (
    <div className="testing-input-wide flex w-full min-w-0 max-w-md items-center gap-2">
      <TextInput
        type="number"
        min={0}
        step={1}
        value={parsed.amount ?? ''}
        disabled={disabled}
        placeholder="e.g. 50"
        className="!w-24 !py-2 text-sm"
        onChange={(e) => {
          const rawVal = e.target.value.trim();
          if (rawVal === '') {
            sync(undefined, parsed.period);
            return;
          }
          const amount = Math.max(0, Number(rawVal));
          sync(Number.isFinite(amount) ? amount : undefined, parsed.period);
        }}
      />
      {unit ? <span className="shrink-0 text-xs text-slate-500">{unit}</span> : null}
      <Select
        value={parsed.period || DEFAULT_FREE_ACCESS_PERIOD}
        disabled={disabled}
        className="!py-2 text-sm min-w-[7.5rem]"
        onChange={(e) => {
          const period = e.target.value as FreeAccessPeriod;
          sync(parsed.amount, period || DEFAULT_FREE_ACCESS_PERIOD);
        }}
      >
        {FREE_ACCESS_PERIOD_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export { formatFreeAccessAllowanceSummary, parseFreeAccessAllowance };
