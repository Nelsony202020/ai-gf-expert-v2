#!/usr/bin/env npx tsx
/**
 * Deactivate duplicate methodology categories/subscores/evidence definitions.
 *
 * Backfills created duplicate active rows (same slug) while old rows stayed active.
 * The admin UI maps sessions by slug → one def id, but answers may sit on the other.
 *
 * IMPORTANT: Prefer scripts/repair-methodology-tree.ts — this script deactivates
 * duplicates without re-parenting subscores. Only use after repair, or with --mv-id.
 *
 * Usage:
 *   npx tsx scripts/deduplicate-methodology.ts --dry-run
 *   npx tsx scripts/deduplicate-methodology.ts --apply --mv-id <uuid>
 *   npx tsx scripts/deduplicate-methodology.ts --apply --slug candy-ai --run-name july
 */

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

function parseArgs() {
  const args = process.argv.slice(2);
  let apply = false;
  let productSlug: string | undefined;
  let runNameIncludes: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apply') apply = true;
    if (args[i] === '--dry-run') apply = false;
    if (args[i] === '--slug') productSlug = args[++i];
    if (args[i] === '--run-name') runNameIncludes = args[++i]?.toLowerCase();
  }
  return { apply, productSlug, runNameIncludes };
}

type ResultRow = {
  id: string;
  rawValue?: unknown;
  publicResult?: string;
  notApplicable?: boolean;
  isUnknown?: boolean;
  attachments?: unknown[];
  testRun?: { id: string };
  evidenceDefinition?: { id: string };
};

function hasAnswer(r: ResultRow): boolean {
  if (r.notApplicable || r.isUnknown) return true;
  if (r.rawValue != null && r.rawValue !== '') return true;
  if (r.publicResult?.trim()) return true;
  if (Array.isArray(r.attachments) && r.attachments.length > 0) return true;
  return false;
}

