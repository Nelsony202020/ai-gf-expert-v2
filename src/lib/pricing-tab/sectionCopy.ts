import { fmtMoney } from '../pricing/calc';
import type { PricingPlanColumn } from './types';

function money(n: number, currency: string): string {
  return fmtMoney(n, currency);
}

function paidPlans(plans: PricingPlanColumn[]) {
  return plans.filter((p) => !p.isFree);
}

function primaryPaid(plans: PricingPlanColumn[]) {
  return (
    plans.find((p) => !p.isFree && p.isRecommended)
    ?? plans.find((p) => !p.isFree)
    ?? null
  );
}

function hasUnlimitedChat(plans: PricingPlanColumn[]): boolean {
  const paid = primaryPaid(plans);
  if (!paid) return false;
  const chat = paid.rows.find((r) => /^chat$/i.test(r.label));
  return chat != null && /unlimited/i.test(chat.value);
}

function pricingModelPhrase(pricingModel: string | null): string {
  switch (pricingModel) {
    case 'subscription_only':
      return 'a subscription pricing model';
    case 'credits_only':
      return 'a credit-based pricing model';
    case 'free_plus_credits':
      return 'a freemium + credits pricing model';
    case 'mixed':
      return 'a mixed pricing model';
    case 'custom':
      return 'a custom pricing model';
    case 'subscription_credits':
    default:
      return 'a subscription + credits pricing model';
  }
}

/** Product-specific H2 lead — explain THIS app’s model, not the category. */
export function buildPageIntro(input: {
  productName: string;
  pricingModel: string | null;
  advertisedMonthly: number | null;
  currency: string;
  plans: PricingPlanColumn[];
}): string | null {
  const { productName, pricingModel, advertisedMonthly, currency, plans } = input;
  const paid = primaryPaid(plans);
  const credits = paid?.includedCredits ?? null;
  const price = advertisedMonthly != null ? money(advertisedMonthly, currency) : null;
  const model = pricingModelPhrase(pricingModel);
  const unlimitedChat = hasUnlimitedChat(plans);

  if (price && credits != null && credits > 0) {
    const chatBit = unlimitedChat
      ? 'Chat is unlimited on the paid plan, but your real monthly cost depends on how heavily you use credit-based features.'
      : 'Your real monthly cost depends on how heavily you use credit-based features.';
    return `${productName} uses ${model}. The paid plan starts at ${price} per month and includes ${credits} credits that can be spent on images, videos, voice messages, and calls. ${chatBit}`;
  }

  if (price && pricingModel === 'subscription_only') {
    return `${productName} uses ${model}. The paid plan starts at ${price} per month. Unlike credit-based apps, your monthly cost is mostly the subscription itself.`;
  }

  if (price) {
    return `${productName} uses ${model}. The paid plan starts at ${price} per month. We break down what that includes, what you’ll actually spend at different usage levels, and how it compares with other apps we tested.`;
  }

  if (plans.length > 0) {
    return `${productName} uses ${model}. Below we break down the plans, what you get, and how the real monthly cost changes with usage.`;
  }

  return null;
}

/** Short “Is X expensive?” interpretation for the benchmark section. */
export function buildMarketIntro(input: {
  productName: string;
  advertisedMonthly: number | null;
  categoryAvgSubscription: number | null;
  currency: string;
  cheaperPct: number | null;
}): string | null {
  const { productName, advertisedMonthly, categoryAvgSubscription, currency, cheaperPct } = input;
  if (advertisedMonthly == null) return null;

  const price = money(advertisedMonthly, currency);
  const avg =
    categoryAvgSubscription != null ? `~${money(categoryAvgSubscription, currency)}` : null;

  if (cheaperPct != null && avg) {
    if (cheaperPct >= 8) {
      return `${productName}’s ${price} starting price is below the ${avg} category average, but subscription price alone doesn’t tell the full story. Heavy image and video use can increase the real monthly cost considerably.`;
    }
    if (cheaperPct <= -8) {
      return `${productName}’s ${price} starting price sits above the ${avg} category average. Subscription price alone doesn’t tell the full story — credit-based media use can push the real monthly cost higher still.`;
    }
    return `${productName}’s ${price} starting price is close to the ${avg} category average, but subscription price alone doesn’t tell the full story. Heavy image and video use can increase the real monthly cost considerably.`;
  }

  return `${productName}’s ${price} starting price is only the entry point. Your real monthly cost depends on how much you use credit-based features like images, video, and voice.`;
}

