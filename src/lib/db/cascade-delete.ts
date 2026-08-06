// Permanent cascade deletion for products and affiliate links.
// Soft-deleted products still hold unique slugs in InstantDB — admin delete
// must hard-delete the product graph so slugs can be reused.

import { getDb } from './server';
import { HttpError, type AdminIdentity } from './auth';
import { auditTx } from './audit';

type IdSet = Set<string>;

function mark(set: IdSet, id: string | undefined | null) {
  if (id) set.add(id);
}

function deleteChunks(namespace: string, ids: IdSet) {
  const db = getDb();
  return [...ids].map((recordId) => (db.tx as any)[namespace][recordId].delete());
}

/** Hard-delete an affiliate link and its change history. */
export async function deleteAffiliateLinkCascade(
  linkId: string,
  identity: AdminIdentity,
): Promise<void> {
  const db = getDb();
  const { affiliateLinks } = await (db.query as any)({
    affiliateLinks: { $: { where: { id: linkId } }, history: {} },
  });
  const link = affiliateLinks?.[0];
  if (!link) throw new HttpError(404, 'Affiliate link not found');

  const historyIds = new Set<string>();
  for (const row of link.history ?? []) mark(historyIds, row.id);

  await db.transact([
    ...deleteChunks('affiliateLinkHistory', historyIds),
    ...deleteChunks('affiliateLinks', new Set([linkId])),
    auditTx({
      actorEmail: identity.email,
      action: 'delete',
      recordType: 'affiliateLinks',
      recordId: linkId,
      oldValue: link,
      reason: 'cascade delete (link + history)',
    }),
  ]);
}

/** Hard-delete a product and all records that belong to it. */
export async function deleteProductCascade(
  productId: string,
  identity: AdminIdentity,
): Promise<void> {
  const db = getDb();
  const { products } = await (db.query as any)({
    products: {
      $: { where: { id: productId } },
      affiliateLinks: { history: {} },
      characters: { storySlides: {} },
      media: {},
      review: {},
      paymentProfile: {},
      subscriptionPlans: {},
      creditPackages: {},
      pricingSnapshots: {},
      featureCosts: {},
      pricingPromotions: {},
      testRuns: {
        evidenceResults: { attachments: {} },
        scoreSnapshots: {},
        aiPrivacyAnalyses: {},
      },
      evidenceResults: { attachments: {} },
      aiPrivacyAnalyses: {},
      scoreSnapshots: {},
      roundupEntries: {},
      homepageSlots: {},
    },
  });

  const product = products?.[0];
  if (!product) throw new HttpError(404, 'Product not found');

  const affiliateLinkHistory = new Set<string>();
  const affiliateLinks = new Set<string>();
  const homepageSlots = new Set<string>();
  const roundupEntries = new Set<string>();
  const media = new Set<string>();
  const evidenceResults = new Set<string>();
  const scoreSnapshots = new Set<string>();
  const testRuns = new Set<string>();
  const characters = new Set<string>();
  const characterStorySlides = new Set<string>();
  const reviews = new Set<string>();
  const paymentProfiles = new Set<string>();
  const subscriptionPlans = new Set<string>();
  const creditPackages = new Set<string>();
  const pricingSnapshots = new Set<string>();
  const featureCosts = new Set<string>();
  const pricingPromotions = new Set<string>();
  const aiPrivacyAnalyses = new Set<string>();

  for (const link of product.affiliateLinks ?? []) {
    mark(affiliateLinks, link.id);
    for (const row of link.history ?? []) mark(affiliateLinkHistory, row.id);
  }
  for (const slot of product.homepageSlots ?? []) mark(homepageSlots, slot.id);
  for (const entry of product.roundupEntries ?? []) mark(roundupEntries, entry.id);
  for (const row of product.characters ?? []) {
    mark(characters, row.id);
    for (const slide of row.storySlides ?? []) mark(characterStorySlides, slide.id);
  }
  for (const row of product.media ?? []) mark(media, row.id);
  mark(reviews, product.review?.id);
  mark(paymentProfiles, product.paymentProfile?.id);
  for (const row of product.subscriptionPlans ?? []) mark(subscriptionPlans, row.id);
  for (const row of product.creditPackages ?? []) mark(creditPackages, row.id);
  for (const row of product.pricingSnapshots ?? []) mark(pricingSnapshots, row.id);
  for (const row of product.featureCosts ?? []) mark(featureCosts, row.id);
  for (const row of product.pricingPromotions ?? []) mark(pricingPromotions, row.id);

  for (const run of product.testRuns ?? []) {
    mark(testRuns, run.id);
    for (const snap of run.scoreSnapshots ?? []) mark(scoreSnapshots, snap.id);
    for (const er of run.evidenceResults ?? []) {
      mark(evidenceResults, er.id);
      for (const att of er.attachments ?? []) mark(media, att.id);
    }
    for (const row of run.aiPrivacyAnalyses ?? []) mark(aiPrivacyAnalyses, row.id);
  }
  for (const snap of product.scoreSnapshots ?? []) mark(scoreSnapshots, snap.id);
  for (const er of product.evidenceResults ?? []) {
    mark(evidenceResults, er.id);
    for (const att of er.attachments ?? []) mark(media, att.id);
  }
  for (const row of product.aiPrivacyAnalyses ?? []) mark(aiPrivacyAnalyses, row.id);

  const chunks = [
    ...deleteChunks('affiliateLinkHistory', affiliateLinkHistory),
    ...deleteChunks('homepageSlots', homepageSlots),
    ...deleteChunks('roundupEntries', roundupEntries),
    ...deleteChunks('aiPrivacyAnalyses', aiPrivacyAnalyses),
    ...deleteChunks('evidenceResults', evidenceResults),
    ...deleteChunks('scoreSnapshots', scoreSnapshots),
    ...deleteChunks('testRuns', testRuns),
    ...deleteChunks('affiliateLinks', affiliateLinks),
    ...deleteChunks('characterStorySlides', characterStorySlides),
    ...deleteChunks('characters', characters),
    ...deleteChunks('media', media),
    ...deleteChunks('reviews', reviews),
    ...deleteChunks('paymentProfiles', paymentProfiles),
    ...deleteChunks('subscriptionPlans', subscriptionPlans),
    ...deleteChunks('creditPackages', creditPackages),
    ...deleteChunks('featureCosts', featureCosts),
    ...deleteChunks('pricingPromotions', pricingPromotions),
    ...deleteChunks('pricingSnapshots', pricingSnapshots),
    ...deleteChunks('products', new Set([productId])),
    auditTx({
      actorEmail: identity.email,
      action: 'delete',
      recordType: 'products',
      recordId: productId,
      oldValue: {
        slug: product.slug,
        name: product.name,
        status: product.status,
      },
      reason: 'cascade delete (product + related records)',
    }),
  ];

  await db.transact(chunks);
}

/** Remove orphaned product/affiliate rows by slug (maintenance). */
export async function deleteProductBySlug(slug: string, identity: AdminIdentity): Promise<boolean> {
  const db = getDb();
  const { products } = await (db.query as any)({
    products: { $: { where: { slug } } },
  });
  const product = products?.[0];
  if (product) {
    await deleteProductCascade(product.id, identity);
    return true;
  }

  const { affiliateLinks } = await (db.query as any)({
    affiliateLinks: { $: { where: { cloakedSlug: slug } } },
  });
  for (const link of affiliateLinks ?? []) {
    await deleteAffiliateLinkCascade(link.id, identity);
  }
  return (affiliateLinks?.length ?? 0) > 0;
}
