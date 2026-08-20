// “Real-world spend” — tabbed personas, per-day usage, three billing options.

import { useEffect, useMemo, useState } from 'react';
import { dataApi, type EntityRow } from '../../api';
import { useAsyncToast } from '../../Toast';
import { Badge, Button, Icon, TextInput } from '../../ui';
import { fmtMoney } from '../../../../lib/pricing/calc';
import {
  DAYS_PER_MONTH,
  defaultUsageProfilesForType,
  estimateProfile,
  profilesFromSnapshot,
  type PresetId,
  type UsageProfile,
} from '../../../../lib/pricing/usageScenarios';
import { productTypeLabel, resolveProductType } from '../../../../lib/pricing/productType';
import { useWorkspace } from '../context';

function pickCurrentRun(runs: EntityRow[]): EntityRow | null {
  if (runs.length === 0) return null;
  return (
    runs.find((r) => r.status === 'in_progress' || r.status === 'draft') ??
    runs.find((r) => !r.isCurrentPublished && r.status !== 'superseded') ??
    runs[runs.length - 1]
  );
}

export function UsageScenariosPanel({
  snapshot,
  tiers,
  featureCosts,
  packages,
  currency,
  canEdit,
  onPatchSnapshot,
}: {
  snapshot: EntityRow;
  tiers: EntityRow[];
  featureCosts: EntityRow[];
  packages: EntityRow[];
  currency: string;
  canEdit: boolean;
  onPatchSnapshot: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const ws = useWorkspace();
  const { set, fields } = ws;
  const productType = resolveProductType(String(fields.slug ?? ''), fields.productType);
  const { error, setError, run, busy } = useAsyncToast();
  const [profiles, setProfiles] = useState<UsageProfile[]>(() =>
    profilesFromSnapshot(snapshot.usageScenarios, productType),
  );
  const [activeId, setActiveId] = useState<PresetId>('regular');
  const [editingUsage, setEditingUsage] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setProfiles(profilesFromSnapshot(snapshot.usageScenarios, productType));
    setDirty(false);
    setEditingUsage(false);
  }, [snapshot.id, snapshot.usageScenarios, productType]);

  const activeTiers = tiers.filter((t) => t.active !== false);
  const activeCosts = featureCosts.filter((c) => c.active !== false);
  const activePackages = packages.filter((p) => p.active !== false);

  const referencePlanName = String(snapshot.referencePlanName ?? '') || null;

  const estimates = useMemo(
    () =>
      profiles.map((p) =>
        estimateProfile(
          p,
          activeTiers as any,
          activeCosts as any,
          activePackages as any,
          referencePlanName,
        ),
      ),
    [profiles, activeTiers, activeCosts, activePackages, referencePlanName],
  );

  const activeProfile = profiles.find((p) => p.id === activeId) ?? profiles[0];
  const activeEstimate = estimates.find((e) => e.profile.id === activeId) ?? estimates[0];
  const missingPricing = activeTiers.length === 0;

  function patchProfile(id: PresetId, patch: Partial<UsageProfile>) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDirty(true);
  }

  async function saveProfiles() {
    await onPatchSnapshot({ usageScenarios: profiles });
    setDirty(false);
    setEditingUsage(false);
  }

  async function resetDefaults() {
    setProfiles(defaultUsageProfilesForType(productType).map((p) => ({ ...p })));
    setDirty(true);
  }

  async function syncToTesting() {
    const testRun = pickCurrentRun(ws.related.testRuns);
    if (!testRun) {
      setError('Start a test run on the Testing tab first.');
      return;
    }
    const regular = estimates.find((e) => e.profile.id === 'regular');
    const power = estimates.find((e) => e.profile.id === 'power');
    if (regular?.totalMonthly != null) {
      await set('typicalMonthlyCost', regular.totalMonthly);
    }

    const [defsRes, resultsRes] = await Promise.all([
      dataApi.list('evidenceDefinitions'),
      dataApi.list('evidenceResults'),
    ]);
    const slugToDef = new Map<string, EntityRow>();
    for (const d of defsRes.rows) {
      if (String(d.slug) === 'monthly-spend') {
        slugToDef.set(String(d.slug), d);
      }
    }

    const runResults = resultsRes.rows.filter((r) => r.testRun?.id === testRun.id);
    const defResult = (defId: string) => runResults.find((r) => r.evidenceDefinition?.id === defId);
    const writes: Promise<unknown>[] = [];
    const now = Date.now();

    function writeEvidence(slug: string, value: number, detail: Record<string, unknown>) {
      const def = slugToDef.get(slug);
      if (!def) return;
      const existing = defResult(def.id);
      const payload = {
        rawValue: { value, detail },
        notApplicable: false,
        isUnknown: false,
        testDate: now,
      };
      if (existing) {
        writes.push(dataApi.update('evidenceResults', existing.id, payload));
      } else {
        writes.push(
          dataApi.create('evidenceResults', payload, {
            testRun: testRun.id,
            evidenceDefinition: def.id,
            product: ws.productId,
          }),
        );
      }
    }

    if (regular?.totalMonthly != null) {
      writeEvidence('monthly-spend', regular.totalMonthly, {
        planCost: regular.planCost,
        topUpCost: regular.topUpCost,
        profile: 'regular',
      });
    }

    await Promise.all(writes);
    if (writes.length === 0) {
      setError('Could not find monthly-spend evidence definition.');
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Real-world spend</h3>
          <Badge tone="gray">{productTypeLabel(productType)}</Badge>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Pick a user type and see what they&apos;d pay on monthly, 3-month, or 12-month billing.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
        {profiles.map((p) => {
          const est = estimates.find((e) => e.profile.id === p.id);
          const monthly = est?.billingPlans.find((b) => b.key === 'monthly');
          return (
            <button
              key={p.id}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                p.id === activeId
                  ? 'bg-pink-100 text-pink-800 dark:bg-pink-950/50 dark:text-pink-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
              onClick={() => {
                setActiveId(p.id);
                setEditingUsage(false);
              }}
            >
              {p.title}
              {monthly?.totalPerMonth != null && (
                <span className="ml-1 opacity-70">{fmtMoney(monthly.totalPerMonth, currency)}</span>
              )}
            </button>
          );
        })}
      </div>

      {activeProfile && (
        <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">{activeProfile.description}</p>
              {canEdit && (
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-pink-600 dark:hover:bg-slate-800"
                  onClick={() => setEditingUsage((v) => !v)}
                  title={editingUsage ? 'Done editing' : 'Edit usage'}
                >
                  <Icon name={editingUsage ? 'check' : 'edit'} className="!text-[14px]" />
                  {editingUsage ? 'Done' : 'Edit'}
                </button>
              )}
            </div>

            {editingUsage && canEdit ? (
              <div className="grid grid-cols-2 gap-3">
                <CountField
                  label="Messages / day"
                  value={activeProfile.messagesPerDay}
                  step="1"
                  onChange={(v) => patchProfile(activeId, { messagesPerDay: v })}
                  monthlyHint={activeProfile.messagesPerDay * DAYS_PER_MONTH}
                  monthlyUnit="messages"
                />
                <CountField
                  label="Images / day"
                  value={activeProfile.imagesPerDay}
                  step="0.1"
                  onChange={(v) => patchProfile(activeId, { imagesPerDay: v })}
                  monthlyHint={activeProfile.imagesPerDay * DAYS_PER_MONTH}
                  monthlyUnit="images"
                />
                <CountField
                  label="Videos / day"
                  value={activeProfile.videosPerDay}
                  step="0.1"
                  onChange={(v) => patchProfile(activeId, { videosPerDay: v })}
                  monthlyHint={activeProfile.videosPerDay * DAYS_PER_MONTH}
                  monthlyUnit="videos"
                />
                <CountField
                  label="Voice min / day"
                  value={activeProfile.voiceMinutesPerDay}
                  step="0.1"
                  onChange={(v) => patchProfile(activeId, { voiceMinutesPerDay: v })}
                  monthlyHint={activeProfile.voiceMinutesPerDay * DAYS_PER_MONTH}
                  monthlyUnit="min"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <UsageTile icon="chat" label="Messages" perDay={activeProfile.messagesPerDay} unit="day" />
                <UsageTile icon="image" label="Images" perDay={activeProfile.imagesPerDay} unit="day" />
                <UsageTile icon="videocam" label="Videos" perDay={activeProfile.videosPerDay} unit="day" />
                <UsageTile icon="mic" label="Voice" perDay={activeProfile.voiceMinutesPerDay} unit="min/day" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Estimated spend</p>
            {missingPricing || activeEstimate?.missingData ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                Add subscription plans above to calculate.
              </p>
            ) : (
              <>
                {activeEstimate?.billingPlans.map((plan) => (
                  <PlanCard key={plan.key} plan={plan} currency={currency} highlight={plan.key === 'monthly'} />
                ))}
                {activeEstimate?.byPlan && activeEstimate.byPlan.length > 1 && (
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    By plan:{' '}
                    {activeEstimate.byPlan
                      .map(
                        (row) =>
                          `${row.planName} ${
                            row.totalMonthly != null ? fmtMoney(row.totalMonthly, currency) : '—'
                          }`,
                      )
                      .join(' · ')}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        {canEdit && (
          <>
            <Button variant="secondary" className="text-xs" disabled={!dirty} onClick={() => void saveProfiles()}>
              Save scenarios
            </Button>
            <Button variant="ghost" className="text-xs" onClick={() => void resetDefaults()}>
              Reset to defaults
            </Button>
            <Button
              variant="secondary"
              className="text-xs"
              disabled={busy}
              onClick={() => void run(syncToTesting)}
            >
              {busy ? 'Syncing…' : 'Sync regular & power to testing'}
            </Button>
          </>
        )}
        {fields.typicalMonthlyCost != null && (
          <span className="text-xs text-slate-400">
            Typical cost on product: {fmtMoney(Number(fields.typicalMonthlyCost), currency)}/mo
          </span>
        )}
      </div>
      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
    </section>
  );
}

function UsageTile({
  icon,
  label,
  perDay,
  unit,
}: {
  icon: string;
  label: string;
  perDay: number;
  unit: string;
}) {
  const display = Number.isInteger(perDay) ? perDay : Math.round(perDay * 10) / 10;
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2.5 text-center dark:border-slate-700">
      <Icon name={icon} className="!text-[18px] text-pink-500" />
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{display}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[10px] text-slate-400">per {unit}</p>
    </div>
  );
}

function planBadgeTone(key: string): 'pink' | 'blue' | 'gray' | 'amber' {
  if (key === 'monthly') return 'pink';
  if (key === 'quarterly') return 'blue';
  if (key === 'yearly') return 'gray';
  return 'gray';
}

function PlanCard({
  plan,
  currency,
  highlight,
}: {
  plan: {
    key: string;
    label: string;
    available: boolean;
    planPrice: number | null;
    periodMonths: number;
    planPerMonth: number | null;
    topUpPerMonth: number | null;
    totalPerMonth: number | null;
    planName?: string | null;
  };
  currency: string;
  highlight?: boolean;
}) {
  const badge = <Badge tone={planBadgeTone(plan.key)}>{plan.label}</Badge>;

  if (!plan.available) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2.5 dark:border-slate-700">
        <div className="mb-1">{badge}</div>
        <p className="text-xs text-slate-400">Not offered on this product</p>
      </div>
    );
  }

  if (plan.totalPerMonth == null) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="mb-1">{badge}</div>
        <p className="text-xs text-amber-700">Add token packages to estimate extras</p>
      </div>
    );
  }

  const planPart = plan.planPerMonth ?? 0;
  const topUp = plan.topUpPerMonth ?? 0;
  const billedLabel =
    plan.periodMonths === 1
      ? `${fmtMoney(plan.planPrice, currency)}/mo`
      : plan.periodMonths === 3
        ? `${fmtMoney(plan.planPrice, currency)} every 3 mo`
        : `${fmtMoney(plan.planPrice, currency)}/yr`;

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        highlight
          ? 'border-pink-300 bg-pink-50/50 dark:border-pink-800 dark:bg-pink-950/20'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        {badge}
        {highlight && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-pink-600 dark:text-pink-400">
            Sticker
          </span>
        )}
      </div>
      <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        {fmtMoney(plan.totalPerMonth, currency)}
        <span className="text-xs font-normal text-slate-500"> / month</span>
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        Subscription {fmtMoney(planPart, currency)}/mo
        {plan.planName ? <> ({plan.planName})</> : null}
        {topUp > 0 && <> + {fmtMoney(topUp, currency)} extra tokens</>}
        <span className="block text-[10px] text-slate-400">Charged {billedLabel}</span>
      </p>
    </div>
  );
}

function CountField({
  label,
  value,
  step = '1',
  monthlyHint,
  monthlyUnit,
  onChange,
}: {
  label: string;
  value: number;
  step?: string;
  monthlyHint?: number;
  monthlyUnit?: string;
  onChange: (v: number) => void;
}) {
  const hint =
    monthlyHint != null && monthlyUnit
      ? `≈ ${Number.isInteger(monthlyHint) ? monthlyHint : Math.round(monthlyHint * 10) / 10} ${monthlyUnit}/month`
      : null;

  return (
    <label className="block text-xs text-slate-600 dark:text-slate-400">
      {label}
      <TextInput
        type="number"
        min={0}
        step={step}
        className="mt-0.5 !py-1.5 text-sm"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
      {hint && <span className="mt-0.5 block text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}