async function main() {
  const { apply, productSlug, runNameIncludes } = parseArgs();
  const { getDb } = await import('../src/lib/db/server');
  const db = getDb();

  // Optional: result ids per evidence def for a reference test run
  const defIdsWithAnswers = new Set<string>();
  if (productSlug) {
    const { products } = await (db.query as any)({
      products: {
        $: { where: { slug: productSlug } },
        testRuns: {},
        evidenceResults: { testRun: {}, evidenceDefinition: {}, attachments: {} },
      },
    });
    const product = (products as any[])?.[0];
    if (product) {
      let runs = product.testRuns ?? [];
      if (runNameIncludes) {
        runs = runs.filter((r: any) => String(r.name ?? '').toLowerCase().includes(runNameIncludes));
      }
      const runIds = new Set(runs.map((r: any) => r.id));
      for (const r of (product.evidenceResults ?? []) as ResultRow[]) {
        if (!runIds.has(r.testRun?.id ?? '')) continue;
        if (!hasAnswer(r)) continue;
        const defId = r.evidenceDefinition?.id;
        if (defId) defIdsWithAnswers.add(defId);
      }
      console.log(
        `Reference run(s) for ${productSlug}: ${runs.map((r: any) => r.name).join(', ') || '(none)'}`,
      );
      console.log(`Defs with answers on reference run: ${defIdsWithAnswers.size}\n`);
    }
  }

  const { categories, subscores, evidenceDefinitions } = await (db.query as any)({
    categories: { methodologyVersion: {} },
    subscores: { category: {} },
    evidenceDefinitions: { subscore: { category: {} } },
  });

  const txs: Parameters<typeof db.transact>[0] = [];
  let deactivateCats = 0;
  let deactivateSubs = 0;
  let deactivateDefs = 0;
  let relinkResults = 0;

  // --- Categories: same slug (any methodology version link) ---
  const catsBySlug = new Map<string, any[]>();
  for (const cat of categories as any[]) {
    if (cat.active === false) continue;
    const key = String(cat.slug);
    if (!catsBySlug.has(key)) catsBySlug.set(key, []);
    catsBySlug.get(key)!.push(cat);
  }

  const canonicalCatIdBySlug = new Map<string, string>();
  for (const [slug, group] of catsBySlug) {
    if (group.length <= 1) {
      canonicalCatIdBySlug.set(slug, group[0].id);
      continue;
    }
    group.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || String(a.id).localeCompare(String(b.id)));
    const keep = group[0];
    canonicalCatIdBySlug.set(slug, keep.id);
    for (const dup of group.slice(1)) {
      console.log(`DEACT category dup: ${slug} id=${dup.id.slice(0, 8)} (keep ${keep.id.slice(0, 8)})`);
      if (apply) txs.push(db.tx.categories[dup.id].update({ active: false }));
      deactivateCats++;
    }
  }

  // --- Subscores: same slug under category slug ---
  const subsByKey = new Map<string, any[]>();
  for (const sub of subscores as any[]) {
    if (sub.active === false) continue;
    const cat = sub.category;
    if (!cat || cat.active === false) continue;
    const catSlug = String(cat.slug);
    const keepCatId = canonicalCatIdBySlug.get(catSlug);
    if (!keepCatId) continue;
    const key = `${catSlug}|${sub.slug}`;
    if (!subsByKey.has(key)) subsByKey.set(key, []);
    subsByKey.get(key)!.push(sub);
  }

  const canonicalSubId = new Map<string, string>();
  for (const [key, group] of subsByKey) {
    if (group.length <= 1) {
      canonicalSubId.set(key, group[0].id);
      continue;
    }
    const catSlug = key.split('|')[0];
    const keepCatId = canonicalCatIdBySlug.get(catSlug);
    group.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (a.category?.id === keepCatId) scoreA += 50;
      if (b.category?.id === keepCatId) scoreB += 50;
      if (defIdsWithAnswers.has(a.id)) scoreA += 100;
      if (defIdsWithAnswers.has(b.id)) scoreB += 100;
      return scoreB - scoreA || (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
    const keep = group[0];
    canonicalSubId.set(key, keep.id);
    for (const dup of group.slice(1)) {
      console.log(`DEACT subscore dup: ${key} id=${dup.id.slice(0, 8)} (keep ${keep.id.slice(0, 8)})`);
      if (apply) txs.push(db.tx.subscores[dup.id].update({ active: false }));
      deactivateSubs++;
    }
  }

  // --- Evidence definitions ---
  const defsByKey = new Map<string, any[]>();
  for (const def of evidenceDefinitions as any[]) {
    if (def.active === false) continue;
    const cat = def.subscore?.category;
    const sub = def.subscore;
    if (!cat || !sub || cat.active === false || sub.active === false) continue;
    const key = `${cat.slug}|${sub.slug}|${def.slug}`;
    if (!defsByKey.has(key)) defsByKey.set(key, []);
    defsByKey.get(key)!.push(def);
  }

  for (const [key, group] of defsByKey) {
    if (group.length <= 1) continue;

    const [catSlug, subSlug] = key.split('|');
    const subKey = `${catSlug}|${subSlug}`;
    const keepSubId = canonicalSubId.get(subKey);
    const keepCatId = canonicalCatIdBySlug.get(catSlug ?? '');

    group.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (defIdsWithAnswers.has(a.id)) scoreA += 200;
      if (defIdsWithAnswers.has(b.id)) scoreB += 200;
      if (a.subscore?.id === keepSubId) scoreA += 50;
      if (b.subscore?.id === keepSubId) scoreB += 50;
      if (a.subscore?.category?.id === keepCatId) scoreA += 25;
      if (b.subscore?.category?.id === keepCatId) scoreB += 25;
      return scoreB - scoreA || (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });

    const keep = group[0];
    const losers = group.slice(1);
    for (const dup of losers) {
      const dupHas = defIdsWithAnswers.has(dup.id);
      const keepHas = defIdsWithAnswers.has(keep.id);
      const shortKey = key;
      console.log(
        `DEACT evidence dup: ${shortKey} id=${dup.id.slice(0, 8)} (keep ${keep.id.slice(0, 8)})${dupHas ? ' [has answers]' : ''}${keepHas ? ' [keep has answers]' : ''}`,
      );
      if (apply) {
        txs.push(db.tx.evidenceDefinitions[dup.id].update({ active: false }));
        if (dupHas) relinkResults++;
      }
      deactivateDefs++;
    }
  }

  console.log(`\n=== Summary (${apply ? 'APPLY' : 'DRY RUN'}) ===`);
  console.log(`Duplicate categories to deactivate: ${deactivateCats}`);
  console.log(`Duplicate subscores to deactivate:  ${deactivateSubs}`);
  console.log(`Duplicate evidence to deactivate:   ${deactivateDefs}`);
  if (relinkResults) console.log(`Dup defs with answers needing relink: ${relinkResults}`);

  if (apply && txs.length > 0) {
    for (let i = 0; i < txs.length; i += 50) {
      await db.transact(txs.slice(i, i + 50));
    }
    console.log(`\nApplied ${txs.length} updates.`);
    console.log('Next: npx tsx scripts/migrate-evidence-results.ts --slug candy-ai --run-name july --apply');
  } else if (!apply) {
    console.log('\nRe-run with --apply to deactivate duplicates.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
