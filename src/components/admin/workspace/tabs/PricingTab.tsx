// Pricing tab: guided pricing workspace. Editors enter raw facts (prices,
// credits); everything derived (monthly equivalents, discounts, rates) is
// calculated by src/lib/pricing/calc.ts. Pricing is versioned through
// pricingSnapshots; plan tiers hold monthly + annual as nested billing
// options with a legacy-field fallback for pre-tier records.

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../../api';
import { useCan, useMe } from '../../context';
import { MediaPickerModal } from '../../MediaPicker';
import {
  bestValuePackage,
  intervalDiscount,
  intervalSaving,
  lowestMonthlyPrice,
  monthlyEquivalent,
  packageTotalCredits,
  pricePer100Credits,
  fmtMoney,
  tierBillingOptions,
  type BillingInterval,
  type BillingOption,
} from '../../../../lib/pricing/calc';
import {
  DEFAULT_TOKEN_EXPIRATION_PERIOD,
  withDefaultTokenExpiration,
  type CreditCurrencyLike,
} from '../../../../lib/pricing/credit-currency';
import { useAsyncToast, useToastError } from '../../Toast';
import {
  Badge,
  Button,
  Field,
  Icon,
  Modal,
  TextInput,
  Toggle,
  fmtDate,
} from '../../ui';
import { useWorkspace } from '../context';
import { CompletionSidebar } from '../CompletionSidebar';
import { SimpleFeatureCosts } from './SimpleFeatureCosts';
import { PricingImportCard } from '../../ai-pricing/PricingImportCard';
import { PricingReviewModal, type PricingDraftClient } from '../../ai-pricing/PricingReviewModal';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const PRICING_MODEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'subscription_only', label: 'Subscription' },
  { value: 'subscription_credits', label: 'Subscription + tokens' },
  { value: 'free_plus_credits', label: 'Free' },
];

export const FEATURE_TYPE_LABELS: Record<string, string> = {
  standard_image: 'Standard image',
  premium_image: 'Premium image',
  hd_image: 'HD image',
  image_regeneration: 'Image regeneration',
  image_unlock: 'Image unlock',
  in_chat_image: 'In-chat image',
  standard_video: 'Standard video',
  premium_video: 'Premium video',
  text_to_video: 'Text-to-video',
  image_to_video: 'Image-to-video',
  live_cam_video: 'Live-cam video',
  voice_message: 'Voice message',
  voice_call: 'Voice call',
  premium_message: 'Premium message',
  character_creation: 'Character creation',
  character_edit: 'Character edit',
  content_unlock: 'Content unlock',
  scenario_unlock: 'Scenario unlock',
  custom: 'Custom feature',
};

interface CreditCurrencyConfig extends CreditCurrencyLike {}

function creditPlural(currency: CreditCurrencyConfig | undefined): string {
  return currency?.plural?.trim() || currency?.displayName?.trim() || 'credits';
}

function toDateInput(ms?: number | null): string {
  if (!ms) return '';
  return new Date(Number(ms)).toISOString().slice(0, 10);
}

