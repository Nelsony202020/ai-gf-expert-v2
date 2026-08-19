import type {
  PricingBillingToggle,
  PricingCreditPool,
  PricingCreditPoolItem,
  PricingLimitRow,
  PricingPlanColumn,
  PricingPlanCreditBudget,
  PricingTopUpPackage,
  PricingTopUps,
} from './types';
import { buildCreditMixer } from './creditMixer';
import {
  bestValuePackage,
  fmtMoney,
  packageTotalCredits,
  pricePerCredit,
  type CreditPackageLike,
  type FeatureCostLike,
} from '../pricing/calc';

import { buildPlansIntro as buildPlansIntroCopy } from './sectionCopy';

const CREDIT_POOL_NOTE =
  'Credits are shared across features. Use them all on one feature, or split them across images, video, voice messages, and calls.';

const CREDIT_FEATURE_DEFS: Array<{ key: string; labels: string[]; label: string; icon: string }> = [
  { key: 'images', labels: ['Images'], label: 'Images', icon: 'image' },
  { key: 'videos', labels: ['Video', 'Videos'], label: 'Videos', icon: 'videocam' },
  { key: 'voice_messages', labels: ['Voice messages'], label: 'Voice messages', icon: 'graphic_eq' },
  { key: 'voice_calls', labels: ['Voice calls'], label: 'Voice calls', icon: 'call' },
  {
    key: 'custom_character',
    labels: ['Custom character', 'Custom characters', 'Character creation'],
    label: 'Custom character',
    icon: 'person_edit',
  },
];

export function buildPlansIntro(
  productName: string,
  plans: PricingPlanColumn[],
  yearlySavings: number | null,
): string | null {
  return buildPlansIntroCopy(productName, plans, yearlySavings);
}

