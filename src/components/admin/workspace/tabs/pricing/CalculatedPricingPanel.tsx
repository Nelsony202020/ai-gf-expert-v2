import { useEffect, useMemo, useState } from 'react';
import { dataApi, type EntityRow } from '../../../api';
import { buildPricingCalculatedSummary } from '../../../../../lib/pricing/calculatedSummary';
import { Button } from '../../../ui';
import { PricingSection } from './PricingSection';

export function CalculatedPricingPanel({
  tiers,
  packages,
  featureCosts,
  usageScenarios,
  productType,
  currency,
  derivedMinMonthly,
  cachedMin,
  cacheOutOfSync,
  canEdit,
  onSyncListPrice,
}: {
  tiers: EntityRow[];
  packages: EntityRow[];
  featureCosts: EntityRow[];
  usageScenarios: unknown;
  productType?: import('../../../../../lib/pricing/productType').ProductType;
  currency: string;
  derivedMinMonthly: number | null;
  cachedMin: number | null;
  cacheOutOfSync: boolean;
  canEdit: boolean;
  onSyncListPrice: () => void;
}) {
  const [typicalMonthlyPrice, setTypicalMonthlyPrice] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    dataApi
      .list('products')
      .then((res: { rows: EntityRow[] }) => {
        const prices = res.rows
          .map((p: EntityRow) => (p.minMonthlyPrice != null ? Number(p.minMonthlyPrice) : null))
          .filter((n: number | null): n is number => n != null && Number.isFinite(n) && n > 0);
        if (cancelled || prices.length === 0) return;
        const sorted = [...prices].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const raw =
          sorted.length % 2 === 0
            ? (sorted[mid - 1]! + sorted[mid]!) / 2
            : sorted[mid]!;
        setTypicalMonthlyPrice(Math.round(raw * 100) / 100);
      })
      .catch(() => {
        if (!cancelled) setTypicalMonthlyPrice(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(
    () =>
      buildPricingCalculatedSummary({
        tiers: tiers as any,
        packages: packages as any,
        featureCosts: featureCosts as any,
        usageScenarios,
        productType,
        currency,
        typicalMonthlyPrice,
      }),
    [tiers, packages, featureCosts, usageScenarios, productType, currency, typicalMonthlyPrice],
  );

  return (
    <PricingSection
      title="4. Calculated results"
      badge="CALCULATED"
      description="Derived from Pricing data — never edit these numbers by hand."
      actions={
        cacheOutOfSync && canEdit ? (
          <Button variant="secondary" className="text-xs" onClick={onSyncListPrice}>
            Sync list price ({derivedMinMonthly?.toFixed(2)})
          </Button>
        ) : undefined
      }
    >
      {cacheOutOfSync && (
        <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
          Public listings use {cachedMin !== null ? cachedMin.toFixed(2) : 'no price yet'} — derived
          minimum is {derivedMinMonthly?.toFixed(2)}.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {summary.rows.map((row) => (
          <div
            key={row.key}
            className="rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
            title={row.tip}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {row.label}
              </span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.value}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{row.tip}</p>
          </div>
        ))}
      </div>
    </PricingSection>
  );
}
