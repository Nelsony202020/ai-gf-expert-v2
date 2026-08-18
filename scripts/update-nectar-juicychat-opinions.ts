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

const UPDATES: Record<string, { ourTake: string; expertOpinion: string }> = {
  'nectar-ai': {
    ourTake: `Nectar AI is one of the most underrated AI girlfriend apps on the market and definitely deserves a spot on our Best AI Girlfriend Apps list. It's especially good at roleplay with realistic-style characters.

One of its coolest features is Fantasies, which are ready-made NSFW roleplay scenarios. For example, there's a "late rent payment" scenario where you play the landlord and the tenant doesn't have enough money, so she starts looking for other ways to pay you.

Nectar AI also has a really good image generator, but the character customization is limited and it doesn't have voice messages. The cheapest plan is only $9.99 and gives you a ton of messages, but features like the AI video generator are locked behind a more expensive plan.

Overall, Nectar AI is a great choice if you want realistic characters and NSFW roleplay without spending a ton of money.`,
    expertOpinion: `Nectar AI is one of the most underrated AI girlfriend apps on the market and definitely deserves a spot on our Best AI Girlfriend Apps list. It's especially good at roleplay with realistic-style characters.

One of its coolest features is Fantasies, which are ready-made NSFW roleplay scenarios. For example, there's a "late rent payment" scenario where you play the landlord and the tenant doesn't have enough money, so she starts looking for other ways to pay you.

Nectar AI also has a really good image generator, but the character customization is limited and it doesn't have voice messages. The cheapest plan is only $9.99 and gives you a ton of messages, but features like the AI video generator are locked behind a more expensive plan.

Overall, Nectar AI is a great choice if you want realistic characters and NSFW roleplay without spending a ton of money.`,
  },
  'juicychat-ai': {
    ourTake: `JuicyChat AI is one of the best options for roleplay with anime-style characters. It has over 1 million characters, all focused on anime and fantasy styles.

What makes the character library so good is the creator community. Creators can actually make money by selling NSFW images and accepting donations, which has attracted some of the best character creators I've seen in the AI girlfriend space. The result is a massive library filled with unique characters, personalities, and roleplay scenarios.

The chat also gives you a lot of control. You can choose different LLMs depending on the type of roleplay you want, and there's an advanced character creator if you like building your own bots.

The video generator is the big disappointment. Prompt adherence is terrible, so the videos often don't look anything like what you asked for.

Overall, JuicyChat AI is highly recommended if you like anime characters and roleplay, but I wouldn't choose it if video generation is important to you.`,
    expertOpinion: `JuicyChat AI is one of the best options for roleplay with anime-style characters. It has over 1 million characters, all focused on anime and fantasy styles.

What makes the character library so good is the creator community. Creators can actually make money by selling NSFW images and accepting donations, which has attracted some of the best character creators I've seen in the AI girlfriend space. The result is a massive library filled with unique characters, personalities, and roleplay scenarios.

The chat also gives you a lot of control. You can choose different LLMs depending on the type of roleplay you want, and there's an advanced character creator if you like building your own bots.

The video generator is the big disappointment. Prompt adherence is terrible, so the videos often don't look anything like what you asked for.

Overall, JuicyChat AI is highly recommended if you like anime characters and roleplay, but I wouldn't choose it if video generation is important to you.`,
  },
};

async function main() {
  loadEnv();
  const appId = process.env.PUBLIC_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    console.error('Missing PUBLIC_INSTANT_APP_ID / INSTANT_APP_ADMIN_TOKEN');
    process.exit(1);
  }

  const db = init({ appId, adminToken, schema });

  for (const [slug, copy] of Object.entries(UPDATES)) {
    const { products } = await db.query({
      products: { $: { where: { slug } } },
    });
    const product = (products as any[])?.[0];
    if (!product) {
      console.warn(`Missing product: ${slug}`);
      continue;
    }

    await db.transact([
      db.tx.products[product.id].update({
        ourTake: copy.ourTake,
        expertOpinion: copy.expertOpinion,
      }),
    ]);
    console.log(`Updated ${slug}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
