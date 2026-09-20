/**
 * OurDream Character Prompt Vault — shared types.
 *
 * The vault lives at ONE indexable URL (/guides/ourdream-ai-character-prompts/).
 * Filters, categories, search and the detail view are client-side UI state, so
 * nothing here carries a public slug or URL of its own.
 */

export const VAULT_PATH = '/guides/ourdream-ai-character-prompts/';

export const VAULT_GENERATORS = ['dreamy', 'vivid-1', 'vivid-2', 'vivid-3'] as const;
export type VaultGenerator = (typeof VAULT_GENERATORS)[number];

/** Labels exactly as the Figma `Vault / Model Tag` variants spell them. */
export const VAULT_GENERATOR_LABELS: Record<VaultGenerator, string> = {
  dreamy: 'Dreamy',
  'vivid-1': 'Vivid 1',
  'vivid-2': 'Vivid 2',
  'vivid-3': 'Vivid 3',
};

export type VaultPromptStatus = 'draft' | 'published';

export interface VaultResult {
  key: string;
  /** CDN path of the 4:5 card crop; null until the image batch is supplied. */
  imagePath: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  sortOrder: number;
}

export interface VaultPrompt {
  key: string;
  title: string;
  /** Verbatim — never trimmed of brackets, weights, underscores or trailing commas. */
  promptText: string;
  generator: VaultGenerator;
  categoryKey: string;
  sortOrder: number;
  /** Position in the category preview row; null = only in View all / search. */
  previewDesktop: number | null;
  previewMobile: number | null;
  results: VaultResult[];
}

export interface VaultCategory {
  key: string;
  title: string;
  shortTitle: string | null;
  description: string;
  group: string;
  groupOrder: number;
  filterKey: string;
  sortOrder: number;
  prompts: VaultPrompt[];
}

export interface VaultFilter {
  key: string;
  label: string;
  sortOrder: number;
  /** Published prompts under this chip — counts always come from the data. */
  count: number;
  categoryKeys: string[];
}

export interface VaultGroup {
  title: string;
  order: number;
  categories: VaultCategory[];
  promptCount: number;
}

export interface VaultData {
  filters: VaultFilter[];
  groups: VaultGroup[];
  categories: VaultCategory[];
  prompts: VaultPrompt[];
  totals: { prompts: number; results: number };
  /** Where the rows came from — `seed` only ever happens off Vercel. */
  source: 'instantdb' | 'seed';
}

/** Raw rows, as stored in InstantDB or in src/data/prompt-vault/seed.json. */
export interface VaultRawRows {
  filters: Array<{ key: string; label: string; sortOrder: number }>;
  categories: Array<{
    key: string;
    title: string;
    shortTitle?: string | null;
    description: string;
    group: string;
    groupOrder: number;
    filter: string;
    sortOrder: number;
  }>;
  prompts: Array<{
    key: string;
    title: string;
    promptText: string;
    generator: string;
    status?: string;
    sortOrder: number;
    previewDesktop?: number | null;
    previewMobile?: number | null;
    category: string | null;
    results: Array<{
      key: string;
      imagePath?: string | null;
      width?: number | null;
      height?: number | null;
      alt?: string | null;
      sortOrder: number;
    }>;
  }>;
}
