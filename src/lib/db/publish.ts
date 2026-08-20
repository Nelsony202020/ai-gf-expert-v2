// Publishing workflow: validation gates + product publish/unpublish +
// static rebuild trigger (Vercel deploy hook).

import { getDb } from './server';
import { env } from '../env';
import { HttpError, type AdminIdentity } from './auth';
import { auditTx } from './audit';
import { createSlugChangeRedirect } from './redirects';
import { isMissingAltText } from '../media/altText';

export interface PublishValidation {
  errors: string[]; // blocking
  warnings: string[]; // non-blocking
}

const STALE_PRICE_DAYS = 60;

/** Validate a product for publishing (per the agreed checklist). */
export async function validateProductForPublish(productId: string): Promise<PublishValidation> {
  const db = getDb();
  const { products } = await db.query({
    products: {
      $: { where: { id: productId } },
      review: { author: {}, factChecker: {} },
      subscriptionPlans: {},
      creditPackages: {},
      featureCosts: {},
      paymentProfile: {},
      affiliateLinks: {},
      media: {},
      logo: {},
      testRuns: {},
      author: {},
      factChecker: {},
    },
  });
  const product = products[0];
  if (!product) throw new HttpError(404, 'Product not found');

  const errors: string[] = [];
  const warnings: string[] = [];

  // Required product fields
  if (!product.name) errors.push('Product name is required.');
  if (!product.slug) errors.push('Slug is required.');
  if (!product.tagline) warnings.push('Tagline is empty.');
  if (!product.oneLineVerdict) errors.push('One-line verdict is required.');
  if (!product.ourTake) errors.push('"Our Take" is required.');
  if (!product.directoryDescription) warnings.push('Directory description is empty.');
  if (!Array.isArray(product.pros) || product.pros.length === 0) warnings.push('No pros listed yet.');
  if (!Array.isArray(product.cons) || product.cons.length === 0) warnings.push('No cons listed yet.');
  if (!product.websiteUrl) errors.push('Official website URL is required.');

  // Required media
  if (!product.logo) errors.push('Product logo is required.');
  const approvedMedia = (product.media ?? []).filter((m: any) => m.approved && !m.deletedAt);
  if (approvedMedia.length === 0) warnings.push('No approved media in the product gallery.');
  const missingAlt = (product.media ?? []).filter(
    (m: any) => !m.deletedAt && m.mediaType !== 'video' && isMissingAltText(m.altText),
  );
  if (missingAlt.length > 0) warnings.push(`${missingAlt.length} media item(s) missing alt text.`);

  // Active published test run
  const publishedRun = (product.testRuns ?? []).find((r: any) => r.isCurrentPublished);
  if (!publishedRun) errors.push('No published test run — publish a test run first.');

  // Pricing freshness
  const plans = (product.subscriptionPlans ?? []).filter((p: any) => p.active);
  if (plans.length === 0) {
    warnings.push('No active subscription plans recorded.');
  } else {
    const staleCutoff = Date.now() - STALE_PRICE_DAYS * 24 * 60 * 60 * 1000;
    const stale = plans.filter((p: any) => !p.lastVerifiedAt || p.lastVerifiedAt < staleCutoff);
    if (stale.length > 0) {
      warnings.push(`${stale.length} plan(s) not price-verified in the last ${STALE_PRICE_DAYS} days.`);
    }
  }
  if (!product.paymentProfile) warnings.push('No payment-methods profile recorded.');

  // Incomplete own pricing that would force borrowing another product's data
  const pricedPlans = plans.filter((p: any) => {
    const opts = Array.isArray(p.billingOptions) ? p.billingOptions : [];
    const hasNested = opts.some((o: any) => o && Number(o.price) > 0);
    const hasLegacy = Number(p.price) > 0;
    return hasNested || hasLegacy;
  });
  if (pricedPlans.length === 0) {
    errors.push(
      'Pricing data is incomplete — no priced subscription plans. Do not publish with borrowed pricing from another product.',
    );
  }

  // Affiliate link validity
  const activeLinks = (product.affiliateLinks ?? []).filter((l: any) => l.active);
  if (activeLinks.length === 0) {
    warnings.push('No active affiliate link — CTAs will fall back to the official website URL.');
  } else {
    const broken = activeLinks.filter((l: any) => l.lastCheckStatus === 'broken');
    if (broken.length > 0) errors.push(`${broken.length} active affiliate link(s) are marked broken.`);
  }

  // SEO
  if (!product.seoTitle) errors.push('SEO title is required.');
  if (!product.seoDescription) errors.push('Meta description is required.');

  // Authorship
  if (!product.author) errors.push('Author is required.');
  if (!product.factChecker) warnings.push('No fact checker assigned.');

  return { errors, warnings };
}

