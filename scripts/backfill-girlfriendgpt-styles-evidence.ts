#!/usr/bin/env npx tsx
// Backfill GirlfriendGPT Characters → Styles evidence with named selections.
// The published test run stored count-only rawValue ({ value: 4 }) without detail.selected,
// so public pages show "Not available" for character styles.
//
// Usage: npx tsx scripts/backfill-girlfriendgpt-styles-evidence.ts

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

const SELECTED = ['Realistic', 'Anime', 'Fantasy', 'Semi-realistic'] as const;

async function main() {
  const { getDb } = await import('../src/lib/db/server');
  const db = getDb();

  const { products, testRuns, evidenceResults, evidenceDefinitions } = await (db.query as any)({
    products: { $: { where: { slug: 'girlfriendgpt' } } },
    testRuns: { product: {} },
    evidenceResults: { testRun: { product: {} }, evidenceDefinition: {} },
    evidenceDefinitions: { subscore: { category: {} } },
  });

  const product = products[0];
  if (!product) {
    console.error('GirlfriendGPT product not found');
    process.exit(1);
  }

  const publishedRun = testRuns.find(
    (r: any) => r.product?.slug === 'girlfriendgpt' && r.isCurrentPublished,
  );
  if (!publishedRun) {
    console.error('No published test run for GirlfriendGPT');
    process.exit(1);
  }

  const stylesDef = evidenceDefinitions.find(
    (d: any) => d.slug === 'styles' && d.subscore?.category?.slug === 'characters',
  );
  if (!stylesDef) {
    console.error('Characters/styles evidence definition not found');
    process.exit(1);
  }

  const result = evidenceResults.find(
    (r: any) =>
      r.testRun?.id === publishedRun.id && r.evidenceDefinition?.id === stylesDef.id,
  );
  if (!result) {
    console.error('Styles evidence result not found on published run');
    process.exit(1);
  }

  const raw = result.rawValue as { value?: number; detail?: { selected?: string[] } } | null;
  const existing = raw?.detail?.selected?.filter(Boolean) ?? [];
  if (existing.length > 0) {
    console.log('Already has selected styles:', existing.join(', '));
    return;
  }

  const count = raw?.value ?? SELECTED.length;
  const nextRaw = {
    value: count,
    detail: { selected: [...SELECTED] },
  };

  await db.transact([
    (db.tx as any).evidenceResults[result.id].update({
      rawValue: nextRaw,
      updatedAt: Date.now(),
    }),
  ]);

  console.log('Updated GirlfriendGPT styles evidence:', SELECTED.join(' + '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
