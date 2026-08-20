import { useEffect, useMemo, useState } from 'react';
import { dataApi, type EntityRow } from '../../api';
import { useAsyncToast } from '../../Toast';
import { Button } from '../../ui';
import { useWorkspace } from '../context';
import {
  summarizeFeatureBilling,
  tierLikeFromRecord,
  type FeatureBillingSummaryRow,
} from '../../../../lib/pricing/featureBilling';
import {
  costsInFamily,
  FEATURE_COST_FAMILIES,
  type FeatureCostFamilyDef,
} from '../../../../lib/pricing/featureCostGroups';
import { SimpleFeatureCostsEditor } from './SimpleFeatureCosts';

export function FeatureBillingPanel({
  tiers,
  costs,
  snapshotId,
  creditLabel,
  canEdit,
  productId,
  onSaved,
  embedded = false,
}: {
  tiers: EntityRow[];
  costs: EntityRow[];
  snapshotId: string;
  creditLabel: string;
  canEdit: boolean;
  productId: string;
  onSaved?: () => void;
  embedded?: boolean;
}) {
  const ws = useWorkspace();
  const { setError } = useAsyncToast();
  const [editingFamily, setEditingFamily] = useState<FeatureCostFamilyDef | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  const summary = useMemo(
    () =>
      summarizeFeatureBilling(
        tiers.map((t) => tierLikeFromRecord(t)),
        costs as any,
        creditLabel,
      ),
    [tiers, costs, creditLabel],
  );

  const missingFamilies = useMemo(
    () =>
      FEATURE_COST_FAMILIES.filter((family) => costsInFamily(costs, family).length === 0).map(
        (family, sortOrder) => ({ family, sortOrder }),
      ),
    [costs],
  );

  useEffect(() => {
    if (!canEdit || bootstrapping || missingFamilies.length === 0) return;

    let cancelled = false;
    setBootstrapping(true);
    void (async () => {
      try {
        await Promise.all(
          missingFamilies.map(({ family, sortOrder }) =>
            dataApi.create(
              'featureCosts',
              {
                featureType: family.defaultFeatureType,
                unit: family.defaultUnit,
                active: true,
                sortOrder,
              },
              { product: productId, snapshot: snapshotId },
            ),
          ),
        );
        if (!cancelled) {
          onSaved?.();
          await ws.refreshRelated();
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canEdit, bootstrapping, missingFamilies, productId, snapshotId, ws, setError, onSaved]);

  const table = (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
          <th className="px-4 py-2">Feature</th>
          <th className="px-2 py-2">How it&apos;s charged</th>
          <th className="px-2 py-2">Included</th>
          <th className="px-2 py-2">Extra usage</th>
          <th className="px-2 py-2" />
        </tr>
      </thead>
      <tbody>
        {summary.map((row) => (
          <FeatureBillingRow
            key={row.key}
            row={row}
            canEdit={canEdit}
            loading={bootstrapping}
            onEdit={() => setEditingFamily(row.family)}
          />
        ))}
      </tbody>
    </table>
  );

  const body = (
    <>
      {table}
      <p className="border-t border-slate-100 px-4 py-2 text-[11px] leading-relaxed text-slate-400 dark:border-slate-800">
        Plan allowances are edited per subscription tier. Extra usage costs apply when a feature uses
        shared credits or pay-per-use billing.
      </p>
      {editingFamily && (
        <SimpleFeatureCostsEditor
          family={editingFamily}
          costs={costs}
          snapshotId={snapshotId}
          creditLabel={creditLabel}
          productId={productId}
          onClose={() => setEditingFamily(null)}
          onSaved={() => {
            setEditingFamily(null);
            onSaved?.();
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
            Feature billing
          </h4>
        </div>
        {body}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Feature billing</h3>
        <p className="text-xs text-slate-400">
          What each plan includes vs how extra usage is charged in {creditLabel}.
        </p>
      </div>
      {body}
    </section>
  );
}

function FeatureBillingRow({
  row,
  canEdit,
  loading,
  onEdit,
}: {
  row: FeatureBillingSummaryRow;
  canEdit: boolean;
  loading: boolean;
  onEdit: () => void;
}) {
  return (
    <tr className="border-b border-slate-50 dark:border-slate-800/60">
      <td className="px-4 py-2">
        <div className="font-medium text-slate-800 dark:text-slate-200">{row.label}</div>
        {row.variesByPlan && (
          <p className="mt-0.5 text-[11px] text-slate-400">Allowances differ by plan</p>
        )}
      </td>
      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
        {loading ? '…' : row.howCharged}
      </td>
      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
        {loading ? '…' : row.included}
      </td>
      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
        {loading ? '…' : row.extraUsage}
      </td>
      <td className="px-2 py-2 text-right">
        {canEdit && !loading && (
          <Button variant="ghost" className="text-xs" onClick={onEdit}>
            Edit
          </Button>
        )}
      </td>
    </tr>
  );
}