export async function publishProduct(productId: string, identity: AdminIdentity) {
  const { errors, warnings } = await validateProductForPublish(productId);
  if (errors.length > 0) {
    throw new HttpError(422, `Cannot publish: ${errors.join(' ')}`);
  }
  const db = getDb();
  const now = Date.now();
  await db.transact([
    db.tx.products[productId].update({
      status: 'published',
      publishedAt: now,
      updatedAt: now,
    }),
    auditTx({
      actorEmail: identity.email,
      action: 'publish',
      recordType: 'products',
      recordId: productId,
      newValue: { status: 'published' },
    }),
  ]);
  await triggerRebuild(`product ${productId} published`);
  return { warnings };
}

export async function unpublishProduct(productId: string, identity: AdminIdentity, reason?: string) {
  const db = getDb();
  const { products } = await db.query({
    products: {
      $: { where: { id: productId } },
      homepageSlots: {},
      characters: { homepageSlots: {} },
      roundupEntries: {},
    },
  });
  const product = products[0];
  if (!product) throw new HttpError(404, 'Product not found');

  const now = Date.now();
  const txs: Parameters<typeof db.transact>[0] = [
    db.tx.products[productId].update({
      status: 'draft',
      publishedInDirectory: false,
      homepageFeatured: false,
      editorsPick: false,
      updatedAt: now,
    }),
    auditTx({
      actorEmail: identity.email,
      action: 'unpublish',
      recordType: 'products',
      recordId: productId,
      reason,
    }),
  ];

  for (const slot of product.homepageSlots ?? []) {
    if (slot.active !== false) {
      txs.push(
        db.tx.homepageSlots[slot.id].update({ active: false, updatedAt: now }),
      );
    }
  }

  for (const character of product.characters ?? []) {
    if (character.featured) {
      txs.push(
        db.tx.characters[character.id].update({ featured: false, updatedAt: now }),
      );
    }
    for (const slot of character.homepageSlots ?? []) {
      if (slot.kind === 'featured_character' && slot.active !== false) {
        txs.push(
          db.tx.homepageSlots[slot.id].update({ active: false, updatedAt: now }),
        );
      }
    }
  }

  for (const entry of product.roundupEntries ?? []) {
    if (entry.included) {
      txs.push(
        db.tx.roundupEntries[entry.id].update({ included: false, updatedAt: now }),
      );
    }
  }

  await db.transact(txs);
  await triggerRebuild(`product ${productId} unpublished`);
}

/**
 * Change a published slug. Always audited; optionally auto-creates a 301
 * (offered by the UI whenever the product was published).
 */
export async function changeProductSlug(
  productId: string,
  newSlug: string,
  createRedirect: boolean,
  identity: AdminIdentity,
) {
  const db = getDb();
  const { products } = await db.query({ products: { $: { where: { id: productId } } } });
  const product = products[0];
  if (!product) throw new HttpError(404, 'Product not found');
  const oldSlug = product.slug as string;
  if (oldSlug === newSlug) return { changed: false };

  const { products: conflicts } = await db.query({
    products: { $: { where: { slug: newSlug } } },
  });
  if (conflicts.some((p: any) => p.id !== productId)) {
    throw new HttpError(409, `Slug "${newSlug}" is already in use.`);
  }

  await db.transact([
    db.tx.products[productId].update({ slug: newSlug, updatedAt: Date.now() }),
    auditTx({
      actorEmail: identity.email,
      action: 'slug_change',
      recordType: 'products',
      recordId: productId,
      oldValue: { slug: oldSlug },
      newValue: { slug: newSlug },
    }),
  ]);

  let redirect = null;
  if (createRedirect) {
    redirect = await createSlugChangeRedirect(`/reviews/${oldSlug}`, `/reviews/${newSlug}`, identity);
  }
  await triggerRebuild(`product slug changed ${oldSlug} -> ${newSlug}`);
  return { changed: true, redirect };
}

/** Trigger a static rebuild via Vercel deploy hook. Returns false if not configured. */
export async function triggerRebuild(reason: string): Promise<boolean> {
  const hook = env('VERCEL_DEPLOY_HOOK_URL') ?? '';
  if (!hook) {
    console.log(`[publish] rebuild skipped (no deploy hook configured): ${reason}`);
    return false;
  }
  try {
    await fetch(hook, { method: 'POST' });
    console.log(`[publish] rebuild triggered: ${reason}`);
    return true;
  } catch (error) {
    console.error('[publish] deploy hook failed', error);
    return false;
  }
}
