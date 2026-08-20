import { fmtMoney } from '../pricing/calc';
import type { PricingPlanColumn } from './types';

function money(n: number, currency: string): string {
  return fmtMoney(n, currency);
}

function paidPlans(plans: PricingPlanColumn[]) {
  return plans.filter((p) => !p.isFree);
}

/** Cheapest paid plan by monthly price — used for “starting plan” copy. */
function startingPaid(plans: PricingPlanColumn[]) {
  const paid = paidPlans(plans);
  if (paid.length === 0) return null;
  const priced = paid
    .map((p) => ({
      plan: p,
      monthly:
        p.billing?.monthly?.monthlyPrice
        ?? p.billing?.quarterly?.monthlyPrice
        ?? p.billing?.yearly?.monthlyPrice
        ?? null,
    }))
    .filter((x) => x.monthly != null && Number.isFinite(x.monthly));
  if (priced.length === 0) return paid[0] ?? null;
  priced.sort((a, b) => Number(a.monthly) - Number(b.monthly));
  return priced[0]!.plan;
}

/** @deprecated Prefer startingPaid for intro copy about the entry plan. */
function primaryPaid(plans: PricingPlanColumn[]) {
  return startingPaid(plans);
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
    return `${productName} uses ${model}. The paid plan starts at ${price} per month and includes ${credits.toLocaleString('en-US')} credits that can be spent on images, videos, voice messages, and calls. ${chatBit}`;
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

/** Factual “Is X expensive?” lead — numbers only, no editorial spin. */
export function buildMarketAutoLead(input: {
  productName: string;
  advertisedMonthly: number | null;
  typicalMonthlyPrice: number | null;
  currency: string;
  cheaperPct: number | null;
}): string | null {
  const { productName, advertisedMonthly, typicalMonthlyPrice, currency, cheaperPct } = input;
  if (advertisedMonthly == null) return null;

  const price = money(advertisedMonthly, currency);
  const typical =
    typicalMonthlyPrice != null ? `~${money(typicalMonthlyPrice, currency)}` : null;

  if (cheaperPct != null && typical) {
    // “About average” is shown under the chart — don’t repeat it in the body.
    // Editor commentary (marketPositionCommentary) still joins/shows on its own.
    if (Math.abs(cheaperPct) <= 3) {
      return null;
    }
    if (cheaperPct > 3) {
      return `${productName}’s ${price} starting price is ${cheaperPct}% cheaper than the ${typical} typical price.`;
    }
    return `${productName}’s ${price} starting price is ${Math.abs(cheaperPct)}% more expensive than the ${typical} typical price.`;
  }

  return `${productName}’s ${price} starting price is the advertised entry point.`;
}

/** Short “Is X expensive?” block — auto lead + default interpretive closer. */
export function buildMarketIntro(input: {
  productName: string;
  advertisedMonthly: number | null;
  typicalMonthlyPrice: number | null;
  currency: string;
  cheaperPct: number | null;
}): string | null {
  const lead = buildMarketAutoLead(input);
  if (!lead) return null;

  const { cheaperPct, typicalMonthlyPrice } = input;
  if (cheaperPct != null && typicalMonthlyPrice != null) {
    if (cheaperPct > 3) {
      return `${lead} Subscription price alone doesn’t tell the full story. Heavy image and video use can increase the real monthly cost considerably.`;
    }
    return `${lead} Subscription price alone doesn’t tell the full story — credit-based media use can push the real monthly cost higher still.`;
  }

  return `${lead} Your real monthly cost depends on how much you use credit-based features like images, video, and voice.`;
}

/** Join auto factual lead with optional manual commentary. */
export function joinAutoAndCommentary(
  autoLead: string | null | undefined,
  commentary: string | null | undefined,
  fallback?: string | null,
): string | null {
  const lead = String(autoLead ?? '').trim();
  const note = String(commentary ?? '').trim();
  if (lead && note) return `${lead} ${note}`;
  if (note) return note;
  if (lead) return lead;
  const fb = String(fallback ?? '').trim();
  return fb || null;
}

export function buildPlansIntro(
  productName: string,
  plans: PricingPlanColumn[],
  yearlySavings: number | null,
): string | null {
  const paid = paidPlans(plans);
  const hasFree = plans.some((p) => p.isFree);
  if (paid.length === 0 && !hasFree) return null;

  const primary = startingPaid(plans);
  const monthly = primary?.billing?.monthly?.monthlyPrice ?? null;
  const yearlyMonthly = primary?.billing?.yearly?.monthlyPrice ?? null;
  const credits = primary?.includedCredits ?? null;
  const currency = 'USD';
  const freeCol = plans.find((p) => p.isFree);
  const freeAccessLabel =
    freeCol?.freeAccessSource === 'testing' ? 'free access' : 'a free plan';

  if (paid.length === 1 && hasFree && primary && monthly != null) {
    const annualBit =
      yearlyMonthly != null
        ? `, or ${money(yearlyMonthly, currency)} per month when billed annually`
        : yearlySavings
          ? ', with a cheaper annual option'
          : '';
    const creditBit =
      credits != null && credits > 0
        ? `, and includes ${credits.toLocaleString('en-US')} shared credits each month`
        : '';
    return `${productName} has ${freeAccessLabel} and one paid ${primary.name} plan. ${primary.name} costs ${money(monthly, currency)} monthly${annualBit}${creditBit}.`;
  }

  const planPhrase =
    paid.length === 0
      ? freeAccessLabel
      : paid.length === 1 && hasFree
        ? `${freeAccessLabel} and one paid ${paid[0]!.name} plan`
        : paid.length === 1
          ? `a paid ${paid[0]!.name} plan`
          : hasFree
            ? `${freeAccessLabel} plus ${paid.map((p) => p.name).join(', ')}`
            : paid.length === 2
              ? `${paid[0]!.name} and ${paid[1]!.name}`
              : `${paid
                  .slice(0, -1)
                  .map((p) => p.name)
                  .join(', ')}, and ${paid[paid.length - 1]!.name}`;

  const creditBit =
    credits != null && credits > 0
      ? ` The starting ${primary?.name ?? 'paid'} plan includes ${credits.toLocaleString('en-US')} shared credits each month for images, videos, voice, and other features.`
      : ' Paid plans include a shared monthly credit pool for media features.';
  const annualBit = yearlySavings
    ? ' Annual billing is cheaper, but features and credit allowance stay the same.'
    : '';

  return `${productName} has ${planPhrase}.${creditBit}${annualBit}`.trim();
}

export function buildUsageIntro(_productName?: string): string {
  return "The subscription price isn't always what you'll really spend. We estimate the monthly cost for light, regular, and heavy users based on how many paid features they use.";
}

export function buildFeatureCostsIntro(): string {
  return 'Dollar prices are estimates based on the best-value credit pack. The credit cost is shown below each feature.';
}

export function buildFreeVsPaidIntro(): string {
  return 'See what you get with each plan.';
}

export function buildCompareIntro(_input?: {
  productName?: string;
  cheaperPct?: number | null;
}): string {
  return 'Here’s how it compares with typical prices across plans, real-world cost, and individual features.';
}

/** Drop legacy CMS boilerplate we no longer want on the public page. */
export function isLegacyPricingBoilerplate(text: string | null | undefined): boolean {
  const t = String(text ?? '').trim();
  if (!t) return false;
  return (
    /looks strong on subscription price/i.test(t)
    || /about average for the category \(around/i.test(t)
  );
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
    return `${productName} looks cheap at first, but the value depends heavily on how much media you generate. It’s good value for chat-focused users, while heavy image and video users can spend much more once they start buying extra credits.`;
  }
  if (advertisedMonthly != null) {
    return `${productName}’s ${money(advertisedMonthly, currency)} starting price is only part of the story. Check the usage estimates above before deciding whether it’s good value for how you actually use the app.`;
  }
  return `Pricing value on ${productName} depends on how you use credit-based features. Use the estimates above to match the plan to your habits.`;
}

export function freeVsPaidHeading(_plans?: PricingPlanColumn[]): string {
  return 'What’s included in each plan';
}
