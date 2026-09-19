// Server-side InstantDB client (admin SDK). This is the ONLY module that may
// talk to InstantDB directly — all reads/writes flow through src/lib/db/*.

import { init, id, lookup, tx, type InstantAdminDatabase } from '@instantdb/admin';
import schema, { type AppSchema } from '../../../instant.schema';
import { env } from '../env';

export type AdminDb = InstantAdminDatabase<AppSchema>;

let _db: AdminDb | null = null;

export function resetDb(): void {
  _db = null;
}

export function isDbConfigured(): boolean {
  return Boolean(env('PUBLIC_INSTANT_APP_ID') && env('INSTANT_APP_ADMIN_TOKEN'));
}

/*
 * Read resilience.
 *
 * InstantDB's admin API is token-bucket rate limited, and one SSR review page
 * fans out dozens of reads (every tab loads its own slice). Under any real
 * concurrency the bucket empties and reads start failing with 429
 * `{ type: 'rate-limited', hint: { 'retry-after': 1, 'remaining-tokens': 0 } }`.
 *
 * Every caller in this codebase catches its own read failure and degrades to a
 * placeholder, so a 429 surfaced as "Plan details are still being verified"
 * rather than an error — the pricing tab rendered its empty shell on roughly
 * six of every seven production requests.
 *
 * Three things fix that, all here so every read gets them:
 *   1. A concurrency gate, so a single page render cannot empty the bucket.
 *   2. Retry on 429, honouring the server's own retry-after.
 *   3. In-flight + very short TTL dedupe, so the identical query issued by four
 *      tabs of the same page costs one request. The TTL is deliberately shorter
 *      than a page render so an admin edit still shows up on the next load.
 */
const MAX_CONCURRENT_QUERIES = 4;
const QUERY_ATTEMPTS = 4;
const RETRY_FLOOR_MS = 120;
const RETRY_CEILING_MS = 2_000;
const DEDUPE_TTL_MS = 1_000;

let inFlight = 0;
const waiting: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (inFlight < MAX_CONCURRENT_QUERIES) {
    inFlight += 1;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  inFlight += 1;
}

function releaseSlot(): void {
  inFlight -= 1;
  const next = waiting.shift();
  if (next) next();
}

function isRateLimited(error: unknown): boolean {
  const e = error as { status?: number; body?: { type?: string } } | null;
  return e?.status === 429 || e?.body?.type === 'rate-limited';
}

/** The server tells us when the bucket refills; prefer that over guessing. */
function retryDelayMs(error: unknown, attempt: number): number {
  const e = error as { hint?: Record<string, unknown>; body?: { hint?: Record<string, unknown> } };
  const raw = e?.hint?.['retry-after'] ?? e?.body?.hint?.['retry-after'];
  const seconds = Number(raw);
  const fromServer = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
  const backoff = RETRY_FLOOR_MS * 2 ** attempt;
  return Math.min(Math.max(fromServer, backoff), RETRY_CEILING_MS);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type CacheEntry = { at: number; promise: Promise<unknown> };
const queryCache = new Map<string, CacheEntry>();

function cacheKey(query: unknown): string | null {
  try {
    return JSON.stringify(query);
  } catch {
    return null;
  }
}

async function runQuery(raw: (q: unknown) => Promise<unknown>, query: unknown): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < QUERY_ATTEMPTS; attempt += 1) {
    await acquireSlot();
    try {
      return await raw(query);
    } catch (error) {
      lastError = error;
      if (!isRateLimited(error) || attempt === QUERY_ATTEMPTS - 1) throw error;
    } finally {
      releaseSlot();
    }
    await sleep(retryDelayMs(lastError, attempt));
  }
  throw lastError;
}

function withResilientQuery(db: AdminDb): AdminDb {
  const raw = (db.query as unknown as (q: unknown) => Promise<unknown>).bind(db);
  (db as unknown as { query: (q: unknown) => Promise<unknown> }).query = (query: unknown) => {
    const key = cacheKey(query);
    if (key) {
      const hit = queryCache.get(key);
      if (hit && Date.now() - hit.at < DEDUPE_TTL_MS) return hit.promise;
    }
    const promise = runQuery(raw, query);
    if (key) {
      queryCache.set(key, { at: Date.now(), promise });
      // A failed read must not be served to the next caller from the cache.
      promise.catch(() => queryCache.delete(key));
      if (queryCache.size > 200) {
        const cutoff = Date.now() - DEDUPE_TTL_MS;
        for (const [k, v] of queryCache) if (v.at < cutoff) queryCache.delete(k);
      }
    }
    return promise;
  };
  return db;
}

export function getDb(): AdminDb {
  if (_db) return _db;
  const appId = env('PUBLIC_INSTANT_APP_ID');
  const adminToken = env('INSTANT_APP_ADMIN_TOKEN');
  if (!appId || !adminToken) {
    throw new Error(
      'InstantDB is not configured. Set PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN in .env',
    );
  }
  _db = withResilientQuery(init({ appId, adminToken, schema }));
  return _db;
}

export { id, lookup, tx };
