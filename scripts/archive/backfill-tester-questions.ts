#!/usr/bin/env npx tsx
// Backfills tester-facing fields (questionLabel, calculationMethod, sample
// size, examples) for the Characters and Pricing evidence definitions, using
// the editorial methodology wording. Skips any definition that already has a
// questionLabel so editor changes are never overwritten. Scoring rules,
// weights, and existing results are untouched.
//
// Usage: npx tsx scripts/backfill-tester-questions.ts

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const { getDb, tx } = await import('../src/lib/db/server');
const db = getDb();

interface Patch {
  questionLabel: string;
  shortDescription?: string;
  exampleAnswer?: string;
  publicResultTemplate?: string;
  sampleSize?: number;
  calculationMethod?: Record<string, unknown>;
  allowUnableToVerify?: boolean;
}

// Keyed by "<category name>|<slug>" because slugs repeat across categories.
const PATCHES: Record<string, Patch> = {
  // ----- Characters --------------------------------------------------------
  'Characters|amount': {
    questionLabel: 'How many ready-made characters are available?',
    shortDescription:
      'Count the total number of publicly available characters in the full character library.',
    exampleAnswer: '138 characters',
    publicResultTemplate: '{value} characters',
  },
  'Characters|styles': {
    questionLabel: 'Which character styles are available?',
    shortDescription: 'Record which visual styles (realistic, anime, 2D, 3D…) the library offers.',
  },
  'Characters|genders': {
    questionLabel: 'Which gender options are available?',
    shortDescription: 'Record which character genders the library offers.',
  },
  'Characters|ethnicities': {
    questionLabel: 'Which ethnicities are represented in the character library?',
  },
  'Characters|personalities': {
    questionLabel: 'Which personality types are available?',
  },
  'Characters|scenarios': {
    questionLabel: 'Which roleplay scenarios are available?',
  },
  'Characters|filters': {
    questionLabel: 'Which character filters can users apply?',
    shortDescription: 'Record every filter control available in the character library.',
  },
  'Characters|categories': {
    questionLabel: 'Which character categories does the platform offer?',
  },
  'Characters|search': {
    questionLabel: 'Can users search for characters by name or keyword?',
  },
  'Characters|browsing': {
    questionLabel: 'How easy is it to browse the character library?',
  },
  'Characters|duplicates': {
    questionLabel: 'How many duplicate or near-duplicate profiles were found in the sample?',
    shortDescription:
      'Review a sample of characters and count profiles that repeat another character\u2019s image, name, description, personality, or scenario.',
    sampleSize: 25,
    calculationMethod: {
      kind: 'ratio',
      numeratorLabel: 'Duplicate profiles found',
      denominatorLabel: 'Profiles reviewed',
      invert: true,
    },
    exampleAnswer: '3 duplicates in 50 profiles → 6%',
  },
  'Characters|originality': {
    questionLabel: 'How original are the sampled character profiles?',
  },
  'Characters|profile-quality': {
    questionLabel: 'How complete and useful are the sampled character profiles?',
  },
  'Characters|visual-quality': {
    questionLabel: 'How high is the visual quality of the sampled character images?',
  },

  // ----- Pricing ------------------------------------------------------------
  'Pricing|monthly-price': {
    questionLabel: 'What is the cheapest monthly subscription price?',
    exampleAnswer: '12.99 USD per month',
    publicResultTemplate: '${value}/month',
  },
  'Pricing|annual-price': {
    questionLabel: 'What is the annual subscription price?',
  },
  'Pricing|free-plan': {
    questionLabel: 'Is there a usable free plan?',
  },
  'Pricing|free-trial': {
    questionLabel: 'Is a free trial available?',
  },
  'Pricing|included-credits': {
    questionLabel: 'How many tokens or credits are included with a subscription?',
  },
  'Pricing|included-features': {
    questionLabel: 'Which features are included in the subscription?',
  },
  'Pricing|plan-limits': {
    questionLabel: 'What usage limits apply to paid plans?',
  },
  'Pricing|image-cost': {
    questionLabel: 'How much does generating one image cost?',
  },
  'Pricing|video-cost': {
    questionLabel: 'How much does generating one video cost?',
  },
  'Pricing|voice-cost': {
    questionLabel: 'How much do voice messages or calls cost?',
  },
  'Pricing|top-ups': {
    questionLabel: 'How much does each token package cost, and what can the tokens purchase?',
  },
  'Pricing|credit-expiry': {
    questionLabel: 'Do purchased tokens or credits expire?',
  },
  'Pricing|feature-paywalls': {
    questionLabel: 'Which features require additional tokens or credits?',
  },
  'Pricing|refunds': {
    questionLabel: 'What is the refund policy?',
  },
  'Pricing|real-cost': {
    questionLabel: 'What does typical monthly usage really cost?',
  },
  'Pricing|heavy-use-cost': {
    questionLabel: 'What does heavy monthly usage cost?',
  },
  'Pricing|category-comparison': {
    questionLabel: 'How does pricing compare with similar platforms?',
  },
  'Pricing|feature-value': {
    questionLabel: 'How much usable functionality does the customer receive for the price?',
  },
  'Pricing|usage-value': {
    questionLabel: 'How much usage does the customer get for the price?',
  },
  'Pricing|pricing-clarity': {
    questionLabel: 'How clearly does the platform explain its prices and usage costs?',
    shortDescription:
      'Check which of the eight key pricing details are clearly shown before payment. The result is calculated automatically from the checks.',
    calculationMethod: {
      kind: 'checklist',
      items: [
        'Subscription price is visible',
        'Renewal period is visible',
        'Included credits are visible',
        'Image cost is visible',
        'Video cost is visible',
        'Usage limits are visible',
        'Credit expiry is visible',
        'Refund policy is visible',
      ],
    },
    exampleAnswer: '6 of 8 checks passed → 75%',
  },
};

const data = await db.query({ evidenceDefinitions: { subscore: { category: {} } } });
const defs = data.evidenceDefinitions as unknown as {
  id: string;
  slug: string;
  questionLabel?: string;
  subscore?: { category?: { name?: string } };
}[];

const txs = [];
let skipped = 0;
for (const def of defs) {
  const key = `${def.subscore?.category?.name ?? ''}|${def.slug}`;
  const patch = PATCHES[key];
  if (!patch) continue;
  if (def.questionLabel?.trim()) {
    skipped++;
    continue; // never overwrite editor-provided wording
  }
  txs.push(tx.evidenceDefinitions[def.id].update(patch));
  console.log(`Updating ${key}: "${patch.questionLabel}"`);
}

if (txs.length > 0) await db.transact(txs);
console.log(`\nUpdated ${txs.length} definitions, skipped ${skipped} (already had a question).`);
