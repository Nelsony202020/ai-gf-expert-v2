#!/usr/bin/env npx tsx
/**
 * Mark approved AI explanations/takeaways as outdated when inputHash no longer matches.
 * Does not delete any test data or copy text.
 *
 * Usage:
 *   npx tsx scripts/mark-stale-ai-copy.ts --slug candy-ai
 *   npx tsx scripts/mark-stale-ai-copy.ts --slug candy-ai --dry-run
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDb, isDbConfigured } from '../src/lib/db/server';
import { assembleExplanationContextFromBundle, loadExplanationProductBundle } from '../src/lib/ai-explanations/assembleContext';
import { listAllEvidenceGroups } from '../src/lib/ai-explanations/groups';
import { assembleSubscoreTakeawayFromBundle } from '../src/lib/subscore-takeaways/assembleContext';
import { listMethodologyAlignedSubscoreKeys } from '../src/lib/ratings/evidenceGroupScoring';

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

function parseArgs() {
  const args = process.argv.slice(2);
  let slug = 'candy-ai';
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug') slug = args[++i] ?? slug;
    if (args[i] === '--dry-run') dryRun = true;
  }
  return { slug, dryRun };
}

async function main() {
  loadEnv();
  if (!isDbConfigured()) {
    console.error('DB not configured');
    process.exit(1);
  }
  const { slug, dryRun } = parseArgs();
  const db = getDb();
  const { products } = await (db.query as any)({
    products: { $: { where: { slug } } },
  });
  const product = (products as any[])?.find((p) => !p.deletedAt);
  if (!product) {
    console.error(`Product not found: ${slug}`);
    process.exit(1);
  }

  const bundle = await loadExplanationProductBundle(product.id);
  const now = Date.now();
  const explanationChunks: unknown[] = [];
  const takeawayChunks: unknown[] = [];
  let staleExplanations = 0;
  let staleTakeaways = 0;

  const { evidenceExplanations } = await (db.query as any)({
    evidenceExplanations: {
      $: { where: { 'product.id': product.id, explanationStatus: 'approved' } },
    },
  });

  for (const row of (evidenceExplanations as any[]) ?? []) {
    if (!row.groupKey) continue;
    try {
      const ctx = assembleExplanationContextFromBundle(bundle, String(row.groupKey));
      if (row.inputHash && row.inputHash !== ctx.inputHash) {
        staleExplanations += 1;
        if (!dryRun) {
          explanationChunks.push(
            (db.tx as any).evidenceExplanations[row.id].update({
              explanationStatus: 'outdated',
              updatedAt: now,
            }),
          );
        }
        console.log(`  outdated explanation: ${row.groupKey}`);
      }
    } catch {
      /* skip unknown groups */
    }
  }

  const { subscoreTakeaways } = await (db.query as any)({
    subscoreTakeaways: {
      $: { where: { 'product.id': product.id, takeawayStatus: 'approved' } },
    },
  });

  for (const row of (subscoreTakeaways as any[]) ?? []) {
    if (!row.subscoreKey) continue;
    try {
      const ctx = assembleSubscoreTakeawayFromBundle(bundle, String(row.subscoreKey));
      if (row.inputHash && row.inputHash !== ctx.inputHash) {
        staleTakeaways += 1;
        if (!dryRun) {
          takeawayChunks.push(
            (db.tx as any).subscoreTakeaways[row.id].update({
              takeawayStatus: 'outdated',
              updatedAt: now,
            }),
          );
        }
        console.log(`  outdated takeaway: ${row.subscoreKey}`);
      }
    } catch {
      /* skip */
    }
  }

  if (!dryRun && explanationChunks.length + takeawayChunks.length > 0) {
    await db.transact([...explanationChunks, ...takeawayChunks] as any);
  }

  console.log(
    `\n${dryRun ? '[dry-run] ' : ''}Marked stale: ${staleExplanations} explanations, ${staleTakeaways} takeaways`,
  );
  console.log(`Groups checked: ${listAllEvidenceGroups().length} explanations, ${listMethodologyAlignedSubscoreKeys().length} subscores`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
