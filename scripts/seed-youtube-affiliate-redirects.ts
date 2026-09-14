/**
 * Create YouTube-campaign /go/*-youtube affiliate links used by legacy
 * /recommends/* redirects from YouTube descriptions.
 *
 * Run: npx tsx scripts/seed-youtube-affiliate-redirects.ts
 */
import { getDb, id, isDbConfigured, tx } from '../src/lib/db/server';
import { DEFAULT_AFFILIATE_REL } from '../src/lib/affiliate/rel';

type Spec = {
  cloakedSlug: string;
  destinationUrl: string;
  productSlug?: string;
  notes: string;
  ageGate?: boolean;
};

const LINKS: Spec[] = [
  {
    cloakedSlug: 'candy-ai-youtube',
    destinationUrl: 'https://aigirlfriend.expert/guides/ourdream-ai/',
    productSlug: 'candy-ai',
    notes: 'YouTube traffic via /recommends/candy-ai → /go/candy-ai-youtube',
    ageGate: false,
  },
  {
    cloakedSlug: 'girlfriendgpt-youtube',
    destinationUrl: 'https://aigirlfriend.expert/guides/ourdream-ai/',
    productSlug: 'girlfriendgpt',
    notes: 'YouTube traffic via /go/girlfriendgpt-youtube (OurDream hub for now)',
    ageGate: false,
  },
  {
    cloakedSlug: 'girlfriendgpt-quiz-youtube',
    destinationUrl: 'https://www.gptgirlfriend.online/?ref=njjhywm&tm_datingtoolsai=datingtoolsai',
    productSlug: 'girlfriendgpt',
    notes: 'YouTube traffic via /recommends/girlfriendgpt-quiz → /go/girlfriendgpt-quiz-youtube',
  },
  {
    cloakedSlug: 'spicychat-ai-youtube',
    destinationUrl: 'https://aigirlfriend.expert/guides/ourdream-ai/',
    notes: 'YouTube traffic via /recommends/spicychat-ai-youtube (OurDream hub for now)',
    ageGate: false,
  },
  {
    cloakedSlug: 'nectar-ai-youtube',
    destinationUrl: 'https://aigirlfriend.expert/guides/ourdream-ai/',
    productSlug: 'nectar-ai',
    notes: 'YouTube traffic via /recommends/nectar-ai-youtube (OurDream hub for now)',
    ageGate: false,
  },
  {
    cloakedSlug: 'kupid-ai-2-youtube',
    destinationUrl: 'https://aigirlfriend.expert/guides/ourdream-ai/',
    notes: 'YouTube traffic via /recommends/kupid-ai-2 and /go/kupid-ai-youtube (OurDream hub for now)',
    ageGate: false,
  },
];

async function main() {
  if (!isDbConfigured()) {
    console.error('InstantDB is not configured.');
    process.exit(1);
  }

  const db = getDb();
  const { products, affiliateLinks } = await db.query({
    products: {},
    affiliateLinks: { product: {} },
  });

  const productBySlug = new Map(
    ((products as any[]) ?? []).map((p) => [String(p.slug), p]),
  );
  const existingBySlug = new Map(
    ((affiliateLinks as any[]) ?? []).map((l) => [String(l.cloakedSlug), l]),
  );

  const now = Date.now();
  let created = 0;
  let updated = 0;

  for (const spec of LINKS) {
    const prev = existingBySlug.get(spec.cloakedSlug);
    const product = spec.productSlug ? productBySlug.get(spec.productSlug) : undefined;
    const fields = {
      cloakedSlug: spec.cloakedSlug,
      destinationUrl: spec.destinationUrl,
      linkType: 'campaign',
      campaign: 'youtube',
      active: true,
      relTags: DEFAULT_AFFILIATE_REL,
      notes: spec.notes,
      lastCheckStatus: 'unchecked',
      ...(spec.ageGate !== undefined ? { ageGate: spec.ageGate } : {}),
    };

    if (prev?.id) {
      const txs = [tx.affiliateLinks[prev.id].update(fields)];
      if (product?.id) txs.push(tx.affiliateLinks[prev.id].link({ product: product.id }));
      await db.transact(txs);
      updated += 1;
      console.log(`updated  /go/${spec.cloakedSlug}`);
    } else {
      const linkId = id();
      const txs = [
        tx.affiliateLinks[linkId].update({
          ...fields,
          clickCount: 0,
          createdAt: now,
        }),
      ];
      if (product?.id) txs.push(tx.affiliateLinks[linkId].link({ product: product.id }));
      await db.transact(txs);
      created += 1;
      console.log(`created  /go/${spec.cloakedSlug}`);
    }
  }

  console.log(`\nDone. Created ${created}, updated ${updated}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
