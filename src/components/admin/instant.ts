// Browser InstantDB client — used ONLY for magic-code authentication.
// All data reads/writes go through /api/admin/* (server-enforced RBAC).
//
// Uses @instantdb/core (not @instantdb/react) so Astro's React island does not
// load two React copies via InstantDB's internal hooks.

import { init, type InstantCoreDatabase } from '@instantdb/core';
import schema, { type AppSchema } from '../../../instant.schema';

export type ClientDb = InstantCoreDatabase<AppSchema>;

let db: ClientDb | null = null;

export function getClientDb(appId: string): ClientDb {
  if (typeof window === 'undefined') {
    throw new Error('getClientDb() is browser-only');
  }
  if (!db) db = init({ appId, schema });
  return db;
}
