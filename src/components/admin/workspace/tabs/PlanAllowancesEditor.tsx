// Plan entitlement editor — readable summary rows by default; expand one row to edit.
// Used by the Pricing tab tier modal and the AI pricing review modal.

import { useState } from 'react';
import { Button, Icon, Select, TextInput } from '../../ui';
import {
  ACCESS_TYPE_LABELS,
  allowanceDisplayLabel,
  allowanceNeedsReview,
  formatAllowanceReviewBadge,
  groupAllowancesForReview,
  newAllowanceId,
  normalizeAllowanceLabel,
  parsePlanAllowances,
  PLAN_ACCESS_TYPES,
  PLAN_RESET_INTERVALS,
  RESET_INTERVAL_LABELS,
  type PlanAccessType,
  type PlanAllowance,
  type PlanResetInterval,
} from '../../../../lib/pricing/planAllowances';

const PRESET_FEATURES: { label: string; key: string }[] = [
  { label: 'Messages', key: 'messages' },
  { label: 'Photo messages', key: 'photo_messages' },
  { label: 'Generations', key: 'image_generations' },
  { label: 'HD generations', key: 'hd_generations' },
  { label: 'Video', key: 'videos' },
  { label: 'Voice messages', key: 'voice_messages' },
  { label: 'Voice chat', key: 'voice_chat' },
  { label: 'Included credits', key: 'shared_credits' },
  { label: 'Memory', key: 'memory' },
  { label: 'Messaging speed', key: 'messaging_speed' },
  { label: 'Customized personas', key: 'personas' },
  { label: 'Custom companions', key: 'custom_companions' },
  { label: 'Customizations', key: 'customizations' },
];

function needsAmount(access: PlanAccessType): boolean {
  return access === 'included_quantity' || access === 'included_credits';
}

function needsReset(access: PlanAccessType): boolean {
  return access === 'included_quantity' || access === 'included_credits';
}

function badgeTone(a: PlanAllowance): string {
  if (allowanceNeedsReview(a)) {
    return 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800';
  }
  if (a.accessType === 'unlimited') {
    return 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800';
  }
  if (a.accessType === 'not_included') {
    return 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700';
  }
  return 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700';
}

