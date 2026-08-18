import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init } from '@instantdb/admin';
import schema from '../instant.schema';

function loadEnv(): void {
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

const PROS = [
  'High quality AI porn',
  'NSFW videos with audio',
  'Fast image generator',
  'Diverse AI girlfriends',
  'Discreet Billing',
];

const CONS = ['Some negative press'];

async function main() {
  loadEnv();
  const appId = process.env.PUBLIC_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    console.error('Missing PUBLIC_INSTANT_APP_ID / INSTANT_APP_ADMIN_TOKEN');
    process.exit(1);
  }

  const db = init({ appId, adminToken, schema });
  const { products } = await db.query({
    products: {
      $: { where: { slug: 'ourdream-ai' } },
    },
  });

  const product = (products as any[])?.[0];
  if (!product) {
    console.error('Product ourdream-ai not found');
    process.exit(1);
  }

  await db.transact([
    db.tx.products[product.id].update({
      pros: PROS,
      cons: CONS,
      capVoiceMessages: true,
    }),
  ]);

  console.log(`Updated ourdream-ai (${product.id})`);
  console.log('pros:', PROS);
  console.log('cons:', CONS);
  console.log('capVoiceMessages: true');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
