#!/usr/bin/env npx tsx
/**
 * Soft-delete a broken proof image from candy-ai female-count evidence.
 *
 * Usage:
 *   npx tsx scripts/remove-broken-amount-proof.ts
 *   npx tsx scripts/remove-broken-amount-proof.ts --id <media-id>
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_MEDIA_ID = '7e398aae-c642-4d62-9ed4-10ce4dfcad75';

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

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  let mediaId = DEFAULT_MEDIA_ID;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id') mediaId = args[++i] ?? mediaId;
  }

  const { getDb } = await import('../src/lib/db/server');
  const db = getDb();

  const { media } = await (db.query as any)({
    media: {
      $: { where: { id: mediaId } },
      evidenceResult: { evidenceDefinition: {} },
    },
  });

  const row = (media as any[])?.[0];
  if (!row) {
    console.error(`Media not found: ${mediaId}`);
    process.exit(1);
  }

  console.log('Removing proof media:', {
    id: row.id,
    caption: row.caption,
    url: row.url,
    evidenceSlug: row.evidenceResult?.evidenceDefinition?.slug,
  });

  await (db.transact as any)([
    (db.tx as any).media[mediaId].update({ deletedAt: Date.now() }),
  ]);

  console.log('Soft-deleted successfully.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
