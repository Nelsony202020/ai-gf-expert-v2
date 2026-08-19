import type { Product } from '../../data/products';
import { getDb, isDbConfigured } from '../db/server';
import {
  estimatedFeatureMoneyCost,
  bestValuePackage,
  featureCostAvailability,
  formatCreditPoolUsesCell,
  fmtMoney,
  intervalDiscount,
  lowestPlainMonthlyPrice,
  pricePerCredit,
  tierBillingOptions,
  type FeatureCostLike,
  type PlanTierLike,
  type CreditPackageLike,
} from '../pricing/calc';
import {
  ALLOWANCE_ROW_META,
  findAllowance,
  formatAllowanceCell,
  hasExplicitAllowances,
  resolvePlanAllowances,
} from '../pricing/planAllowances';
import { collectPricingStats } from '../pricing/statistics';
import {
  DEFAULT_USAGE_PROFILES,
  estimateProfile,
  buildUsageCalculation,
  profilesFromSnapshot,
  type UsageProfile,
} from '../pricing/usageScenarios';
import { getAuraAiDraftPricing } from './aura-ai-draft';
import {
  buildBillingToggle,
  buildCreditPool,
  buildLimitRows,
  buildPlansIntro,
  buildTopUps,
  finalizePlanColumns,
} from './planPresentation';
import { draftPricingEvidence, resolvePricingEvidence } from './pricingEvidence';
import {
  buildCompareIntro,
  buildFeatureCostsIntro,
  buildHermanTake,
  buildMarketIntro,
  buildPageIntro,
  buildUsageIntro,
  freeVsPaidHeading,
} from './sectionCopy';
import {
  clampBarPct,
  computeHeroComparison,
  type PricingCompareRow,
  type PricingFeatureCostRow,
  type PricingPlanBillingOption,
  type PricingPlanColumn,
  type PricingPlanSale,
  type PricingTabViewModel,
  type PricingUsageTier,
} from './types';

const FEATURE_META: Record<string, { label: string; icon: string; tone: PricingFeatureCostRow['tone']; order: number }> = {
  standard_image: { label: 'Price per image generation', icon: 'image', tone: 'neutral', order: 10 },
  premium_image: { label: 'Price per premium image', icon: 'photo', tone: 'neutral', order: 11 },
  standard_video: { label: 'Price per 10s video', icon: 'videocam', tone: 'neutral', order: 20 },
  text_to_video: { label: 'Price per text-to-video (10s)', icon: 'videocam', tone: 'neutral', order: 21 },
  image_to_video: { label: 'Price per image-to-video (10s)', icon: 'movie', tone: 'neutral', order: 22 },
  voice_message: { label: 'Price per voice message', icon: 'mic', tone: 'neutral', order: 30 },
  voice_call: { label: 'Price per phone call', icon: 'call', tone: 'neutral', order: 40 },
  premium_message: { label: 'Price per premium message', icon: 'chat', tone: 'neutral', order: 50 },
  character_creation: { label: 'Custom character cost', icon: 'person_edit', tone: 'neutral', order: 60 },
  custom_character: { label: 'Custom character cost', icon: 'person_edit', tone: 'neutral', order: 61 },
  custom_ai: { label: 'Custom character cost', icon: 'person_edit', tone: 'neutral', order: 62 },
};

function pickPricedFeatureCost(
  costs: FeatureCostLike[],
  ...types: string[]
): FeatureCostLike | undefined {
  const matches = costs.filter(
    (c) => c.active !== false && types.includes(String(c.featureType ?? '')),
  );
  return (
    matches.find((c) => featureCostAvailability(c) === 'priced')
    ?? matches[0]
  );
}

