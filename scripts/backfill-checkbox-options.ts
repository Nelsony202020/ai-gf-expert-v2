#!/usr/bin/env npx tsx
// Backfills checkbox-style inputs on list-style evidence definitions:
//
// - multi_select: the tester ticks which options exist (e.g. Female / Male /
//   Non-binary / Transgender) and the count becomes the scored value. Only
//   applied to count-based definitions with a small, fixed option list; an
//   "Other" free-text field covers anything not listed.
// - checklist: the tester ticks which checks pass and the percentage is
//   derived automatically. Only applied to percentage-based definitions with
//   a fixed item list from the methodology.
//
// Skips any definition that already has an inputType, options, or a
// calculation method, so editor changes are never overwritten. Scoring rules,
// weights, and existing results are untouched.
//
// Usage: npx tsx scripts/backfill-checkbox-options.ts

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

const opts = (labels: string[]) => labels.map((label) => ({ value: label, label }));

// Keyed by "<category name>|<slug>" because slugs repeat across categories.

/** count-based definitions → tick which options exist (value = count). */
const MULTI_SELECT: Record<string, { options: { value: string; label: string }[] }> = {
  'Characters|genders': {
    options: opts(['Female', 'Male', 'Non-binary', 'Transgender']),
  },
  'Characters|styles': {
    options: opts(['Realistic', 'Anime', '2D / cartoon', '3D render', 'Fantasy']),
  },
  'Customization|gender': {
    options: opts(['Female', 'Male', 'Non-binary', 'Transgender']),
  },
  'Privacy|encryption': {
    options: opts(['Encryption in transit', 'Encryption at rest', 'End-to-end encryption']),
  },
  'Privacy|consent-controls': {
    options: opts([
      'Training opt-out',
      'Marketing opt-out',
      'Cookie controls',
      'Data-sharing control',
      'Profile visibility',
      'Chat-history control',
    ]),
  },
};

/** percentage-based definitions → tick which checks pass (value = derived %). */
const CHECKLIST: Record<string, { items: string[] }> = {
  'Privacy|account-security': {
    items: [
      'Minimum password requirements',
      'Login alerts',
      'Active-session management',
      'Account-recovery controls',
      'Suspicious-login protection',
    ],
  },
  'Pricing|included-features': {
    items: [
      'Standard chat',
      'Character library',
      'Character creation',
      'Image generation',
      'Image editing',
      'Video generation',
      'Voice messages',
      'Voice calls',
      'Memory controls',
      'Message regeneration',
    ],
  },
  'Pricing|feature-paywalls': {
    items: [
      'Standard chat',
      'Character library',
      'Character creation',
      'Image generation',
      'Image editing',
      'Video generation',
      'Voice messages',
      'Voice calls',
      'Memory controls',
      'Message regeneration',
    ],
  },
  'Pricing|feature-value': {
    items: [
      'Standard chat',
      'Character library',
      'Character creation',
      'Image generation',
      'Image editing',
      'Video generation',
      'Voice messages',
      'Voice calls',
      'Memory controls',
      'Message regeneration',
    ],
  },
};

interface DefRow {
  id: string;
  slug: string;
  measurementType?: string;
  inputType?: string;
  options?: unknown;
  calculationMethod?: { kind?: string } | null;
  subscore?: { category?: { name?: string } };
}

const data = await db.query({ evidenceDefinitions: { subscore: { category: {} } } });
const defs = data.evidenceDefinitions as unknown as DefRow[];

const txs = [];
let skipped = 0;

for (const def of defs) {
  const key = `${def.subscore?.category?.name ?? ''}|${def.slug}`;

  const multi = MULTI_SELECT[key];
  if (multi) {
    if (def.inputType?.trim() || (Array.isArray(def.options) && def.options.length > 0)) {
      skipped++;
      continue; // never overwrite editor-provided config
    }
    txs.push(
      tx.evidenceDefinitions[def.id].update({ inputType: 'multi_select', options: multi.options }),
    );
    console.log(`multi_select ${key}: ${multi.options.map((o) => o.label).join(', ')}`);
    continue;
  }

  const checklist = CHECKLIST[key];
  if (checklist) {
    const kind = def.calculationMethod?.kind;
    if (kind === 'checklist' || kind === 'ratio' || def.inputType?.trim()) {
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
