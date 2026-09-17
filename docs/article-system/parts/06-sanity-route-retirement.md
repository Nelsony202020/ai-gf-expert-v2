# 06 — Retiring `src/pages/guides/[slug].astro`

**VERDICT: SAFE TO RETIRE — it emits zero pages today, and no live URL, internal link, sitemap entry or redirect target depends on it. The one condition: retire the whole Sanity guide loader path with it (or leave it inert), and do NOT remove the `/guides/:slug → /guides/:slug/` trailing-slash redirect in `vercel.json:19`, which the twelve remaining static guide routes need.**

## Evidence

1. **`getStaticPaths` is fed entirely by Sanity, and Sanity returns nothing.**
   `src/pages/guides/[slug].astro:10` is `return guides.map((g) => ({ params: { slug: g.slug } }));`, where `guides` is `src/data/guides.ts:6` — `export const guides: GuideSummary[] = await listGuides();`.
   `src/lib/sanity/guides.ts:51` short-circuits: `if (!isSanityConfigured()) return [];`, and `src/lib/sanity/client.ts:9` defines that as `Boolean(env('PUBLIC_SANITY_PROJECT_ID'))`.
   With that variable unset, `getStaticPaths` returns `[]` and Astro emits **zero** HTML files for the route. The `catch` at `src/lib/sanity/guides.ts:56-59` also degrades to `[]`, so even a configured-but-failing Sanity yields no pages rather than a build error.

2. **If Sanity is configured later, the route wakes up.** `listGuides()` would return every `*[_type == "guide" && defined(slug.current)]` document (`src/lib/sanity/guides.ts:54`) and the route would prerender one page per slug, calling `getGuide()` (`[slug].astro:14`) and `extractGuideFaqs()` (`:22`). Note the route's `Astro.redirect('/404')` at `:16-18` is unreachable in practice — a slug only reaches it because `listGuides()` returned it.

3. **Static sibling routes already shadow the dynamic one.** `src/pages/guides/` contains twelve concrete `.astro` files (`candy-ai`, `girlfriend-gpt`, `girlfriendgpt`, `how-to-choose-an-ai-girlfriend-app`, `how-to-use-ourdream-ai-image-generator`, `index`, `juicychat-ai`, `nectar-ai`, `ourdream-ai`, `ourdream-ai-comics`, `ourdream-ai-image-prompt`, `ourdream-ai-prompt`, `preview`). Astro gives static segments priority over `[slug]`, so every currently-linked `/guides/…` URL is already served by a named file, never by `[slug].astro`.

4. **Sanity is not configured in production, as far as the repo can tell.**
   - `astro.config.mjs:20-21,26-28` declare all five Sanity vars, every one `optional: true`.
   - `vercel.json:41-45` sets only `PUBLIC_SITE_URL`, `PUBLIC_CDN_URL`, `BUNNY_CDN_HOSTNAME` — no Sanity var.
   - `.env.example:65` is `PUBLIC_SANITY_PROJECT_ID=` (empty); no `.env` is committed (only `.env.example` exists at repo root).
   - Corroborated by the live build: the production `sitemap-guides.xml` contains exactly the five hard-coded pushes from `src/lib/sitemap.ts:162-200` and nothing from the Sanity loop at `src/lib/sitemap.ts:211-222`. That loop emitting zero rows is direct evidence `listGuides()` returned `[]` in the production build.
   (Caveat: a Vercel dashboard env var would not be visible in the repo. The live sitemap is what makes this conclusive, not the config files.)

