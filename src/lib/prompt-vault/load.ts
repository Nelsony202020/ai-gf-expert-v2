/**
 * Build-time loader for the Prompt Vault.
 *
 * The vault page is prerendered: this runs once per deploy inside `astro build`,
 * never per visitor request. New prompts go live on the next deploy.
 *
 * Source of truth is InstantDB. src/data/prompt-vault/seed.json is ONLY used
 * off Vercel (local dev / sandbox builds without DB credentials). On Vercel a
 * missing, failing or empty database fails the build — the live site keeps
 * the previous deploy instead of publishing a thin vault.
 */
import { getDb, isDbConfigured } from '../db/server';
import { assembleVault } from './assemble';
import type { VaultData, VaultRawRows } from './types';

let cached: Promise<VaultData> | null = null;

function onVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

async function loadSeedRows(): Promise<VaultRawRows> {
  const seed = (await import('../../data/prompt-vault/seed.json')).default as {
    filters: VaultRawRows['filters'];
    categories: VaultRawRows['categories'];
    prompts: Array<Omit<VaultRawRows['prompts'][number], 'category'> & { category: string }>;
  };
  return {
    filters: seed.filters,
    categories: seed.categories,
    prompts: seed.prompts.map((p) => ({ ...p, status: 'published' })),
  };
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? '' : String(v));
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));
const optNum = (v: unknown) => (v == null || v === '' ? null : Number(v));

async function loadDbRows(): Promise<VaultRawRows> {
  const db = getDb();
  const data = (await (db.query as any)({
    promptVaultFilters: {},
    promptVaultCategories: {},
    promptVaultPrompts: { category: {}, results: {} },
  })) as Record<string, Row[]>;

  const one = (v: unknown): Row | null => (Array.isArray(v) ? ((v[0] as Row) ?? null) : ((v as Row) ?? null));

  return {
    filters: (data.promptVaultFilters ?? []).map((f) => ({
      key: str(f.key),
      label: str(f.label),
      sortOrder: num(f.sortOrder),
    })),
    categories: (data.promptVaultCategories ?? []).map((c) => ({
      key: str(c.key),
      title: str(c.title),
      shortTitle: c.shortTitle ? str(c.shortTitle) : null,
      description: str(c.description),
      group: str(c.group),
      groupOrder: num(c.groupOrder),
      filter: str(c.filter),
      sortOrder: num(c.sortOrder),
    })),
    prompts: (data.promptVaultPrompts ?? []).map((p) => {
      const cat = one(p.category);
      return {
        key: str(p.key),
        title: str(p.title),
        promptText: str(p.promptText),
        generator: str(p.generator),
        status: str(p.status) || 'draft',
        sortOrder: num(p.sortOrder),
        category: cat ? str(cat.key) : null,
        results: ((p.results as Row[]) ?? []).map((r) => ({
          key: str(r.key),
          imagePath: r.imagePath ? str(r.imagePath) : null,
          width: optNum(r.width),
          height: optNum(r.height),
          alt: r.alt ? str(r.alt) : null,
          sortOrder: num(r.sortOrder),
        })),
      };
    }),
  };
}

async function load(): Promise<VaultData> {
  if (!isDbConfigured()) {
    if (onVercel()) {
      throw new Error('[prompt-vault] InstantDB is not configured on this Vercel build — refusing to prerender the vault.');
    }
    console.warn('[prompt-vault] no DB credentials — using src/data/prompt-vault/seed.json (local only)');
    return assembleVault(await loadSeedRows(), 'seed');
  }
  let rows: VaultRawRows;
  try {
    rows = await loadDbRows();
  } catch (error) {
    if (onVercel()) throw error;
    console.warn('[prompt-vault] DB read failed — using seed.json (local only)', error);
    return assembleVault(await loadSeedRows(), 'seed');
  }
  return assembleVault(rows, 'instantdb');
}

/** Memoised for the build: every consumer shares one DB read. */
export function loadPromptVault(): Promise<VaultData> {
  cached ??= load();
  return cached;
}
