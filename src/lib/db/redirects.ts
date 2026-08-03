// Centralized redirect logic: validation (loops, chains, duplicates,
// missing destinations) and automatic 301 creation on slug changes.

import { getDb, id as newId } from './server';
import { HttpError, type AdminIdentity } from './auth';
import { auditTx } from './audit';
import { pathMatchKey, publicPagePath } from '../urls';

export function normalizePath(path: string): string {
  return pathMatchKey(path);
}

/** Normalize redirect destination — preserves #hash and ?query on internal paths. */
export function normalizeRedirectDestination(path: string): string {
  if (!path || path === '—' || path === '-') return '';
  if (/^https?:\/\//.test(path)) return path;
  return publicPagePath(path);
}

export interface RedirectValidation {
  errors: string[];
  warnings: string[];
}

/**
 * Validate a proposed redirect against the existing table.
 * - duplicate source (error — also DB-enforced unique)
 * - self redirect / loop through existing chain (error)
 * - chains (warning)
 * - destination that is itself redirected (warning)
 */
export async function validateRedirect(
  sourcePath: string,
  destinationPath: string,
  excludeId?: string,
  redirectType: number = 301,
): Promise<RedirectValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const source = normalizePath(sourcePath);
  const is410 = redirectType === 410;

  if (is410) {
    const db = getDb();
    const { redirects } = await db.query({ redirects: {} });
    const active = redirects.filter((r: any) => r.active && r.id !== excludeId);
    const bySource = new Map<string, any>(active.map((r: any) => [normalizePath(r.sourcePath), r]));
    if (bySource.has(source)) {
      errors.push(`A redirect from "${source}" already exists.`);
    }
    return { errors, warnings };
  }

  const isExternal = /^https?:\/\//.test(destinationPath);
  const dest = isExternal ? destinationPath : normalizeRedirectDestination(destinationPath);
  const destPathKey = isExternal ? dest : normalizePath(dest);

  if (!isExternal && source === dest) {
    errors.push('Source and destination are identical (self-redirect).');
    return { errors, warnings };
  }

  const db = getDb();
  const { redirects } = await db.query({ redirects: {} });
  const active = redirects.filter((r: any) => r.active && r.id !== excludeId);
  const bySource = new Map<string, any>(active.map((r: any) => [normalizePath(r.sourcePath), r]));

  if (bySource.has(source)) {
    errors.push(`A redirect from "${source}" already exists.`);
  }

  if (!isExternal) {
    // Follow the chain from dest; if we ever come back to source -> loop.
    const seen = new Set<string>([source]);
    let cursor = destPathKey;
    let hops = 0;
    while (bySource.has(cursor)) {
      const next = bySource.get(cursor)!;
      if (next.redirectType === 410) break;
      const nextDest = /^https?:\/\//.test(next.destinationPath)
        ? null
        : normalizePath(next.destinationPath);
      hops += 1;
      if (nextDest === null) break;
      if (seen.has(nextDest)) {
        errors.push(`This redirect would create a loop via "${cursor}".`);
        return { errors, warnings };
      }
      seen.add(nextDest);
      cursor = nextDest;
      if (hops > 10) {
        errors.push('Redirect chain exceeds 10 hops.');
        return { errors, warnings };
      }
    }
    if (hops > 0) {
      warnings.push(
        `Destination "${destPathKey}" is itself redirected (${hops} hop${hops > 1 ? 's' : ''}). Consider pointing directly at the final URL.`,
      );
    }

    // Does the destination exist as content?
    const exists = await destinationExists(cursor);
    if (!exists) {
      warnings.push(`Destination "${destPathKey}" does not match any known page or record slug.`);
    }
  }

  return { errors, warnings };
}

/** Known static routes that always exist. */
const STATIC_PATHS = new Set(
  [
    '/',
    '/ai-girlfriend-apps/',
    '/about/',
    '/contact/',
    '/sitemap/',
    '/reviews/',
    '/legal/',
    '/editorial-guidelines/',
    '/test/',
    '/test/all/',
    '/test/tooltips/',
    '/test/market-data/',
    '/best/ai-girlfriend/',
    '/legal/terms/',
    '/legal/privacy/',
    '/legal/accessibility/',
    '/legal/affiliate-disclosure/',
    '/legal/copyright/',
    '/legal/disclaimer/',
  ].map(normalizePath),
);

