import type { Product } from '../../data/products';
import { getDb, isDbConfigured } from '../db/server';
import {
  estimatedFeatureMoneyCost,
  bestValuePackage,
  fmtMoney,
  intervalDiscount,
  lowestPlainMonthlyPrice,
  tierBillingOptions,
  type FeatureCostLike,
  type PlanTierLike,
  type CreditPackageLike,
} from '../pricing/calc';
import {
  ALLOWANCE_ROW_META,
  formatAllowanceCell,
  hasExplicitAllowances,
  resolvePlanAllowances,
} from '../pricing/planAllowances';
import { collectPricingStats } from '../pricing/statistics';
import {
  DEFAULT_USAGE_PROFILES,
  estimateProfile,
  profilesFromSnapshot,
  type UsageProfile,
} from '../pricing/usageScenarios';
import { getAuraAiDraftPricing } from './aura-ai-draft';
import {
  clampBarPct,
  computeHeroComparison,
  type PricingCompareRow,
  type PricingFeatureCostRow,
  type PricingPlanColumn,
  type PricingTabViewModel,
  type PricingUsageTier,
} from './types';

const FEATURE_META: Record<string, { label: string; icon: string; tone: PricingFeatureCostRow['tone'] }> = {
  standard_image: { label: 'Cost per image', icon: 'image', tone: 'pink' },
  premium_image: { label: 'Premium image', icon: 'photo', tone: 'pink' },
  standard_video: { label: 'Video (per second)', icon: 'videocam', tone: 'purple' },
  text_to_video: { label: 'Text-to-video', icon: 'videocam', tone: 'purple' },
  image_to_video: { label: 'Image-to-video', icon: 'movie', tone: 'purple' },
  voice_message: { label: 'Voice message', icon: 'mic', tone: 'blue' },
  voice_call: { label: 'Voice call', icon: 'call', tone: 'green' },
  premium_message: { label: 'Premium message', icon: 'chat', tone: 'amber' },
};

function moneyLabel(amount: number | null | undefined, currency = 'USD', approx = false): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  const formatted = fmtMoney(amount, currency);
  return approx ? `~${formatted}` : formatted;
}

function pctDiff(product: number, average: number): { label: string; tone: PricingCompareRow['diffTone'] } {
  if (!Number.isFinite(product) || !Number.isFinite(average) || average <= 0) {
    return { label: '—', tone: 'neutral' };
  }
  const pct = Math.round(((average - product) / average) * 100);
  if (Math.abs(pct) < 3) return { label: 'Similar', tone: 'neutral' };
  if (pct > 0) return { label: `${pct}% cheaper`, tone: 'better' };
  return { label: `${Math.abs(pct)}% more`, tone: 'worse' };
}

function collectAllowanceRowKeys(tiers: PlanTierLike[]): string[] {
  const present = new Set<string>();
  let anyExplicit = false;
  for (const tier of tiers) {
    if (hasExplicitAllowances(tier)) anyExplicit = true;
    for (const a of resolvePlanAllowances(tier)) {
      if (a.featureKey && a.featureKey !== 'other') present.add(a.featureKey);
    }
  }
  // Candy-style: only synthesized shared credits (or nothing) → legacy Credits/Included rows.
  if (!anyExplicit) {
    const onlyCredits =
      present.size === 0 || (present.size === 1 && present.has('shared_credits'));
    if (onlyCredits) return [];
  }
  const ordered = ALLOWANCE_ROW_META.filter((m) => present.has(m.key)).map((m) => m.key);
  for (const key of present) {
    if (!ordered.includes(key)) ordered.push(key);
  }
  return ordered;
}

function legacyCreditRows(
  tier: PlanTierLike,
  extra?: Array<{ label: string; value: string; included?: boolean }>,
): Array<{ label: string; value: string; included?: boolean }> {
  const included = Number(tier.includedTokens ?? 0);
  return [
    { label: 'Included credits', value: included > 0 ? `${included} / mo` : '—' },
    { label: 'Chat', value: 'Included', included: true },
    { label: 'Images', value: included > 0 ? 'Credits' : '—' },
    { label: 'Video', value: included > 0 ? 'Credits' : '—' },
    { label: 'Voice', value: included > 0 ? 'Credits' : '—' },
    ...(extra ?? []),
  ];
}

function allowanceRowsForTier(
  tier: PlanTierLike,
  rowKeys: string[],
  extra?: Array<{ label: string; value: string; included?: boolean }>,
): Array<{ label: string; value: string; included?: boolean }> {
  if (rowKeys.length === 0) return legacyCreditRows(tier, extra);
  const byKey = new Map(resolvePlanAllowances(tier).map((a) => [a.featureKey, a]));
  const rows = rowKeys.map((key) => {
    const meta = ALLOWANCE_ROW_META.find((m) => m.key === key);
    const label = meta?.label ?? key.replace(/_/g, ' ');
    const value = formatAllowanceCell(byKey.get(key));
    return {
      label,
      value,
      included: value === 'Included' || value === 'Unlimited' ? true : undefined,
    };
  });
  return extra ? [...rows, ...extra] : rows;
}