function chatCellForTier(tier: PlanTierLike): { value: string } {
  const allowances = resolvePlanAllowances(tier);
  const messages = findAllowance(allowances, ['messages']);
  if (messages?.accessType === 'unlimited') {
    return { value: 'Unlimited' };
  }
  if (messages?.accessType === 'included_quantity' && messages.quantity != null) {
    const reset =
      messages.resetInterval === 'day'
        ? '/day'
        : messages.resetInterval === 'month' || messages.resetInterval === 'billing_cycle'
          ? '/mo'
          : '';
    return { value: `${messages.quantity} msgs${reset}` };
  }
  if (messages?.accessType === 'included_unspecified') {
    return { value: 'Included' };
  }
  if (messages?.accessType === 'not_included') {
    return { value: 'Not included' };
  }

  const unlimited = Array.isArray(tier.unlimitedFeatures)
    ? tier.unlimitedFeatures.some((f) => /chat|message/i.test(String(f)))
    : false;
  if (unlimited) return { value: 'Unlimited' };

  // Paid credit subscriptions typically include unlimited chat.
  if (Number(tier.includedTokens ?? 0) > 0) {
    return { value: 'Unlimited' };
  }

  return { value: 'Limited' };
}

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
  costs: FeatureCostLike[],
  extra?: Array<{ label: string; value: string; tip?: string; sublabel?: string }>,
): Array<{ label: string; value: string; tip?: string; sublabel?: string }> {
  const included = Number(tier.includedTokens ?? 0);
  const chat = chatCellForTier(tier);
  const imageCost = pickPricedFeatureCost(costs, 'standard_image');
  const videoCost = pickPricedFeatureCost(costs, 'standard_video', 'text_to_video', 'image_to_video');
  const voiceMsgCost = pickPricedFeatureCost(costs, 'voice_message');
  const voiceCallCost = pickPricedFeatureCost(costs, 'voice_call');
  const characterCost = pickPricedFeatureCost(costs, 'character_creation', 'custom_character');

  const images = included > 0 ? formatCreditPoolUsesCell(included, imageCost, 'image') : { value: '—' };
  const videos = included > 0 ? formatCreditPoolUsesCell(included, videoCost, 'video') : { value: '—' };
  const voiceMessages =
    included > 0 ? formatCreditPoolUsesCell(included, voiceMsgCost, 'voice_message') : { value: '—' };
  const voiceCalls =
    included > 0 ? formatCreditPoolUsesCell(included, voiceCallCost, 'voice_call') : { value: '—' };
  const characters =
    included > 0 && characterCost
      ? formatCreditPoolUsesCell(included, characterCost, 'character_creation')
      : null;

  const rows: Array<{ label: string; value: string; tip?: string; sublabel?: string }> = [
    { label: 'Included credits', value: included > 0 ? `${included}/mo` : '—' },
    { label: 'Chat', value: chat.value },
    { label: 'Images', value: images.value },
    {
      label: 'Video',
      value: videos.value,
      sublabel: videos.sublabel,
    },
    {
      label: 'Voice messages',
      value: voiceMessages.value,
    },
    { label: 'Voice calls', value: voiceCalls.value },
  ];

  if (characters && characters.value !== '—') {
    rows.push({ label: 'Custom character', value: characters.value });
  }

  return extra ? [...rows, ...extra] : rows;
}

function allowanceRowsForTier(
  tier: PlanTierLike,
  rowKeys: string[],
  costs: FeatureCostLike[],
  extra?: Array<{ label: string; value: string; tip?: string; sublabel?: string }>,
): Array<{ label: string; value: string; tip?: string; sublabel?: string }> {
  if (rowKeys.length === 0) return legacyCreditRows(tier, costs, extra);
  const byKey = new Map(resolvePlanAllowances(tier).map((a) => [a.featureKey, a]));
  const rows = rowKeys.map((key) => {
    const meta = ALLOWANCE_ROW_META.find((m) => m.key === key);
    const label = meta?.label ?? key.replace(/_/g, ' ');
    let value = formatAllowanceCell(byKey.get(key));
    // Prefer words over bare checkmarks / yes flags.
    if (value === '✓' || value === 'Yes') value = 'Included';
    return { label, value };
  });
  return extra ? [...rows, ...extra] : rows;
}

function isFreeTier(tier: PlanTierLike, name: string): boolean {
  if (/free|trial|guest/i.test(name)) return true;
  const options = tierBillingOptions(tier).filter((o) => o.active !== false);
  if (options.length === 0) return /free/i.test(name);
  return options.every((o) => Number(o.price) === 0);
}