async function destinationExists(path: string): Promise<boolean> {
  const p = normalizePath(path);
  if (STATIC_PATHS.has(p)) return true;
  if (p.startsWith('/test/')) return true; // methodology tree is file-driven
  if (p.startsWith('/legal/')) return true;

  const db = getDb();
  const reviewMatch = p.match(/^\/reviews\/([a-z0-9-]+)\/$/);
  if (reviewMatch) {
    const { products } = await db.query({
      products: { $: { where: { slug: reviewMatch[1] } } },
    });
    return products.length > 0;
  }
  const bestMatch = p.match(/^\/best\/([a-z0-9-]+)\/$/);
  if (bestMatch) {
    const { roundups } = await db.query({
      roundups: { $: { where: { slug: bestMatch[1] } } },
    });
    return roundups.length > 0;
  }
  const goMatch = p.match(/^\/go\/([a-z0-9-]+)$/);
  if (goMatch) {
    const { affiliateLinks } = await db.query({
      affiliateLinks: { $: { where: { cloakedSlug: goMatch[1] } } },
    });
    return affiliateLinks.length > 0;
  }
  const guideMatch = p.match(/^\/guides\/([a-z0-9-]+)\/$/);
  if (guideMatch) return true; // owned by Sanity; verified at build time

  return false;
}

/** Create a 301 redirect (used by slug-change flows). */
export async function createSlugChangeRedirect(
  oldPath: string,
  newPath: string,
  identity: AdminIdentity,
): Promise<{ created: boolean; warnings: string[] }> {
  const source = normalizePath(oldPath);
  const dest = normalizeRedirectDestination(newPath);
  const { errors, warnings } = await validateRedirect(source, dest, undefined, 301);
  if (errors.length > 0) {
    throw new HttpError(409, `Cannot create redirect: ${errors.join(' ')}`);
  }
  const db = getDb();
  const redirectId = newId();
  await db.transact([
    db.tx.redirects[redirectId].update({
      sourcePath: source,
      destinationPath: dest,
      redirectType: 301,
      active: true,
      createdBy: identity.email,
      notes: 'Auto-created on slug change',
      hitCount: 0,
      createdAt: Date.now(),
    }),
    auditTx({
      actorEmail: identity.email,
      action: 'slug_change',
      recordType: 'redirects',
      recordId: redirectId,
      newValue: { sourcePath: source, destinationPath: dest, redirectType: 301 },
    }),
  ]);
  return { created: true, warnings };
}

/** Look up an active redirect for a request path (used by the catch-all route). */
export async function findRedirect(
  path: string,
): Promise<{ destinationPath: string; redirectType: number; id: string } | null> {
  const db = getDb();
  const source = normalizePath(path);
  const { redirects } = await db.query({
    redirects: { $: { where: { active: true } } },
  });
  const bySource = new Map<string, (typeof redirects)[0]>(
    redirects.map((r: any) => [normalizePath(r.sourcePath), r]),
  );
  const hit = bySource.get(source);
  if (!hit) return null;
  const type = hit.redirectType ?? 301;
  return {
    destinationPath: type === 410 ? '' : hit.destinationPath,
    redirectType: type,
    id: hit.id,
  };
}

/** Fire-and-forget hit counter. */
export async function recordRedirectHit(redirectId: string, current?: number): Promise<void> {
  try {
    const db = getDb();
    if (current === undefined) {
      const { redirects } = await db.query({
        redirects: { $: { where: { id: redirectId } } },
      });
      current = (redirects[0]?.hitCount as number | undefined) ?? 0;
    }
    await db.transact(db.tx.redirects[redirectId].update({ hitCount: (current ?? 0) + 1 }));
  } catch {
    // never fail a redirect because of stats
  }
}
