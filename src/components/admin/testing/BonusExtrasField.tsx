// Bonus features: AI Cam Models + bonus gate + more bonus features with proof.

import type { EntityRow } from '../api';
import { TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';
import { EvidenceAttachments } from './EvidenceAttachments';
import { bonusExtraCaption, LIVE_CAM_PROOF_TAG } from './proofTags';

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
  def,
  liveCamDef,
  listRaw,
  liveRaw,
  listResultId,
  liveCamResultId,
  productId,
  ensureListResultId,
  ensureLiveCamResultId,
  onListChange,
  onLiveChange,
  onUploaded,
}: {
  disabled?: boolean;
  def: EntityRow;
  liveCamDef?: EntityRow;
  listRaw: RawValue | undefined;
  liveRaw: RawValue | undefined;
  listResultId?: string;
  liveCamResultId?: string;
  productId?: string;
  ensureListResultId: () => Promise<string>;
  ensureLiveCamResultId: () => Promise<string>;
  onListChange: (v: RawValue | undefined) => void;
  onLiveChange: (v: RawValue | undefined) => void;
  onUploaded?: () => void;
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
    <div className="testing-input-wide w-full min-w-0 max-w-3xl space-y-5">
      <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/30">
        <YesNoToggle
          name="ai-cam-models"
          label="AI Cam Models"
          value={parsed.aiCamModels}
          disabled={disabled}
          onChange={setAiCamModels}
        />
        {liveCamDef && (
          <EvidenceAttachments
            def={liveCamDef}
            resultId={liveCamResultId ?? null}
            productId={productId}
            ensureResultId={ensureLiveCamResultId}
            disabled={disabled}
            captionTag={LIVE_CAM_PROOF_TAG}
            altTextPrefix="AI Cam Models"
            embedded
            onUploaded={onUploaded}
          />
        )}
      </section>

      <section className="space-y-3">
        <YesNoToggle
          name="bonus-features"
          label="Bonus features"
          value={parsed.hasBonus}
          disabled={disabled}
          onChange={setHasBonus}
        />

        {showMore && (
          <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">More bonus features</p>

            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/40"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Name
                    <TextInput
                      disabled={disabled}
                      placeholder="Feature name"
                      value={row.name}
                      className="mt-1 text-sm"
                      onChange={(e) => patchRow(idx, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Description
                    <TextInput
                      disabled={disabled}
                      placeholder="What does this feature do?"
                      value={row.note}
                      className="mt-1 text-sm"
                      onChange={(e) => patchRow(idx, { note: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </label>
                </div>

                <EvidenceAttachments
                  def={def}
                  resultId={listResultId ?? null}
                  productId={productId}
                  ensureResultId={ensureListResultId}
                  disabled={disabled}
                  captionTag={bonusExtraCaption(row.id)}
                  altTextPrefix={row.name.trim() || `Bonus feature ${idx + 1}`}
                  embedded
                  onUploaded={onUploaded}
                />
              </div>
            ))}

            <button
              type="button"
              disabled={disabled}
              className="testing-link text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation();
                addRow();
              }}
            >
              + Add more
            </button>
          </div>
        )}
      </section>
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
