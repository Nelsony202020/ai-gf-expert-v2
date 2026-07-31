#!/usr/bin/env npx tsx
/**
 * Read-only audit: methodology tree linkage + Candy AI test run coverage.
 *
 * Usage:
 *   npx tsx scripts/audit-methodology-linkage.ts
 *   npx tsx scripts/audit-methodology-linkage.ts --slug candy-ai --run-name july
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
  let slug = 'candy-ai';
  let runNameIncludes = 'july';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug') slug = args[++i] ?? slug;
    if (args[i] === '--run-name') runNameIncludes = args[++i]?.toLowerCase() ?? runNameIncludes;
  }
  return { slug, runNameIncludes };
}

function hasAnswer(r: {
  rawValue?: unknown;
  publicResult?: string;
  notApplicable?: boolean;
  isUnknown?: boolean;
  attachments?: unknown[];
}): boolean {
  if (r.notApplicable || r.isUnknown) return true;
  if (r.rawValue != null && r.rawValue !== '') return true;
  if (r.publicResult?.trim()) return true;
  if (Array.isArray(r.attachments) && r.attachments.length > 0) return true;
  return false;
}

async function main() {
  const { slug, runNameIncludes } = parseArgs();
  const { getDb } = await import('../src/lib/db/server');
  const db = getDb();

  const { products } = await (db.query as any)({
    products: {
      $: { where: { slug } },
      testRuns: { methodologyVersion: {} },
      evidenceResults: {
        testRun: {},
        evidenceDefinition: { subscore: { category: {} } },
        attachments: {},
      },
    },
  });

  const product = (products as any[])?.[0];
  if (!product) {
    console.error(`Product not found: ${slug}`);
    process.exit(1);
  }

  const runs = (product.testRuns ?? []) as any[];
  const julyRun = runs.find((r) => String(r.name ?? '').toLowerCase().includes(runNameIncludes));
  const publishedRun = runs.find((r) => r.isCurrentPublished);

  console.log(`\n=== Methodology linkage audit: ${product.name ?? slug} ===\n`);
  console.log('Test runs:');
  for (const r of runs) {
    console.log(
      `  - ${r.name} (${r.id.slice(0, 8)}…) status=${r.status} published=${Boolean(r.isCurrentPublished)} mv=${r.methodologyVersion?.version ?? r.methodologyVersion?.id?.slice(0, 8) ?? '—'}`,
    );
  }

  if (!julyRun) {
    console.error(`\nNo run matching --run-name "${runNameIncludes}"`);
    process.exit(1);
  }

  const mvId = julyRun.methodologyVersion?.id;
  if (!mvId) {
    console.error('\nJuly run has no methodologyVersion');
    process.exit(1);
  }

  console.log(`\nTarget run: ${julyRun.name} (${julyRun.id})`);
  console.log(`Methodology version: ${julyRun.methodologyVersion?.version ?? mvId}`);

  const { categories, subscores, evidenceDefinitions } = await (db.query as any)({
    categories: { methodologyVersion: {}, subscores: { evidenceDefinitions: {} } },
    subscores: { category: { methodologyVersion: {} } },
    evidenceDefinitions: { subscore: { category: { methodologyVersion: {} } } },
  });

  const allCats = categories as any[];
  const allSubs = subscores as any[];
  const allDefs = evidenceDefinitions as any[];

  // Global duplicate categories by slug
  const catsBySlug = new Map<string, any[]>();
  for (const c of allCats.filter((c) => c.active !== false)) {
    const k = String(c.slug);
    if (!catsBySlug.has(k)) catsBySlug.set(k, []);
    catsBySlug.get(k)!.push(c);
  }

  console.log('\n--- Global active categories (duplicate check) ---');
  for (const [catSlug, group] of catsBySlug) {
    const mvIds = group.map((c) => c.methodologyVersion?.id?.slice(0, 8) ?? '?');
    const flag = group.length > 1 ? ' [DUPLICATE]' : '';
    console.log(`  ${catSlug}: ${group.length} row(s) mv=[${mvIds.join(', ')}]${flag}`);
  }

  // MV-scoped tree
  const mvCats = allCats
    .filter((c) => c.methodologyVersion?.id === mvId && c.active !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  console.log(`\n--- MV tree (${mvId.slice(0, 8)}…) ---`);
  console.log(`Active categories on MV: ${mvCats.length}`);

  const julyResults = ((product.evidenceResults ?? []) as any[]).filter(
    (r) => r.testRun?.id === julyRun.id,
  );
  const publishedResults = publishedRun
    ? ((product.evidenceResults ?? []) as any[]).filter((r) => r.testRun?.id === publishedRun.id)
    : [];

  const julySlugsWithAnswers = new Set<string>();
  const julyMappedActive = new Set<string>();
  let julyOrphaned = 0;

  for (const r of julyResults) {
    if (!hasAnswer(r)) continue;
    const def = r.evidenceDefinition;
    const cat = def?.subscore?.category?.slug;
    const s = def?.slug;
    if (cat && s) julySlugsWithAnswers.add(`${cat}|${s}`);
    if (def?.active !== false && def?.subscore?.category?.active !== false) {
      julyMappedActive.add(def.id);
    } else {
      julyOrphaned++;
    }
  }

  let totalMvDefs = 0;
  let mvDefsWithJulyAnswers = 0;

  for (const cat of mvCats) {
    const subsOnCatId = allSubs.filter((s) => s.active !== false && s.category?.id === cat.id);
    const subsOnCatSlug = allSubs.filter(
      (s) => s.active !== false && s.category?.slug === cat.slug && s.category?.id !== cat.id,
    );

    let defCount = 0;
    let defsWithAnswers = 0;

    for (const sub of subsOnCatId) {
      const defs = allDefs.filter((d) => d.active !== false && d.subscore?.id === sub.id);
      defCount += defs.length;
      totalMvDefs += defs.length;
      for (const d of defs) {
        const has = julyResults.some(
          (r) => r.evidenceDefinition?.id === d.id && hasAnswer(r),
        );
        if (has) {
          defsWithAnswers++;
          mvDefsWithJulyAnswers++;
        }
      }
    }

    const orphanNote =
      subsOnCatSlug.length > 0
        ? ` ⚠ ${subsOnCatSlug.length} subscore(s) on OTHER category id for slug ${cat.slug}`
        : '';

    console.log(
      `  ${cat.slug}: subs=${subsOnCatId.length} defs=${defCount} julyAnswers=${defsWithAnswers}${orphanNote}`,
    );
  }

  // Orphaned subscores (active, category inactive or wrong MV)
  const orphanedSubs = allSubs.filter(
    (s) =>
      s.active !== false &&
      (s.category?.active === false || s.category?.methodologyVersion?.id !== mvId),
  );

  const activeDefsOnInactiveCat = allDefs.filter(
    (d) => d.active !== false && d.subscore?.category?.active === false,
  );

  console.log('\n--- July run evidence coverage ---');
  console.log(`  Total results on run: ${julyResults.length}`);
  console.log(`  Unique category|slug with answers: ${julySlugsWithAnswers.size}`);
  console.log(`  Mapped to active defs (admin-visible): ${julyMappedActive.size}`);
  console.log(`  Orphaned (inactive def or inactive category): ${julyOrphaned}`);
  console.log(`  MV active defs with July answers: ${mvDefsWithJulyAnswers} / ${totalMvDefs}`);

  if (publishedRun) {
    const pubSlugs = new Set<string>();
    for (const r of publishedResults) {
      if (!hasAnswer(r)) continue;
      const cat = r.evidenceDefinition?.subscore?.category?.slug;
      const s = r.evidenceDefinition?.slug;
      if (cat && s) pubSlugs.add(`${cat}|${s}`);
    }
    const onlyJuly = [...julySlugsWithAnswers].filter((k) => !pubSlugs.has(k));
    const onlyPub = [...pubSlugs].filter((k) => !julySlugsWithAnswers.has(k));
    console.log('\n--- Published vs July slug diff ---');
    console.log(`  Published slugs with answers: ${pubSlugs.size}`);
    console.log(`  Only on July: ${onlyJuly.length}`);
    console.log(`  Only on published: ${onlyPub.length}`);
    if (onlyPub.length > 0 && onlyPub.length <= 15) {
      for (const k of onlyPub) console.log(`    pub-only: ${k}`);
    }
  }

  console.log('\n--- Linkage problems ---');
  console.log(`  Orphaned active subscores (wrong/inactive category): ${orphanedSubs.length}`);
  console.log(`  Active defs on inactive categories: ${activeDefsOnInactiveCat.length}`);

  if (orphanedSubs.length > 0) {
    console.log('\n  Sample orphaned subscores:');
    for (const s of orphanedSubs.slice(0, 12)) {
      console.log(
        `    ${s.category?.slug}/${s.slug} → catId=${s.category?.id?.slice(0, 8)} active=${s.category?.active !== false}`,
      );
    }
  }

  // Admin join simulation (global active cats + ID join)
  const globalActiveCats = allCats
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  let adminEmptyCats = 0;
  for (const cat of globalActiveCats) {
    const subs = allSubs.filter((s) => s.active !== false && s.category?.id === cat.id);
    const defs = subs.flatMap((sub) =>
      allDefs.filter((d) => d.active !== false && d.subscore?.id === sub.id),
    );
    if (defs.length === 0) adminEmptyCats++;
  }

  console.log('\n--- Admin join simulation (global lists) ---');
  console.log(`  Global active categories: ${globalActiveCats.length}`);
  console.log(`  Categories with 0 defs via ID join: ${adminEmptyCats}`);

  const mvAdminEmpty = mvCats.filter((cat) => {
    const subs = allSubs.filter((s) => s.active !== false && s.category?.id === cat.id);
    const defs = subs.flatMap((sub) =>
      allDefs.filter((d) => d.active !== false && d.subscore?.id === sub.id),
    );
    return defs.length === 0;
  });

  console.log('\n--- MV-scoped join (target after fix) ---');
  console.log(`  MV categories with 0 defs: ${mvAdminEmpty.length}`);
  if (mvAdminEmpty.length > 0) {
    console.log(`  Empty: ${mvAdminEmpty.map((c) => c.slug).join(', ')}`);
  }

  console.log('\n=== Gate ===');
  if (julySlugsWithAnswers.size >= 100 && julyMappedActive.size < 50) {
    console.log('PROCEED TO REPAIR: many answers by slug but few mapped to active defs.');
  } else if (mvAdminEmpty.length > 0 || orphanedSubs.length > 0) {
    console.log('PROCEED TO REPAIR: broken category/subscore linkage detected.');
  } else {
    console.log('Tree linkage looks OK; check admin MV scoping in code.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
