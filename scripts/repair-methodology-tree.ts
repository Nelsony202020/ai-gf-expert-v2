#!/usr/bin/env npx tsx
/**
 * Repair methodology tree: consolidate MVs, relink subscores/defs, migrate evidence.
 *
 * Fixes broken linkage after deduplicate-methodology.ts deactivated categories
 * without re-parenting subscores. Scoped to a product test run for answer preference.
 *
 * Usage:
 *   npx tsx scripts/repair-methodology-tree.ts --slug candy-ai --run-name july --dry-run
 *   npx tsx scripts/repair-methodology-tree.ts --slug candy-ai --run-name july --apply
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

/** Legacy evidence slugs to deactivate (from backfill-testing-v3). */
const DEACTIVATE_KEYS = new Set([
  'customization|detail-level',
  'customization|combinations',
  'customization|communication',
  'customization|gender',
  'customization|face',
  'customization|hair',
  'customization|body',
  'customization|clothing',
  'images|detail',
  'images|cost',
  'video|cost',
  'video|controls',
  'video|realism',
  'privacy|consent-controls',
  'privacy|billing-privacy',
  'privacy|account-security',
  'pricing|image-cost',
  'pricing|video-cost',
  'pricing|real-cost',
  'pricing|heavy-use-cost',
  'pricing|category-comparison',
  'pricing|feature-value',
  'pricing|usage-value',
]);

type Row = Record<string, any>;

function parseArgs() {
  const args = process.argv.slice(2);
  let slug = 'candy-ai';
  let runNameIncludes = 'july';
  let apply = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apply') apply = true;
    if (args[i] === '--dry-run') apply = false;
    if (args[i] === '--slug') slug = args[++i] ?? slug;
    if (args[i] === '--run-name') runNameIncludes = args[++i]?.toLowerCase() ?? runNameIncludes;
  }
  return { slug, runNameIncludes, apply };
}

function hasAnswer(r: Row): boolean {
  if (r.notApplicable || r.isUnknown) return true;
  if (r.rawValue != null && r.rawValue !== '') return true;
  if (String(r.publicResult ?? '').trim()) return true;
  if (Array.isArray(r.attachments) && r.attachments.length > 0) return true;
  return false;
}

function defFullKey(def: Row): string | null {
  const cat = def.subscore?.category?.slug;
  const sub = def.subscore?.slug;
  const s = def.slug;
  if (!cat || !sub || !s) return null;
  return `${cat}|${sub}|${s}`;
}

function defCatSlugKey(def: Row): string | null {
  const cat = def.subscore?.category?.slug;
  const s = def.slug;
  if (!cat || !s) return null;
  return `${cat}|${s}`;
}

function scoreRichness(r: Row): number {
  let n = 0;
  if (hasAnswer(r)) n += 10;
  if (Array.isArray(r.attachments)) n += r.attachments.length * 3;
  if (r.normalizedScore != null) n += 2;
  n += (r.updatedAt ?? 0) / 1e15;
  return n;
}

