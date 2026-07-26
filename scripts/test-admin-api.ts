// Quick smoke test for admin data APIs (run: npx tsx scripts/test-admin-api.ts)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init } from '@instantdb/admin';
import schema from '../instant.schema';

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* optional */
  }
}
loadEnv();

const appId = process.env.PUBLIC_INSTANT_APP_ID!;
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN!;
const db = init({ appId, adminToken, schema });

const entities = [
  'products',
  'media',
  'testRuns',
  'subscriptionPlans',
  'creditPackages',
  'paymentProfiles',
  'characters',
  'affiliateLinks',
  'reviews',
  'categories',
  'redirects',
  'evidenceResults',
];

async function main() {
  for (const entity of entities) {
    try {
      const result = await db.query({ [entity]: {} } as any);
      const rows = (result as any)[entity] as unknown[];
      console.log(`OK ${entity}: ${rows?.length ?? 0} rows`);
    } catch (e) {
      console.error(`FAIL ${entity}:`, e instanceof Error ? e.message : e);
    }
  }
}

main().catch(console.error);