export function PlanAllowancesEditor({
  value,
  onChange,
  disabled,
}: {
  value: PlanAllowance[];
  onChange: (next: PlanAllowance[]) => void;
  disabled?: boolean;
  /** @deprecated Ignored — editor is always review-first. */
  variant?: 'edit' | 'review';
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  function patch(id: string, patch: Partial<PlanAllowance>) {
    onChange(
      value.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        if (patch.sourceLabel != null && !patch.featureKey) {
          next.featureKey = normalizeAllowanceLabel(patch.sourceLabel);
        }
        return next;
      }),
    );
  }

  function addRow(preset?: { label: string; key: string }) {
    const id = newAllowanceId();
    onChange([
      ...value,
      {
        id,
        featureKey: preset?.key ?? 'other',
        sourceLabel: preset?.label ?? '',
        accessType: 'included_quantity',
        quantity: undefined,
        resetInterval: 'month',
      },
    ]);
    setEditingId(id);
    setShowAddMenu(false);
  }

  function removeRow(id: string) {
    onChange(value.filter((r) => r.id !== id));
    if (editingId === id) setEditingId(null);
  }

  const groups = groupAllowancesForReview(value);
  const needsCount = value.filter(allowanceNeedsReview).length;

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Included benefits / allowances
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {value.length === 0
              ? 'What this tier already includes. Feature costs apply only to usage beyond these.'
              : `${value.length} benefit${value.length === 1 ? '' : 's'}${
                  needsCount > 0
                    ? ` · ${needsCount} need${needsCount === 1 ? 's' : ''} review`
                    : ' · All looks good'
                }`}
          </p>
        </div>
        {!disabled && (
          <div className="relative">
            <Button
              type="button"
              variant="secondary"
              className="!py-0.5 text-[10px]"
              onClick={() => setShowAddMenu((v) => !v)}
            >
              <Icon name="add" className="!text-[12px]" /> Add benefit
            </Button>
            {showAddMenu && (
              <div className="absolute right-0 z-20 mt-1 max-h-56 w-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {PRESET_FEATURES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className="block w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => addRow(p)}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="block w-full border-t border-slate-100 px-3 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  onClick={() => addRow()}
                >
                  Other…
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {value.length === 0 ? (
        <p className="text-[11px] text-slate-400">
          No plan-specific allowances. Shared included tokens + feature costs still apply.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {group.label}
              </p>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900/60">
                {group.rows.map((row) => {
                  const editing = editingId === row.id;
                  const needs = allowanceNeedsReview(row);
                  return (
                    <li key={row.id} className="px-3 py-2">
                      {editing ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {allowanceDisplayLabel(row)}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="block sm:col-span-2">
                              <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                Name
                              </span>
                              <TextInput
                                value={row.sourceLabel}
                                disabled={disabled}
                                placeholder="As shown on pricing page"
                                className="!py-1 text-xs"
                                onChange={(e) => patch(row.id, { sourceLabel: e.target.value })}
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                Access
                              </span>
                              <Select
                                value={row.accessType}
                                disabled={disabled}
                                className="!py-1 text-xs"
                                onChange={(e) =>
                                  patch(row.id, { accessType: e.target.value as PlanAccessType })
                                }
                              >
                                {PLAN_ACCESS_TYPES.map((t) => (
                                  <option key={t} value={t}>
                                    {ACCESS_TYPE_LABELS[t]}
                                  </option>
                                ))}
                              </Select>
                            </label>
                            {needsAmount(row.accessType) ? (
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  Amount
                                </span>
                                <TextInput
                                  inputMode="decimal"
                                  value={row.quantity != null ? String(row.quantity) : ''}
                                  disabled={disabled}
                                  placeholder="Qty"
                                  className="!py-1 text-xs"
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^\d.]/g, '');
                                    patch(row.id, {
                                      quantity: raw === '' ? undefined : Number(raw),
                                    });
                                  }}
                                />
                              </label>
                            ) : null}
                            {needsReset(row.accessType) ? (
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  Reset
                                </span>
                                <Select
                                  value={row.resetInterval ?? 'month'}
                                  disabled={disabled}
                                  className="!py-1 text-xs"
                                  onChange={(e) =>
                                    patch(row.id, {
                                      resetInterval: e.target.value as PlanResetInterval,
                                    })
                                  }
                                >
                                  {PLAN_RESET_INTERVALS.map((r) => (
                                    <option key={r} value={r}>
                                      {RESET_INTERVAL_LABELS[r]}
                                    </option>
                                  ))}
                                </Select>
                              </label>
                            ) : null}
                            {(row.accessType === 'included_unspecified' ||
                              row.accessType === 'unlimited') && (
                              <label className="block sm:col-span-2">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  Display note (optional)
                                </span>
                                <TextInput
                                  value={row.notes ?? ''}
                                  disabled={disabled}
                                  placeholder="e.g. 16K context, 95+, Faster"
                                  className="!py-1 text-xs"
                                  onChange={(e) =>
                                    patch(row.id, {
                                      notes: e.target.value.trim() || undefined,
                                    })
                                  }
                                />
                              </label>
                            )}
                          </div>
                          <div className="flex justify-end gap-2">
                            {!disabled && (
                              <Button
                                type="button"
                                variant="ghost"
                                className="!py-0.5 text-[11px] text-red-600"
                                onClick={() => removeRow(row.id)}
                              >
                                Remove benefit
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="secondary"
                              className="!py-0.5 text-[11px]"
                              onClick={() => setEditingId(null)}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                {allowanceDisplayLabel(row)}
                              </p>
                              {needs && (
                                <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800">
                                  Needs review
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${badgeTone(row)}`}
                            title={
                              row.accessType === 'included_unspecified'
                                ? 'Included — no quantity specified'
                                : undefined
                            }
                          >
                            {formatAllowanceReviewBadge(row)}
                          </span>
                          {!disabled && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="!py-0.5 shrink-0 text-[11px]"
                              onClick={() => setEditingId(row.id)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function allowancesFromPlanRow(row: { allowances?: unknown } | null | undefined): PlanAllowance[] {
  return parsePlanAllowances(row?.allowances);
}
