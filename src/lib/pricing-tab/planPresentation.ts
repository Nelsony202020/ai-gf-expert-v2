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
  freeAccessCellLabel,
  type PricingFreeAccess,
} from './freeAccessShared';
import {
  bestValuePackage,
  fmtMoney,
  formatUseCount,
  packageTotalCredits,
  pricePerCredit,
  type CreditPackageLike,
  type FeatureCostLike,
} from '../pricing/calc';

import { buildPlansIntro as buildPlansIntroCopy } from './sectionCopy';

const CREDIT_POOL_NOTE =
  'Your credits are shared across paid features. Spend them all on one feature, or mix them however you want.';

const CREDIT_FEATURE_DEFS: Array<{ key: string; labels: string[]; label: string; icon: string }> = [
  { key: 'images', labels: ['Images', 'Standard images'], label: 'Standard images', icon: 'image' },
  {
    key: 'premium_images',
    labels: ['Premium images'],
    label: 'Premium images',
    icon: 'photo',
  },
  { key: 'videos', labels: ['Video', 'Videos', '10-sec videos'], label: '10-sec videos', icon: 'videocam' },
  { key: 'voice_messages', labels: ['Voice messages'], label: 'Voice messages', icon: 'mic' },
  { key: 'voice_calls', labels: ['Voice calls'], label: 'Voice calls', icon: 'call' },
  {
    key: 'custom_character',
    labels: ['Custom character', 'Custom characters', 'Character creation', 'Characters'],
    label: 'Characters',
    icon: 'person',
  },
];

/** Large figure for the credit-value grid (number primary, label secondary). */
function skimAmountFromChannel(ch: {
  key: string;
  format: string;
  unitLabel: string;
  maxUnits: number;
}): string {
  if (ch.format === 'minutes' || ch.unitLabel === 'min') {
    const mins = `${formatUseCount(ch.maxUnits)} min`;
    return ch.key === 'voice_calls' ? `~${mins}` : mins;
  }
  const base = formatUseCount(Math.floor(ch.maxUnits));
  if (ch.key === 'videos' || ch.key === 'voice_calls') return `~${base}`;
  return base;
}

function skimAmountFromValue(value: string): string {
  const cleaned = value.replace(/[≈]/g, '~').replace(/\/mo$/i, '').trim();
  const minMatch = cleaned.match(/^([~]?\s*[\d,.]+)\s*min\b/i);
  if (minMatch) return `${minMatch[1].replace(/\s/g, '')} min`;
  const numMatch = cleaned.match(/^([~]?\s*[\d,.]+)/);
  if (numMatch) return numMatch[1].replace(/\s/g, '');
  return cleaned;
}

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
  if (/\b(videos?|hrs?|min|images?|characters?|standard images|premium images)\b/i.test(v)) return true;
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
): Array<'images' | 'premium_images' | 'videos' | 'voice_messages' | 'voice_calls' | 'custom_character'> | null {
  const keys: Array<'images' | 'premium_images' | 'videos' | 'voice_messages' | 'voice_calls' | 'custom_character'> = [];
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
        value,
        amount: skimAmountFromValue(value),
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
          amount: skimAmountFromChannel(ch),
          sublabel: ch.sublabel ?? undefined,
        }))
      : items;

  return {
    planKey: plan.key,
    displayName: plan.displayName,
    isFree: plan.isFree,
    credits,
    creditsLine:
      credits != null && credits > 0
        ? `${credits.toLocaleString('en-US')} credits/month`
        : null,
    items: skimItems,
    mixer,
    highlights: buildPlanHighlights(plan),
  };
}

export function finalizePlanColumns(columns: PricingPlanColumn[]): PricingPlanColumn[] {
  return columns.map((plan) => {
    const includedCredits = plan.isFree
      ? null
      : plan.includedCredits ?? parseIncludedCreditsFromRows(plan.rows);
    const isTestingFree = plan.freeAccessSource === 'testing';
    const summaryLine = plan.isFree
      ? isTestingFree
        ? 'Verified free access limits'
        : 'Limited free usage'
      : includedCredits != null
        ? `${includedCredits.toLocaleString('en-US')} credits/month`
        : plan.summaryLine || 'Paid plan';
    return {
      ...plan,
      displayName: plan.isFree
        ? isTestingFree
          ? 'Free access'
          : 'Free'
        : plan.name,
      name: plan.isFree
        ? isTestingFree
          ? 'Free access'
          : 'Free'
        : plan.name,
      includedCredits: plan.isFree ? null : includedCredits,
      summaryLine,
      tone: 'neutral' as const,
    };
  });
}

