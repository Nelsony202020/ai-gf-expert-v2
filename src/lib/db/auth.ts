// Authentication + role-based access control for the admin panel.
// Permissions are enforced HERE (server-side), never only in the UI.

import { getDb, id, resetDb } from './server';
import { env } from '../env';

export type Role =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'contributor'
  | 'tester'
  | 'fact_checker'
  | 'viewer';

export interface AdminIdentity {
  adminUserId: string;
  email: string;
  name: string;
  role: Role;
}

// Granular permissions. Add new keys here as modules grow.
export type Permission =
  | 'content.view'
  | 'content.edit' // products, reviews, roundups, characters, media, homepage
  | 'content.publish'
  | 'testing.edit' // test runs + evidence results
  | 'testing.review' // fact-check / approve test runs
  | 'methodology.edit' // categories, subscores, evidence definitions, versions, formulas
  | 'seo.edit'
  | 'affiliates.edit'
  | 'redirects.edit'
  | 'homepage.edit'
  | 'users.manage'
  | 'settings.manage'
  | 'audit.view'
  | 'records.delete'; // soft delete / restore; permanent deletion is owner-only in code

const ALL: Permission[] = [
  'content.view',
  'content.edit',
  'content.publish',
  'testing.edit',
  'testing.review',
  'methodology.edit',
  'seo.edit',
  'affiliates.edit',
  'redirects.edit',
  'homepage.edit',
  'users.manage',
  'settings.manage',
  'audit.view',
  'records.delete',
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ALL,
  admin: ALL,
  editor: [
    'content.view',
    'content.edit',
    'content.publish',
    'seo.edit',
    'redirects.edit',
    'homepage.edit',
    'audit.view',
  ],
  /** Content + testing, no delete, homepage, redirects, affiliates, or publish. */
  contributor: ['content.view', 'content.edit', 'testing.edit'],
  tester: ['content.view', 'testing.edit'],
  fact_checker: ['content.view', 'testing.review', 'audit.view'],
  viewer: ['content.view'],
};

export function roleHas(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

function isNetworkError(message: string): boolean {
  return /ENOTFOUND|ECONNREFUSED|fetch failed|getaddrinfo|ETIMEDOUT|ECONNRESET/i.test(message);
}

async function withInstantRetry<T>(fn: (db: ReturnType<typeof getDb>) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fn(getDb());
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!isNetworkError(message) || attempt === 1) throw err;
      resetDb();
    }
  }
  throw lastError;
}

/**
 * Resolve the caller's identity from an InstantDB refresh token
 * (sent by the admin panel as `Authorization: Bearer <token>`).
 *
 * Bootstrap: if the verified email matches ADMIN_OWNER_EMAIL and no adminUser
 * record exists yet, the owner account is auto-provisioned.
 */
const IDENTITY_CACHE_MS = 60_000;
const identityCache = new Map<string, { identity: AdminIdentity; expiresAt: number }>();

function cacheKeyForToken(token: string): string {
  return token.slice(-24);
}

export async function resolveIdentity(request: Request): Promise<AdminIdentity | null> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return null;

  const cacheKey = cacheKeyForToken(token);
  const cached = identityCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.identity;
  }

  const identity = await resolveIdentityUncached(token);
  if (identity) {
    identityCache.set(cacheKey, { identity, expiresAt: Date.now() + IDENTITY_CACHE_MS });
  }
  return identity;
}

async function resolveIdentityUncached(token: string): Promise<AdminIdentity | null> {
  let db;
  try {
    db = getDb();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'InstantDB is not configured';
    throw new HttpError(
      503,
      `${message}. Set PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN in .env, then restart the dev server.`,
    );
  }

  let user: { id?: string; email?: string } | null = null;
  let authError: string | null = null;
  try {
    user = await withInstantRetry((activeDb) => activeDb.auth.verifyToken(token));
  } catch (err) {
    authError = err instanceof Error ? err.message : 'verifyToken failed';
    user = null;
  }
  if (!user?.email) {
    try {
      const byRefresh = await withInstantRetry((activeDb) =>
        activeDb.auth.getUser({ refresh_token: token }),
      );
      if (byRefresh?.email) user = byRefresh;
    } catch (err) {
      authError = err instanceof Error ? err.message : authError ?? 'getUser failed';
      user = null;
    }
  }
  if (!user?.email) {
    if (authError && isNetworkError(authError)) {
      throw new HttpError(
        503,
        'Cannot reach InstantDB from the dev server. Check your internet connection and restart `npm run dev`.',
      );
    }
    return null;
  }
  const email = user.email.toLowerCase();

  async function findAdminByEmail(): Promise<any | null> {
    try {
      const res = await withInstantRetry((activeDb) => (activeDb.query as any)({ adminUsers: {} }));
      const list = (res.adminUsers ?? []) as any[];
      return list.find((u) => String(u.email ?? '').toLowerCase() === email) ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'adminUsers query failed';
      if (isNetworkError(message)) {
        throw new HttpError(
          503,
          'Cannot reach InstantDB from the dev server. Check your internet connection and restart `npm run dev`.',
        );
      }
      console.warn('[auth] adminUsers query failed:', err);
      return null;
    }
  }

  let admin = await findAdminByEmail();

  if (!admin) {
    const ownerEmail = (env('ADMIN_OWNER_EMAIL') ?? '').trim().toLowerCase();
    if (ownerEmail && email === ownerEmail) {
      const newId = id();
      try {
        await db.transact(
          db.tx.adminUsers[newId]
            .update({
              email,
              name: email.split('@')[0],
              role: 'owner',
              active: true,
              createdAt: Date.now(),
            })
            .link({ user: user.id }),
        );
      } catch {
        try {
          await db.transact(
            db.tx.adminUsers[newId].update({
              email,
              name: email.split('@')[0],
              role: 'owner',
              active: true,
              createdAt: Date.now(),
            }),
          );
        } catch {
          /* may already exist — re-query below */
        }
      }
      admin = (await findAdminByEmail()) ?? {
        id: newId,
        email,
        name: email.split('@')[0],
        role: 'owner',
        active: true,
      };
    } else {
      return null;
    }
  }

  if (admin.active === false) return null;

  return {
    adminUserId: admin.id,
    email: String(admin.email).toLowerCase(),
    name: admin.name,
    role: admin.role as Role,
  };
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireIdentity(request: Request): Promise<AdminIdentity> {
  const identity = await resolveIdentity(request);
  if (!identity) throw new HttpError(401, 'Not authenticated');
  return identity;
}

export async function requirePermission(
  request: Request,
  permission: Permission,
): Promise<AdminIdentity> {
  const identity = await requireIdentity(request);
  if (!roleHas(identity.role, permission)) {
    throw new HttpError(403, `Missing permission: ${permission}`);
  }
  return identity;
}
