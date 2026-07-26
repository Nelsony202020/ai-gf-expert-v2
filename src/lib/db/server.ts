// Server-side InstantDB client (admin SDK). This is the ONLY module that may
// talk to InstantDB directly — all reads/writes flow through src/lib/db/*.

import { init, id, lookup, tx, type InstantAdminDatabase } from '@instantdb/admin';
import schema, { type AppSchema } from '../../../instant.schema';
import { env } from '../env';

export type AdminDb = InstantAdminDatabase<AppSchema>;

let _db: AdminDb | null = null;

export function isDbConfigured(): boolean {
  return Boolean(env('PUBLIC_INSTANT_APP_ID') && env('INSTANT_APP_ADMIN_TOKEN'));
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
  _db = init({ appId, adminToken, schema });
  return _db;
}

export { id, lookup, tx };
