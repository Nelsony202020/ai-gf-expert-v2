/**
 * Compact structured pricing facts for Pricing page-copy AI.
 * Built in code — never ask the LLM to discover these.
 */

import { getDb, isDbConfigured } from '../db/server';
import { HttpError } from '../db/auth';
import {
  bestValuePackage,
  fmtMoney,
  lowestPlainMonthlyPrice,
  packageTotalCredits,
  pricePerCredit,
  type CreditPackageLike,
  type FeatureCostLike,
  type PlanTierLike,
} from '../pricing/calc';
import { buildPricingCalculatedSummary } from '../pricing/calculatedSummary';
import { collectPricingStats } from '../pricing/statistics';
import { loadFreeAccessFromTesting } from '../pricing-tab/freeAccess';
import {
  buildCompareIntro,
  buildMarketAutoLead,
  buildPageIntro,
} from '../pricing-tab/sectionCopy';
import { inputHash } from '../ai-verdict/hash';
import { parsePricingPageCopy } from '../pricing/pageCopy';

export type PricingCopyFieldId =
  | 'introduction'
  | 'marketPositionCommentary'
  | 'comparisonCommentary'
  | 'expertOpinion'
  | 'plansNote'
  | 'realWorldCostCommentary';

export interface PricingFactsPacket {
  productId: string;
  productName: string;
  productSlug: string;
  snapshotId: string;
  currency: string;
  pricingModel: string | null;
  startingMonthly: number | null;
  typicalMonthlyPrice: number | null;
  cheaperPct: number | null;
  marketPositionLabel: string | null;
  includedCredits: number | null;
  unlimitedChat: boolean | null;
  lightUseMonthly: number | null;
  regularUseMonthly: number | null;
  heavyUseMonthly: number | null;
  bestValuePack: string | null;
  pricePerCredit: number | null;
  mediaUsesCredits: boolean;
  featureCostHints: string[];
  freeAccessHints: string[];
  billingHints: string[];
  /** Compact lines for prompts / hashing (no empty values). */
  factLines: string[];
  autoPageIntro: string | null;
  autoMarketLead: string | null;
  autoCompareIntro: string | null;
  notesInputHash: string;
}

function money(n: number | null | undefined, currency: string): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  return fmtMoney(n, currency);
}

function marketLabel(cheaperPct: number | null): string | null {
  if (cheaperPct == null) return null;
  if (Math.abs(cheaperPct) <= 3) return 'about average';
  if (cheaperPct > 3) return `${cheaperPct}% cheaper than typical`;
  return `${Math.abs(cheaperPct)}% more than typical`;
}

function hasUnlimitedChat(tiers: PlanTierLike[]): boolean | null {
  const paid = tiers.find((t) => Number(t.price ?? 0) > 0) ?? tiers[0];
  if (!paid) return null;
  const allowances = (paid as { allowances?: Array<{ sourceLabel?: string; accessType?: string }> })
    .allowances;
  if (!Array.isArray(allowances)) return null;
  const chat = allowances.find((a) => /chat/i.test(String(a.sourceLabel ?? '')));
  if (!chat) return null;
  return chat.accessType === 'unlimited';
}

