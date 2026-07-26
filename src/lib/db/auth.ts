// Authentication + role-based access control for the admin panel.
// Permissions are enforced HERE (server-side), never only in the UI.

import { getDb, id } from './server';
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

/**
 * Resolve the caller's identity from an InstantDB refresh token
 * (sent by the admin panel as `Authorization: Bearer <token>`).
 *
 * Bootstrap: if the verified email matches ADMIN_OWNER_EMAIL and no adminUser
 * record exists yet, the owner account is auto-provisioned.
 */
export async function resolveIdentity(request: Request): Promise<AdminIdentity | null> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return null;

  const db = getDb();
  let user: { id?: string; email?: string } | null = null;
  try {
    user = await db.auth.verifyToken(token);
  } catch {
    user = null;
  }
  if (!user?.email) {
    try {
      user = await db.auth.getUser({ refresh_token: token });
    } catch {
      user = null;
    }
  }
  if (!user?.email) return null;
  const email = user.email.toLowerCase();

  // Query all admin users and match in memory — InstantDB `where` on email
  // can miss records depending on index state after fresh schema pushes.
  let adminUsers: any[] = [];
  try {
    const res = await (db.query as any)({ adminUsers: {} });
    adminUsers = res.adminUsers ?? [];
  } catch {
    adminUsers = [];
  }
  let admin = (adminUsers as any[]).find((u) => String(u.email ?? '').toLowerCase() === email);

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
        await db.transact(
          db.tx.adminUsers[newId].update({
            email,
            name: email.split('@')[0],
            role: 'owner',
            active: true,
            createdAt: Date.now(),
          }),
        );
      }
      admin = { id: newId, email, name: email.split('@')[0], role: 'owner', active: true } as any;
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
