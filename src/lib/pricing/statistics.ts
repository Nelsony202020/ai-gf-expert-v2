// Industry pricing statistics: aggregation layer for the future
// /industry-statistics page. Reads live pricing rows for published products
// and reduces them with the pure calc helpers. No page depends on this yet;
// it exists so the statistics page can ship without new query work.

import { getDb, isDbConfigured } from '../db/server';
import {
  cheapestTopUpRate,
  intervalDiscount,
  lowestMonthlyPrice,
  lowestPlainMonthlyPrice,
  monthlyEquivalent,
  tierBillingOptions,
  type BillingOption,
} from './calc';

export interface ProductPricingStat {
  productId: string;
  name: string;
  slug: string;
  lowestMonthly: number | null;
  lowestMonthlyEquivalent: number | null;
  maxAnnualDiscount: number | null;
  cheapestPer100Credits: number | null;
  hasFreePlan: boolean;
  usesCredits: boolean;
  creditCurrencyName: string | null;
  paymentMethods: string[];
  verifiedAt: number | null;
}

export interface IndustryPricingStats {
  sampleSize: number;
  averageMonthlyPrice: number | null;
  medianMonthlyPrice: number | null;
  cheapestMonthlyPrice: number | null;
  mostExpensiveMonthlyPrice: number | null;
  averageAnnualDiscount: number | null;
  averagePer100Credits: number | null;
  freePlanShare: number | null;
  creditSystemShare: number | null;
  products: ProductPricingStat[];
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function productMaxAnnualDiscount(plans: any[]): number | null {
  let max: number | null = null;
  for (const tier of plans) {
    const options: BillingOption[] = tierBillingOptions(tier).filter((o) => o.active !== false);
    const monthly = options.find((o) => o.interval === 'monthly');
    if (!monthly) continue;
    for (const opt of options) {
      const d = intervalDiscount(monthly.price, opt);
      if (d !== null && (max === null || d > max)) max = d;
    }
  }
  return max;
}

/** Per-product pricing stats for all published products. */
export async function collectPricingStats(): Promise<IndustryPricingStats> {
  if (!isDbConfigured()) {
    return {
      sampleSize: 0,
      averageMonthlyPrice: null,
      medianMonthlyPrice: null,
      cheapestMonthlyPrice: null,
      mostExpensiveMonthlyPrice: null,
      averageAnnualDiscount: null,
      averagePer100Credits: null,
      freePlanShare: null,
      creditSystemShare: null,
      products: [],
    };
  }

  const db = getDb();
  const { products } = await db.query({
    products: {
      subscriptionPlans: {},
      creditPackages: {},
      paymentProfile: {},
      pricingSnapshots: {},
    },
  });

  const stats: ProductPricingStat[] = (products as any[])
    .filter((p) => !p.deletedAt && p.status === 'published')
    .map((p) => {
      const plans = (p.subscriptionPlans ?? []).filter((pl: any) => pl.active);
      const packages = (p.creditPackages ?? []).filter((pkg: any) => pkg.active);
      const activeSnapshot = (p.pricingSnapshots ?? []).find((s: any) => s.status === 'active');
      const currency = (activeSnapshot?.creditCurrency ?? {}) as { displayName?: string };
      const profile = p.paymentProfile;
      const paymentMethods = profile
        ? (
            [
              ['card', profile.creditCard || profile.debitCard],
              ['paypal', profile.paypal],
              ['crypto', profile.crypto],
              ['apple_pay', profile.applePay],
              ['google_pay', profile.googlePay],
              ['bank_transfer', profile.bankTransfer],
            ] as [string, boolean][]
          )
            .filter(([, on]) => on)
            .map(([k]) => k)
        : [];
      const verifiedTimes = [
        Number(activeSnapshot?.verifiedAt ?? 0),
        ...plans.map((pl: any) => Number(pl.lastVerifiedAt ?? 0)),
      ].filter((t) => t > 0);

      return {
        productId: p.id,
        name: p.name,
        slug: p.slug,
        lowestMonthly: lowestPlainMonthlyPrice(plans),
        lowestMonthlyEquivalent: lowestMonthlyPrice(plans),
        maxAnnualDiscount: productMaxAnnualDiscount(plans),
        cheapestPer100Credits: cheapestTopUpRate(packages),
        hasFreePlan: p.capFreePlan === true,
        usesCredits: p.capTokenSystem === true || packages.length > 0,
        creditCurrencyName: currency.displayName ?? null,
        paymentMethods,
        verifiedAt: verifiedTimes.length > 0 ? Math.max(...verifiedTimes) : null,
      };
    });

  const monthlyPrices = stats
    .map((s) => s.lowestMonthly)
    .filter((v): v is number => v !== null);
  const discounts = stats.map((s) => s.maxAnnualDiscount).filter((v): v is number => v !== null);
  const creditRates = stats
    .map((s) => s.cheapestPer100Credits)
    .filter((v): v is number => v !== null);

  return {
    sampleSize: stats.length,
    averageMonthlyPrice: average(monthlyPrices),
    medianMonthlyPrice: median(monthlyPrices),
    cheapestMonthlyPrice: monthlyPrices.length > 0 ? Math.min(...monthlyPrices) : null,
    mostExpensiveMonthlyPrice: monthlyPrices.length > 0 ? Math.max(...monthlyPrices) : null,
    averageAnnualDiscount: average(discounts),
    averagePer100Credits: average(creditRates),
    freePlanShare:
      stats.length > 0 ? Math.round((stats.filter((s) => s.hasFreePlan).length / stats.length) * 100) : null,
    creditSystemShare:
      stats.length > 0 ? Math.round((stats.filter((s) => s.usesCredits).length / stats.length) * 100) : null,
    products: stats,
  };
}

export { monthlyEquivalent };
