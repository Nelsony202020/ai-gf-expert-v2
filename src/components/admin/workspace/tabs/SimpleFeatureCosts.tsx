import { useEffect, useMemo, useState } from 'react';
import { dataApi, type EntityRow } from '../../api';
import { useAsyncToast } from '../../Toast';
import { Button, Field, Modal, Select, TextInput } from '../../ui';
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
  embedded = false,
}: {
  costs: EntityRow[];
  snapshotId: string;
  creditLabel: string;
  canEdit: boolean;
  embedded?: boolean;
}) {
  const ws = useWorkspace();
  const { setError } = useAsyncToast();
  const [bootstrapping, setBootstrapping] = useState(false);
  const [editing, setEditing] = useState<{ def: (typeof PREDEFINED_FEATURE_COSTS)[number]; cost: EntityRow } | null>(
    null,
  );

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

  const table = (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
          <th className="px-4 py-2">Feature</th>
          <th className="px-2 py-2">{creditLabel.replace(/^\w/, (c) => c.toUpperCase())}</th>
          <th className="px-2 py-2">Unit</th>
          <th className="px-2 py-2" />
        </tr>
      </thead>
      <tbody>
        {rows.map(({ def, cost }) => {
          const range = cost ? featureCostRange(cost as any) : null;
          const loading = !cost && bootstrapping;
          return (
            <tr key={def.featureType} className="border-b border-slate-50 dark:border-slate-800/60">
              <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{def.label}</td>
              <td className="px-2 py-2">
                {loading ? (
                  <span className="text-slate-400">…</span>
                ) : range ? (
                  range.min
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                {UNIT_LABELS[String(cost?.unit ?? def.defaultUnit)] ?? String(cost?.unit ?? def.defaultUnit)}
              </td>
              <td className="px-2 py-2 text-right">
                {canEdit && cost && !loading && (
                  <Button variant="ghost" className="text-xs" onClick={() => setEditing({ def, cost })}>
                    Edit
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const body = (
    <>
      {table}
      {editing && (
        <FeatureCostModal
          def={editing.def}
          cost={editing.cost}
          snapshotId={snapshotId}
          creditLabel={creditLabel}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void ws.refreshRelated();
          }}
        />
      )}
    </>
  );

  if (embedded) {
    return (
      <div>
        <div className="px-4 pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Feature costs in {creditLabel}
          </h4>
        </div>
        {body}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          What does each feature cost in {creditLabel}?
        </h3>
        <p className="text-xs text-slate-400">Credit cost for each feature type.</p>
      </div>
      {body}
    </section>
  );
}

function FeatureCostModal({
  def,
  cost,
  snapshotId,
  creditLabel,
  onClose,
  onSaved,
}: {
  def: (typeof PREDEFINED_FEATURE_COSTS)[number];
  cost: EntityRow;
  snapshotId: string;
  creditLabel: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const range = featureCostRange(cost as any);
  const [credits, setCredits] = useState(range ? String(range.min) : '');
  const [unit, setUnit] = useState(String(cost.unit ?? def.defaultUnit));
  const { busy, error, run } = useAsyncToast();
  const hasUnitChoice = def.unitOptions.length > 1;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = credits !== '' ? Number(credits) : undefined;
    const done = await run(async () => {
      await dataApi.update(
        'featureCosts',
        cost.id,
        {
          featureType: def.featureType,
          creditCost: value,
          minCost: undefined,
          maxCost: undefined,
          costType: 'fixed',
          unit,
          active: true,
        },
        { snapshot: snapshotId },
      );
      return true;
    });
    if (done) onSaved();
  }

  return (
    <Modal title={`Edit: ${def.label}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Field label={`Cost in ${creditLabel}`}>
          <TextInput
            inputMode="decimal"
            value={credits}
            onChange={(e) => setCredits(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="e.g. 5"
          />
        </Field>
        <Field label="Unit">
          {hasUnitChoice ? (
            <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {def.unitOptions.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u] ?? u}
                </option>
              ))}
            </Select>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">{UNIT_LABELS[def.defaultUnit]}</p>
          )}
        </Field>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
