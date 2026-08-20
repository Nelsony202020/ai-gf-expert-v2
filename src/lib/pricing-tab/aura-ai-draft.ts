import type { Product } from '../../data/products';
import {
  bestValuePackage,
  formatCreditPoolUsesCell,
  fmtMoney,
  pricePerCredit,
  type CreditPackageLike,
  type FeatureCostLike,
  type PlanTierLike,
} from '../pricing/calc';
import {
  DEFAULT_USAGE_PROFILES,
  buildUsageCalculation,
  estimateProfile,
} from '../pricing/usageScenarios';
import {
  buildBillingToggle,
  buildCreditPool,
  buildLimitRows,
  buildPlansIntro,
  buildTopUps,
  finalizePlanColumns,
} from './planPresentation';
import {
  buildCompareIntro,
  buildFeatureCostsIntro,
  buildFreeVsPaidIntro,
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
  type PricingPlanColumn,
  type PricingTabViewModel,
  type PricingUsageTier,
} from './types';

/** Candy AI–shaped feature costs used when InstantDB isn’t available. */
const CANDY_FEATURE_COSTS: FeatureCostLike[] = [
  { featureType: 'standard_image', creditCost: 2, costType: 'fixed', unit: 'per_image' },
  { featureType: 'premium_image', creditCost: 4, costType: 'fixed', unit: 'per_image' },
  { featureType: 'standard_video', creditCost: 1.2, costType: 'fixed', unit: 'per_second' },
  { featureType: 'voice_message', creditCost: 0.2, costType: 'fixed', unit: 'per_minute' },
  { featureType: 'voice_call', creditCost: 3, costType: 'fixed', unit: 'per_minute' },
  { featureType: 'character_creation', creditCost: 10, costType: 'fixed', unit: 'per_character' },
];

/** Matches published Aura/Candy top-up packs (EUR) for offline draft. */
const CANDY_PACKAGES: CreditPackageLike[] = [
  { name: '100 credits', price: 9.99, currency: 'EUR', baseCredits: 100, bonusCredits: 0, active: true },
  { name: '405 credits', price: 34.99, currency: 'EUR', baseCredits: 350, bonusCredits: 55, active: true },
  { name: '605 credits', price: 49.99, currency: 'EUR', baseCredits: 550, bonusCredits: 55, active: true },
  { name: '1,150 credits', price: 99.99, currency: 'EUR', baseCredits: 1150, bonusCredits: 0, active: true },
  { name: '2,880 credits', price: 199.99, currency: 'EUR', baseCredits: 2400, bonusCredits: 480, active: true },
  { name: '3,750 credits', price: 299.99, currency: 'EUR', baseCredits: 3750, bonusCredits: 0, active: true },
];
function draftTiers(monthlyPrice: number, includedCredits: number): PlanTierLike[] {
  return [
    {
      name: 'Premium',
      active: true,
      includedTokens: includedCredits,
      billingOptions: [
        {
          interval: 'monthly',
          price: monthlyPrice,
          currency: 'USD',
          active: true,
        },
      ],
    },
  ];
}

function paidCreditRows(includedCredits: number): PricingPlanColumn['rows'] {
  const image = CANDY_FEATURE_COSTS.find((c) => c.featureType === 'standard_image');
  const video = CANDY_FEATURE_COSTS.find((c) => c.featureType === 'standard_video');
  const voiceMsg = CANDY_FEATURE_COSTS.find((c) => c.featureType === 'voice_message');
  const voiceCall = CANDY_FEATURE_COSTS.find((c) => c.featureType === 'voice_call');
  const character = CANDY_FEATURE_COSTS.find((c) => c.featureType === 'character_creation');
  const images = formatCreditPoolUsesCell(includedCredits, image, 'image');
  const videos = formatCreditPoolUsesCell(includedCredits, video, 'video');
  const voiceMessages = formatCreditPoolUsesCell(includedCredits, voiceMsg, 'voice_message');
  const voiceCalls = formatCreditPoolUsesCell(includedCredits, voiceCall, 'voice_call');
  const characters = formatCreditPoolUsesCell(includedCredits, character, 'character_creation');
  return [
    { label: 'Included credits', value: `${includedCredits}/mo` },
    { label: 'Chat', value: 'Unlimited' },
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
    { label: 'Custom character', value: characters.value },
  ];
}

