// Simplified pricing test session — prices live in the Pricing tab.

import type { EntityRow } from '../api';
import { TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';
import { QuestionLabel } from './QuestionLabel';
import type { SessionItem } from './sessionUi';

type YnlStatus = 'yes' | 'limited' | 'no' | '';

interface TrialDetails {
  messages?: number;
  images?: number;
  customAiAllowed?: boolean;
  customAiCount?: number;
  videoAllowed?: boolean;
}

function ynlStatus(raw: RawValue | undefined): YnlStatus {
  if (!raw || !('status' in raw)) return '';
  const s = raw.status;
  if (s === 'yes' || s === 'limited' || s === 'no') return s;
  return '';
}

function trialDetails(raw: RawValue | undefined): TrialDetails {
  if (!raw || !('detail' in raw) || !raw.detail) return {};
  const d = raw.detail as Record<string, unknown>;
  const trial = (d.trialDetails ?? d) as Record<string, unknown>;
  return {
    messages: typeof trial.messages === 'number' ? trial.messages : undefined,
    images: typeof trial.images === 'number' ? trial.images : undefined,
    customAiAllowed: trial.customAiAllowed === true,
    customAiCount: typeof trial.customAiCount === 'number' ? trial.customAiCount : undefined,
    videoAllowed: trial.videoAllowed === true,
  };
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

export function PricingBasicsForm({
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
  const freePlanDef = bySlug.get('free-plan');
  const freeTrialDef = bySlug.get('free-trial');
  const includedDef = bySlug.get('included-features');

  const freePlanRaw = freePlanDef ? drafts[freePlanDef.id]?.raw : undefined;
  const freeTrialRaw = freeTrialDef ? drafts[freeTrialDef.id]?.raw : undefined;
  const includedRaw = includedDef ? drafts[includedDef.id]?.raw : undefined;

  const trialStatus = ynlStatus(freeTrialRaw);
  const trial = trialDetails(freeTrialRaw);
  const showTrialFields = trialStatus === 'yes' || trialStatus === 'limited';

  const unlimitedChat =
    includedRaw && 'detail' in includedRaw && includedRaw.detail
      ? (includedRaw.detail as Record<string, unknown>).unlimitedChat === true
      : includedRaw && 'value' in includedRaw
        ? includedRaw.value >= 10
        : false;

  function patchTrial(status: YnlStatus, details?: Partial<TrialDetails>) {
    if (!freeTrialDef) return;
    const prev = trialDetails(freeTrialRaw);
    const merged = { ...prev, ...details };
    onPatch(freeTrialDef.id, {
      status: status || 'no',
      detail: { trialDetails: merged },
    });
  }

  return (
    <div className="space-y-4">
      {freePlanDef && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
            <QuestionLabel def={freePlanDef} categorySlug={categorySlug} required />
          </p>
          <YnlSelect
            value={ynlStatus(freePlanRaw)}
            disabled={disabled}
            onChange={(v) => onPatch(freePlanDef.id, v ? { status: v } : undefined)}
          />
        </div>
      )}

      {freeTrialDef && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            <QuestionLabel def={freeTrialDef} categorySlug={categorySlug} required />
          </p>
          <YnlSelect
            value={trialStatus}
            disabled={disabled}
            onChange={(v) => {
              if (!v) return;
              onPatch(freeTrialDef.id, { status: v, detail: { trialDetails: trial } });
            }}
          />
          {showTrialFields && (
            <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-700 dark:bg-slate-800/40 sm:grid-cols-2">
              <label className="text-xs text-slate-600 dark:text-slate-400">
                Messages included
                <TextInput
                  type="number"
                  min={0}
                  className="mt-0.5 !py-1 text-sm"
                  value={trial.messages ?? ''}
                  disabled={disabled}
                  onChange={(e) =>
                    patchTrial(trialStatus, {
                      ...trial,
                      messages: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </label>
              <label className="text-xs text-slate-600 dark:text-slate-400">
                Images included
                <TextInput
                  type="number"
                  min={0}
                  className="mt-0.5 !py-1 text-sm"
                  value={trial.images ?? ''}
                  disabled={disabled}
                  onChange={(e) =>
                    patchTrial(trialStatus, {
                      ...trial,
                      images: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  className="testing-checkbox h-3.5 w-3.5 rounded"
                  checked={trial.customAiAllowed ?? false}
                  disabled={disabled}
                  onChange={(e) =>
                    patchTrial(trialStatus, { ...trial, customAiAllowed: e.target.checked })
                  }
                />
                Custom AI allowed
              </label>
              {trial.customAiAllowed && (
                <label className="text-xs text-slate-600 dark:text-slate-400">
                  How many custom AIs?
                  <TextInput
                    type="number"
                    min={0}
                    className="mt-0.5 !py-1 text-sm"
                    value={trial.customAiCount ?? ''}
                    disabled={disabled}
                    onChange={(e) =>
                      patchTrial(trialStatus, {
                        ...trial,
                        customAiCount:
                          e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)),
                      })
                    }
                  />
                </label>
              )}
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 sm:col-span-2">
                <input
                  type="checkbox"
                  className="testing-checkbox h-3.5 w-3.5 rounded"
                  checked={trial.videoAllowed ?? false}
                  disabled={disabled}
                  onChange={(e) =>
                    patchTrial(trialStatus, { ...trial, videoAllowed: e.target.checked })
                  }
                />
                Video generation included in trial
              </label>
            </div>
          )}
        </div>
      )}

      {includedDef && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
            <QuestionLabel def={includedDef} categorySlug={categorySlug} />
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="testing-checkbox h-4 w-4 rounded"
              checked={unlimitedChat}
              disabled={disabled}
              onChange={(e) =>
                onPatch(includedDef.id, {
                  value: e.target.checked ? 100 : 0,
                  detail: { unlimitedChat: e.target.checked, features: e.target.checked ? ['unlimited-chat'] : [] },
                })
              }
            />
            Unlimited chatting included
          </label>
        </div>
      )}
    </div>
  );
}
