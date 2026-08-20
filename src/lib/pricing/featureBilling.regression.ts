/**
 * Feature billing summary regression tests.
 * Run: npx tsx src/lib/pricing/featureBilling.regression.ts
 */

import assert from 'node:assert/strict';
import { summarizeFeatureBilling, tierLikeFromRecord } from './featureBilling';
import type { FeatureCostLike, PlanTierLike } from './calc';
import { billableCreditsForTier } from './calc';

function tier(
  name: string,
  allowances: PlanTierLike['allowances'],
): PlanTierLike {
  return { name, active: true, allowances };
}

const chatCosts: FeatureCostLike[] = [
  {
    featureType: 'chat_message',
    creditCost: 1,
    costType: 'fixed',
    unit: 'per_message',
    active: true,
  },
];

const imageCosts: FeatureCostLike[] = [
  {
    featureType: 'standard_image',
    creditCost: 8,
    costType: 'fixed',
    unit: 'per_image',
    active: true,
  },
];

// GirlfriendGPT-style: chat varies by plan
{
  const tiers = [
    tier('Premium', [
      {
        id: '1',
        featureKey: 'messages',
        sourceLabel: 'Messages',
        accessType: 'included_quantity',
        quantity: 6000,
        resetInterval: 'month',
      },
    ]),
    tier('Deluxe', [
      {
        id: '2',
        featureKey: 'messages',
        sourceLabel: 'Messages',
        accessType: 'included_quantity',
        quantity: 20000,
        resetInterval: 'month',
      },
    ]),
    tier('Elite', [
      {
        id: '3',
        featureKey: 'messages',
        sourceLabel: 'Messages',
        accessType: 'included_quantity',
        quantity: 100000,
        resetInterval: 'month',
      },
    ]),
  ];
  const summary = summarizeFeatureBilling(tiers, chatCosts, 'coins');
  const chat = summary.find((r) => r.key === 'chat')!;
  assert.equal(chat.howCharged, 'Varies by plan');
  assert.equal(chat.included, '6,000–100,000 / mo');
  assert.equal(chat.variesByPlan, true);
}

// Candy-style unlimited chat
{
  const tiers = [
    tier('Premium', [
      {
        id: '1',
        featureKey: 'messages',
        sourceLabel: 'Chat',
        accessType: 'unlimited',
      },
    ]),
  ];
  const summary = summarizeFeatureBilling(tiers, chatCosts, 'coins');
  const chat = summary.find((r) => r.key === 'chat')!;
  assert.equal(chat.howCharged, 'Unlimited');
  assert.equal(chat.included, 'Unlimited');
}

// Shared credits for images
{
  const tiers = [tier('Premium', [])];
  const summary = summarizeFeatureBilling(tiers, imageCosts, 'coins');
  const images = summary.find((r) => r.key === 'images')!;
  assert.equal(images.howCharged, 'Shared coins');
  assert.equal(images.extraUsage, '8 coins / image');
}

// afterAllowance unavailable blocks overage billing
{
  const plan: PlanTierLike = {
    name: 'Basic',
    active: true,
    allowances: [
      {
        id: 'm',
        featureKey: 'messages',
        sourceLabel: 'Messages',
        accessType: 'included_quantity',
        quantity: 500,
        resetInterval: 'month',
        afterAllowance: { type: 'unavailable' },
      },
    ],
  };
  const usage = { premium_message: 1000 };
  const billed = billableCreditsForTier(usage, plan, chatCosts);
  assert.ok(billed.unavailableFeatures.includes('premium_message'));
}

// afterAllowance per_use charges explicit credit cost
{
  const plan: PlanTierLike = {
    name: 'Basic',
    active: true,
    allowances: [
      {
        id: 'm',
        featureKey: 'messages',
        sourceLabel: 'Messages',
        accessType: 'included_quantity',
        quantity: 500,
        resetInterval: 'month',
        afterAllowance: { type: 'per_use', creditCost: 1, unit: 'per_message' },
      },
    ],
  };
  const usage = { premium_message: 600 };
  const billed = billableCreditsForTier(usage, plan, chatCosts);
  assert.equal(billed.creditsNeeded, 100);
}

console.log('featureBilling.regression.ts: all assertions passed');
