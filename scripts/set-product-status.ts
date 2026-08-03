#!/usr/bin/env npx tsx
/**
 * Set a product's publish status in InstantDB.
 *
 * Usage:
 *   npx tsx scripts/set-product-status.ts aura-ai draft
 *   npx tsx scripts/set-product-status.ts candy-ai published
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init, tx } from '@instantdb/admin';

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
  const slug = process.argv[2];
  const status = process.argv[3];
  if (!slug || (status !== 'draft' && status !== 'published')) {
    console.error('Usage: npx tsx scripts/set-product-status.ts <slug> <draft|published>');
    process.exit(1);
  }

  const env = loadEnv();
  const appId = env.PUBLIC_INSTANT_APP_ID ?? process.env.PUBLIC_INSTANT_APP_ID;
  const adminToken = env.INSTANT_APP_ADMIN_TOKEN ?? process.env.INSTANT_APP_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    console.error('Missing PUBLIC_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN in .env');
    process.exit(1);
  }

  const db = init({ appId, adminToken });
  const { products } = await db.query({
    products: { $: { where: { slug } } },
  });
  const product = (products as any[])?.find((p) => !p.deletedAt);
  if (!product) {
    console.error(`No product found for slug: ${slug}`);
    process.exit(1);
  }

  await db.transact(tx.products[product.id].update({ status }));
  console.log(`Updated ${slug} (${product.id}) → status=${status}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
