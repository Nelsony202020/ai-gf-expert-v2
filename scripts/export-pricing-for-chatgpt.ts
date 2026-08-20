#!/usr/bin/env npx tsx
/**
 * Read-only pricing export for ChatGPT editorial copy.
 *
 * Usage:
 *   npx tsx scripts/export-pricing-for-chatgpt.ts
 *   npm run export:pricing
 *
 * Output: pricing-export/*.md
 *
 * Does NOT write to InstantDB. Strips secrets from dumps.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDb, isDbConfigured } from '../src/lib/db/server';
import { loadProductPreviewBySlug } from '../src/lib/content/store';
import { loadPricingTabViewModel } from '../src/lib/pricing-tab/loadPricingTab';
import { loadDraftRatingsViewModel } from '../src/lib/draft-ratings/loadDraftRatingsData';
import { collectPricingStats } from '../src/lib/pricing/statistics';
import {
  bestValuePackage,
  estimatedFeatureMoneyCost,
  featureCostAvailability,
  featureCostRange,
  fmtMoney,
  intervalDiscount,
  monthlyEquivalent,
  packageTotalCredits,
  pricePer100Credits,
  pricePerCredit,
  tierBillingOptions,
  type CreditPackageLike,
  type FeatureCostLike,
  type PlanTierLike,
} from '../src/lib/pricing/calc';
import {
  ALLOWANCE_ROW_META,
  findAllowance,
  formatAllowanceCell,
  hasExplicitAllowances,
  resolvePlanAllowances,
} from '../src/lib/pricing/planAllowances';
import {
  DEFAULT_USAGE_PROFILES,
  buildUsageCalculation,
  estimateProfile,
  profilesFromSnapshot,
  type UsageProfile,
} from '../src/lib/pricing/usageScenarios';
import { parsePricingPageCopy } from '../src/lib/pricing/pageCopy';
import {
  buildCompareIntro,
  buildFeatureCostsIntro,
  buildHermanTake,
  buildMarketAutoLead,
  buildPageIntro,
  buildPlansIntro,
  buildUsageIntro,
} from '../src/lib/pricing-tab/sectionCopy';
import type { PricingTabViewModel } from '../src/lib/pricing-tab/types';

const OUT_DIR = resolve(process.cwd(), 'pricing-export');

const TARGETS: Array<{ slug: string; file: string; gold?: boolean }> = [
  { slug: 'candy-ai', file: 'candy-ai-reference.md', gold: true },
  { slug: 'ourdream-ai', file: 'ourdream-ai.md' },
  { slug: 'girlfriendgpt', file: 'girlfriendgpt.md' },
  { slug: 'nectar-ai', file: 'nectar-ai.md' },
  { slug: 'juicychat-ai', file: 'juicychat-ai.md' },
  { slug: 'aura-ai', file: 'aura-ai.md' },
];

const SECRET_KEY =
  /^(.*_)?(token|secret|password|apikey|api_key|admin.?token|auth|credential|session|cookie|private.?key)(_.*)?$/i;

const PRODUCT_KEEP = new Set([
  'id',
  'name',
  'slug',
  'status',
  'websiteUrl',
  'priceCurrency',
  'minMonthlyPrice',
  'typicalMonthlyCost',
  'lastTestedAt',
  'lastVerifiedAt',
  'pricingVerifiedAt',
  'award',
  'editorsPick',
  'homepageFeatured',
  'verified',
  'publishedAt',
  'updatedAt',
  'createdAt',
]);

function iso(ms: unknown): string {
  if (ms == null || ms === '') return '—';
  const n = typeof ms === 'number' ? ms : Number(ms);
  if (!Number.isFinite(n) || n <= 0) return String(ms);
  try {
    return new Date(n).toISOString();
  } catch {
    return String(ms);
  }
}

function money(n: number | null | undefined, currency = 'USD'): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return fmtMoney(n, currency);
}

function jsonBlock(value: unknown): string {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`;
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 12) return '[max-depth]';
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));
  if (typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY.test(k)) {
      out[k] = '[redacted]';
      continue;
    }
    if (k === 'adminToken' || k === 'INSTANT_APP_ADMIN_TOKEN') {
      out[k] = '[redacted]';
      continue;
    }
    out[k] = sanitize(v, depth + 1);
  }
  return out;
}

function activeRows<T extends { active?: boolean; deletedAt?: unknown }>(rows: T[] | undefined): T[] {
  return (rows ?? []).filter((r) => !r.deletedAt && r.active !== false);
}

function pickSnapshot(snapshots: any[]): any | null {
  const live = (snapshots ?? []).filter((s) => !s.deletedAt);
  return (
    live.find((s) => s.status === 'active')
    ?? live.find((s) => s.status === 'draft')
    ?? live[0]
    ?? null
  );
}

function productScalars(row: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PRODUCT_KEEP) {
    if (key in row) out[key] = row[key];
  }
  return out;
}

function planBillingTable(tier: PlanTierLike, currency: string): string {
  const opts = tierBillingOptions(tier).filter((o) => o.active !== false);
  const monthly = opts.find((o) => o.interval === 'monthly');
  let md = '| Interval | Price charged | Monthly equivalent | Discount vs monthly |\n';
  md += '| --- | ---: | ---: | ---: |\n';
  if (opts.length === 0) {
    md += `| legacy | ${money(tier.price as number | null, String(tier.currency ?? currency))} | — | — |\n`;
    return md;
  }
  for (const opt of opts) {
    const equiv = monthlyEquivalent(opt);
    const disc = monthly ? intervalDiscount(monthly.price, opt) : null;
    md += `| **${opt.interval}** | ${money(opt.price, opt.currency || currency)} | ${money(equiv, opt.currency || currency)} | ${disc != null ? `${disc}%` : '—'} |\n`;
  }
  return md;
}

function resolvedAllowancesMd(tier: any): string {
  const resolved = resolvePlanAllowances(tier);
  const explicit = hasExplicitAllowances(tier);
  let md = `**Explicit allowances JSON present:** ${explicit ? 'yes' : 'no — legacy/fallback resolution'}\n\n`;
  md += '| Feature | Access | Formatted cell | Quantity | Unit | Reset | Notes | Source label |\n';
  md += '| --- | --- | --- | ---: | --- | --- | --- | --- |\n';
  for (const meta of ALLOWANCE_ROW_META) {
    const a = findAllowance(resolved, meta.key);
    if (!a) {
      md += `| ${meta.label} (\`${meta.key}\`) | — | — | — | — | — | — | — |\n`;
      continue;
    }
    md += `| ${meta.label} (\`${meta.key}\`) | ${a.accessType} | ${formatAllowanceCell(a)} | ${a.quantity ?? '—'} | ${a.unit ?? '—'} | ${a.resetInterval ?? '—'} | ${(a.notes ?? '—').replace(/\|/g, '\\|')} | ${(a.sourceLabel ?? '—').replace(/\|/g, '\\|')} |\n`;
  }
  const extras = resolved.filter((a) => !ALLOWANCE_ROW_META.some((m) => m.key === a.featureKey));
  if (extras.length) {
    md += '\n**Additional allowance keys:**\n\n';
    md += '| Key | Access | Formatted | Quantity | Notes |\n| --- | --- | --- | ---: | --- |\n';
    for (const a of extras) {
      md += `| \`${a.featureKey}\` | ${a.accessType} | ${formatAllowanceCell(a)} | ${a.quantity ?? '—'} | ${(a.notes ?? '—').replace(/\|/g, '\\|')} |\n`;
    }
  }
  md += `\n**Fully resolved allowances (JSON):**\n\n${jsonBlock(sanitize(resolved))}\n`;
  return md;
}

function packagesMd(packages: CreditPackageLike[], currencyFallback: string): string {
  const active = activeRows(packages as any[]);
  if (!active.length) return '_No active credit packages._\n';

  const withMeta = active.map((pkg) => {
    const total = packageTotalCredits(pkg);
    const rate = pricePerCredit(pkg);
    const per100 = pricePer100Credits(pkg);
    return { pkg, total, rate, per100 };
  });

  const best = bestValuePackage(active);
  const cheapest = [...withMeta]
    .filter((x) => x.pkg.price != null)
    .sort((a, b) => Number(a.pkg.price) - Number(b.pkg.price))[0];
  const largest = [...withMeta]
    .filter((x) => x.total != null)
    .sort((a, b) => Number(b.total) - Number(a.total))[0];
  const calcRatePkg = best;

  let md = '### Package summary flags\n\n';
  md += `- **Cheapest package:** ${cheapest?.pkg.name ?? '—'} (${money(cheapest?.pkg.price as number | null, String(cheapest?.pkg.currency ?? currencyFallback))})\n`;
  md += `- **Largest package:** ${largest?.pkg.name ?? '—'} (${largest?.total ?? '—'} credits)\n`;
  md += `- **Best-value package (site calc):** ${best?.name ?? '—'} @ ${money(best ? pricePer100Credits(best) : null, String(best?.currency ?? currencyFallback))} / 100 credits\n`;
  md += `- **Rate used by site pricing calcs:** ${calcRatePkg ? `${pricePerCredit(calcRatePkg)} ${String(calcRatePkg.currency ?? currencyFallback)}/credit` : '—'}\n\n`;

  md += '| Package | Base | Bonus | Total | Price | Currency | Subscriber-only | $/credit | $/100 | Evidence |\n';
  md += '| --- | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | --- |\n';
  for (const { pkg, total, rate, per100 } of withMeta) {
    const star = best && pkg.name === best.name ? ' ★' : '';
    const subOnly = Boolean((pkg as { subscriberOnly?: boolean }).subscriberOnly);
    md += `| ${(pkg.name ?? '—') + star} | ${pkg.baseCredits ?? '—'} | ${pkg.bonusCredits ?? 0} | ${total ?? '—'} | ${pkg.price ?? '—'} | ${pkg.currency ?? currencyFallback} | ${subOnly ? 'yes' : 'no'} | ${rate ?? '—'} | ${per100 ?? '—'} | ${JSON.stringify((pkg as any).evidenceMediaIds ?? [])} |\n`;
  }
  return md;
}

function featureCostsMd(
  costs: FeatureCostLike[],
  packages: CreditPackageLike[],
  currency: string,
): string {
  const active = (costs ?? []).filter((c: any) => !c.deletedAt && c.active !== false);
  if (!active.length) return '_No active feature costs._\n';
  const best = bestValuePackage(activeRows(packages as any[]));

  let md = '| Feature type | Name/variant | Quality | Cost type | Credit cost | Min | Max | Unit | Duration produced | Availability | $ cost (best-value rate) |\n';
  md += '| --- | --- | --- | --- | ---: | ---: | ---: | --- | ---: | --- | --- |\n';
  for (const c of active) {
    const range = featureCostRange(c);
    const avail = featureCostAvailability(c);
    const moneyRange = best ? estimatedFeatureMoneyCost(best, c) : null;
    const moneyLabel = moneyRange
      ? moneyRange.min === moneyRange.max
        ? money(moneyRange.min, currency)
        : `${money(moneyRange.min, currency)}–${money(moneyRange.max, currency)}`
      : '—';
    md += `| \`${c.featureType}\` | ${(c as any).name ?? (c as any).modelName ?? '—'} | ${(c as any).qualityTier ?? '—'} | ${c.costType ?? '—'} | ${c.creditCost ?? '—'} | ${range?.min ?? '—'} | ${range?.max ?? '—'} | ${c.unit ?? '—'} | ${(c as any).durationProduced ?? '—'} | ${avail} | ${moneyLabel} |\n`;
  }
  return md;
}

function usageMd(
  label: string,
  profile: UsageProfile,
  tiers: PlanTierLike[],
  costs: FeatureCostLike[],
  packages: CreditPackageLike[],
  currency: string,
  referencePlanName?: string | null,
): string {
  const est = estimateProfile(profile, tiers, costs, packages, referencePlanName);
  const calc = buildUsageCalculation(
    profile,
    tiers,
    costs,
    packages,
    currency,
    referencePlanName,
    label,
  );

  let md = `### ${label} (\`${profile.id}\`)\n\n`;
  md += `**Title:** ${profile.title}\n\n`;
  md += `**Description:** ${profile.description}\n\n`;
  md += '**Assumptions (per day):**\n\n';
  md += `| Metric | Value |\n| --- | ---: |\n`;
  md += `| Messages/day | ${profile.messagesPerDay} |\n`;
  md += `| Images/day | ${profile.imagesPerDay} |\n`;
  md += `| Videos/day | ${profile.videosPerDay} |\n`;
  md += `| Voice minutes/day | ${profile.voiceMinutesPerDay} |\n\n`;

  md += '**Estimate (site calc):**\n\n';
  md += `| Field | Value |\n| --- | --- |\n`;
  md += `| Reference plan | ${est.billingPlans.find((p) => p.available)?.label ?? '—'} / ${JSON.stringify(est.billingPlans)} |\n`;
  md += `| Plan cost | ${money(est.planCost, currency)} |\n`;
  md += `| Top-up cost | ${money(est.topUpCost, currency)} |\n`;
  md += `| Total monthly | ${money(est.totalMonthly, currency)} |\n\n`;

  if (calc) {
    md += '**Transparent calculation breakdown:**\n\n';
    md += `- Heading: ${calc.heading}\n`;
    md += `- Intro: ${calc.intro}\n`;
    md += `- Summary: ${calc.summaryLabel}\n`;
    md += `- Required credits: ${calc.requiredCredits} (${calc.requiredCreditsLabel})\n`;
    md += `- Included credits: ${calc.includedCredits} (${calc.includedCreditsLabel})\n`;
    md += `- Extra credits: ${calc.extraCredits} (${calc.extraCreditsLabel})\n`;
    md += `- Purchased credits: ${calc.purchasedCredits} (${calc.purchasedCreditsLabel})\n`;
    md += `- Leftover credits: ${calc.leftoverCredits} (${calc.leftoverCreditsLabel})\n`;
    md += `- Plan: ${calc.planCostLabel} · Top-up: ${calc.topUpCostLabel} · Total: ${calc.totalLabel}\n\n`;
    md += '| Feature | Assumption | Unit cost | Cost | Math |\n| --- | --- | --- | --- | --- |\n';
    for (const f of calc.features) {
      md += `| ${f.label} | ${f.assumptionLabel} | ${f.unitCostLabel} | ${f.costLabel} | ${(f.mathDetail ?? '—').replace(/\|/g, '\\|')} |\n`;
    }
    md += '\n**Package checkout lines:**\n\n';
    if (!calc.packageLines.length) md += '_None_\n\n';
    else {
      md += '| Package | Credits | Price | Qty |\n| --- | --- | ---: | ---: |\n';
      for (const line of calc.packageLines) {
        md += `| ${line.name} | ${line.creditsLabel} | ${line.priceLabel} | ${line.quantity} |\n`;
      }
      md += '\n';
    }
    md += `**Full usage calculation JSON:**\n\n${jsonBlock(sanitize(calc))}\n`;
  } else {
    md += '_No transparent calculation available (missing reference plan or incomplete data)._\n\n';
  }

  md += `**Profile estimate JSON:**\n\n${jsonBlock(sanitize(est))}\n`;
  return md;
}

function editorialMd(
  snapshot: any,
  productName: string,
  currency: string,
  advertisedMonthly: number | null,
  regularUseMonthly: number | null,
  plansForCopy: any[],
  pricingModel: string | null,
  yearlySavings: number | null,
  categoryAvg: number | null,
  cheaperPct: number | null,
): string {
  const pageCopy = parsePricingPageCopy(snapshot?.pageCopy);
  const auto = {
    pageIntro: buildPageIntro({
      productName,
      pricingModel,
      advertisedMonthly,
      currency,
      plans: plansForCopy,
    }),
    marketLead: buildMarketAutoLead({
      productName,
      advertisedMonthly,
      typicalMonthlyPrice: categoryAvg,
      currency,
      cheaperPct,
    }),
    plansIntro: buildPlansIntro(productName, plansForCopy, yearlySavings),
    usageIntro: buildUsageIntro(productName),
    featureCostsIntro: buildFeatureCostsIntro(),
    compareIntro: buildCompareIntro({ productName, cheaperPct }),
    hermanTake: buildHermanTake({
      productName,
      advertisedMonthly,
      regularUseMonthly,
      currency,
    }),
  };

  let md = '### Manually stored `pageCopy` (rewrite candidates)\n\n';
  md += 'These are stored on the pricing snapshot. Empty means the public page uses automatic/fallback text.\n\n';
  md += `PAGE INTRO (manual \`introduction\`):\n\n${pageCopy.introduction?.trim() || '_(empty)_'}\n\n`;
  md += `MARKET POSITION COMMENTARY (manual \`marketPositionCommentary\`):\n\n${pageCopy.marketPositionCommentary?.trim() || '_(empty)_'}\n\n`;
  md += `PLANS NOTE (manual \`plansNote\`):\n\n${pageCopy.plansNote?.trim() || '_(empty)_'}\n\n`;
  md += `REAL-WORLD COST COMMENTARY (manual \`realWorldCostCommentary\`):\n\n${pageCopy.realWorldCostCommentary?.trim() || '_(empty)_'}\n\n`;
  md += `COMPARISON COMMENTARY (manual \`comparisonCommentary\`):\n\n${pageCopy.comparisonCommentary?.trim() || '_(empty)_'}\n\n`;
  md += `EXPERT OPINION / HERMAN TAKE (manual \`expertOpinion\`):\n\n${pageCopy.expertOpinion?.trim() || '_(empty)_'}\n\n`;
  if (pageCopy.privateNotes && Object.keys(pageCopy.privateNotes).length) {
    md += `PRIVATE NOTES (editor-only, never published):\n\n${jsonBlock(pageCopy.privateNotes)}\n`;
  }

  md += '### Automatic / fallback text (site generators — do not treat as manual copy)\n\n';
  md += `AUTO PAGE INTRO:\n\n${auto.pageIntro ?? '_(none)_'}\n\n`;
  md += `AUTO MARKET LEAD:\n\n${auto.marketLead ?? '_(none)_'}\n\n`;
  md += `AUTO PLANS INTRO:\n\n${auto.plansIntro ?? '_(none)_'}\n\n`;
  md += `AUTO USAGE INTRO:\n\n${auto.usageIntro ?? '_(none)_'}\n\n`;
  md += `AUTO FEATURE COSTS INTRO:\n\n${auto.featureCostsIntro ?? '_(none)_'}\n\n`;
  md += `AUTO COMPARE INTRO:\n\n${auto.compareIntro ?? '_(none)_'}\n\n`;
  md += `AUTO HERMAN TAKE:\n\n${auto.hermanTake ?? '_(none)_'}\n\n`;

  return md;
}

function publicCopyFromVm(vm: PricingTabViewModel): string {
  let md = '### Final public-facing editorial strings (what users see after merge)\n\n';
  md += `PAGE INTRO:\n\n${vm.pageIntro ?? '_(none)_'}\n\n`;
  md += `MARKET INTRO:\n\n${vm.marketIntro ?? '_(none)_'}\n\n`;
  md += `PLANS INTRO:\n\n${vm.plansIntro ?? '_(none)_'}\n\n`;
  md += `USAGE INTRO:\n\n${vm.usageIntro ?? '_(none)_'}\n\n`;
  md += `FEATURE COSTS INTRO:\n\n${vm.featureCostsIntro ?? '_(none)_'}\n\n`;
  md += `COMPARISON INTRO:\n\n${vm.compareIntro ?? '_(none)_'}\n\n`;
  md += `COMPARISON NOTE:\n\n${vm.comparisonNote ?? '_(none)_'}\n\n`;
  md += `FREE VS PAID INTRO:\n\n${vm.freeVsPaidIntro ?? '_(none)_'}\n\n`;
  md += `HERMAN TAKE:\n\n${vm.hermanTake ?? '_(none)_'}\n\n`;
  md += `SCORE INSIGHT:\n\n${vm.scoreInsight ?? '_(none)_'}\n\n`;
  md += `SCORE CAVEAT:\n\n${vm.scoreCaveat ?? '_(none)_'}\n\n`;
  return md;
}

async function pricingTestsMd(product: Awaited<ReturnType<typeof loadProductPreviewBySlug>>): Promise<string> {
  if (!product) return '_Product preview unavailable — cannot load pricing tests._\n';
  try {
    const vm = await loadDraftRatingsViewModel(product, { preview: false });
    const pricing = vm.categories.find((c) => c.slug === 'pricing');
    if (!pricing) return '_No pricing category in published ratings view model._\n';

    let md = `**Pricing category score:** ${pricing.score ?? '—'}\n\n`;
    md += `**Category verdict:** ${pricing.categoryVerdict ?? '—'}\n`;
    md += `**Primary strength:** ${pricing.primaryStrength ?? '—'}\n`;
    md += `**Primary limitation:** ${pricing.primaryLimitation ?? '—'}\n\n`;

    for (const sub of pricing.subscores) {
      md += `### Subscore: ${sub.name} (\`${sub.slug ?? ''}\`)\n\n`;
      md += `- Score: ${sub.score ?? '—'}\n`;
      md += `- Finding: ${sub.finding ?? '—'}\n`;
      md += `- Explanation: ${sub.explanation ?? '—'}\n\n`;
      for (const ec of sub.evidenceCategories) {
        md += `#### ${ec.name} (\`${ec.slug}\`)\n\n`;
        md += `- Evidence score: ${ec.score ?? '—'}\n`;
        md += `- Summary: ${ec.summary ?? '—'}\n`;
        md += `- Headline: ${ec.headlineConclusion ?? '—'}\n`;
        md += `- What this means (approved): ${ec.whatThisMeans ?? '—'}\n`;
        md += `- Card teaser: ${ec.cardTeaser ?? '—'}\n\n`;
        if (ec.testResults?.length) {
          md += '| Measurement | Value | Score | Status | Interpretation |\n| --- | --- | ---: | --- | --- |\n';
          for (const row of ec.testResults) {
            md += `| ${row.label} | ${(row.value ?? '—').replace(/\|/g, '\\|')} | ${row.normalizedScore ?? '—'} | ${row.status} | ${(row.interpretation ?? '—').replace(/\|/g, '\\|')} |\n`;
          }
          md += '\n';
        }
        if (ec.selectedProof?.length) {
          md += `Evidence/proof items: ${ec.selectedProof.length} (ids: ${ec.selectedProof.map((p) => p.id).join(', ')})\n\n`;
        }
      }
    }
    return md;
  } catch (e) {
    return `_Failed to load pricing tests: ${e instanceof Error ? e.message : String(e)}_\n`;
  }
}

function compareFromVm(vm: PricingTabViewModel): string {
  let md = '| Field | Value |\n| --- | --- |\n';
  md += `| Advertised monthly | ${money(vm.advertisedMonthly, vm.currency)} |\n`;
  md += `| Regular-use monthly | ${money(vm.regularUseMonthly, vm.currency)} |\n`;
  md += `| Power-user monthly | ${money(vm.powerUserMonthly, vm.currency)} |\n`;
  md += `| Typical monthly price (median) | ${money(vm.typicalMonthlyPrice, vm.currency)} |\n`;
  md += `| Category avg monthly (regular proxy) | ${money(vm.categoryAvgMonthly, vm.currency)} |\n`;
  md += `| Reviewed app count | ${vm.reviewedAppCount ?? '—'} |\n`;
  md += `| Hero cheaper % | ${vm.heroCheaperPct ?? '—'} |\n`;
  md += `| Hero savings | ${vm.heroSavings ?? '—'} |\n`;
  md += `| Advertised vs regular diff | ${vm.advertisedVsRegularDiff ?? '—'} |\n\n`;

  if (vm.compareRows?.length) {
    md += '### compareRows (public)\n\n';
    md += '| Metric | Product | Average | Diff | Tone |\n| --- | --- | --- | --- | --- |\n';
    for (const row of vm.compareRows) {
      md += `| ${row.metric} | ${row.productValue} | ${row.typicalValue} | ${row.diffLabel} | ${row.diffTone} |\n`;
    }
    md += '\n';
  }
  return md;
}

async function loadBundle(slug: string) {
  const db = getDb();
  const { products } = await db.query({
    products: {
      $: { where: { slug } },
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
      pricingSnapshots: {},
      pricingPromotions: {},
      paymentProfile: {},
      scoreSnapshots: { testRun: {} },
    },
  });
  return (products as any[])?.find((p) => !p.deletedAt) ?? null;
}

async function exportProduct(
  target: (typeof TARGETS)[number],
  market: Awaited<ReturnType<typeof collectPricingStats>>,
): Promise<{ ok: boolean; note?: string }> {
  const row = await loadBundle(target.slug);
  if (!row) return { ok: false, note: 'not found in InstantDB' };

  const snapshot = pickSnapshot(row.pricingSnapshots ?? []);
  const plans = (row.subscriptionPlans ?? []).filter((p: any) => !p.deletedAt);
  const activePlans = plans.filter((p: any) => p.active !== false);
  const packages = (row.creditPackages ?? []).filter((p: any) => !p.deletedAt);
  const costs = (row.featureCosts ?? []).filter((c: any) => !c.deletedAt);
  const currency = String(row.priceCurrency ?? 'USD');
  const pricingModel = snapshot?.pricingModel ? String(snapshot.pricingModel) : null;
  const profiles = profilesFromSnapshot(snapshot?.usageScenarios) ?? DEFAULT_USAGE_PROFILES.map((p) => ({ ...p }));

  const product = await loadProductPreviewBySlug(target.slug);
  let vm: PricingTabViewModel | null = null;
  if (product) {
    try {
      vm = await loadPricingTabViewModel(product);
    } catch (e) {
      console.warn(`[export] VM failed for ${target.slug}:`, e);
    }
  }

  const advertised =
    vm?.advertisedMonthly
    ?? (row.minMonthlyPrice != null ? Number(row.minMonthlyPrice) : null);
  const regular = vm?.regularUseMonthly ?? null;
  const categoryAvg = vm?.typicalMonthlyPrice ?? market.medianMonthlyPrice ?? market.averageMonthlyPrice;
  const cheaperPct =
    advertised != null && categoryAvg != null && categoryAvg > 0
      ? Math.round(((categoryAvg - advertised) / categoryAvg) * 100)
      : null;

  const plansForCopy = activePlans.map((t: any, i: number) => ({
    key: String(t.id),
    name: String(t.name ?? 'Plan'),
    displayName: String(t.name ?? 'Plan'),
    isFree: Number(t.price ?? 0) === 0,
    isRecommended: Boolean(t.recommended) || i === 0,
    priceLabel: '—',
    summaryLine: '',
    includedCredits: t.includedTokens != null ? Number(t.includedTokens) : null,
    tone: 'neutral' as const,
    billing: null,
    rows: [],
  }));

  let yearlySavings: number | null = null;
  for (const tier of activePlans) {
    const opts = tierBillingOptions(tier);
    const monthly = opts.find((o) => o.interval === 'monthly' && o.active !== false);
    const yearly = opts.find((o) => o.interval === 'yearly' && o.active !== false);
    if (monthly && yearly) {
      const d = intervalDiscount(monthly.price, yearly);
      if (d != null && (yearlySavings == null || d > yearlySavings)) yearlySavings = d;
    }
  }

  const marketStat = market.products.find((p) => p.slug === target.slug);

  let md = '';
  if (target.gold) {
    md += `# Candy AI — Pricing Export (GOLD-STANDARD REFERENCE)\n\n`;
    md += `> **Use this file as the finished reference** for tone, detail level, how numbers are explained, warning wording, and what is useful to a normal user. Do not overwrite Candy AI.\n\n`;
  } else {
    md += `# ${row.name} — Pricing Export\n\n`;
  }

  md += `Exported (read-only): **${new Date().toISOString()}**  \n`;
  md += `Slug: \`${target.slug}\` · Status: **${row.status}** · Product ID: \`${row.id}\`\n\n`;
  md += `---\n\n`;

  // Quick facts
  md += `## Quick facts\n\n`;
  md += `| Field | Value |\n| --- | --- |\n`;
  md += `| Name | ${row.name} |\n`;
  md += `| Slug | ${target.slug} |\n`;
  md += `| Status | ${row.status} |\n`;
  md += `| Currency | ${currency} |\n`;
  md += `| minMonthlyPrice | ${row.minMonthlyPrice ?? '—'} |\n`;
  md += `| typicalMonthlyCost | ${row.typicalMonthlyCost ?? '—'} |\n`;
  md += `| Pricing model | ${pricingModel ?? '—'} |\n`;
  md += `| Pricing score (VM) | ${vm?.pricingScore ?? '—'} (${vm?.scoreLabel ?? '—'}) |\n`;
  md += `| Advertised monthly (VM) | ${money(advertised, currency)} |\n`;
  md += `| Regular-use monthly (VM) | ${money(regular, currency)} |\n`;
  md += `| Active plans | ${activePlans.length} |\n`;
  md += `| Active packages | ${activeRows(packages).length} |\n`;
  md += `| Active feature costs | ${activeRows(costs).length} |\n`;
  md += `| Snapshot status | ${snapshot?.status ?? '—'} |\n\n`;

  // 1 Product
  md += `## 1. Product\n\n`;
  md += jsonBlock(sanitize(productScalars(row)));
  const pricingCat = product?.categories?.find((c) => c.key === 'pricing');
  if (pricingCat) {
    md += `**Product pricing category (from Product model):**\n\n${jsonBlock(sanitize(pricingCat))}\n`;
  }

  // 2 Snapshot
  md += `## 2. Pricing snapshot\n\n`;
  if (!snapshot) md += '_No pricing snapshot._\n\n';
  else {
    md += `| Field | Value |\n| --- | --- |\n`;
    md += `| id | ${snapshot.id} |\n`;
    md += `| status | ${snapshot.status} |\n`;
    md += `| pricingModel | ${snapshot.pricingModel ?? '—'} |\n`;
    md += `| creditCurrency | ${JSON.stringify(snapshot.creditCurrency ?? null)} |\n`;
    md += `| verifiedAt | ${iso(snapshot.verifiedAt)} |\n`;
    md += `| sourceUrl | ${snapshot.sourceUrl ?? '—'} |\n`;
    md += `| referencePlanName | ${snapshot.referencePlanName ?? '—'} |\n`;
    md += `| updatedAt | ${iso(snapshot.updatedAt)} |\n\n`;
    md += `**usageScenarios (stored):**\n\n${jsonBlock(sanitize(snapshot.usageScenarios ?? null))}\n`;
    md += `**Full snapshot record (sanitized):**\n\n${jsonBlock(sanitize(snapshot))}\n`;
  }

  // 3 Plans
  md += `## 3. Subscription plans\n\n`;
  md += `Exporting **${plans.length}** plan row(s) (${activePlans.length} active).\n\n`;
  for (const tier of plans) {
    md += `### Plan: ${tier.name ?? '(unnamed)'} ${tier.active === false ? '_(inactive)_' : ''}\n\n`;
    md += `| Field | Value |\n| --- | --- |\n`;
    md += `| id | ${tier.id} |\n`;
    md += `| active | ${tier.active !== false} |\n`;
    md += `| recommended | ${Boolean(tier.recommended)} |\n`;
    md += `| includedTokens | ${tier.includedTokens ?? '—'} |\n`;
    md += `| includedImages | ${tier.includedImages ?? '—'} |\n`;
    md += `| includedVideos | ${tier.includedVideos ?? '—'} |\n`;
    md += `| includedVoiceMinutes | ${tier.includedVoiceMinutes ?? '—'} |\n`;
    md += `| unlimitedFeatures | ${JSON.stringify(tier.unlimitedFeatures ?? null)} |\n`;
    md += `| legacy price / interval | ${tier.price ?? '—'} / ${tier.billingInterval ?? '—'} |\n`;
    md += `| currency | ${tier.currency ?? currency} |\n\n`;
    md += `#### Billing options\n\n${planBillingTable(tier, currency)}\n`;
    md += `#### Plan allowances (resolved like public Pricing tab)\n\n${resolvedAllowancesMd(tier)}\n`;
    md += `#### Raw plan record\n\n${jsonBlock(sanitize(tier))}\n`;
  }

  // 4 Packages
  md += `## 4. Credit / token packages\n\n`;
  md += packagesMd(packages, currency);
  md += `\n**Raw package records:**\n\n${jsonBlock(sanitize(packages))}\n`;

  // 5 Feature costs
  md += `## 5. Feature costs\n\n`;
  md += featureCostsMd(costs, packages, currency);
  md += `\n**Raw feature cost records:**\n\n${jsonBlock(sanitize(costs))}\n`;

  // 6 Allowances summary already per-plan; add matrix-style section
  md += `## 6. Plan allowances matrix\n\n`;
  if (!activePlans.length) md += '_No active plans._\n\n';
  else {
    md += '| Allowance | ' + activePlans.map((p: any) => p.name ?? p.id).join(' | ') + ' |\n';
    md += '| --- | ' + activePlans.map(() => '---').join(' | ') + ' |\n';
    for (const meta of ALLOWANCE_ROW_META) {
      const cells = activePlans.map((p: any) => {
        const a = findAllowance(resolvePlanAllowances(p), meta.key);
        return formatAllowanceCell(a);
      });
      md += `| ${meta.label} | ${cells.join(' | ')} |\n`;
    }
    md += '\n';
  }

  // 7 Usage
  md += `## 7. Usage scenarios / real monthly cost\n\n`;
  md += `Profiles source: ${snapshot?.usageScenarios ? 'snapshot.usageScenarios (merged with defaults)' : 'DEFAULT_USAGE_PROFILES'}\n\n`;
  const refPlan = snapshot?.referencePlanName ? String(snapshot.referencePlanName) : null;
  for (const profile of profiles) {
    const label =
      profile.id === 'casual' ? 'Light usage' : profile.id === 'power' ? 'Heavy usage' : 'Regular usage';
    md += usageMd(label, profile, activePlans, costs, packages, currency, refPlan);
  }

  // 8 Public VM
  md += `## 8. Public Pricing view model\n\n`;
  if (!vm) md += '_Could not load PricingTabViewModel._\n\n';
  else {
    md += `### Key public fields\n\n`;
    md += `| Field | Value |\n| --- | --- |\n`;
    md += `| productName | ${vm.productName} |\n`;
    md += `| pricingModel | ${vm.pricingModel ?? '—'} |\n`;
    md += `| pricingScore | ${vm.pricingScore ?? '—'} |\n`;
    md += `| scoreLabel | ${vm.scoreLabel ?? '—'} |\n`;
    md += `| advertisedMonthly | ${vm.advertisedMonthly ?? '—'} |\n`;
    md += `| regularUseMonthly | ${vm.regularUseMonthly ?? '—'} |\n`;
    md += `| typicalMonthlyPrice | ${vm.typicalMonthlyPrice ?? '—'} |\n`;
    md += `| isDraft | ${vm.isDraft} |\n`;
    md += `| pricingDataSource | ${JSON.stringify(vm.pricingDataSource)} |\n\n`;
    md += publicCopyFromVm(vm);
    md += `### Full PricingTabViewModel JSON\n\n${jsonBlock(sanitize(vm))}\n`;
  }

  // 9 Market comparison
  md += `## 9. Market comparison\n\n`;
  md += `### Category / industry stats (shared)\n\n`;
  md += `| Stat | Value |\n| --- | --- |\n`;
  md += `| Eligible published products | ${market.sampleSize} |\n`;
  md += `| Average starting monthly | ${money(market.averageMonthlyPrice)} |\n`;
  md += `| Median starting monthly | ${money(market.medianMonthlyPrice)} |\n`;
  md += `| Cheapest starting monthly | ${money(market.cheapestMonthlyPrice)} |\n`;
  md += `| Most expensive starting monthly | ${money(market.mostExpensiveMonthlyPrice)} |\n`;
  md += `| Average annual discount | ${market.averageAnnualDiscount ?? '—'}% |\n`;
  md += `| Average per 100 credits | ${money(market.averagePer100Credits)} |\n\n`;
  if (marketStat) {
    md += `### This product in market stats\n\n${jsonBlock(sanitize(marketStat))}\n`;
  }
  if (vm) {
    md += `### This product vs market (from public VM)\n\n`;
    md += compareFromVm(vm);
    if (cheaperPct != null) {
      md += `\n**Starting subscription vs category average:** ${cheaperPct}% ${cheaperPct >= 0 ? 'cheaper' : 'more expensive'} (advertised ${money(advertised, currency)} vs avg ${money(categoryAvg, currency)}).\n\n`;
    }
  }

  // 10 Editorial
  md += `## 10. Existing editorial pricing copy\n\n`;
  md += editorialMd(
    snapshot,
    String(row.name),
    currency,
    advertised,
    regular,
    plansForCopy,
    pricingModel,
    yearlySavings,
    categoryAvg ?? null,
    cheaperPct,
  );
  if (vm && target.gold) {
    md += `## Candy AI finished public copy (reference)\n\n`;
    md += publicCopyFromVm(vm);
  }

  // 11 Tests
  md += `## 11. Published pricing test results\n\n`;
  md += await pricingTestsMd(product);

  // 12 Raw
  md += `## 12. Raw records\n\n`;
  md += `### Payment profile (pricing-relevant flags only)\n\n`;
  if (row.paymentProfile) {
    const pp = row.paymentProfile;
    md += jsonBlock(
      sanitize({
        id: pp.id,
        creditCard: pp.creditCard,
        debitCard: pp.debitCard,
        paypal: pp.paypal,
        crypto: pp.crypto,
        applePay: pp.applePay,
        googlePay: pp.googlePay,
        bankTransfer: pp.bankTransfer,
        refundPolicy: pp.refundPolicy,
        cancellationPolicy: pp.cancellationPolicy,
        creditExpiry: pp.creditExpiry,
        billingClarityNotes: pp.billingClarityNotes,
      }),
    );
  } else md += '_None_\n\n';

  md += `### Promotions\n\n${jsonBlock(sanitize(row.pricingPromotions ?? []))}\n`;
  md += `### All snapshots on product\n\n${jsonBlock(sanitize(row.pricingSnapshots ?? []))}\n`;

  writeFileSync(resolve(OUT_DIR, target.file), md, 'utf8');
  return { ok: true };
}

function marketFile(market: Awaited<ReturnType<typeof collectPricingStats>>, perProduct: Array<{
  slug: string;
  name: string;
  advertised: number | null;
  regular: number | null;
  cheaperPct: number | null;
  compareRows: unknown;
}>): string {
  let md = `# Pricing market data\n\n`;
  md += `Exported (read-only): **${new Date().toISOString()}**\n\n`;
  md += `Built from \`collectPricingStats()\` plus per-product public Pricing tab view models.\n\n`;
  md += `## Industry aggregates\n\n`;
  md += `| Stat | Value |\n| --- | --- |\n`;
  md += `| Eligible published products | ${market.sampleSize} |\n`;
  md += `| Average starting monthly subscription | ${money(market.averageMonthlyPrice)} |\n`;
  md += `| Median starting monthly subscription | ${money(market.medianMonthlyPrice)} |\n`;
  md += `| Cheapest starting monthly | ${money(market.cheapestMonthlyPrice)} |\n`;
  md += `| Most expensive starting monthly | ${money(market.mostExpensiveMonthlyPrice)} |\n`;
  md += `| Average annual discount % | ${market.averageAnnualDiscount ?? '—'} |\n`;
  md += `| Average price per 100 credits | ${money(market.averagePer100Credits)} |\n`;
  md += `| Free-plan share | ${market.freePlanShare ?? '—'} |\n`;
  md += `| Credit-system share | ${market.creditSystemShare ?? '—'} |\n\n`;

  md += `## Per published product (stats helper)\n\n`;
  md += `| Name | Slug | Lowest monthly | Lowest monthly equiv | Max annual discount | Cheapest /100 credits | Free plan | Uses credits |\n`;
  md += `| --- | --- | ---: | ---: | ---: | ---: | --- | --- |\n`;
  for (const p of market.products) {
    md += `| ${p.name} | ${p.slug} | ${money(p.lowestMonthly)} | ${money(p.lowestMonthlyEquivalent)} | ${p.maxAnnualDiscount ?? '—'} | ${money(p.cheapestPer100Credits)} | ${p.hasFreePlan} | ${p.usesCredits} |\n`;
  }
  md += `\n`;

  md += `## Per-product public VM market deltas\n\n`;
  md += `| Product | Advertised | Regular use | % vs category avg start |\n| --- | ---: | ---: | ---: |\n`;
  for (const p of perProduct) {
    md += `| ${p.name} (\`${p.slug}\`) | ${money(p.advertised)} | ${money(p.regular)} | ${p.cheaperPct ?? '—'} |\n`;
  }
  md += `\n`;

  md += `## Full industry stats JSON\n\n${jsonBlock(sanitize(market))}\n`;
  md += `## Per-product compare payloads\n\n${jsonBlock(sanitize(perProduct))}\n`;
  return md;
}

async function main() {
  if (!isDbConfigured()) {
    console.error('InstantDB is not configured. Set PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN in .env');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  console.log('Collecting market stats…');
  const market = await collectPricingStats();

  const perProduct: Array<{
    slug: string;
    name: string;
    advertised: number | null;
    regular: number | null;
    cheaperPct: number | null;
    compareRows: unknown;
  }> = [];

  for (const target of TARGETS) {
    console.log(`Exporting ${target.slug} → ${target.file}…`);
    const result = await exportProduct(target, market);
    if (!result.ok) {
      console.warn(`  skipped: ${result.note}`);
      continue;
    }

    const product = await loadProductPreviewBySlug(target.slug);
    if (product) {
      try {
        const vm = await loadPricingTabViewModel(product);
        const advertised = vm.advertisedMonthly;
        const categoryAvg = vm.typicalMonthlyPrice ?? market.medianMonthlyPrice ?? market.averageMonthlyPrice;
        const cheaperPct =
          advertised != null && categoryAvg != null && categoryAvg > 0
            ? Math.round(((categoryAvg - advertised) / categoryAvg) * 100)
            : null;
        perProduct.push({
          slug: target.slug,
          name: product.name,
          advertised,
          regular: vm.regularUseMonthly,
          cheaperPct,
          compareRows: vm.compareRows,
        });
      } catch {
        /* ignore */
      }
    }
  }

  writeFileSync(resolve(OUT_DIR, 'pricing-market-data.md'), marketFile(market, perProduct), 'utf8');
  console.log(`Wrote pricing-export/pricing-market-data.md`);
  console.log(`Done. Files in ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