function buildBillingOption(
  interval: 'monthly' | 'quarterly' | 'yearly',
  option: {
    price: number;
    currency?: string;
    interval?: string;
    introPrice?: number | null;
    introDuration?: string | null;
  } | null | undefined,
  monthlyPrice: number | null,
  currency: string,
  saleHint: PricingPlanSale | null = null,
): PricingPlanBillingOption | null {
  if (!option || !Number.isFinite(option.price)) return null;

  const listPrice = option.price;
  const intro =
    option.introPrice != null && Number.isFinite(option.introPrice) && option.introPrice < listPrice
      ? option.introPrice
      : null;
  const effective = intro ?? listPrice;

  let sale: PricingPlanSale | null = saleHint;
  if (!sale && intro != null) {
    const pct = Math.round(((listPrice - intro) / listPrice) * 100);
    sale = {
      listPriceLabel: moneyLabel(listPrice, currency),
      badge: pct > 0 ? `${pct}% OFF` : 'Sale',
      note: option.introDuration ? `Promo price · ${option.introDuration}` : 'Promo price',
    };
  }

  if (interval === 'monthly') {
    return {
      interval: 'monthly',
      monthlyPrice: effective,
      monthlyPriceLabel: moneyLabel(effective, currency),
      periodPrice: effective,
      periodPriceLabel: null,
      priceSub: 'Billed monthly',
      savingsPercent: null,
      savingsLabel: null,
      sale:
        sale && intro != null
          ? {
              ...sale,
              listPriceLabel: moneyLabel(listPrice, currency),
            }
          : sale,
    };
  }

  const months = interval === 'quarterly' ? 3 : 12;
  const perMonth = Math.round((effective / months) * 100) / 100;
  const listPerMonth = Math.round((listPrice / months) * 100) / 100;
  const savings =
    monthlyPrice != null && monthlyPrice > 0
      ? intervalDiscount(monthlyPrice, {
          interval,
          price: effective,
          currency,
          active: true,
        })
      : null;
  const billedLabel =
    interval === 'quarterly'
      ? `${moneyLabel(effective, currency)} billed every 3 months`
      : `${moneyLabel(effective, currency)} billed yearly`;

  return {
    interval,
    monthlyPrice: perMonth,
    monthlyPriceLabel: moneyLabel(perMonth, currency),
    periodPrice: effective,
    periodPriceLabel: moneyLabel(effective, currency),
    priceSub: billedLabel,
    savingsPercent: savings,
    savingsLabel: savings != null && savings > 0 ? `Save ${Math.round(savings)}%` : null,
    sale:
      sale && intro != null
        ? {
            ...sale,
            listPriceLabel: moneyLabel(listPerMonth, currency),
          }
        : sale,
  };
}

function promotionSaleForPlan(
  planName: string,
  promotions: Array<{
    status?: string;
    promotionType?: string;
    discountPercent?: number | null;
    endAt?: number | null;
    publicNote?: string | null;
    appliesToPlanNames?: string[] | null;
  }>,
): PricingPlanSale | null {
  const now = Date.now();
  const match = promotions.find((p) => {
    if (String(p.status ?? '') !== 'active') return false;
    if (!['plan_discount', 'holiday', 'coupon', 'custom'].includes(String(p.promotionType ?? ''))) {
      return false;
    }
    const names = p.appliesToPlanNames;
    if (names && names.length > 0) {
      return names.some((n) => n.toLowerCase() === planName.toLowerCase());
    }
    return true;
  });
  if (!match) return null;
  const pct = match.discountPercent != null ? Math.round(Number(match.discountPercent)) : null;
  let badge = pct != null && pct > 0 ? `${pct}% OFF` : 'Sale';
  if (match.endAt != null && Number.isFinite(match.endAt)) {
    const end = new Date(Number(match.endAt));
    if (end.getTime() >= now) {
      const label = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      badge = `${badge} · Ends ${label}`;
    }
  }
  return {
    listPriceLabel: '',
    badge,
    note: match.publicNote?.trim() || 'Promo price',
  };
}

