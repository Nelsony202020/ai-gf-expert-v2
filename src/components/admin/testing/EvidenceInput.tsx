// Guided result input for a single evidence definition. Renders the correct
// control (count, duration, currency, yes/limited/no, options, rubric, ratio,
// checklist) and produces the engine-compatible rawValue.

import type { EntityRow } from '../api';
import { Select, TextArea, TextInput } from '../ui';
import { filterFeatureChecklistItems, privacyAllowsUnknown, PRIVACY_OPTIONAL_SLUGS } from './capabilityGating';
import {
  pctFromRatio,
  ratioNumeratorLabel,
} from './sampleRatio';
import {
  checklistConfig,
  controlKind,
  defOptions,
  ratioConfig,
  unitLabel,
  allowsUnableToVerify,
} from './presentation';

export type RawValue =
  | { value: number; detail?: Record<string, unknown> }
  | { status: string; detail?: Record<string, unknown> }
  | { text: string; detail?: Record<string, unknown> }
  | { structured: Record<string, unknown> };

/** Shorter labels for ratio fields in the table UI. */
function shortRatioLabel(label: string): string {
  const map: Record<string, string> = {
    'Profiles reviewed': 'Reviewed',
    'Duplicate profiles found': 'Duplicates',
    'Profiles reviewed for originality': 'Reviewed',
    'Unique profiles found': 'Unique',
    'Profiles reviewed for completeness': 'Reviewed',
    'Complete profiles found': 'Complete',
    'Images reviewed': 'Reviewed',
    'High-quality images found': 'Good ones',
    'Replies reviewed': 'Reviewed',
    'Natural replies found': 'Natural',
    'Checks passed': 'Passed',
    'Checks reviewed': 'Reviewed',
  };
  return map[label] ?? (label.length > 18 ? label.replace(/^How many /i, '').slice(0, 16) : label);
}

function nonNegative(raw: string, max?: number): number | undefined {
  if (raw === '' || raw === '-') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  const clamped = Math.max(0, n);
  if (max !== undefined) return Math.min(max, clamped);
  return clamped;
}