function buildPlansFromTiers(tiers: PlanTierLike[], currency: string): PricingPlanColumn[] {
  const active = tiers.filter((t) => t.active !== false);
  if (active.length === 0) return [];

  const rowKeys = collectAllowanceRowKeys(active);
  const namedTiers = active.filter((t) => String(t.name ?? '').trim());

  // 2+ active named tiers → one column per tier (monthly price + allowance cells).
  if (namedTiers.length >= 2) {
    return namedTiers.map((tier, index) => {
      const options = tierBillingOptions(tier).filter((o) => o.active !== false);
      const monthly = options.find((o) => o.interval === 'monthly') ?? options[0];
      const price =
        monthly?.interval === 'yearly' && monthly.price != null
          ? monthly.price / 12
          : monthly?.price;
      return {
        key: `${String(tier.name)}-${index}`,
        name: String(tier.name),
        priceLabel: moneyLabel(price, currency),
        priceSub: monthly?.interval === 'yearly' ? 'per month · billed yearly' : 'billed monthly',
        tone: index === 0 ? 'accent' : index === namedTiers.length - 1 ? 'green' : 'neutral',
        rows: allowanceRowsForTier(tier, rowKeys),
      };
    });
  }

  // Single tier (or unnamed): keep Monthly / Annual cadence columns.
  const columns: PricingPlanColumn[] = [];
  for (const tier of active) {
    const options = tierBillingOptions(tier).filter((o) => o.active !== false);
    const monthly = options.find((o) => o.interval === 'monthly');
    const yearly = options.find((o) => o.interval === 'yearly');

    if (monthly) {
      columns.push({
        key: `${tier.name ?? 'plan'}-monthly`,
        name: options.length > 1 ? 'Monthly' : String(tier.name ?? 'Monthly'),
        priceLabel: moneyLabel(monthly.price, currency),
        priceSub: 'billed monthly',
        tone: 'accent',
        rows: allowanceRowsForTier(tier, rowKeys),
      });
    }

    if (yearly && monthly) {
      const perMonth = yearly.price / 12;
      const discount = intervalDiscount(monthly.price, yearly);
      columns.push({
        key: `${tier.name ?? 'plan'}-yearly`,
        name: 'Annual',
        priceLabel: moneyLabel(perMonth, currency),
        priceSub: 'per month · billed yearly',
        badge: discount && discount >= 15 ? 'Best value' : undefined,
        tone: 'green',
        rows: allowanceRowsForTier(tier, rowKeys, [
          {
            label: 'Annual discount',
            value: discount != null ? `${discount}% off` : '—',
          },
        ]),
      });
    }
  }

  return columns;
}

function buildFeatureRows(
  costs: FeatureCostLike[],
  packages: CreditPackageLike[],
  currency: string,
): PricingFeatureCostRow[] {
  const best = bestValuePackage(packages);
  const seen = new Set<string>();
  const rows: PricingFeatureCostRow[] = [];

  for (const cost of costs) {
    if (cost.active === false) continue;
    const type = String(cost.featureType ?? '');
    if (!type || seen.has(type)) continue;
    const meta = FEATURE_META[type];
    if (!meta) continue;
    seen.add(type);

    let value = '—';
    if (best) {
      const money = estimatedFeatureMoneyCost(best, cost);
      if (money) {
        const unit = String(cost.unit ?? '');
        const suffix =
          unit === 'per_minute'
            ? ' / min'
            : unit === 'per_second'
              ? ' / sec'
              : unit === 'per_image'
                ? ''
                : unit === 'per_message'
                  ? ' / msg'
                  : '';
        value =
          money.min === money.max
            ? `${moneyLabel(money.min, currency)}${suffix}`
            : `${moneyLabel(money.min, currency)}–${moneyLabel(money.max, currency)}${suffix}`;
      }
    }
    rows.push({ key: type, label: meta.label, value, icon: meta.icon, tone: meta.tone });
  }

  return rows;
}

