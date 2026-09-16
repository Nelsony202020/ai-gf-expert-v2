// Page status overrides: lets the admin put ANY page (hard-coded, generated,
// CMS) into draft or hide it from Google (noindex). Stored as one JSON map in
// siteSettings under the key "pageOverrides".
//
// Drafted pages are served as 404 (middleware) and excluded from sitemaps.
// Noindex pages stay live, send robots noindex, and are excluded from XML sitemaps.

import { isDbConfigured, getDb, id } from '../db/server';
import { pathMatchKey } from '../urls';

export interface PageOverride {
  status?: 'draft';
  noindex?: boolean;
  updatedAt: number;
  updatedBy?: string;
}

export type PageOverrides = Record<string, PageOverride>;

const SETTINGS_KEY = 'pageOverrides';
const CACHE_TTL_MS = 15_000;

let cache: { data: PageOverrides; at: number } | null = null;

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

/** Set of normalized paths currently drafted (404 + sitemap exclusion). */
export async function getDraftedPaths(): Promise<Set<string>> {
  const overrides = await getPageOverrides();
  return new Set(
    Object.entries(overrides)
      .filter(([, value]) => value.status === 'draft')
      .map(([path]) => path),
  );
}

function isEmptyOverride(value: PageOverride | undefined): boolean {
  if (!value) return true;
  return value.status !== 'draft' && value.noindex === undefined;
}

async function persistOverrides(data: PageOverrides, updatedBy?: string): Promise<PageOverrides> {
  const db = getDb();
  const result = await (db.query as any)({
    siteSettings: { $: { where: { key: SETTINGS_KEY } } },
  });
  const row = result.siteSettings?.[0];
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

export async function setPageOverride(
  path: string,
  draft: boolean,
  updatedBy?: string,
): Promise<PageOverrides> {
  const existing = await getPageOverrides(true);
  const data: PageOverrides = { ...existing };
  const key = normalizeOverridePath(path);
  const current = data[key] ?? { updatedAt: Date.now() };
  if (draft) {
    data[key] = { ...current, status: 'draft', updatedAt: Date.now(), updatedBy };
  } else {
    const next: PageOverride = { ...current, updatedAt: Date.now(), updatedBy };
    delete next.status;
    if (isEmptyOverride(next)) delete data[key];
    else data[key] = next;
  }
  return persistOverrides(data, updatedBy);
}

/** Persist Search visibility (noindex) for any public path via SEO → Pages. */
export async function setPageNoindex(
  path: string,
  noindex: boolean,
  updatedBy?: string,
): Promise<PageOverrides> {
  const existing = await getPageOverrides(true);
  const data: PageOverrides = { ...existing };
  const key = normalizeOverridePath(path);
  const current = data[key] ?? { updatedAt: Date.now() };
  data[key] = { ...current, noindex, updatedAt: Date.now(), updatedBy };
  return persistOverrides(data, updatedBy);
}

export function resolvePathNoindex(
  path: string,
  overrides: PageOverrides,
  defaultNoindex = false,
): boolean {
  const value = overrides[normalizeOverridePath(path)];
  if (typeof value?.noindex === 'boolean') return value.noindex;
  return defaultNoindex;
}

export async function isPathNoindex(path: string, defaultNoindex = false): Promise<boolean> {
  const overrides = await getPageOverrides();
  return resolvePathNoindex(path, overrides, defaultNoindex);
}

/** Normalized paths that should be omitted from the XML sitemap. */
export async function getNoindexPaths(defaultNoindexPaths: string[] = []): Promise<Set<string>> {
  const overrides = await getPageOverrides();
  const set = new Set(defaultNoindexPaths.map(normalizeOverridePath));
  for (const [path, value] of Object.entries(overrides)) {
    if (value.noindex === true) set.add(path);
    if (value.noindex === false) set.delete(path);
  }
  return set;
}
