import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init } from '@instantdb/admin';
import {
  loadPublishedProductBySlug,
  loadPublishedProducts,
} from '../src/lib/content/store';

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
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
  return out;
}

async function main() {
  const env = loadEnv();
  const db = init({
    appId: env.PUBLIC_INSTANT_APP_ID,
    adminToken: env.INSTANT_APP_ADMIN_TOKEN,
  });

  const { products } = await db.query({
    products: {
      $: { where: { slug: 'candy-ai' } },
      testRuns: {},
      scoreSnapshots: { testRun: {} },
    },
  });

  const p = products[0];
  if (!p) {
    console.log('No candy-ai product in DB');
    return;
  }

  const pubRun = (p.testRuns ?? []).find((r: { isCurrentPublished?: boolean }) => r.isCurrentPublished);
  const snaps = p.scoreSnapshots ?? [];
  const pubSnaps = snaps.filter(
    (s: { testRun?: { isCurrentPublished?: boolean; id?: string } }) => s.testRun?.isCurrentPublished,
  );
  const overall = pubSnaps.find((s: { kind?: string }) => s.kind === 'overall');

  console.log('DB candy-ai:', {
    status: p.status,
    hasPublishedRun: Boolean(pubRun),
    publishedRunId: pubRun?.id ?? null,
    totalSnapshots: snaps.length,
    publishedSnapshotCount: pubSnaps.length,
    overallScore: overall?.score ?? null,
    snapshotRuns: snaps.slice(0, 3).map((s: any) => ({
      kind: s.kind,
      score: s.score,
      testRunId: s.testRun?.id ?? s.testRunId ?? null,
      runPublished: s.testRun?.isCurrentPublished ?? null,
    })),
  });

  const { products: fileProducts } = await import('../src/data/products');
  const list = await loadPublishedProducts(fileProducts);
  const bySlug = await loadPublishedProductBySlug('candy-ai');

  console.log('loadPublishedProducts slugs:', list.map((x) => x.slug));
  console.log('loadPublishedProductBySlug:', bySlug ? `${bySlug.slug} score=${bySlug.overallScore}` : 'NULL');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
