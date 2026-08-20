/**
 * Versioned client-side persistence for directory preferences.
 * Stored in localStorage under a versioned key; invalid or outdated
 * payloads are ignored instead of crashing. Never touches the URL.
 */

export const DIRECTORY_PREFS_KEY = 'ai-girlfriend-directory-preferences:v3';
export const DIRECTORY_PREFS_VERSION = 3;

export type DirectoryView = 'list' | 'cards';

export interface HomepageFinderPreferences {
  /** Selected quick-choice id (e.g. "images-video"), if any. */
  choice: string | null;
  /** Selected "what matters most" factor (e.g. "chat"), if any. */
  priority: string | null;
}

export interface DirectoryPreferences {
  version: number;
  view: DirectoryView;
  /** @deprecated v1 — ignored in v2 */
  filters: string[];
  /** @deprecated v1 — ignored in v2 */
  payments: string[];
  minRating: string;
  /** @deprecated v1 — use priceBucket in v2 */
  priceMin: number | null;
  /** @deprecated v1 — use priceBucket in v2 */
  priceMax: number | null;
  /** Single price bucket id, e.g. budget-under-15 */
  priceBucket: string | null;
  /** Single best-at category id, e.g. chat */
  bestAt: string | null;
  sort: string;
  /** null = default editorial order (not personalized). */
  priorities: string[] | null;
  saved: string[];
  homepage: HomepageFinderPreferences | null;
}

export function defaultDirectoryPreferences(): DirectoryPreferences {
  return {
    version: DIRECTORY_PREFS_VERSION,
    // List is the default layout — first paint matches restored prefs (no cards→list flash).
    view: 'list',
    filters: [],
    payments: [],
    minRating: 'rating-any',
    priceMin: null,
    priceMax: null,
    priceBucket: null,
    bestAt: null,
    sort: 'overall',
    priorities: null,
    saved: [],
    homepage: null,
  };
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function loadDirectoryPreferences(): DirectoryPreferences {
  const defaults = defaultDirectoryPreferences();
  try {
    const raw = localStorage.getItem(DIRECTORY_PREFS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<DirectoryPreferences> | null;
    if (!parsed || typeof parsed !== 'object') {
      return defaults;
    }
    if (parsed.version !== DIRECTORY_PREFS_VERSION) {
      return defaults;
    }
    const homepage =
      parsed.homepage && typeof parsed.homepage === 'object'
        ? {
            choice: typeof parsed.homepage.choice === 'string' ? parsed.homepage.choice : null,
            priority: typeof parsed.homepage.priority === 'string' ? parsed.homepage.priority : null,
          }
        : null;
    return {
      version: DIRECTORY_PREFS_VERSION,
      view: parsed.view === 'list' || parsed.view === 'cards' ? parsed.view : defaults.view,
      filters: sanitizeStringArray(parsed.filters),
      payments: sanitizeStringArray(parsed.payments),
      minRating: typeof parsed.minRating === 'string' ? parsed.minRating : defaults.minRating,
      priceMin: null,
      priceMax: null,
      priceBucket: typeof parsed.priceBucket === 'string' ? parsed.priceBucket : null,
      bestAt: typeof parsed.bestAt === 'string' ? parsed.bestAt : null,
      sort: typeof parsed.sort === 'string' ? parsed.sort : defaults.sort,
      priorities: Array.isArray(parsed.priorities) ? sanitizeStringArray(parsed.priorities) : null,
      saved: sanitizeStringArray(parsed.saved),
      homepage,
    };
  } catch {
    return defaults;
  }
}

export function saveDirectoryPreferences(patch: Partial<DirectoryPreferences>): DirectoryPreferences {
  const next = { ...loadDirectoryPreferences(), ...patch, version: DIRECTORY_PREFS_VERSION };
  try {
    localStorage.setItem(DIRECTORY_PREFS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode etc.) — keep working in-memory */
  }
  return next;
}

export function clearDirectoryPreferences(): void {
  try {
    localStorage.removeItem(DIRECTORY_PREFS_KEY);
  } catch {
    /* noop */
  }
}
