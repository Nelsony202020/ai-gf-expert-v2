# Prompt Vault — Stage 1: data model + routing

Branch `feat/prompt-vault` (off `main` a7056b4). Route `/guides/ourdream-ai-character-prompts/`.

## Figma map (file iaUwrRvpkEq7RrBpPLxA6j, page 245:4)

| Node | What |
|---|---|
| 247:5 | Vault components (Model Tag 247:27, Copy Button 247:50, Prompt Card 248:95, Category Header 249:67, Affiliate CTA 249:92, Related Guide Row 249:105, No Results 249:106, Sticky Navigation 250:190, Prompt Detail 251:229, View All Link 487:53229). 247:57 is ARCHIVED — "use Filter Chip". |
| 252:159 | 01 Desktop / Main — hero 252:194 (intro 252:195, search 252:281, filters 252:288), collection 253:264, explainer 254:1230, related + about 254:1270 |
| 488:52744 | 02 Desktop / Filter & interaction states |
| 488:52130 | 03 Desktop / Category results — Hair style prompts |
| 256:1300 | 04 Desktop / Search results ("hair") |
| 256:21608 / 488:53011 | 05 / 06 Desktop / Prompt detail (single / multiple results) |
| 257:3251 / 488:54663 / 259:23663 | Mobile main / category results / detail |
| 245:5 | Source images — 97 `card_pNNN` rects + 3 `full_pNNN` rects (all solid-grey placeholders) |
| DOC frames | 488:56297, 261:5243, 261:5355, 261:5399, 488:56158, 488:56195, 488:56246, 261:5451, 261:5494, 488:56277 |

## Data model (InstantDB, new namespaces only)

- `promptVaultFilters` — the 7 toolbar chips: Face, Eyes, Hair, Skin, Clothing, Fantasy, Styles & effects. `key` is the `?category=` value.
- `promptVaultCategories` — the 15 section headers (Face prompts … Vivid 3 face prompts), each with `group` (Appearance, Accessories & clothing, Fantasy & non-human, Styles & effects, Vivid 3 — in progress), `filter` (chip key), `description`, optional `shortTitle` (search header, e.g. "Hair styles").
- `promptVaultPrompts` — `key` (album id p008…), `title`, `promptText` (verbatim), `generator` (dreamy | vivid-1 | vivid-2 | vivid-3), `status` (draft | published), `sortOrder`; link → category.
- `promptVaultResults` — one row per tested image; `key` = image file stem, `imagePath`, `width`, `height`, `alt`, `sortOrder`; link → prompt. "2 results" = two result rows on one prompt, never two cards.
- No slug/URL fields anywhere, on purpose: there are no per-prompt or per-category pages.

Counts (chip numbers, "94 prompts", "97 example images") are computed from the rows, never typed.

## Pre-rendering — confirmed

The page has `export const prerender = true` and `output: 'static'`. `loadPromptVault()` runs once inside `astro build`; no visitor request reads the database. A new prompt appears on the next deploy.

Failure policy: on Vercel, a missing/failing/empty DB or any invalid row (duplicate key, unknown category, empty text, unknown generator) **fails the build**, so the previous deploy stays live instead of a thin vault. Off Vercel (local/sandbox without credentials) it falls back to `src/data/prompt-vault/seed.json`.

`scripts/seed-prompt-vault.ts` upserts seed.json by `key`; it never deletes, never changes a prompt's `status` after creation, never touches image fields.

## Database — done in this stage

- Schema pushed to the production InstantDB app, **additive only**: I pulled the live schema, added just the 4 `promptVault*` namespaces and 2 links, verified the diff had zero removals, and pushed that file. Nothing else changed.
- Note: `instant.schema.ts` on main differs from the live DB in 3 unrelated places (`products.productType`, index on `media.status`, `affiliateLinks.ageGate` exist in the repo but not live). Not pushed — outside this job. A plain `db:push` from main would apply them.
- Seeded 82 prompts / 85 results / 15 categories / 7 filters. Read back through the build loader: `source=instantdb`, 0 mismatches against seed.json.
- To add a prompt later: add a `promptVaultPrompts` row (status `published`) linked to its category, plus ≥1 `promptVaultResults` row linked to it, in the Instant dashboard — then redeploy. No code change. An admin screen for this can come later if you want one.

## URL / SEO