export function parseIncludedCreditsFromRows(
  rows: PricingPlanColumn['rows'],
): number | null {
  const row = rows.find((r) => /included\s+credits/i.test(r.label));
  if (!row) return null;
  const match = String(row.value).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function looksLikeCreditEstimate(value: string): boolean {
  const v = value.trim();
  if (!v || v === '—' || /^unlimited$/i.test(v) || /^included$/i.test(v)) return false;
  if (/uses\s+credits/i.test(v)) return true;
  if (/≈|~/.test(v)) return true;
  if (/\b(videos?|hrs?|min|images?|characters?)\b/i.test(v) && /\/\s*mo/i.test(v)) return true;
  if (/^\d+(\.\d+)?\s*\/\s*mo$/i.test(v)) return true;
  return false;
}

function findPlanRow(plan: PricingPlanColumn, labels: string[]) {
  return plan.rows.find((r) => labels.some((l) => r.label.toLowerCase() === l.toLowerCase()));
}

function buildPlanHighlights(plan: PricingPlanColumn): string[] {
  const highlights: string[] = [];
  for (const row of plan.rows) {
    if (/included\s+credits/i.test(row.label)) continue;
    const value = row.value.trim();
    if (!value || value === '—') continue;
    if (/unlimited/i.test(value)) {
      highlights.push(`${row.label} unlimited`);
    } else if (/uses\s+credits/i.test(value) || looksLikeCreditEstimate(value)) {
      highlights.push(`${row.label} uses credits`);
    } else if (plan.isFree) {
      highlights.push(`${row.label}: ${value}`);
    }
  }
  return highlights.slice(0, 4);
}

function isSharedCreditFeatureValue(value: string): boolean {
  const v = value.trim();
  if (!v || v === '—') return false;
  if (/unlimited|included/i.test(v)) return false;
  if (/uses\s+credits/i.test(v)) return true;
  return looksLikeCreditEstimate(v);
}

function sharedCreditChannelKeys(
  plan: PricingPlanColumn,
): Array<'images' | 'videos' | 'voice_messages' | 'voice_calls' | 'custom_character'> | null {
  const keys: Array<'images' | 'videos' | 'voice_messages' | 'voice_calls' | 'custom_character'> = [];
  let sawRow = false;
  for (const def of CREDIT_FEATURE_DEFS) {
    const row = findPlanRow(plan, def.labels);
    if (!row) continue;
    sawRow = true;
    if (isSharedCreditFeatureValue(row.value)) {
      keys.push(def.key as (typeof keys)[number]);
    }
  }
  // No feature rows → keep default mixer channels from costs.
  return sawRow ? keys : null;
}

function buildPlanBudget(
  plan: PricingPlanColumn,
  costs: FeatureCostLike[],
  opts: { ratePerCredit?: number | null; currency?: string },
): PricingPlanCreditBudget {
  const credits = plan.isFree
    ? null
    : plan.includedCredits ?? parseIncludedCreditsFromRows(plan.rows);
  const includeKeys = sharedCreditChannelKeys(plan);
  const mixer =
    credits != null && credits > 0
      ? buildCreditMixer(credits, costs, { ...opts, includeChannelKeys: includeKeys })
      : null;

  const items: PricingCreditPoolItem[] = [];
  for (const def of CREDIT_FEATURE_DEFS) {
    const row = findPlanRow(plan, def.labels);
    if (!row) continue;
    const value = row.value.replace(/≈/g, '').trim();
    if (!value || value === '—') continue;
    if (
      plan.isFree
      || looksLikeCreditEstimate(value)
      || /uses\s+credits|unlimited|included/i.test(value)
    ) {
      items.push({
        key: def.key,
        label: def.label,
        icon: def.icon,
        value: /≈|~/.test(row.value) || looksLikeCreditEstimate(row.value)
          ? (row.value.startsWith('≈') || row.value.startsWith('~') ? row.value : `≈${value}`)
          : value,
        sublabel: row.sublabel,
      });
    }
  }

  const skimItems =
    mixer && mixer.channels.length > 0
      ? mixer.channels.map((ch) => ({
          key: ch.key,
          label: ch.label,
          icon: ch.icon,
          value: ch.maxLabel,
          sublabel: ch.sublabel ?? undefined,
        }))
      : items;

  return {
    planKey: plan.key,
    displayName: plan.displayName,
    isFree: plan.isFree,
    credits,
    creditsLine:
      credits != null && credits > 0 ? `Included each month: ${credits} credits` : null,
    items: skimItems,
    mixer,
    highlights: buildPlanHighlights(plan),
  };
}

export function finalizePlanColumns(columns: PricingPlanColumn[]): PricingPlanColumn[] {
  return columns.map((plan) => {
    const includedCredits = parseIncludedCreditsFromRows(plan.rows);
    const summaryLine = plan.isFree
      ? 'Limited daily usage'
      : includedCredits != null
        ? `${includedCredits} credits/month`
        : plan.summaryLine || 'Paid plan';
    return {
      ...plan,
      displayName: plan.isFree ? 'Free' : plan.name,
      includedCredits,
      summaryLine,
      tone: 'neutral' as const,
    };
  });
}

export function buildCreditPool(
  plans: PricingPlanColumn[],
  costs: FeatureCostLike[] = [],
  opts: { ratePerCredit?: number | null; currency?: string } = {},
): PricingCreditPool | null {
  if (plans.length === 0) return null;

  const byPlan: Record<string, PricingPlanCreditBudget> = {};
  for (const plan of plans) {
    byPlan[plan.key] = buildPlanBudget(plan, costs, opts);
  }

  const defaultPaid =
    plans.find((p) => !p.isFree && p.isRecommended)
    ?? plans.find((p) => !p.isFree)
    ?? null;
  const defaultPlan = defaultPaid ?? plans[0]!;
  const active = byPlan[defaultPlan.key];
  if (!active) return null;

  const hasUsable = Object.values(byPlan).some((b) => b.mixer != null || b.items.length > 0);
  if (!hasUsable) return null;

  const defaultInterval: 'monthly' | 'quarterly' | 'yearly' =
    defaultPlan.billing?.monthly
      ? 'monthly'
      : defaultPlan.billing?.quarterly
        ? 'quarterly'
        : defaultPlan.billing?.yearly
          ? 'yearly'
          : 'monthly';

  return {
    heading: 'What your plan can buy',
    note: active.mixer?.lead ?? CREDIT_POOL_NOTE,
    defaultPlanKey: defaultPlan.key,
    defaultInterval,
    byPlan,
    credits: active.credits ?? 0,
    creditsLine: active.creditsLine,
    items: active.items,
    mixer: active.mixer,
  };
}

export function buildLimitRows(plans: PricingPlanColumn[]): PricingLimitRow[] {
  if (plans.length === 0) return [];
  const defs: Array<{
    key: string;
    labels: string[];
    label: string;
    icon: string;
    creditGated: boolean;
  }> = [
    { key: 'chat', labels: ['Chat'], label: 'Chat', icon: 'chat', creditGated: false },
    { key: 'images', labels: ['Images'], label: 'Images', icon: 'image', creditGated: true },
    { key: 'videos', labels: ['Video', 'Videos'], label: 'Video', icon: 'videocam', creditGated: true },
    {
      key: 'voice_messages',
      labels: ['Voice messages'],
      label: 'Voice messages',
      icon: 'graphic_eq',
      creditGated: true,
    },
    {
      key: 'voice_calls',
      labels: ['Voice calls'],
      label: 'Voice calls',
      icon: 'call',
      creditGated: true,
    },
    {
      key: 'custom_character',
      labels: ['Custom character', 'Custom characters', 'Character creation'],
      label: 'Custom character',
      icon: 'person_edit',
      creditGated: true,
    },
  ];

  const rows: PricingLimitRow[] = [];
  for (const def of defs) {
    const cells = plans.map((plan) => {
      const row = findPlanRow(plan, def.labels);
      if (!row) return '—';
      const value = row.value.trim();
      if (!value) return '—';
      if (def.creditGated && !plan.isFree && looksLikeCreditEstimate(value)) {
        return 'Uses credits';
      }
      return value;
    });
    if (cells.every((c) => c === '—')) continue;
    rows.push({ key: def.key, label: def.label, icon: def.icon, cells });
  }
  return rows;
}

export function buildBillingToggle(plans: PricingPlanColumn[]): PricingBillingToggle {
  const paidWithYearly = plans.filter((p) => !p.isFree && p.billing?.yearly);
  const paidWithMonthly = plans.filter((p) => !p.isFree && p.billing?.monthly);
  const show = paidWithMonthly.length > 0 && paidWithYearly.length > 0;
  const savings = paidWithYearly
    .map((p) => p.billing?.yearly?.savingsPercent)
    .filter((n): n is number => n != null && n > 0);
  const maxYearlySavingsPercent = savings.length > 0 ? Math.round(Math.max(...savings)) : null;

  return {
    show,
    defaultInterval: 'monthly',
    monthlyLabel: 'Monthly',
    // Savings appear under the plan price when Annual is selected — keep the toggle plain.
    yearlyLabel: 'Annual',
    maxYearlySavingsPercent,
    annualBadge: null,
  };
}

function packageCurrency(pkg: CreditPackageLike, fallback: string): string {
  const c = String(pkg.currency ?? '').trim().toUpperCase();
  return c.length === 3 ? c : fallback;
}

export function buildTopUps(
  packages: CreditPackageLike[],
  currency: string,
): PricingTopUps | null {
  const active = packages
    .filter((p) => p.active !== false)
    .map((pkg) => {
      const credits = packageTotalCredits(pkg);
      const price = pkg.price != null && Number.isFinite(pkg.price) ? Number(pkg.price) : null;
      const rate = pricePerCredit(pkg);
      const base = pkg.baseCredits != null && Number.isFinite(Number(pkg.baseCredits))
        ? Number(pkg.baseCredits)
        : null;
      const bonus = pkg.bonusCredits != null && Number.isFinite(Number(pkg.bonusCredits))
        ? Number(pkg.bonusCredits)
        : null;
      if (credits == null || credits <= 0 || price == null || rate == null) return null;
      return {
        pkg,
        credits,
        price,
        rate,
        base,
        bonus,
        currency: packageCurrency(pkg, currency),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => a.credits - b.credits);

  if (active.length === 0) return null;

  const baseline = active[0]!;
  const best = bestValuePackage(packages);

  const pick =
    active.length <= 8
      ? active
      : [
          active[0]!,
          active.find((r) => best && r.pkg === best) ?? active[Math.floor(active.length / 2)]!,
          active[active.length - 1]!,
        ].filter((row, idx, arr) => arr.findIndex((r) => r.credits === row.credits && r.price === row.price) === idx);

  const rows: PricingTopUpPackage[] = pick.map((row) => {
    const isBest = Boolean(best && row.pkg === best);
    const betterPct =
      baseline.rate > 0 && row.rate < baseline.rate - 1e-12
        ? Math.round(((baseline.rate - row.rate) / baseline.rate) * 100)
        : 0;

    let valueLabel = '—';
    if (betterPct > 0) {
      valueLabel = `${betterPct}% better value`;
    }

    const hasBonus = row.bonus != null && row.bonus > 0 && row.base != null && row.base > 0;
    return {
      key: `${row.credits}-${row.price}`,
      creditsLabel: `${row.credits.toLocaleString('en-US')} credits`,
      bonusDetail: hasBonus
        ? `${row.base!.toLocaleString('en-US')} + ${row.bonus!.toLocaleString('en-US')} bonus`
        : null,
      credits: row.credits,
      baseCredits: row.base,
      bonusCredits: row.bonus,
      priceLabel: fmtMoney(row.price, row.currency),
      valueLabel,
      isBestValue: isBest,
      isEstimatePackage: Boolean(best && row.pkg === best),
    };
  });

  const estimatePkg = rows.find((r) => r.isEstimatePackage) ?? null;
  const estimateNote = estimatePkg
    ? 'Regular-use estimate: We use this pack when calculating the estimated monthly cost.'
    : null;

  return {
    heading: 'Need more credits?',
    intro:
      'If you use all of your included credits, you can buy extra credit packs. Larger packs usually give you more credits for your money.',
    packages: rows,
    estimateNote,
    truncated: active.length > pick.length,
  };
}
