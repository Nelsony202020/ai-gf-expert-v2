#!/usr/bin/env npx tsx
// Backfills calculation methods on percentage-based evidence definitions so
// testers enter raw counts ("43 of 50") or tick checklist items instead of
// computing percentages by hand:
//
// - ratio: numerator + denominator → percentage derived automatically. The
//   same fields are what the worksheet grids write, so grid-covered questions
//   also get a usable full form.
// - checklist: tick which items pass → percentage derived automatically.
//
// Skips any definition that already has an inputType or calculationMethod so
// editor changes are never overwritten. Scoring rules, weights and existing
// results are untouched.
//
// Usage: npx tsx scripts/backfill-worksheet-ratios.ts

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

// Keyed by "<category name>|<slug>" because slugs repeat across categories.

const RATIO: Record<string, { numeratorLabel: string; denominatorLabel: string }> = {
  // Characters — 50-character quality review
  'Characters|duplicates': {
    numeratorLabel: 'Duplicates found',
    denominatorLabel: 'Characters reviewed (50)',
  },
  'Characters|originality': {
    numeratorLabel: 'Characters passing (2 of 3 points)',
    denominatorLabel: 'Characters reviewed (50)',
  },
  'Characters|profile-quality': {
    numeratorLabel: 'Profile checks passed',
    denominatorLabel: 'Total checks (50 × 5 = 250)',
  },
  'Characters|visual-quality': {
    numeratorLabel: 'Image checks passed',
    denominatorLabel: 'Total checks (50 × 5 = 250)',
  },

  // Customization — creator control
  'Customization|combinations': {
    numeratorLabel: 'Successful creations',
    denominatorLabel: 'Attempts (5)',
  },

  // Chat — 10-conversation test (also covered by the worksheet grid)
  'Chat|memory': { numeratorLabel: 'Facts remembered', denominatorLabel: 'Facts planted (50)' },
  'Chat|relevance': {
    numeratorLabel: 'Questions answered directly',
    denominatorLabel: 'Questions asked (50)',
  },
  'Chat|context': { numeratorLabel: 'Context tests passed', denominatorLabel: 'Context tests (10)' },
  'Chat|instructions': {
    numeratorLabel: 'Instructions followed',
    denominatorLabel: 'Instructions given (30)',
  },
  'Chat|roleplay-accuracy': {
    numeratorLabel: 'Scenario checks passed',
    denominatorLabel: 'Total checks (50)',
  },
  'Chat|naturalness': { numeratorLabel: 'Natural replies', denominatorLabel: 'Replies reviewed (200)' },
  'Chat|personality': {
    numeratorLabel: 'Conversations keeping 2+ traits',
    denominatorLabel: 'Conversations (10)',
  },
  'Chat|roleplay': { numeratorLabel: 'Roleplay checks passed', denominatorLabel: 'Total checks (50)' },
  'Chat|initiative': { numeratorLabel: 'Initiative moments', denominatorLabel: 'Opportunities (100)' },
  'Chat|emotion': { numeratorLabel: 'Emotional cues handled well', denominatorLabel: 'Cues tested (50)' },
  'Chat|style': { numeratorLabel: 'On-style replies', denominatorLabel: 'Replies reviewed (200)' },
  'Chat|consistency': {
    numeratorLabel: 'Contradictions found',
    denominatorLabel: 'Statements checked (50)',
  },
  'Chat|recovery': { numeratorLabel: 'Successful recoveries', denominatorLabel: 'Recovery tests (10)' },

  // Images — 20-image batch + consistency + experience
  'Images|realism': {
    numeratorLabel: 'Realism checks passed',
    denominatorLabel: 'Total checks (20 × 5 = 100)',
  },
  'Images|visual-errors': {
    numeratorLabel: 'Images with a major error',
    denominatorLabel: 'Images reviewed (20)',
  },
  'Images|detail': {
    numeratorLabel: 'Detail checks passed',
    denominatorLabel: 'Total checks (20 × 5 = 100)',
  },
  'Images|composition': {
    numeratorLabel: 'Composition checks passed',
    denominatorLabel: 'Total checks (20 × 5 = 100)',
  },
  'Images|prompt-accuracy': {
    numeratorLabel: 'Required elements present',
    denominatorLabel: 'Total elements (20 × 5 = 100)',
  },
  'Images|character-consistency': {
    numeratorLabel: 'Consistency checks passed',
    denominatorLabel: 'Total checks (10 × 5 = 50)',
  },
  'Images|face-consistency': {
    numeratorLabel: 'Images with the same face',
    denominatorLabel: 'Images (10)',
  },
  'Images|body-consistency': {
    numeratorLabel: 'Images with the same body',
    denominatorLabel: 'Images (10)',
  },
  'Images|style-consistency': {
    numeratorLabel: 'Style tests passed',
    denominatorLabel: 'Tests (10)',
  },
  'Images|editing-accuracy': {
    numeratorLabel: 'Editing checks passed',
    denominatorLabel: 'Total checks (10 × 5 = 50)',
  },
  'Images|failures': { numeratorLabel: 'Failed attempts', denominatorLabel: 'Attempts (20)' },

  // Video — 10-video batch + experience
  'Video|realism': {
    numeratorLabel: 'Realism checks passed',
    denominatorLabel: 'Total checks (10 × 5 = 50)',
  },
  'Video|motion': {
    numeratorLabel: 'Motion checks passed',
    denominatorLabel: 'Total checks (10 × 5 = 50)',
  },
  'Video|accuracy': {
    numeratorLabel: 'Required elements present',
    denominatorLabel: 'Total elements (10 × 5 = 50)',
  },
  'Video|character-consistency': {
    numeratorLabel: 'Consistency checks passed',
    denominatorLabel: 'Total checks (10 × 5 = 50)',
  },
  'Video|visual-errors': {
    numeratorLabel: 'Videos with a major error',
    denominatorLabel: 'Videos reviewed (10)',
  },
  'Video|frame-consistency': {
    numeratorLabel: 'Stability checks passed',
    denominatorLabel: 'Total checks (10 × 5 = 50)',
  },
  'Video|failures': { numeratorLabel: 'Failed attempts', denominatorLabel: 'Attempts (10)' },
};