5. **Every consumer of the loader, and what removal costs.**

   | Reference | Lines | Breaks if `[slug].astro` + `src/data/guides.ts` are removed? |
   |---|---|---|
   | `src/lib/sitemap.ts` | `:12` import, `:202-208` `hardcodedGuideSlugs`, `:211-222` loop | Compile error on the import only. The loop is a no-op today; deleting it changes no sitemap output. |
   | `src/pages/guides/index.astro` | `:6` import, `:70-71` merge | Compile error on the import only. `allGuides` (`:71`) is `staticGuides` plus an always-empty filter, so the rendered hub is unchanged. |
   | `src/lib/guides/brandGuideHub.ts` | `:4` import, `:147-159` loop in `collectBrandHubGuides`, `:201` `publishedGuideCount` | Compile error on the import only. The loop contributes zero items; every brand hub currently shows just the review card (`:138-145`). |
   | `src/pages/guides/preview.astro` | `:10`, `:24` `getGuide(slug, true)` | Independent of `[slug].astro` and of `src/data/guides.ts`. Only breaks if `src/lib/sanity/guides.ts` is deleted too. It is SSR (`:4`) and 401s without `SANITY_PREVIEW_SECRET` (`:13-19`), so it is already dead in production. |
   | `src/components/guides/GuideArticle.astro` | `:3-4`, `:12` `renderGuideBody` | Imported only by `[slug].astro:5` and `preview.astro:9`. Orphaned once both go. |
   | `src/pages/api/webhooks/sanity.ts` | `:34` `type !== 'guide'`, `:47-52` `createSlugChangeRedirect('/guides/…')`, `:60` rebuild | Does not import the loader — nothing breaks at build. But it would be a live SSR endpoint creating 301s to `/guides/<slug>` URLs no route serves. See Risks. |
   | `src/lib/seo/urlRegistry.ts` | `:726-770` Sanity block, `:738` `sourceFile: 'src/pages/guides/[slug].astro'` | Guarded by `isSanityConfigured()` (`:726`), so it is skipped today. `:738` becomes a stale pointer to a deleted file (cosmetic, admin SEO table only). |
   | `src/components/admin/pages/seo/registry.ts` | `:92,:99,:104` `'sanity'` source labels/filter | Purely presentational; the comment at `:95` already says the filter is hidden when no Sanity content exists. |
   | `src/lib/seo/urlRegistryTypes.ts` | `:3` `RegistrySource` union includes `'sanity'` | Type-only; harmless either way. |
   | `src/lib/db/redirects.ts` | `:165-166` `if (guideMatch) return true; // owned by Sanity` | Not a build dependency. It makes `destinationExists()` accept any `/guides/<slug>/` target unconditionally — see Risks. |
   | `studio/` (8 files: `sanity.config.ts`, `sanity.cli.ts`, `schemaTypes/guide.ts`, `guideAuthor.ts`, `objects.ts`, `index.ts`, `README.md`, `package.json`) | `schemaTypes/guide.ts:9,24` defines the `guide` type and documents "URL: `/guides/[slug]`" | Separate npm package, not part of the site build. Nothing breaks; it simply becomes a CMS with no front end. |

6. **Internal links.** Grepping `src/` and `public/` for `/guides/<something>/` yields only the twelve static routes above plus asset directories under `public/guides/` (`hub/`, `brand/`, `how-to-choose/`, `ourdream-ai-comics/`, `ourdream-ai-image-generator/`, `ourdream-ai-image-prompt-guide/`, `ourdream-ai-prompt-guide/`, and three `.png` files) — those are image paths, not pages. The only non-page-backed occurrence is a UI placeholder string `/guides/example-guide` at `src/components/admin/review/DynamicBlockNode.tsx:398`. **No internal link anywhere resolves through `[slug].astro`.**

7. **Build gate is untouched.** `scripts/check-sitemap-coverage.ts:50` is `if (rel.includes('[')) return null;` — every bracketed route is excluded from the check before `IGNORED_ROUTES` is even consulted. `[slug].astro` is therefore invisible to `npm run check:sitemap` (wired into `build` at `package.json:10`), and deleting it cannot break the gate. `IGNORED_ROUTES` (`:25-30`) lists `/guides/preview/`, `/guides/ourdream-ai-prompt-guide/` and `/guides/girlfriend-gpt/` — it never mentions `[slug]`. (`/guides/ourdream-ai-prompt-guide/` at `:27` is already stale: no such page file exists.)

