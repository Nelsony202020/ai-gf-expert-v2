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

loadEnv();

async function main() {
  const { getDb } = await import('../src/lib/db/server');
  const db = getDb();

  const { evidenceDefinitions, categories } = await (db.query as any)({
    evidenceDefinitions: { subscore: { category: {} } },
    categories: { subscores: {} },
  });

  const active = (evidenceDefinitions as any[]).filter((d) => d.active !== false);
  const byCatSlug = new Map<string, any[]>();
  for (const d of active) {
    const cat = d.subscore?.category?.slug ?? '?';
    const key = `${cat}|${d.slug}`;
    if (!byCatSlug.has(key)) byCatSlug.set(key, []);
    byCatSlug.get(key)!.push(d);
  }

  const dupes = [...byCatSlug.entries()].filter(([, v]) => v.length > 1);
  console.log('Active evidence defs:', active.length);
  console.log('Unique category|slug keys:', byCatSlug.size);
  console.log('Duplicate keys:', dupes.length);
  for (const [key, defs] of dupes.slice(0, 20)) {
    console.log(`  ${key}:`);
    for (const d of defs) {
      console.log(`    id=${d.id.slice(0, 8)} subscore=${d.subscore?.slug} name=${d.name}`);
    }
  }

  const activeCats = (categories as any[]).filter((c) => c.active !== false);
  console.log('\nActive categories:', activeCats.length, activeCats.map((c) => c.slug).join(', '));
  const inactiveCats = (categories as any[]).filter((c) => c.active === false);
  if (inactiveCats.length) console.log('Inactive categories:', inactiveCats.map((c) => c.slug).join(', '));

  // Defs on inactive categories
  const onInactiveCat = active.filter((d) => d.subscore?.category?.active === false);
  console.log('\nActive defs linked to INACTIVE categories:', onInactiveCat.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
