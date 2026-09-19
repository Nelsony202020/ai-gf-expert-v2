/**
 * Seed / sync the OurDream Character Prompt Vault into InstantDB.
 * Run: npx tsx scripts/seed-prompt-vault.ts [--dry-run]
 *
 * Source: src/data/prompt-vault/seed.json (verbatim from Figma page 245:4).
 * Upserts by `key` — safe to re-run. It NEVER deletes rows and never touches
 * a prompt's `status` or a result's image fields once they exist, so edits made
 * later in the database survive a re-run.
 */
import seed from '../src/data/prompt-vault/seed.json';
import { getDb, id, isDbConfigured, tx } from '../src/lib/db/server';
import { assembleVault } from '../src/lib/prompt-vault/assemble';

const dryRun = process.argv.includes('--dry-run');

type Row = Record<string, unknown> & { id: string; key: string };

async function main() {
  // Validate the seed with the same rules the build uses before writing anything.
  const check = assembleVault(
    {
      filters: seed.filters,
      categories: seed.categories,
      prompts: seed.prompts.map((p) => ({ ...p, status: 'published' })),
    },
    'seed',
  );
  console.log(
    `[seed] seed.json OK: ${check.totals.prompts} prompts, ${check.totals.results} results, ` +
      `${check.categories.length} categories, ${check.filters.length} filters`,
  );
  if (seed._missing?.length) console.log(`[seed] not in Figma yet (skipped): ${seed._missing.join(', ')}`);
  if (!isDbConfigured()) throw new Error('InstantDB is not configured (.env)');

  const db = getDb();
  const existing = (await (db.query as any)({
    promptVaultFilters: {},
    promptVaultCategories: {},
    promptVaultPrompts: {},
    promptVaultResults: {},
  })) as Record<string, Row[]>;
  const index = (rows: Row[] = []) => new Map(rows.map((r) => [String(r.key), r]));
  const filters = index(existing.promptVaultFilters);
  const categories = index(existing.promptVaultCategories);
  const prompts = index(existing.promptVaultPrompts);
  const results = index(existing.promptVaultResults);

  const now = Date.now();
  const steps: any[] = [];
  const counts = { created: 0, updated: 0 };
  const idFor = (map: Map<string, Row>, key: string) => {
    const row = map.get(key);
    if (row) counts.updated += 1;
    else counts.created += 1;
    return row?.id ?? id();
  };

  for (const f of seed.filters) {
    steps.push(tx.promptVaultFilters[idFor(filters, f.key)].update({ key: f.key, label: f.label, sortOrder: f.sortOrder }));
  }
  const categoryIds = new Map<string, string>();
  for (const c of seed.categories) {
    const cid = idFor(categories, c.key);
    categoryIds.set(c.key, cid);
    steps.push(
      tx.promptVaultCategories[cid].update({
        key: c.key,
        title: c.title,
        shortTitle: (c as { shortTitle?: string }).shortTitle ?? null,
        description: c.description,
        group: c.group,
        groupOrder: c.groupOrder,
        filter: c.filter,
        sortOrder: c.sortOrder,
      }),
    );
  }
  for (const p of seed.prompts) {
    const prev = prompts.get(p.key);
    const pid = idFor(prompts, p.key);
    steps.push(
      tx.promptVaultPrompts[pid]
        .update({
          key: p.key,
          title: p.title,
          promptText: p.promptText,
          generator: p.generator,
          sortOrder: p.sortOrder,
          updatedAt: now,
          ...(prev ? {} : { status: 'published', createdAt: now }),
        })
        .link({ category: categoryIds.get(p.category)! }),
    );
    for (const r of p.results) {
      const rid = idFor(results, r.key);
      steps.push(tx.promptVaultResults[rid].update({ key: r.key, sortOrder: r.sortOrder }).link({ prompt: pid }));
    }
  }

  console.log(`[seed] ${counts.created} rows to create, ${counts.updated} to update (${steps.length} steps)`);
  if (dryRun) return console.log('[seed] --dry-run: nothing written');
  for (let i = 0; i < steps.length; i += 100) {
    await db.transact(steps.slice(i, i + 100));
  }
  console.log('[seed] done');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