function buildUsageTiers(
  profiles: UsageProfile[],
  tiers: PlanTierLike[],
  costs: FeatureCostLike[],
  packages: CreditPackageLike[],
  currency: string,
  fallbacks: Record<string, number | null>,
  referencePlanName?: string | null,
): PricingUsageTier[] {
  const toneById = {
    casual: { title: 'Light use', icon: 'eco', tone: 'green' as const },
    regular: { title: 'Regular use', icon: 'star', tone: 'amber' as const },
    power: { title: 'Heavy use', icon: 'local_fire_department', tone: 'red' as const },
  };

  return profiles.map((profile) => {
    const est = estimateProfile(profile, tiers, costs, packages, referencePlanName);
    const monthly =
      est.totalMonthly ??
      fallbacks[profile.id] ??
      null;
    const meta = toneById[profile.id];
    return {
      id: profile.id,
      title: meta.title,
      description: profile.description,
      icon: meta.icon,
      tone: meta.tone,
      monthlyCost: monthly,
      costLabel: monthly != null ? `~${moneyLabel(monthly, currency)}/mo` : '—',
    };
  });
}

async function loadLivePricing(product: Product): Promise<PricingTabViewModel | null> {
  if (!isDbConfigured()) return null;

  const db = getDb();
  const { products } = await db.query({
    products: {
      $: { where: { slug: product.slug } },
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
      pricingSnapshots: {},
    },
  });

  const row = (products as any[])?.[0];
  if (!row) return null;

  const tiers = ((row.subscriptionPlans ?? []) as PlanTierLike[]).filter((t) => t.active !== false);
  const packages = ((row.creditPackages ?? []) as CreditPackageLike[]).filter((p) => p.active !== false);
  const costs = ((row.featureCosts ?? []) as FeatureCostLike[]).filter(
    (c) => c.active !== false && (c.creditCost || c.minCost || c.maxCost),
  );
  const snapshot = ((row.pricingSnapshots ?? []) as any[]).find((s) => s.status === 'active')
    ?? ((row.pricingSnapshots ?? []) as any[])[0];
  const profiles = snapshot?.usageScenarios
    ? profilesFromSnapshot(snapshot.usageScenarios)
    : DEFAULT_USAGE_PROFILES.map((p) => ({ ...p }));

  const currency = String(row.priceCurrency ?? 'USD');
  const advertised =
    lowestPlainMonthlyPrice(tiers)
    ?? (row.minMonthlyPrice != null ? Number(row.minMonthlyPrice) : null);
  const typical =
    row.typicalMonthlyCost != null && Number.isFinite(Number(row.typicalMonthlyCost))
      ? Number(row.typicalMonthlyCost)
      : null;

  // Not enough structured data to build a live tab — caller should use draft.
  if (tiers.length === 0 && advertised == null) return null;

  const draft = product.slug === 'aura-ai' ? getAuraAiDraftPricing(product) : null;
  const referencePlanName =
    snapshot?.referencePlanName != null ? String(snapshot.referencePlanName) : null;
  const plans = buildPlansFromTiers(tiers, currency);
  const featureCosts = buildFeatureRows(costs, packages, currency);
  const usageTiers = buildUsageTiers(
    profiles,
    tiers,
    costs,
    packages,
    currency,
    {
      casual: draft?.usageTiers.find((t) => t.id === 'casual')?.monthlyCost ?? advertised,
      regular: typical ?? draft?.usageTiers.find((t) => t.id === 'regular')?.monthlyCost ?? null,
      power: draft?.usageTiers.find((t) => t.id === 'power')?.monthlyCost ?? null,
    },
    referencePlanName,
  );

  const regularUse =
    usageTiers.find((t) => t.id === 'regular')?.monthlyCost
    ?? typical
    ?? draft?.regularUseMonthly
    ?? null;

  const stats = await collectPricingStats();
  const categoryAvgSubscription = stats.averageMonthlyPrice;
  const categoryAvgMonthly =
    draft?.categoryAvgMonthly
    ?? (categoryAvgSubscription != null ? Math.round(categoryAvgSubscription * 2.1 * 100) / 100 : null);

  const pricingCat = product.categories.find((c) => c.key === 'pricing');
  const pricingScore = pricingCat?.score ?? null;
  const scoreLabel =
    pricingScore == null
      ? 'Pending'
      : pricingScore >= 7
        ? 'Good value'
        : pricingScore >= 5.5
          ? 'Fair value'
          : 'Poor value';

  const resolvedAdvertised = advertised ?? draft?.advertisedMonthly ?? null;
  const resolvedAvg = categoryAvgMonthly ?? draft?.categoryAvgMonthly ?? null;
  const { cheaperPct, savings } = computeHeroComparison(resolvedAdvertised, resolvedAvg);

  const barMin = 0;
  const barMax = 80;

  const compareRows: PricingCompareRow[] = [];
  if (advertised != null && categoryAvgSubscription != null) {
    const diff = pctDiff(advertised, categoryAvgSubscription);
    compareRows.push({
      metric: 'Subscription price',
      productValue: `${moneyLabel(advertised, currency)}/mo`,
      averageValue: `${moneyLabel(categoryAvgSubscription, currency)}/mo`,
      diffLabel: diff.label,
      diffTone: diff.tone,
    });
  }
  if (regularUse != null && categoryAvgMonthly != null) {
    const diff = pctDiff(regularUse, categoryAvgMonthly);
    compareRows.push({
      metric: 'Regular-use cost',
      productValue: `~${moneyLabel(regularUse, currency)}/mo`,
      averageValue: `~${moneyLabel(categoryAvgMonthly, currency)}/mo`,
      diffLabel: diff.label,
      diffTone: diff.tone,
    });
  }

  // Prefer computed feature rows; fill gaps from draft for Aura.
  const mergedFeatures =
    featureCosts.length > 0
      ? featureCosts
      : draft?.featureCosts ?? [];

  if (draft) {
    for (const row of draft.compareRows) {
      if (!compareRows.some((r) => r.metric === row.metric)) {
        compareRows.push(row);
      }
    }
  }

  const powerUserMonthly =
    usageTiers.find((t) => t.id === 'power')?.monthlyCost ?? null;

  const isDraft =
    plans.length < 2
    || featureCosts.length === 0
    || usageTiers.some((t) => t.monthlyCost == null);

  const priceLabel =
    resolvedAdvertised != null ? moneyLabel(resolvedAdvertised, currency) : null;
  const avgLabel = resolvedAvg != null ? `~${moneyLabel(resolvedAvg, currency)}` : null;

  return {
    productSlug: product.slug,
    productName: product.name,
    updatedLabel: draft?.updatedLabel ?? 'August 2026',
    isDraft: isDraft || Boolean(draft?.isDraft),
    currency,
    pricingScore,
    scoreLabel,
    scoreInsight:
      draft?.scoreInsight
      ?? (priceLabel && avgLabel
        ? `${scoreLabel} — ${product.name}’s ${priceLabel} monthly price is well below the ${avgLabel} category average.`
        : `${product.name} pricing compared against our tested category averages.`),
    scoreCaveat: draft?.scoreCaveat ?? 'Media-heavy usage can increase the real monthly cost.',
    advertisedMonthly: resolvedAdvertised,
    regularUseMonthly: regularUse,
    pricingModel: snapshot?.pricingModel != null ? String(snapshot.pricingModel) : null,
    powerUserMonthly,
    categoryAvgMonthly: resolvedAvg,
    reviewedAppCount: draft?.reviewedAppCount ?? (stats.sampleSize || null),
    heroCheaperPct: cheaperPct,
    heroSavings: savings,
    heroCheaperThanPct: draft?.heroCheaperThanPct ?? null,
    barMin,
    barMax,
    productBarPct:
      resolvedAdvertised != null ? clampBarPct(resolvedAdvertised, barMin, barMax) : null,
    avgBarPct: resolvedAvg != null ? clampBarPct(resolvedAvg, barMin, barMax) : null,
    plans: plans.length > 0 ? (draft && plans.length < 2 ? draft.plans : plans) : draft?.plans ?? [],
    usageTiers,
    advertisedVsRegularDiff:
      advertised != null && regularUse != null ? Math.round((regularUse - advertised) * 100) / 100 : null,
    featureCosts: mergedFeatures,
    compareRows: compareRows.length > 0 ? compareRows : draft?.compareRows ?? [],
  };
}