- One document for every query string; canonical is always the clean URL (`canonicalPublicUrl`).
- `?category=` accepts a chip key (face, eyes, hair, skin, clothing, fantasy, styles-effects) or a category key (e.g. hair-style-prompts, used by View all). Unknown values are dropped from the address bar with `replaceState`, showing All. Empty `?q=` is dropped. Other params (utm_*) are kept untouched.
- Back/forward restore state (popstate); reload keeps it (state is read from the URL).
- Empty search / unknown category only change what the client shows; the HTML always contains the full vault, so no thin 200 page is possible.
- Registered in the guide registry (`src/data/guides.ts`) → sitemap (`getAllSitemapEntries`), /guides/ index, search, mega menu. `check:sitemap` passes.
- Hub: added to "Prompts & Characters" on /guides/ourdream-ai/.
- Tested in a headless browser: all 82 · ?category=hair 39 · ?category=hair-style-prompts 18 · unknown → All + param stripped · ?q=zzzz → client "No prompts match" · back/forward/reload OK · no console errors.

## Open issues found in stage 1

1. **Only 82 of the 94 prompts exist in Figma.** No card carries these 12 (category is known from the album numbering): p014, p015, p016, p017 (Face) · p023, p024 (Eyes) · p076, p078 (Skin) · p087 (Neck & upper body) · p101, p103 (Ears — the header says dog and bear) · p118 (Art style — header says black and white). I need title + exact prompt text for each. Until then the page and chip counts say 82, not 94 (Face 8/12, Eyes 6/8, Skin 4/6, Clothing 6/7, Fantasy 13/15, Styles & effects 6/7).
2. **Chips vs categories.** Figma chips are 7 buckets (Hair = 39 = styles 18 + colors 14 + accessories 7), while "View all" opens one of 15 categories. Both are supported by `?category=`. The DOC example `?category=hair` on the Hair-style results frame is ambiguous — I treat `hair` as the chip (39) and `hair-style-prompts` as View all (18).
3. **Search scope.** Brief: title + prompt text. Figma DOC 261:5355 #04: "hair" matches 39 — that needs category names too (Tiara, Choker … have no "hair" in title/text). Title+text gives 32. Which one?
4. **Grid columns.** Brief: 3 per row / previews of 3. DOC 261:5243 #06 and 488:56195 #05 still say "one row of 4" / "four columns" — the frames show 3. Following the brief; DOC text looks stale.
5. **Affiliate.** DOC 261:5399 #05 says Try in OurDream is an affiliate link with rel sponsored + label. Brief overrides: plain links, no label.
6. **Nudity in full album images** (DOC 261:5243 #12: Calavera body paint, Skeletal body). Cards use crops; decide what the detail view shows.
7. **Group headers** in Figma carry "Makeup, lips, cheeks and face markings." as Description on all 5 groups — the Group variant doesn't render it, so it's ignored (not stored).
8. **Article links not added yet.** Both prompt-guide partials are heavily rewritten on the unmerged `fix/guide-images` branch (5 commits). Editing them on main now guarantees a merge conflict. I'll add the links once that branch is merged — or on top of it if you prefer.
9. Side effect of the registry entry: the "Related OurDream AI Guides" box on the Prompt Guide and Image Prompt Guide now lists the vault (same topic), and the /guides/ index and search include it.
10. Registry blurb: `description` uses the first sentence of the Figma hero intro — no Figma copy exists for the hub row. Replace if you have one.

## Images — what to supply (one batch)

- Format: WebP (or PNG/JPEG masters; I'll convert). sRGB.
- Card crop: **4:5 portrait, 1200 × 1500 px** (covers 384×481 at 3× and the detail view). The trait must be visible in the crop.
- Naming: album id = file name. `p008.webp` … one per result. Multi-result prompts use the album's consecutive ids: p045 + **p046**, p047 + **p048**, p049 + **p050**. That is 94 + 3 = 97 files.
- Optional full (uncropped) image for the detail view: `p008-full.webp` (Figma has full_p008, full_p045, full_p046). Tell me whether full images are wanted at all (see issue 6).
- Alt text: optional; if absent I'll use the prompt title.
- Upload path on Bunny: `/guides/ourdream-ai-character-prompts/<file>`; served through the existing `optimizedImageUrl` WebP transform with width/height set and `loading="lazy"` below the fold.
