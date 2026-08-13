// Review screen for AI-extracted pricing. Every value is editable; rows are
// matched against existing records by name (feature costs by type) and shown
// as "will update" or "will create". Apply writes through the normal CRUD API
// and attaches the source screenshots as evidence. Nothing is ever deleted.

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { dataApi, type EntityRow } from '../api';
import { Badge, Button, ErrorNote, Icon, Modal, Select, TextInput } from '../ui';
import {
  FEATURE_COST_FAMILIES,
  costRowHumanSummary,
  flattenExtractedFeatureCosts,
  matchExistingVariant,
  normalizeExtractedVariant,
  variantFieldsToFeatureCost,
  type ExtractFeatureCategory,
} from '../../../lib/pricing/featureCostGroups';
import {
  countAllowancesNeedingReview,
  legacyFieldsFromAllowances,
  newAllowanceId,
  normalizeAllowanceLabel,
  parsePlanAllowances,
  type PlanAllowance,
} from '../../../lib/pricing/planAllowances';
import { PlanAllowancesEditor } from '../workspace/tabs/PlanAllowancesEditor';

// Mirrors PricingDraft from src/lib/ai-pricing/extract.ts (client-side shape).
export interface PricingDraftClient {
  mediaIds: string[];
  imageClassifications: Record<string, string>;
  plans: Array<{
    name: string;
    monthlyPrice?: number | null;
    quarterlyTotalPrice?: number | null;
    annualMonthlyPrice?: number | null;
    annualTotalPrice?: number | null;
    currency?: string | null;
    includedTokensPerMonth?: number | null;
    freeTrial?: boolean | null;
    trialLength?: string | null;
    allowances?: Array<{
      sourceLabel: string;
      featureKey?: string | null;
      accessType?: string | null;
      quantity?: number | null;
      unit?: string | null;
      resetInterval?: string | null;
      notes?: string | null;
    }> | null;
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
    model?: string | null;
    durationSeconds?: number | null;
    category?: string | null;
  }>;
  featureCostVariants?: Array<{
    category: string;
    model?: string | null;
    durationSeconds?: number | null;
    label?: string | null;
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
  quarterlyTotalPrice: string;
  annualMonthlyPrice: string;
  annualTotalPrice: string;
  currency: string;
  includedTokens: string;
  allowances: PlanAllowance[];
  matchId: string | null;
}

function draftAllowancesToPlan(
  raw: PricingDraftClient['plans'][number]['allowances'],
  mediaIds: string[],
): PlanAllowance[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return parsePlanAllowances(
    raw.map((a) => ({
      id: newAllowanceId(),
      sourceLabel: a.sourceLabel,
      featureKey: a.featureKey || normalizeAllowanceLabel(a.sourceLabel),
      accessType: a.accessType ?? 'included_unspecified',
      quantity: a.quantity ?? undefined,
      unit: a.unit ?? undefined,
      resetInterval: a.resetInterval ?? undefined,
      notes: a.notes ?? undefined,
      evidenceMediaIds: mediaIds,
    })),
  );
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
  category: ExtractFeatureCategory | 'custom';
  featureType: string;
  model: string;
  durationSeconds: string;
  customLabel: string;
  tokenCost: string;
  unit: string;
  matchId: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  standard_image: 'Standard image',
  video_generation: 'Video generation',
  voice_message: 'Voice message',
  voice_call: 'Phone / voice call',
  custom: 'Other',
};

function flatCostToCandidate(row: CostRow): EntityRow {
  return {
    id: row.matchId ?? '',
    featureType: row.featureType,
    qualityTier: row.model.trim() || null,
    durationProduced: row.durationSeconds.trim() ? Number(row.durationSeconds) : null,
    customLabel: row.customLabel.trim() || null,
  } as EntityRow;
}

function patchCostRow(
  setCosts: Dispatch<SetStateAction<CostRow[]>>,
  existingFeatureCosts: EntityRow[],
  key: number,
  patch: Partial<CostRow>,
) {
  setCosts((p) =>
    p.map((r) => {
      if (r.key !== key) return r;
      const next = { ...r, ...patch };
      return {
        ...next,
        matchId: matchExistingVariant(existingFeatureCosts, flatCostToCandidate(next))?.id ?? null,
      };
    }),
  );
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

function planMonthlyPriceLabel(row: PlanRow): string {
  const monthly = num(row.monthlyPrice);
  const currency = (row.currency || 'USD').toUpperCase();
  if (monthly != null) {
    const formatted = monthly.toLocaleString('en-US', {
      style: 'currency',
      currency: /^[A-Z]{3}$/.test(currency) ? currency : 'USD',
      maximumFractionDigits: 2,
    });
    return `${formatted}/month`;
  }
  const annualMo = num(row.annualMonthlyPrice);
  if (annualMo != null) {
    const formatted = annualMo.toLocaleString('en-US', {
      style: 'currency',
      currency: /^[A-Z]{3}$/.test(currency) ? currency : 'USD',
      maximumFractionDigits: 2,
    });
    return `${formatted}/mo billed yearly`;
  }
  return 'Price not found';
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
      quarterlyTotalPrice: p.quarterlyTotalPrice != null ? String(p.quarterlyTotalPrice) : '',
      annualMonthlyPrice: p.annualMonthlyPrice != null ? String(p.annualMonthlyPrice) : '',
      annualTotalPrice: p.annualTotalPrice != null ? String(p.annualTotalPrice) : '',
      currency: normCurrency(p.currency, fallbackCurrency),
      includedTokens: p.includedTokensPerMonth != null ? String(p.includedTokensPerMonth) : '',
      allowances: draftAllowancesToPlan(p.allowances, draft.mediaIds),
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
  const [costs, setCosts] = useState<CostRow[]>(() => {
    const flat = flattenExtractedFeatureCosts({
      featureCosts: draft.featureCosts as Array<Record<string, unknown>>,
      featureCostVariants: (draft.featureCostVariants ?? []) as Array<Record<string, unknown>>,
    });
    return flat.map((c) => {
      const cleaned = normalizeExtractedVariant({
        model: c.model,
        label: c.customLabel,
        durationSeconds: c.durationSeconds,
      });
      const candidate = {
        featureType: c.featureType,
        qualityTier: cleaned.model || null,
        durationProduced: cleaned.durationSeconds ? Number(cleaned.durationSeconds) : null,
        customLabel: cleaned.label || null,
      } as unknown as EntityRow;
      const match = matchExistingVariant(existingFeatureCosts, candidate);
      return {
        key: keyCounter++,
        category: (c.category ?? 'custom') as ExtractFeatureCategory | 'custom',
        featureType: c.featureType,
        model: cleaned.model,
        durationSeconds: cleaned.durationSeconds,
        customLabel: cleaned.label,
        tokenCost: String(c.tokenCost),
        unit: c.unit,
        matchId: match?.id ?? null,
      };
    });
  });
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
  const [expandedPlanKey, setExpandedPlanKey] = useState<number | null>(
    () => plans[0]?.key ?? null,
  );
  const [editingPlanPricingKey, setEditingPlanPricingKey] = useState<number | null>(null);
  const [sourceTextPlanKey, setSourceTextPlanKey] = useState<number | null>(null);

  const total = plans.length + packages.length + costs.length + promos.length;
  const creates = useMemo(
    () =>
      [...plans, ...packages, ...promos].filter((r) => !r.matchId).length +
      costs.filter((r) => !r.matchId).length,
    [plans, packages, costs, promos],
  );
  const totalBenefits = useMemo(
    () => plans.reduce((n, p) => n + p.allowances.length, 0),
    [plans],
  );
  const totalNeedsReview = useMemo(
    () => plans.reduce((n, p) => n + countAllowancesNeedingReview(p.allowances), 0),
    [plans],
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
        const quarterlyTotal = num(row.quarterlyTotalPrice);
        const annualTotal =
          num(row.annualTotalPrice) ??
          (num(row.annualMonthlyPrice) != null
            ? Math.round(num(row.annualMonthlyPrice)! * 12 * 100) / 100
            : undefined);

        const prevOptions: any[] = Array.isArray(existing?.billingOptions)
          ? [...(existing!.billingOptions as any[])]
          : [];
        const options = prevOptions.filter(
          (o) =>
            !(o.interval === 'monthly' && monthly != null) &&
            !(o.interval === 'quarterly' && quarterlyTotal != null) &&
            !(o.interval === 'yearly' && annualTotal != null),
        );
        if (monthly != null) options.push({ interval: 'monthly', price: monthly, currency, active: true });
        if (quarterlyTotal != null) {
          options.push({ interval: 'quarterly', price: quarterlyTotal, currency, active: true });
        }
        if (annualTotal != null) options.push({ interval: 'yearly', price: annualTotal, currency, active: true });
        if (options.length === 0) continue;

        const legacy =
          options.find((o) => o.interval === 'monthly') ?? options.find((o) => o.interval === 'yearly') ?? options[0];
        const cleanedAllowances = row.allowances
          .map((a) => ({
            ...a,
            sourceLabel: a.sourceLabel.trim(),
            featureKey: a.featureKey.trim() || normalizeAllowanceLabel(a.sourceLabel),
            evidenceMediaIds: mergeEvidence(a.evidenceMediaIds, mediaIds),
          }))
          .filter((a) => a.sourceLabel);
        const legacyFromAllowances = legacyFieldsFromAllowances(cleanedAllowances);
        const includedTokens =
          intOrUndef(row.includedTokens) ?? legacyFromAllowances.includedTokens;
        const fields: Record<string, unknown> = {
          name: row.name.trim(),
          billingInterval: legacy.interval,
          price: legacy.price,
          currency,
          billingOptions: options,
          includedTokens,
          allowances: cleanedAllowances.length > 0 ? cleanedAllowances : undefined,
          ...(legacyFromAllowances.includedImages != null
            ? { includedImages: legacyFromAllowances.includedImages }
            : {}),
          ...(legacyFromAllowances.includedVideos != null
            ? { includedVideos: legacyFromAllowances.includedVideos }
            : {}),
          ...(legacyFromAllowances.includedVoiceMinutes != null
            ? { includedVoiceMinutes: legacyFromAllowances.includedVoiceMinutes }
            : {}),
          ...(legacyFromAllowances.unlimitedFeatures
            ? { unlimitedFeatures: legacyFromAllowances.unlimitedFeatures }
            : {}),
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
        const family =
          FEATURE_COST_FAMILIES.find((f) => f.key === row.category) ??
          FEATURE_COST_FAMILIES.find((f) => f.featureTypes.includes(row.featureType));
        const duration = num(row.durationSeconds);
        const mapped = family
          ? variantFieldsToFeatureCost(family, {
              model: row.model.trim() || null,
              durationSeconds: duration ?? null,
              label: row.customLabel.trim() || null,
              creditCost: cost,
              unit: row.unit,
            })
          : {
              featureType: row.featureType,
              customLabel: row.customLabel.trim() || undefined,
              creditCost: cost,
              unit: row.unit,
            };
        const fields: Record<string, unknown> = {
          ...mapped,
          minCost: undefined,
          maxCost: undefined,
          costType: 'fixed',
          creditCost: cost,
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

  const inputCls = '!py-1 w-full min-w-0 text-xs';

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
            <p className="mb-3 text-[11px] text-slate-400">
              {plans.length} plan{plans.length === 1 ? '' : 's'}
              {totalBenefits > 0 ? ` · ${totalBenefits} benefit${totalBenefits === 1 ? '' : 's'}` : ''}
              {totalNeedsReview > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">
                  {' '}
                  · {totalNeedsReview} need{totalNeedsReview === 1 ? 's' : ''} review
                </span>
              ) : totalBenefits > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400"> · All looks good</span>
              ) : null}
              . Expand a plan to review benefits — edit only when something looks wrong.
            </p>
            <div className="space-y-2">
              {plans.map((row) => {
                const open = expandedPlanKey === row.key;
                const needs = countAllowancesNeedingReview(row.allowances);
                const priceLabel = planMonthlyPriceLabel(row);
                const editingPricing = editingPlanPricingKey === row.key;
                const showSource = sourceTextPlanKey === row.key;
                return (
                  <div
                    key={row.key}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50"
                  >
                    <div className="flex w-full items-start gap-2 px-3 py-3">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-start gap-3 text-left transition-colors"
                        onClick={() =>
                          setExpandedPlanKey((k) => (k === row.key ? null : row.key))
                        }
                      >
                        <Icon
                          name={open ? 'expand_more' : 'chevron_right'}
                          className="mt-0.5 !text-[18px] text-slate-400"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-50">
                              {row.name.trim() || 'Untitled plan'}
                            </p>
                            <Badge tone={row.matchId ? 'blue' : 'green'}>
                              {row.matchId ? 'will update' : 'will create'}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {priceLabel}
                            {row.allowances.length > 0
                              ? ` · ${row.allowances.length} benefit${row.allowances.length === 1 ? '' : 's'}`
                              : ''}
                            {needs > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                {' '}
                                · {needs} need{needs === 1 ? 's' : ''} review
                              </span>
                            ) : row.allowances.length > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {' '}
                                · All looks good
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        aria-label="Remove plan"
                        className="shrink-0 text-slate-300 transition-colors hover:text-red-500"
                        onClick={() => {
                          setPlans((p) => p.filter((r) => r.key !== row.key));
                          if (expandedPlanKey === row.key) setExpandedPlanKey(null);
                        }}
                      >
                        <Icon name="close" className="!text-[14px]" />
                      </button>
                    </div>

                    {open && (
                      <div className="space-y-4 border-t border-slate-100 px-3 py-3 dark:border-slate-800">
                        {editingPricing ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                Edit plan pricing
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                className="!py-0.5 text-[11px]"
                                onClick={() => setEditingPlanPricingKey(null)}
                              >
                                Done
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  Name
                                </span>
                                <TextInput
                                  className={inputCls}
                                  value={row.name}
                                  onChange={(e) =>
                                    setPlans((p) =>
                                      p.map((r) =>
                                        r.key === row.key
                                          ? {
                                              ...r,
                                              name: e.target.value,
                                              matchId:
                                                matchByName(existingPlans, e.target.value)?.id ??
                                                null,
                                            }
                                          : r,
                                      ),
                                    )
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  Monthly $
                                </span>
                                <TextInput
                                  className={inputCls}
                                  inputMode="decimal"
                                  value={row.monthlyPrice}
                                  onChange={(e) =>
                                    setPlans((p) =>
                                      p.map((r) =>
                                        r.key === row.key
                                          ? { ...r, monthlyPrice: e.target.value }
                                          : r,
                                      ),
                                    )
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  3-mo total
                                </span>
                                <TextInput
                                  className={inputCls}
                                  inputMode="decimal"
                                  value={row.quarterlyTotalPrice}
                                  onChange={(e) =>
                                    setPlans((p) =>
                                      p.map((r) =>
                                        r.key === row.key
                                          ? { ...r, quarterlyTotalPrice: e.target.value }
                                          : r,
                                      ),
                                    )
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  Annual $/mo
                                </span>
                                <TextInput
                                  className={inputCls}
                                  inputMode="decimal"
                                  value={row.annualMonthlyPrice}
                                  onChange={(e) =>
                                    setPlans((p) =>
                                      p.map((r) =>
                                        r.key === row.key
                                          ? { ...r, annualMonthlyPrice: e.target.value }
                                          : r,
                                      ),
                                    )
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  Annual total
                                </span>
                                <TextInput
                                  className={inputCls}
                                  inputMode="decimal"
                                  value={row.annualTotalPrice}
                                  onChange={(e) =>
                                    setPlans((p) =>
                                      p.map((r) =>
                                        r.key === row.key
                                          ? { ...r, annualTotalPrice: e.target.value }
                                          : r,
                                      ),
                                    )
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  Currency
                                </span>
                                <TextInput
                                  className={inputCls}
                                  value={row.currency}
                                  onChange={(e) =>
                                    setPlans((p) =>
                                      p.map((r) =>
                                        r.key === row.key
                                          ? { ...r, currency: e.target.value.toUpperCase() }
                                          : r,
                                      ),
                                    )
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                                  Tokens / mo
                                </span>
                                <TextInput
                                  className={inputCls}
                                  inputMode="numeric"
                                  value={row.includedTokens}
                                  onChange={(e) =>
                                    setPlans((p) =>
                                      p.map((r) =>
                                        r.key === row.key
                                          ? { ...r, includedTokens: e.target.value }
                                          : r,
                                      ),
                                    )
                                  }
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                {priceLabel}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {row.matchId ? 'Existing plan · will update' : 'New plan · will create'}
                                {row.includedTokens.trim()
                                  ? ` · ${row.includedTokens} tokens/mo`
                                  : ''}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              className="!py-0.5 text-[11px]"
                              onClick={() => setEditingPlanPricingKey(row.key)}
                            >
                              Edit plan pricing
                            </Button>
                          </div>
                        )}

                        <PlanAllowancesEditor
                          value={row.allowances}
                          onChange={(next) =>
                            setPlans((p) =>
                              p.map((r) => (r.key === row.key ? { ...r, allowances: next } : r)),
                            )
                          }
                        />

                        {row.allowances.some((a) => a.sourceLabel.trim()) && (
                          <div>
                            <button
                              type="button"
                              className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
                              onClick={() =>
                                setSourceTextPlanKey((k) => (k === row.key ? null : row.key))
                              }
                            >
                              {showSource ? 'Hide extracted source text' : 'View extracted source text'}
                            </button>
                            {showSource && (
                              <p className="mt-1.5 rounded-md bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                {row.allowances
                                  .map((a) => a.sourceLabel.trim())
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ReviewSection>
        )}

        {packages.length > 0 && (
          <ReviewSection title="Token top-up packages">
            <div className="grid grid-cols-1 gap-y-1.5">
              <div className="col-span-full grid grid-cols-[1.2fr_0.8fr_0.7fr_0.9fr_0.9fr_auto_auto] items-center gap-x-2">
                <HeaderCells labels={['Name', 'Price', 'Currency', 'Base credits', 'Bonus credits']} />
              </div>
              {packages.map((row) => (
                <RowCells
                  key={row.key}
                  gridClass="grid-cols-[1.2fr_0.8fr_0.7fr_0.9fr_0.9fr_auto_auto]"
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
            <p className="mb-3 text-[11px] text-slate-400">
              Check each price point below. Expand a row only if something looks wrong.
            </p>
            {(['video_generation', 'standard_image', 'voice_message', 'voice_call', 'custom'] as const).map((cat) => {
              const rows = costs.filter((r) => r.category === cat);
              if (rows.length === 0) return null;
              return (
                <div key={cat} className="mb-4 last:mb-0">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </p>
                  <ul className="space-y-2">
                    {rows.map((row) => (
                      <FeatureCostReviewCard
                        key={row.key}
                        row={row}
                        inputCls={inputCls}
                        onPatch={(patch) => patchCostRow(setCosts, existingFeatureCosts, row.key, patch)}
                        onRemove={() => setCosts((p) => p.filter((r) => r.key !== row.key))}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </ReviewSection>
        )}

        {promos.length > 0 && (
          <ReviewSection title="Promotions">
            <div className="grid grid-cols-1 gap-y-1.5">
              <div className="col-span-full grid grid-cols-[1.2fr_1fr_0.6fr_0.8fr_0.9fr_0.9fr_auto_auto] items-center gap-x-2">
                <HeaderCells labels={['Name', 'Type', '%', 'Coupon', 'Starts', 'Ends']} />
              </div>
              {promos.map((row) => (
                <RowCells
                  key={row.key}
                  gridClass="grid-cols-[1.2fr_1fr_0.6fr_0.8fr_0.9fr_0.9fr_auto_auto]"
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
        <span
          key={l}
          className="px-0.5 text-center text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-400"
        >
          {l}
        </span>
      ))}
      <span aria-hidden="true" className="w-[72px]" />
      <span aria-hidden="true" className="w-5" />
    </>
  );
}

function FeatureCostReviewCard({
  row,
  inputCls,
  onPatch,
  onRemove,
}: {
  row: CostRow;
  inputCls: string;
  onPatch: (patch: Partial<CostRow>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const summary = costRowHumanSummary(row);
  const isMatrix = row.category === 'video_generation' || row.category === 'standard_image';
  const showDuration = row.category === 'video_generation';

  return (
    <li className="rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <p className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{summary}</p>
        <Badge tone={row.matchId ? 'blue' : 'green'}>{row.matchId ? 'will update' : 'will create'}</Badge>
        <Button variant="ghost" className="text-xs" type="button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide' : 'Edit'}
        </Button>
        <button
          type="button"
          aria-label="Remove row"
          className="text-slate-300 transition-colors hover:text-red-500"
          onClick={onRemove}
        >
          <Icon name="close" className="!text-[14px]" />
        </button>
      </div>
      {expanded && (
        <div className="grid gap-2 border-t border-slate-200 px-3 py-2.5 sm:grid-cols-2 dark:border-slate-700">
          {isMatrix && (
            <>
              <label className="block">
                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Model</span>
                <TextInput
                  className={inputCls}
                  value={row.model}
                  placeholder="Lite"
                  onChange={(e) => onPatch({ model: e.target.value })}
                />
              </label>
              {showDuration && (
                <label className="block">
                  <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Seconds</span>
                  <TextInput
                    className={inputCls}
                    inputMode="numeric"
                    value={row.durationSeconds}
                    placeholder="5"
                    onChange={(e) => onPatch({ durationSeconds: e.target.value })}
                  />
                </label>
              )}
              <label className={`block ${showDuration ? 'sm:col-span-2' : ''}`}>
                <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">
                  Label (only if no model — e.g. Video with audio)
                </span>
                <TextInput
                  className={inputCls}
                  value={row.customLabel}
                  placeholder="Video with audio"
                  onChange={(e) => onPatch({ customLabel: e.target.value })}
                />
              </label>
            </>
          )}
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Cost</span>
            <TextInput
              className={inputCls}
              inputMode="decimal"
              value={row.tokenCost}
              onChange={(e) => onPatch({ tokenCost: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Unit</span>
            <Select className={inputCls} value={row.unit} onChange={(e) => onPatch({ unit: e.target.value })}>
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </label>
        </div>
      )}
    </li>
  );
}

function RowCells({
  status,
  onRemove,
  children,
  gridClass,
}: {
  status: 'create' | 'update';
  onRemove: () => void;
  children: React.ReactNode;
  gridClass: string;
}) {
  return (
    <div className={`col-span-full grid ${gridClass} items-center gap-x-2 gap-y-1.5`}>
      {children}
      <div className="flex justify-center">
        <Badge tone={status === 'create' ? 'green' : 'blue'}>
          {status === 'create' ? 'will create' : 'will update'}
        </Badge>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          aria-label="Remove row"
          className="text-slate-300 transition-colors hover:text-red-500"
          onClick={onRemove}
        >
          <Icon name="close" className="!text-[14px]" />
        </button>
      </div>
    </div>
  );
}