const CHECKLIST: Record<string, { items: string[] }> = {
  'Customization|editing': {
    items: ['Appearance', 'Personality', 'Relationship', 'Voice', 'Name'],
  },
  'Customization|detail-level': {
    items: [
      'Gender',
      'Age',
      'Ethnicity',
      'Face',
      'Eyes',
      'Nose',
      'Lips',
      'Hair style',
      'Hair color',
      'Height',
      'Body type',
      'Chest',
      'Waist',
      'Hips',
      'Clothing',
      'Personality',
      'Interests',
      'Communication style',
      'Relationship',
      'Voice',
    ],
  },
  'Privacy|policy-clarity': {
    items: [
      'Training use of chats is clearly answered',
      'Human review of chats is clearly answered',
      'Third-party data sharing is clearly answered',
      'Data deletion is clearly answered',
      'Data retention period is clearly answered',
      'Security protection is clearly answered',
    ],
  },
  'Pricing|pricing-clarity': {
    items: [
      'Subscription price shown before payment',
      'Renewal period shown before payment',
      'Included credits shown before payment',
      'Image cost shown before payment',
      'Video cost shown before payment',
      'Usage limits shown before payment',
      'Credit expiry shown before payment',
      'Refund policy shown before payment',
    ],
  },
};

interface DefRow {
  id: string;
  slug: string;
  measurementType?: string;
  inputType?: string;
  calculationMethod?: { kind?: string } | null;
  subscore?: { category?: { name?: string } };
}

const data = await db.query({ evidenceDefinitions: { subscore: { category: {} } } });
const defs = data.evidenceDefinitions as unknown as DefRow[];

const txs = [];
let skipped = 0;

for (const def of defs) {
  const key = `${def.subscore?.category?.name ?? ''}|${def.slug}`;
  const configured = Boolean(def.inputType?.trim() || def.calculationMethod?.kind);

  const ratio = RATIO[key];
  if (ratio) {
    if (configured) {
      skipped++;
      continue; // never overwrite editor-provided config
    }
    txs.push(
      tx.evidenceDefinitions[def.id].update({
        inputType: 'ratio',
        calculationMethod: { kind: 'ratio', ...ratio },
      }),
    );
    console.log(`ratio     ${key}: ${ratio.numeratorLabel} / ${ratio.denominatorLabel}`);
    continue;
  }

  const checklist = CHECKLIST[key];
  if (checklist) {
    if (configured) {
      skipped++;
      continue;
    }
    txs.push(
      tx.evidenceDefinitions[def.id].update({
        inputType: 'checklist',
        calculationMethod: { kind: 'checklist', items: checklist.items },
      }),
    );
    console.log(`checklist ${key}: ${checklist.items.length} items`);
  }
}

if (txs.length > 0) await db.transact(txs);
console.log(`\nUpdated ${txs.length} definitions, skipped ${skipped} (already configured).`);
