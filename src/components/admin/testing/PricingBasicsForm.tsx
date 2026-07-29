// Free access test session — counts and restrictions for the free tier.

import type { EntityRow } from '../api';
import { TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';
import { QuestionLabel } from './QuestionLabel';
import type { SessionItem } from './sessionUi';

type YnlStatus = 'yes' | 'limited' | 'no' | '';

function ynlStatus(raw: RawValue | undefined): YnlStatus {
  if (!raw || !('status' in raw)) return '';
  const s = raw.status;
  if (s === 'yes' || s === 'limited' || s === 'no') return s;
  return '';
}

function numValue(raw: RawValue | undefined): number | '' {
  if (!raw || !('value' in raw)) return '';
  const n = Number(raw.value);
  return Number.isFinite(n) ? n : '';
}

function textValue(raw: RawValue | undefined): string {
  if (!raw) return '';
  if ('text' in raw && typeof raw.text === 'string') return raw.text;
  if ('detail' in raw && raw.detail && typeof raw.detail.label === 'string') return raw.detail.label;
  return '';
}

function YnlSelect({
  value,
  disabled,
  onChange,
}: {
  value: YnlStatus;
  disabled?: boolean;
  onChange: (v: YnlStatus) => void;
}) {
  const opts: { v: YnlStatus; label: string }[] = [
    { v: 'yes', label: 'Yes' },
    { v: 'limited', label: 'Limited' },
    { v: 'no', label: 'No' },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map(({ v, label }) => (
        <button
          key={v}
          type="button"
          disabled={disabled}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            value === v
              ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
              : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'
          }`}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function CountField({
  def,
  categorySlug,
  raw,
  disabled,
  onPatch,
}: {
  def: EntityRow;
  categorySlug?: string;
  raw: RawValue | undefined;
  disabled?: boolean;
  onPatch: (raw: RawValue | undefined) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
        <QuestionLabel def={def} categorySlug={categorySlug} required />
      </p>
      <TextInput
        type="number"
        min={0}
        className="max-w-[10rem] !py-1.5 text-sm"
        value={numValue(raw)}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          onPatch(v === '' ? undefined : { value: Math.max(0, Number(v)) });
        }}
      />
    </div>
  );
}

export function FreeAccessForm({
  items,
  categorySlug,
  drafts,
  disabled,
  onPatch,
}: {
  items: SessionItem[];
  categorySlug?: string;
  drafts: Record<string, { raw: RawValue | undefined; na: boolean; dirty: boolean }>;
  disabled?: boolean;
  onPatch: (defId: string, raw: RawValue | undefined) => void;
}) {
  const bySlug = new Map(items.map(({ def }) => [String(def.slug), def]));

  const freeValueDef = bySlug.get('free-value');
  const restrictionsDef = bySlug.get('restrictions');
  const freeValueRaw = freeValueDef ? drafts[freeValueDef.id]?.raw : undefined;

  return (
    <div className="space-y-4">
      {(['free-chat', 'free-images', 'free-video', 'free-characters'] as const).map((slug) => {
        const def = bySlug.get(slug);
        if (!def) return null;
        return (
          <CountField
            key={slug}
            def={def}
            categorySlug={categorySlug}
            raw={drafts[def.id]?.raw}
            disabled={disabled}
            onPatch={(raw) => onPatch(def.id, raw)}
          />
        );
      })}

      {bySlug.get('free-voice') && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
            <QuestionLabel def={bySlug.get('free-voice')!} categorySlug={categorySlug} required />
          </p>
          <TextInput
            type="number"
            min={0}
            className="max-w-[10rem] !py-1.5 text-sm"
            value={numValue(bySlug.get('free-voice') ? drafts[bySlug.get('free-voice')!.id]?.raw : undefined)}
            disabled={disabled}
            onChange={(e) => {
              const def = bySlug.get('free-voice')!;
              const v = e.target.value;
              onPatch(def.id, v === '' ? undefined : { value: Math.max(0, Number(v)) });
            }}
          />
          <p className="mt-1 text-xs text-slate-500">Seconds of free voice (e.g. 30)</p>
        </div>
      )}

      {freeValueDef && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            <QuestionLabel def={freeValueDef} categorySlug={categorySlug} required />
          </p>
          <YnlSelect
            value={ynlStatus(freeValueRaw)}
            disabled={disabled}
            onChange={(v) => onPatch(freeValueDef.id, v ? { status: v } : undefined)}
          />
          <TextInput
            className="!py-1.5 text-sm"
            placeholder='Short label, e.g. "No card needed"'
            value={textValue(freeValueRaw)}
            disabled={disabled}
            onChange={(e) => {
              const status = ynlStatus(freeValueRaw) || 'yes';
              onPatch(freeValueDef.id, { status, detail: { label: e.target.value } });
            }}
          />
        </div>
      )}

      {restrictionsDef && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
            <QuestionLabel def={restrictionsDef} categorySlug={categorySlug} required />
          </p>
          <TextInput
            className="!py-1.5 text-sm"
            placeholder='e.g. "Resets daily"'
            value={textValue(restrictionsDef ? drafts[restrictionsDef.id]?.raw : undefined)}
            disabled={disabled}
            onChange={(e) =>
              onPatch(restrictionsDef.id, e.target.value ? { text: e.target.value } : undefined)
            }
          />
        </div>
      )}
    </div>
  );
}

/** @deprecated Use FreeAccessForm */
export { FreeAccessForm as PricingBasicsForm };
