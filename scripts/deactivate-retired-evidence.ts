#!/usr/bin/env npx tsx
/**
 * Deactivate evidence definitions removed from the testing workflow.
 *
 * Usage: npx tsx scripts/deactivate-retired-evidence.ts
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init } from '@instantdb/admin';

const RETIRED_EVIDENCE = [{ category: 'pricing', slug: 'restrictions' }] as const;

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
  } catch {
    /* optional */
  }
  return out;
}

async function main() {
  const env = loadEnv();
  const appId = env.PUBLIC_INSTANT_APP_ID ?? process.env.PUBLIC_INSTANT_APP_ID;
  const adminToken = env.INSTANT_APP_ADMIN_TOKEN ?? process.env.INSTANT_APP_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    console.error('Missing PUBLIC_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN in .env');
    process.exit(1);
  }

  const db = init({ appId, adminToken });
  const { evidenceDefinitions } = await db.query({
    evidenceDefinitions: { subscore: { category: {} } },
  });

  const txs: ReturnType<typeof db.tx.evidenceDefinitions[string]['update']>[] = [];
  for (const def of evidenceDefinitions as any[]) {
    const catSlug = def.subscore?.category?.slug;
    if (
      RETIRED_EVIDENCE.some((r) => r.slug === def.slug && r.category === catSlug) &&
      def.active !== false
    ) {
      txs.push(db.tx.evidenceDefinitions[def.id].update({ active: false }));
      console.log(`Deactivating ${catSlug}/${def.slug} (${def.name})`);
    }
  }

  if (txs.length === 0) {
    console.log('No active retired evidence definitions found.');
    return;
  }

  await db.transact(txs);
  console.log(`Done — deactivated ${txs.length} evidence definition(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
