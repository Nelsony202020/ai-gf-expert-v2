import { isPricingProofMedia, type MediaRowLike } from '../media/catalog';
import { isUsablePublicMediaUrl, resolveMediaUrl } from '../media/url';
import { getDb, isDbConfigured } from '../db/server';
import type { PricingTabViewModel } from './types';

type EvidenceShot = NonNullable<
  NonNullable<PricingTabViewModel['pricingEvidence']>['main']
>;

export type PricingEvidence = PricingTabViewModel['pricingEvidence'];

function mediaIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(String).map((s) => s.trim()).filter(Boolean);
}

function collectEvidenceIds(sources: Array<{ evidenceMediaIds?: unknown } | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    for (const id of mediaIdList(src?.evidenceMediaIds)) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function formatMonthYear(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatFullDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isGoodProofImage(row: MediaRowLike & { mediaType?: string | null }): boolean {
  if (row.deletedAt) return false;
  if (row.mediaType && String(row.mediaType) !== 'image') return false;
  const url = resolveMediaUrl(row);
  if (!url || !isUsablePublicMediaUrl(url)) return false;
  return true;
}

function proofScore(row: MediaRowLike): number {
  let score = 0;
  if (isPricingProofMedia(row)) score += 4;
  if (row.role === 'proof') score += 3;
  if (String(row.testCategory ?? '') === 'pricing') score += 2;
  return score;
}

type EvidenceImage = { id: string; src: string; alt: string; caption: string | null };

type ShotKind = 'topup' | 'plans' | 'feature_costs' | 'other';

function classifyPricingShot(img: Pick<EvidenceImage, 'src' | 'alt' | 'caption'>): ShotKind {
  const blob = `${img.src} ${img.caption ?? ''} ${img.alt}`.toLowerCase();
  if (
    /tokens_topup|token.?top.?up|topup_cost|top-up.?cost|buy.?tokens|credit.?pack|token.?pack/.test(blob)
  ) {
    return 'topup';
  }
  if (/plan_subscriptions|plan.?subscription|choose.?your.?plan|subscription.?plan/.test(blob)) {
    return 'plans';
  }
  if (/feature.?cost|buy more|voice cost|image cost v|call cost/.test(blob)) {
    return 'feature_costs';
  }
  return 'other';
}

function pickOrderedImages(
  rows: Array<MediaRowLike & { id?: string; mediaType?: string | null }>,
  preferIds: string[],
): EvidenceImage[] {
  const byId = new Map(rows.map((r) => [String(r.id), r]));
  const preferred = preferIds
    .map((id) => byId.get(id))
    .filter((r): r is MediaRowLike & { id?: string; mediaType?: string | null } => Boolean(r))
    .filter(isGoodProofImage);

  const rest = rows
    .filter((r) => r.id && !preferIds.includes(String(r.id)))
    .filter(isGoodProofImage)
    .sort((a, b) => proofScore(b) - proofScore(a));

  // Keep preferIds order; only score-sort the leftover library matches.
  const ordered = [...preferred, ...rest];

  const seen = new Set<string>();
  const out: EvidenceImage[] = [];
  for (const row of ordered) {
    const id = String(row.id);
    if (seen.has(id)) continue;
    seen.add(id);
    const src = resolveMediaUrl(row);
    if (!src) continue;
    out.push({
      id,
      src,
      alt: String(row.altText ?? '').trim() || 'Pricing screenshot',
      caption: row.caption != null ? String(row.caption) : null,
    });
  }
  return out;
}

function pickMainShot(images: EvidenceImage[]): EvidenceImage | null {
  if (images.length === 0) return null;
  return (
    images.find((img) => classifyPricingShot(img) === 'topup')
    ?? images.find((img) => classifyPricingShot(img) === 'plans')
    ?? images.find((img) => classifyPricingShot(img) !== 'feature_costs')
    ?? images[0]
    ?? null
  );
}

function pickTopUpShot(images: EvidenceImage[], packageIds: string[], mainId: string | null): EvidenceImage | null {
  const topups = images.filter((img) => classifyPricingShot(img) === 'topup');
  const packageTopup = topups.find((img) => packageIds.includes(img.id));
  if (packageTopup) return packageTopup;
  if (topups[0]) return topups[0];

  const packageImage =
    packageIds.length > 0 ? images.find((img) => packageIds.includes(img.id)) ?? null : null;
  if (packageImage) return packageImage;

  return images.find((img) => img.id !== mainId) ?? null;
}

/** Candy AI token top-up packages — preferred public pricing proof when InstantDB is sparse. */
const DRAFT_TOPUP_SRC =
  'https://aigirlfriendpull.b-cdn.net/media/1787133393185-Candy_AI_Tokens_topup_cost.png';

export function draftPricingEvidence(product: {
  name: string;
  affiliateUrl?: string | null;
  websiteUrl?: string | null;
}): NonNullable<PricingEvidence> {
  const src = DRAFT_TOPUP_SRC;
  return {
    verifiedLabel: 'Pricing verified Aug 2026',
    capturedLabel: "Captured from the vendor's pricing page on Aug 19, 2026.",
    sourceUrl: product.affiliateUrl || product.websiteUrl || null,
    main: {
      src,
      alt: `${product.name} pricing screenshot`,
      caption: `${product.name} pricing — verified August 2026`,
    },
    topUps: {
      src,
      alt: `${product.name} top-up pricing screenshot`,
      caption: `${product.name} credit top-ups — verified August 2026`,
    },
  };
}

/**
 * Resolve verified pricing screenshots from InstantDB evidence media IDs.
 */
export async function resolvePricingEvidence(input: {
  productName: string;
  sourceUrl: string | null;
  snapshot: { evidenceMediaIds?: unknown; verifiedAt?: unknown; sourceUrl?: unknown } | null;
  packages: Array<{ evidenceMediaIds?: unknown }>;
  plans?: Array<{ evidenceMediaIds?: unknown }>;
}): Promise<PricingEvidence> {
  if (!isDbConfigured()) return null;

  const snapshotIds = mediaIdList(input.snapshot?.evidenceMediaIds);
  const packageIds = collectEvidenceIds(input.packages);
  const planIds = collectEvidenceIds(input.plans ?? []);
  const allIds = [...new Set([...snapshotIds, ...packageIds, ...planIds])];
  if (allIds.length === 0) return null;

  const db = getDb();
  const { media } = await (db.query as any)({
    media: {
      $: { where: { id: { $in: allIds.slice(0, 40) } } },
      file: {},
    },
  });
  const rows = ((media ?? []) as Array<MediaRowLike & { id?: string; mediaType?: string | null }>);
  if (rows.length === 0) return null;

  // Prefer snapshot → package → plan evidence IDs; classify by filename/caption for role.
  const images = pickOrderedImages(rows, [...snapshotIds, ...packageIds, ...planIds]);
  if (images.length === 0) return null;

  const mainImg = pickMainShot(images)!;
  const topUpImg = pickTopUpShot(images, packageIds, mainImg.id);

  const verifiedAt =
    input.snapshot?.verifiedAt != null && Number.isFinite(Number(input.snapshot.verifiedAt))
      ? Number(input.snapshot.verifiedAt)
      : null;

  const verifiedLabel = verifiedAt
    ? `Pricing verified ${formatMonthYear(verifiedAt)}`
    : 'Pricing verified';
  const capturedLabel = verifiedAt
    ? `Captured from the vendor's pricing page on ${formatFullDate(verifiedAt)}.`
    : "Captured from the vendor's pricing page.";

  const sourceUrl =
    (input.snapshot?.sourceUrl != null && String(input.snapshot.sourceUrl).trim())
      || input.sourceUrl
      || null;

  const main: EvidenceShot = {
    src: mainImg.src,
    alt: mainImg.alt === 'Pricing screenshot'
      ? `${input.productName} pricing screenshot`
      : mainImg.alt,
    caption:
      mainImg.caption && mainImg.caption.toLowerCase() !== 'pricing proof'
        ? mainImg.caption
        : `${input.productName} pricing — ${verifiedLabel.replace(/^Pricing /, '')}`,
  };

  const topUps: EvidenceShot | null = topUpImg
    ? {
        src: topUpImg.src,
        alt:
          topUpImg.alt === 'Pricing screenshot'
            ? `${input.productName} top-up pricing screenshot`
            : topUpImg.alt,
        caption:
          topUpImg.caption && topUpImg.caption.toLowerCase() !== 'pricing proof'
            ? topUpImg.caption
            : `${input.productName} credit top-ups — ${verifiedLabel.replace(/^Pricing /, '')}`,
      }
    : null;

  return {
    verifiedLabel,
    capturedLabel,
    sourceUrl,
    main,
    topUps,
  };
}
