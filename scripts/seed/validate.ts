// Parity validation: DB score snapshots must exactly match the scores the
// site currently displays from file data, before USE_DB_CONTENT is enabled.
//
//   npm run seed:validate

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init } from '@instantdb/admin';
import schema from '../../instant.schema';

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}
loadEnv();

const appId = process.env.PUBLIC_INSTANT_APP_ID;
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
if (!appId || !adminToken) {
  console.error('Missing PUBLIC_INSTANT_APP_ID / INSTANT_APP_ADMIN_TOKEN in .env');
  process.exit(1);
}
const db = init({ appId, adminToken, schema });

async function main() {
  const { products: fileProducts } = await import('../../src/data/products');

  const { products: dbProducts } = await db.query({
    products: {
      $: { where: { status: 'published' } },
      scoreSnapshots: { testRun: {} },
    },
  });

  let failures = 0;
  let checks = 0;

  for (const fp of fileProducts) {
    const dbp = (dbProducts as any[]).find((p) => p.slug === fp.slug);
    if (!dbp) {
      console.log(`~ ${fp.slug}: not published in DB (file data will be used) — OK`);
      continue;
    }
    const snaps = (dbp.scoreSnapshots ?? []).filter((s: any) => s.testRun?.isCurrentPublished);
    const overall = snaps.find((s: any) => s.kind === 'overall')?.score;
    checks += 1;
    if (overall !== fp.overallScore) {
      console.error(`✗ ${fp.slug}: overall ${overall} != file ${fp.overallScore}`);
      failures += 1;
    }
    for (const cat of fp.categories) {
      checks += 1;
      const snap = snaps.find((s: any) => s.kind === 'category' && s.refSlug === cat.key);
      if (!snap || snap.score !== cat.score) {
        console.error(`✗ ${fp.slug}/${cat.key}: ${snap?.score} != file ${cat.score}`);
        failures += 1;
      }
      for (const sub of cat.subscores) {
        checks += 1;
        const subSlug = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const subSnap = snaps.find(
          (s: any) => s.kind === 'subscore' && s.refSlug === subSlug && s.parentSlug === cat.key,
        );
        if (!subSnap || subSnap.score !== sub.score) {
          console.error(`✗ ${fp.slug}/${cat.key}/${subSlug}: ${subSnap?.score} != file ${sub.score}`);
          failures += 1;
        }
      }
    }
    if (failures === 0) console.log(`✓ ${fp.slug}: all scores match`);
  }

  console.log(`\n${checks} checks, ${failures} failures`);
  if (failures > 0) process.exit(1);
  console.log('Parity verified — safe to set USE_DB_CONTENT=1 and rebuild.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
