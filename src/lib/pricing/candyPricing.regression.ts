/**
 * Candy AI pricing regression tests (formulas + package solver).
 * Run: npx tsx src/lib/pricing/candyPricing.regression.ts
 */

import assert from 'node:assert/strict';
import {
  bestValuePackage,
  billableCreditsForTier,
  cheapestPricedFeatureCost,
  creditsPerDisplayUse,
  formatCreditPoolUsesCell,
  intervalDiscount,
  monthlyEquivalent,
  packageTotalCredits,
  pricePerCredit,
  scenarioMonthlyCost,
  tierBillingOptions,
  type CreditPackageLike,
  type FeatureCostLike,
  type PlanTierLike,
} from './calc';
import { solveMinCostPackageCombo } from './packageCombo';
import { buildUsageMap, DEFAULT_USAGE_PROFILES } from './usageScenarios';
import { buildTopUps } from '../pricing-tab/planPresentation';
import { freeAccessCellLabel, type PricingFreeAccess } from '../pricing-tab/freeAccessShared';
import { buildCreditMixer as buildMixer } from '../pricing-tab/creditMixer';

const CANDY_PACKAGES: CreditPackageLike[] = [
  { name: '100 Tokens', price: 9.99, currency: 'EUR', baseCredits: 100, bonusCredits: 0, active: true },
  { name: '350 Tokens', price: 34.99, currency: 'EUR', baseCredits: 350, bonusCredits: 55, active: true },
  { name: '550 Tokens', price: 49.99, currency: 'EUR', baseCredits: 550, bonusCredits: 55, active: true },
  { name: '1150 Tokens', price: 99.99, currency: 'EUR', baseCredits: 1150, bonusCredits: 0, active: true },
  { name: '2400 Tokens', price: 199.99, currency: 'EUR', baseCredits: 2400, bonusCredits: 480, active: true },
  { name: '3750 Tokens', price: 299.99, currency: 'EUR', baseCredits: 3750, bonusCredits: 0, active: true },
];

const CANDY_COSTS: FeatureCostLike[] = [
  { featureType: 'standard_image', creditCost: 2, costType: 'fixed', unit: 'per_image', active: true },
  { featureType: 'premium_image', creditCost: 4, costType: 'fixed', unit: 'per_image', active: true },
  { featureType: 'standard_video', creditCost: 1.2, costType: 'fixed', unit: 'per_second', active: true },
  { featureType: 'voice_message', creditCost: 0.2, costType: 'fixed', unit: 'per_minute', active: true },
  { featureType: 'voice_call', creditCost: 3, costType: 'fixed', unit: 'per_minute', active: true },
  { featureType: 'character_creation', creditCost: 10, costType: 'fixed', unit: 'per_character', active: true },
];

const PREMIUM: PlanTierLike = {
  name: 'Premium',
  active: true,
  includedTokens: 100,
  billingOptions: [
    { interval: 'monthly', price: 13.99, currency: 'USD', active: true },
    { interval: 'quarterly', price: 26.97, currency: 'USD', active: true },
    { interval: 'yearly', price: 47.88, currency: 'USD', active: true },
  ],
};

function approx(a: number, b: number, eps = 0.02) {
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);
}

function testBilling() {
  const opts = tierBillingOptions(PREMIUM);
  const monthly = opts.find((o) => o.interval === 'monthly')!;
  const quarterly = opts.find((o) => o.interval === 'quarterly')!;
  const yearly = opts.find((o) => o.interval === 'yearly')!;
  assert.equal(monthly.price, 13.99);
  approx(monthlyEquivalent(quarterly)!, 8.99);
  approx(monthlyEquivalent(yearly)!, 3.99);
  approx(intervalDiscount(13.99, quarterly)!, 35.7, 0.2);
  approx(intervalDiscount(13.99, yearly)!, 71.5, 0.2);
}

function testPoolEquivalents() {
  const std = formatCreditPoolUsesCell(100, CANDY_COSTS[0], 'image');
  const prem = formatCreditPoolUsesCell(100, CANDY_COSTS[1], 'image');
  const video = formatCreditPoolUsesCell(100, CANDY_COSTS[2], 'video');
  const voiceMsg = formatCreditPoolUsesCell(100, CANDY_COSTS[3], 'voice_message');
  const voiceCall = formatCreditPoolUsesCell(100, CANDY_COSTS[4], 'voice_call');
  const character = formatCreditPoolUsesCell(100, CANDY_COSTS[5], 'character_creation');
  assert.match(std.value, /50/);
  assert.match(std.value, /standard images/i);
  assert.ok(!std.value.includes('≈'), `skim pills should not use ≈: ${std.value}`);
  assert.match(prem.value, /25/);
  assert.match(prem.value, /premium images/i);
  assert.match(video.value, /8/);
  assert.match(voiceMsg.value, /500|8\.3|hrs/i);
  assert.match(voiceCall.value, /33/);
  assert.match(character.value, /10/);
}

