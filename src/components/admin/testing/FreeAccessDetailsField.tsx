// Free access details — four simple questions stored on the restrictions slug.

import { Field, Select, TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';
import {
  CARD_LABELS,
  EXPIRE_LABELS,
  FREE_ACCESS_FIELD_HINTS,
  RESET_LABELS,
  TRIAL_LABELS,
  freeAccessDetailsToRaw,
  parseFreeAccessDetails,
  type FreeAccessDetails,
} from '../../../lib/testing/freeAccessDetails';

const selectClass = '!py-2 text-sm w-full min-w-[14rem]';

function LabeledSelect({
  label,
  hint,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} help={hint}>
      <Select value={value} disabled={disabled} className={selectClass} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function FreeAccessDetailsField({
  disabled,
  raw,
  onChange,
}: {
  disabled?: boolean;
  raw: RawValue | undefined;
  onChange: (v: RawValue | undefined) => void;
}) {
  const parsed = parseFreeAccessDetails(raw);

  function patch(partial: Partial<FreeAccessDetails>) {
    const next: FreeAccessDetails = { ...parsed, ...partial };
    if (partial.trialStated && partial.trialStated !== 'yes') {
      next.trialLength = '';
    }
    onChange(freeAccessDetailsToRaw(next));
  }

  return (
    <div className="testing-input-wide w-full min-w-0 max-w-2xl space-y-4">
      <LabeledSelect
        label="Does the free allowance reset?"
        hint={FREE_ACCESS_FIELD_HINTS.allowanceReset}
        value={parsed.allowanceReset}
        disabled={disabled}
        options={Object.entries(RESET_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(v) => patch({ allowanceReset: v as FreeAccessDetails['allowanceReset'] })}
      />

      <LabeledSelect
        label="Do free credits or free allowances expire?"
        hint={FREE_ACCESS_FIELD_HINTS.creditsExpire}
        value={parsed.creditsExpire}
        disabled={disabled}
        options={Object.entries(EXPIRE_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(v) => patch({ creditsExpire: v as FreeAccessDetails['creditsExpire'] })}
      />

      <LabeledSelect
        label="Is the free trial length clearly stated?"
        hint={FREE_ACCESS_FIELD_HINTS.trialStated}
        value={parsed.trialStated}
        disabled={disabled}
        options={Object.entries(TRIAL_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(v) => patch({ trialStated: v as FreeAccessDetails['trialStated'] })}
      />

      {parsed.trialStated === 'yes' && (
        <Field label="Free trial length" help={FREE_ACCESS_FIELD_HINTS.trialLength}>
          <TextInput
            disabled={disabled}
            value={parsed.trialLength}
            placeholder="e.g. 7 days"
            className="text-sm"
            onChange={(e) => patch({ trialLength: e.target.value })}
          />
        </Field>
      )}

      <LabeledSelect
        label="Is a credit card required to use the free version?"
        hint={FREE_ACCESS_FIELD_HINTS.creditCardRequired}
        value={parsed.creditCardRequired}
        disabled={disabled}
        options={Object.entries(CARD_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(v) => patch({ creditCardRequired: v as FreeAccessDetails['creditCardRequired'] })}
      />
    </div>
  );
}

export { formatFreeAccessDetailsSummary, parseFreeAccessDetails } from '../../../lib/testing/freeAccessDetails';
