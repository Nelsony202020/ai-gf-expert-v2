#!/usr/bin/env npx tsx
/**
 * Activate OurDream AI affiliate destinations (unique UID per page).
 *
 *   /go/ourdream-ai          → Normal (uid=10) — product CTA
 *   /go/ourdream-ai-youtube  → YouTube (uid=540), 18+ interstitial first
 *   /go/ourdream-elara       → Elara character (uid=544&sub1=…)
 *   /go/ourdream-emily       → Emily character (uid=544&sub1=…)
 *
 * Also wires Elara/Emily characters to their cloaked links and enables
 * skipReferralSuffix with the full tracking URL as a fallback.
 *
 * Usage: npx tsx scripts/activate-ourdream-affiliate-links.ts
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { id, init, tx } from '@instantdb/admin';
import { DEFAULT_AFFILIATE_REL } from '../src/lib/affiliate/rel';

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

const LINKS = [
  {
    cloakedSlug: 'ourdream-ai',
    destinationUrl: 'https://www.ourdreamersai13.com/9776S5J/3QQG7/?uid=10',
    linkType: 'product',
    campaign: 'normal',
    notes: 'Main OurDream product CTA (uid=10)',
  },
  {
    cloakedSlug: 'ourdream-ai-youtube',
    destinationUrl: 'https://www.ourdreamersai13.com/9776S5J/3QQG7/?uid=540',
    linkType: 'campaign',
    campaign: 'youtube',
    notes: 'YouTube traffic tracking (uid=540)',
  },
  {
    cloakedSlug: 'ourdream-elara',
    destinationUrl:
      'https://www.ourdreamersai13.com/9776S5J/3QQG7/?uid=544&sub1=elara-N8qrjXmCTy',
    linkType: 'character',
    campaign: 'elara',
    notes: 'Elara character affiliate URL',
    characterName: 'elara',
    characterAliases: ['elera'],
  },
  {
    cloakedSlug: 'ourdream-emily',
    destinationUrl:
      'https://www.ourdreamersai13.com/9776S5J/3QQG7/?uid=544&sub1=emily-maxwell-TC3RfFeQs5',
    linkType: 'character',
    campaign: 'emily',
    notes: 'Emily character affiliate URL',
    characterName: 'emily',
    characterAliases: ['emily-maxwell'],
  },
] as const;

function productFromLink(row: { product?: unknown }): { id?: string; slug?: string } | undefined {
  const p = row.product;
  if (Array.isArray(p)) return p[0];
  return p as { id?: string; slug?: string } | undefined;
}

async function main() {
  loadEnv();
  const appId = process.env.PUBLIC_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    console.error('Missing PUBLIC_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN');
    process.exit(1);
  }

  const db = init({ appId, adminToken });
  const { products, affiliateLinks, characters } = await db.query({
    products: {},
    affiliateLinks: { product: {} },
    characters: { product: {}, affiliateLink: {} },
  });

  const ourdream = (products as any[])?.find((p) => p.slug === 'ourdream-ai');
  if (!ourdream) {
    console.error('OurDream AI product not found');
    process.exit(1);
  }

  const existingBySlug = new Map(
    ((affiliateLinks as any[]) ?? []).map((l) => [String(l.cloakedSlug), l]),
  );

  const txs: unknown[] = [];
  const linkIdBySlug = new Map<string, string>();

  for (const spec of LINKS) {
    const prev = existingBySlug.get(spec.cloakedSlug);
    const linkId = prev?.id ?? id();
    linkIdBySlug.set(spec.cloakedSlug, linkId);

    const fields = {
      destinationUrl: spec.destinationUrl,
      cloakedSlug: spec.cloakedSlug,
      linkType: spec.linkType,
      campaign: spec.campaign,
      notes: spec.notes,
      active: true,
      relTags: DEFAULT_AFFILIATE_REL,
      ...(prev ? {} : { createdAt: Date.now() }),
    };

    if (prev) {
      txs.push(tx.affiliateLinks[linkId].update(fields));
      txs.push(tx.affiliateLinks[linkId].link({ product: ourdream.id }));
      console.log(`update /go/${spec.cloakedSlug}`);
    } else {
      txs.push(tx.affiliateLinks[linkId].update(fields));
      txs.push(tx.affiliateLinks[linkId].link({ product: ourdream.id }));
      console.log(`create /go/${spec.cloakedSlug}`);
    }
  }

  // Deactivate other OurDream product-type links so main CTA is unambiguous.
  for (const link of (affiliateLinks as any[]) ?? []) {
    const prod = productFromLink(link);
    if (prod?.id !== ourdream.id && prod?.slug !== 'ourdream-ai') continue;
    if (LINKS.some((s) => s.cloakedSlug === link.cloakedSlug)) continue;
    if (link.active && (link.linkType === 'product' || !link.linkType)) {
      txs.push(tx.affiliateLinks[link.id].update({ active: false }));
      console.log(`deactivate old product link /go/${link.cloakedSlug}`);
    }
  }

  // Clear shared referral suffix — OurDream needs per-destination UIDs.
  if (ourdream.referralSuffix) {
    txs.push(tx.products[ourdream.id].update({ referralSuffix: '' }));
    console.log('cleared product referralSuffix');
  }

  for (const spec of LINKS) {
    if (!('characterName' in spec) || !spec.characterName) continue;
    const needles = [spec.characterName, ...(('characterAliases' in spec && spec.characterAliases) || [])].map((n) =>
      n.toLowerCase(),
    );
    const character = ((characters as any[]) ?? []).find((c) => {
      const prod = productFromLink(c);
      if (prod?.id !== ourdream.id && prod?.slug !== 'ourdream-ai') return false;
      const name = String(c.name ?? '').toLowerCase();
      const slug = String(c.slug ?? '').toLowerCase();
      return needles.some((needle) => name === needle || slug === needle || name.includes(needle) || slug.includes(needle));
    });
    if (!character) {
      console.warn(`character not found for ${spec.characterName} — link created but not wired`);
      continue;
    }
    const linkId = linkIdBySlug.get(spec.cloakedSlug)!;
    txs.push(
      tx.characters[character.id].update({
        destinationUrl: spec.destinationUrl,
        skipReferralSuffix: true,
      }),
    );
    txs.push(tx.characters[character.id].link({ affiliateLink: linkId }));
    console.log(`wire character ${character.name} → /go/${spec.cloakedSlug}`);
  }

  await db.transact(txs as any);
  console.log(
    JSON.stringify(
      {
        ok: true,
        product: 'ourdream-ai',
        links: LINKS.map((l) => ({ slug: l.cloakedSlug, type: l.linkType, url: l.destinationUrl })),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
