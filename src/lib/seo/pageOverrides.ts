// Page status overrides: lets the admin put ANY page (hard-coded, generated,
// CMS) into draft. Stored as one JSON map in siteSettings under the key
// "pageOverrides". Drafted pages are served as 404 (middleware) and excluded
// from XML sitemaps and the URL registry's indexable set.

import { isDbConfigured, getDb, id } from '../db/server';

export interface PageOverride {
  status: 'draft';
  updatedAt: number;
  updatedBy?: string;
}

export type PageOverrides = Record<string, PageOverride>;

const SETTINGS_KEY = 'pageOverrides';
const CACHE_TTL_MS = 15_000;

let cache: { data: PageOverrides; at: number } | null = null;

import { pathMatchKey } from '../urls';

/** Consistent key: canonical trailing-slash form (except root, files, /api, /go, /admin). */
export function normalizeOverridePath(path: string): string {
  return pathMatchKey(path);
}

export async function getPageOverrides(force = false): Promise<PageOverrides> {
  if (!isDbConfigured()) return {};
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  try {
    const db = getDb();
    const result = await (db.query as any)({
      siteSettings: { $: { where: { key: SETTINGS_KEY } } },
    });
    const row = result.siteSettings?.[0];
    const raw = ((row?.value ?? {}) as PageOverrides) || {};
    // Migrate legacy keys stored without trailing slashes.
    const data: PageOverrides = {};
    for (const [k, v] of Object.entries(raw)) {
      data[pathMatchKey(k)] = v;
    }
    cache = { data, at: Date.now() };
    return data;
  } catch (error) {
    console.warn('[pageOverrides] load failed:', error);
    return cache?.data ?? {};
  }
}

/** Set of normalized paths currently drafted (for sitemap exclusion). */
export async function getDraftedPaths(): Promise<Set<string>> {
  const overrides = await getPageOverrides();
  return new Set(Object.keys(overrides));
}

export async function setPageOverride(
  path: string,
  draft: boolean,
  updatedBy?: string,
): Promise<PageOverrides> {
  const db = getDb();
  const result = await (db.query as any)({
    siteSettings: { $: { where: { key: SETTINGS_KEY } } },
  });
  const row = result.siteSettings?.[0];
  const data: PageOverrides = { ...((row?.value ?? {}) as PageOverrides) };
  const key = normalizeOverridePath(path);
  if (draft) data[key] = { status: 'draft', updatedAt: Date.now(), updatedBy };
  else delete data[key];

  const recordId = row?.id ?? id();
  await db.transact([
    (db.tx as any).siteSettings[recordId].update({
      key: SETTINGS_KEY,
      value: data,
      updatedAt: Date.now(),
      updatedBy: updatedBy ?? null,
    }),
  ]);
  cache = { data, at: Date.now() };
  return data;
}