8. **Redirect obligation: nothing is orphaned.**
   - `vercel.json:19` `/guides/:slug → /guides/:slug/` is a generic trailing-slash normalizer serving the twelve static routes; `vercel.json:28` does the same for `/guides`. Both must stay.
   - No `vercel.json` redirect targets a Sanity-only path.
   - The in-repo redirect seeds all point at `/guides/ourdream-ai/` (`scripts/seed-youtube-affiliate-redirects.ts:30,37,50,56,63`), served by `src/pages/guides/ourdream-ai.astro`.
   - `src/pages/guides/girlfriend-gpt.astro:3` 301s to `/guides/girlfriendgpt/`, served by `girlfriendgpt.astro`.
   - The InstantDB `redirects` entity (`instant.schema.ts:787-796`, read by `src/lib/db/redirects.ts:208` `findRedirect` via `src/pages/[...fallback].ts:18`) cannot be inspected from the repo. But since `[slug].astro` has never produced a page, any `/guides/…` destination stored there must already resolve to one of the twelve static routes or already be broken — retiring the route cannot newly orphan one.

## Live `/guides/` URLs and what serves them

Fetched with WebFetch. `https://aigirlfriend.expert/sitemap.xml` is a sitemap index (`src/lib/sitemap.ts:399-405`) listing five children; the `/guides/` URLs live in `sitemap-guides.xml` and `sitemap-pages.xml`.

| Live URL | Child sitemap | Route file that serves it | Depends on `[slug].astro`? |
|---|---|---|---|
| `https://aigirlfriend.expert/guides/` | `sitemap-pages.xml` | `src/pages/guides/index.astro` | No |
| `https://aigirlfriend.expert/guides/how-to-choose-an-ai-girlfriend-app/` | `sitemap-guides.xml` | `src/pages/guides/how-to-choose-an-ai-girlfriend-app.astro` | No |
| `https://aigirlfriend.expert/guides/ourdream-ai-comics/` | `sitemap-guides.xml` | `src/pages/guides/ourdream-ai-comics.astro` | No |
| `https://aigirlfriend.expert/guides/how-to-use-ourdream-ai-image-generator/` | `sitemap-guides.xml` | `src/pages/guides/how-to-use-ourdream-ai-image-generator.astro` | No |
| `https://aigirlfriend.expert/guides/ourdream-ai-image-prompt/` | `sitemap-guides.xml` | `src/pages/guides/ourdream-ai-image-prompt.astro` | No |
| `https://aigirlfriend.expert/guides/ourdream-ai-prompt/` | `sitemap-guides.xml` | `src/pages/guides/ourdream-ai-prompt.astro` | No |

Six live `/guides/` URLs, all served by named static files. `sitemap-methodology.xml` and `sitemap-roundups.xml` contain no `/guides/` URLs (`childSitemapFor`, `src/lib/sitemap.ts:363-371`, routes guide-section entries only to `guides` or `pages`).

Not in the live sitemap but reachable: the brand hubs `/guides/candy-ai/`, `/guides/nectar-ai/`, `/guides/girlfriendgpt/`, `/guides/juicychat-ai/` (`defaultNoindex: true`, `src/lib/guides/brandGuideHub.ts:60,73,…`, excluded at `src/lib/sitemap.ts:157-158`); `/guides/girlfriend-gpt/` (301 alias); `/guides/preview/` (401 without the secret). `/guides/ourdream-ai/` is pushed at `src/lib/sitemap.ts:138-144` but is absent from the live `sitemap-pages.xml`, which means an admin page override (`excludePaths`/`noindexPaths`, `src/lib/sitemap.ts:391-392`) is suppressing it in production — unrelated to this retirement, but worth a separate look.

## What must change