function formatAssumptionRate(n: number): string {
  if (n <= 0) return 'None';
  if (n < 1) return 'Occasional';
  if (Number.isInteger(n)) return `${n}/day`;
  return `~${Math.round(n * 10) / 10}/day`;
}

/**
 * Offline / fallback Aura pricing.
 * Prefer InstantDB via loadPricingTab (which borrows Candy AI entities when Aura is incomplete).
 */
export function getAuraAiDraftPricing(product: Product): PricingTabViewModel {
  const pricingCat = product.categories.find((c) => c.key === 'pricing');
  const pricingScore = pricingCat?.score ?? 8.5;

  // Candy AI live reference numbers (admin) — used only when DB merge isn’t available.
  const advertisedMonthly = 13.99;
  const includedCredits = 100;
  const categoryAvgMonthly = 34;
  const typicalMonthlyPrice = 13.99;
  const currency = 'USD';
  const reviewedAppCount = 18;

  const barMin = 0;
  const barMax = 40;
  const marketCompare = computeHeroComparison(advertisedMonthly, typicalMonthlyPrice);
  const paidRows = paidCreditRows(includedCredits);
  const annualTotal = 47.88;
  const annualMonthly = 3.99;
  const annualSavings = 71;
  const tiers = draftTiers(advertisedMonthly, includedCredits);

  const usageMeta = {
    casual: {
      title: 'Light use',
      shortLabel: 'Mostly chat',
      description: 'Mostly chat with occasional media.',
      icon: 'eco',
    },
    regular: {
      title: 'Regular use',
      shortLabel: 'Typical daily use',
      description: 'Typical daily use across chat, images, and some video.',
      icon: 'star',
    },
    power: {
      title: 'Heavy use',
      shortLabel: 'Heavy media use',
      description: 'Frequent image and video generation.',
      icon: 'local_fire_department',
    },
  } as const;

  const usageTiers: PricingUsageTier[] = DEFAULT_USAGE_PROFILES.map((profile) => {
    const meta = usageMeta[profile.id];
    const est = estimateProfile(profile, tiers, CANDY_FEATURE_COSTS, CANDY_PACKAGES);
    const monthly = est.totalMonthly;
    const planCost = est.planCost ?? advertisedMonthly;
    const topUpCost =
      est.topUpCost
      ?? (monthly != null ? Math.round((monthly - planCost) * 100) / 100 : null);
    const calculation = buildUsageCalculation(
      profile,
      tiers,
      CANDY_FEATURE_COSTS,
      CANDY_PACKAGES,
      currency,
      null,
      meta.title.toLowerCase(),
    );
    return {
      id: profile.id,
      title: meta.title,
      shortLabel: meta.shortLabel,
      description: meta.description,
      icon: meta.icon,
      tone: 'neutral',
      monthlyCost: monthly,
      costLabel: monthly != null ? `~${fmtMoney(monthly, currency)}/mo` : '—',
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

  const lightUseMonthly =
    usageTiers.find((t) => t.id === 'casual')?.monthlyCost ?? advertisedMonthly;
  const regularUseMonthly =
    usageTiers.find((t) => t.id === 'regular')?.monthlyCost ?? advertisedMonthly;
  const heavyUseMonthly =
    usageTiers.find((t) => t.id === 'power')?.monthlyCost ?? null;

  const scaleAvg = (productCost: number | null): number | null => {
    if (productCost == null || regularUseMonthly <= 0) return null;
    return Math.round(categoryAvgMonthly * (productCost / regularUseMonthly) * 100) / 100;
  };
  const categoryAvgLight = scaleAvg(lightUseMonthly) ?? Math.round(categoryAvgMonthly * 0.65);
  const categoryAvgPower =
    scaleAvg(heavyUseMonthly) ?? Math.round(categoryAvgMonthly * 1.55);

  const compareRows: PricingCompareRow[] = [
    {
      metric: 'Subscription price',
      productValue: '$13.99/mo',
      typicalValue: `$${typicalMonthlyPrice.toFixed(2)}/mo`,
      diffLabel: 'About average',
      diffTone: 'neutral',
    },
    {
      metric: 'Light-use cost',
      productValue: `~$${Math.round(lightUseMonthly)}/mo`,
      typicalValue: `~$${Math.round(categoryAvgLight)}/mo`,
      diffLabel: lightUseMonthly < categoryAvgLight ? 'Cheaper' : 'Higher',
      diffTone: lightUseMonthly < categoryAvgLight ? 'better' : 'worse',
    },
    {
      metric: 'Regular-use cost',
      productValue: `~$${Math.round(regularUseMonthly)}/mo`,
      typicalValue: `~$${categoryAvgMonthly.toFixed(0)}/mo`,
      diffLabel:
        regularUseMonthly < categoryAvgMonthly ? 'Cheaper' : 'Higher',
      diffTone: regularUseMonthly < categoryAvgMonthly ? 'better' : 'worse',
    },
    {
      metric: 'Power-user cost',
      productValue:
        heavyUseMonthly != null ? `~$${Math.round(heavyUseMonthly)}/mo` : '—',
      typicalValue: `~$${Math.round(categoryAvgPower)}/mo`,
      diffLabel:
        heavyUseMonthly != null && heavyUseMonthly < categoryAvgPower ? 'Cheaper' : 'Higher',
      diffTone:
        heavyUseMonthly != null && heavyUseMonthly < categoryAvgPower ? 'better' : 'worse',
    },
  ];

  const plans = finalizePlanColumns([
    {
      key: 'premium',
      name: 'Premium',
      displayName: 'Premium',
      isFree: false,
      isRecommended: true,
      priceLabel: `$${advertisedMonthly.toFixed(2)}`,
      priceSub: 'Billed monthly',
      summaryLine: `${includedCredits} credits/month`,
      includedCredits,
      tone: 'neutral',
      billing: {
        monthly: {
          interval: 'monthly',
          monthlyPrice: advertisedMonthly,
          monthlyPriceLabel: `$${advertisedMonthly.toFixed(2)}`,
          periodPrice: advertisedMonthly,
          periodPriceLabel: null,
          priceSub: 'Billed monthly',
          savingsPercent: null,
          savingsLabel: null,
          sale: null,
        },
        quarterly: {
          interval: 'quarterly',
          monthlyPrice: 8.99,
          monthlyPriceLabel: '$8.99',
          periodPrice: 26.97,
          periodPriceLabel: '$26.97',
          priceSub: '$26.97 billed every 3 months',
          savingsPercent: 36,
          savingsLabel: 'Save 36%',
          sale: null,
        },
        yearly: {
          interval: 'yearly',
          monthlyPrice: annualMonthly,
          monthlyPriceLabel: `$${annualMonthly.toFixed(2)}`,
          periodPrice: annualTotal,
          periodPriceLabel: `$${annualTotal.toFixed(2)}`,
          priceSub: `$${annualTotal.toFixed(2)} billed yearly`,
          savingsPercent: annualSavings,
          savingsLabel: `Save ${annualSavings}%`,
          sale: null,
        },
      },
      rows: paidRows,
    },
  ]);

  const billingToggle = buildBillingToggle(plans);
  const bestPkg = bestValuePackage(CANDY_PACKAGES);
  const ratePerCredit = bestPkg ? pricePerCredit(bestPkg) : pricePerCredit(CANDY_PACKAGES[0]!);
  const creditPool = buildCreditPool(plans, CANDY_FEATURE_COSTS, {
    ratePerCredit,
    currency: 'USD',
  });
  const limitRows = buildLimitRows(plans);
  const topUps = buildTopUps(CANDY_PACKAGES, currency);
  const featureCosts: PricingFeatureCostRow[] = [
    { key: 'standard_image', label: 'Price per image generation', value: '$0.08', icon: 'image', tone: 'neutral' },
    { key: 'premium_image', label: 'Price per premium image', value: '$0.16', icon: 'photo', tone: 'neutral' },
    { key: 'standard_video', label: 'Price per 10s video', value: '$0.48', icon: 'videocam', tone: 'neutral' },
    { key: 'voice_message', label: 'Price per voice message', value: '$0.01 / msg', icon: 'mic', tone: 'neutral' },
    { key: 'voice_call', label: 'Price per phone call', value: '$0.12 / min', icon: 'call', tone: 'neutral' },
    { key: 'character_creation', label: 'Custom character cost', value: '$0.40 / character', icon: 'person_edit', tone: 'neutral' },
    { key: 'chat', label: 'Chat messages', value: 'Unlimited', icon: 'chat', tone: 'neutral' },
  ];

  const scoreLabel = pricingScore >= 7 ? 'Good value' : pricingScore >= 5.5 ? 'Fair value' : 'Poor value';
  const pricingModel = 'subscription_credits';
  const pageIntro = buildPageIntro({
    productName: product.name,
    pricingModel,
    advertisedMonthly,
    currency,
    plans,
  });
  const marketIntro = buildMarketIntro({
    productName: product.name,
    advertisedMonthly,
    typicalMonthlyPrice,
    currency,
    cheaperPct: marketCompare.cheaperPct,
  });
  const plansIntro = buildPlansIntro(product.name, plans, billingToggle.maxYearlySavingsPercent);
  const usageIntro = buildUsageIntro();
  const featureCostsIntro = buildFeatureCostsIntro();
  const compareIntro = buildCompareIntro();
  const hermanTake = buildHermanTake({
    productName: product.name,
    advertisedMonthly,
    regularUseMonthly,
    currency,
  });

  return {
    productSlug: product.slug,
    productName: product.name,
    updatedLabel: 'August 2026',
    isDraft: true,
    currency,
    pricingScore,
    scoreLabel,
    scoreInsight: `${scoreLabel} — ${product.name}’s $13.99 monthly price matches the ~$13.99 typical price.`,
    scoreCaveat: 'Pricing data is currently borrowed from Candy AI and is not publish-ready.',
    hermanTake,
    pageIntro,
    marketIntro,
    plansIntro,
    usageIntro,
    featureCostsIntro,
    compareIntro,
    comparisonNote: null,
    limitsHeading: freeVsPaidHeading(plans),
    freeVsPaidIntro: buildFreeVsPaidIntro(),
    freeAccess: null,
    pricingDataSource: { productSlug: 'candy-ai', borrowed: true },
    advertisedMonthly,
    regularUseMonthly,
    pricingModel,
    powerUserMonthly: heavyUseMonthly,
    categoryAvgMonthly,
    typicalMonthlyPrice,
    reviewedAppCount,
    heroCheaperPct: marketCompare.cheaperPct,
    heroSavings: marketCompare.savings,
    heroCheaperThanPct: 78,
    barMin,
    barMax,
    productBarPct: clampBarPct(advertisedMonthly, barMin, barMax),
    typicalBarPct: clampBarPct(typicalMonthlyPrice, barMin, barMax),
    billingToggle,
    plans,
    creditPool,
    limitRows,
    topUps,
    usageTiers,
    usageEstimatesAvailable: usageTiers.some((t) => t.monthlyCost != null),
    advertisedVsRegularDiff: regularUseMonthly - advertisedMonthly,
    featureCosts,
    compareRows,
    pricingEvidence: null,
  };
}
