import { id, type AdminDb } from '../db/server';
import { DEFAULT_AFFILIATE_REL } from './rel';

export const OURDREAM_YT_CLOAKED_SLUG = 'ourdream-ai-yt';

/** OurDream YouTube / guides affiliate (uid=540) — editable in admin. */
export const OURDREAM_YT_AFFILIATE_DEST =
  'https://www.ourdreamersai13.com/9776S5J/3QQG7/?uid=540';

type AffiliateLinkRow = {
  id: string;
  destinationUrl?: string | null;
  active?: boolean | null;
  ageGate?: boolean | null;
  cloakedSlug?: string | null;
  linkType?: string | null;
  campaign?: string | null;
  product?: unknown;
};

function normalizeRedirectUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.protocol}//${parsed.host}${path}${parsed.search}`;
  } catch {
    return url.trim().replace(/\/+$/, '');
  }
}

/** Create or repair the OurDream YT cloaked link on first production hit if missing. */
export async function ensureOurdreamYtAffiliateLink(
  db: AdminDb,
  slug: string,
  existing: AffiliateLinkRow | undefined,
): Promise<AffiliateLinkRow | undefined> {
  if (slug !== OURDREAM_YT_CLOAKED_SLUG) return existing;

  const dest = OURDREAM_YT_AFFILIATE_DEST;

  if (!existing?.id) {
    const { products } = await db.query({
      products: { $: { where: { slug: 'ourdream-ai' } } },
    });
    const product = products[0] as { id?: string } | undefined;
    if (!product?.id) return undefined;

    const linkId = id();
    const now = Date.now();
    await db.transact([
      db.tx.affiliateLinks[linkId].update({
        destinationUrl: dest,
        cloakedSlug: OURDREAM_YT_CLOAKED_SLUG,
        linkType: 'campaign',
        campaign: 'youtube',
        active: true,
        ageGate: false,
        relTags: DEFAULT_AFFILIATE_REL,
        notes:
          'OurDream YouTube traffic (uid=540). Edit destination in Admin → OurDream AI → Affiliate links.',
        createdAt: now,
        clickCount: 0,
      }),
      db.tx.affiliateLinks[linkId].link({ product: product.id }),
    ]);

    const { affiliateLinks } = await db.query({
      affiliateLinks: { $: { where: { cloakedSlug: slug } }, product: {} },
    });
    return affiliateLinks[0] as AffiliateLinkRow | undefined;
  }

  const outOfSync =
    normalizeRedirectUrl(String(existing.destinationUrl ?? '')) !== normalizeRedirectUrl(dest) ||
    !existing.active ||
    existing.ageGate !== false;

  if (outOfSync) {
    await db
      .transact(
        db.tx.affiliateLinks[existing.id].update({
          destinationUrl: dest,
          active: true,
          ageGate: false,
          linkType: 'campaign',
          campaign: 'youtube',
        }),
      )
      .catch(() => {});
    return { ...existing, destinationUrl: dest, active: true, ageGate: false };
  }

  return { ...existing, ageGate: false };
}
