#!/usr/bin/env npx tsx
/** Inspect Candy AI privacy score breakdown and weights. */

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

const { getDb } = await import('../src/lib/db/server');
const { calculateRun } = await import('../src/lib/scoring/testRuns');

const db = getDb();

const { products } = await db.query({
  products: {
    $: { where: { slug: 'candy-ai' } },
    testRuns: {
      $: { order: { serverCreatedAt: 'desc' } },
      scoreSnapshots: {},
      methodologyVersion: {
        categories: {
          $: { where: { slug: 'privacy' } },
          subscores: { evidenceDefinitions: {} },
        },
      },
    },
  },
});

const product = products[0];
if (!product) {
  console.log('No candy-ai product found.');
  process.exit(1);
}

const runs = (product.testRuns ?? []) as any[];
const published = runs.find((r) => r.isCurrentPublished) ?? runs[0];
if (!published) {
  console.log('No test run for candy-ai.');
  process.exit(1);
}

console.log('Product:', product.name, `(${product.slug})`);
console.log('Test run:', published.id, '| status:', published.status, '| published:', published.isCurrentPublished);

const privacySnap = (published.scoreSnapshots ?? []).find(
  (s: any) => s.kind === 'category' && s.refSlug === 'privacy',
);
console.log('\nStored privacy snapshot score:', privacySnap?.score ?? '(none)');
console.log('Snapshot calc version:', privacySnap?.calculationVersion);
console.log('Snapshot methodology:', privacySnap?.methodologyVersion);

const { tree } = await calculateRun(published.id);
const privacyCat = tree.categories.find((c) => c.slug === 'privacy');
console.log('\nLive recalculated privacy score:', privacyCat?.score);

// Reload run with evidence results for simulation
const { testRuns: runRows } = await db.query({
  testRuns: {
    $: { where: { id: published.id } },
    evidenceResults: { evidenceDefinition: {} },
    methodologyVersion: {
      categories: { subscores: { evidenceDefinitions: {} } },
    },
  },
});
const runFull = runRows[0] as any;
const mv = runFull.methodologyVersion;
const privacyCategory = mv?.categories?.find((c: any) => c.slug === 'privacy');

console.log('\n--- Privacy evidence weights in linked methodology ---');
const defs: any[] = [];
for (const sub of privacyCategory?.subscores ?? []) {
  for (const d of sub.evidenceDefinitions ?? []) {
    if (d.active) defs.push({ sub: sub.slug, ...d });
  }
}
defs.sort((a, b) => a.displayOrder - b.displayOrder);
let weightSum = 0;
for (const d of defs) {
  weightSum += d.weight ?? 0;
  console.log(`  ${d.sub}/${d.slug}: weight=${d.weight} active=${d.active}`);
}
console.log('  Active weight sum (raw):', weightSum);

console.log('\n--- Privacy score breakdown (live) ---');
for (const sub of privacyCat?.subscores ?? []) {
  console.log(`\nSubscore ${sub.slug}: ${sub.score}`);
  for (const ev of sub.evidence) {
    console.log(
      `  ${ev.slug.padEnd(22)} status=${ev.status.padEnd(10)} score=${ev.normalizedScore ?? 'null'} effWeight=${ev.effectiveWeight?.toFixed(1) ?? 'null'} | ${ev.detail}`,
    );
  }
}

console.log('\nWarnings:', tree.warnings);
console.log('Blocking:', tree.blockingErrors);

// Simulate with intended new weights
const NEW_WEIGHTS: Record<string, number> = {
  training: 14,
  'human-review': 14,
  'data-sharing': 4,
  advertising: 4,
  retention: 20,
  'policy-clarity': 42,
  'delete-chats': 25,
  'delete-account': 25,
  'delete-personal-data': 12,
  'training-opt-out': 12,
  'export-data': 12,
  encryption: 7,
  'two-factor-authentication': 7,
  'billing-descriptor': 43,
  'security-incidents': 43,
};

const { computeScores } = await import('../src/lib/scoring/engine');
const resultByDef = new Map<string, any>();
for (const r of runFull.evidenceResults ?? []) {
  if (r.evidenceDefinition?.id) resultByDef.set(r.evidenceDefinition.id, r);
}

const categories = (mv?.categories ?? [])
  .filter((c: any) => c.active)
  .map((c: any) => ({ slug: c.slug, name: c.name, weight: c.weight }));

const subscores = (mv?.categories ?? []).flatMap((c: any) =>
  (c.subscores ?? [])
    .filter((s: any) => s.active)
    .map((s: any) => ({
      slug: s.slug,
      name: s.name,
      categorySlug: c.slug,
      weight: s.weight,
    })),
);

const evidenceInputs = (mv?.categories ?? []).flatMap((c: any) =>
  (c.subscores ?? []).flatMap((s: any) =>
    (s.evidenceDefinitions ?? [])
      .filter((d: any) => d.active)
      .map((d: any) => {
        const result = resultByDef.get(d.id);
        const weight =
          c.slug === 'privacy' && NEW_WEIGHTS[d.slug] !== undefined ? NEW_WEIGHTS[d.slug] : d.weight;
        return {
          definitionId: d.id,
          slug: d.slug,
          name: d.name,
          subscoreSlug: s.slug,
          categorySlug: c.slug,
          weight,
          required: d.required,
          measurementType: d.measurementType,
          scoringRule: d.scoringRule,
          rawValue: result?.rawValue,
          notApplicable: result?.notApplicable,
          isUnknown: result?.isUnknown,
          manualOverrideScore: result?.manualOverrideScore ?? undefined,
        };
      }),
  ),
);

const simulated = computeScores(categories, subscores, evidenceInputs);
const simPrivacy = simulated.categories.find((c) => c.slug === 'privacy');
console.log('\n--- If NEW weights were applied (same answers) ---');
console.log('Simulated privacy score:', simPrivacy?.score);
for (const sub of simPrivacy?.subscores ?? []) {
  console.log(`  ${sub.slug}: ${sub.score}`);
}

// Show encryption raw value
const encDef = defs.find((d) => d.slug === 'encryption');
if (encDef) {
  const encResult = resultByDef.get(encDef.id);
  console.log('\nEncryption rawValue:', JSON.stringify(encResult?.rawValue));
  console.log('Encryption measurementType:', encDef.measurementType);
  console.log('Encryption scoringRule kind:', encDef.scoringRule?.kind);
}