export function buildPlansIntro(
  productName: string,
  plans: PricingPlanColumn[],
  yearlySavings: number | null,
): string | null {
  const paid = paidPlans(plans);
  const hasFree = plans.some((p) => p.isFree);
  if (paid.length === 0 && !hasFree) return null;

  const primary = primaryPaid(plans);
  const monthly = primary?.billing?.monthly?.monthlyPrice ?? null;
  const yearlyMonthly = primary?.billing?.yearly?.monthlyPrice ?? null;
  const credits = primary?.includedCredits ?? null;
  const currency = 'USD';

  if (paid.length === 1 && hasFree && primary && monthly != null) {
    const annualBit =
      yearlyMonthly != null
        ? `, or ${money(yearlyMonthly, currency)} per month when billed annually`
        : yearlySavings
          ? ', with a cheaper annual option'
          : '';
    const creditBit =
      credits != null && credits > 0
        ? `, and includes ${credits} shared credits each month`
        : '';
    return `${productName} has a free plan and one paid ${primary.name} plan. ${primary.name} costs ${money(monthly, currency)} monthly${annualBit}${creditBit}.`;
  }

  const planPhrase =
    paid.length === 0
      ? 'a free plan'
      : paid.length === 1 && hasFree
        ? `a free plan and one paid ${paid[0].name} plan`
        : paid.length === 1
          ? `a paid ${paid[0].name} plan`
          : hasFree
            ? `a free plan plus ${paid.map((p) => p.name).join(', ')}`
            : paid.length === 2
              ? `${paid[0].name} and ${paid[1].name}`
              : `${paid
                  .slice(0, -1)
                  .map((p) => p.name)
                  .join(', ')}, and ${paid[paid.length - 1].name}`;

  const creditBit =
    credits != null && credits > 0
      ? ` Paid plans include ${credits} shared credits each month for images, videos, voice, and other features.`
      : ' Paid plans include a shared monthly credit pool for media features.';
  const annualBit = yearlySavings
    ? ' Annual billing is cheaper, but features and credit allowance stay the same.'
    : '';

  return `${productName} has ${planPhrase}.${creditBit}${annualBit}`.trim();
}

export function buildUsageIntro(productName: string): string {
  return `The advertised subscription price only tells part of the story. We estimate what light, regular, and heavy ${productName} users would actually spend after accounting for credit usage.`;
}

export function buildFeatureCostsIntro(): string {
  return 'Credit costs vary a lot by feature. Here’s what we measured for images, videos, voice messages, phone calls, and custom characters.';
}

export function buildCompareIntro(input: {
  productName: string;
  cheaperPct: number | null;
}): string {
  const { productName, cheaperPct } = input;
  if (cheaperPct != null && cheaperPct >= 8) {
    return `${productName} looks strong on subscription price, but the full picture depends on usage. Here’s how it compares with category averages across plans, real-world cost, and individual features.`;
  }
  if (cheaperPct != null && cheaperPct <= -8) {
    return `${productName} starts higher than average on subscription price. Here’s the full comparison across plans, real-world cost, and individual features.`;
  }
  return `Here’s how ${productName} compares with category averages across subscription price, real-world usage cost, and individual features.`;
}

export function buildHermanTake(input: {
  productName: string;
  advertisedMonthly: number | null;
  regularUseMonthly: number | null;
  currency: string;
}): string {
  const { productName, advertisedMonthly, regularUseMonthly, currency } = input;
  if (
    advertisedMonthly != null
    && regularUseMonthly != null
    && regularUseMonthly > advertisedMonthly * 1.4
  ) {
    return `${productName} looks cheap at first, but the value depends heavily on how much media you generate. It’s good value for chat-focused users; heavy image and video users should pay much more attention to credit costs.`;
  }
  if (advertisedMonthly != null) {
    return `${productName}’s ${money(advertisedMonthly, currency)} starting price is only part of the story. Check the usage estimates above before deciding whether it’s good value for how you actually use the app.`;
  }
  return `Pricing value on ${productName} depends on how you use credit-based features. Use the estimates above to match the plan to your habits.`;
}

export function freeVsPaidHeading(plans: PricingPlanColumn[]): string {
  const hasFree = plans.some((p) => p.isFree);
  const paid = paidPlans(plans);
  if (hasFree && paid.length >= 1) return 'Free vs. paid';
  if (paid.length > 1) return 'Plan comparison';
  return 'What’s included';
}
