// Migration seed: methodology tree + existing site content -> InstantDB.
//
//   npm run seed
//
// Requires .env with PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN.
// Idempotent: entities are matched by unique keys (version, slug, email)
// and skipped if they already exist.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init, id } from '@instantdb/admin';
import schema from '../../instant.schema';
import {
  METHODOLOGY_VERSION,
  categorySeeds,
  subscoreSeeds,
  evidenceDefSeeds,
} from './methodology-data';

// --- env ------------------------------------------------------------------
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* .env optional if vars already exported */
  }
}
loadEnv();

const appId = process.env.PUBLIC_INSTANT_APP_ID;
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
if (!appId || !adminToken) {
  console.error('Missing PUBLIC_INSTANT_APP_ID / INSTANT_APP_ADMIN_TOKEN in .env');
  process.exit(1);
}

const db = init({ appId, adminToken, schema });
const now = Date.now();

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

async function main() {
  // Late imports so tsx compiles site data files with their import graph.
  const { products: fileProducts } = await import('../../src/data/products');
  const { aiGirlfriendRoundup } = await import('../../src/data/roundups/ai-girlfriend');
  const { authors: fileAuthors } = await import('../../src/data/authors');
  const { featuredCharactersShowcase, findMatchGoals } = await import('../../src/data/homepage');

  // ------------------------------------------------------------------ 1. methodology version
  console.log('1) Methodology version', METHODOLOGY_VERSION);
  let { methodologyVersions } = await db.query({
    methodologyVersions: { $: { where: { version: METHODOLOGY_VERSION } } },
  });
  let mvId = methodologyVersions[0]?.id;
  if (!mvId) {
    mvId = id();
    await db.transact(
      db.tx.methodologyVersions[mvId].update({
        version: METHODOLOGY_VERSION,
        name: `AI Companion Rating Methodology ${METHODOLOGY_VERSION}`,
        status: 'active',
        createdAt: now,
        activatedAt: now,
      }),
    );
  }

  // ------------------------------------------------------------------ 2. categories / subscores / evidence definitions
  console.log('2) Methodology tree:', categorySeeds.length, 'categories,', subscoreSeeds.length, 'subscores,', evidenceDefSeeds.length, 'evidence definitions');
  const { categories: existingCats } = await db.query({
    categories: { methodologyVersion: {} },
  });
  const catIds = new Map<string, string>();
  {
    const chunks: any[] = [];
    for (const seed of categorySeeds) {
      const existing = existingCats.find(
        (c: any) => c.slug === seed.slug && c.methodologyVersion?.id === mvId,
      );
      const cid = existing?.id ?? id();
      catIds.set(seed.slug, cid);
      if (!existing) {
        chunks.push(
          db.tx.categories[cid]
            .update({
              slug: seed.slug,
              name: seed.name,
              description: seed.description,
              weight: seed.weight,
              displayOrder: seed.displayOrder,
              methodologyUrl: `/test/${seed.slug}/`,
              active: true,
            })
            .link({ methodologyVersion: mvId }),
        );
      }
    }
    if (chunks.length) await db.transact(chunks);
  }

  const { subscores: existingSubs } = await db.query({ subscores: { category: {} } });
  const subIds = new Map<string, string>(); // key: cat/sub
  {
    const chunks: any[] = [];
    for (const seed of subscoreSeeds) {
      const catId = catIds.get(seed.category)!;
      const key = `${seed.category}/${seed.slug}`;
      const existing = existingSubs.find(
        (s: any) => s.slug === seed.slug && s.category?.id === catId,
      );
      const sid = existing?.id ?? id();
      subIds.set(key, sid);
      if (!existing) {
        chunks.push(
          db.tx.subscores[sid]
            .update({
              slug: seed.slug,
              name: seed.name,
              description: seed.description,
              weight: seed.weight,
              displayOrder: seed.displayOrder,
              methodologyUrl: `/test/${seed.category}/${seed.slug}/`,
              active: true,
            })
            .link({ category: catId }),
        );
      }
    }
    if (chunks.length) await db.transact(chunks);
  }

  const { evidenceDefinitions: existingDefs } = await db.query({
    evidenceDefinitions: { subscore: {} },
  });
  const defIds = new Map<string, string>(); // key: cat/sub/def
  {
    let chunks: any[] = [];
    for (const seed of evidenceDefSeeds) {
      const subId = subIds.get(`${seed.category}/${seed.subscore}`);
      if (!subId) {
        console.warn('  ! no subscore for', seed.category, seed.subscore, seed.slug);
        continue;
      }
      const key = `${seed.category}/${seed.subscore}/${seed.slug}`;
      const existing = existingDefs.find(
        (d: any) => d.slug === seed.slug && d.subscore?.id === subId,
      );
      const did = existing?.id ?? id();
      defIds.set(key, did);
      if (!existing) {
        chunks.push(
          db.tx.evidenceDefinitions[did]
            .update({
              slug: seed.slug,
              name: seed.name,
              publicDescription: seed.publicDescription,
              internalInstructions: seed.internalInstructions,
              resultFormat: seed.resultFormat,
              measurementType: seed.measurementType,
              unit: seed.unit,
              scoringRule: seed.scoringRule,
              weight: seed.weight,
              required: seed.required,
              displayOrder: seed.displayOrder,
              methodologyUrl: `/test/${seed.category}/${seed.subscore}/`,
              active: true,
            })
            .link({ subscore: subId }),
        );
      }
      if (chunks.length >= 50) {
        await db.transact(chunks);
        chunks = [];
      }
    }
    if (chunks.length) await db.transact(chunks);
  }

  // Retired evidence — keep out of testing and scoring (no longer in methodology seeds).
  {
    const RETIRED_EVIDENCE = [{ category: 'pricing', slug: 'restrictions' }];
    const { evidenceDefinitions: defsToRetire } = await db.query({
      evidenceDefinitions: { subscore: { category: {} } },
    });
    const retireChunks: any[] = [];
    for (const def of defsToRetire as any[]) {
      const catSlug = def.subscore?.category?.slug;
      if (
        RETIRED_EVIDENCE.some((r) => r.slug === def.slug && r.category === catSlug) &&
        def.active !== false
      ) {
        retireChunks.push(db.tx.evidenceDefinitions[def.id].update({ active: false }));
      }
    }
    if (retireChunks.length) {
      await db.transact(retireChunks);
      console.log(`  deactivated ${retireChunks.length} retired evidence definition(s)`);
    }
  }

  // ------------------------------------------------------------------ 3. authors
  console.log('3) Authors');
  const { authors: existingAuthors } = await db.query({ authors: {} });
  const authorIds = new Map<string, string>();
  {
    const chunks: any[] = [];
    for (const a of Object.values(fileAuthors) as any[]) {
      const existing = existingAuthors.find((x: any) => x.slug === a.slug);
      const aid = existing?.id ?? id();
      authorIds.set(a.slug, aid);
      if (!existing) {
        chunks.push(
          db.tx.authors[aid].update({
            slug: a.slug,
            name: a.name,
            role: a.title,
            avatarUrl: a.avatar,
            bio: a.bio,
            verified: true,
            active: true,
            sortOrder: 1,
          }),
        );
      }
    }
    if (chunks.length) await db.transact(chunks);
  }
  const hermanId = authorIds.get('herman-carter');

  // ------------------------------------------------------------------ 4. products
  console.log('4) Products (published Aura AI + draft roundup picks)');
  const { products: existingProducts } = await db.query({ products: {} });
  const productIds = new Map<string, string>();

  async function upsertProduct(slug: string, fields: Record<string, unknown>, links: Record<string, string> = {}) {
    const existing = existingProducts.find((p: any) => p.slug === slug);
    if (existing) {
      productIds.set(slug, existing.id);
      return existing.id;
    }
    const pid = id();
    productIds.set(slug, pid);
    let chunk = db.tx.products[pid].update({
      slug,
      createdAt: now,
      updatedAt: now,
      dateAdded: now,
      ...fields,
    });
    if (Object.keys(links).length) chunk = chunk.link(links);
    await db.transact(chunk);
    return pid;
  }

  // 4a. Aura AI (full published product from the mock review)
  const aura = fileProducts.find((p) => p.slug === 'aura-ai');
  if (aura) {
    const auraId = await upsertProduct(
      'aura-ai',
      {
        name: aura.name,
        status: 'published',
        tagline: aura.tagline,
        websiteUrl: aura.websiteUrl,
        youtubeReviewUrl: aura.videoReview?.embedUrl,
        oneLineVerdict: aura.overallSummary,
        ourTake: aura.ourTake,
        directoryDescription: aura.tagline,
        mainStrength: aura.overview.highlights.standout,
        mainLimitation: aura.overview.highlights.drawback,
        pros: aura.overview.bestForList,
        cons: aura.overview.notIdealList,
        bestForLabel: aura.overview.highlights.bestFor,
        verified: true,
        publishedInDirectory: true,
        publishedAt: now,
        lastTestedAt: now,
        minMonthlyPrice: 9.99,
        priceCurrency: 'USD',
        seoTitle: `${aura.name} Review (2026) — Tested & Scored`,
        seoDescription: aura.tagline,
        noindex: true,
        expertOpinion: aura.expertOpinion,
        typicalMonthlyCost: 31,
        // capabilities inferred from the mock's feature specs
        capFreePlan: true,
        capNsfw: true,
        capRealisticCharacters: true,
        capAnimeCharacters: true,
        capFemaleCharacters: true,
        capMaleCharacters: true,
        capCustomCharacters: true,
        capImageGeneration: true,
        capVideoGeneration: true,
        capVoiceMessages: true,
        capVoiceCalls: true,
        capLongTermMemory: true,
        capCustomScenarios: true,
        capDiscreetBilling: true,
        capInChatImages: true,
        capTokenSystem: true,
      },
      hermanId ? { author: hermanId } : {},
    );

    // Review record
    const { reviews: existingReviews } = await db.query({ reviews: { product: {} } });
    if (!existingReviews.some((r: any) => r.product?.id === auraId)) {
      const rid = id();
      await db.transact(
        db.tx.reviews[rid]
          .update({
            intro: aura.expertOpinion,
            ourTake: aura.ourTake,
            sections: [{ id: 'verdicts', heading: 'Verdicts', items: aura.verdicts }],
            publishedAt: now,
            updatedAt: now,
          })
          .link({ product: auraId, ...(hermanId ? { author: hermanId } : {}) }),
      );
    }

    // Published test run + evidence + score snapshots (exact displayed scores)
    const { testRuns: existingRuns } = await db.query({ testRuns: { product: {} } });
    if (!existingRuns.some((r: any) => r.product?.id === auraId)) {
      const runId = id();
      const chunks: any[] = [
        db.tx.testRuns[runId]
          .update({
            name: 'Initial import (mock data — retest required)',
            status: 'published',
            isCurrentPublished: true,
            startedAt: now,
            completedAt: now,
            publishedAt: now,
            notes: 'Imported from hardcoded site data. Evidence values are the mock review values; treat as template until a real retest.',
            createdAt: now,
            updatedAt: now,
          })
          .link({ product: auraId, methodologyVersion: mvId }),
      ];

      // Evidence results matched to definitions by normalized name.
      let matched = 0;
      let unmatched = 0;
      for (const cat of aura.categories) {
        for (const sub of cat.subscores) {
          const subSlugKeyPrefix = `${cat.key}/`;
          for (const contributor of sub.contributors) {
            const defEntry = [...defIds.entries()].find(([key]) => {
              const [c, s, d] = key.split('/');
              return (
                c === cat.key &&
                norm(s) === norm(sub.name) &&
                (norm(d) === norm(contributor.label) ||
                  norm(d).includes(norm(contributor.label)) ||
                  norm(contributor.label).includes(norm(d)))
              );
            });
            if (!defEntry) {
              unmatched += 1;
              continue;
            }
            matched += 1;
            chunks.push(
              db.tx.evidenceResults[id()]
                .update({
                  rawValue: { text: contributor.value },
                  normalizedScore: contributor.internalScore ?? undefined,
                  publicResult: contributor.value,
                  testDate: now,
                  verificationStatus: 'unverified',
                  confidence: 'low',
                  updatedAt: now,
                })
                .link({ testRun: runId, evidenceDefinition: defEntry[1], product: auraId }),
            );
          }
        }
      }
      console.log(`   evidence: ${matched} matched, ${unmatched} unmatched (no definition)`);

      // Snapshots preserve the exact displayed scores.
      chunks.push(
        db.tx.scoreSnapshots[id()]
          .update({
            kind: 'overall',
            refSlug: 'overall',
            score: aura.overallScore,
            calculationVersion: 'seed-import',
            methodologyVersion: METHODOLOGY_VERSION,
            createdAt: now,
          })
          .link({ testRun: runId, product: auraId }),
      );
      for (const cat of aura.categories) {
        chunks.push(
          db.tx.scoreSnapshots[id()]
            .update({
              kind: 'category',
              refSlug: cat.key,
              score: cat.score,
              weight: cat.weight,
              calculationVersion: 'seed-import',
              methodologyVersion: METHODOLOGY_VERSION,
              createdAt: now,
            })
            .link({ testRun: runId, product: auraId }),
        );
        for (const sub of cat.subscores) {
          chunks.push(
            db.tx.scoreSnapshots[id()]
              .update({
                kind: 'subscore',
                refSlug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                parentSlug: cat.key,
                score: sub.score,
                weight: sub.weight,
                calculationVersion: 'seed-import',
                methodologyVersion: METHODOLOGY_VERSION,
                createdAt: now,
              })
              .link({ testRun: runId, product: auraId }),
          );
        }
      }
      // batch in chunks of 50
      for (let i = 0; i < chunks.length; i += 50) {
        await db.transact(chunks.slice(i, i + 50));
      }
    }
  }

  // 4b. Roundup picks as draft products (except aura which isn't in the roundup)
  for (const pick of aiGirlfriendRoundup.picks) {
    if (productIds.has(pick.slug)) continue;
    await upsertProduct(pick.slug, {
      name: pick.name,
      status: 'draft',
      tagline: pick.overallSummary,
      oneLineVerdict: pick.overallSummary,
      ourTake: pick.ourTake,
      directoryDescription: pick.intro,
      pros: pick.pros,
      cons: pick.cons,
      bestForLabel: pick.ribbon,
      publishedInDirectory: false,
      minMonthlyPrice: pick.priceMonthly,
      priceCurrency: 'USD',
      revisionNotes:
        'Imported from roundup mock data as a draft. Scores shown in the roundup are mock values — full test run required before publishing.',
    });
  }

  // ------------------------------------------------------------------ 5. affiliate links
  console.log('5) Affiliate links');
  const { affiliateLinks: existingLinks } = await db.query({ affiliateLinks: {} });
  {
    const chunks: any[] = [];
    const wanted: { slug: string; product: string }[] = [
      { slug: 'aura-ai', product: 'aura-ai' },
      ...aiGirlfriendRoundup.picks.map((p) => ({
        slug: p.affiliateUrl.split('/go/')[1] ?? p.slug,
        product: p.slug,
      })),
    ];
    const seenSlugs = new Set<string>();
    for (const w of wanted) {
      if (seenSlugs.has(w.slug)) continue;
      seenSlugs.add(w.slug);
      if (existingLinks.some((l: any) => l.cloakedSlug === w.slug)) continue;
      const pid = productIds.get(w.product);
      let chunk = db.tx.affiliateLinks[id()].update({
        destinationUrl: `https://example.com/placeholder/${w.slug}`,
        cloakedSlug: w.slug,
        linkType: 'product',
        active: false,
        lastCheckStatus: 'unchecked',
        notes: 'Imported placeholder — set the real destination and activate.',
        clickCount: 0,
        createdAt: now,
      });
      if (pid) chunk = chunk.link({ product: pid });
      chunks.push(chunk);
    }
    if (chunks.length) await db.transact(chunks);
  }

  // ------------------------------------------------------------------ 6. roundup + entries
  console.log('6) Roundup /best/ai-girlfriend');
  let { roundups } = await db.query({ roundups: {} });
  let roundupId = roundups.find((r: any) => r.slug === 'ai-girlfriend')?.id;
  if (!roundupId) {
    roundupId = id();
    let chunk = db.tx.roundups[roundupId].update({
      slug: 'ai-girlfriend',
      title: aiGirlfriendRoundup.title,
      h1: aiGirlfriendRoundup.title,
      intro: aiGirlfriendRoundup.intro,
      status: 'published',
      seoTitle: aiGirlfriendRoundup.title.slice(0, 70),
      seoDescription: aiGirlfriendRoundup.metaDescription?.slice(0, 170),
      faqs: aiGirlfriendRoundup.faq ?? [],
      rankingFormula: { metrics: [{ kind: 'overall', key: 'overall', weight: 1 }] },
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    if (hermanId) chunk = chunk.link({ author: hermanId });
    await db.transact(chunk);

    const entryChunks: any[] = [];
    aiGirlfriendRoundup.picks.forEach((pick, index) => {
      const pid = productIds.get(pick.slug);
      if (!pid) return;
      entryChunks.push(
        db.tx.roundupEntries[id()]
          .update({
            calculatedPosition: index + 1,
            publishedPosition: index + 1,
            awardLabel: pick.ribbon,
            reason: pick.overallSummary,
            included: true,
            updatedAt: now,
          })
          .link({ roundup: roundupId, product: pid }),
      );
    });
    if (entryChunks.length) await db.transact(entryChunks);
  }

  // ------------------------------------------------------------------ 7. characters + homepage slots
  console.log('7) Characters + homepage slots');
  const { characters: existingChars } = await db.query({ characters: {} });
  const { homepageSlots: existingSlots } = await db.query({ homepageSlots: {} });
  {
    const chunks: any[] = [];
    let position = 1;
    for (const c of featuredCharactersShowcase as any[]) {
      const slug = norm(c.name).slice(0, 40) || `character-${position}`;
      let charId = existingChars.find((x: any) => x.slug === slug)?.id;
      if (!charId) {
        charId = id();
        const productSlug = aiGirlfriendRoundup.picks.find(
          (p) => p.name.toLowerCase() === String(c.platform ?? '').toLowerCase(),
        )?.slug;
        const pid = productSlug ? productIds.get(productSlug) : undefined;
        let chunk = db.tx.characters[charId].update({
          name: c.name,
          slug,
          shortDescription: c.archetype,
          personalityTags: c.archetype ? [c.archetype] : [],
          active: true,
          featured: true,
          homepageOrder: position,
          createdAt: now,
          updatedAt: now,
        });
        if (pid) chunk = chunk.link({ product: pid });
        chunks.push(chunk);
      }
      if (!existingSlots.some((s: any) => s.kind === 'featured_character' && s.position === position)) {
        chunks.push(
          db.tx.homepageSlots[id()]
            .update({
              kind: 'featured_character',
              position,
              active: true,
              updatedAt: now,
            })
            .link({ character: charId }),
        );
      }
      position += 1;
    }
    // Top picks: first 3 roundup picks
    aiGirlfriendRoundup.picks.slice(0, 3).forEach((pick, index) => {
      const pid = productIds.get(pick.slug);
      if (!pid) return;
      if (existingSlots.some((s: any) => s.kind === 'top_pick' && s.position === index + 1)) return;
      chunks.push(
        db.tx.homepageSlots[id()]
          .update({
            kind: 'top_pick',
            position: index + 1,
            label: pick.ribbon,
            active: true,
            updatedAt: now,
          })
          .link({ product: pid }),
      );
    });
    findMatchGoals.forEach((label, index) => {
      if (existingSlots.some((s: any) => s.kind === 'topic' && s.position === index + 1)) return;
      chunks.push(
        db.tx.homepageSlots[id()]
          .update({
            kind: 'topic',
            position: index + 1,
            label,
            active: true,
            updatedAt: now,
          }),
      );
    });
    if (chunks.length) {
      for (let i = 0; i < chunks.length; i += 50) await db.transact(chunks.slice(i, i + 50));
    }
  }

  // ------------------------------------------------------------------ 8. owner account
  const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail) {
    const { adminUsers } = await db.query({ adminUsers: {} });
    if (!adminUsers.some((u: any) => u.email === ownerEmail)) {
      await db.transact(
        db.tx.adminUsers[id()].update({
          email: ownerEmail,
          name: ownerEmail.split('@')[0],
          role: 'owner',
          active: true,
          createdAt: now,
        }),
      );
      console.log('8) Owner account created:', ownerEmail);
    }
  }

  console.log('\nSeed complete.');
  console.log('Next: verify parity with `npm run seed:validate`, then set USE_DB_CONTENT=1.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
