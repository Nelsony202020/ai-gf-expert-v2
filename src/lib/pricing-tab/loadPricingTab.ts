import type { Product } from '../../data/products';
import { getDb, isDbConfigured } from '../db/server';
import {
  bestValuePackage,
  cheapestPricedFeatureCost,
  creditsPerDisplayUse,
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
  defaultUsageProfilesForType,
  estimateProfile,
  buildUsageCalculation,
  profilesFromSnapshot,
  type UsageProfile,
} from '../pricing/usageScenarios';
import { resolveProductType } from '../pricing/productType';
import { getAuraAiDraftPricing } from './aura-ai-draft';
import {
  buildBillingToggle,
  buildCreditPool,
  buildFreeAccessPlanColumn,
  buildLimitRows,
  buildPlansIntro,
  buildTopUps,
  finalizePlanColumns,
} from './planPresentation';
import { loadFreeAccessFromTesting } from './freeAccess';
import { resolvePricingEvidence } from './pricingEvidence';
import {
  buildCompareIntro,
  buildFeatureCostsIntro,
  buildFreeVsPaidIntro,
  buildHermanTake,
  buildMarketAutoLead,
  buildMarketIntro,
  buildPageIntro,
  buildUsageIntro,
  freeVsPaidHeading,
  isLegacyPricingBoilerplate,
  joinAutoAndCommentary,
} from './sectionCopy';
import { parsePricingPageCopy } from '../pricing/pageCopy';
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
  standard_image: { label: 'Standard image', icon: 'image', tone: 'neutral', order: 10 },
  premium_image: { label: 'Premium image', icon: 'photo', tone: 'neutral', order: 11 },
  standard_video: { label: '10-second video', icon: 'videocam', tone: 'neutral', order: 20 },
  text_to_video: { label: '10-second text-to-video', icon: 'videocam', tone: 'neutral', order: 21 },
  image_to_video: { label: '10-second image-to-video', icon: 'movie', tone: 'neutral', order: 22 },
  voice_message: { label: '10-second voice message', icon: 'mic', tone: 'neutral', order: 30 },
  voice_call: { label: 'Voice call', icon: 'call', tone: 'neutral', order: 40 },
  premium_message: { label: 'Premium message', icon: 'chat', tone: 'neutral', order: 50 },
  character_creation: { label: 'Custom character', icon: 'person_edit', tone: 'neutral', order: 60 },
  custom_character: { label: 'Custom character', icon: 'person_edit', tone: 'neutral', order: 61 },
  custom_ai: { label: 'Custom character', icon: 'person_edit', tone: 'neutral', order: 62 },
};

function pickPricedFeatureCost(
  costs: FeatureCostLike[],
  ...types: string[]
): FeatureCostLike | undefined {
  return cheapestPricedFeatureCost(costs, ...types);
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
  if (Math.abs(pct) <= 3) return { label: 'Similar', tone: 'neutral' };
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
  const premiumImageCost = pickPricedFeatureCost(costs, 'premium_image');
  const videoCost = pickPricedFeatureCost(costs, 'standard_video', 'text_to_video', 'image_to_video');
  const voiceMsgCost = pickPricedFeatureCost(costs, 'voice_message');
  const voiceCallCost = pickPricedFeatureCost(costs, 'voice_call');
  const characterCost = pickPricedFeatureCost(costs, 'character_creation', 'custom_character');

  const images = included > 0 ? formatCreditPoolUsesCell(included, imageCost, 'image') : { value: '—' };
  const premiumImages =
    included > 0 && premiumImageCost
      ? formatCreditPoolUsesCell(included, premiumImageCost, 'image')
      : null;
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
    { label: 'Images', value: images.value, tip: images.tip },
  ];
  if (premiumImages && premiumImages.value !== '—') {
    rows.push({ label: 'Premium images', value: premiumImages.value, tip: premiumImages.tip });
  }
  rows.push(
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
  );

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
      freeAccessSource: free ? 'subscription_plan' : undefined,
      isRecommended: false,
      priceLabel,
      priceSub,
      summaryLine: free ? 'Limited daily usage' : 'Paid plan',
      includedCredits:
        free
          ? null
          : Number(tier.includedTokens) > 0
            ? Number(tier.includedTokens)
            : null,
      tone: 'neutral' as const,
      billing: free ? null : { monthly, quarterly, yearly },
      rows: allowanceRowsForTier(tier, rowKeys, costs),
    };
  });

  // Paid first, free last — matches the comparison template.
  columns.sort((a, b) => Number(a.isFree) - Number(b.isFree));

  // Recommend the starting (cheapest monthly) paid plan — matches intro copy.
  const paid = columns.filter((c) => !c.isFree);
  if (paid.length === 1) {
    paid[0]!.isRecommended = true;
  } else if (paid.length > 1) {
    const ranked = [...paid].sort((a, b) => {
      const am =
        a.billing?.monthly?.monthlyPrice
        ?? a.billing?.quarterly?.monthlyPrice
        ?? a.billing?.yearly?.monthlyPrice
        ?? Number.POSITIVE_INFINITY;
      const bm =
        b.billing?.monthly?.monthlyPrice
        ?? b.billing?.quarterly?.monthlyPrice
        ?? b.billing?.yearly?.monthlyPrice
        ?? Number.POSITIVE_INFINITY;
      return am - bm;
    });
    ranked[0]!.isRecommended = true;
  }

  return finalizePlanColumns(columns);
}