export function EvidenceInput({
  def,
  value,
  onChange,
  disabled,
  compact = false,
  productFields,
  categorySlug,
  fixedDenominator,
}: {
  def: EntityRow;
  value: RawValue | undefined;
  onChange: (v: RawValue | undefined) => void;
  disabled?: boolean;
  /** Tighter layout for table rows — dropdowns, wider fields. */
  compact?: boolean;
  productFields?: Record<string, unknown>;
  categorySlug?: string;
  /** When set, denominator is hidden and filled automatically (session sample size). */
  fixedDenominator?: number;
}) {
  const kind = controlKind(def);
  const wide = compact ? 'testing-input-wide w-full min-w-[14rem]' : '';
  const slug = String(def.slug ?? '');

  const resolutionOptions = [
    { value: '480p', label: '480p' },
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
    { value: '4k', label: '4K' },
  ];

  if (slug === 'maximum-resolution' || slug === 'resolution') {
    const current = value && 'text' in value ? value.text : '';
    return (
      <StatusSelect
        options={resolutionOptions}
        value={current}
        disabled={disabled}
        className={wide}
        placeholder="Select max resolution…"
        onChange={(v) => (v ? onChange({ text: v }) : onChange(undefined))}
      />
    );
  }

  if (slug === 'ease-of-use') {
    const current = value && 'value' in value ? value.value : 5;
    return (
      <div className={`space-y-1 ${compact ? 'w-full min-w-[14rem]' : 'max-w-xs'}`}>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          disabled={disabled}
          value={current}
          className="w-full accent-pink-500"
          onChange={(e) => onChange({ value: Number(e.target.value) })}
        />
        <p className="text-center text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
          {current}/10
        </p>
      </div>
    );
  }

  if (slug === 'security-incidents') {
    const detail = (value && 'detail' in value ? value.detail : undefined) ?? {};
    const url = typeof detail.url === 'string' ? detail.url : value && 'text' in value ? value.text : '';
    const note = typeof detail.note === 'string' ? detail.note : '';
    return (
      <div className={`space-y-2 ${wide}`}>
        <TextInput
          type="url"
          value={url}
          disabled={disabled}
          placeholder="Link to news article or official statement (optional)"
          onChange={(e) =>
            onChange({
              text: e.target.value,
              detail: { ...detail, url: e.target.value, note },
            })
          }
        />
        <TextArea
          rows={2}
          value={note}
          disabled={disabled}
          placeholder="Optional note about what happened"
          onChange={(e) =>
            onChange({
              text: url,
              detail: { ...detail, url, note: e.target.value },
            })
          }
        />
      </div>
    );
  }

  switch (kind) {
    case 'boolean':
    case 'ynl': {
      const variant = typeof def.inputType === 'string' ? def.inputType : '';
      const options =
        variant === 'yes_no' || kind === 'boolean'
          ? [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]
          : variant === 'yes_no_unknown'
            ? [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unknown', label: 'Unknown' },
              ]
            : [
                { value: 'yes', label: 'Yes' },
                PRIVACY_OPTIONAL_SLUGS.has(slug)
                  ? { value: 'optional', label: 'Optional' }
                  : { value: 'limited', label: 'Limited' },
                { value: 'no', label: 'No' },
              ];
      if (
        kind === 'ynl' &&
        variant !== 'yes_no' &&
        variant !== 'yes_no_unknown' &&
        (allowsUnableToVerify(def) || privacyAllowsUnknown(categorySlug, slug))
      ) {
        options.push({ value: 'unknown', label: 'Unknown' });
      }
      const current = value && 'status' in value ? value.status : '';
      return (
        <StatusSelect
          options={options}
          value={current}
          disabled={disabled}
          className={wide}
          onChange={(v) => (v ? onChange({ status: v }) : onChange(undefined))}
        />
      );
    }

    case 'number': {
      const current = value && 'value' in value ? String(value.value) : '';
      const unit = unitLabel(def);
      return (
        <div className={`flex items-center gap-2 ${compact ? 'w-full' : ''}`}>
          <TextInput
            type="number"
            min={0}
            step="any"
            className={compact ? `${wide} max-w-none` : 'max-w-[160px]'}
            value={current}
            disabled={disabled}
            onChange={(e) => {
              const n = nonNegative(e.target.value);
              onChange(n === undefined ? undefined : { value: n });
            }}
          />
          {unit && <span className="shrink-0 text-xs text-slate-500">{unit}</span>}
        </div>
      );
    }

    case 'ratio': {
      const cfg = ratioConfig(def)!;
      const detail = (value && 'detail' in value ? value.detail : undefined) ?? {};
      const effectiveDen =
        fixedDenominator ??
        (detail.denominator !== undefined ? Number(detail.denominator) : undefined);
      const numerator = detail.numerator !== undefined ? String(detail.numerator) : '';
      const num = numerator === '' ? null : Number(numerator);
      const pct =
        num !== null && effectiveDen !== undefined && effectiveDen > 0
          ? pctFromRatio(num, effectiveDen)
          : null;

      function updateNumerator(nextNum: string) {
        const n = nextNum === '' || nextNum === '-' ? null : nonNegative(nextNum) ?? null;
        const d =
          fixedDenominator ??
          (detail.denominator !== undefined ? Number(detail.denominator) : null);
        if (n === null && d === null) {
          onChange(undefined);
          return;
        }
        const computed = n !== null && d !== null && d > 0 ? pctFromRatio(n, d) : null;
        onChange({
          value: computed ?? 0,
          detail: {
            ...(n !== null ? { numerator: n } : {}),
            ...(d !== null ? { denominator: d } : {}),
            ...(computed === null ? { incomplete: true } : {}),
          },
        });
      }

      const singleField = fixedDenominator !== undefined;

      if (singleField) {
        const numLabel = ratioNumeratorLabel(slug, def);
        return (
          <div className={`flex flex-wrap items-center gap-3 ${compact ? 'w-full min-w-[12rem]' : ''}`}>
            <label className="min-w-[6rem] flex-1">
              <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {numLabel}
              </span>
              <TextInput
                type="number"
                min={0}
                max={fixedDenominator}
                step="any"
                className="w-full"
                value={numerator}
                disabled={disabled}
                onChange={(e) => updateNumerator(e.target.value)}
              />
            </label>
            <div className="shrink-0 text-right">
              <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Result
              </span>
              <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {pct !== null ? `${pct}%` : '—'}
              </span>
            </div>
          </div>
        );
      }

      const denominator = detail.denominator !== undefined ? String(detail.denominator) : '';
      function update(nextNum: string, nextDen: string) {
        const n = nextNum === '' || nextNum === '-' ? null : nonNegative(nextNum) ?? null;
        const d = nextDen === '' || nextDen === '-' ? null : nonNegative(nextDen) ?? null;
        if (n === null && d === null) {
          onChange(undefined);
          return;
        }
        const computed = n !== null && d !== null && d > 0 ? pctFromRatio(n, d) : null;
        onChange({
          value: computed ?? 0,
          detail: {
            ...(n !== null ? { numerator: n } : {}),
            ...(d !== null ? { denominator: d } : {}),
            ...(computed === null ? { incomplete: true } : {}),
          },
        });
      }

      const denLabel = shortRatioLabel(cfg.denominatorLabel);
      const numLabel = shortRatioLabel(cfg.numeratorLabel);

      return (
        <div className={compact ? 'w-full min-w-[16rem]' : 'space-y-2'}>
          <div className={`flex flex-wrap items-end gap-2 ${compact ? '' : 'sm:grid sm:grid-cols-2 sm:gap-2'}`}>
            <label className="min-w-[5.5rem] flex-1">
              <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {denLabel}
              </span>
              <TextInput
                type="number"
                min={0}
                step="any"
                className="w-full"
                value={denominator}
                disabled={disabled}
                onChange={(e) => update(numerator, e.target.value)}
              />
            </label>
            <label className="min-w-[5.5rem] flex-1">
              <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {numLabel}
              </span>
              <TextInput
                type="number"
                min={0}
                step="any"
                className="w-full"
                value={numerator}
                disabled={disabled}
                onChange={(e) => update(e.target.value, denominator)}
              />
            </label>
            <div className="shrink-0 pb-2 text-right sm:pb-0 sm:text-center">
              <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Result
              </span>
              <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {pct !== null ? `${pct}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    case 'checklist': {
      const cfg = checklistConfig(def)!;
      const items = productFields
        ? filterFeatureChecklistItems(cfg.items, productFields)
        : cfg.items;
      const detail = (value && 'detail' in value ? value.detail : undefined) ?? {};
      const checked = new Set(Array.isArray(detail.checked) ? (detail.checked as string[]) : []);
      const total = items.length;

      function toggle(item: string) {
        const next = new Set(checked);
        if (next.has(item)) next.delete(item);
        else next.add(item);
        const nextPassed = items.filter((i) => next.has(i)).length;
        onChange({
          value: total > 0 ? Math.round((nextPassed / total) * 1000) / 10 : 0,
          detail: { checked: items.filter((i) => next.has(i)), total },
        });
      }

      return (
        <div className={compact ? 'w-full min-w-[18rem]' : 'space-y-2'}>
          <ul className={`grid gap-x-3 gap-y-1 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {items.map((item) => (
              <li key={item}>
                <label className="flex cursor-pointer items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="testing-checkbox mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300"
                    checked={checked.has(item)}
                    disabled={disabled}
                    onChange={() => toggle(item)}
                  />
                  <span className="min-w-0 leading-snug">{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case 'multi_select': {
      const options = defOptions(def);
      const detail = (value && 'detail' in value ? value.detail : undefined) ?? {};
      const selected = new Set(Array.isArray(detail.selected) ? (detail.selected as string[]) : []);
      const other = typeof detail.other === 'string' ? detail.other : '';

      function emit(nextSelected: Set<string>, nextOther: string) {
        const extra = nextOther
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (nextSelected.size === 0 && extra.length === 0) {
          onChange(undefined);
          return;
        }
        onChange({
          value: nextSelected.size + extra.length,
          detail: {
            selected: options.map((o) => o.label).filter((l) => nextSelected.has(l)),
            ...(nextOther.trim() ? { other: nextOther } : {}),
          },
        });
      }

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
                    onChange={() => {
                      const next = new Set(selected);
                      if (next.has(o.label)) next.delete(o.label);
                      else next.add(o.label);
                      emit(next, other);
                    }}
                  />
                  <span className="truncate font-medium">{o.label}</span>
                </label>
              </li>
            ))}
          </ul>
          <TextInput
            value={other}
            disabled={disabled}
            placeholder="Other (comma separated)"
            className={wide}
            onChange={(e) => emit(selected, e.target.value)}
          />
        </div>
      );
    }

    case 'rubric':
    case 'select': {
      const options = defOptions(def);
      const numeric =
        kind === 'rubric' &&
        ['count', 'percentage', 'seconds', 'currency', 'scale'].includes(String(def.measurementType));
      const current =
        value && 'value' in value
          ? String(value.value)
          : value && 'text' in value
            ? String(value.text)
            : '';

      return (
        <StatusSelect
          options={options.map((o) => ({
            value: String(o.value),
            label: o.label,
            title: o.description,
          }))}
          value={current}
          disabled={disabled}
          className={wide}
          placeholder="Pick an answer…"
          onChange={(v) => {
            if (!v) {
              onChange(undefined);
              return;
            }
            const opt = options.find((o) => String(o.value) === v);
            if (!opt) return;
            if (numeric && typeof opt.value === 'number') {
              onChange({ value: opt.value, detail: { rubric: opt.label } });
            } else {
              onChange({ text: String(opt.value), detail: { rubric: opt.label } });
            }
          }}
        />
      );
    }

    case 'text':
    default: {
      const current = value && 'text' in value ? String(value.text) : '';
      return (
        <TextArea
          rows={compact ? 3 : 4}
          value={current}
          disabled={disabled}
          placeholder="Type your answer…"
          className={`${wide} min-h-[4.5rem] resize-y`}
          onChange={(e) => onChange(e.target.value === '' ? undefined : { text: e.target.value })}
        />
      );
    }
  }
}

function StatusSelect({
  options,
  value,
  onChange,
  disabled,
  className = '',
  placeholder = 'Choose…',
}: {
  options: { value: string; label: string; title?: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      className={`${className} !py-2 text-sm`}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} title={o.title}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
