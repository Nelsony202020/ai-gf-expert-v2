import { useEffect, useMemo, useState } from 'react';
import { dataApi, type EntityRow } from '../../api';
import { useAsyncToast } from '../../Toast';
import { Button, Field, Icon, Modal, Select, TextInput } from '../../ui';
import { useWorkspace } from '../context';
import { featureCostRange } from '../../../../lib/pricing/calc';
import {
  costsInFamily,
  dominantUnit,
  FEATURE_COST_FAMILIES,
  familySummaryRange,
  formatCostAmount,
  type FeatureCostFamilyDef,
  UNIT_LABELS,
  variantFieldsToFeatureCost,
  variantHasMetadata,
} from '../../../../lib/pricing/featureCostGroups';

export { FEATURE_COST_FAMILIES, PREDEFINED_FEATURE_COSTS } from '../../../../lib/pricing/featureCostGroups';

interface VariantDraft {
  id: string | null;
  model: string;
  durationProduced: string;
  customLabel: string;
  creditCost: string;
  unit: string;
}

function rowToDraft(cost: EntityRow, family: FeatureCostFamilyDef): VariantDraft {
  const range = featureCostRange(cost as any);
  return {
    id: cost.id,
    model: String(cost.qualityTier ?? ''),
    durationProduced: cost.durationProduced != null ? String(cost.durationProduced) : '',
    customLabel: String(cost.customLabel ?? ''),
    creditCost: range ? String(range.min) : '',
    unit: String(cost.unit ?? family.defaultUnit),
  };
}

