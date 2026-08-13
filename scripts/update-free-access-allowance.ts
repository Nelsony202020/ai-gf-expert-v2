/**
 * Update Free Access evidence definitions to count + period (Total / Per day / Per month).
 *
 *   npx tsx scripts/update-free-access-allowance.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init } from '@instantdb/admin';

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

const UPDATES: Array<{
  slug: string;
  name: string;
  unit: string;
  publicDescription: string;
  internalInstructions: string;
  resultFormat: string;
  weight: number;
  displayOrder: number;
}> = [
  {
    slug: 'free-chat',
    name: 'Free Messages',
    unit: 'messages',
    publicDescription: 'free chat messages without paying',
    internalInstructions:
      'Try the free tier without subscribing.\nRecord how many chat messages a free user can send.\nChoose Total (one-time / until used up), Per day, or Per month. Default is Total.',
    resultFormat: 'Count plus period: Total, Per day, or Per month.',
    weight: 22,
    displayOrder: 1,
  },
  {
    slug: 'free-characters',
    name: 'Custom Character',
    unit: 'characters',
    publicDescription: 'free custom character creation or chat',
    internalInstructions:
      'Try the free tier without subscribing.\nRecord how many characters a free user can create or chat with.\nChoose Total, Per day, or Per month. Default is Total.',
    resultFormat: 'Count plus period: Total, Per day, or Per month.',
    weight: 18,
    displayOrder: 2,
  },
  {
    slug: 'free-images',
    name: 'Free Images',
    unit: 'images',
    publicDescription: 'free image generation without paying',
    internalInstructions:
      'Try the free tier without subscribing.\nRecord how many images a free user can generate.\nChoose Total, Per day, or Per month. Default is Total.',
    resultFormat: 'Count plus period: Total, Per day, or Per month.',
    weight: 20,
    displayOrder: 3,
  },
  {
    slug: 'free-video',
    name: 'Free Video',
    unit: 'videos',
    publicDescription: 'free video generation without paying',
    internalInstructions:
      'Try the free tier without subscribing.\nRecord how many videos a free user can create.\nChoose Total, Per day, or Per month. Default is Total.',
    resultFormat: 'Count plus period: Total, Per day, or Per month.',
    weight: 15,
    displayOrder: 4,
  },
  {
    slug: 'free-voice',
    name: 'Free Voice Message',
    unit: 'seconds',
    publicDescription: 'free voice messages without paying',
    internalInstructions:
      'Try the free tier without subscribing.\nRecord free voice allowance in seconds.\nChoose Total, Per day, or Per month. Default is Total.',
    resultFormat: 'Seconds plus period: Total, Per day, or Per month.',
    weight: 15,
    displayOrder: 5,
  },
];

async function main() {
  const appId = process.env.PUBLIC_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    console.error('Missing PUBLIC_INSTANT_APP_ID / INSTANT_APP_ADMIN_TOKEN');
    process.exit(1);
  }

  const db = init({ appId, adminToken });
  const { evidenceDefinitions } = await db.query({
    evidenceDefinitions: { subscore: { category: {} } },
  });

  const bySlug = new Map<string, any>();
  for (const def of evidenceDefinitions as any[]) {
    const slug = String(def.slug ?? '');
    const prev = bySlug.get(slug);
    if (!prev || (def.active !== false && prev.active === false)) {
      bySlug.set(slug, def);
    }
  }

  const txs: any[] = [];
  for (const row of UPDATES) {
    const def = bySlug.get(row.slug);
    if (!def) {
      console.warn(`Missing definition ${row.slug}`);
      continue;
    }
    txs.push(
      db.tx.evidenceDefinitions[def.id].update({
        name: row.name,
        publicDescription: row.publicDescription,
        internalInstructions: row.internalInstructions,
        helpText: row.internalInstructions,
        testInstructions: row.internalInstructions,
        resultFormat: row.resultFormat,
        measurementType: 'count',
        unit: row.unit,
        inputType: 'number',
        weight: row.weight,
        required: true,
        active: true,
        displayOrder: row.displayOrder,
        scoringRule: { kind: 'manual' },
        options: [],
        updatedAt: Date.now(),
      }),
    );
    console.log(`Updating ${row.slug} (${def.id})`);
  }

  if (txs.length === 0) {
    console.log('Nothing to update');
    return;
  }
  await db.transact(txs);
  console.log(`Updated ${txs.length} free-access definitions`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