function fromDateInput(v: string): number | undefined {
  if (!v) return undefined;
  const ms = new Date(`${v}T00:00:00`).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

function numOrUndef(v: string): number | undefined {
  return v === '' ? undefined : Number(v);
}

/**
 * Mirror the primary billing option into the legacy flat fields so existing
 * readers (public store cheapest-monthly, dashboards) keep working during
 * migration. Prefers monthly, then yearly, then any legacy-safe interval.
 */
function legacyMirror(options: BillingOption[]): {
  billingInterval: string;
  price: number;
  currency: string;
} | null {
  const active = options.filter((o) => o.active !== false);
  const pool = active.length > 0 ? active : options;
  if (pool.length === 0) return null;
  const legacySafe = new Set(['weekly', 'monthly', 'quarterly', 'yearly', 'lifetime']);
  const pick =
    pool.find((o) => o.interval === 'monthly') ??
    pool.find((o) => o.interval === 'yearly') ??
    pool.find((o) => legacySafe.has(o.interval));
  if (pick) return { billingInterval: pick.interval, price: pick.price, currency: pick.currency };
  // six_months / custom only: expose a monthly-equivalent so lists stay sane
  const first = pool[0];
  const eq = monthlyEquivalent(first);
  return { billingInterval: 'monthly', price: eq ?? first.price, currency: first.currency };
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function PricingTab() {
  const ws = useWorkspace();
  const can = useCan();
  const canEdit = can('content.edit');
  const { fields, set, related } = ws;
  const [editingPackage, setEditingPackage] = useState<EntityRow | 'new' | null>(null);
  const [editingPayments, setEditingPayments] = useState(false);
  const [aiDraft, setAiDraft] = useState<PricingDraftClient | null>(null);
  const { error, setError } = useAsyncToast();

  const snapshots = related.pricingSnapshots;
  const snapshot =
    snapshots.find((s) => s.status === 'active') ??
    snapshots.find((s) => s.status === 'draft') ??
    snapshots.find((s) => s.status === 'pending_review') ??
    snapshots[0] ??
    null;
  const currency = withDefaultTokenExpiration((snapshot?.creditCurrency ?? {}) as CreditCurrencyConfig);
  const model = String(snapshot?.pricingModel ?? '');

  const tiers = useMemo(
    () => [...related.plans].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    [related.plans],
  );
  const packages = useMemo(
    () => [...related.packages].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    [related.packages],
  );
  const featureCosts = useMemo(
    () => [...related.featureCosts].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    [related.featureCosts],
  );
  const profile = related.paymentProfile;

  const activeTiers = tiers.filter((t) => t.active);
  const derivedMinMonthly = lowestMonthlyPrice(activeTiers as any);
  const cachedMin = fields.minMonthlyPrice != null ? Number(fields.minMonthlyPrice) : null;
  const cacheOutOfSync = derivedMinMonthly !== null && cachedMin !== derivedMinMonthly;

  const showPlans = model === 'subscription_only' || model === 'subscription_credits' || tiers.length > 0;
  const usesCredits = model === 'subscription_credits' || model === 'free_plus_credits';
  const showIncludedCredits = model === 'subscription_credits';

  async function patchSnapshot(patch: Record<string, unknown>) {
    if (!snapshot) return;
    try {
      await dataApi.update('pricingSnapshots', snapshot.id, patch);
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-4">
        {/* 1. Pricing status / snapshot header */}
        {snapshot ? (
          <PricingHeader snapshot={snapshot} canEdit={canEdit} onPatch={patchSnapshot} />
        ) : (
          <SnapshotSetupCard canEdit={canEdit} />
        )}

        {snapshot && (
          <>
            {canEdit && <PricingImportCard productId={ws.productId} onDraft={setAiDraft} />}

            {/* Compact pricing-model selector */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  How does this app charge users?
                </span>
                <div
                  role="radiogroup"
                  aria-label="Pricing model"
                  className="flex flex-wrap gap-1.5"
                >
                  {PRICING_MODEL_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        model === opt.value
                          ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                      } ${!canEdit ? 'pointer-events-none opacity-70' : ''}`}
                    >
                      <input
                        type="radio"
                        name="pricingModel"
                        className="sr-only"
                        checked={model === opt.value}
                        onChange={() => void patchSnapshot({ pricingModel: opt.value })}
                        disabled={!canEdit}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {showPlans && (
              <TierTable
                tiers={tiers}
                snapshotId={snapshot.id}
                creditLabel={creditPlural(currency)}
                defaultCurrency={String(fields.priceCurrency ?? 'USD')}
                showIncludedCredits={showIncludedCredits}
                canEdit={canEdit}
              />
            )}

            {usesCredits && (
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tokens</h3>
                    <TokenNameInline
                      currency={currency}
                      canEdit={canEdit}
                      onSave={(c) => void patchSnapshot({ creditCurrency: withDefaultTokenExpiration(c) })}
                    />
                  </div>
                  {canEdit && (
                    <Button variant="secondary" className="text-xs" onClick={() => setEditingPackage('new')}>
                      <Icon name="add" className="!text-[14px]" /> Add package
                    </Button>
                  )}
                </div>
                {packages.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">
                    No {creditPlural(currency)} packages recorded yet.
                  </p>
                ) : (
                  <PackageTable
                    packages={packages}
                    creditLabel={creditPlural(currency)}
                    canEdit={canEdit}
                    onEdit={setEditingPackage}
                  />
                )}
                <div className="border-t border-slate-100 dark:border-slate-800">
                  <SimpleFeatureCosts
                    costs={featureCosts}
                    snapshotId={snapshot.id}
                    creditLabel={creditPlural(currency)}
                    canEdit={canEdit}
                    embedded
                  />
                </div>
                <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800">
                  All tokens expire after {DEFAULT_TOKEN_EXPIRATION_PERIOD}.
                </p>
              </section>
            )}

            {related.pricingPromotions.length > 0 && (
              <PromotionsList promotions={related.pricingPromotions} canEdit={canEdit} />
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick summary</h3>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <Stat
                  label="Lowest monthly price"
                  value={fmtMoney(derivedMinMonthly, fields.priceCurrency ?? 'USD')}
                />
                {cacheOutOfSync && canEdit && (
                  <Button variant="secondary" className="text-xs" onClick={() => set('minMonthlyPrice', derivedMinMonthly ?? undefined)}>
                    Sync list price ({derivedMinMonthly?.toFixed(2)})
                  </Button>
                )}
              </div>
              {cacheOutOfSync && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Public listings use {cachedMin !== null ? cachedMin.toFixed(2) : 'no price yet'} — derived minimum is{' '}
                  {derivedMinMonthly?.toFixed(2)}.
                </p>
              )}
            </section>
          </>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Payment and billing</h3>
            {canEdit && (
              <Button variant="secondary" className="text-xs" onClick={() => setEditingPayments(true)}>
                <Icon name="credit_card" className="!text-[14px]" /> {profile ? 'Edit' : 'Add payment methods'}
              </Button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {profile ? (
              <>
                {[
                  { label: 'Card', on: Boolean(profile.creditCard || profile.debitCard) },
                  { label: 'PayPal', on: Boolean(profile.paypal) },
                  { label: 'Crypto', on: Boolean(profile.crypto) },
                  { label: 'Apple Pay', on: Boolean(profile.applePay) },
                  { label: 'Google Pay', on: Boolean(profile.googlePay) },
                  { label: 'Bank transfer', on: Boolean(profile.bankTransfer) },
                ].map((b) => (
                  <Badge key={b.label} tone={b.on ? 'green' : 'gray'}>
                    {b.label}
                  </Badge>
                ))}
                {profile.cryptoOnly && <Badge tone="amber">crypto ONLY</Badge>}
                {profile.discreetBilling && <Badge tone="blue">discreet billing</Badge>}
                {profile.lastVerifiedAt ? (
                  <span className="text-xs text-slate-400">verified {fmtDate(profile.lastVerifiedAt)}</span>
                ) : (
                  <span className="text-xs text-amber-600">never verified</span>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-400">No payment profile recorded yet.</span>
            )}
          </div>
          {profile?.cryptoOnly && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              This product only accepts cryptocurrency — shown as a warning on public pages.
            </p>
          )}
          {profile && (
            <PricingEvidence entity="paymentProfiles" row={profile} canEdit={canEdit} altText="Payment methods evidence" />
          )}
        </section>
      </div>

      <CompletionSidebar />

      {editingPackage && (
        <PackageModal
          pkg={editingPackage === 'new' ? null : editingPackage}
          onClose={() => setEditingPackage(null)}
          onSaved={() => {
            setEditingPackage(null);
            void ws.refreshRelated();
          }}
        />
      )}
      {editingPayments && (
        <PaymentProfileModal
          profile={profile}
          onClose={() => setEditingPayments(false)}
          onSaved={() => {
            setEditingPayments(false);
            void ws.refreshRelated();
          }}
        />
      )}
      {aiDraft && snapshot && (
        <PricingReviewModal
          draft={aiDraft}
          productId={ws.productId}
          snapshot={snapshot}
          existingPlans={tiers}
          existingPackages={packages}
          existingFeatureCosts={featureCosts}
          existingPromotions={related.pricingPromotions}
          defaultCurrency={String(fields.priceCurrency ?? 'USD')}
          onClose={() => setAiDraft(null)}
          onApplied={() => {
            setAiDraft(null);
            void ws.refreshRelated();
          }}
        />
      )}
    </div>
  );
}

const PROMOTION_TYPE_LABELS: Record<string, string> = {
  plan_discount: 'Plan discount',
  package_discount: 'Package discount',
  bonus_credits: 'Bonus credits',
  free_trial: 'Free trial',
  holiday: 'Holiday deal',
  coupon: 'Coupon',
  custom: 'Custom',
};

function PromotionsList({ promotions, canEdit }: { promotions: EntityRow[]; canEdit: boolean }) {
  const ws = useWorkspace();
  const { error, setError } = useAsyncToast();

  async function remove(row: EntityRow) {
    if (!confirm(`Delete promotion "${row.name}"?`)) return;
    try {
      await dataApi.remove('pricingPromotions', row.id);
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Promotions</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {promotions.map((promo) => (
          <div key={promo.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-200">{String(promo.name ?? '')}</span>
            <Badge tone="blue">{PROMOTION_TYPE_LABELS[String(promo.promotionType ?? '')] ?? String(promo.promotionType ?? '')}</Badge>
            {promo.discountPercent != null && <Badge tone="green">-{Number(promo.discountPercent)}%</Badge>}
            {promo.bonusCredits != null && <Badge tone="green">+{Number(promo.bonusCredits)} bonus</Badge>}
            {promo.couponCode ? (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {String(promo.couponCode)}
              </code>
            ) : null}
            <span className="text-xs text-slate-400">
              {promo.startAt ? fmtDate(promo.startAt) : ''}
              {promo.startAt && promo.endAt ? ' – ' : ''}
              {promo.endAt ? fmtDate(promo.endAt) : ''}
            </span>
            <span className="flex-1" />
            {canEdit && (
              <button
                type="button"
                className="text-slate-300 transition-colors hover:text-red-500"
                title="Delete promotion"
                onClick={() => void remove(promo)}
              >
                <Icon name="delete" className="!text-[16px]" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {  return (
    <div>
      <p className="text-xs text-slate-400" title={hint}>
        {label}
        {hint && <Icon name="info" className="ml-0.5 align-text-bottom !text-[12px] text-slate-300" />}
      </p>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Snapshot header & setup
// ---------------------------------------------------------------------------

function SnapshotSetupCard({ canEdit }: { canEdit: boolean }) {
  const ws = useWorkspace();
  const me = useMe();
  const { busy, error, run } = useAsyncToast();

  async function createSnapshot() {
    await run(async () => {
      const created = await dataApi.create(
        'pricingSnapshots',
        { status: 'active', pricingModel: 'subscription_credits' },
        { product: ws.productId },
      );
      await Promise.all([
        ...ws.related.plans.map((p) => dataApi.update('subscriptionPlans', p.id, {}, { snapshot: created.id })),
        ...ws.related.packages.map((p) => dataApi.update('creditPackages', p.id, {}, { snapshot: created.id })),
        ...ws.related.featureCosts.map((p) => dataApi.update('featureCosts', p.id, {}, { snapshot: created.id })),
      ]);
      await ws.refreshRelated();
      return true;
    });
  }

  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <Icon name="request_quote" className="!text-[32px] text-slate-300" />
      <h3 className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Set up pricing</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Enter plan prices, token costs, and top-up packages manually.
        {ws.related.plans.length > 0 ? ' Existing plans will be linked automatically.' : ''}
      </p>
      {canEdit && (
        <Button className="mt-4" disabled={busy} onClick={() => void createSnapshot()}>
          {busy ? 'Starting…' : 'Start pricing'}
        </Button>
      )}
      {!canEdit && <p className="mt-2 text-xs text-slate-400">Requires content.edit ({me.role}).</p>}
    </section>
  );
}

function PricingHeader({
  snapshot,
  canEdit,
  onPatch,
}: {
  snapshot: EntityRow;
  canEdit: boolean;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const me = useMe();
  const daysSinceVerified = snapshot.verifiedAt
    ? Math.floor((Date.now() - Number(snapshot.verifiedAt)) / 86_400_000)
    : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pricing</h3>
        {daysSinceVerified === null ? (
          <Badge tone="amber">never verified</Badge>
        ) : daysSinceVerified > 45 ? (
          <Badge tone="red">verification overdue ({daysSinceVerified}d)</Badge>
        ) : daysSinceVerified > 30 ? (
          <Badge tone="amber">verification due ({daysSinceVerified}d)</Badge>
        ) : (
          <Badge tone="green">verified {fmtDate(snapshot.verifiedAt)}</Badge>
        )}
        <span className="flex-1" />
        {canEdit && (
          <Button
            variant="secondary"
            className="text-xs"
            onClick={() => onPatch({ verifiedAt: Date.now(), verifiedBy: me.email })}
          >
            <Icon name="verified" className="!text-[14px]" /> Mark verified today
          </Button>
        )}
      </div>
      <div className="mt-3">
        <PricingEvidence entity="pricingSnapshots" row={snapshot} canEdit={canEdit} altText="Pricing page screenshot" compact />
      </div>
      {snapshot.verifiedBy && (
        <p className="mt-2 text-xs text-slate-400">
          Last verified by {snapshot.verifiedBy}
          {snapshot.verifiedAt ? ` on ${fmtDate(snapshot.verifiedAt)}` : ''}.
        </p>
      )}
    </section>
  );
}

function TokenNameInline({
  currency,
  canEdit,
  onSave,
}: {
  currency: CreditCurrencyConfig;
  canEdit: boolean;
  onSave: (c: CreditCurrencyConfig) => void;
}) {
  const [name, setName] = useState(() => currency.displayName ?? '');
  useEffect(() => {
    setName(currency.displayName ?? '');
  }, [currency.displayName]);

  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-400">
      Token name
      <TextInput
        value={name}
        disabled={!canEdit}
        className="!w-auto max-w-[200px] !py-1 text-xs"
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim();
          if (trimmed === (currency.displayName ?? '')) return;
          onSave(
            withDefaultTokenExpiration({
              ...currency,
              displayName: trimmed || undefined,
              plural: trimmed || undefined,
            }),
          );
        }}
        placeholder="tokens"
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Plan tiers: inline table with nested billing options
// ---------------------------------------------------------------------------

function TierTable({
  tiers,
  snapshotId,
  creditLabel,
  defaultCurrency,
  showIncludedCredits,
  canEdit,
}: {
  tiers: EntityRow[];
  snapshotId: string;
  creditLabel: string;
  defaultCurrency: string;
  showIncludedCredits: boolean;
  canEdit: boolean;
}) {
  const ws = useWorkspace();
  const [adding, setAdding] = useState(false);
  const { error, setError } = useAsyncToast();

  async function move(row: EntityRow, dir: -1 | 1) {
    const idx = tiers.findIndex((t) => t.id === row.id);
    const other = tiers[idx + dir];
    if (!other) return;
    try {
      await Promise.all(
        tiers.map((t, i) => {
          let order = i;
          if (t.id === row.id) order = idx + dir;
          else if (t.id === other.id) order = idx;
          return dataApi.update('subscriptionPlans', t.id, { sortOrder: order });
        }),
      );
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function duplicate(row: EntityRow) {
    try {
      const { id: _id, product: _p, snapshot: _s, ...rest } = row;
      await dataApi.create(
        'subscriptionPlans',
        {
          ...rest,
          name: `${row.name} copy`,
          sortOrder: tiers.length,
          lastVerifiedAt: undefined,
          evidenceMediaIds: undefined,
        },
        { product: ws.productId, snapshot: snapshotId },
      );
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(row: EntityRow) {
    if (!confirm(`Delete tier "${row.name}"? This removes all its billing options.`)) return;
    try {
      await dataApi.remove('subscriptionPlans', row.id);
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Subscription plans</h3>
          <p className="text-xs text-slate-400">Name, monthly price, and annual price for each tier.</p>
        </div>
        {canEdit && !adding && (
          <Button variant="secondary" className="text-xs" onClick={() => setAdding(true)}>
            <Icon name="add" className="!text-[14px]" /> Add tier
          </Button>
        )}
      </div>
      {tiers.length === 0 && !adding ? (
        <p className="px-4 py-4 text-sm text-slate-400">
          No plan tiers yet. Add Basic, Premium… with their monthly and annual prices.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tiers.map((tier, idx) => (
            <TierRow
              key={`${tier.id}:${tier.updatedAt ?? ''}`}
              tier={tier}
              index={idx}
              count={tiers.length}
              snapshotId={snapshotId}
              creditLabel={creditLabel}
              defaultCurrency={defaultCurrency}
              showIncludedCredits={showIncludedCredits}
              canEdit={canEdit}
              onMove={(dir) => void move(tier, dir)}
              onDuplicate={() => void duplicate(tier)}
              onRemove={() => void remove(tier)}
            />
          ))}
        </div>
      )}
      {adding && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <TierRow
            tier={null}
            index={tiers.length}
            count={tiers.length + 1}
            snapshotId={snapshotId}
            creditLabel={creditLabel}
            defaultCurrency={defaultCurrency}
            showIncludedCredits={showIncludedCredits}
            canEdit={canEdit}
            onCancelNew={() => setAdding(false)}
            onSavedNew={() => setAdding(false)}
          />
        </div>
      )}
    </section>
  );
}

interface OptionDraft {
  interval: BillingInterval;
  price: string;
  introPrice: string;
  freeTrial: boolean;
  trialLength: string;
  active: boolean;
}

function optionsToDrafts(options: BillingOption[]): OptionDraft[] {
  return options.map((o) => ({
    interval: o.interval,
    price: String(o.price ?? ''),
    introPrice: o.introPrice != null ? String(o.introPrice) : '',
    freeTrial: Boolean(o.freeTrial),
    trialLength: o.trialLength ?? '',
    active: o.active !== false,
  }));
}

function TierRow({
  tier,
  index,
  count,
  snapshotId,
  creditLabel,
  defaultCurrency,
  showIncludedCredits,
  canEdit,
  onMove,
  onDuplicate,
  onRemove,
  onCancelNew,
  onSavedNew,
}: {
  tier: EntityRow | null;
  index: number;
  count: number;
  snapshotId: string;
  creditLabel: string;
  defaultCurrency: string;
  showIncludedCredits: boolean;
  canEdit: boolean;
  onMove?: (dir: -1 | 1) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  onCancelNew?: () => void;
  onSavedNew?: () => void;
}) {
  const ws = useWorkspace();
  const existingOptions = tier ? tierBillingOptions(tier as any) : [];
  const usesLegacyFallback =
    tier != null && (!Array.isArray(tier.billingOptions) || tier.billingOptions.length === 0) && existingOptions.length > 0;

  const [name, setName] = useState(String(tier?.name ?? ''));
  const [currency, setCurrency] = useState(String(existingOptions[0]?.currency ?? tier?.currency ?? defaultCurrency));
  const [options, setOptions] = useState<OptionDraft[]>(
    optionsToDrafts(existingOptions).length > 0
      ? optionsToDrafts(existingOptions)
      : [{ interval: 'monthly', price: '', introPrice: '', freeTrial: false, trialLength: '', active: true }],
  );
  const [includedCredits, setIncludedCredits] = useState(
    tier?.includedTokens != null ? String(tier.includedTokens) : '',
  );
  const [active, setActive] = useState(tier ? Boolean(tier.active) : true);
  const [dirty, setDirty] = useState(tier === null);
  const { busy, error, run } = useAsyncToast();

  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  function setOption(i: number, patch: Partial<OptionDraft>) {
    setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)));
    setDirty(true);
  }

  function optionFor(interval: BillingInterval): { idx: number; draft: OptionDraft | null } {
    const idx = options.findIndex((o) => o.interval === interval);
    return { idx, draft: idx >= 0 ? options[idx] : null };
  }

  /** Main-table quick edit for the monthly / annual price cells. */
  function setIntervalPrice(interval: BillingInterval, raw: string) {
    const clean = raw.replace(/[^\d.]/g, '');
    const { idx } = optionFor(interval);
    if (idx >= 0) {
      if (clean === '') {
        setOptions((prev) => prev.filter((_, j) => j !== idx));
      } else {
        setOption(idx, { price: clean });
        return;
      }
    } else if (clean !== '') {
      setOptions((prev) => [
        ...prev,
        { interval, price: clean, introPrice: '', freeTrial: false, trialLength: '', active: true },
      ]);
    }
    setDirty(true);
  }

  const monthlyDraft = optionFor('monthly').draft;
  const yearlyDraft = optionFor('yearly').draft;
  const monthlyPrice = monthlyDraft && monthlyDraft.price !== '' ? Number(monthlyDraft.price) : null;
  const yearlyPrice = yearlyDraft && yearlyDraft.price !== '' ? Number(yearlyDraft.price) : null;

  const yearlyOption: BillingOption | null =
    yearlyPrice !== null ? { interval: 'yearly', price: yearlyPrice, currency, active: true } : null;
  const yearlyEq = yearlyOption ? monthlyEquivalent(yearlyOption) : null;
  const discount = yearlyOption && monthlyPrice ? intervalDiscount(monthlyPrice, yearlyOption) : null;
  const saving = yearlyOption && monthlyPrice ? intervalSaving(monthlyPrice, yearlyOption) : null;

  async function save() {
    const parsed: BillingOption[] = options
      .filter((o) => o.price !== '')
      .map((o) => ({
        interval: o.interval,
        price: Number(o.price),
        currency: currency.toUpperCase() || 'USD',
        introPrice: o.introPrice !== '' ? Number(o.introPrice) : undefined,
        freeTrial: o.freeTrial || undefined,
        trialLength: o.trialLength || undefined,
        active: o.active,
      }));
    const mirror = legacyMirror(parsed);
    const fields: Record<string, unknown> = {
      name: name.trim(),
      billingOptions: parsed,
      // Legacy mirror keeps the public store + dashboards working pre-migration
      billingInterval: mirror?.billingInterval ?? 'monthly',
      price: mirror?.price ?? 0,
      currency: mirror?.currency ?? currency.toUpperCase() ?? 'USD',
      includedTokens: showIncludedCredits ? numOrUndef(includedCredits) : undefined,
      active,
      sortOrder: tier?.sortOrder ?? index,
    };
    const done = await run(async () => {
      if (tier) {
        await dataApi.update('subscriptionPlans', tier.id, fields, { snapshot: snapshotId });
      } else {
        await dataApi.create('subscriptionPlans', fields, { product: ws.productId, snapshot: snapshotId });
      }
      await ws.refreshRelated();
      return true;
    });
    if (done) {
      setDirty(false);
      onSavedNew?.();
    }
  }

  async function markVerified() {
    if (!tier) return;
    await dataApi.update('subscriptionPlans', tier.id, { lastVerifiedAt: Date.now() });
    await ws.refreshRelated();
  }

  const canSave = name.trim() !== '' && options.some((o) => o.price !== '');

  return (
    <div className={`px-4 py-3 ${active ? '' : 'opacity-60'}`}>
      <div className={`grid items-start gap-2 ${showIncludedCredits ? 'sm:grid-cols-[1.4fr_1fr_1.2fr_1fr_auto]' : 'sm:grid-cols-[1.4fr_1fr_1.2fr_auto]'}`}>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Tier</label>
          <TextInput
            value={name}
            disabled={!canEdit}
            onChange={(e) => touch(setName)(e.target.value)}
            placeholder="Basic"
          />
          {usesLegacyFallback && (
            <p className="mt-0.5 text-[11px] text-amber-600">
              Legacy single-price record — saving converts it to billing options.
            </p>
          )}
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Monthly</label>
          <TextInput
            inputMode="decimal"
            value={monthlyDraft?.price ?? ''}
            disabled={!canEdit}
            onChange={(e) => setIntervalPrice('monthly', e.target.value)}
            placeholder="12.99"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Annual</label>
          <TextInput
            inputMode="decimal"
            value={yearlyDraft?.price ?? ''}
            disabled={!canEdit}
            onChange={(e) => setIntervalPrice('yearly', e.target.value)}
            placeholder="79.99"
          />
          {yearlyEq !== null && (
            <p
              className="mt-0.5 text-[11px] text-slate-400"
              title="Monthly equivalent = annual price ÷ 12. Discount = 1 − annual ÷ (monthly × 12)."
            >
              = {fmtMoney(yearlyEq, currency)}/mo
              {discount !== null && discount > 0 && (
                <span className="ml-1 text-green-600 dark:text-green-400">
                  −{discount}% ({fmtMoney(saving, currency)} saved)
                </span>
              )}
            </p>
          )}
        </div>
        {showIncludedCredits && (
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Included {creditLabel}
            </label>
            <TextInput
              type="number"
              value={includedCredits}
              disabled={!canEdit}
              onChange={(e) => touch(setIncludedCredits)(e.target.value)}
              placeholder="100"
            />
          </div>
        )}
        <div className="flex items-center gap-1 pt-5">
          <Toggle checked={active} onChange={touch(setActive)} aria-label="Tier active" disabled={!canEdit} />
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        {tier &&
          (tier.lastVerifiedAt ? (
            <span>verified {fmtDate(tier.lastVerifiedAt)}</span>
          ) : (
            <span className="text-amber-600">never verified</span>
          ))}
        {tier && canEdit && (
          <button type="button" className="text-pink-600 hover:underline" onClick={() => void markVerified()}>
            verify now
          </button>
        )}
        <span className="flex-1" />
        {canEdit && tier && (
          <>
            <button type="button" className="hover:text-slate-600" disabled={index === 0} onClick={() => onMove?.(-1)}>
              ↑ up
            </button>
            <button type="button" className="hover:text-slate-600" disabled={index === count - 1} onClick={() => onMove?.(1)}>
              ↓ down
            </button>
            <button type="button" className="hover:text-slate-600" onClick={onDuplicate}>
              duplicate
            </button>
            <button type="button" className="text-red-500 hover:text-red-700" onClick={onRemove}>
              delete
            </button>
          </>
        )}
        {canEdit && (dirty || tier === null) && (
          <>
            {tier === null && (
              <Button variant="ghost" className="!py-1 text-xs" onClick={onCancelNew}>
                Cancel
              </Button>
            )}
            <Button className="!py-1 text-xs" disabled={busy || !canSave} onClick={() => void save()}>
              {busy ? 'Saving…' : tier ? 'Save tier' : 'Create tier'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Credit packages table
// ---------------------------------------------------------------------------

function PackageTable({
  packages,
  creditLabel,
  canEdit,
  onEdit,
}: {
  packages: EntityRow[];
  creditLabel: string;
  canEdit: boolean;
  onEdit: (pkg: EntityRow) => void;
}) {
  const ws = useWorkspace();
  const { setError } = useAsyncToast();

  async function toggleActive(row: EntityRow, v: boolean) {
    try {
      await dataApi.update('creditPackages', row.id, { active: v });
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(row: EntityRow) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    try {
      await dataApi.remove('creditPackages', row.id);
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const best = bestValuePackage(packages.filter((p) => p.active) as any) as EntityRow | null;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
          <th className="px-4 py-2">Package</th>
          <th className="px-2 py-2">Price</th>
          <th className="px-2 py-2">Base</th>
          <th className="px-2 py-2">Bonus</th>
          <th className="px-2 py-2">Total {creditLabel}</th>
          <th className="px-2 py-2" title="price ÷ total credits × 100 (calculated)">
            /100
          </th>
          <th className="px-2 py-2">Verified</th>
          <th className="px-2 py-2">Active</th>
          <th className="px-2 py-2" />
        </tr>
      </thead>
      <tbody>
        {packages.map((p) => {
          const total = packageTotalCredits(p as any);
          const per100 = pricePer100Credits(p as any);
          return (
            <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/60">
              <td className="px-4 py-2 font-medium">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  {p.name}
                  {best && best.id === p.id && <Badge tone="green">best value</Badge>}
                  {p.subscriberOnly && <Badge tone="blue">subscribers only</Badge>}
                </span>
              </td>
              <td className="px-2 py-2">
                {p.currency ?? 'USD'} {Number(p.price).toFixed(2)}
              </td>
              <td className="px-2 py-2">{p.baseCredits ?? p.tokenAmount ?? '—'}</td>
              <td className="px-2 py-2">{p.bonusCredits ?? '—'}</td>
              <td className="px-2 py-2 font-medium">{total ?? '—'}</td>
              <td className="px-2 py-2 text-xs text-slate-500">
                {per100 !== null ? fmtMoney(per100, String(p.currency ?? 'USD')) : '—'}
              </td>
              <td className="px-2 py-2 text-xs">
                {p.lastVerifiedAt ? fmtDate(p.lastVerifiedAt) : <span className="text-amber-600">never</span>}
              </td>
              <td className="px-2 py-2">
                {canEdit ? (
                  <Toggle checked={p.active} onChange={(v) => void toggleActive(p, v)} aria-label="Active" />
                ) : (
                  <Badge tone={p.active ? 'green' : 'gray'}>{p.active ? 'active' : 'inactive'}</Badge>
                )}
              </td>
              <td className="px-2 py-2 text-right">
                {canEdit && (
                  <>
                    <Button variant="ghost" className="text-xs" onClick={() => onEdit(p)}>
                      Edit
                    </Button>
                    <Button variant="ghost" className="text-xs text-red-600" onClick={() => void remove(p)}>
                      Delete
                    </Button>
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Shared pricing evidence chips (screenshots proving a price/cost)
// ---------------------------------------------------------------------------

function PricingEvidence({
  entity,
  row,
  canEdit,
  altText,
  compact,
}: {
  entity: 'subscriptionPlans' | 'creditPackages' | 'featureCosts' | 'paymentProfiles' | 'pricingSnapshots' | 'pricingPromotions';
  row: EntityRow;
  canEdit: boolean;
  altText: string;
  compact?: boolean;
}) {
  const ws = useWorkspace();
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useToastError(error, () => setError(null));
  const fileInput = useRef<HTMLInputElement>(null);
  const ids: string[] = Array.isArray(row.evidenceMediaIds) ? row.evidenceMediaIds : [];
  const mediaById = new Map(ws.related.mediaAll.map((m) => [m.id, m]));

  async function patch(next: string[]) {
    setError(null);
    try {
      await dataApi.update(entity, row.id, { evidenceMediaIds: next.length > 0 ? next : undefined });
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('adult', '0');
      form.set('role', 'proof');
      form.set('altText', altText);
      form.set('productId', ws.productId);
      const created = await api.upload<{ id: string }>('/api/admin/media/upload', form);
      await patch([...ids, created.id]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className={compact ? 'mt-1.5' : 'mt-2'}>
      <div className="flex flex-wrap items-center gap-1.5">
        {!compact && <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Evidence</span>}
        {ids.map((id) => {
          const m = mediaById.get(id);
          return (
            <span
              key={id}
              className="group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              title={String(m?.altText ?? m?.caption ?? 'Evidence')}
            >
              {m?.url ? (
                <img src={String(m.url)} alt={String(m.altText ?? '')} className="h-full w-full object-cover" />
              ) : (
                <Icon name="image" className="!text-[16px] text-slate-400" />
              )}
              {canEdit && (
                <button
                  type="button"
                  aria-label="Remove evidence"
                  className="absolute inset-0 hidden items-center justify-center bg-black/50 text-white group-hover:flex"
                  onClick={() => void patch(ids.filter((x) => x !== id))}
                >
                  <Icon name="close" className="!text-[14px]" />
                </button>
              )}
            </span>
          );
        })}
        {canEdit && (
          <>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded border border-dashed border-slate-300 px-2 text-xs text-slate-500 hover:border-pink-400 hover:text-pink-600 dark:border-slate-600"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              <Icon name="add_photo_alternate" className="!text-[14px]" />
              {uploading ? 'Uploading…' : ids.length > 0 ? 'Add' : 'Add proof screenshot'}
            </button>
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-pink-600"
              onClick={() => setShowPicker(true)}
            >
              choose existing
            </button>
          </>
        )}
        {!canEdit && ids.length === 0 && <span className="text-xs text-slate-400">none</span>}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      {showPicker && (
        <MediaPickerModal
          productId={ws.productId}
          excludeIds={ids}
          onSelect={(id) => {
            setShowPicker(false);
            void patch([...ids, id]);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Package / payment-profile modals (Phase 2 replaces these with inline rows)
// ---------------------------------------------------------------------------

function PackageModal({ pkg, onClose, onSaved }: { pkg: EntityRow | null; onClose: () => void; onSaved: () => void }) {
  const ws = useWorkspace();
  const [f, setF] = useState<Record<string, any>>({
    name: pkg?.name ?? '',
    price: pkg?.price != null ? String(pkg.price) : '',
    currency: pkg?.currency ?? ws.fields.priceCurrency ?? 'USD',
    baseCredits: pkg?.baseCredits != null ? String(pkg.baseCredits) : pkg?.tokenAmount != null ? String(pkg.tokenAmount) : '',
    bonusCredits: pkg?.bonusCredits != null ? String(pkg.bonusCredits) : '',
    subscriberOnly: Boolean(pkg?.subscriberOnly),
    active: pkg ? Boolean(pkg.active) : true,
    lastVerifiedAt: toDateInput(pkg?.lastVerifiedAt),
  });
  const { busy, error, run } = useAsyncToast();
  const setField = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const total = (numOrUndef(f.baseCredits) ?? 0) + (numOrUndef(f.bonusCredits) ?? 0);
  const per100 = total > 0 && f.price !== '' ? ((Number(f.price) / total) * 100).toFixed(2) : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const fields: Record<string, unknown> = {
      name: String(f.name).trim(),
      price: Number(f.price),
      currency: String(f.currency).toUpperCase(),
      baseCredits: numOrUndef(f.baseCredits),
      bonusCredits: numOrUndef(f.bonusCredits),
      tokenAmount: total > 0 ? total : undefined, // legacy mirror
      subscriberOnly: f.subscriberOnly,
      active: f.active,
      lastVerifiedAt: fromDateInput(f.lastVerifiedAt),
    };
    const snapshot = ws.related.pricingSnapshots.find((s) => ['active', 'draft', 'pending_review'].includes(String(s.status)));
    const done = await run(async () => {
      if (pkg) await dataApi.update('creditPackages', pkg.id, fields, snapshot ? { snapshot: snapshot.id } : undefined);
      else
        await dataApi.create('creditPackages', fields, {
          product: ws.productId,
          ...(snapshot ? { snapshot: snapshot.id } : {}),
        });
      return true;
    });
    if (done) onSaved();
  }

  return (
    <Modal title={pkg ? `Edit package: ${pkg.name}` : 'New credit package'} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Package name" required>
            <TextInput value={f.name} onChange={(e) => setField('name', e.target.value)} required />
          </Field>
          <Field label="Price" required>
            <TextInput inputMode="decimal" value={f.price} onChange={(e) => setField('price', e.target.value.replace(/[^\d.]/g, ''))} required />
          </Field>
          <Field label="Currency (ISO)" required>
            <TextInput value={f.currency} onChange={(e) => setField('currency', e.target.value)} placeholder="USD" required />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Base credits">
            <TextInput type="number" value={f.baseCredits} onChange={(e) => setField('baseCredits', e.target.value)} />
          </Field>
          <Field label="Bonus credits">
            <TextInput type="number" value={f.bonusCredits} onChange={(e) => setField('bonusCredits', e.target.value)} />
          </Field>
          <div className="pt-6 text-sm text-slate-500">
            {total > 0 && (
              <>
                Total: <span className="font-semibold">{total}</span>
                {per100 && (
                  <span className="ml-2 text-xs text-slate-400" title="price ÷ total credits × 100">
                    ({f.currency} {per100}/100)
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <Toggle checked={f.subscriberOnly} onChange={(v) => setField('subscriberOnly', v)} label="Subscriber-only package" />
          <Toggle checked={f.active} onChange={(v) => setField('active', v)} label="Active" />
          <Field label="Last verified">
            <TextInput type="date" value={f.lastVerifiedAt} onChange={(e) => setField('lastVerifiedAt', e.target.value)} />
          </Field>
        </div>
        {pkg && <PricingEvidence entity="creditPackages" row={pkg} canEdit altText={`Pricing evidence: ${pkg.name} package`} />}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !f.name || f.price === ''}>
            {busy ? 'Saving…' : pkg ? 'Save package' : 'Create package'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const PAYMENT_METHODS = [
  { key: 'card', label: 'Card', icon: 'credit_card' },
  { key: 'paypal', label: 'PayPal', icon: 'account_balance_wallet' },
  { key: 'crypto', label: 'Crypto', icon: 'currency_bitcoin' },
  { key: 'applePay', label: 'Apple Pay', icon: 'phone_iphone' },
  { key: 'googlePay', label: 'Google Pay', icon: 'wallet' },
  { key: 'bankTransfer', label: 'Bank transfer', icon: 'account_balance' },
] as const;

type PaymentMethodKey = (typeof PAYMENT_METHODS)[number]['key'];

function PaymentProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: EntityRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const ws = useWorkspace();
  const [methods, setMethods] = useState<Set<PaymentMethodKey>>(() => {
    const initial = new Set<PaymentMethodKey>();
    if (profile?.creditCard || profile?.debitCard) initial.add('card');
    if (profile?.paypal) initial.add('paypal');
    if (profile?.crypto) initial.add('crypto');
    if (profile?.applePay) initial.add('applePay');
    if (profile?.googlePay) initial.add('googlePay');
    if (profile?.bankTransfer) initial.add('bankTransfer');
    return initial;
  });
  const [cryptoOnly, setCryptoOnly] = useState(Boolean(profile?.cryptoOnly));
  const [discreetBilling, setDiscreetBilling] = useState(Boolean(profile?.discreetBilling));
  const [billingDescriptor, setBillingDescriptor] = useState(String(profile?.billingDescriptor ?? ''));
  const { busy, error, run } = useAsyncToast();

  function toggleMethod(key: PaymentMethodKey) {
    setMethods((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    // Refunds, cancellation, and notes are filled in from the testing screen —
    // this modal only manages payment methods, so those fields stay untouched.
    const fields: Record<string, unknown> = {
      creditCard: methods.has('card'),
      debitCard: methods.has('card'),
      paypal: methods.has('paypal'),
      crypto: methods.has('crypto'),
      applePay: methods.has('applePay'),
      googlePay: methods.has('googlePay'),
      bankTransfer: methods.has('bankTransfer'),
      cryptoOnly,
      discreetBilling,
      billingDescriptor: discreetBilling ? billingDescriptor.trim() || undefined : undefined,
      lastVerifiedAt: Date.now(),
    };
    const done = await run(async () => {
      if (profile) await dataApi.update('paymentProfiles', profile.id, fields);
      else await dataApi.create('paymentProfiles', fields, { product: ws.productId });
      return true;
    });
    if (done) onSaved();
  }

  return (
    <Modal title="Payment methods" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((m) => {
            const selected = methods.has(m.key);
            return (
              <button
                key={m.key}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleMethod(m.key)}
                className={`relative flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${
                  selected
                    ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-950/40 dark:text-pink-300'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-pink-200 hover:bg-pink-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-pink-900'
                }`}
              >
                {selected && (
                  <Icon
                    name="check_circle"
                    className="absolute right-1.5 top-1.5 !text-[14px] text-pink-500"
                  />
                )}
                <Icon name={m.icon} className="!text-[22px]" />
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-md border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <Toggle
            checked={cryptoOnly}
            onChange={setCryptoOnly}
            label="Cryptocurrency is the only available payment"
          />
          <p className="mt-1 pl-11 text-xs text-amber-800 dark:text-amber-300">
            Shown as a warning on the public review page.
          </p>
        </div>

        <div>
          <Toggle checked={discreetBilling} onChange={setDiscreetBilling} label="Discreet billing" />
          {discreetBilling && (
            <div className="mt-2 pl-11">
              <Field label="How does it show up on the bank statement?">
                <TextInput
                  value={billingDescriptor}
                  onChange={(e) => setBillingDescriptor(e.target.value)}
                  placeholder="e.g. TXM MEDIA LLC"
                />
              </Field>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save payment methods'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