async function main() {
  const { slug, runNameIncludes, apply } = parseArgs();
  const { getDb } = await import('../src/lib/db/server');
  const db = getDb();
  const now = Date.now();

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

  const runs = (product.testRuns ?? []) as Row[];
  const refRun = runs.find((r) => String(r.name ?? '').toLowerCase().includes(runNameIncludes));
  if (!refRun) {
    console.error(`No run matching "${runNameIncludes}"`);
    process.exit(1);
  }

  const defIdsWithAnswers = new Set<string>();
  const runResults = ((product.evidenceResults ?? []) as Row[]).filter(
    (r) => r.testRun?.id === refRun.id,
  );
  for (const r of runResults) {
    if (!hasAnswer(r)) continue;
    const id = r.evidenceDefinition?.id;
    if (id) defIdsWithAnswers.add(id);
  }

  console.log(`\n=== Repair methodology tree (${apply ? 'APPLY' : 'DRY RUN'}) ===`);
  console.log(`Product: ${product.name ?? slug}`);
  console.log(`Reference run: ${refRun.name} (${refRun.id})`);
  console.log(`Defs with answers on reference run: ${defIdsWithAnswers.size}\n`);

  const { methodologyVersions, categories, subscores, evidenceDefinitions } = await (db.query as any)({
    methodologyVersions: { categories: {} },
    categories: { methodologyVersion: {} },
    subscores: { category: { methodologyVersion: {} } },
    evidenceDefinitions: { subscore: { category: { methodologyVersion: {} } } },
  });

  const allCats = categories as Row[];
  const allSubs = subscores as Row[];
  const allDefs = evidenceDefinitions as Row[];
  const mvs = methodologyVersions as Row[];

  // Pick target MV: version matching ref run, prefer MV with most active categories
  const refMvVersion = refRun.methodologyVersion?.version;
  const candidateMvs = mvs.filter((mv) => !refMvVersion || mv.version === refMvVersion);
  const mvList = candidateMvs.length > 0 ? candidateMvs : mvs;

  let targetMv = mvList[0];
  let bestCatCount = -1;
  for (const mv of mvList) {
    const count = allCats.filter((c) => c.methodologyVersion?.id === mv.id && c.active !== false).length;
    if (count > bestCatCount) {
      bestCatCount = count;
      targetMv = mv;
    }
  }
  const targetMvId = targetMv.id as string;
  console.log(`Target methodology version: ${targetMv.version} (${targetMvId.slice(0, 8)}…) [${bestCatCount} active cats]`);

  const txs: Parameters<typeof db.transact>[0] = [];
  let relinkSubs = 0;
  let relinkDefs = 0;
  let relinkCats = 0;
  let deactivateCats = 0;
  let deactivateSubs = 0;
  let deactivateDefs = 0;

  // --- 1. Canonical active category per slug (prefer target MV, answers, subscore count) ---
  const catsBySlug = new Map<string, Row[]>();
  for (const cat of allCats) {
    if (cat.active === false) continue;
    const k = String(cat.slug);
    if (!catsBySlug.has(k)) catsBySlug.set(k, []);
    catsBySlug.get(k)!.push(cat);
  }

  const canonicalCatId = new Map<string, string>();

  for (const [catSlug, group] of catsBySlug) {
    group.sort((a, b) => {
      let sa = 0;
      let sb = 0;
      if (a.methodologyVersion?.id === targetMvId) sa += 100;
      if (b.methodologyVersion?.id === targetMvId) sb += 100;
      const subsA = allSubs.filter((s) => s.active !== false && s.category?.id === a.id).length;
      const subsB = allSubs.filter((s) => s.active !== false && s.category?.id === b.id).length;
      sa += subsA * 5;
      sb += subsB * 5;
      return sb - sa || (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
    const keep = group[0];
    canonicalCatId.set(catSlug, keep.id);

    // Move keeper to target MV if needed
    if (keep.methodologyVersion?.id !== targetMvId) {
      console.log(`LINK category ${catSlug} → target MV (${keep.id.slice(0, 8)}…)`);
      if (apply) txs.push(db.tx.categories[keep.id].link({ methodologyVersion: targetMvId }));
      relinkCats++;
    }

    for (const dup of group.slice(1)) {
      console.log(`DEACT category dup: ${catSlug} id=${dup.id.slice(0, 8)} (keep ${keep.id.slice(0, 8)})`);
      if (apply) txs.push(db.tx.categories[dup.id].update({ active: false }));
      deactivateCats++;
    }
  }

  // --- 2. Relink ALL active subscores to canonical category for their slug ---
  for (const sub of allSubs) {
    if (sub.active === false) continue;
    const catSlug = sub.category?.slug;
    if (!catSlug) continue;
    const canonId = canonicalCatId.get(String(catSlug));
    if (!canonId) continue;
    if (sub.category?.id === canonId) continue;
    console.log(`LINK subscore ${catSlug}/${sub.slug} → cat ${canonId.slice(0, 8)}…`);
    if (apply) txs.push(db.tx.subscores[sub.id].link({ category: canonId }));
    relinkSubs++;
  }

  // Refresh sub list mentally — after relink, group subscores by catSlug|subSlug
  const subsByKey = new Map<string, Row[]>();
  for (const sub of allSubs) {
    if (sub.active === false) continue;
    const catSlug = String(sub.category?.slug ?? '');
    const canonId = canonicalCatId.get(catSlug);
    const effectiveCatId = sub.category?.id === canonId ? sub.category?.id : canonId;
    const key = `${catSlug}|${sub.slug}`;
    const entry = { ...sub, category: { ...sub.category, id: effectiveCatId, slug: catSlug } };
    if (!subsByKey.has(key)) subsByKey.set(key, []);
    subsByKey.get(key)!.push(entry);
  }

  const canonicalSubId = new Map<string, string>();
  for (const [key, group] of subsByKey) {
    if (group.length <= 1) {
      canonicalSubId.set(key, group[0].id);
      continue;
    }
    group.sort((a, b) => {
      let sa = 0;
      let sb = 0;
      if (defIdsWithAnswers.has(a.id)) sa += 200;
      if (defIdsWithAnswers.has(b.id)) sb += 200;
      const defsA = allDefs.filter((d) => d.subscore?.id === a.id && defIdsWithAnswers.has(d.id)).length;
      const defsB = allDefs.filter((d) => d.subscore?.id === b.id && defIdsWithAnswers.has(d.id)).length;
      sa += defsA * 50;
      sb += defsB * 50;
      return sb - sa || (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
    const keep = group[0];
    canonicalSubId.set(key, keep.id);
    for (const dup of group.slice(1)) {
      console.log(`DEACT subscore dup: ${key} id=${dup.id.slice(0, 8)} (keep ${keep.id.slice(0, 8)})`);
      if (apply) txs.push(db.tx.subscores[dup.id].update({ active: false }));
      deactivateSubs++;
    }
  }

  // --- 3. Relink defs to canonical subscore; dedupe defs ---
  for (const def of allDefs) {
    if (def.active === false) continue;
    const catSlug = def.subscore?.category?.slug;
    const subSlug = def.subscore?.slug;
    if (!catSlug || !subSlug) continue;
    const subKey = `${catSlug}|${subSlug}`;
    const canonSubId = canonicalSubId.get(subKey);
    if (canonSubId && def.subscore?.id !== canonSubId) {
      if (apply) txs.push(db.tx.evidenceDefinitions[def.id].link({ subscore: canonSubId }));
      relinkDefs++;
    }
  }

  const defsByKey = new Map<string, Row[]>();
  for (const def of allDefs) {
    if (def.active === false) continue;
    const fk = defFullKey(def);
    if (!fk) continue;
    const catSlug = fk.split('|')[0];
    if (DEACTIVATE_KEYS.has(`${catSlug}|${def.slug}`)) continue;
    if (!defsByKey.has(fk)) defsByKey.set(fk, []);
    defsByKey.get(fk)!.push(def);
  }

  const canonicalDefId = new Map<string, string>();
  for (const [key, group] of defsByKey) {
    if (group.length <= 1) {
      canonicalDefId.set(key, group[0].id);
      continue;
    }
    group.sort((a, b) => {
      let sa = defIdsWithAnswers.has(a.id) ? 200 : 0;
      let sb = defIdsWithAnswers.has(b.id) ? 200 : 0;
      const subKey = `${a.subscore?.category?.slug}|${a.subscore?.slug}`;
      if (a.subscore?.id === canonicalSubId.get(subKey)) sa += 50;
      if (b.subscore?.id === canonicalSubId.get(subKey)) sb += 50;
      return sb - sa || (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
    const keep = group[0];
    canonicalDefId.set(key, keep.id);
    for (const dup of group.slice(1)) {
      console.log(`DEACT evidence dup: ${key} id=${dup.id.slice(0, 8)} (keep ${keep.id.slice(0, 8)})`);
      if (apply) txs.push(db.tx.evidenceDefinitions[dup.id].update({ active: false }));
      deactivateDefs++;
    }
  }

  // --- 3b. Dedupe by category|slug (same slug under different subscores) ---
  const defsByCatSlug = new Map<string, Row[]>();
  for (const def of allDefs) {
    if (def.active === false) continue;
    const ck = defCatSlugKey(def);
    if (!ck) continue;
    const cat = ck.split('|')[0];
    if (DEACTIVATE_KEYS.has(`${cat}|${def.slug}`)) continue;
    if (!defsByCatSlug.has(ck)) defsByCatSlug.set(ck, []);
    defsByCatSlug.get(ck)!.push(def);
  }

  /** Prefer subscore slug from seed/sessions when duplicate cat|slug exists. */
  const preferredSubForSlug: Record<string, string> = {
    'customization|creator-personalities': 'personality',
  };

  for (const [ck, group] of defsByCatSlug) {
    if (group.length <= 1) continue;
    group.sort((a, b) => {
      let sa = defIdsWithAnswers.has(a.id) ? 200 : 0;
      let sb = defIdsWithAnswers.has(b.id) ? 200 : 0;
      const pref = preferredSubForSlug[ck];
      if (pref) {
        if (a.subscore?.slug === pref) sa += 100;
        if (b.subscore?.slug === pref) sb += 100;
      }
      return sb - sa || (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
    const keep = group[0];
    const fk = defFullKey(keep)!;
    canonicalDefId.set(fk, keep.id);
    for (const dup of group.slice(1)) {
      console.log(`DEACT cat|slug dup: ${ck} id=${dup.id.slice(0, 8)} (keep ${keep.id.slice(0, 8)})`);
      if (apply) txs.push(db.tx.evidenceDefinitions[dup.id].update({ active: false }));
      deactivateDefs++;
    }
  }

  // --- 4. Deactivate legacy slugs ---
  for (const def of allDefs) {
    if (def.active === false) continue;
    const cat = def.subscore?.category?.slug;
    if (!cat) continue;
    const key = `${cat}|${def.slug}`;
    if (!DEACTIVATE_KEYS.has(key)) continue;
    console.log(`DEACT legacy: ${key}`);
    if (apply) txs.push(db.tx.evidenceDefinitions[def.id].update({ active: false }));
    deactivateDefs++;
  }

  // --- 5. Link reference test run to target MV ---
  if (refRun.methodologyVersion?.id !== targetMvId) {
    console.log(`LINK test run "${refRun.name}" → target MV ${targetMv.version}`);
    if (apply) txs.push(db.tx.testRuns[refRun.id].link({ methodologyVersion: targetMvId }));
  }

  // --- 6. Migrate evidence results onto canonical active defs ---
  const activeDefs = allDefs.filter((d) => d.active !== false);
  const activeByFullKey = new Map<string, Row>();
  const activeByCatSlug = new Map<string, Row>();
  const activeBySlug = new Map<string, Row[]>();

  for (const d of activeDefs) {
    const fk = defFullKey(d);
    if (fk && canonicalDefId.get(fk) === d.id) activeByFullKey.set(fk, d);
    const ck = defCatSlugKey(d);
    if (ck && !activeByCatSlug.has(ck)) activeByCatSlug.set(ck, d);
    const s = d.slug ? String(d.slug) : null;
    if (s) {
      const list = activeBySlug.get(s) ?? [];
      list.push(d);
      activeBySlug.set(s, list);
    }
  }

  let migrated = 0;
  let merged = 0;

  const resultByActiveDefId = new Map<string, Row>();
  const orphaned: Row[] = [];

  for (const r of runResults) {
    const def = r.evidenceDefinition;
    if (!def) continue;
    if (def.active === false || def.subscore?.category?.active === false) {
      if (hasAnswer(r)) orphaned.push(r);
      continue;
    }
    const fk = defFullKey(def);
    if (fk && canonicalDefId.get(fk) === def.id) {
      resultByActiveDefId.set(def.id, r);
    } else if (hasAnswer(r)) {
      orphaned.push(r);
    }
  }

  for (const [fk, activeDef] of activeByFullKey) {
    const existing = resultByActiveDefId.get(activeDef.id);
    if (existing && hasAnswer(existing)) continue;

    let donor: Row | undefined;
    const ck = defCatSlugKey(activeDef)!;
    const s = String(activeDef.slug);

    for (const r of orphaned) {
      if (defFullKey(r.evidenceDefinition) === fk && hasAnswer(r)) {
        if (!donor || scoreRichness(r) > scoreRichness(donor)) donor = r;
      }
    }
    if (!donor) {
      for (const r of orphaned) {
        if (defCatSlugKey(r.evidenceDefinition) === ck && hasAnswer(r)) {
          if (!donor || scoreRichness(r) > scoreRichness(donor)) donor = r;
        }
      }
    }
    if (!donor) {
      const matches = orphaned.filter((r) => r.evidenceDefinition?.slug === s && hasAnswer(r));
      if (matches.length >= 1) {
        donor = matches.reduce((best, r) => (scoreRichness(r) > scoreRichness(best) ? r : best));
      }
    }
    if (!donor) continue;

    const action = existing ? 'merge' : 'relink';
    console.log(`  ${action} result ${ck} ← orphan ${donor.id.slice(0, 8)}…`);
    if (!apply) {
      if (action === 'relink') migrated++;
      else merged++;
      continue;
    }

    if (action === 'relink') {
      txs.push(
        db.tx.evidenceResults[donor.id]
          .update({ updatedAt: now })
          .link({ evidenceDefinition: activeDef.id, testRun: refRun.id, product: product.id }),
      );
      resultByActiveDefId.set(activeDef.id, donor);
      migrated++;
    } else {
      txs.push(
        db.tx.evidenceResults[existing!.id].update({
          rawValue: donor.rawValue,
          publicResult: donor.publicResult,
          normalizedScore: donor.normalizedScore,
          notApplicable: donor.notApplicable,
          isUnknown: donor.isUnknown,
          publicExplanation: donor.publicExplanation,
          internalNotes: donor.internalNotes,
          testDate: donor.testDate,
          verificationStatus: donor.verificationStatus,
          confidence: donor.confidence,
          proofLinks: donor.proofLinks,
          updatedAt: now,
        }),
      );
      txs.push(
        db.tx.evidenceResults[donor.id]
          .update({ updatedAt: now })
          .link({ evidenceDefinition: activeDef.id, testRun: refRun.id, product: product.id }),
      );
      merged++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Categories linked to target MV:     ${relinkCats}`);
  console.log(`Duplicate categories deactivated:   ${deactivateCats}`);
  console.log(`Subscores relinked to canonical cat: ${relinkSubs}`);
  console.log(`Duplicate subscores deactivated:  ${deactivateSubs}`);
  console.log(`Evidence defs relinked:           ${relinkDefs}`);
  console.log(`Duplicate/legacy defs deactivated: ${deactivateDefs}`);
  console.log(`Evidence results relinked:        ${migrated}`);
  console.log(`Evidence results merged:          ${merged}`);
  console.log(`Total transactions:               ${txs.length}`);

  if (apply && txs.length > 0) {
    for (let i = 0; i < txs.length; i += 50) {
      await db.transact(txs.slice(i, i + 50));
    }
    console.log(`\nApplied ${txs.length} update(s).`);
    console.log('Next: npx tsx scripts/audit-methodology-linkage.ts --slug candy-ai --run-name july');
    console.log('      npx tsx scripts/refresh-score-snapshots.ts candy-ai');
  } else if (!apply) {
    console.log('\nRe-run with --apply to execute repairs.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
