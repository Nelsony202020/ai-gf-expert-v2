import type { Product } from '../../data/products';
import {
  clampBarPct,
  computeHeroComparison,
  type PricingCompareRow,
  type PricingFeatureCostRow,
  type PricingPlanColumn,
  type PricingTabViewModel,
  type PricingUsageTier,
} from './types';

/** Editorial / draft pricing for Aura AI until InstantDB plans + feature costs are complete. */
export function getAuraAiDraftPricing(product: Product): PricingTabViewModel {
  const pricingCat = product.categories.find((c) => c.key === 'pricing');
  const pricingScore = pricingCat?.score ?? 8.5;

  const advertisedMonthly = 12.99;
  const regularUseMonthly = 31;
  const lightUseMonthly = 12.99;
  const heavyUseMonthly = 68;
  const categoryAvgMonthly = 34;
  const categoryAvgSubscription = 16.33;
  const currency = 'USD';
  const reviewedAppCount = 18;

  const barMin = 0;
  const barMax = 80;
  const { cheaperPct, savings } = computeHeroComparison(advertisedMonthly, categoryAvgMonthly);

  const plans: PricingPlanColumn[] = [
    {
      key: 'monthly',
      name: 'Monthly',
      priceLabel: '$12.99',
      priceSub: 'billed monthly',
      tone: 'accent',
      rows: [
        { label: 'Included credits', value: '500 / mo' },
        { label: 'Chat', value: 'Included', included: true },
        { label: 'Images', value: 'Credits' },
        { label: 'Video', value: 'Credits' },
        { label: 'Voice messages', value: 'Credits' },
        { label: 'Voice calls', value: 'Credits' },
      ],
    },
    {
      key: 'annual',
      name: 'Annual',
      priceLabel: '$9.99',
      priceSub: 'per month · billed yearly',
      badge: 'Best value',
      tone: 'green',
      rows: [
        { label: 'Included credits', value: '500 / mo' },
        { label: 'Chat', value: 'Included', included: true },
        { label: 'Images', value: 'Credits' },
        { label: 'Video', value: 'Credits' },
        { label: 'Voice messages', value: 'Credits' },
        { label: 'Annual discount', value: '23% off' },
      ],
    },
    {
      key: 'free',
      name: 'Free',
      priceLabel: '$0',
      priceSub: 'limited access',
      tone: 'neutral',
      rows: [
        { label: 'Chat', value: '20 msgs / day' },
        { label: 'Images', value: '3 / day' },
        { label: 'Video', value: '1 / day' },
        { label: 'Voice', value: '30 sec / day' },
        { label: 'Characters', value: '1' },
        { label: 'Card required', value: 'No', included: true },
      ],
    },
  ];

  const usageTiers: PricingUsageTier[] = [
    {
      id: 'casual',
      title: 'Light use',
      description: 'A few messages and images each day.',
      icon: 'eco',
      tone: 'green',
      monthlyCost: lightUseMonthly,
      costLabel: `~$${lightUseMonthly.toFixed(2)}/mo`,
    },
    {
      id: 'regular',
      title: 'Regular use',
      description: 'Daily chat with images and some video.',
      icon: 'star',
      tone: 'amber',
      monthlyCost: regularUseMonthly,
      costLabel: `~$${regularUseMonthly.toFixed(2)}/mo`,
    },
    {
      id: 'power',
      title: 'Heavy use',
      description: 'Long sessions across chat, images, and video.',
      icon: 'local_fire_department',
      tone: 'red',
      monthlyCost: heavyUseMonthly,
      costLabel: `~$${heavyUseMonthly.toFixed(2)}/mo`,
    },
  ];

  const featureCosts: PricingFeatureCostRow[] = [
    { key: 'image', label: 'Cost per image', value: '$0.12', icon: 'image', tone: 'pink' },
    { key: 'video', label: 'Cost per 10s video', value: '$0.28', icon: 'videocam', tone: 'purple' },
    { key: 'voice', label: 'Voice message (10s)', value: '$0.04', icon: 'mic', tone: 'blue' },
    { key: 'call', label: 'Voice call', value: '$0.15 / min', icon: 'call', tone: 'green' },
    { key: 'topup', label: 'Top-up packs', value: '$4.99 – $49.99', icon: 'add_shopping_cart', tone: 'amber' },
    { key: 'chat', label: 'Chat messages', value: 'Included', icon: 'chat', tone: 'green' },
  ];

  const compareRows: PricingCompareRow[] = [
    {
      metric: 'Subscription price',
      productValue: '$12.99/mo',
      averageValue: `$${categoryAvgSubscription.toFixed(2)}/mo`,
      diffLabel: '20% cheaper',
      diffTone: 'better',
    },
    {
      metric: 'Regular-use cost',
      productValue: '~$31/mo',
      averageValue: `~$${categoryAvgMonthly.toFixed(0)}/mo`,
      diffLabel: '9% cheaper',
      diffTone: 'better',
    },
    {
      metric: 'Image cost',
      productValue: '$0.12',
      averageValue: '$0.14',
      diffLabel: '14% cheaper',
      diffTone: 'better',
    },
    {
      metric: 'Video cost (10s)',
      productValue: '$0.28',
      averageValue: '$0.22',
      diffLabel: '27% more',
      diffTone: 'worse',
    },
  ];

  const scoreLabel = pricingScore >= 7 ? 'Good value' : pricingScore >= 5.5 ? 'Fair value' : 'Poor value';

  return {
    productSlug: product.slug,
    productName: product.name,
    updatedLabel: 'August 2026',
    isDraft: true,
    currency,
    pricingScore,
    scoreLabel,
    scoreInsight: `${scoreLabel} — ${product.name}’s $12.99 monthly price is well below the ~$34 category average.`,
    scoreCaveat: 'Media-heavy usage can increase the real monthly cost.',
    advertisedMonthly,
    regularUseMonthly,
    categoryAvgMonthly,
    reviewedAppCount,
    heroCheaperPct: cheaperPct,
    heroSavings: savings,
    heroCheaperThanPct: 78,
    barMin,
    barMax,
    productBarPct: clampBarPct(advertisedMonthly, barMin, barMax),
    avgBarPct: clampBarPct(categoryAvgMonthly, barMin, barMax),
    plans,
    usageTiers,
    advertisedVsRegularDiff: regularUseMonthly - advertisedMonthly,
    featureCosts,
    compareRows,
  };
}
