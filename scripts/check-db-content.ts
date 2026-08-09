import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init } from '@instantdb/admin';
import { loadPublishedProducts } from '../src/lib/content/store';
import { loadComparisonProducts } from '../src/lib/content/comparisonProducts';
import { loadFeaturedCharactersFromDb } from '../src/lib/homepage/featuredCharacters';

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

async function main() {
  const env = loadEnv();
  const db = init({
    appId: env.PUBLIC_INSTANT_APP_ID,
    adminToken: env.INSTANT_APP_ADMIN_TOKEN,
  });

  const { products, homepageSlots, characters } = await db.query({
    products: { $: { where: {} } },
    homepageSlots: { character: {}, product: {} },
    characters: { $: { where: {} } },
  });

  console.log('\n=== ALL PRODUCTS IN DB ===');
  for (const p of [...products].sort((a, b) => String(a.name).localeCompare(String(b.name)))) {
    if (p.deletedAt) continue;
    console.log(
      `- ${p.name} | slug: ${p.slug} | status: ${p.status} | homepageFeatured: ${p.homepageFeatured} | publishedInDirectory: ${p.publishedInDirectory}`,
    );
  }

  console.log('\n=== PUBLISHED PRODUCTS (store loader) ===');
  const published = await loadPublishedProducts([]);
  console.log(`Count: ${published.length}`);
  for (const p of published) {
    console.log(`- ${p.name} (${p.slug}) score: ${p.overallScore ?? 'none'}`);
  }

  console.log('\n=== NAV / COMPARISON PRODUCTS ===');
  const nav = await loadComparisonProducts();
  console.log(`Count: ${nav.length}`);
  for (const p of nav) console.log(`- ${p.name} Review -> /reviews/${p.slug}`);

  console.log('\n=== HOMEPAGE SLOTS ===');
  console.log(`Total slots: ${homepageSlots.length}`);
  for (const s of homepageSlots) {
    console.log(
      `- kind: ${s.kind} | active: ${s.active} | product: ${s.product?.slug ?? '-'} | character: ${s.character?.name ?? '-'}`,
    );
  }

  console.log('\n=== CHARACTERS ===');
  const activeChars = characters.filter((c) => !c.deletedAt && c.active !== false);
  console.log(`Active characters: ${activeChars.length}`);
  for (const c of activeChars.slice(0, 10)) {
    console.log(`- ${c.name} | featured: ${c.featured}`);
  }

  console.log('\n=== FEATURED CHARACTERS (homepage loader) ===');
  const featured = await loadFeaturedCharactersFromDb();
  console.log(featured ? `Count: ${featured.length}` : 'null (no slots — homepage carousel empty)');

  console.log('\n=== USE_DB_CONTENT ===');
  console.log('USE_DB_CONTENT env:', env.USE_DB_CONTENT ?? '(not set)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