export async function loadPricingTabViewModel(product: Product): Promise<PricingTabViewModel> {
  try {
    const live = await loadLivePricing(product);
    if (live) return live;
  } catch {
    // Fall through to draft / empty.
  }

  if (product.slug === 'aura-ai') {
    return getAuraAiDraftPricing(product);
  }

  // Minimal empty shell for other products until pricing data exists.
  const pricingCat = product.categories.find((c) => c.key === 'pricing');
  return {
    productSlug: product.slug,
    productName: product.name,
    updatedLabel: '—',
    isDraft: true,
    currency: 'USD',
    pricingScore: pricingCat?.score ?? null,
    scoreLabel: 'Pending',
    scoreInsight: 'Pricing details for this review are still being verified.',
    scoreCaveat: null,
    advertisedMonthly: null,
    regularUseMonthly: null,
    pricingModel: null,
    powerUserMonthly: null,
    categoryAvgMonthly: null,
    reviewedAppCount: null,
    heroCheaperPct: null,
    heroSavings: null,
    heroCheaperThanPct: null,
    barMin: 0,
    barMax: 100,
    productBarPct: null,
    avgBarPct: null,
    plans: [],
    usageTiers: [],
    advertisedVsRegularDiff: null,
    featureCosts: [],
    compareRows: [],
  };
}
