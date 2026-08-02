#!/usr/bin/env npx tsx
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  const { getDb } = await import('../src/lib/db/server');
  const db = getDb();
  const { products } = await (db.query as any)({
    products: {
      $: { where: { slug: 'candy-ai' } },
      evidenceResults: {
        evidenceDefinition: { subscore: { category: {} } },
        attachments: {},
      },
    },
  });
  const p = (products as any[])?.[0];
  if (!p) {
    console.error('candy-ai not found');
    process.exit(1);
  }
  const amountSlugs = ['female-count', 'male-count', 'anime-female-count', 'anime-male-count'];
  for (const r of p.evidenceResults ?? []) {
    const slug = r.evidenceDefinition?.slug;
    if (!amountSlugs.includes(slug)) continue;
    const atts = r.attachments ?? [];
    if (!atts.length) continue;
    console.log(`\n--- ${slug} (result ${r.id}) ---`);
    for (const a of atts) {
      console.log(
        JSON.stringify({
          id: a.id,
          caption: a.caption,
          url: a.url ?? a.publicUrl ?? a.storagePath,
          order: a.displayOrder,
        }),
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
