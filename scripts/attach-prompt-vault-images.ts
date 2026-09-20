/**
 * Attach the Prompt Vault result images.
 *
 *   npx tsx scripts/attach-prompt-vault-images.ts <folder-with-manifest.csv> [--dry-run] [--seed-only]
 *
 * manifest.csv (filename,id,name,prompt,category,generator,result,width,height,source_file)
 * is the source of truth. For every row it:
 *   1. checks the row against the vault data (id exists, name / prompt / generator match,
 *      result number exists, file exists) and refuses to run on any mismatch;
 *   2. uploads the original WebP to Bunny Storage at prompt-vault/<filename> — responsive
 *      sizes come from Bunny Optimizer (?width=…) at render time, so only originals are stored;
 *   3. sets imagePath / width / height on the matching promptVaultResults row in InstantDB,
 *      and mirrors the same values into src/data/prompt-vault/seed.json for local builds.
 *
 * --seed-only: skip Bunny and InstantDB; only validate and update seed.json.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { uploadToBunny, isBunnyConfigured } from '../src/lib/media/cdn';
import { getDb, isDbConfigured, tx } from '../src/lib/db/server';

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const seedOnly = args.includes('--seed-only');
if (!folder) throw new Error('usage: attach-prompt-vault-images.ts <folder> [--dry-run] [--seed-only]');

const GENERATORS: Record<string, string> = {
  Dreamy: 'dreamy',
  'Vivid 1': 'vivid-1',
  'Vivid 2': 'vivid-2',
  'Vivid 3': 'vivid-3',
};
export const STORAGE_DIR = 'prompt-vault';

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ''])));
}

interface SeedResult {
  key: string;
  sortOrder: number;
  imagePath?: string;
  width?: number;
  height?: number;
}
interface SeedPrompt {
  key: string;
  title: string;
  promptText: string;
  generator: string;
  results: SeedResult[];
}

async function main() {
  const dir = resolve(folder!);
  const manifest = parseCsv(readFileSync(join(dir, 'manifest.csv'), 'utf8'));
  const seedPath = resolve('src/data/prompt-vault/seed.json');
  const seed = JSON.parse(readFileSync(seedPath, 'utf8')) as { prompts: SeedPrompt[] };
  const prompts = new Map(seed.prompts.map((p) => [p.key, p]));

  const problems: string[] = [];
  const plan: { row: Record<string, string>; result: SeedResult }[] = [];
  const covered = new Map<string, number>();
  for (const row of manifest) {
    const p = prompts.get(row.id);
    if (!p) {
      problems.push(`image row with no prompt: ${row.filename} (id ${row.id})`);
      continue;
    }
    if (row.name !== p.title) problems.push(`${row.id}: name "${row.name}" ≠ "${p.title}"`);
    if (row.prompt !== p.promptText) problems.push(`${row.id}: prompt "${row.prompt}" ≠ "${p.promptText}"`);
    if (GENERATORS[row.generator] !== p.generator) problems.push(`${row.id}: generator ${row.generator} ≠ ${p.generator}`);
    if (!existsSync(join(dir, row.filename))) problems.push(`${row.filename}: file missing`);
    const results = [...p.results].sort((a, b) => a.sortOrder - b.sortOrder);
    const result = results[Number(row.result) - 1];
    if (!result) {
      problems.push(`${row.filename}: result ${row.result} does not exist on ${row.id}`);
      continue;
    }
    covered.set(row.id, (covered.get(row.id) ?? 0) + 1);
    plan.push({ row, result });
  }
  for (const p of seed.prompts) {
    const n = covered.get(p.key) ?? 0;
    if (n === 0) problems.push(`prompt with no image: ${p.key} ${p.title}`);
    else if (n !== p.results.length) problems.push(`${p.key}: ${n} images for ${p.results.length} results`);
  }
  if (problems.length) {
    console.error(`[images] refusing to continue:\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
  console.log(`[images] manifest OK: ${plan.length} images for ${seed.prompts.length} prompts, nothing unmatched`);

  // seed.json mirror
  for (const { row, result } of plan) {
    result.imagePath = `/${STORAGE_DIR}/${row.filename}`;
    result.width = Number(row.width);
    result.height = Number(row.height);
  }
  if (!dryRun) writeFileSync(seedPath, `${JSON.stringify(seed, null, 2)}\n`);
  console.log(`[images] seed.json ${dryRun ? 'would be' : ''} updated`);
  if (seedOnly) return;

  if (!isBunnyConfigured()) throw new Error('Bunny is not configured (.env)');
  if (!isDbConfigured()) throw new Error('InstantDB is not configured (.env)');

  let uploaded = 0;
  for (const { row } of plan) {
    const target = `${STORAGE_DIR}/${row.filename}`;
    if (dryRun) continue;
    await uploadToBunny(target, readFileSync(join(dir, row.filename)), 'image/webp');
    uploaded += 1;
    if (uploaded % 20 === 0) console.log(`[images] uploaded ${uploaded}/${plan.length}`);
  }
  console.log(`[images] uploaded ${uploaded} files to Bunny /${STORAGE_DIR}/`);

  const db = getDb();
  const { promptVaultResults } = (await (db.query as any)({ promptVaultResults: {} })) as {
    promptVaultResults: { id: string; key: string }[];
  };
  const byKey = new Map(promptVaultResults.map((r) => [r.key, r.id]));
  const steps = plan.map(({ result }) => {
    const id = byKey.get(result.key);
    if (!id) throw new Error(`no promptVaultResults row for ${result.key} — run seed-prompt-vault first`);
    return tx.promptVaultResults[id].update({ imagePath: result.imagePath, width: result.width, height: result.height });
  });
  if (!dryRun) for (let i = 0; i < steps.length; i += 100) await db.transact(steps.slice(i, i + 100));
  console.log(`[images] ${dryRun ? 'would update' : 'updated'} ${steps.length} result rows in InstantDB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
