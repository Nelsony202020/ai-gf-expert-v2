#!/usr/bin/env npx tsx
/**
 * Backfill review article images to 12px corner radius, and set JuicyChat AI
 * heading levels: main sections → H2, #1/#2/#3 under Chat → H3.
 *
 * Usage: npx tsx scripts/backfill-review-image-radius-and-juicychat-headings.ts
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init, tx } from '@instantdb/admin';

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

const DEFAULT_RADIUS = 12;

const JUICYCHAT_H2 = new Set([
  'First Impressions',
  'Meeting the AI Girlfriends',
  'Chat and NSFW Roleplay',
  'Images, Videos and Voice',
  'What It Really Costs',
  'My Final Take',
]);

const JUICYCHAT_H3 = new Set([
  '#1 Immersive Start',
  '#2 Customize Every Chat',
  '#3 Branch Out',
]);

type Block = { id?: string; type: string; data?: Record<string, unknown> };

function patchImageRadius(block: Block): { block: Block; changed: boolean } {
  if (block.type === 'image') {
    const data = { ...(block.data ?? {}) };
    const current = data.borderRadiusPercent;
    if (current === DEFAULT_RADIUS) return { block, changed: false };
    // Skip intentional circle crops
    if (Number(current) >= 100) return { block, changed: false };
    data.borderRadiusPercent = DEFAULT_RADIUS;
    return { block: { ...block, data }, changed: true };
  }

  if (block.type === 'imageRow' || (block.type === 'paragraph' && Array.isArray(block.data?.items))) {
    // image rows stored as custom structures — check layout items if present
  }

  const items = block.data?.items;
  if (Array.isArray(items) && items.some((it) => it && typeof it === 'object' && 'src' in (it as object))) {
    let changed = false;
    const nextItems = items.map((raw) => {
      if (!raw || typeof raw !== 'object') return raw;
      const item = { ...(raw as Record<string, unknown>) };
      if (!('src' in item) && !('mediaId' in item)) return raw;
      if (Number(item.borderRadiusPercent) >= 100) return item;
      if (item.borderRadiusPercent === DEFAULT_RADIUS) return item;
      changed = true;
      item.borderRadiusPercent = DEFAULT_RADIUS;
      return item;
    });
    if (!changed) return { block, changed: false };
    return { block: { ...block, data: { ...(block.data ?? {}), items: nextItems } }, changed: true };
  }

  return { block, changed: false };
}

function patchJuicyChatHeading(block: Block): { block: Block; changed: boolean } {
  if (block.type !== 'h2' && block.type !== 'h3' && block.type !== 'h4') {
    return { block, changed: false };
  }
  const text = String(block.data?.text ?? '').trim();
  let nextType = block.type;
  if (JUICYCHAT_H2.has(text)) nextType = 'h2';
  else if (JUICYCHAT_H3.has(text)) nextType = 'h3';
  else return { block, changed: false };

  const data = { ...(block.data ?? {}) };
  delete data.level;
  if (nextType === block.type && data.level == null) return { block, changed: false };
  return { block: { ...block, type: nextType, data }, changed: true };
}

async function main() {
  loadEnv();
  const appId = process.env.PUBLIC_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    console.error('Missing PUBLIC_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN');
    process.exit(1);
  }

  const db = init({ appId, adminToken });
  const { reviews } = await db.query({ reviews: { product: {} } });

  let reviewsTouched = 0;
  let imagesPatched = 0;
  let headingsPatched = 0;

  for (const review of reviews ?? []) {
    const product = Array.isArray((review as { product?: unknown }).product)
      ? (review as { product: { slug?: string }[] }).product[0]
      : (review as { product?: { slug?: string } }).product;
    const slug = String(product?.slug ?? '');
    const blocks = Array.isArray((review as { blocks?: Block[] }).blocks)
      ? ([...(review as { blocks: Block[] }).blocks] as Block[])
      : [];
    if (!blocks.length) continue;

    let changed = false;
    const next = blocks.map((block) => {
      let b = block;
      const img = patchImageRadius(b);
      if (img.changed) {
        imagesPatched += 1;
        changed = true;
        b = img.block;
      }
      if (slug === 'juicychat-ai') {
        const h = patchJuicyChatHeading(b);
        if (h.changed) {
          headingsPatched += 1;
          changed = true;
          b = h.block;
        }
      }
      // Migrate legacy h3+level:4 → h4 everywhere
      if (b.type === 'h3' && Number(b.data?.level) === 4) {
        const data = { ...(b.data ?? {}) };
        delete data.level;
        b = { ...b, type: 'h4', data };
        changed = true;
        headingsPatched += 1;
      }
      return b;
    });

    if (!changed) continue;
    reviewsTouched += 1;
    await db.transact([tx.reviews[(review as { id: string }).id].update({ blocks: next })]);
    console.log(`updated ${slug || (review as { id: string }).id}`);
  }

  console.log(
    JSON.stringify(
      { reviewsTouched, imagesPatched, headingsPatched, note: 'image default radius=12px' },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