1. Delete `src/pages/guides/[slug].astro`.
2. Delete `src/data/guides.ts`.
3. `src/lib/sitemap.ts` — remove the import at `:12` and the dead Sanity loop at `:210-222`; the `hardcodedGuideSlugs` set at `:202-208` becomes unused and goes with it. Leave the five hard-coded pushes at `:162-200` exactly as they are — they are what produces the live `sitemap-guides.xml`.
4. `src/pages/guides/index.astro` — remove the import at `:6`, drop `staticSlugs` at `:70`, and replace `:71` with `const allGuides = staticGuides;`.
5. `src/lib/guides/brandGuideHub.ts` — remove the import at `:4` and the loop at `:147-159`. `publishedGuideCount` (`:201`) then reports 0 for every brand hub, which is what it already reports.
6. Delete `src/pages/guides/preview.astro` and `src/components/guides/GuideArticle.astro` (the latter has no other importer).
7. Delete `src/lib/sanity/guides.ts` and `src/lib/sanity/client.ts`, and the now-empty `src/lib/sanity/` directory.
8. Delete `src/pages/api/webhooks/sanity.ts`, and disable the corresponding webhook in the Sanity project (see `studio/README.md:35`). Leaving this endpoint live after the route is gone is the single most dangerous leftover.
9. `src/lib/seo/urlRegistry.ts` — remove the Sanity block at `:725-770`, its `sanityQuery`/`isSanityConfigured` imports, and the `/guides/preview/` `CODE_PAGES` row at `:98`.
10. `scripts/check-sitemap-coverage.ts` — drop `/guides/preview/` from `IGNORED_ROUTES` (`:26`) once `preview.astro` is gone, and while there, drop the already-stale `/guides/ourdream-ai-prompt-guide/` (`:27`). Both are cosmetic; the gate passes either way.
11. `astro.config.mjs` — remove the five Sanity fields at `:20-21` and `:26-28`. `.env.example` — remove the block at `:64-74`.
12. `src/lib/db/redirects.ts:165-166` — either delete the `guideMatch` branch (so `/guides/…` destinations are validated against real routes) or replace it with a check against the static guide slugs. Leaving `return true` means the admin will keep accepting redirects to `/guides/` URLs that 404.
13. `src/components/admin/pages/seo/registry.ts:92,99,104` and `src/lib/seo/urlRegistryTypes.ts:3` — drop the `'sanity'` source once nothing produces it.
14. Delete the `studio/` directory (8 files) in the same change, or add a `DEPRECATED` note at its top. Do not leave a working Studio pointed at a site that ignores it.
15. **Do not touch** `vercel.json:19` and `vercel.json:28`.

## Risks

- **Someone configures Sanity afterwards.** Setting `PUBLIC_SANITY_PROJECT_ID` in Vercel after step 1 makes `listGuides()` return documents again while no route consumes them. If steps 3-5 were done, that is silent and harmless; if only `[slug].astro` was deleted, `src/lib/sitemap.ts:211-222` would start publishing `/guides/<slug>` URLs to Google for pages that 404. **Steps 3, 4 and 5 are not optional cleanup — they are the safety.**
- **The webhook is the sharp edge.** `src/pages/api/webhooks/sanity.ts:47-52` writes real 301 rows into InstantDB pointing at `/guides/<newSlug>`, and `src/lib/db/redirects.ts:165-166` returns `true` for any `/guides/<slug>/` destination, so `validateRedirect` will not catch a dangling target. A slug change in a still-connected Studio would create a live 301 to a 404. Steps 8 and 12 close this.
- **Slug shadowing is already latent.** A Sanity guide with the slug `candy-ai`, `ourdream-ai`, `preview`, etc. has never been reachable — the static file wins. Anyone who believed those URLs were CMS-driven was wrong before this change too.
- **`studio/` left behind.** An editor can publish a `guide` document (`studio/schemaTypes/guide.ts:9`) whose description still promises "URL: `/guides/[slug]`" (`:24`) and see nothing appear on the site, with no error anywhere. This is a people problem, not a build problem, and step 14 is the fix.
- **A new article system claiming `/guides/[slug]`.** This is the real motive for retirement: a replacement dynamic route at the same path cannot coexist with `[slug].astro`. Retire first, then add — and remember the twelve static files in `src/pages/guides/` will keep shadowing any new dynamic route at those slugs.
- **Unverifiable from the repo:** the contents of the InstantDB `redirects` table, and whether a Sanity env var is set in the Vercel dashboard. The live sitemap evidence (finding 4) makes the second effectively answered; the first should be spot-checked in the admin redirect manager before merging, filtering for `/guides/` destinations.