/** Build a Free access column from testing evidence (not a subscriptionPlan). */
export function buildFreeAccessPlanColumn(freeAccess: PricingFreeAccess): PricingPlanColumn {
  const rows: PricingPlanColumn['rows'] = [
    { label: 'Chat', value: freeAccessCellLabel(freeAccess.chat) },
    { label: 'Images', value: freeAccessCellLabel(freeAccess.images) },
    { label: 'Video', value: freeAccessCellLabel(freeAccess.video) },
    { label: 'Voice', value: freeAccessCellLabel(freeAccess.voice) },
    { label: 'Custom character', value: freeAccessCellLabel(freeAccess.characters) },
  ];
  if (freeAccess.trialWithoutCreditCard != null) {
    rows.push({
      label: 'Trial without card',
      value: freeAccess.trialWithoutCreditCard ? 'Yes' : 'No',
    });
  }
  return {
    key: 'free-access-testing',
    name: 'Free access',
    displayName: 'Free access',
    isFree: true,
    freeAccessSource: 'testing',
    isRecommended: false,
    priceLabel: '$0',
    priceSub: 'No subscription required',
    summaryLine: 'Verified free access limits',
    includedCredits: null,
    tone: 'neutral',
    billing: null,
    rows,
  };
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
    note: CREDIT_POOL_NOTE,
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
    { key: 'images', labels: ['Images', 'Standard images'], label: 'Images', icon: 'image', creditGated: true },
    { key: 'videos', labels: ['Video', 'Videos'], label: 'Video', icon: 'videocam', creditGated: true },
    {
      key: 'voice',
      labels: ['Voice', 'Voice messages', 'Voice calls'],
      label: 'Voice',
      icon: 'mic',
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
  const paid = plans.filter((p) => !p.isFree);
  const hasMonthly = paid.some((p) => p.billing?.monthly);
  const hasQuarterly = paid.some((p) => p.billing?.quarterly);
  const hasYearly = paid.some((p) => p.billing?.yearly);

  const intervals: PricingBillingToggle['intervals'] = [];
  if (hasMonthly) intervals.push({ key: 'monthly', label: 'Monthly' });
  if (hasQuarterly) intervals.push({ key: 'quarterly', label: 'Quarterly' });
  if (hasYearly) intervals.push({ key: 'yearly', label: 'Annual' });

  const savings = paid
    .map((p) => p.billing?.yearly?.savingsPercent)
    .filter((n): n is number => n != null && n > 0);
  const maxYearlySavingsPercent = savings.length > 0 ? Math.round(Math.max(...savings)) : null;

  return {
    show: intervals.length > 1,
    defaultInterval: hasMonthly ? 'monthly' : intervals[0]?.key ?? 'monthly',
    intervals,
    monthlyLabel: 'Monthly',
    yearlyLabel: 'Annual',
    maxYearlySavingsPercent,
    annualBadge: null,
  };
}

function packageCurrency(_pkg: CreditPackageLike, fallback: string): string {
  // Temporary: treat package price numbers as the product display currency (USD)
  // even when InstantDB still stores EUR on the pack row.
  return fallback || 'USD';
}

export function buildTopUps(
  packages: CreditPackageLike[],
  currency: string,
): PricingTopUps | null {
  const displayCurrency = currency || 'USD';
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
        currency: packageCurrency(pkg, displayCurrency),
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

  const baselineCreditsLabel = `${baseline.credits.toLocaleString('en-US')}-credit pack`;

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
      isEstimatePackage: false,
    };
  });

  return {
    heading: 'Need more credits?',
    intro:
      'If you run out of credits, you can buy more. Bigger credit packs usually cost less per credit.',
    valueColumnLabel: `Value vs. ${baselineCreditsLabel}`,
    packages: rows,
    estimateNote: null,
    truncated: active.length > pick.length,
  };
}