function testBestValue() {
  const best = bestValuePackage(CANDY_PACKAGES)!;
  assert.equal(packageTotalCredits(best), 2880);
  assert.equal(best.price, 199.99);
  const rate = pricePerCredit(best)!;
  for (const pkg of CANDY_PACKAGES) {
    const r = pricePerCredit(pkg)!;
    assert.ok(rate <= r + 1e-12);
  }
}

function testMixerCredits() {
  const mixer = buildMixer(100, CANDY_COSTS, { ratePerCredit: pricePerCredit(bestValuePackage(CANDY_PACKAGES)!), currency: 'USD' })!;
  const images = mixer.channels.find((c) => c.key === 'images')!;
  const videos = mixer.channels.find((c) => c.key === 'videos')!;
  const calls = mixer.channels.find((c) => c.key === 'voice_calls')!;
  const used =
    35 * images.creditsPerUnit + 1 * videos.creditsPerUnit + 5 * calls.creditsPerUnit;
  approx(used, 97, 0.01);
  approx(100 - used, 3, 0.01);
}

function testFreeAccessFormatting() {
  const free: PricingFreeAccess = {
    source: 'testing',
    chat: { quantity: 5, unit: 'messages', period: 'total', label: '5 messages total' },
    characters: { quantity: 1, unit: 'characters', period: 'total', label: '1 characters total' },
    images: { quantity: 3, unit: 'images', period: 'total', label: '3 images total' },
    video: { quantity: 0, unit: 'videos', period: 'total', label: 'Not available' },
    voice: { quantity: 2, unit: 'seconds', period: 'total', label: '2 sec total' },
    trialWithoutCreditCard: true,
  };
  assert.equal(freeAccessCellLabel(free.chat), '5 messages total');
  assert.equal(freeAccessCellLabel(free.video), 'Not available');
  assert.equal(freeAccessCellLabel(free.voice), '2 sec total');
  assert.equal(free.trialWithoutCreditCard, true);
}

function testRegularUsageSpend() {
  const profile = DEFAULT_USAGE_PROFILES.find((p) => p.id === 'regular')!;
  const usage = buildUsageMap(profile, CANDY_COSTS);
  const billed = billableCreditsForTier(usage, PREMIUM, CANDY_COSTS);
  assert.equal(billed.creditsNeeded, 495);
  assert.equal(billed.includedCredits, 100);
  const shortfall = billed.creditsNeeded - billed.includedCredits;
  assert.equal(shortfall, 395);

  const combo = solveMinCostPackageCombo(shortfall, CANDY_PACKAGES);
  assert.equal(combo.impossible, false);
  approx(combo.topUpCost, 34.99);
  assert.equal(combo.purchasedCredits, 405);
  assert.equal(combo.leftoverCredits, 10);

  const result = scenarioMonthlyCost({ usage }, [PREMIUM], CANDY_COSTS, CANDY_PACKAGES)!;
  approx(result.topUpCost!, 34.99);
  approx(result.totalMonthly!, 48.98);
  assert.equal(result.planCost, 13.99);
}

function testLightUsageSpend() {
  const profile = DEFAULT_USAGE_PROFILES.find((p) => p.id === 'casual')!;
  const usage = buildUsageMap(profile, CANDY_COSTS);
  const billed = billableCreditsForTier(usage, PREMIUM, CANDY_COSTS);
  assert.equal(billed.creditsNeeded, 177);
  const combo = solveMinCostPackageCombo(77, CANDY_PACKAGES);
  approx(combo.topUpCost, 9.99);
  assert.equal(combo.purchasedCredits, 100);
  assert.equal(combo.leftoverCredits, 23);
  const result = scenarioMonthlyCost({ usage }, [PREMIUM], CANDY_COSTS, CANDY_PACKAGES)!;
  approx(result.totalMonthly!, 23.98);
}