function emptyDraft(family: FeatureCostFamilyDef): VariantDraft {
  return {
    id: null,
    model: '',
    durationProduced: '',
    customLabel: '',
    creditCost: '',
    unit: family.defaultUnit,
  };
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
  const [editingFamily, setEditingFamily] = useState<FeatureCostFamilyDef | null>(null);

  const rows = useMemo(
    () =>
      FEATURE_COST_FAMILIES.map((family, index) => {
        const variants = costsInFamily(costs, family);
        return { family, variants, sortOrder: index };
      }),
    [costs],
  );

  useEffect(() => {
    if (!canEdit || bootstrapping) return;
    const missing = rows.filter((r) => r.variants.length === 0);
    if (missing.length === 0) return;

    let cancelled = false;
    setBootstrapping(true);
    void (async () => {
      try {
        await Promise.all(
          missing.map(({ family, sortOrder }) =>
            dataApi.create(
              'featureCosts',
              {
                featureType: family.defaultFeatureType,
                unit: family.defaultUnit,
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
        {rows.map(({ family, variants }) => {
          const loading = variants.length === 0 && bootstrapping;
          const summary = familySummaryRange(variants);
          const unit = dominantUnit(variants, family.defaultUnit);
          const variantCount = variants.length;
          const hasVariants = variantCount > 1 || variants.some(variantHasMetadata);
          const editLabel = hasVariants ? `Variants (${variantCount})` : 'Edit';

          return (
            <tr key={family.key} className="border-b border-slate-50 dark:border-slate-800/60">
              <td className="px-4 py-2">
                <div className="font-medium text-slate-800 dark:text-slate-200">{family.label}</div>
                {hasVariants && (
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400 dark:text-slate-500">+ Variants</p>
                )}
              </td>
              <td className="px-2 py-2 align-top">
                {loading ? (
                  <span className="text-slate-400">…</span>
                ) : (
                  formatCostAmount(summary)
                )}
              </td>
              <td className="px-2 py-2 align-top text-slate-600 dark:text-slate-300">
                {unit === 'mixed' ? 'mixed' : (UNIT_LABELS[unit] ?? unit)}
              </td>
              <td className="px-2 py-2 text-right align-top">
                {canEdit && variants.length > 0 && !loading && (
                  <Button variant="ghost" className="text-xs" onClick={() => setEditingFamily(family)}>
                    {editLabel}
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
      {editingFamily && (
        <FeatureVariantsModal
          family={editingFamily}
          costs={costs}
          snapshotId={snapshotId}
          creditLabel={creditLabel}
          productId={ws.productId}
          onClose={() => setEditingFamily(null)}
          onSaved={() => {
            setEditingFamily(null);
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
        <p className="text-xs text-slate-400">
          One row per feature. Add variants for tiered or duration-based pricing.
        </p>
      </div>
      {body}
    </section>
  );
}

function FeatureVariantsModal({
  family,
  costs,
  snapshotId,
  creditLabel,
  productId,
  onClose,
  onSaved,
}: {
  family: FeatureCostFamilyDef;
  costs: EntityRow[];
  snapshotId: string;
  creditLabel: string;
  productId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const existing = useMemo(() => costsInFamily(costs, family), [costs, family]);
  const [variants, setVariants] = useState<VariantDraft[]>(() =>
    existing.length > 0 ? existing.map((c) => rowToDraft(c, family)) : [emptyDraft(family)],
  );
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { busy, error, run } = useAsyncToast();

  const showVariantFields = family.key === 'video_generation' || family.key === 'standard_image';
  const showDurationField = family.key === 'video_generation';

  function patchVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function moveVariant(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= variants.length || fromIndex === toIndex) return;
    setVariants((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item!);
      return next;
    });
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyDraft(family)]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => {
      const row = prev[index];
      if (row?.id) setRemovedIds((ids) => [...ids, row.id!]);
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyDraft(family)];
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(async () => {
      for (const id of removedIds) {
        await dataApi.remove('featureCosts', id);
      }

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i]!;
        const creditCost = v.creditCost.trim() !== '' ? Number(v.creditCost) : undefined;
        const duration =
          showDurationField && v.durationProduced.trim() !== '' ? Number(v.durationProduced) : undefined;

        if (family.key === 'video_generation' && v.customLabel.trim() && !v.model.trim() && creditCost == null) {
          throw new Error('Enter a coin cost for label-only variants (e.g. Video with audio).');
        }

        const mapped = variantFieldsToFeatureCost(family, {
          model: v.model.trim() || null,
          durationSeconds: duration ?? null,
          label: v.customLabel.trim() || null,
          creditCost: creditCost ?? null,
          unit: v.unit,
        });
        const fields: Record<string, unknown> = {
          ...mapped,
          minCost: undefined,
          maxCost: undefined,
          costType: creditCost != null ? 'fixed' : undefined,
          active: true,
          sortOrder: i,
        };

        if (v.id) {
          await dataApi.update('featureCosts', v.id, fields, { snapshot: snapshotId });
        } else if (creditCost != null) {
          await dataApi.create('featureCosts', fields, {
            product: productId,
            snapshot: snapshotId,
          });
        }
      }
      return true;
    });
    if (done) onSaved();
  }

  return (
    <Modal title={`${family.label} — pricing variants`} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {family.key === 'video_generation' ? (
            <>
              One row per price point. For model×duration tables use <strong>Model</strong> +{' '}
              <strong>Seconds</strong> (e.g. Lite + 5). For separate modalities like &quot;Video with audio&quot;, leave
              Model empty and use <strong>Label</strong> instead.
            </>
          ) : family.key === 'standard_image' ? (
            <>One row per price point. Use <strong>Model</strong> for tiered image pricing (e.g. Standard vs Premium).</>
          ) : (
            <>One row per price point.</>
          )}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-3">
          {variants.map((v, index) => (
            <div
              key={v.id ?? `new-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex != null) moveVariant(dragIndex, index);
                setDragIndex(null);
              }}
              className={`rounded-lg border p-3 transition-colors dark:border-slate-700 ${
                dragIndex === index
                  ? 'border-pink-400 bg-pink-50/40 dark:bg-pink-950/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label="Drag to reorder"
                    className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Icon name="drag_indicator" className="!text-[18px]" />
                  </button>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Variant {index + 1}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    aria-label="Move variant up"
                    disabled={index === 0}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800"
                    onClick={() => moveVariant(index, index - 1)}
                  >
                    <Icon name="keyboard_arrow_up" className="!text-[18px]" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move variant down"
                    disabled={index === variants.length - 1}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800"
                    onClick={() => moveVariant(index, index + 1)}
                  >
                    <Icon name="keyboard_arrow_down" className="!text-[18px]" />
                  </button>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="ml-1 text-xs text-red-600"
                      onClick={() => removeVariant(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label={`Cost in ${creditLabel}`}>
                  <TextInput
                    inputMode="decimal"
                    value={v.creditCost}
                    onChange={(e) => patchVariant(index, { creditCost: e.target.value.replace(/[^\d.]/g, '') })}
                    placeholder="e.g. 30"
                  />
                </Field>
                <Field label="Unit">
                  <Select value={v.unit} onChange={(e) => patchVariant(index, { unit: e.target.value })}>
                    {family.unitOptions.map((u) => (
                      <option key={u} value={u}>
                        {UNIT_LABELS[u] ?? u}
                      </option>
                    ))}
                  </Select>
                </Field>
                {showVariantFields && (
                  <>
                    <Field label="Model" hint="App-specific model name — e.g. Lite, Pro, Turbo">
                      <TextInput
                        value={v.model}
                        onChange={(e) => patchVariant(index, { model: e.target.value })}
                        placeholder="Lite"
                      />
                    </Field>
                    {showDurationField && (
                      <Field label="Duration (seconds)" hint="Clip length when shown (5, 10, …)">
                        <TextInput
                          inputMode="numeric"
                          value={v.durationProduced}
                          onChange={(e) =>
                            patchVariant(index, { durationProduced: e.target.value.replace(/[^\d.]/g, '') })
                          }
                          placeholder="5"
                        />
                      </Field>
                    )}
                    <Field
                      label="Label"
                      hint={
                        family.key === 'video_generation'
                          ? 'For separate modalities without a model tier — e.g. "Video with audio"'
                          : 'Optional label for this image tier'
                      }
                    >
                      <TextInput
                        value={v.customLabel}
                        onChange={(e) => patchVariant(index, { customLabel: e.target.value })}
                        placeholder="Video with audio"
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" className="text-xs" onClick={addVariant}>
          + Add variant
        </Button>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save variants'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
