import {
  VAULT_GENERATORS,
  type VaultCategory,
  type VaultData,
  type VaultFilter,
  type VaultGenerator,
  type VaultGroup,
  type VaultPrompt,
  type VaultRawRows,
} from './types';

const bySort = <T extends { sortOrder: number; key: string }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder || a.key.localeCompare(b.key);

/**
 * Validates raw rows and shapes them for the page. Throws on anything that
 * would ship a broken or misleading vault — the build must fail rather than
 * publish a thin or inconsistent page.
 */
export function assembleVault(rows: VaultRawRows, source: VaultData['source']): VaultData {
  const errors: string[] = [];
  const dupes = (label: string, keys: string[]) => {
    const seen = new Set<string>();
    for (const k of keys) {
      if (!k) errors.push(`${label}: empty key`);
      else if (seen.has(k)) errors.push(`${label}: duplicate key "${k}"`);
      seen.add(k);
    }
  };
  dupes('filter', rows.filters.map((f) => f.key));
  dupes('category', rows.categories.map((c) => c.key));
  dupes('prompt', rows.prompts.map((p) => p.key));
  dupes('result', rows.prompts.flatMap((p) => p.results.map((r) => r.key)));

  const filterKeys = new Set(rows.filters.map((f) => f.key));
  const categoryKeys = new Set(rows.categories.map((c) => c.key));
  for (const c of rows.categories) {
    if (!filterKeys.has(c.filter)) errors.push(`category "${c.key}": unknown filter "${c.filter}"`);
    if (!c.title.trim()) errors.push(`category "${c.key}": empty title`);
  }

  const published = rows.prompts.filter((p) => (p.status ?? 'published') === 'published');
  const prompts: VaultPrompt[] = [];
  for (const p of published) {
    if (!p.title.trim()) errors.push(`prompt "${p.key}": empty title`);
    if (!p.promptText.trim()) errors.push(`prompt "${p.key}": empty prompt text`);
    if (!p.category || !categoryKeys.has(p.category)) {
      errors.push(`prompt "${p.key}": missing or unknown category "${p.category}"`);
      continue;
    }
    if (!(VAULT_GENERATORS as readonly string[]).includes(p.generator)) {
      errors.push(`prompt "${p.key}": unknown generator "${p.generator}"`);
      continue;
    }
    if (p.results.length === 0) errors.push(`prompt "${p.key}": no results`);
    prompts.push({
      key: p.key,
      title: p.title,
      promptText: p.promptText,
      generator: p.generator as VaultGenerator,
      categoryKey: p.category,
      sortOrder: p.sortOrder,
      results: p.results
        .map((r) => ({
          key: r.key,
          imagePath: r.imagePath || null,
          width: r.width ?? null,
          height: r.height ?? null,
          alt: r.alt || null,
          sortOrder: r.sortOrder,
        }))
        .sort(bySort),
    });
  }
  if (prompts.length === 0) errors.push('no published prompts');

  if (errors.length) {
    throw new Error(`[prompt-vault] invalid vault data (${source}):\n  - ${errors.join('\n  - ')}`);
  }

  prompts.sort(bySort);

  // Categories with no published prompts are dropped, so the page never
  // renders an empty section header.
  const categories: VaultCategory[] = rows.categories
    .map((c) => ({
      key: c.key,
      title: c.title,
      shortTitle: c.shortTitle || null,
      description: c.description,
      group: c.group,
      groupOrder: c.groupOrder,
      filterKey: c.filter,
      sortOrder: c.sortOrder,
      prompts: prompts.filter((p) => p.categoryKey === c.key),
    }))
    .filter((c) => c.prompts.length > 0)
    .sort(bySort);

  const filters: VaultFilter[] = rows.filters
    .map((f) => {
      const cats = categories.filter((c) => c.filterKey === f.key);
      return {
        key: f.key,
        label: f.label,
        sortOrder: f.sortOrder,
        categoryKeys: cats.map((c) => c.key),
        count: cats.reduce((n, c) => n + c.prompts.length, 0),
      };
    })
    .filter((f) => f.count > 0)
    .sort(bySort);

  const groupMap = new Map<string, VaultGroup>();
  for (const c of categories) {
    const g = groupMap.get(c.group) ?? { title: c.group, order: c.groupOrder, categories: [], promptCount: 0 };
    g.categories.push(c);
    g.promptCount += c.prompts.length;
    groupMap.set(c.group, g);
  }
  const groups = [...groupMap.values()].sort((a, b) => a.order - b.order);

  // Page order: prompts in the order they appear on the page (group → category → prompt).
  const ordered = groups.flatMap((g) => g.categories.flatMap((c) => c.prompts));

  return {
    filters,
    groups,
    categories,
    prompts: ordered,
    totals: {
      prompts: ordered.length,
      results: ordered.reduce((n, p) => n + p.results.length, 0),
    },
    source,
  };
}