function buildFeatureRows(
  costs: FeatureCostLike[],
  packages: CreditPackageLike[],
  currency: string,
): PricingFeatureCostRow[] {
  const best = bestValuePackage(packages);
  const rate = best ? pricePerCredit(best) : null;
  const rows: PricingFeatureCostRow[] = [];
  const typed = new Map<string, FeatureCostLike[]>();
  for (const cost of costs) {
    if (cost.active === false) continue;
    if (featureCostAvailability(cost) !== 'priced') continue;
    const type = String(cost.featureType ?? '');
    if (!type || !FEATURE_META[type]) continue;
    const list = typed.get(type) ?? [];
    list.push(cost);
    typed.set(type, list);
  }

  for (const [type, typeCosts] of typed) {
    const cost = cheapestPricedFeatureCost(typeCosts, type);
    if (!cost) continue;
    const meta = FEATURE_META[type]!;

    let value = '—';
    let secondaryValue: string | null = null;
    const perUse = creditsPerDisplayUse(cost);
    const creditsPerUse = perUse ? Math.round(perUse.min * 1000) / 1000 : null;

    if (creditsPerUse != null && creditsPerUse > 0) {
      const creditLabel =
        creditsPerUse < 1
          ? `≈${creditsPerUse} credits`
          : `${creditsPerUse} credit${creditsPerUse === 1 ? '' : 's'}`;
      if (type === 'voice_call') {
        secondaryValue = `${creditsPerUse} credits/min`;
      } else {
        secondaryValue = creditLabel;
      }
    }

    // Money from display units × rate (avoid rounding per-second then scaling — that made 12×$0.06944 → $0.80).
    if (rate != null && creditsPerUse != null && creditsPerUse > 0) {
      const moneyAmount = rate * creditsPerUse;
      const suffix =
        type === 'voice_call'
          ? '/min'
          : type === 'standard_image' || type === 'premium_image' || type.includes('character')
            ? ' each'
            : '';
      if (moneyAmount > 0 && moneyAmount < 0.01) {
        value = `< ${moneyLabel(0.01, currency)}`;
      } else {
        value = `≈${moneyLabel(moneyAmount, currency)}${suffix}`;
      }
    }

    rows.push({
      key: type,
      label: meta.label,
      value,
      secondaryValue,
      icon: meta.icon,
      tone: meta.tone,
    });
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
  _fallbacks: Record<string, number | null>,
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

  const NOT_ENOUGH = 'Not enough data to estimate';

  return profiles.map((profile) => {
    const est = estimateProfile(profile, tiers, costs, packages, referencePlanName);
    // Never invent a monthly estimate from advertised/typical fallbacks.
    // Only show a number when the site calculator fully resolved the spend.
    const monthly =
      !est.missingData && est.totalMonthly != null && Number.isFinite(est.totalMonthly)
        ? est.totalMonthly
        : null;
    const meta = metaById[profile.id as keyof typeof metaById] ?? {
      title: profile.title,
      shortLabel: profile.title,
      description: profile.description,
      icon: 'star',
      tone: 'neutral' as const,
    };
    const planCost = monthly != null ? est.planCost : null;
    const topUpCost = monthly != null ? est.topUpCost : null;

    const calculation =
      monthly != null
        ? buildUsageCalculation(
            profile,
            tiers,
            costs,
            packages,
            currency,
            referencePlanName,
            meta.title.toLowerCase(),
          )
        : null;

    return {
      id: profile.id,
      title: meta.title,
      shortLabel: meta.shortLabel,
      description: meta.description,
      icon: meta.icon,
      tone: meta.tone,
      monthlyCost: monthly,
      costLabel: monthly != null ? `~${moneyLabel(monthly, currency)}/mo` : NOT_ENOUGH,
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
  productType: string | null;
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
    (c) => c.active !== false,
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
    productType: row.productType != null ? String(row.productType) : null,
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

  const productType = resolveProductType(product.slug, own.productType);
  const profiles = snapshot?.usageScenarios
    ? profilesFromSnapshot(snapshot.usageScenarios, productType)
    : defaultUsageProfilesForType(productType);

  const currency = own.priceCurrency;
  const advertised =
    lowestPlainMonthlyPrice(tiers)
    ?? own.minMonthlyPrice;

  // Not enough structured data to build a live tab — caller should use draft.
  if (tiers.length === 0 && advertised == null) return null;

  const draft = product.slug === 'aura-ai' ? getAuraAiDraftPricing(product) : null;
  const referencePlanName =
    snapshot?.referencePlanName != null ? String(snapshot.referencePlanName) : null;
  let plans = buildPlansFromTiers(tiers, costs, currency, own.promotions);

  // Prefer a formal Free subscriptionPlan; otherwise hydrate Free access from testing evidence.
  let freeAccess = null as Awaited<ReturnType<typeof loadFreeAccessFromTesting>>;
  const hasFormalFree = plans.some((p) => p.isFree && p.freeAccessSource !== 'testing');
  if (hasFormalFree) {
    freeAccess = {
      source: 'subscription_plan',
      chat: null,
      characters: null,
      images: null,
      video: null,
      voice: null,
      trialWithoutCreditCard: null,
    };
  } else {
    freeAccess = await loadFreeAccessFromTesting(product.slug);
    // When borrowing Candy pricing for Aura, also borrow Candy free-access testing answers.
    if (!freeAccess && borrowedFromCandy) {
      freeAccess = await loadFreeAccessFromTesting('candy-ai');
    }
    if (freeAccess && !plans.some((p) => p.isFree)) {
      plans = finalizePlanColumns([
        ...plans.filter((p) => !p.isFree),
        buildFreeAccessPlanColumn(freeAccess),
      ]);
    }
  }

  // Do not inject Aura draft's invented free allowances (e.g. 20 msgs/day).
  void draft;

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
    {},
    referencePlanName,
  );

  const regularUse = usageTiers.find((t) => t.id === 'regular')?.monthlyCost ?? null;
  const usageEstimatesAvailable = usageTiers.some(
    (t) => t.monthlyCost != null && Number.isFinite(t.monthlyCost),
  );

  const stats = await collectPricingStats();
  /** Public subscription benchmark = median (typical price). Mean kept on stats for analytics. */
  const typicalMonthlyPrice = stats.medianMonthlyPrice;
  const categoryAvgMonthly =
    draft?.categoryAvgMonthly
    ?? (typicalMonthlyPrice != null ? Math.round(typicalMonthlyPrice * 2.1 * 100) / 100 : null);

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
  const resolvedTypical =
    typicalMonthlyPrice
    ?? draft?.typicalMonthlyPrice
    ?? (draft as { categoryAvgSubscription?: number | null } | null)?.categoryAvgSubscription
    ?? null;
  // Like-for-like: advertised subscription vs typical (median) starting price
  const { cheaperPct: subscriptionCheaperPct } = computeHeroComparison(
    resolvedAdvertised,
    resolvedTypical,
  );
  // Hero still compares regular-use vs category regular-use proxy when available
  const { cheaperPct, savings } = computeHeroComparison(regularUse, resolvedAvg);

  const barMin = 0;
  // Market-wide ceiling from tested apps — never zoom around this product alone.
  const barMax = (() => {
    const peak = Math.max(
      stats.mostExpensiveMonthlyPrice ?? 0,
      resolvedAdvertised ?? 0,
      resolvedTypical ?? 0,
      20,
    );
    const withHeadroom = peak * 1.15;
    const nice = [20, 30, 40, 50, 60, 80, 100, 120, 150];
    return nice.find((n) => n >= withHeadroom) ?? Math.ceil(withHeadroom / 10) * 10;
  })();

  const lightUse = usageTiers.find((t) => t.id === 'casual')?.monthlyCost ?? null;
  const powerUserMonthly =
    usageTiers.find((t) => t.id === 'power')?.monthlyCost ?? null;

  const compareRows: PricingCompareRow[] = [];
  if (advertised != null && typicalMonthlyPrice != null) {
    const diff = pctDiff(advertised, typicalMonthlyPrice);
    compareRows.push({
      metric: 'Subscription price',
      productValue: `${moneyLabel(advertised, currency)}/mo`,
      typicalValue: `${moneyLabel(typicalMonthlyPrice, currency)}/mo`,
      diffLabel: diff.label,
      diffTone: diff.tone,
    });
  }

  // Usage comparisons require peer products computed with the same package-combo
  // methodology. Until industry-wide actual-spend averages exist, show product
  // numbers only against “insufficient data” rather than inventing scaled proxies.
  if (lightUse != null) {
    compareRows.push({
      metric: 'Light-use cost',
      productValue: `~${moneyLabel(lightUse, currency)}/mo`,
      typicalValue: 'Insufficient data',
      diffLabel: '—',
      diffTone: 'neutral',
    });
  }
  if (regularUse != null) {
    compareRows.push({
      metric: 'Regular-use cost',
      productValue: `~${moneyLabel(regularUse, currency)}/mo`,
      typicalValue: 'Insufficient data',
      diffLabel: '—',
      diffTone: 'neutral',
    });
  }
  if (powerUserMonthly != null) {
    compareRows.push({
      metric: 'Heavy-use cost',
      productValue: `~${moneyLabel(powerUserMonthly, currency)}/mo`,
      typicalValue: 'Insufficient data',
      diffLabel: '—',
      diffTone: 'neutral',
    });
  }
  // Prefer computed feature rows; fill gaps from draft for Aura.
  const mergedFeatures =
    featureCosts.length > 0
      ? featureCosts
      : draft?.featureCosts ?? [];

  const isDraft =
    borrowedFromCandy
    || plans.length < 2
    || featureCosts.length === 0
    || usageTiers.some((t) => t.monthlyCost == null);

  const priceLabel =
    resolvedAdvertised != null ? moneyLabel(resolvedAdvertised, currency) : null;
  const typicalLabel =
    resolvedTypical != null ? `~${moneyLabel(resolvedTypical, currency)}` : null;

  const yearlySavings = billingToggle.maxYearlySavingsPercent;
  const pricingModel =
    snapshot?.pricingModel != null ? String(snapshot.pricingModel) : null;
  const pageCopy = parsePricingPageCopy(snapshot?.pageCopy);

  const autoPageIntro =
    buildPageIntro({
      productName: product.name,
      pricingModel,
      advertisedMonthly: resolvedAdvertised,
      currency,
      plans,
    }) ?? draft?.pageIntro ?? null;
  const pageIntro = pageCopy.introduction?.trim() || autoPageIntro;

  const marketAutoLead = buildMarketAutoLead({
    productName: product.name,
    advertisedMonthly: resolvedAdvertised,
    typicalMonthlyPrice: resolvedTypical,
    currency,
    cheaperPct: subscriptionCheaperPct,
  });
  const marketFallback =
    buildMarketIntro({
      productName: product.name,
      advertisedMonthly: resolvedAdvertised,
      typicalMonthlyPrice: resolvedTypical,
      currency,
      cheaperPct: subscriptionCheaperPct,
    }) ?? draft?.marketIntro ?? null;
  const marketCommentary = pageCopy.marketPositionCommentary?.trim() || null;
  const marketIntro = (() => {
    // Public editor field always wins when present (unless exact legacy boilerplate).
    if (marketCommentary && !isLegacyPricingBoilerplate(marketCommentary)) {
      return joinAutoAndCommentary(marketAutoLead, marketCommentary);
    }
    if (marketCommentary && isLegacyPricingBoilerplate(marketCommentary)) {
      return marketAutoLead || marketFallback;
    }
    return marketFallback;
  })();

  const autoPlansIntro =
    buildPlansIntro(product.name, plans, yearlySavings) ?? draft?.plansIntro ?? null;
  const plansIntro = joinAutoAndCommentary(
    autoPlansIntro,
    pageCopy.plansNote,
  );

  const autoUsageIntro = usageEstimatesAvailable
    ? (draft?.usageIntro ?? buildUsageIntro())
    : 'Not enough verified pricing data to estimate light, regular, or heavy monthly spend yet.';
  const usageIntro = usageEstimatesAvailable
    ? joinAutoAndCommentary(autoUsageIntro, pageCopy.realWorldCostCommentary)
    : autoUsageIntro;

  const featureCostsIntro = draft?.featureCostsIntro ?? buildFeatureCostsIntro();

  const autoCompareIntro = draft?.compareIntro ?? buildCompareIntro();
  const rawComparisonNote = pageCopy.comparisonCommentary?.trim() || null;
  const comparisonNote =
    rawComparisonNote && !isLegacyPricingBoilerplate(rawComparisonNote)
      ? rawComparisonNote
      : null;
  // Auto lead stays above the table; editor commentary renders below it.
  const compareIntro = autoCompareIntro;

  const hermanTake =
    pageCopy.expertOpinion?.trim()
    || draft?.hermanTake
    || buildHermanTake({
      productName: product.name,
      advertisedMonthly: resolvedAdvertised,
      regularUseMonthly: regularUse,
      currency,
    });
  const limitsHeading = freeVsPaidHeading(plans.length > 0 ? plans : draft?.plans ?? []);
  const freeVsPaidIntro = buildFreeVsPaidIntro();

  const productSourceUrl = product.affiliateUrl || product.websiteUrl || null;
  let pricingEvidence = null as PricingTabViewModel['pricingEvidence'];
  // Never present another product's screenshots as this product's verified pricing.
  if (!borrowedFromCandy) {
    pricingEvidence =
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
  }

  const pricingDataSource = {
    productSlug: borrowedFromCandy ? 'candy-ai' : product.slug,
    borrowed: borrowedFromCandy,
  };

  const scoreCaveat = borrowedFromCandy
    ? 'Pricing data is currently borrowed from Candy AI and is not publish-ready.'
    : (draft?.scoreCaveat ?? 'Media-heavy usage can increase the real monthly cost.');

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
      ?? (priceLabel && typicalLabel
        ? `${scoreLabel} — ${product.name}’s ${priceLabel} monthly price vs the ${typicalLabel} typical price.`
        : `${product.name} pricing compared against typical prices across our tested apps.`),
    scoreCaveat,
    hermanTake,
    pageIntro,
    marketIntro,
    plansIntro,
    usageIntro,
    featureCostsIntro,
    compareIntro,
    comparisonNote,
    limitsHeading,
    freeVsPaidIntro,
    freeAccess,
    pricingDataSource,
    advertisedMonthly: resolvedAdvertised,
    regularUseMonthly: regularUse,
    pricingModel,
    powerUserMonthly,
    categoryAvgMonthly: resolvedAvg,
    typicalMonthlyPrice: resolvedTypical,
    reviewedAppCount: draft?.reviewedAppCount ?? (stats.sampleSize || null),
    heroCheaperPct: cheaperPct,
    heroSavings: savings,
    heroCheaperThanPct: draft?.heroCheaperThanPct ?? null,
    barMin,
    barMax,
    productBarPct:
      resolvedAdvertised != null ? clampBarPct(resolvedAdvertised, barMin, barMax) : null,
    typicalBarPct:
      resolvedTypical != null
        ? clampBarPct(resolvedTypical, barMin, barMax)
        : null,
    plans: plans.length > 0 ? plans : draft?.plans ?? [],
    billingToggle:
      plans.length > 0
        ? billingToggle
        : draft?.billingToggle ?? {
            show: false,
            defaultInterval: 'monthly' as const,
            intervals: [{ key: 'monthly' as const, label: 'Monthly' }],
            monthlyLabel: 'Monthly',
            yearlyLabel: 'Annual',
            maxYearlySavingsPercent: null,
            annualBadge: null,
          },
    creditPool: plans.length > 0 ? creditPool : draft?.creditPool ?? null,
    limitRows: plans.length > 0 ? limitRows : draft?.limitRows ?? [],
    topUps,
    usageTiers,
    usageEstimatesAvailable,
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
    comparisonNote: null,
    limitsHeading: 'What’s included',
    freeVsPaidIntro: null,
    freeAccess: null,
    pricingDataSource: { productSlug: product.slug, borrowed: false },
    advertisedMonthly: null,
    regularUseMonthly: null,
    pricingModel: null,
    powerUserMonthly: null,
    categoryAvgMonthly: null,
    typicalMonthlyPrice: null,
    reviewedAppCount: null,
    heroCheaperPct: null,
    heroSavings: null,
    heroCheaperThanPct: null,
    barMin: 0,
    barMax: 100,
    productBarPct: null,
    typicalBarPct: null,
    billingToggle: {
      show: false,
      defaultInterval: 'monthly',
      intervals: [{ key: 'monthly', label: 'Monthly' }],
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
    usageEstimatesAvailable: false,
    advertisedVsRegularDiff: null,
    featureCosts: [],
    compareRows: [],
    pricingEvidence: null,
  };
}