function testHeavySolver() {
  const profile = DEFAULT_USAGE_PROFILES.find((p) => p.id === 'power')!;
  const usage = buildUsageMap(profile, CANDY_COSTS);
  const billed = billableCreditsForTier(usage, PREMIUM, CANDY_COSTS);
  assert.equal(billed.creditsNeeded, 2070);
  const shortfall = 1970;
  const combo = solveMinCostPackageCombo(shortfall, CANDY_PACKAGES);
  assert.equal(combo.impossible, false);
  assert.ok(combo.purchasedCredits >= shortfall);
  // Must not assume a single 2880 pack is always cheapest — just that cost is finite and optimal.
  assert.ok(combo.topUpCost > 0);
  const single2880 = 199.99;
  // Solver cost should be ≤ naive best-value single purchase when that covers.
  assert.ok(combo.topUpCost <= single2880 + 1e-9 || combo.purchasedCredits < 2880);
}

function testTopUpsUsdDisplay() {
  const topUps = buildTopUps(CANDY_PACKAGES, 'USD')!;
  assert.match(topUps.valueColumnLabel, /100-credit/i);
  assert.equal(topUps.estimateNote, null);
  const best = topUps.packages.find((p) => p.isBestValue)!;
  assert.match(best.creditsLabel, /2,880/);
  assert.match(best.priceLabel, /\$199\.99/);
  for (const pkg of topUps.packages) {
    assert.match(pkg.priceLabel, /^\$/);
  }
}

function testFeatureMoneyRounding() {
  // Display path must use credits-per-use × rate (not round2(rate×per-second)×seconds).
  const best = bestValuePackage(CANDY_PACKAGES)!;
  const rate = pricePerCredit(best)!;
  const videoCredits = 1.2 * 10; // 10s at 1.2 credits/sec
  const videoMoney = rate * videoCredits;
  approx(videoMoney, 0.83, 0.01);
  assert.ok(videoMoney > 0.81, `expected ~$0.83 not $0.80, got ${videoMoney}`);
}

function testCheapestVideoVariant() {
  // Flat clip prices (OurDream-style) beat true per-second rates when cheaper per 10s use.
  const ourdreamVideos: FeatureCostLike[] = [
    {
      featureType: 'standard_video',
      creditCost: 100,
      costType: 'fixed',
      unit: 'per_generation',
      durationProduced: 10,
      qualityTier: 'Spicy 1.0 (720)',
      active: true,
    },
    {
      featureType: 'standard_video',
      creditCost: 500,
      costType: 'fixed',
      unit: 'per_generation',
      durationProduced: 10,
      qualityTier: 'Cinematic (720p)',
      active: true,
    },
    {
      featureType: 'standard_video',
      creditCost: 50,
      costType: 'fixed',
      unit: 'per_second',
      durationProduced: 10,
      qualityTier: 'Expensive per-second',
      active: true,
    },
  ];
  const pick = cheapestPricedFeatureCost(ourdreamVideos, 'standard_video')!;
  const perUse = creditsPerDisplayUse(pick)!;
  assert.equal(pick.qualityTier, 'Spicy 1.0 (720)');
  assert.equal(pick.unit, 'per_generation');
  assert.equal(perUse.min, 100);

  // Regular use: 15 videos × 100 = 1500 video credits (+ images/voice).
  const costs: FeatureCostLike[] = [
    ...ourdreamVideos,
    { featureType: 'standard_image', creditCost: 10, costType: 'fixed', unit: 'per_image', active: true },
    { featureType: 'voice_call', creditCost: 10, costType: 'fixed', unit: 'per_minute', active: true },
  ];
  const packages: CreditPackageLike[] = [
    { name: '1,000 Dreamcoins', price: 11.99, currency: 'USD', baseCredits: 1000, bonusCredits: 0, active: true },
    { name: '5,000 Dreamcoins', price: 49.99, currency: 'USD', baseCredits: 5000, bonusCredits: 0, active: true },
    { name: '20,000 Dreamcoins', price: 159.99, currency: 'USD', baseCredits: 20000, bonusCredits: 0, active: true },
  ];
  const premium: PlanTierLike = {
    name: 'Premium',
    active: true,
    includedTokens: 1000,
    billingOptions: [{ interval: 'monthly', price: 19.99, currency: 'USD', active: true }],
  };
  const regular = DEFAULT_USAGE_PROFILES.find((p) => p.id === 'regular')!;
  const usage = buildUsageMap(regular, costs);
  assert.equal(usage.standard_video, 15);
  const est = scenarioMonthlyCost({ usage }, [premium], costs, packages)!;
  // 90×10 images + 15×100 video + 45×10 voice = 900+1500+450 = 2850 − 1000 included = 1850 shortfall
  assert.equal(est.requiredCredits, 2850);
  assert.ok((est.totalMonthly ?? 0) < 50, `expected cheap Spicy estimate, got ${est.totalMonthly}`);
}

