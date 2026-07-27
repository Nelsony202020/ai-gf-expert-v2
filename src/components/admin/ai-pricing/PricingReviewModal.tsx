// Review screen for AI-extracted pricing. Every value is editable; rows are
// matched against existing records by name (feature costs by type) and shown
// as "will update" or "will create". Apply writes through the normal CRUD API
// and attaches the source screenshots as evidence. Nothing is ever deleted.

import { useMemo, useState } from 'react';
import { dataApi, type EntityRow } from '../api';
import { Badge, Button, ErrorNote, Icon, Modal, Select, TextInput } from '../ui';

// Mirrors PricingDraft from src/lib/ai-pricing/extract.ts (client-side shape).
export interface PricingDraftClient {
  mediaIds: string[];
  imageClassifications: Record<string, string>;
  plans: Array<{
    name: string;
    monthlyPrice?: number | null;
    annualMonthlyPrice?: number | null;
    annualTotalPrice?: number | null;
    currency?: string | null;
    includedTokensPerMonth?: number | null;
    freeTrial?: boolean | null;
    trialLength?: string | null;
  }>;
  packages: Array<{
    name?: string | null;
    price: number;
    currency?: string | null;
    baseCredits?: number | null;
    bonusCredits?: number | null;
  }>;
  featureCosts: Array<{
    featureType: string;
    customLabel?: string | null;
    tokenCost: number;
    unit: string;
  }>;
  promotions: Array<{
    name: string;
    promotionType?: string | null;
    discountPercent?: number | null;
    couponCode?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    publicNote?: string | null;
  }>;
  usesTokens?: boolean | null;
  tokenName?: string | null;
  notes?: string | null;
  model: string;
}

// ---------------------------------------------------------------------------
// Editable row state (numbers kept as strings while editing)
// ---------------------------------------------------------------------------

interface PlanRow {
  key: number;
  name: string;
  monthlyPrice: string;
  annualMonthlyPrice: string;
  annualTotalPrice: string;
  currency: string;
  includedTokens: string;
  matchId: string | null;
}

interface PackageRow {
  key: number;
  name: string;
  price: string;
  currency: string;
  baseCredits: string;
  bonusCredits: string;
  matchId: string | null;
}

interface CostRow {
  key: number;
  featureType: string;
  customLabel: string;
  tokenCost: string;
  unit: string;
  matchId: string | null;
}

interface PromoRow {
  key: number;
  name: string;
  promotionType: string;
  discountPercent: string;
  couponCode: string;
  startAt: string;
  endAt: string;
  matchId: string | null;
}

const UNIT_OPTIONS = ['per_image', 'per_message', 'per_minute', 'per_second', 'per_video', 'per_generation', 'per_request', 'custom'];
const PROMO_TYPES = ['plan_discount', 'package_discount', 'bonus_credits', 'free_trial', 'holiday', 'coupon', 'custom'];

