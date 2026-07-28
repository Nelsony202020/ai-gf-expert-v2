// Bonus features: AI Cam Models + bonus gate + more bonus features (proof via paperclip drawer).

import { Icon, TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';

export type BonusExtraRow = { id: string; name: string; note: string };

export type BonusFeaturesDraft = {
  hasBonus: 'yes' | 'no' | '';
  aiCamModels: 'yes' | 'no' | '';
  extras: BonusExtraRow[];
};

function newRowId(): string {
  return `be_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyRow(): BonusExtraRow {
  return { id: newRowId(), name: '', note: '' };
}
function yesNoFromRaw(raw: RawValue | undefined): 'yes' | 'no' | '' {
  if (!raw || !('status' in raw)) return '';
  if (raw.status === 'yes') return 'yes';
  if (raw.status === 'no') return 'no';
  return '';
}

export function parseBonusFeaturesDraft(
  listRaw: RawValue | undefined,
  liveRaw: RawValue | undefined,
): BonusFeaturesDraft {
  const structured =
    listRaw && 'structured' in listRaw ? (listRaw.structured as Record<string, unknown>) : undefined;

  let hasBonus: 'yes' | 'no' | '' = '';
  if (structured?.hasBonus === 'yes' || structured?.hasBonus === 'no') {
    hasBonus = structured.hasBonus;
  }

  const saved = Array.isArray(structured?.extras)
    ? (structured.extras as Array<{ id?: string; name?: string; note?: string }>)
    : [];
  const extras = saved.map((r, idx) => ({
    id: typeof r.id === 'string' && r.id ? r.id : `legacy-${idx}`,
    name: r.name ?? '',
    note: r.note ?? '',
  }));

  return {
    hasBonus,
    aiCamModels: yesNoFromRaw(liveRaw),
    extras,
  };
}

export function bonusFeaturesListToRaw(
  hasBonus: 'yes' | 'no' | '',
  extras: BonusExtraRow[],
): RawValue | undefined {
  if (hasBonus === 'no') return { structured: { hasBonus: 'no', extras: [] } };
  if (hasBonus !== 'yes') return undefined;
  return {
    structured: {
      hasBonus: 'yes',
      extras: extras.map((r) => ({
        id: r.id,
        name: r.name,
        note: r.note,
      })),
    },
  };
}

export function aiCamModelsToRaw(aiCamModels: 'yes' | 'no' | ''): RawValue | undefined {
  if (aiCamModels === 'yes') return { status: 'yes' };
  if (aiCamModels === 'no') return { status: 'no' };
  return undefined;
}

export function formatBonusFeaturesSummary(
  listRaw: RawValue | undefined,
  liveRaw: RawValue | undefined,
): string {
  const p = parseBonusFeaturesDraft(listRaw, liveRaw);
  if (p.hasBonus === 'no') return 'No';
  if (p.hasBonus !== 'yes') return '—';
  const filled = p.extras.filter((r) => r.name.trim() || r.note.trim());
  const cam =
    p.aiCamModels === 'yes' ? 'AI cam' : p.aiCamModels === 'no' ? 'No AI cam' : 'AI cam ?';
  if (filled.length === 0) return `Yes · ${cam}`;
  return `Yes · ${cam} · ${filled.length} feature${filled.length === 1 ? '' : 's'}`;
}

function YesNoToggle({
  name,
  label,
  value,
  disabled,
  onChange,
}: {
  name: string;
  label: string;
  value: 'yes' | 'no' | '';
  disabled?: boolean;
  onChange: (v: 'yes' | 'no') => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {(
          [
            { v: 'yes' as const, label: 'Yes' },
            { v: 'no' as const, label: 'No' },
          ] as const
        ).map(({ v, label: optLabel }) => (
          <label
            key={v}
            className={`inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-sm transition-colors ${
              value === v
                ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              disabled={disabled}
              checked={value === v}
              onChange={() => onChange(v)}
            />
            {optLabel}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function BonusFeaturesField({
  disabled,
  listRaw,
  liveRaw,
  onListChange,
  onLiveChange,
  onOpenProof,
  rowProofCounts,
}: {
  disabled?: boolean;
  listRaw: RawValue | undefined;
  liveRaw: RawValue | undefined;
  onListChange: (v: RawValue | undefined) => void;
  onLiveChange: (v: RawValue | undefined) => void;
  onOpenProof?: () => void;
  rowProofCounts?: Map<string, number>;
}) {
  const parsed = parseBonusFeaturesDraft(listRaw, liveRaw);

  function syncList(hasBonus: 'yes' | 'no' | '', extras: BonusExtraRow[]) {
    onListChange(bonusFeaturesListToRaw(hasBonus, extras));
  }

  function setAiCamModels(aiCamModels: 'yes' | 'no') {
    onLiveChange(aiCamModelsToRaw(aiCamModels));
  }

  function setHasBonus(hasBonus: 'yes' | 'no') {
    if (hasBonus === 'no') {
      syncList('no', []);
      return;
    }
    const extras = parsed.extras.length > 0 ? parsed.extras : [emptyRow()];
    syncList('yes', extras);
  }

  function patchRow(index: number, patch: Partial<BonusExtraRow>) {
    const extras = parsed.extras.length > 0 ? [...parsed.extras] : [emptyRow()];
    extras[index] = { ...extras[index], ...patch };
    syncList('yes', extras);
  }

  function addRow() {
    syncList('yes', [...parsed.extras, emptyRow()]);
  }

  const showMore = parsed.hasBonus === 'yes';
  const rows = showMore ? (parsed.extras.length > 0 ? parsed.extras : [emptyRow()]) : [];

  return (
    <div className="testing-input-wide w-full min-w-0 max-w-3xl space-y-4">
      <YesNoToggle
        name="ai-cam-models"
        label="AI Cam Models"
        value={parsed.aiCamModels}
        disabled={disabled}
        onChange={setAiCamModels}
      />

      <YesNoToggle
        name="bonus-features"
        label="Bonus features"
        value={parsed.hasBonus}
        disabled={disabled}
        onChange={setHasBonus}
      />

      {showMore && (
        <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">More bonus features</p>

          {rows.map((row, idx) => {
            const proofN = rowProofCounts?.get(row.id) ?? 0;
            return (
              <div
                key={row.id}
                className="flex flex-wrap items-start gap-2 rounded-md border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900/40"
              >
                <TextInput
                  disabled={disabled}
                  placeholder="Feature name"
                  value={row.name}
                  className="min-w-[8rem] flex-1 text-sm"
                  onChange={(e) => patchRow(idx, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <TextInput
                  disabled={disabled}
                  placeholder="Description"
                  value={row.note}
                  className="min-w-[10rem] flex-[2] text-sm"
                  onChange={(e) => patchRow(idx, { note: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-medium ${
                    proofN > 0
                      ? 'testing-link hover:bg-[var(--testing-accent-soft)]'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-pink-500 dark:hover:bg-slate-800'
                  }`}
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProof?.();
                  }}
                  title="Upload proof"
                >
                  <Icon name="attach_file" className="!text-[15px]" />
                  {proofN > 0 ? proofN : ''}
                </button>
              </div>
            );
          })}

          <button
            type="button"
            disabled={disabled}
            className="testing-link text-xs font-medium"
            onClick={(e) => {
              e.stopPropagation();
              addRow();
            }}
          >
            + Add feature
          </button>
        </div>
      )}
    </div>
  );
}

/** @deprecated use BonusFeaturesField */
export const BonusExtrasField = BonusFeaturesField;

export function parseBonusExtrasDraft(listRaw: RawValue | undefined): BonusExtraRow[] {
  return parseBonusFeaturesDraft(listRaw, undefined).extras;
}

export function formatBonusExtrasSummary(listRaw: RawValue | undefined): string {
  return formatBonusFeaturesSummary(listRaw, undefined);
}

export function bonusExtrasToRaw(extras: BonusExtraRow[]): RawValue | undefined {
  return bonusFeaturesListToRaw('yes', extras);
}
