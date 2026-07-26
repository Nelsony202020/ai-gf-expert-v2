// Capabilities tab — feature toggles used for filters, comparisons, and scoring.

import { PRODUCT_CAPABILITIES, countEnabledCapabilities } from './productCapabilities';
import { ProductSetupStatusBar } from './ProductSetupStatusBar';
import { ProductSummarySidebar } from './ProductSummarySidebar';
import type { computeProductSetupProgress } from './productSetupProgress';
import { Button, Icon, Toggle } from './ui';

interface ProductCapabilitiesTabProps {
  fields: Record<string, any>;
  set: (name: string, value: unknown) => void;
  setMany: (updates: Record<string, boolean>) => void;
  isNew: boolean;
  productId?: string;
  showPreview: boolean;
  previewUrl?: string;
  setupProgress: ReturnType<typeof computeProductSetupProgress>;
}

export function ProductCapabilitiesTab({
  fields,
  set,
  setMany,
  isNew,
  productId,
  showPreview,
  previewUrl,
  setupProgress,
}: ProductCapabilitiesTabProps) {
  const { enabled, total, pct } = countEnabledCapabilities(fields);

  function selectAll() {
    const updates: Record<string, boolean> = {};
    for (const cap of PRODUCT_CAPABILITIES) updates[cap.name] = true;
    setMany(updates);
  }

  function clearAll() {
    const updates: Record<string, boolean> = {};
    for (const cap of PRODUCT_CAPABILITIES) updates[cap.name] = false;
    setMany(updates);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        <ProductSetupStatusBar
          status={String(fields.status ?? 'draft')}
          progressPct={setupProgress.pct}
          missingCount={setupProgress.statusMissingCount}
          missingKind={setupProgress.statusMissingKind}
          showPreview={showPreview}
          previewUrl={previewUrl}
        />

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
              <Icon name="info" className="mt-0.5 shrink-0 !text-[18px] text-blue-600 dark:text-blue-400" />
              <p>
                Capabilities help power your review. Toggle only the capabilities the product truly
                offers. These drive directory filters, comparisons, and scoring.
              </p>
            </div>
            <div className="shrink-0 text-right text-sm">
              <p className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {enabled} of {total} enabled
              </p>
              <p className="text-xs text-slate-500">{pct}% of capabilities selected</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Product capabilities</h3>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                These features are used for filtering, comparisons, and scoring.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="secondary" className="text-xs" onClick={selectAll}>
                Select all
              </Button>
              <Button type="button" variant="ghost" className="text-xs" onClick={clearAll}>
                Clear all
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_CAPABILITIES.map((cap) => (
              <CapabilityRow
                key={cap.name}
                icon={cap.icon}
                label={cap.label}
                checked={fields[cap.name] === true}
                onChange={(v) => set(cap.name, v)}
              />
            ))}
          </div>
        </div>
      </div>

      <ProductSummarySidebar
        fields={fields}
        isNew={isNew}
        productId={productId}
        showPreview={showPreview}
        previewUrl={previewUrl}
      />
    </div>
  );
}

function CapabilityRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 px-2.5 py-2 dark:border-slate-800">
      <Toggle checked={checked} onChange={onChange} aria-label={label} />
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
        <Icon name={icon} className="!text-[18px] text-slate-600 dark:text-slate-400" />
      </span>
      <span className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-200">{label}</span>
    </div>
  );
}
