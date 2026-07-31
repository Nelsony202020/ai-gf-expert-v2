#!/usr/bin/env npx tsx
/**
 * Audit + migrate evidence results onto active methodology definitions.
 *
 * After methodology backfills, answers often remain on inactive definition IDs
 * while the admin UI only reads active definitions (by ID). The public review
 * still shows data because it resolves by slug.
 *
 * Usage:
 *   npx tsx scripts/migrate-evidence-results.ts --slug candy-ai
 *   npx tsx scripts/migrate-evidence-results.ts --slug candy-ai --apply
 *   npx tsx scripts/migrate-evidence-results.ts --slug candy-ai --run-id <uuid> --apply
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

type DefRow = {
  id: string;
  slug: string;
  name: string;
  active?: boolean;
  subscore?: { slug?: string; category?: { slug?: string } };
};

type ResultRow = {
  id: string;
  rawValue?: unknown;
  publicResult?: string;
  notApplicable?: boolean;
  isUnknown?: boolean;
  updatedAt?: number;
  testRun?: { id: string; name?: string };
  evidenceDefinition?: DefRow;
  attachments?: unknown[];
};

function parseArgs() {
  const args = process.argv.slice(2);
  let slug = 'candy-ai';
  let runId: string | undefined;
  let runNameIncludes: string | undefined;
  let apply = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--apply') apply = true;
    else if (a === '--dry-run') apply = false;
    else if (a === '--slug') slug = args[++i] ?? slug;
    else if (a === '--run-id') runId = args[++i];
    else if (a === '--run-name') runNameIncludes = args[++i]?.toLowerCase();
  }

  return { slug, runId, runNameIncludes, apply };
}

function defKey(def: DefRow | undefined): string | null {
  const cat = def?.subscore?.category?.slug;
  const sub = def?.subscore?.slug;
  const s = def?.slug;
  if (!cat || !sub || !s) return null;
  return `${cat}|${sub}|${s}`;
}

function catSlugKey(def: DefRow | undefined): string | null {
  const cat = def?.subscore?.category?.slug;
  const s = def?.slug;
  if (!cat || !s) return null;
  return `${cat}|${s}`;
}

function slugOnly(def: DefRow | undefined): string | null {
  return def?.slug ? String(def.slug) : null;
}

function hasRecordedAnswer(r: ResultRow): boolean {
  if (r.notApplicable || r.isUnknown) return true;
  if (r.rawValue != null && r.rawValue !== '') return true;
  if (r.publicResult?.trim()) return true;
  if (Array.isArray(r.attachments) && r.attachments.length > 0) return true;
  return false;
}

function scoreRichness(r: ResultRow): number {
  let n = 0;
  if (hasRecordedAnswer(r)) n += 10;
  if (Array.isArray(r.attachments)) n += r.attachments.length * 3;
  if (r.normalizedScore != null) n += 2;
  n += (r.updatedAt ?? 0) / 1e15;
  return n;
}

async function main() {
  const { slug, runId, runNameIncludes, apply } = parseArgs();
  const { getDb, id } = await import('../src/lib/db/server');
  const db = getDb();
  const now = Date.now();

  const { products } = await (db.query as any)({
    products: {
      $: { where: { slug } },
      testRuns: {},
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

  const runs = (product.testRuns ?? []) as Array<{ id: string; name?: string; status?: string; startedAt?: number; isCurrentPublished?: boolean }>;
  runs.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));

  let targetRuns = runs;
  if (runId) {
    targetRuns = runs.filter((r) => r.id === runId);
  } else if (runNameIncludes) {
    targetRuns = runs.filter((r) => String(r.name ?? '').toLowerCase().includes(runNameIncludes));
  }

  if (targetRuns.length === 0) {
    console.error('No matching test runs.');
    console.log(
      'Available runs:',
      runs.map((r) => ({ id: r.id, name: r.name, status: r.status })),
    );
    process.exit(1);
  }

  const { evidenceDefinitions } = await (db.query as any)({
    evidenceDefinitions: { subscore: { category: {} } },
  });

  const allDefs = evidenceDefinitions as DefRow[];
  const activeDefs = allDefs.filter((d) => d.active !== false);
  const inactiveDefs = allDefs.filter((d) => d.active === false);

  const activeByFullKey = new Map<string, DefRow>();
  const activeByCatSlug = new Map<string, DefRow>();
  const activeBySlug = new Map<string, DefRow[]>();

  for (const d of activeDefs) {
    const fk = defKey(d);
    if (fk) activeByFullKey.set(fk, d);
    const ck = catSlugKey(d);
    if (ck) activeByCatSlug.set(ck, d);
    const s = slugOnly(d);
    if (s) {
      const list = activeBySlug.get(s) ?? [];
      list.push(d);
      activeBySlug.set(s, list);
    }
  }

  const allResults = (product.evidenceResults ?? []) as ResultRow[];

  console.log(`\n=== Evidence migration audit: ${product.name ?? slug} ===`);
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN (pass --apply to write)'}`);
  console.log(`Active definitions: ${activeDefs.length} | Inactive: ${inactiveDefs.length}`);
  console.log(`Product evidence results (all runs): ${allResults.length}`);
  console.log(`Target runs: ${targetRuns.map((r) => `"${r.name}" (${r.id}, ${r.status})`).join(', ')}\n`);

  const txs: Parameters<typeof db.transact>[0] = [];
  let migrated = 0;
  let merged = 0;
  let skipped = 0;
  let genuinelyMissing = 0;
  let alreadyMapped = 0;

  const genuinelyMissingSlugs: string[] = [];

  for (const run of targetRuns) {
    console.log(`--- Run: ${run.name} (${run.id}) ---`);
    const runResults = allResults.filter((r) => r.testRun?.id === run.id);

    const resultByActiveDefId = new Map<string, ResultRow>();
    const orphaned: ResultRow[] = [];

    for (const r of runResults) {
      const def = r.evidenceDefinition;
      if (!def) continue;
      if (def.active === false) {
        if (hasRecordedAnswer(r)) orphaned.push(r);
        continue;
      }
      resultByActiveDefId.set(def.id, r);
    }

    console.log(`  Results on run: ${runResults.length} | Orphaned (inactive def): ${orphaned.length}`);

    for (const activeDef of activeDefs) {
      const fk = defKey(activeDef)!;
      const ck = catSlugKey(activeDef)!;
      const s = slugOnly(activeDef)!;

      const existing = resultByActiveDefId.get(activeDef.id);
      if (existing && hasRecordedAnswer(existing)) {
        alreadyMapped++;
        continue;
      }

      // Find best orphaned donor: full key → cat|slug → slug-only (unique)
      let donor: ResultRow | undefined;

      for (const r of orphaned) {
        if (defKey(r.evidenceDefinition) === fk && hasRecordedAnswer(r)) {
          if (!donor || scoreRichness(r) > scoreRichness(donor)) donor = r;
        }
      }
      if (!donor) {
        for (const r of orphaned) {
          if (catSlugKey(r.evidenceDefinition) === ck && hasRecordedAnswer(r)) {
            if (!donor || scoreRichness(r) > scoreRichness(donor)) donor = r;
          }
        }
      }
      if (!donor) {
        const slugMatches = orphaned.filter(
          (r) => slugOnly(r.evidenceDefinition) === s && hasRecordedAnswer(r),
        );
        if (slugMatches.length === 1) donor = slugMatches[0];
        else if (slugMatches.length > 1) {
          donor = slugMatches.reduce((best, r) =>
            scoreRichness(r) > scoreRichness(best) ? r : best,
          );
        }
      }

      if (!donor) {
        if (activeDef.required !== false) {
          genuinelyMissing++;
          genuinelyMissingSlugs.push(`${ck} (${activeDef.name})`);
        }
        continue;
      }

      const action = existing ? 'merge-into-empty-active' : 'relink-orphan';
      console.log(
        `  ${apply ? '→' : '·'} ${action}: ${ck} ← orphan ${donor.id.slice(0, 8)}… (def ${donor.evidenceDefinition?.id?.slice(0, 8)}…)`,
      );

      if (!apply) {
        if (action === 'relink-orphan') migrated++;
        else merged++;
        continue;
      }

      if (action === 'relink-orphan') {
        txs.push(
          db.tx.evidenceResults[donor.id]
            .update({ updatedAt: now })
            .link({ evidenceDefinition: activeDef.id, testRun: run.id, product: product.id }),
        );
        resultByActiveDefId.set(activeDef.id, donor);
        migrated++;
      } else {
        txs.push(
          db.tx.evidenceResults[existing!.id].update({
            rawValue: donor.rawValue,
            publicResult: donor.publicResult,
            normalizedScore: (donor as any).normalizedScore,
            notApplicable: donor.notApplicable,
            isUnknown: donor.isUnknown,
            publicExplanation: (donor as any).publicExplanation,
            internalNotes: (donor as any).internalNotes,
            testDate: (donor as any).testDate,
            verificationStatus: (donor as any).verificationStatus,
            confidence: (donor as any).confidence,
            proofLinks: (donor as any).proofLinks,
            updatedAt: now,
          }),
        );
        // Move attachments by relinking donor (media links to evidenceResult)
        txs.push(
          db.tx.evidenceResults[donor.id]
            .update({ updatedAt: now })
            .link({ evidenceDefinition: activeDef.id, testRun: run.id, product: product.id }),
        );
        merged++;
      }
    }

    skipped += orphaned.filter((r) => {
      const fk = defKey(r.evidenceDefinition);
      return fk && !activeByFullKey.has(fk) && !activeByCatSlug.has(catSlugKey(r.evidenceDefinition)!);
    }).length;
  }

  console.log('\n=== Summary ===');
  console.log(`Already mapped (active def has answer): ${alreadyMapped}`);
  console.log(`Would migrate (relink orphan):          ${migrated}`);
  console.log(`Would merge into empty active slot:     ${merged}`);
  console.log(`Genuinely missing on active defs:       ${genuinelyMissing}`);

  if (genuinelyMissingSlugs.length > 0 && genuinelyMissingSlugs.length <= 40) {
    console.log('\nStill empty (new questions — need manual entry):');
    for (const line of genuinelyMissingSlugs.slice(0, 40)) console.log(`  - ${line}`);
    if (genuinelyMissingSlugs.length > 40) {
      console.log(`  … and ${genuinelyMissingSlugs.length - 40} more`);
    }
  }

  if (apply && txs.length > 0) {
    for (let i = 0; i < txs.length; i += 50) {
      await db.transact(txs.slice(i, i + 50));
    }
    console.log(`\nApplied ${txs.length} transaction(s). Re-open the Testing tab and recalculate scores.`);
  } else if (!apply && (migrated > 0 || merged > 0)) {
    console.log('\nRe-run with --apply to perform migration.');
  } else if (!apply) {
    console.log('\nNo relinks needed (or only genuinely new empty questions remain).');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
