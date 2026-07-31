#!/usr/bin/env npx tsx
/**
 * Full Aura AI migration: seed editorial content, media, characters, pricing,
 * category verdicts, and noindex so /reviews/aura-ai is admin-driven.
 *
 * Prerequisites: methodology + product shell from `npm run seed`
 *
 * Usage:
 *   npx tsx scripts/backfill-aura-ai-full.ts [--dry-run]
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { id } from '@instantdb/admin';

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

const dryRun = process.argv.includes('--dry-run');
const SLUG = 'aura-ai';

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

type MediaGalleryTag = 'gallery' | 'characters' | 'chat';

function filterToTags(filter: MediaGalleryTag): string[] {
  if (filter === 'characters') return ['character'];
  if (filter === 'chat') return ['chat'];
  return [];
}

async function main() {
  const { getDb } = await import('../src/lib/db/server');
  const { auraAiMediaGallery } = await import('../src/data/aura-ai-media');
  const { auraAiVerdicts, auraAiExpertOpinion } = await import('../src/data/aura-ai-verdict');

  const db = getDb();
  const now = Date.now();

  const { products } = await db.query({
    products: {
      $: { where: { slug: SLUG } },
      media: {},
      characters: { image: {}, storySlides: { media: {} } },
      affiliateLinks: {},
      subscriptionPlans: {},
      testRuns: {},
      featuredImage: {},
    },
  });

  const product = products[0] as any;
  if (!product) {
    console.error(`No ${SLUG} product in DB. Run: npm run seed`);
    process.exit(1);
  }

  const hasPublishedRun = (product.testRuns ?? []).some((r: any) => r.isCurrentPublished);
  if (!hasPublishedRun) {
    console.error(`${SLUG} has no published test run. Run: npm run seed`);
    process.exit(1);
  }

  const { fileAuraAi: staticAura } = await import('../src/data/products');

  if (!staticAura) {
    console.error('Static Aura AI product not found.');
    process.exit(1);
  }

  const overallVerdict = auraAiVerdicts.find((v) => v.id === 'overall');
  const categoryVerdicts: Record<string, unknown> = {};
  for (const v of auraAiVerdicts) {
    if (v.id === 'overall') continue;
    categoryVerdicts[v.id] = {
      headline: v.tagline ?? '',
      verdict: v.summary,
      pros: v.pros,
      cons: v.cons,
    };
  }

  const existingMedia = (product.media ?? []) as any[];
  const mediaByUrl = new Map<string, any>();
  for (const m of existingMedia) {
    if (m.url) mediaByUrl.set(String(m.url), m);
  }

  const existingChars = (product.characters ?? []) as any[];
  const charBySlug = new Map<string, any>();
  for (const c of existingChars) {
    if (c.slug) charBySlug.set(String(c.slug), c);
  }

  const chunks: any[] = [];
  let mediaCreated = 0;
  let charsCreated = 0;
  let slidesCreated = 0;

  function upsertMedia(
    url: string,
    opts: {
      mediaType: 'image' | 'video';
      altText: string;
      caption?: string;
      adult?: boolean;
      sortOrder: number;
      mediaTags?: string[];
      hero?: boolean;
      heroSortOrder?: number;
    },
  ): string {
    const existing = mediaByUrl.get(url);
    if (existing) return String(existing.id);

    const mid = id();
    mediaByUrl.set(url, { id: mid, url });
    mediaCreated += 1;

    const mediaTags = [...(opts.mediaTags ?? [])];
    if (opts.hero && !mediaTags.includes('hero')) mediaTags.push('hero');

    chunks.push(
      (db.tx as any).media[mid]
        .update({
          url,
          mediaType: opts.mediaType,
          altText: opts.altText,
          caption: opts.caption ?? opts.altText,
          adult: Boolean(opts.adult),
          ageGated: Boolean(opts.adult),
          role: 'gallery',
          mediaTags: mediaTags.length ? mediaTags : undefined,
          sortOrder: opts.sortOrder,
          heroSortOrder: opts.hero ? (opts.heroSortOrder ?? 0) : undefined,
          approved: true,
          createdAt: now,
        })
        .link({ product: product.id }),
    );
    return mid;
  }

  // --- Gallery media (Photos & Videos tab) --------------------------------
  auraAiMediaGallery.forEach((item, index) => {
    upsertMedia(item.src, {
      mediaType: item.type,
      altText: item.alt,
      caption: item.caption,
      adult: item.nsfw,
      sortOrder: index,
      mediaTags: filterToTags(item.filter),
      hero: index === 0,
      heroSortOrder: index === 0 ? 0 : undefined,
    });
  });

  // --- Extra hero gallery shots from static product -----------------------
  staticAura.gallery.forEach((g: any, index: number) => {
    if (mediaByUrl.has(g.full)) {
      const existing = mediaByUrl.get(g.full);
      if (existing?.id && index < 5) {
        chunks.push(
          (db.tx as any).media[existing.id].update({
            mediaTags: ['hero'],
            heroSortOrder: index,
          }),
        );
      }
      return;
    }
    upsertMedia(g.full, {
      mediaType: g.mediaType === 'video' ? 'video' : 'image',
      altText: g.alt,
      sortOrder: 100 + index,
      mediaTags: ['hero'],
      hero: true,
      heroSortOrder: index,
    });
  });

  const featuredUrl = staticAura.gallery[0]?.full ?? auraAiMediaGallery[0]?.src;
  let featuredMediaId: string | undefined = featuredUrl
    ? mediaByUrl.get(featuredUrl)?.id
    : undefined;
  if (featuredUrl && !featuredMediaId) {
    featuredMediaId = upsertMedia(featuredUrl, {
      mediaType: 'image',
      altText: staticAura.gallery[0]?.alt ?? 'Aura AI',
      sortOrder: 0,
      mediaTags: ['hero'],
      hero: true,
      heroSortOrder: 0,
    });
  }

  // --- Characters + story slides ------------------------------------------
  for (const [charIndex, ch] of staticAura.overview.characters.entries()) {
    const charSlug = norm(ch.name) || `character-${charIndex}`;
    let charId = charBySlug.get(charSlug)?.id as string | undefined;

    const avatarId = upsertMedia(ch.avatar, {
      mediaType: 'image',
      altText: `${ch.name} avatar`,
      caption: ch.name,
      sortOrder: 200 + charIndex,
      mediaTags: ['character'],
    });

    if (!charId) {
      charId = id();
      charBySlug.set(charSlug, { id: charId, slug: charSlug });
      charsCreated += 1;
      chunks.push(
        (db.tx as any).characters[charId]
          .update({
            name: ch.name,
            slug: charSlug,
            shortDescription: ch.archetype,
            personalityTags: ch.archetype ? [ch.archetype] : [],
            active: true,
            featured: true,
            homepageOrder: charIndex + 1,
            destinationUrl: ch.profileUrl?.startsWith('#') ? undefined : ch.profileUrl,
            createdAt: now,
            updatedAt: now,
          })
          .link({ product: product.id, image: avatarId }),
      );
    } else {
      chunks.push(
        (db.tx as any).characters[charId].update({
          featured: true,
          homepageOrder: charIndex + 1,
          updatedAt: now,
        }),
      );
    }

    const existingSlides = (charBySlug.get(charSlug)?.storySlides ?? []) as any[];
    const existingSlideUrls = new Set(
      existingSlides.map((s: any) => String(s.media?.url ?? '')).filter(Boolean),
    );

    for (const [slideIndex, slideUrl] of ch.storySlides.entries()) {
      if (existingSlideUrls.has(slideUrl)) continue;
      const slideMediaId = upsertMedia(slideUrl, {
        mediaType: 'image',
        altText: `${ch.name} story ${slideIndex + 1}`,
        sortOrder: 300 + charIndex * 10 + slideIndex,
        mediaTags: ['character'],
      });
      const slideId = id();
      slidesCreated += 1;
      chunks.push(
        (db.tx as any).characterStorySlides[slideId]
          .update({
            caption: `${ch.name} — slide ${slideIndex + 1}`,
            active: true,
            sortOrder: slideIndex,
            createdAt: now,
            updatedAt: now,
          })
          .link({ character: charId, media: slideMediaId }),
      );
    }
  }

  // --- Subscription plan --------------------------------------------------
  const plans = (product.subscriptionPlans ?? []) as any[];
  if (plans.length === 0) {
    const planId = id();
    chunks.push(
      (db.tx as any).subscriptionPlans[planId]
        .update({
          name: 'Premium',
          billingInterval: 'monthly',
          price: 12.99,
          currency: 'USD',
          billingOptions: [{ interval: 'monthly', price: 12.99, currency: 'USD', active: true }],
          active: true,
          sortOrder: 0,
        })
        .link({ product: product.id }),
    );
  }

  // --- Affiliate link -----------------------------------------------------
  const links = (product.affiliateLinks ?? []) as any[];
  const auraLink = links.find((l) => l.cloakedSlug === SLUG);
  if (auraLink) {
    chunks.push(
      (db.tx as any).affiliateLinks[auraLink.id].update({
        destinationUrl: staticAura.websiteUrl,
        active: true,
        relTags: staticAura.affiliateRel,
        lastCheckStatus: 'ok',
        notes: 'Activated by Aura AI backfill script.',
      }),
    );
  } else {
    const linkId = id();
    chunks.push(
      (db.tx as any).affiliateLinks[linkId]
        .update({
          destinationUrl: staticAura.websiteUrl,
          cloakedSlug: SLUG,
          linkType: 'product',
          active: true,
          relTags: staticAura.affiliateRel,
          lastCheckStatus: 'ok',
          clickCount: 0,
          createdAt: now,
        })
        .link({ product: product.id }),
    );
  }

  // --- Product editorial + SEO --------------------------------------------
  const productPatch: Record<string, unknown> = {
    status: 'published',
    name: staticAura.name,
    tagline: staticAura.tagline,
    websiteUrl: staticAura.websiteUrl,
    youtubeReviewUrl: staticAura.videoReview?.embedUrl,
    oneLineVerdict: overallVerdict?.tagline ?? staticAura.overallSummary,
    ourTake: overallVerdict?.summary ?? staticAura.ourTake,
    expertOpinion: auraAiExpertOpinion,
    pros: overallVerdict?.pros ?? staticAura.overview.bestForList,
    cons: overallVerdict?.cons ?? staticAura.overview.notIdealList,
    bestFor: staticAura.overview.bestForList,
    notIdealFor: staticAura.overview.notIdealList,
    mainStrength: staticAura.overview.highlights.standout,
    mainLimitation: staticAura.overview.highlights.drawback,
    bestForLabel: staticAura.overview.highlights.bestFor,
    typicalMonthlyCost: 31,
    minMonthlyPrice: 12.99,
    priceCurrency: 'USD',
    categoryVerdicts,
    seoTitle: `${staticAura.name} Review (2026) — Tested & Scored`,
    seoDescription: staticAura.tagline,
    noindex: true,
    publishedInDirectory: true,
    verified: true,
    updatedAt: now,
  };

  chunks.unshift((db.tx as any).products[product.id].update(productPatch));

  if (featuredMediaId) {
    chunks.push((db.tx as any).products[product.id].link({ featuredImage: featuredMediaId }));
  }

  console.log(dryRun ? '[dry-run] Would apply Aura AI backfill:' : 'Applying Aura AI backfill…');
  console.log(`  product patch + ${mediaCreated} new media, ${charsCreated} characters, ${slidesCreated} slides`);
  console.log(`  categoryVerdicts: ${Object.keys(categoryVerdicts).length} categories`);
  console.log(`  noindex: true`);

  if (dryRun) {
    console.log('Dry run complete — no writes.');
    process.exit(0);
  }

  for (let i = 0; i < chunks.length; i += 50) {
    await db.transact(chunks.slice(i, i + 50));
  }

  console.log('Done. Verify with: npm run diagnose:aura-ai');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
