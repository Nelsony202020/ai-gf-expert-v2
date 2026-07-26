#!/usr/bin/env npx tsx
// Purge a product (and related records) or orphaned affiliate link by slug.
// Usage: npx tsx scripts/delete-product-by-slug.ts candy-ai

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { deleteProductBySlug } from '../src/lib/db/cascade-delete';
import type { AdminIdentity } from '../src/lib/db/auth';

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

const slug = process.argv[2]?.trim();
if (!slug) {
  console.error('Usage: npx tsx scripts/delete-product-by-slug.ts <slug>');
  process.exit(1);
}

const identity: AdminIdentity = {
  email: process.env.ADMIN_OWNER_EMAIL ?? 'script@local',
  role: 'owner',
};

const removed = await deleteProductBySlug(slug, identity);
if (removed) {
  console.log(`Removed product and/or affiliate records for slug "${slug}".`);
} else {
  console.log(`No product or affiliate link found for slug "${slug}".`);
}