function testNectarStyleAllowanceOnlyEstimate() {
  // Pro has image allowances but unknown video/voice costs — estimate must still resolve.
  const costs: FeatureCostLike[] = [
    {
      featureType: 'standard_image',
      creditCost: 84,
      costType: 'fixed',
      unit: 'per_image',
      active: true,
    },
    {
      featureType: 'standard_video',
      costType: 'unknown',
      unit: 'per_generation',
      active: true,
    },
    {
      featureType: 'voice_call',
      costType: 'unknown',
      unit: 'per_minute',
      active: true,
    },
  ];
  const packages: CreditPackageLike[] = [
    { name: 'Credits', price: 4.99, currency: 'USD', baseCredits: 2500, bonusCredits: 0, active: true },
  ];
  const pro: PlanTierLike = {
    name: 'Pro',
    active: true,
    billingOptions: [{ interval: 'monthly', price: 9.99, currency: 'USD', active: true }],
    allowances: [
      {
        id: 'img',
        featureKey: 'image_generations',
        sourceLabel: 'Generations',
        accessType: 'included_quantity',
        quantity: 900,
        resetInterval: 'month',
      },
      {
        id: 'msg',
        featureKey: 'messages',
        sourceLabel: 'Messages',
        accessType: 'included_quantity',
        quantity: 9000,
        resetInterval: 'month',
      },
    ],
  };

  assert.equal(cheapestPricedFeatureCost(costs, 'standard_video'), undefined);
  const regular = DEFAULT_USAGE_PROFILES.find((p) => p.id === 'regular')!;
  const usage = buildUsageMap(regular, costs);
  assert.equal(usage.standard_video, undefined);
  assert.equal(usage.voice_call, undefined);
  assert.equal(usage.standard_image, 90);

  const est = scenarioMonthlyCost({ usage }, [pro], costs, packages)!;
  assert.equal(est.incomplete, false);
  approx(est.totalMonthly!, 9.99);
  approx(est.topUpCost!, 0);
}

function testCheapestPlanAndTopUp() {
  const costs: FeatureCostLike[] = [
    {
      featureType: 'standard_image',
      creditCost: 8,
      costType: 'fixed',
      unit: 'per_image',
      active: true,
    },
  ];
  const packages: CreditPackageLike[] = [
    { name: '500 coins', price: 25, currency: 'USD', baseCredits: 500, bonusCredits: 0, active: true },
    { name: '2000 coins', price: 50, currency: 'USD', baseCredits: 2000, bonusCredits: 0, active: true },
  ];
  const premium: PlanTierLike = {
    name: 'Premium',
    active: true,
    includedTokens: 400,
    billingOptions: [{ interval: 'monthly', price: 15, currency: 'USD', active: true }],
  };
  const elite: PlanTierLike = {
    name: 'Elite',
    active: true,
    includedTokens: 2000,
    billingOptions: [{ interval: 'monthly', price: 50, currency: 'USD', active: true }],
  };
  // 240 images × 8 credits = 1920 — fits in Elite's pool with no top-up.
  const usage = { standard_image: 240 };

  const premiumOnly = scenarioMonthlyCost({ usage }, [premium], costs, packages)!;
  const optimized = scenarioMonthlyCost({ usage }, [premium, elite], costs, packages)!;

  approx(premiumOnly.totalMonthly!, 65);
  assert.equal(optimized.planName, 'Elite');
  approx(optimized.totalMonthly!, 50);
  approx(optimized.topUpCost!, 0);
  assert.ok(optimized.totalMonthly! < premiumOnly.totalMonthly!);
}

function main() {
  testBilling();
  testPoolEquivalents();
  testBestValue();
  testMixerCredits();
  testFreeAccessFormatting();
  testRegularUsageSpend();
  testLightUsageSpend();
  testHeavySolver();
  testTopUpsUsdDisplay();
  testFeatureMoneyRounding();
  testCheapestVideoVariant();
  testNectarStyleAllowanceOnlyEstimate();
  testCheapestPlanAndTopUp();
  console.log('candyPricing.regression: all passed');
}

main();