function buildPlansFromTiers(
  tiers: PlanTierLike[],
  costs: FeatureCostLike[],
  currency: string,
  promotions: Array<{
    status?: string;
    promotionType?: string;
    discountPercent?: number | null;
    endAt?: number | null;
    publicNote?: string | null;
    appliesToPlanNames?: string[] | null;
  }> = [],
): PricingPlanColumn[] {
  const active = tiers.filter((t) => t.active !== false);
  if (active.length === 0) return [];

  const rowKeys = collectAllowanceRowKeys(active);
  const namedTiers = active.filter((t) => String(t.name ?? '').trim());
  const source = namedTiers.length > 0 ? namedTiers : active;

  const columns: PricingPlanColumn[] = source.map((tier, index) => {
    const name = String(tier.name ?? `Plan ${index + 1}`).trim() || `Plan ${index + 1}`;
    const free = isFreeTier(tier, name);
    const options = tierBillingOptions(tier).filter((o) => o.active !== false);
    const monthlyOpt = options.find((o) => o.interval === 'monthly') ?? null;
    const quarterlyOpt = options.find((o) => o.interval === 'quarterly') ?? null;
    const yearlyOpt = options.find((o) => o.interval === 'yearly') ?? null;
    const monthlyPrice = monthlyOpt?.price ?? null;
    const saleHint = free ? null : promotionSaleForPlan(name, promotions);

    const monthly = free
      ? null
      : buildBillingOption('monthly', monthlyOpt, monthlyPrice, currency, saleHint);
    const quarterly = free
      ? null
      : buildBillingOption('quarterly', quarterlyOpt, monthlyPrice, currency, saleHint);
    const yearly = free
      ? null
      : buildBillingOption('yearly', yearlyOpt, monthlyPrice, currency, saleHint);

    const defaultBilling = monthly ?? quarterly ?? yearly;
    const priceLabel = free
      ? moneyLabel(0, currency)
      : defaultBilling?.monthlyPriceLabel ?? '—';
    const priceSub = free
      ? 'Try before paying'
      : defaultBilling?.priceSub;

    return {
      key: `${name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      name: free ? 'Free' : name,
      displayName: free ? 'Free' : name,
      isFree: free,
      isRecommended: false,
      priceLabel,
      priceSub,
      summaryLine: free ? 'Limited daily usage' : 'Paid plan',
      includedCredits: null,
      tone: 'neutral' as const,
      billing: free ? null : { monthly, quarterly, yearly },
      rows: allowanceRowsForTier(tier, rowKeys, costs),
    };
  });

  // Paid first, free last — matches the comparison template.
  columns.sort((a, b) => Number(a.isFree) - Number(b.isFree));

  const paid = columns.filter((c) => !c.isFree);
  if (paid.length === 1) {
    paid[0].isRecommended = true;
  } else if (paid.length > 1) {
    const mid = paid[Math.min(1, paid.length - 1)];
    mid.isRecommended = true;
  }

  return finalizePlanColumns(columns);
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
    if (featureCostAvailability(cost) !== 'priced') continue;
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
        const isVideoPerSecond = unit === 'per_second' || type.includes('video');
        const isVoiceMsgPerMinute = unit === 'per_minute' && type === 'voice_message';
        const displayMultiplier = isVideoPerSecond
          ? (Number(cost.durationProduced) > 0 ? Number(cost.durationProduced) : 10)
          : isVoiceMsgPerMinute
            ? 10 / 60
            : 1;
        const scaled = {
          min: money.min * displayMultiplier,
          max: money.max * displayMultiplier,
        };
        const suffix =
          unit === 'per_minute' && type === 'voice_call'
            ? ' / min'
            : unit === 'per_message' || type === 'voice_message'
              ? ' / msg'
              : type === 'character_creation' ||
                  type === 'custom_character' ||
                  type === 'custom_ai' ||
                  unit === 'per_character'
                ? ' / character'
                : '';
        value =
          scaled.min === scaled.max
            ? scaled.min > 0 && scaled.min < 0.01
              ? `<${moneyLabel(0.01, currency)}${suffix}`
              : `${moneyLabel(scaled.min, currency)}${suffix}`
            : `${moneyLabel(scaled.min, currency)}–${moneyLabel(scaled.max, currency)}${suffix}`;
      }
    }
    rows.push({ key: type, label: meta.label, value, icon: meta.icon, tone: meta.tone });
  }

  rows.sort((a, b) => {
    const ao = FEATURE_META[a.key]?.order ?? 999;
    const bo = FEATURE_META[b.key]?.order ?? 999;
    return ao - bo;
  });
  return rows;
}

function formatAssumptionRate(perDay: number, unit = 'day'): string {
  if (!Number.isFinite(perDay) || perDay <= 0) return 'None';
  if (perDay < 1) return 'Occasional';
  const rounded = Number.isInteger(perDay) ? String(perDay) : String(Math.round(perDay * 10) / 10);
  return `${rounded}/${unit}`;
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
  const metaById = {
    casual: {
      title: 'Light use',
      shortLabel: 'Mostly chat',
      description: 'Mostly chat with occasional media.',
      icon: 'eco',
      tone: 'neutral' as const,
    },
    regular: {
      title: 'Regular use',
      shortLabel: 'Typical daily use',
      description: 'Typical daily use across chat, images, and some video.',
      icon: 'star',
      tone: 'neutral' as const,
    },
    power: {
      title: 'Heavy use',
      shortLabel: 'Heavy media use',
      description: 'Frequent image and video generation.',
      icon: 'local_fire_department',
      tone: 'neutral' as const,
    },
  };

  return profiles.map((profile) => {
    const est = estimateProfile(profile, tiers, costs, packages, referencePlanName);
    const monthly =
      est.totalMonthly ??
      fallbacks[profile.id] ??
      null;
    const meta = metaById[profile.id as keyof typeof metaById] ?? {
      title: profile.title,
      shortLabel: profile.title,
      description: profile.description,
      icon: 'star',
      tone: 'neutral' as const,
    };
    const planCost =
      est.planCost
      ?? (monthly != null && est.topUpCost != null ? Math.round((monthly - est.topUpCost) * 100) / 100 : null);
    const topUpCost =
      est.topUpCost
      ?? (monthly != null && planCost != null ? Math.round((monthly - planCost) * 100) / 100 : null);

    const calculation = buildUsageCalculation(
      profile,
      tiers,
      costs,
      packages,
      currency,
      referencePlanName,
      meta.title.toLowerCase(),
    );

    return {
      id: profile.id,
      title: meta.title,
      shortLabel: meta.shortLabel,
      description: meta.description,
      icon: meta.icon,
      tone: meta.tone,
      monthlyCost: monthly,
      costLabel: monthly != null ? `~${moneyLabel(monthly, currency)}/mo` : '—',
      planCost,
      topUpCost,
      assumptions: {
        chat: profile.messagesPerDay > 0 ? 'Daily' : 'None',
        images: formatAssumptionRate(profile.imagesPerDay),
        videos: formatAssumptionRate(profile.videosPerDay),
        voice:
          profile.voiceMinutesPerDay <= 0
            ? 'None'
            : profile.voiceMinutesPerDay < 1
              ? 'Occasional'
              : `~${Math.round(profile.voiceMinutesPerDay * 10) / 10} min/day`,
        character:
          profile.id === 'casual' ? 'None' : profile.id === 'regular' ? '~1/mo' : '~3/mo',
      },
      calculation,
    };
  });
}

async function loadProductPricingBundle(slug: string): Promise<{
  tiers: PlanTierLike[];
  packages: CreditPackageLike[];
  costs: FeatureCostLike[];
  promotions: Array<{
    status?: string;
    promotionType?: string;
    discountPercent?: number | null;
    endAt?: number | null;
    publicNote?: string | null;
    appliesToPlanNames?: string[] | null;
  }>;
  snapshot: any | null;
  minMonthlyPrice: number | null;
  typicalMonthlyCost: number | null;
  priceCurrency: string;
} | null> {
  if (!isDbConfigured()) return null;
  const db = getDb();
  const { products } = await db.query({
    products: {
      $: { where: { slug } },
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
      pricingSnapshots: {},
      pricingPromotions: {},
    },
  });
  const row = (products as any[])?.[0];
  if (!row) return null;

  const costs = ((row.featureCosts ?? []) as FeatureCostLike[]).filter(
    (c) => c.active !== false && featureCostAvailability(c) === 'priced',
  );

  return {
    tiers: ((row.subscriptionPlans ?? []) as PlanTierLike[]).filter((t) => t.active !== false),
    packages: ((row.creditPackages ?? []) as CreditPackageLike[]).filter((p) => p.active !== false),
    costs,
    promotions: (row.pricingPromotions ?? []) as Array<{
      status?: string;
      promotionType?: string;
      discountPercent?: number | null;
      endAt?: number | null;
      publicNote?: string | null;
      appliesToPlanNames?: string[] | null;
    }>,
    snapshot:
      ((row.pricingSnapshots ?? []) as any[]).find((s) => s.status === 'active')
      ?? ((row.pricingSnapshots ?? []) as any[])[0]
      ?? null,
    minMonthlyPrice:
      row.minMonthlyPrice != null && Number.isFinite(Number(row.minMonthlyPrice))
        ? Number(row.minMonthlyPrice)
        : null,
    typicalMonthlyCost:
      row.typicalMonthlyCost != null && Number.isFinite(Number(row.typicalMonthlyCost))
        ? Number(row.typicalMonthlyCost)
        : null,
    priceCurrency: String(row.priceCurrency ?? 'USD'),
  };
}

async function loadLivePricing(product: Product): Promise<PricingTabViewModel | null> {
  if (!isDbConfigured()) return null;

  const own = await loadProductPricingBundle(product.slug);
  if (!own) return null;

  let tiers = own.tiers;
  let packages = own.packages;
  let costs = own.costs;
  let snapshot = own.snapshot;
  let borrowedFromCandy = false;
  /** When Aura borrows Candy pricing, evidence should come from Candy too. */
  let evidenceSnapshot = own.snapshot;
  let evidencePackages = own.packages;
  let evidencePlans = own.tiers;

  // Aura InstantDB is still incomplete — borrow live Candy AI pricing entities for the public tab.
  if (product.slug === 'aura-ai') {
    const needsReference =
      packages.length === 0
      || costs.length === 0
      || !tiers.some((t) => Number(t.includedTokens ?? 0) > 0);
    if (needsReference) {
      const candy = await loadProductPricingBundle('candy-ai');
      if (candy) {
        if (packages.length === 0 && candy.packages.length > 0) {
          packages = candy.packages;
          borrowedFromCandy = true;
        }
        if (costs.length === 0 && candy.costs.length > 0) {
          costs = candy.costs;
          borrowedFromCandy = true;
        }
        if (
          !tiers.some((t) => Number(t.includedTokens ?? 0) > 0)
          && candy.tiers.length > 0
        ) {
          tiers = candy.tiers;
          borrowedFromCandy = true;
        }
        if (!snapshot && candy.snapshot) {
          snapshot = candy.snapshot;
        }
        if (borrowedFromCandy) {
          evidenceSnapshot = candy.snapshot ?? snapshot;
          evidencePackages = candy.packages.length > 0 ? candy.packages : packages;
          evidencePlans = candy.tiers.length > 0 ? candy.tiers : tiers;
        }
      }
    }
  }

  const profiles = snapshot?.usageScenarios
    ? profilesFromSnapshot(snapshot.usageScenarios)
    : DEFAULT_USAGE_PROFILES.map((p) => ({ ...p }));

  const currency = own.priceCurrency;
  const advertised =
    lowestPlainMonthlyPrice(tiers)
    ?? own.minMonthlyPrice;
  const typical = own.typicalMonthlyCost;

  // Not enough structured data to build a live tab — caller should use draft.
  if (tiers.length === 0 && advertised == null) return null;

  const draft = product.slug === 'aura-ai' ? getAuraAiDraftPricing(product) : null;
  const referencePlanName =
    snapshot?.referencePlanName != null ? String(snapshot.referencePlanName) : null;
  let plans = buildPlansFromTiers(tiers, costs, currency, own.promotions);

  // Keep Aura's free-plan column from draft when live/Candy data is paid-only.
  if (draft && !plans.some((p) => p.isFree || /free/i.test(p.key) || /free/i.test(p.name))) {
    const freeCol = draft.plans.find((p) => p.isFree || /free/i.test(p.key) || /free/i.test(p.name));
    if (freeCol) {
      plans = finalizePlanColumns([...plans.filter((p) => !p.isFree), freeCol]);
    }
  }

  const billingToggle = buildBillingToggle(plans);
  const bestPkg = bestValuePackage(packages);
  const ratePerCredit = bestPkg ? pricePerCredit(bestPkg) : null;
  const creditPool =
    buildCreditPool(plans, costs, { ratePerCredit, currency }) ?? draft?.creditPool ?? null;
  const computedLimitRows = buildLimitRows(plans);
  const limitRows = computedLimitRows.length > 0 ? computedLimitRows : draft?.limitRows ?? [];
  const topUps = buildTopUps(packages, currency) ?? draft?.topUps ?? null;
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
  const resolvedAvgSubscription =
    categoryAvgSubscription
    ?? draft?.categoryAvgSubscription
    ?? null;
  // Like-for-like: regular-use estimate vs category average regular-use cost
  const { cheaperPct, savings } = computeHeroComparison(regularUse, resolvedAvg);

  const barMin = 0;
  const barMax = 80;

  const lightUse = usageTiers.find((t) => t.id === 'casual')?.monthlyCost ?? null;
  const powerUserMonthly =
    usageTiers.find((t) => t.id === 'power')?.monthlyCost ?? null;

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

  const scaleAvg = (productCost: number | null): number | null => {
    if (productCost == null || regularUse == null || regularUse <= 0 || categoryAvgMonthly == null) {
      return null;
    }
    return Math.round(categoryAvgMonthly * (productCost / regularUse) * 100) / 100;
  };

  const categoryAvgLight = scaleAvg(lightUse);
  const categoryAvgPower = scaleAvg(powerUserMonthly);

  if (lightUse != null && categoryAvgLight != null) {
    const diff = pctDiff(lightUse, categoryAvgLight);
    compareRows.push({
      metric: 'Light-use cost',
      productValue: `~${moneyLabel(lightUse, currency)}/mo`,
      averageValue: `~${moneyLabel(categoryAvgLight, currency)}/mo`,
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
  if (powerUserMonthly != null && categoryAvgPower != null) {
    const diff = pctDiff(powerUserMonthly, categoryAvgPower);
    compareRows.push({
      metric: 'Power-user cost',
      productValue: `~${moneyLabel(powerUserMonthly, currency)}/mo`,
      averageValue: `~${moneyLabel(categoryAvgPower, currency)}/mo`,
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

  const isDraft =
    borrowedFromCandy
    || plans.length < 2
    || featureCosts.length === 0
    || usageTiers.some((t) => t.monthlyCost == null);

  const priceLabel =
    resolvedAdvertised != null ? moneyLabel(resolvedAdvertised, currency) : null;
  const avgLabel = resolvedAvg != null ? `~${moneyLabel(resolvedAvg, currency)}` : null;

  const yearlySavings = billingToggle.maxYearlySavingsPercent;
  const pricingModel =
    snapshot?.pricingModel != null ? String(snapshot.pricingModel) : null;
  const pageIntro =
    buildPageIntro({
      productName: product.name,
      pricingModel,
      advertisedMonthly: resolvedAdvertised,
      currency,
      plans,
    }) ?? draft?.pageIntro ?? null;
  const marketIntro =
    buildMarketIntro({
      productName: product.name,
      advertisedMonthly: resolvedAdvertised,
      categoryAvgSubscription: resolvedAvgSubscription ?? resolvedAvg,
      currency,
      cheaperPct,
    }) ?? draft?.marketIntro ?? null;
  const plansIntro =
    buildPlansIntro(product.name, plans, yearlySavings) ?? draft?.plansIntro ?? null;
  const usageIntro = draft?.usageIntro ?? buildUsageIntro(product.name);
  const featureCostsIntro = draft?.featureCostsIntro ?? buildFeatureCostsIntro();
  const compareIntro =
    draft?.compareIntro
    ?? buildCompareIntro({ productName: product.name, cheaperPct });
  const hermanTake =
    draft?.hermanTake
    ?? buildHermanTake({
      productName: product.name,
      advertisedMonthly: resolvedAdvertised,
      regularUseMonthly: regularUse,
      currency,
    });
  const limitsHeading = freeVsPaidHeading(plans.length > 0 ? plans : draft?.plans ?? []);

  const productSourceUrl = product.affiliateUrl || product.websiteUrl || null;
  let pricingEvidence =
    (await resolvePricingEvidence({
      productName: product.name,
      sourceUrl: productSourceUrl,
      snapshot: evidenceSnapshot,
      packages: evidencePackages as Array<{ evidenceMediaIds?: unknown }>,
      plans: evidencePlans as Array<{ evidenceMediaIds?: unknown }>,
    })) ?? null;
  if (!pricingEvidence && draft?.pricingEvidence) {
    pricingEvidence = draft.pricingEvidence;
  }
  if (!pricingEvidence && product.slug === 'aura-ai') {
    pricingEvidence = draftPricingEvidence(product);
  }

  return {
    productSlug: product.slug,
    productName: product.name,
    updatedLabel: draft?.updatedLabel ?? 'August 2026',
    isDraft,
    currency,
    pricingScore,
    scoreLabel,
    scoreInsight:
      draft?.scoreInsight
      ?? (priceLabel && avgLabel
        ? `${scoreLabel} — ${product.name}’s ${priceLabel} monthly price is well below the ${avgLabel} category average.`
        : `${product.name} pricing compared against our tested category averages.`),
    scoreCaveat: draft?.scoreCaveat ?? 'Media-heavy usage can increase the real monthly cost.',
    hermanTake,
    pageIntro,
    marketIntro,
    plansIntro,
    usageIntro,
    featureCostsIntro,
    compareIntro,
    limitsHeading,
    advertisedMonthly: resolvedAdvertised,
    regularUseMonthly: regularUse,
    pricingModel,
    powerUserMonthly,
    categoryAvgMonthly: resolvedAvg,
    categoryAvgSubscription: resolvedAvgSubscription,
    reviewedAppCount: draft?.reviewedAppCount ?? (stats.sampleSize || null),
    heroCheaperPct: cheaperPct,
    heroSavings: savings,
    heroCheaperThanPct: draft?.heroCheaperThanPct ?? null,
    barMin,
    barMax,
    productBarPct:
      resolvedAdvertised != null ? clampBarPct(resolvedAdvertised, barMin, barMax) : null,
    avgBarPct:
      resolvedAvgSubscription != null
        ? clampBarPct(resolvedAvgSubscription, barMin, barMax)
        : resolvedAvg != null
          ? clampBarPct(resolvedAvg, barMin, barMax)
          : null,
    plans: plans.length > 0 ? plans : draft?.plans ?? [],
    billingToggle:
      plans.length > 0
        ? billingToggle
        : draft?.billingToggle ?? {
            show: false,
            defaultInterval: 'monthly',
            monthlyLabel: 'Monthly',
            yearlyLabel: 'Annual',
            maxYearlySavingsPercent: null,
            annualBadge: null,
          },
    creditPool: plans.length > 0 ? creditPool : draft?.creditPool ?? null,
    limitRows: plans.length > 0 ? limitRows : draft?.limitRows ?? [],
    topUps,
    usageTiers,
    advertisedVsRegularDiff:
      advertised != null && regularUse != null ? Math.round((regularUse - advertised) * 100) / 100 : null,
    featureCosts: mergedFeatures,
    compareRows: compareRows.length > 0 ? compareRows : draft?.compareRows ?? [],
    pricingEvidence,
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
    hermanTake: null,
    pageIntro: null,
    marketIntro: null,
    plansIntro: null,
    usageIntro: null,
    featureCostsIntro: null,
    compareIntro: null,
    limitsHeading: 'What’s included',
    advertisedMonthly: null,
    regularUseMonthly: null,
    pricingModel: null,
    powerUserMonthly: null,
    categoryAvgMonthly: null,
    categoryAvgSubscription: null,
    reviewedAppCount: null,
    heroCheaperPct: null,
    heroSavings: null,
    heroCheaperThanPct: null,
    barMin: 0,
    barMax: 100,
    productBarPct: null,
    avgBarPct: null,
    billingToggle: {
      show: false,
      defaultInterval: 'monthly',
      monthlyLabel: 'Monthly',
      yearlyLabel: 'Annual',
      maxYearlySavingsPercent: null,
      annualBadge: null,
    },
    plans: [],
    creditPool: null,
    limitRows: [],
    topUps: null,
    usageTiers: [],
    advertisedVsRegularDiff: null,
    featureCosts: [],
    compareRows: [],
    pricingEvidence: null,
  };
}
