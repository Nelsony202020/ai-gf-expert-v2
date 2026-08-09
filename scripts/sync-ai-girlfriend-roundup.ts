#!/usr/bin/env npx tsx
/**
 * Sync /best/ai-girlfriend roundup entries to the three launch products.
 *
 * Usage:
 *   npx tsx scripts/sync-ai-girlfriend-roundup.ts
 *   npx tsx scripts/sync-ai-girlfriend-roundup.ts --dry-run
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init, id as newId } from '@instantdb/admin';

const ROUNDUP_SLUG = 'ai-girlfriend';

const LAUNCH_PICKS = [
  { slug: 'candy-ai', position: 1, awardLabel: 'Best Overall' },
  { slug: 'ourdream-ai', position: 2, awardLabel: 'Best for Media' },
  { slug: 'girlfriendgpt', position: 3, awardLabel: 'Best for Roleplay' },
] as const;

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const env = loadEnv();
  if (!env.INSTANT_APP_ADMIN_TOKEN) {
    console.error('INSTANT_APP_ADMIN_TOKEN missing from .env');
    process.exit(1);
  }

  const db = init({
    appId: env.PUBLIC_INSTANT_APP_ID,
    adminToken: env.INSTANT_APP_ADMIN_TOKEN,
  });

  const now = Date.now();
  const { roundups, products } = await db.query({
    roundups: { $: { where: { slug: ROUNDUP_SLUG } }, entries: { product: {} } },
    products: { $: { where: {} } },
  });

  const roundup = roundups.find((r: any) => !r.deletedAt);
  if (!roundup) {
    console.error(`No roundup with slug "${ROUNDUP_SLUG}" found.`);
    process.exit(1);
  }

  const productBySlug = new Map<string, any>();
  for (const p of products) {
    if (!p.deletedAt && p.slug) productBySlug.set(String(p.slug), p);
  }

  for (const pick of LAUNCH_PICKS) {
    if (!productBySlug.has(pick.slug)) {
      console.error(`Missing published product in DB: ${pick.slug}`);
      process.exit(1);
    }
  }

  const wantedSlugs = new Set(LAUNCH_PICKS.map((p) => p.slug));
  const txs: any[] = [];
  const existingBySlug = new Map<string, any>();

  for (const entry of roundup.entries ?? []) {
    const slug = entry.product?.slug ? String(entry.product.slug) : null;
    if (slug) existingBySlug.set(slug, entry);

    if (!slug || !wantedSlugs.has(slug)) {
      console.log(dryRun ? '[dry-run] exclude entry' : 'exclude entry', entry.id, slug ?? '(no product)');
      if (!dryRun) {
        txs.push(
          db.tx.roundupEntries[entry.id].update({
            included: false,
            updatedAt: now,
          }),
        );
      }
    }
  }

  for (const pick of LAUNCH_PICKS) {
    const product = productBySlug.get(pick.slug)!;
    const existing = existingBySlug.get(pick.slug);
    const payload = {
      calculatedPosition: pick.position,
      publishedPosition: pick.position,
      awardLabel: pick.awardLabel,
      included: true,
      editorialOverride: true,
      updatedAt: now,
    };

    if (existing) {
      console.log(dryRun ? '[dry-run] update entry' : 'update entry', pick.slug, '→', pick.position);
      if (!dryRun) {
        txs.push(
          db.tx.roundupEntries[existing.id]
            .update(payload)
            .link({ roundup: roundup.id, product: product.id }),
        );
      }
    } else {
      const entryId = newId();
      console.log(dryRun ? '[dry-run] create entry' : 'create entry', pick.slug, '→', pick.position);
      if (!dryRun) {
        txs.push(
          db.tx.roundupEntries[entryId]
            .update(payload)
            .link({ roundup: roundup.id, product: product.id }),
        );
      }
    }
  }

  if (dryRun) {
    console.log('\nDry run complete — no changes written.');
    return;
  }

  if (txs.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  await db.transact(txs);
  console.log(`\nDone — synced ${LAUNCH_PICKS.length} picks on roundup "${ROUNDUP_SLUG}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
