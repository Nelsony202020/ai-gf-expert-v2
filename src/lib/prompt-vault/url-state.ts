/**
 * Prompt Vault URL state — ?category= and ?q= are UI state on ONE page.
 *
 * The HTML is identical for every query string (the page is prerendered and
 * its canonical is always the clean vault URL), so no query string can ever
 * produce a different or thinner indexable document. This module only decides
 * what the client shows, and normalises the address bar:
 *   - an unknown ?category= is dropped (the vault shows All),
 *   - an empty ?q= is dropped,
 *   - any other param (utm_*, gclid …) is left exactly as it arrived.
 */

export interface VaultUrlState {
  /** A filter chip key (face, hair …) or a category key (hair-style-prompts …); null = All. */
  category: string | null;
  /** Trimmed search text; '' = no search. */
  q: string;
}

export const EMPTY_STATE: VaultUrlState = { category: null, q: '' };

const MAX_Q = 80;

export function parseVaultState(search: string, knownCategories: ReadonlySet<string>): VaultUrlState {
  const params = new URLSearchParams(search);
  const rawCat = (params.get('category') ?? '').trim().toLowerCase();
  const q = (params.get('q') ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_Q);
  return { category: rawCat && knownCategories.has(rawCat) ? rawCat : null, q };
}

/**
 * Query string (with leading '?', or '') for a state. `currentSearch` supplies
 * foreign params to keep; vault params always come first, in a stable order.
 */
export function serializeVaultState(state: VaultUrlState, currentSearch = ''): string {
  const params = new URLSearchParams();
  if (state.category) params.set('category', state.category);
  if (state.q) params.set('q', state.q);
  for (const [k, v] of new URLSearchParams(currentSearch)) {
    if (k !== 'category' && k !== 'q') params.append(k, v);
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function sameVaultState(a: VaultUrlState, b: VaultUrlState): boolean {
  return a.category === b.category && a.q === b.q;
}

/** Case- and whitespace-insensitive text match used by search. */
export function normaliseForSearch(text: string): string {
  return text.toLowerCase().replace(/[_\s]+/g, ' ').trim();
}
