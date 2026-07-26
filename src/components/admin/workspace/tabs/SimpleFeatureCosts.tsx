import { useEffect, useMemo, useState } from 'react';
import { dataApi, type EntityRow } from '../../api';
import { ErrorNote, Select, TextInput, useAsync } from '../../ui';
import { useWorkspace } from '../context';
import { featureCostRange } from '../../../../lib/pricing/calc';

export const PREDEFINED_FEATURE_COSTS = [
  {
    featureType: 'standard_image',
    label: 'Standard image',
    defaultUnit: 'per_image',
    unitOptions: ['per_image'] as const,
    findTypes: ['standard_image'],
  },
  {
    featureType: 'voice_message',
    label: 'Voice message',
    defaultUnit: 'per_message',
    unitOptions: ['per_message'] as const,
    findTypes: ['voice_message'],
  },
  {
    featureType: 'voice_call',
    label: 'Phone / voice call',
    defaultUnit: 'per_minute',
    unitOptions: ['per_minute', 'per_second'] as const,
    findTypes: ['voice_call'],
  },
  {
    featureType: 'standard_video',
    label: 'Video generation',
    defaultUnit: 'per_second',
    unitOptions: ['per_second'] as const,
    findTypes: ['standard_video', 'text_to_video'],
  },
] as const;

const UNIT_LABELS: Record<string, string> = {
  per_image: 'per image',
  per_message: 'per message',
  per_minute: 'per minute',
  per_second: 'per second',
};

function findCost(costs: EntityRow[], types: readonly string[]): EntityRow | undefined {
  return costs.find((c) => types.includes(String(c.featureType ?? '')));
}

export function SimpleFeatureCosts({
  costs,
  snapshotId,
  creditLabel,
  canEdit,
}: {
  costs: EntityRow[];
  snapshotId: string;
  creditLabel: string;
  canEdit: boolean;
}) {
  const ws = useWorkspace();
  const { error, setError } = useAsync();
  const [bootstrapping, setBootstrapping] = useState(false);

  const rows = useMemo(
    () =>
      PREDEFINED_FEATURE_COSTS.map((def, index) => ({
        def,
        cost: findCost(costs, def.findTypes),
        sortOrder: index,
      })),
    [costs],
  );

  useEffect(() => {
    if (!canEdit || bootstrapping) return;
    const missing = rows.filter((r) => !r.cost);
    if (missing.length === 0) return;

    let cancelled = false;
    setBootstrapping(true);
    void (async () => {
      try {
        await Promise.all(
          missing.map(({ def, sortOrder }) =>
            dataApi.create(
              'featureCosts',
              {
                featureType: def.featureType,
                unit: def.defaultUnit,
                active: true,
                sortOrder,
              },
              { product: ws.productId, snapshot: snapshotId },
            ),
          ),
        );
        if (!cancelled) await ws.refreshRelated();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canEdit, bootstrapping, rows, snapshotId, ws, setError]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          What does each feature cost in {creditLabel}?
        </h3>
        <p className="text-xs text-slate-400">Fill in the credit cost for each feature type.</p>
      </div>
      {error && (
        <div className="px-4 pt-3">
          <ErrorNote message={error} />
        </div>
      )}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map(({ def, cost }) => (
          <FeatureCostField
            key={def.featureType}
            def={def}
            cost={cost ?? null}
            snapshotId={snapshotId}
            creditLabel={creditLabel}
            canEdit={canEdit}
            loading={!cost && bootstrapping}
          />
        ))}
      </div>
    </section>
  );
}

function FeatureCostField({
  def,
  cost,
  snapshotId,
  creditLabel,
  canEdit,
  loading,
}: {
  def: (typeof PREDEFINED_FEATURE_COSTS)[number];
  cost: EntityRow | null;
  snapshotId: string;
  creditLabel: string;
  canEdit: boolean;
  loading: boolean;
}) {
  const ws = useWorkspace();
  const range = cost ? featureCostRange(cost as any) : null;
  const [credits, setCredits] = useState(range ? String(range.min) : '');
  const [unit, setUnit] = useState(String(cost?.unit ?? def.defaultUnit));
  const { error, run } = useAsync();

  useEffect(() => {
    const next = cost ? featureCostRange(cost as any) : null;
    setCredits(next ? String(next.min) : '');
    setUnit(String(cost?.unit ?? def.defaultUnit));
  }, [cost, def.defaultUnit]);

  async function save(patch: { credits?: string; unit?: string }) {
    if (!cost || !canEdit) return;
    const nextCredits = patch.credits ?? credits;
    const nextUnit = patch.unit ?? unit;
    const value = nextCredits !== '' ? Number(nextCredits) : undefined;
    await run(async () => {
      await dataApi.update(
        'featureCosts',
        cost.id,
        {
          featureType: def.featureType,
          creditCost: value,
          minCost: undefined,
          maxCost: undefined,
          costType: 'fixed',
          unit: nextUnit,
          active: true,
        },
        { snapshot: snapshotId },
      );
      await ws.refreshRelated();
    });
  }

  const hasUnitChoice = def.unitOptions.length > 1;

  return (
    <div className="grid items-end gap-3 px-4 py-3 sm:grid-cols-[1.4fr_1fr_1fr]">
      {error && (
        <div className="sm:col-span-3">
          <ErrorNote message={error} />
        </div>
      )}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{def.label}</label>
        {loading ? (
          <p className="mt-1 text-sm text-slate-400">Loading…</p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-400">
            {hasUnitChoice ? 'Pick how the app displays call pricing.' : `Cost in ${creditLabel}.`}
          </p>
        )}
      </div>
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {creditLabel.replace(/^\w/, (c) => c.toUpperCase())}
        </label>
        <TextInput
          inputMode="decimal"
          value={credits}
          disabled={!canEdit || loading || !cost}
          onChange={(e) => setCredits(e.target.value.replace(/[^\d.]/g, ''))}
          onBlur={() => void save({})}
          placeholder="e.g. 5"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Unit</label>
        {hasUnitChoice ? (
          <Select
            value={unit}
            disabled={!canEdit || loading || !cost}
            onChange={(e) => {
              const next = e.target.value;
              setUnit(next);
              void save({ unit: next });
            }}
          >
            {def.unitOptions.map((u) => (
              <option key={u} value={u}>
                {UNIT_LABELS[u] ?? u}
              </option>
            ))}
          </Select>
        ) : (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{UNIT_LABELS[def.defaultUnit]}</p>
        )}
      </div>
    </div>
  );
}