function includedCreditsFromTiers(tiers: PlanTierLike[]): number | null {
  for (const t of tiers) {
    const n = Number((t as { includedTokens?: unknown }).includedTokens ?? 0);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function billingHints(tiers: PlanTierLike[], currency: string): string[] {
  const hints: string[] = [];
  for (const t of tiers.slice(0, 4)) {
    const name = String(t.name ?? 'Plan');
    const opts = Array.isArray((t as { billingOptions?: unknown[] }).billingOptions)
      ? ((t as { billingOptions: Array<{ interval?: string; price?: number; active?: boolean }> })
          .billingOptions)
      : [];
    const active = opts.filter((o) => o.active !== false);
    for (const o of active) {
      if (o.price == null) continue;
      hints.push(`${name} ${o.interval ?? 'billing'}: ${money(o.price, currency)}`);
    }
  }
  return hints.slice(0, 8);
}

function featureHints(costs: FeatureCostLike[], currency: string, bestPkg: CreditPackageLike | null): string[] {
  const hints: string[] = [];
  for (const c of costs.slice(0, 8)) {
    const type = String(c.featureType ?? 'feature');
    const credits =
      c.creditCost
      ?? (c.minCost != null && c.maxCost != null && c.minCost === c.maxCost ? c.minCost : null)
      ?? c.minCost
      ?? null;
    if (credits == null) continue;
    const rate = bestPkg ? pricePerCredit(bestPkg) : null;
    const dollars =
      rate != null && Number.isFinite(Number(credits))
        ? money(Number(credits) * rate, currency)
        : null;
    hints.push(
      dollars
        ? `${type}: ~${credits} credits (~${dollars})`
        : `${type}: ~${credits} credits`,
    );
  }
  return hints;
}

export async function assemblePricingFacts(productId: string): Promise<PricingFactsPacket> {
  if (!isDbConfigured()) throw new HttpError(503, 'Database not configured');
  const db = getDb();
  const { products } = await db.query({
    products: {
      $: { where: { id: productId } },
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
      pricingSnapshots: {},
    },
  });
  const product = (products as any[])?.[0];
  if (!product) throw new HttpError(404, 'Product not found');

  const snapshots = ((product.pricingSnapshots ?? []) as any[]).filter((s) => !s.deletedAt);
  const snapshot =
    snapshots.find((s) => s.status === 'active')
    ?? snapshots.find((s) => s.status === 'draft')
    ?? snapshots[0];
  if (!snapshot) throw new HttpError(400, 'No pricing snapshot found');

  const tiers = ((product.subscriptionPlans ?? []) as PlanTierLike[]).filter(
    (t) => (t as { active?: boolean; deletedAt?: unknown }).active !== false
      && !(t as { deletedAt?: unknown }).deletedAt,
  );
  const packages = ((product.creditPackages ?? []) as CreditPackageLike[]).filter(
    (p) => (p as { active?: boolean; deletedAt?: unknown }).active !== false
      && !(p as { deletedAt?: unknown }).deletedAt,
  );
  const costs = ((product.featureCosts ?? []) as FeatureCostLike[]).filter(
    (c) => (c as { active?: boolean; deletedAt?: unknown }).active !== false
      && !(c as { deletedAt?: unknown }).deletedAt,
  );

  const currency = String(product.priceCurrency ?? 'USD');
  const pricingModel =
    snapshot.pricingModel != null ? String(snapshot.pricingModel) : null;
  const startingMonthly = lowestPlainMonthlyPrice(tiers);
  const stats = await collectPricingStats();
  const typicalMonthlyPrice = stats.medianMonthlyPrice;
  const cheaperPct =
    startingMonthly != null && typicalMonthlyPrice != null && typicalMonthlyPrice > 0
      ? Math.round(((typicalMonthlyPrice - startingMonthly) / typicalMonthlyPrice) * 100)
      : null;

  const calc = buildPricingCalculatedSummary({
    tiers,
    packages,
    featureCosts: costs,
    usageScenarios: snapshot.usageScenarios,
    currency,
    typicalMonthlyPrice,
  });
  const row = (key: string) => calc.rows.find((r) => r.key === key)?.value ?? null;
  const parseMoneyish = (label: string | null): number | null => {
    if (!label || label === '—') return null;
    const m = label.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    return m ? Number(m[1]) : null;
  };

  const bestPkg = bestValuePackage(packages);
  const rate = bestPkg ? pricePerCredit(bestPkg) : null;
  const bestLabel = bestPkg
    ? `${String(bestPkg.name ?? 'Pack')} (${money(Number(bestPkg.price), currency)}; ${packageTotalCredits(bestPkg) ?? '?'} credits)`
    : null;

  const free = await loadFreeAccessFromTesting(String(product.slug));
  const freeAccessHints: string[] = [];
  if (free) {
    if (free.chat) freeAccessHints.push(`Free chat: ${free.chat.label}`);
    if (free.images) freeAccessHints.push(`Free images: ${free.images.label}`);
    if (free.video) freeAccessHints.push(`Free video: ${free.video.label}`);
    if (free.voice) freeAccessHints.push(`Free voice: ${free.voice.label}`);
    if (free.characters) freeAccessHints.push(`Free characters: ${free.characters.label}`);
    if (free.trialWithoutCreditCard != null) {
      freeAccessHints.push(
        `Trial without card: ${free.trialWithoutCreditCard ? 'yes' : 'no'}`,
      );
    }
  }

  const mediaUsesCredits = costs.some((c) =>
    /image|video|voice|character/i.test(String(c.featureType ?? '')),
  );
  const unlimitedChat = hasUnlimitedChat(tiers);
  const includedCredits = includedCreditsFromTiers(tiers);
  const marketPositionLabel = marketLabel(cheaperPct);

  const autoMarketLead = buildMarketAutoLead({
    productName: String(product.name),
    advertisedMonthly: startingMonthly,
    typicalMonthlyPrice,
    currency,
    cheaperPct,
  });
  const autoPageIntro = buildPageIntro({
    productName: String(product.name),
    pricingModel,
    advertisedMonthly: startingMonthly,
    currency,
    plans: tiers.map((t, i) => ({
      key: String((t as { id?: string }).id ?? i),
      name: String(t.name ?? 'Plan'),
      displayName: String(t.name ?? 'Plan'),
      isFree: Number(t.price ?? 0) === 0,
      isRecommended: i === 0,
      priceLabel: '—',
      summaryLine: '',
      includedCredits,
      tone: i === 0 ? 'accent' as const : 'neutral' as const,
      billing: null,
      rows: [],
    })),
  });
  const autoCompareIntro = buildCompareIntro();

  const factLines: string[] = [];
  const push = (line: string | null | undefined) => {
    const t = String(line ?? '').trim();
    if (t) factLines.push(t);
  };
  push(`Pricing model: ${pricingModel ?? 'unknown'}`);
  push(startingMonthly != null ? `Starting monthly price: ${money(startingMonthly, currency)}/mo` : null);
  push(typicalMonthlyPrice != null ? `Typical monthly price (median): ~${money(typicalMonthlyPrice, currency)}/mo` : null);
  push(cheaperPct != null ? `Difference vs typical: ${cheaperPct}%` : null);
  push(marketPositionLabel ? `Market position: ${marketPositionLabel}` : null);
  push(includedCredits != null ? `Included credits: ${includedCredits}/month` : null);
  push(unlimitedChat === true ? 'Paid chat: unlimited' : unlimitedChat === false ? 'Paid chat: limited' : null);
  push(row('light') && row('light') !== '—' ? `Light-use estimate: ${row('light')}` : null);
  push(row('regular') && row('regular') !== '—' ? `Regular-use estimate: ${row('regular')}` : null);
  push(row('heavy') && row('heavy') !== '—' ? `Heavy-use estimate: ${row('heavy')}` : null);
  push(bestLabel ? `Best-value top-up: ${bestLabel}` : null);
  push(rate != null ? `Best pack price per credit: ${money(rate, currency)}` : null);
  push(mediaUsesCredits ? 'Images, video, and voice can use credits' : null);
  for (const h of billingHints(tiers, currency)) push(h);
  for (const h of featureHints(costs, currency, bestPkg)) push(h);
  for (const h of freeAccessHints) push(h);

  const hashPayload = {
    productId,
    snapshotId: snapshot.id,
    pricingModel,
    startingMonthly,
    typicalMonthlyPrice,
    cheaperPct,
    includedCredits,
    unlimitedChat,
    light: row('light'),
    regular: row('regular'),
    heavy: row('heavy'),
    bestLabel,
    rate,
    mediaUsesCredits,
    featureCostHints: featureHints(costs, currency, bestPkg),
    freeAccessHints,
    billingHints: billingHints(tiers, currency),
    verifiedAt: snapshot.verifiedAt ?? null,
    usageScenarios: snapshot.usageScenarios ?? null,
  };

  return {
    productId,
    productName: String(product.name),
    productSlug: String(product.slug),
    snapshotId: String(snapshot.id),
    currency,
    pricingModel,
    startingMonthly,
    typicalMonthlyPrice,
    cheaperPct,
    marketPositionLabel,
    includedCredits,
    unlimitedChat,
    lightUseMonthly: parseMoneyish(row('light')),
    regularUseMonthly: parseMoneyish(row('regular')),
    heavyUseMonthly: parseMoneyish(row('heavy')),
    bestValuePack: bestLabel,
    pricePerCredit: rate,
    mediaUsesCredits,
    featureCostHints: featureHints(costs, currency, bestPkg),
    freeAccessHints,
    billingHints: billingHints(tiers, currency),
    factLines,
    autoPageIntro,
    autoMarketLead,
    autoCompareIntro,
    notesInputHash: inputHash(hashPayload),
  };
}

export function fieldContextLines(
  field: PricingCopyFieldId,
  facts: PricingFactsPacket,
): string[] {
  const lines: string[] = [];
  const add = (...keys: Array<string | null | undefined>) => {
    for (const k of keys) {
      if (!k) continue;
      const match = facts.factLines.find((l) => l.toLowerCase().startsWith(k.toLowerCase()));
      if (match) lines.push(match);
    }
  };

  switch (field) {
    case 'introduction':
      add('Pricing model', 'Starting monthly', 'Included credits', 'Paid chat');
      lines.push(...facts.billingHints.slice(0, 4));
      if (facts.mediaUsesCredits) lines.push('Images, video, and voice can use credits');
      break;
    case 'marketPositionCommentary':
      add(
        'Starting monthly',
        'Category average',
        'Difference vs average',
        'Market position',
        'Regular-use',
        'Heavy-use',
      );
      if (facts.mediaUsesCredits) lines.push('Images, video, and voice can use credits');
      break;
    case 'comparisonCommentary':
      add(
        'Starting monthly',
        'Category average',
        'Difference vs average',
        'Light-use',
        'Regular-use',
        'Heavy-use',
      );
      lines.push(...facts.featureCostHints.slice(0, 4));
      break;
    case 'expertOpinion':
      lines.push(...facts.factLines.slice(0, 14));
      break;
    case 'plansNote':
      add('Pricing model', 'Starting monthly', 'Included credits');
      lines.push(...facts.billingHints.slice(0, 4));
      break;
    case 'realWorldCostCommentary':
      add('Light-use', 'Regular-use', 'Heavy-use', 'Best-value', 'Best pack');
      if (facts.mediaUsesCredits) lines.push('Images, video, and voice can use credits');
      break;
    default:
      lines.push(...facts.factLines.slice(0, 10));
  }

  return [...new Set(lines.filter(Boolean))];
}

export function fieldMeta(field: PricingCopyFieldId, productName: string): {
  label: string;
  purpose: string;
  targetLength: string;
  automaticText: string | null;
} {
  switch (field) {
    case 'introduction':
      return {
        label: `${productName} pricing — introduction`,
        purpose: `Explain how ${productName} pricing works before the detailed analysis begins.`,
        targetLength: '2-3 short sentences',
        automaticText: null,
      };
    case 'marketPositionCommentary':
      return {
        label: `Is ${productName} expensive?`,
        purpose: 'Add editorial interpretation after the automatically generated market-price comparison.',
        targetLength: '1-2 short sentences',
        automaticText: null, // filled by caller with facts.autoMarketLead
      };
    case 'comparisonCommentary':
      return {
        label: `How ${productName} pricing compares`,
        purpose: 'Add interpretation after the automatic comparison lead. Do not restate the table.',
        targetLength: '1-2 short sentences',
        automaticText: null,
      };
    case 'expertOpinion':
      return {
        label: `Our take on ${productName}'s pricing`,
        purpose: 'Write the final pricing verdict: who gets good value and who may overspend.',
        targetLength: '2-4 short sentences',
        automaticText: null,
      };
    case 'plansNote':
      return {
        label: 'Plans & what you get',
        purpose: 'Optional extra note under the automatic plans summary.',
        targetLength: '1-2 short sentences',
        automaticText: null,
      };
    case 'realWorldCostCommentary':
      return {
        label: "What you'll actually pay",
        purpose: 'Optional note under usage cost estimates. Do not restate the numbers.',
        targetLength: '1-2 short sentences',
        automaticText: null,
      };
  }
}

export function getSnapshotPageCopy(snapshot: { pageCopy?: unknown }) {
  return parsePricingPageCopy(snapshot.pageCopy);
}
