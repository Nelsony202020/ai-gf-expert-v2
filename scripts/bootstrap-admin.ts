// Create the owner admin account in InstantDB (run once after db:push).
//   npm run admin:bootstrap

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init, id } from '@instantdb/admin';
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

const appId = process.env.PUBLIC_INSTANT_APP_ID;
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.toLowerCase();

if (!appId || !adminToken) {
  console.error('Missing PUBLIC_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN in .env');
  process.exit(1);
}
if (!ownerEmail) {
  console.error('Missing ADMIN_OWNER_EMAIL in .env');
  process.exit(1);
}

const db = init({ appId, adminToken, schema });

const { adminUsers } = await db.query({ adminUsers: {} });
const existing = (adminUsers as any[]).find((u) => u.email?.toLowerCase() === ownerEmail);

if (existing) {
  if (existing.active === false || existing.role !== 'owner') {
    await db.transact(
      db.tx.adminUsers[existing.id].update({ active: true, role: 'owner' }),
    );
    console.log('Updated existing admin to active owner:', ownerEmail);
  } else {
    console.log('Owner already exists:', ownerEmail);
  }
} else {
  await db.transact(
    db.tx.adminUsers[id()].update({
      email: ownerEmail,
      name: ownerEmail.split('@')[0],
      role: 'owner',
      active: true,
      createdAt: Date.now(),
    }),
  );
  console.log('Created owner admin:', ownerEmail);
}

console.log('\nDone. Sign in at http://localhost:4321/admin with', ownerEmail);