function normCurrency(v: string | null | undefined, fallback: string): string {
  const c = (v ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : fallback;
}

function num(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function intOrUndef(v: string): number | undefined {
  const n = num(v);
  return n === undefined ? undefined : Math.round(n);
}

function dateToMs(v: string): number | undefined {
  if (!v) return undefined;
  const ms = new Date(`${v}T00:00:00`).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

function mergeEvidence(existing: unknown, mediaIds: string[]): string[] {
  const prev = Array.isArray(existing) ? (existing as string[]) : [];
  return [...new Set([...prev, ...mediaIds])];
}

function matchByName(rows: EntityRow[], name: string): EntityRow | undefined {
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  return rows.find((r) => String(r.name ?? '').trim().toLowerCase() === n);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingReviewModal({
  draft,
  productId,
  snapshot,
  existingPlans,
  existingPackages,
  existingFeatureCosts,
  existingPromotions,
  defaultCurrency,
  onClose,
  onApplied,
}: {
  draft: PricingDraftClient;
  productId: string;
  snapshot: EntityRow;
  existingPlans: EntityRow[];
  existingPackages: EntityRow[];
  existingFeatureCosts: EntityRow[];
  existingPromotions: EntityRow[];
  defaultCurrency: string;
  onClose: () => void;
  onApplied: () => void;
}) {
  const fallbackCurrency = normCurrency(defaultCurrency, 'USD');
  let keyCounter = 0;

  const [plans, setPlans] = useState<PlanRow[]>(() =>
    draft.plans.map((p) => ({
      key: keyCounter++,
      name: p.name,
      monthlyPrice: p.monthlyPrice != null ? String(p.monthlyPrice) : '',
      annualMonthlyPrice: p.annualMonthlyPrice != null ? String(p.annualMonthlyPrice) : '',
      annualTotalPrice: p.annualTotalPrice != null ? String(p.annualTotalPrice) : '',
      currency: normCurrency(p.currency, fallbackCurrency),
      includedTokens: p.includedTokensPerMonth != null ? String(p.includedTokensPerMonth) : '',
      matchId: matchByName(existingPlans, p.name)?.id ?? null,
    })),
  );
  const [packages, setPackages] = useState<PackageRow[]>(() =>
    draft.packages.map((p) => {
      const name =
        (p.name ?? '').trim() ||
        (p.baseCredits != null ? `${Math.round(p.baseCredits)} ${draft.tokenName ?? 'tokens'}` : `Package`);
      return {
        key: keyCounter++,
        name,
        price: String(p.price),
        currency: normCurrency(p.currency, fallbackCurrency),
        baseCredits: p.baseCredits != null ? String(p.baseCredits) : '',
        bonusCredits: p.bonusCredits != null ? String(p.bonusCredits) : '',
        matchId: matchByName(existingPackages, name)?.id ?? null,
      };
    }),
  );
  const [costs, setCosts] = useState<CostRow[]>(() =>
    draft.featureCosts.map((c) => ({
      key: keyCounter++,
      featureType: c.featureType,
      customLabel: c.customLabel ?? '',
      tokenCost: String(c.tokenCost),
      unit: c.unit,
      matchId:
        existingFeatureCosts.find((r) => String(r.featureType ?? '') === c.featureType)?.id ?? null,
    })),
  );
  const [promos, setPromos] = useState<PromoRow[]>(() =>
    draft.promotions.map((p) => ({
      key: keyCounter++,
      name: p.name,
      promotionType: p.promotionType ?? 'custom',
      discountPercent: p.discountPercent != null ? String(p.discountPercent) : '',
      couponCode: p.couponCode ?? '',
      startAt: p.startAt ?? '',
      endAt: p.endAt ?? '',
      matchId: matchByName(existingPromotions, p.name)?.id ?? null,
    })),
  );

  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = plans.length + packages.length + costs.length + promos.length;
  const creates = useMemo(
    () =>
      [...plans, ...packages, ...promos].filter((r) => !r.matchId).length +
      costs.filter((r) => !r.matchId).length,
    [plans, packages, costs, promos],
  );

  async function apply() {
    setError(null);
    setApplying(true);
    try {
      const mediaIds = draft.mediaIds;
      const byId = <T extends EntityRow>(rows: T[], id: string | null) =>
        id ? rows.find((r) => r.id === id) : undefined;

      // --- Plans -----------------------------------------------------------
      for (const [i, row] of plans.entries()) {
        if (!row.name.trim()) continue;
        const existing = byId(existingPlans, row.matchId);
        const currency = normCurrency(row.currency, fallbackCurrency);
        const monthly = num(row.monthlyPrice);
        const annualTotal =
          num(row.annualTotalPrice) ??
          (num(row.annualMonthlyPrice) != null
            ? Math.round(num(row.annualMonthlyPrice)! * 12 * 100) / 100
            : undefined);

        const prevOptions: any[] = Array.isArray(existing?.billingOptions)
          ? [...(existing!.billingOptions as any[])]
          : [];
        const options = prevOptions.filter(
          (o) => !(o.interval === 'monthly' && monthly != null) && !(o.interval === 'yearly' && annualTotal != null),
        );
        if (monthly != null) options.push({ interval: 'monthly', price: monthly, currency, active: true });
        if (annualTotal != null) options.push({ interval: 'yearly', price: annualTotal, currency, active: true });
        if (options.length === 0) continue;

        const legacy =
          options.find((o) => o.interval === 'monthly') ?? options.find((o) => o.interval === 'yearly') ?? options[0];
        const fields: Record<string, unknown> = {
          name: row.name.trim(),
          billingInterval: legacy.interval,
          price: legacy.price,
          currency,
          billingOptions: options,
          includedTokens: intOrUndef(row.includedTokens),
          active: existing ? existing.active !== false : true,
          sortOrder: existing?.sortOrder ?? existingPlans.length + i,
          evidenceMediaIds: mergeEvidence(existing?.evidenceMediaIds, mediaIds),
          lastVerifiedAt: Date.now(),
        };
        if (existing) {
          await dataApi.update('subscriptionPlans', existing.id, fields);
        } else {
          await dataApi.create('subscriptionPlans', fields, { product: productId, snapshot: snapshot.id });
        }
      }

      // --- Token packages --------------------------------------------------
      for (const [i, row] of packages.entries()) {
        const price = num(row.price);
        if (!row.name.trim() || price == null) continue;
        const existing = byId(existingPackages, row.matchId);
        const fields: Record<string, unknown> = {
          name: row.name.trim(),
          price,
          currency: normCurrency(row.currency, fallbackCurrency),
          baseCredits: intOrUndef(row.baseCredits),
          bonusCredits: intOrUndef(row.bonusCredits),
          active: existing ? existing.active !== false : true,
          sortOrder: existing?.sortOrder ?? existingPackages.length + i,
          evidenceMediaIds: mergeEvidence(existing?.evidenceMediaIds, mediaIds),
          lastVerifiedAt: Date.now(),
        };
        if (existing) {
          await dataApi.update('creditPackages', existing.id, fields);
        } else {
          await dataApi.create('creditPackages', fields, { product: productId, snapshot: snapshot.id });
        }
      }

      // --- Feature costs ---------------------------------------------------
      for (const [i, row] of costs.entries()) {
        const cost = num(row.tokenCost);
        if (cost == null) continue;
        const existing = byId(existingFeatureCosts, row.matchId);
        const fields: Record<string, unknown> = {
          featureType: row.featureType,
          customLabel: row.customLabel.trim() || undefined,
          creditCost: cost,
          minCost: undefined,
          maxCost: undefined,
          costType: 'fixed',
          unit: row.unit,
          active: true,
          sortOrder: existing?.sortOrder ?? existingFeatureCosts.length + i,
          evidenceMediaIds: mergeEvidence(existing?.evidenceMediaIds, mediaIds),
          lastVerifiedAt: Date.now(),
        };
        if (existing) {
          await dataApi.update('featureCosts', existing.id, fields);
        } else {
          await dataApi.create('featureCosts', fields, { product: productId, snapshot: snapshot.id });
        }
      }

      // --- Promotions ------------------------------------------------------
      for (const row of promos) {
        if (!row.name.trim()) continue;
        const existing = byId(existingPromotions, row.matchId);
        const endMs = dateToMs(row.endAt);
        const fields: Record<string, unknown> = {
          name: row.name.trim(),
          promotionType: row.promotionType,
          status: endMs != null && endMs < Date.now() ? 'expired' : 'active',
          discountPercent: num(row.discountPercent),
          couponCode: row.couponCode.trim() || undefined,
          startAt: dateToMs(row.startAt),
          endAt: endMs,
          evidenceMediaIds: mergeEvidence(existing?.evidenceMediaIds, mediaIds),
        };
        if (existing) {
          await dataApi.update('pricingPromotions', existing.id, fields);
        } else {
          await dataApi.create('pricingPromotions', fields, { product: productId, snapshot: snapshot.id });
        }
      }

      // --- Snapshot: model, token name, evidence ---------------------------
      const snapshotPatch: Record<string, unknown> = {
        evidenceMediaIds: mergeEvidence(snapshot.evidenceMediaIds, mediaIds),
      };
      const hasTokens = draft.usesTokens || packages.length > 0 || costs.length > 0;
      if (hasTokens && !snapshot.pricingModel) {
        snapshotPatch.pricingModel = plans.length > 0 ? 'subscription_credits' : 'free_plus_credits';
      }
      const currency = (snapshot.creditCurrency ?? {}) as Record<string, unknown>;
      if (draft.tokenName && !currency.displayName) {
        snapshotPatch.creditCurrency = { ...currency, displayName: draft.tokenName, plural: draft.tokenName };
      }
      await dataApi.update('pricingSnapshots', snapshot.id, snapshotPatch);

      onApplied();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setApplying(false);
    }
  }

  const inputCls = '!py-1 text-xs';

  return (
    <Modal title={`Review AI-extracted pricing (${draft.model})`} onClose={onClose} wide>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {error && <ErrorNote message={error} />}
        {draft.notes && <p className="text-xs text-slate-400">AI note: {draft.notes}</p>}
        {total === 0 && (
          <p className="text-sm text-slate-500">
            The AI couldn't find any pricing data in these screenshots. Try clearer images of the pricing page.
          </p>
        )}

        {plans.length > 0 && (
          <ReviewSection title="Subscription plans">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.7fr_0.8fr_auto_auto] items-center gap-x-2 gap-y-1.5">
              <HeaderCells labels={['Name', 'Monthly $', 'Annual $/mo', 'Annual total', 'Currency', 'Tokens/mo']} />
              {plans.map((row) => (
                <RowCells
                  key={row.key}
                  status={row.matchId ? 'update' : 'create'}
                  onRemove={() => setPlans((p) => p.filter((r) => r.key !== row.key))}
                >
                  <TextInput className={inputCls} value={row.name} onChange={(e) => setPlans((p) => p.map((r) => (r.key === row.key ? { ...r, name: e.target.value, matchId: matchByName(existingPlans, e.target.value)?.id ?? null } : r)))} />
                  <TextInput className={inputCls} inputMode="decimal" value={row.monthlyPrice} onChange={(e) => setPlans((p) => p.map((r) => (r.key === row.key ? { ...r, monthlyPrice: e.target.value } : r)))} />
                  <TextInput className={inputCls} inputMode="decimal" value={row.annualMonthlyPrice} onChange={(e) => setPlans((p) => p.map((r) => (r.key === row.key ? { ...r, annualMonthlyPrice: e.target.value } : r)))} />
                  <TextInput className={inputCls} inputMode="decimal" value={row.annualTotalPrice} onChange={(e) => setPlans((p) => p.map((r) => (r.key === row.key ? { ...r, annualTotalPrice: e.target.value } : r)))} />
                  <TextInput className={inputCls} value={row.currency} onChange={(e) => setPlans((p) => p.map((r) => (r.key === row.key ? { ...r, currency: e.target.value.toUpperCase() } : r)))} />
                  <TextInput className={inputCls} inputMode="numeric" value={row.includedTokens} onChange={(e) => setPlans((p) => p.map((r) => (r.key === row.key ? { ...r, includedTokens: e.target.value } : r)))} />
                </RowCells>
              ))}
            </div>
          </ReviewSection>
        )}

        {packages.length > 0 && (
          <ReviewSection title="Token top-up packages">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.9fr_0.9fr_auto_auto] items-center gap-x-2 gap-y-1.5">
              <HeaderCells labels={['Name', 'Price', 'Currency', 'Base credits', 'Bonus credits']} />
              {packages.map((row) => (
                <RowCells
                  key={row.key}
                  status={row.matchId ? 'update' : 'create'}
                  onRemove={() => setPackages((p) => p.filter((r) => r.key !== row.key))}
                >
                  <TextInput className={inputCls} value={row.name} onChange={(e) => setPackages((p) => p.map((r) => (r.key === row.key ? { ...r, name: e.target.value, matchId: matchByName(existingPackages, e.target.value)?.id ?? null } : r)))} />
                  <TextInput className={inputCls} inputMode="decimal" value={row.price} onChange={(e) => setPackages((p) => p.map((r) => (r.key === row.key ? { ...r, price: e.target.value } : r)))} />
                  <TextInput className={inputCls} value={row.currency} onChange={(e) => setPackages((p) => p.map((r) => (r.key === row.key ? { ...r, currency: e.target.value.toUpperCase() } : r)))} />
                  <TextInput className={inputCls} inputMode="numeric" value={row.baseCredits} onChange={(e) => setPackages((p) => p.map((r) => (r.key === row.key ? { ...r, baseCredits: e.target.value } : r)))} />
                  <TextInput className={inputCls} inputMode="numeric" value={row.bonusCredits} onChange={(e) => setPackages((p) => p.map((r) => (r.key === row.key ? { ...r, bonusCredits: e.target.value } : r)))} />
                </RowCells>
              ))}
            </div>
          </ReviewSection>
        )}

        {costs.length > 0 && (
          <ReviewSection title="Feature costs">
            <div className="grid grid-cols-[1.4fr_0.8fr_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
              <HeaderCells labels={['Feature', 'Token cost', 'Unit']} />
              {costs.map((row) => (
                <RowCells
                  key={row.key}
                  status={row.matchId ? 'update' : 'create'}
                  onRemove={() => setCosts((p) => p.filter((r) => r.key !== row.key))}
                >
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    {row.featureType === 'custom' ? (
                      <TextInput className={inputCls} value={row.customLabel} placeholder="Custom feature" onChange={(e) => setCosts((p) => p.map((r) => (r.key === row.key ? { ...r, customLabel: e.target.value } : r)))} />
                    ) : (
                      row.featureType.replace(/_/g, ' ')
                    )}
                  </div>
                  <TextInput className={inputCls} inputMode="decimal" value={row.tokenCost} onChange={(e) => setCosts((p) => p.map((r) => (r.key === row.key ? { ...r, tokenCost: e.target.value } : r)))} />
                  <Select className={inputCls} value={row.unit} onChange={(e) => setCosts((p) => p.map((r) => (r.key === row.key ? { ...r, unit: e.target.value } : r)))}>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u.replace(/_/g, ' ')}</option>
                    ))}
                  </Select>
                </RowCells>
              ))}
            </div>
          </ReviewSection>
        )}

        {promos.length > 0 && (
          <ReviewSection title="Promotions">
            <div className="grid grid-cols-[1.2fr_1fr_0.6fr_0.8fr_0.9fr_0.9fr_auto_auto] items-center gap-x-2 gap-y-1.5">
              <HeaderCells labels={['Name', 'Type', '%', 'Coupon', 'Starts', 'Ends']} />
              {promos.map((row) => (
                <RowCells
                  key={row.key}
                  status={row.matchId ? 'update' : 'create'}
                  onRemove={() => setPromos((p) => p.filter((r) => r.key !== row.key))}
                >
                  <TextInput className={inputCls} value={row.name} onChange={(e) => setPromos((p) => p.map((r) => (r.key === row.key ? { ...r, name: e.target.value, matchId: matchByName(existingPromotions, e.target.value)?.id ?? null } : r)))} />
                  <Select className={inputCls} value={row.promotionType} onChange={(e) => setPromos((p) => p.map((r) => (r.key === row.key ? { ...r, promotionType: e.target.value } : r)))}>
                    {PROMO_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </Select>
                  <TextInput className={inputCls} inputMode="decimal" value={row.discountPercent} onChange={(e) => setPromos((p) => p.map((r) => (r.key === row.key ? { ...r, discountPercent: e.target.value } : r)))} />
                  <TextInput className={inputCls} value={row.couponCode} onChange={(e) => setPromos((p) => p.map((r) => (r.key === row.key ? { ...r, couponCode: e.target.value } : r)))} />
                  <TextInput className={inputCls} type="date" value={row.startAt} onChange={(e) => setPromos((p) => p.map((r) => (r.key === row.key ? { ...r, startAt: e.target.value } : r)))} />
                  <TextInput className={inputCls} type="date" value={row.endAt} onChange={(e) => setPromos((p) => p.map((r) => (r.key === row.key ? { ...r, endAt: e.target.value } : r)))} />
                </RowCells>
              ))}
            </div>
          </ReviewSection>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        <p className="text-xs text-slate-400">
          {draft.mediaIds.length} screenshot{draft.mediaIds.length === 1 ? '' : 's'} will be attached as evidence.
          Nothing is deleted.
        </p>
        <span className="flex-1" />
        <Button variant="secondary" onClick={onClose} disabled={applying}>
          Cancel
        </Button>
        <Button onClick={() => void apply()} disabled={applying || total === 0}>
          {applying ? 'Applying…' : `Apply (${creates} new, ${total - creates} updated)`}
        </Button>
      </div>
    </Modal>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h4>
      {children}
    </div>
  );
}

function HeaderCells({ labels }: { labels: string[] }) {
  return (
    <>
      {labels.map((l) => (
        <span key={l} className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {l}
        </span>
      ))}
      <span />
      <span />
    </>
  );
}

function RowCells({
  status,
  onRemove,
  children,
}: {
  status: 'create' | 'update';
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Badge tone={status === 'create' ? 'green' : 'blue'}>
        {status === 'create' ? 'will create' : 'will update'}
      </Badge>
      <button
        type="button"
        aria-label="Remove row"
        className="text-slate-300 transition-colors hover:text-red-500"
        onClick={onRemove}
      >
        <Icon name="close" className="!text-[14px]" />
      </button>
    </>
  );
}
