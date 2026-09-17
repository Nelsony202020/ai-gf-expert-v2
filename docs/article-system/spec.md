# Article System — Specification (Step 1 deliverable)

**Branch:** `feat/article-system-figma`
**Figma:** file `iaUwrRvpkEq7RrBpPLxA6j` — page `02 · Article Components` (`87:8`), section `Article & guide system — current` (`151:2098`), subsection `Article Patterns` (`277:3837`)
**Scope:** `/guides/*` only. No review pages, no Full Review tab, no roundup, no homepage, no global header.
**Status:** awaiting sign-off. No CSS, no components, no tokens written yet.

This file is the contract. The per-pattern measurements live in `docs/article-system/parts/`:

| File | Contents |
|---|---|
| `parts/00-repo-audit.md` | What exists in the repo today — output mode, tokens, fonts, guide routes, content sources, build-time data, CSS payload, risks |
| `parts/10-callouts.md` | Tip, Important, Quick Answer, What I Learned, Key Takeaway, My Take + intensity ladder table |
| `parts/20-prompts.md` | Prompt (Text/Code), Prompt Comparison, Prompt Structure, Prompt + Result + differentiation table |
| `parts/30-process.md` | Workflow Step, Step-by-Step Workflow (10 variants), Horizontal Process + the verbatim usage annotation |
| `parts/40-evidence.md` | AIGE Test (1–4 results × 2 viewports), Result Tile, Image + Caption, Comparison A/B |
| `parts/50-shell-and-nav.md` | Article Header, In This Guide TOC, TOC Item, Jump to Section, FAQ Item, Related Guides + measured page shell |
| `parts/60-reference-and-sources.md` | Reference Cheat Sheet, Cheat Sheet Group, External Example Link, Source Row, Sources, Citation Marker |
| `parts/70-usage-notes.md` | Every Doc / Usage Note transcribed verbatim — what / use for / do not use for |

---

## 1. Confirmations

**Pre-rendered — confirmed.** `astro.config.mjs:47` is `output: 'static'` with the Vercel adapter; pages are prerendered unless they opt out with `export const prerender = false`. The InstantDB admin SDK is called from page frontmatter, so on a static page the read happens at build time. The new article and hub routes will be prerendered and will read InstantDB in `getStaticPaths` / frontmatter. `INSTANT_APP_ADMIN_TOKEN` + `PUBLIC_INSTANT_APP_ID` must be present in the Vercel **build** environment — they already are, because prerendered review and roundup pages depend on them today.

**Not in scope, and untouched:** the five SSR routes under `src/pages/guides/` (`candy-ai`, `girlfriendgpt`, `juicychat-ai`, `nectar-ai`, `preview`), `src/pages/guides/index.astro`, and everything outside `/guides/*`.

**Tokens are additive.** Nothing existing is renamed, changed or removed. Section 4 lists the additions; section 11 lists tokens that look wrong, as a separate job for later.

---

## 2. Three corrections to the brief

These change what gets built, so they need a decision before step 2. Nothing here is a re-diagnosis of the design problem — it is what the repo actually contains.

**2.1 An article system already exists in code, and the Comics page uses it.**
`src/styles/ourdream-article.css` (29 KB) + `src/components/guides/ourdream/OurDreamArticlePage.astro` + `ourdream-article.client.ts` implement a two-column shell, sticky TOC, mobile jump menu, related guides, copy-to-clipboard and prompt expand/collapse. `src/content/guides/ourdream-ai-comics.html` (77 KB, hand-authored, imported `?raw`) already carries a de-facto block vocabulary: `od-block--important / --key-takeaway / --tip / --what-i-learned / --aige-test`, `od-steps`, `od-setup`, `od-ab`, `od-prompt`, `od-prompt-compare`, `od-structure`, `od-chip`, `od-faq`, `od-compare-grid`, `od-copy`.

So "renders as unstyled prose" is not what the source says should happen. Either the page is visually wrong rather than unstyled, or something regressed. **I need to see it on the preview before step 3** — otherwise I'd be rebuilding a shell that already works and throwing away working behaviour. Question Q1.

**2.2 Three of the four designed articles and the hub already have routes.**

| Figma design | Existing route | Source |
|---|---|---|
| Article — OurDream AI Comics | `/guides/ourdream-ai-comics/` | `src/content/guides/ourdream-ai-comics.html` |
| Article — OurDream AI Prompt Guide | `/guides/ourdream-ai-prompt/` | `ourdream-ai-prompt-guide.html` |
| Article — Image Prompt Guide | `/guides/ourdream-ai-image-prompt/` | `ourdream-ai-image-prompt-guide.html` |
| Article — Image Generator | `/guides/how-to-use-ourdream-ai-image-generator/` | `ourdream-ai-image-generator.html` |
| Guides Hub | `/guides/ourdream-ai/` | `src/data/ourdream-guide-hub.ts` + `OurDreamGuideHub.astro` |

All five are live and prerendered. So steps 5 and 6 are **migrations of published URLs**, not new pages — which means slug preservation and no 404 window. Question Q2.

**2.3 `/guides/<slug>` is already owned by a Sanity route.**
`src/pages/guides/[slug].astro` builds its paths from `await listGuides()` (Sanity). A new InstantDB-driven `/guides/[slug]` would collide with it. Today the collision is invisible only because `listGuides()` returns `[]` when Sanity is unconfigured. Question Q3.

---

## 3. Fonts

| | Figma | Code today |
|---|---|---|
| Headings | **Bricolage Grotesque** (`Article/H2`, `Heading/XS…XL`) | Hanken Grotesk — `--font-display` in `src/styles/global.css`, applied to `h1`–`h6` in `@layer base` |
| Body | Inter | Inter (`--font-sans`) ✅ |
| Mono | **Geist Mono** (`Article/Code` 14/23) | JetBrains Mono (`--font-mono`) |

Good news: **Bricolage Grotesque is already a dependency** and already imported for every page — `@fontsource-variable/bricolage-grotesque/standard.css` in `src/layouts/BaseLayout.astro:23-28`. It is used today only as a per-scope override (`--home-display`, `--fr-display`) and, in `ourdream-article.css`, only as a *fallback* behind `--font-display` — which is why guide headings currently render in Hanken Grotesk. No new package is needed; this is a token change inside the article scope.

Plan for step 2:
- Set the article scope's display family to Bricolage Grotesque Variable explicitly (not as a fallback). Scoped to the article root class, so no other page's headings change.
- Preload: `BaseLayout` preloads exactly one font file (Hanken), chosen because the review-page LCP element is the `<h1>`. On a guide page the `<h1>` will now be Bricolage, so the preload is wrong for guides and right for reviews. Question Q4.
- Geist Mono: absent, and it is the only new dependency the design implies. Question Q5.

---

## 4. Tokens to add

Every value below already exists in the repo by value, under five or six different prefixes (`--od-*`, `--hub-*`, `--home-*`, `--fr-*`, `--rs-*`, `--rft-*`), and **no Figma name collides with anything**. So the additive rule is easy to honour: a new scoped block on the article root, named after Figma, with zero renames.

Proposal: `--art-*` on `.aige-article` (the established convention — this is exactly how `--od-*`, `--hub-*` and `--home-*` already work). Not added to Tailwind `@theme`, because a name clash there silently regenerates utilities site-wide.

| Figma token | Value | New token | Already in repo as |
|---|---|---|---|
| `surface/page` | `#f9f9f9` | `--art-page` | `--od-page`, `--color-background` |
| `surface/card` | `#ffffff` | `--art-card` | `--hub-card`, `--od-white` |
| `surface/sunken` | `#efefed` | `--art-sunken` | `--home-sunken` (only place) |
| `surface/ink` | `#141317` | `--art-ink` | `--od-ink`, `--hub-ink` |
| `border/hairline` | `#e6e6e3` | `--art-hairline` | `--od-hairline` |
| `border/strong` | `#d2d2ce` | `--art-rule` | `--od-rail` (3 occurrences repo-wide) |
| `text/primary` | `#141317` | `--art-text` | same hex as `surface/ink`, no token distinguishes them |
| `text/secondary` | `#55545b` | `--art-secondary` | `--od-muted` |
| `text/muted` | `#8a8991` | `--art-muted` | `--od-dim` |
| `text/on-ink` | `#f7f7f6` | `--art-on-ink` | `--hub-on-ink` |
| `action/pink` | `#db2777` | `--art-pink` | `--od-pink`, `--color-accent` |
| `action/pink-press` | `#be185d` | `--art-pink-press` | `--od-pink-ink` |
| `action/pink-soft` | `#fce7f3` | `--art-pink-soft` | `--od-pink-soft` |
| `score/mid` | `#e8760a` | `--art-score-mid` | `--od-orange-ink` |
| `score/mid-soft` | `#ffedd5` | `--art-score-mid-soft` | `--od-orange-soft` |
| `score/low` | `#dc2626` | `--art-score-low` | `--home-low` |
| `Elevation/Card` | `0 1px 2px #3B2A1E0F, 0 8px 24px -4px #3B2A1E0F` | `--art-shadow-card` | no shadow tokens exist at all |
| `Elevation/Float` | `0 4px 8px #15111A1A, 0 24px 48px -8px #15111A29` | `--art-shadow-float` | `--hub-float` (close but not identical) |

Layout tokens: `--art-column: 740px`, `--art-breakout: 960px`, `--art-rail: 240px`, `--art-gutter: 80px`, `--art-mobile: 350px`.

Not in the Figma variable set but needed, because the score chip on the hub uses them: `score/high` `#16a34a` and `score/high-soft` `#dcfce7` exist in code (`--home-high`, `--rft-score-high`) and the band logic is already centralised in `src/lib/ratings/figmaScoreTone.ts` (`>=8` high, `>=5` mid, else low). Reuse that function; don't reimplement.

**Dark mode is mandatory.** Every page-scoped sheet in this repo ships a `[data-theme='dark']` override block and `dark-mode.css` is imported last with heavy `!important`. The Figma file has no dark variants for any article pattern. Question Q6.

---

## 5. Pattern inventory → block type map

24 Figma components. Each authored block type maps 1:1 onto one Figma component. Four components are **fixed sections** (their placement is dictated by the canonical ending, so an author cannot move them) and three are **atoms** that only exist nested inside a parent block.

### Authored blocks (21)

| # | Block `type` | Figma component | Node (desktop / mobile) | Width |
|---|---|---|---|---|
| 1 | `paragraph` | — (prose primitive) | `Article/Body Desktop` 18/31 · `Article/Body Mobile` 17/28 | column |
| 2 | `h2` | — (prose primitive) | `Article/H2 Desktop` 32/40 · `Article/H2 Mobile` 26/32 | column |
| 3 | `h3` | — (prose primitive) | `Heading/XS` 17/22 | column |
| 4 | `bulletList` | — (prose primitive) | | column |
| 5 | `numberedList` | — (prose primitive) | | column |
| 6 | `figure` | Article / Image + Caption | `154:2491` / `154:2494` | column · breakout |
| 7 | `tip` | Article / Tip | `151:2101` / `151:2108` | column |
| 8 | `important` | Article / Important | `151:2116` / `151:2124` | column |
| 9 | `quickAnswer` | Article / Quick Answer | `151:2133` / `151:2140` | column |
| 10 | `whatILearned` | Article / What I Learned | `151:2148` / `151:2156` | column |
| 11 | `keyTakeaway` | Article / Key Takeaway | `151:2165` / `151:2174` | column |
| 12 | `myTake` | Article / My Take | `309:5185` / `309:5192` | column |
| 13 | `prompt` | Article / Prompt | Text `154:2295` / `154:2307` · Code `154:2319` / `154:2332` | column |
| 14 | `promptComparison` | Article / Prompt Comparison | `308:4204` / `308:4227` | column |
| 15 | `promptStructure` | Article / Prompt Structure | `308:4251` / `308:4295` | column |
| 16 | `promptResult` | Article / Prompt + Result | side-by-side `309:4222` · stacked `309:4238` / `309:4253` | column |
| 17 | `stepWorkflow` | Article / Step-by-Step Workflow (+ Workflow Step) | `278:4831` set, 10 variants · atom `277:3838` / `277:3852` | column · breakout |
| 18 | `aigeTest` | Article / AIGE Test | 1–4 results `153:2115` `153:2161` `153:2218` `153:2286` / `153:2365` `153:2410` `153:2466` `153:2533` | column |
| 19 | `comparisonAB` | Article / Comparison A/B | `154:2450` / `154:2470` | column |
| 20 | `cheatSheet` | Article / Reference Cheat Sheet (+ Cheat Sheet Group) | `309:4842` / `309:4866` · atom `309:4639` | column |
| 21 | `externalExamples` | Article / External Example Link | `348:4279` / `348:4287` | column |

### Fixed sections — rendered from guide fields, not authorable as blocks

| Section | Figma component | Node | Why fixed |
|---|---|---|---|
| Article header | Article / Header | `158:2532` / `158:2551` | Always first; built from title, dek, author, dates, read time, breadcrumb |
| In this guide (TOC) | Article / In This Guide (TOC) · TOC Item · Jump to Section | `158:2580` · `158:2571` `158:2575` · `158:2607` `158:2614` | Derived from the `h2` blocks; never authored |
| FAQ | Article / FAQ Item | `158:2636` `158:2642` `158:2648` `158:2654` | Canonical ending puts FAQ after the body, before Sources |
| Sources | Article / Sources (+ Source Row) | `358:4352` / `358:4406` · atom `358:4288` / `358:4297` | Canonical ending; numbered by first citation appearance, so it must be generated |
| Related guides | Article / Related Guides | `158:2661` / `158:2686` | Canonical ending; last child before the footer |

**Canonical ending, enforced by the renderer, not by the author:** body → FAQ → Sources (if any) → Related guides → "Explore all OurDream AI guides →" → global footer. Nothing commercial between Related guides and the footer. The end-of-article product CTA is deprecated and archived — no score, Visit or Read review block at the bottom of a guide.

### Atoms — nested only

| Atom | Figma | Parent |
|---|---|---|
| Article / Workflow Step | `277:3838` / `277:3852` | `stepWorkflow` |
| Article / Result Tile | `152:2110` `152:2121` `152:2132` `152:2143` `152:2154` | `aigeTest` |
| Article / Cheat Sheet Group | `309:4639` | `cheatSheet` |
| Article / Citation Marker | `359:4297` / `359:4303` | inline mark inside rich text |
| Article / Source Row | `358:4288` / `358:4297` | Sources section |

### Deliberate merges

- **Horizontal Process is not its own block type.** `349:15054` is a desktop-only, 960px-wide presentation of the same ordered steps, and the annotation says the same content on mobile uses Step-by-Step Workflow. So it is `stepWorkflow` with `display: 'horizontal'`, which falls back to the vertical rail below the breakout breakpoint. One content shape, two presentations — an author cannot create a horizontal process that has no mobile form.
- **The six callouts stay six types, not one `callout` with a `tone`.** They are structurally different (My Take has an avatar and attribution, Key Takeaway has a pink accent bar, the tinted two have no border at all), and the whole point of the ladder is that they are not interchangeable. One type with a tone dropdown is exactly how an author ends up putting a background, border, icon and badge on every paragraph — the failure state the composition rules name. Six types also give the future block editor six distinct entries with their own "use for / do not use for" copy, which `parts/70-usage-notes.md` already has verbatim.

---

## 6. Content model

Mirrors the shape that already ships on `/reviews/*` — `src/lib/validation/schemas.ts:160-188` (`REVIEW_BLOCK_TYPES` + `reviewBlockSchema`) rendered by `src/lib/review/renderReviewBlocks.ts`. Same `{ id, type, data }` envelope, same server-validated whitelist, same "no raw HTML, no scripts, no arbitrary styling" rule. Reusing that lineage means the audit/publish/revisions machinery and the TipTap editor patterns transfer instead of being reinvented.

### 6.1 InstantDB — new entities

No `guides`, `articles`, `blocks` or `sections` entity exists today. Two new entities:

**`guideArticles`**

| Field | Type | Notes |
|---|---|---|
| `slug` | string, unique, indexed | URL segment, e.g. `ourdream-ai-comics` |
| `brandSlug` | string, indexed | `ourdream-ai` — which brand hub owns it |
| `categorySlug` | string, indexed | `start-here` \| `create-customize` \| `images-video-comics` \| `dreamcoins-pricing` |
| `title` | string | SEO / card title |
| `h1` | string | On-page heading; may differ from `title` |
| `dek` | string | One-line standfirst under the H1 |
| `blocks` | json | `GuideBlock[]` — the ordered typed-block document |
| `sources` | json | `GuideSource[]`, in first-appearance order |
| `faqs` | json | `{ id, question, answer }[]` |
| `relatedSlugs` | json | `string[]`, manually ordered |
| `heroImageId` | string | ref into `media` |
| `authorId` | string | ref into `authors` (Herman Carter) |
| `status` | string | `draft` \| `published` |
| `publishedAt`, `updatedAt` | date | |
| `seoTitle`, `seoDescription`, `canonicalUrl`, `noindex` | | same convention as `roundups` |
| `hubOrder` | number | manual ordering inside its category |
| `revisions` | json | `[{ savedAt, savedBy, blocks }]` — same as `reviews.revisions` |
| `lastEditedBy`, `lastEditedAt` | | same as `reviews` |

**`guideHubs`** — so the hub is data, not a TypeScript module: `brandSlug` (unique), `title`, `heroDescription`, `productSlug` (into `products`, for the score and the sticky CTA), `categories` json `[{ slug, title, description, order }]`, `startHereSlugs` json, `status`, `publishedAt`, SEO fields.

Two rules from the Figma documentation that belong in the data layer, not the template: never invent articles — a guide appears only when it is published, assigned to a category and manually ordered; and counts always reflect live articles, so "View all N guides" only renders when extra published guides really are hidden.

### 6.2 The block envelope

```ts
type GuideBlock = {
  id: string;                    // 1..60 chars, stable across edits
  type: GuideBlockType;          // one of the 21
  width?: 'column' | 'breakout'; // only on figure and stepWorkflow; default column
  data: object;                  // shape determined by type
};
```

Identical to `reviewBlockSchema` apart from `width`. Validated server-side against a zod discriminated union on `type` — an unknown type is rejected on write, and skipped with a build warning on read, so a schema rollback never breaks a build.

### 6.3 Rich text

Anywhere an author writes a sentence, the value is a **constrained inline document**, not an HTML string:

```ts
type Inline =
  | { type: 'text'; text: string; marks?: Mark[] };

type Mark =
  | { type: 'strong' }
  | { type: 'em' }
  | { type: 'code' }
  | { type: 'link'; attrs: { href: string; rel?: string } }
  | { type: 'citation'; attrs: { sourceId: string } };

type RichText = Inline[];
```

Why not HTML strings: the review renderer escapes and re-emits HTML, which works for rendering but is hostile to a visual block editor, and it cannot carry a citation that has to be renumbered. This shape is TipTap's own JSON shape, and there is precedent in the repo already — `glossaryEntries.fullDefinition` stores a TipTap JSONDoc. So the future editor is TipTap with a whitelisted mark set, and serialisation is the identity function.

`citation` is a mark, not a block, because a marker sits inline just above the baseline mid-sentence. One document = one source number, reused at every mention, numbered by first appearance — so the renderer assigns numbers by walking the block tree in order and never trusts an authored number.

Glossary tooltips stay an automatic decoration: the rendered prose container keeps `data-glossary-decorate`, exactly as `.ourdream-article-prose` does today. Not an authored mark.

### 6.4 Per-type `data` shapes

Measurements for every one of these are in the `parts/` files; this is the data contract only.

```ts
// prose
paragraph      { text: RichText }
h2             { text: string; anchor: string }        // anchor feeds the TOC
h3             { text: string; anchor: string }
bulletList     { items: RichText[] }
numberedList   { items: RichText[] }

// evidence
figure         { mediaId: string; alt: string; caption?: RichText;
                 ratio: 'portrait' | 'square' | 'landscape' | 'wide';
                 maxWidth?: 380 | 480 | 740 | 960 }

// callouts — the ladder, lightest to strongest
tip            { body: RichText }
important      { body: RichText }
quickAnswer    { body: RichText }
whatILearned   { body: RichText }
keyTakeaway    { body: RichText }                       // 4px pink accent, inset
myTake         { body: RichText; authorId: string }     // avatar + attribution

// prompts
prompt           { kind: 'text' | 'code'; label?: string; value: string;
                   collapsed?: boolean }                // code only
promptComparison { a: { label: string; value: string };
                   b: { label: string; value: string; copyable?: boolean };
                   conclusion?: RichText }
promptStructure  { label?: string; parts: string[] }    // never copyable
promptResult     { layout: 'sideBySide' | 'stacked';
                   prompt: { value: string };
                   result: { mediaId: string; alt: string; caption?: RichText } }

// process
stepWorkflow   { display: 'vertical' | 'horizontal';
                 eyebrow?: string; title: string; intro?: RichText;
                 steps: Array<{ id: string; title: string; description?: RichText;
                                example?: string;
                                media?: { mediaId: string; alt: string;
                                          caption?: RichText;
                                          placement: 'inStep' | 'belowStep' } }>;
                 takeaway?: RichText }

// the signature block
aigeTest       { title: string; setupLine?: RichText;
                 setup: Array<{ label: string; value: string }>;
                 results: Array<{ id: string; mediaId: string; alt: string;
                                  label?: string; caption?: RichText;
                                  best?: boolean }>;   // 1..4; one `best` max
                 result: RichText;
                 whatILearned?: RichText }

// reference
comparisonAB     { a: { label: string; body: RichText };
                   b: { label: string; body: RichText };
                   conclusion?: RichText }
cheatSheet       { title?: string;
                   groups: Array<{ id: string; title: string;
                                   entries: Array<{ term: string; note: string }> }> }
externalExamples { links: Array<{ id: string; category?: string; title: string;
                                  description?: string; href: string;
                                  mediaId?: string }> }  // never a scraped image
```

Guide-level:

```ts
GuideSource  { id: string; title: string; href: string;
               publisher?: string; sourceType?: string }  // domain is derived from href
GuideFaq     { id: string; question: string; answer: RichText }
```

### 6.5 Constraints the validator enforces

| Rule | Where it comes from |
|---|---|
| `aigeTest.results` length 1–4; at most one `best: true` | Only four result layouts are designed |
| `stepWorkflow.steps` length 2–6 | Component description: "2–6 Article / Workflow Step instances" |
| `stepWorkflow.display: 'horizontal'` requires `width: 'breakout'` and ≤5 steps | Horizontal Process is exactly 960px with 5 fixed nodes |
| Connector is off on the last visible step | Component rule; handled by the renderer, not the author |
| `promptStructure` has no copy affordance | "visual formula, not copyable" |
| `promptComparison` labels ≤ ~18 chars | Labels are SHORT and must never collide with the Copy action; longer wording goes in `conclusion` |
| `prompt.kind: 'code'` is the only place monospace is allowed | "Monospace only in code or copyable prompt text" |
| `externalExamples` never stores a scraped image | "Never scrape an external page's image" |
| A citation's `sourceId` must exist in `sources` | Otherwise the number can't be assigned |
| Score renders as `8.8`, never `8.8 /10` | Brand rule; the score only appears on the hub and the sticky header, never under an article |
| Affiliate links resolve to `/go/<app>` with `rel="sponsored nofollow"` + a visible "Affiliate link" line | Reuse `src/lib/affiliate/rel.ts` and `AffiliateLink.astro` |
| No `width: 'breakout'` on mobile | Breakout is desktop-only, centred on the reading column, never full-bleed |

### 6.6 Render path

```
InstantDB guideArticles (build time, admin SDK via src/lib/db/server.ts)
  → validate blocks (zod discriminated union, reject unknown types)
  → assign citation numbers by first appearance
  → derive TOC from h2 anchors
  → renderGuideBlocks(blocks) → Astro components (not HTML strings)
  → article shell + fixed sections
```

One deliberate difference from `renderReviewBlocks.ts`: that renderer emits HTML strings from a `switch`. For the article system the blocks render as **Astro components**, one per block type, because these patterns have real interaction (copy, expand, FAQ disclosure, TOC scroll-spy) and because a component per block type is what makes the visual editor's preview and the published page share one implementation. Prose primitives can still go through a small string renderer for speed; the 15 pattern blocks are components.

---

## 7. Article shell

Measured from the Comics desktop frame `318:4936` — details and the full vertical rhythm in `parts/50-shell-and-nav.md`.

| | Desktop 1440 | Mobile 390 |
|---|---|---|
| Header block | 80px tall | height not designed — Q7 |
| Content band | 1060px centred (190px side margins) | 350px in 390 (20px gutters) |
| Reading column | 740px at x=190 | 350px |
| Gutter | 80px | — |
| TOC rail | 240px at x=1010, sticky | replaced by Jump to Section |
| Both columns start | y=56 below the header (rail content +8 more) | |
| Base block gap | 20px | |
| Before an H3 | +8px spacer → 48px effective | |
| Before an H2, Sources, Related Guides | +28px spacer → 68px effective | |
| Related Guides → footer | 96px | |
| TOC max-height | 420px with internal scroll, pink active indicator, hairline divider + "Explore all OurDream AI guides →" | |
| Breakout | 960px, centred on the reading column, never full-bleed | not available |

z-index: sticky header 50, decorative background layers 0 with `pointer-events: none`, content 1.

There is no designed frame between 391 and 1099, so the breakpoint at which the rail disappears is undecided — Q8.

---

## 8. What step 2 through 7 will touch

New files only, except where noted. No file owned by another agent is edited.

| Step | Files |
|---|---|
| 2 — tokens + font | `src/styles/aige-article.css` (new, `--art-*` block + dark block). Edit: add the article prose class to the bare-link selector lists in `global.css` (see risk below). Screenshots of homepage + a review page before/after. |
| 3 — shell | `src/components/guides/article/ArticleShell.astro`, `ArticleHeader.astro`, `ArticleToc.astro`, `ArticleJumpToSection.astro` |
| 4 — patterns | `src/components/guides/article/blocks/*.astro`, one per block type, most-used first |
| 5 — wiring | `instant.schema.ts` (+`guideArticles`, `guideHubs`), `src/lib/guides/blocks/schema.ts`, `src/lib/guides/blocks/render.ts`, `src/lib/db/guideArticles.ts`, the Comics route |
| 6 — hub | `src/pages/guides/ourdream-ai.astro` rebuilt against `guideHubs` |
| 7 — sticky header + mobile CTA | `src/components/guides/article/BrandContextStickyHeader.astro`, `BrandStickyCta.astro` (Figma `287:3808`, `530:56607`) |

Three repo mechanics that will bite if ignored:

1. **`build.inlineStylesheets: 'always'`.** Every stylesheet a page references is inlined into that page's HTML, with no cross-page caching. A guide page already inlines ~250 KB (`page-full.css` pulls in `roundup.css` 91 KB, `ratings-tooltips.css` 46 KB, `directory.css` 36 KB, `alternatives.css` 35 KB) plus `home-desktop.css` 58 KB and `guide-hub.css` 22 KB injected by `GlobalSiteHeader`. Adding an article sheet on top makes it worse. `BaseLayout` already has the escape hatch: `theme="core"` skips `page-full.css` entirely, which is what the brand hubs use. The article routes should move to `theme="core"` — that is a change in behaviour for those pages, so it needs a look on the preview. Q9.
2. **Bare-link styling is hard-coded per prose class.** `global.css` force-applies the pink underline treatment to `a[href]` inside `.guide-prose`, `.legal-prose`, `.prose-review`, `.review-blocks`, `.review-section`, `.test-prose`, `.test-methodology-prose`. A new prose class inherits none of it and must be added to those lists — a one-line edit to a shared file, which I'll show in the diff.
3. **Build gates.** `npm run build` runs `check:sitemap` first, so every new non-dynamic route must be registered in `getAllSitemapEntries` (`src/lib/sitemap.ts`) or the build fails; and `integrations/canonical-guard.mjs` scans built HTML and throws on `localhost` canonicals or `example.com` affiliate hrefs. Always use `canonicalPublicUrl`.

---

## 9. Open questions — batched

Nothing below blocks writing code for step 2 except Q4 and Q9. The rest are needed by the step they name.

**Blocking / needed before step 2**

- **Q1 — the Comics page.** Send me the current production or preview URL and tell me what you see, or confirm I should open `/guides/ourdream-ai-comics/` myself. I need to know whether `ourdream-article.css` + `OurDreamArticlePage.astro` are being replaced wholesale or corrected, because it decides whether step 3 is a rebuild or a reskin.
- **Q4 — font preload.** `BaseLayout` preloads one font file (Hanken) for the review-page LCP `<h1>`. Guide `<h1>`s become Bricolage. Options: (a) preload both — competes with the LCP image preload on guide pages; (b) preload per theme — Bricolage on guide routes, Hanken elsewhere; (c) leave it and accept a swap flash on guide headings. I'd take (b).
- **Q9 — `theme="core"` on article routes.** Drops ~250 KB of inlined CSS per guide page but removes the `page-full.css` bundle those pages currently get. Yes or no.

**Needed before step 4 — every pattern is missing its interaction states**

- **Q10 — no State variants exist anywhere.** Not one Article/* component has a hover, focus-visible, active or disabled variant. The only exception is Citation Marker, which has a Hover. So: TOC items, FAQ triggers, Related guide rows, Jump to Section, every Copy button, External Example Link cards and the "Explore all" links all need states invented. Proposal, for one yes: hover = `--art-pink-soft` wash at 6% for rows and `--art-pink-press` for link text; focus-visible = 2px `--art-pink` outline at 2px offset, never removed; active = `--art-pink-press`. I'll show it on one component before applying it to the rest.
- **Q11 — Copy button has no "Copied" state** in any of the four prompt contexts, and the two Copy boxes are drawn inconsistently (Prompt has 6/4 padding and radius 6; Prompt Comparison's side B has neither and a ~16px hit box). The repo already has the behaviour — `bindCopyButtons` shows "Copied" for 1600 ms. Reuse it and standardise the box?
- **Q12 — `prompt.kind: 'code'` collapse is prose-only.** The rule says long JSON is collapsed with "Show full prompt", but the drawn variants are 173px and 219px tall with no clamp height, no fade layer and no expand row anywhere in the file. Give me a collapse height, or I'll pick one (I'd say 320px desktop / 240px mobile with an 80px fade) and show it.
- **Q13 — media below a step.** "A wider or portrait screenshot goes below the step as its own figure, aligned with the step text" has no Figma node. Aligned with the step text means 688px (visually identical to in-step media, so the rule does nothing) or the full 740px with only the caption inset. And there's no numeric threshold for "wider or portrait". Which?
- **Q14 — lightbox.** Nothing in the file designs one, but AIGE Test results and 740px interface screenshots clearly want click-to-zoom. In or out for v1?
- **Q15 — scroll-spy.** Undesigned: whether the 420px rail auto-scrolls to keep the active item visible, and the `scroll-margin-top` for anchor jumps under the sticky header.

**Needed before step 6 — hub**

- **Q8 — tablet.** Only 1440 and 390 exist. At what width does the TOC rail drop? I'd take 1100px (rail off below), with the column fluid to 740 max.
- **Q7 — mobile header height.** Desktop is 80px; the mobile equivalent isn't in the file, so the mobile sticky offset can't be derived.

**Decisions with a cost attached**

- **Q2 — migration.** The four article URLs and the hub URL are live. Do I rebuild in place on the same slugs (no redirects, no SEO risk, but the old raw HTML has to be converted into blocks), or build at new slugs and 301 the old ones? In place, on the same slugs, is my recommendation. Either way the four `src/content/guides/*.html` files (158 KB total, hand-authored) have to be converted into typed blocks — that is a real chunk of step 5, and it is mechanical enough that I can script most of it from the existing `od-*` class names, which map almost 1:1 onto the block types.
- **Q3 — `/guides/[slug]`.** The Sanity route owns that path today. Retire it, namespace the new one, or have the new loader take precedence? Retiring it means the Sanity `guide` document type and `studio/schemaTypes/guide.ts` stop being the guide CMS.
- **Q5 — Geist Mono.** The design's `Article/Code` is Geist Mono 14/23; the repo ships JetBrains Mono. Add the dependency, or use JetBrains Mono at the same metrics? Mono appears in exactly one block type.
- **Q6 — dark mode.** No article pattern has a dark variant in Figma, and every page-scoped sheet in this repo ships one. Derive dark values myself following the `--od-*` dark block (that's the existing precedent), or leave article patterns light-only and accept that they'll look wrong with the site's dark toggle?

---

## 10. Contradictions between the design rules and the drawn components

Found while measuring. Each one is a place where building exactly what's drawn breaks a stated rule, so tell me which side wins. None of these are style opinions — they're conflicts inside the source material.

| # | Conflict | Where |
|---|---|---|
| C1 | **"No third grey level"** vs `surface/sunken #efefed` used as a real surface in Result Tile, Image + Caption, the step Example slot and the External Example Link thumbnail | `parts/40-evidence.md`, `parts/30-process.md`, `parts/60-reference-and-sources.md` |
| C2 | **"Images keep their real aspect ratio — no grey containers"** vs every Result Tile and Image + Caption painting a fixed-height `#efefed` rect behind an `object-cover` image | `parts/40-evidence.md` |
| C3 | AIGE Test one-result case is **3:2 landscape on desktop and 3:4 portrait on mobile**, so a single source image cannot serve both viewports | `parts/40-evidence.md` |
| C4 | **Prompt Comparison labels are specified SHORT and uppercase**; the components are drawn in sentence case with no tracking and default to the 17-character "Better for Dreamy" | `parts/20-prompts.md` |
| C5 | **Prompts are meant to be a "light pink-neutral surface"**; three of the four contexts sit on `#ffffff`, so differentiation rests entirely on padding, radius and border colour. Prompt Structure's white chips on a white card are near-invisible | `parts/20-prompts.md` |
| C6 | Stacked Prompt + Result is specified **for landscape**, but both stacked variants are drawn with portrait 4:5 images, and stacked desktop is 480px wide rather than the 740px reading column | `parts/20-prompts.md` |
| C7 | Step-by-Step media is documented as **16:10**; the drawn slots are 688×440 and 308×197, i.e. 1.564:1 | `parts/30-process.md` |
| C8 | My Take is described as the top of the intensity ladder but is drawn as the **lightest** thing in the family (no fill, no card, no radius, hairline top and bottom, no icon) — and the ladder graphic names AIGE Test as strongest, so the ladder's top is genuinely unspecified | `parts/10-callouts.md` |
| C9 | The two identical **"Explore all OurDream AI guides →"** links are built differently (pink vs pink-press, regular vs semibold, glyph arrow vs icon node), and the FAQ question switches font family between viewports — both look like unintentional drift | `parts/50-shell-and-nav.md` |
| C10 | Citation Marker is **Inter Medium 15px** in the component but **Semi Bold 18px raw hex** in the in-paragraph example, and no numeric baseline offset exists anywhere | `parts/60-reference-and-sources.md` |
| C11 | Source Row has **no date field at all** and its meta is one flat "Author · Source type" string, so a source with no author is unrepresentable | `parts/60-reference-and-sources.md` |
| C12 | Seven Doc / Usage Notes still say **"Guide / …"** where the live component is "Article / …", and "Guide / Example Prompt" names a component that no longer exists — yet the Step-by-Step annotation cross-references it twice | `parts/70-usage-notes.md` |

My default, unless you say otherwise: the **stated rule wins over the drawn pixel** on C1, C2, C4, C5 and C9 (those are the ones where the drawing looks like an oversight), and the **drawing wins** on C7 (match Figma exactly rather than the rounded description). C3, C6, C8, C10, C11 and C12 need you.

---

## 11. Tokens that look wrong — separate job, not touched now

Per decision 4, listed only.

1. **Two competing page backgrounds.** `#f9f9f9` (`--color-background`, `--od-page`, and the Figma `surface/page`) vs `#f7f7f6` (`--hub-page`, `--home-page`). Both ship today, on pages that sit next to each other.
2. **The Figma palette exists six times over** under `--od-*`, `--hub-*`, `--home-*`, `--fr-*`, `--rs-*`, `--rft-*`, with no shared names. The `--art-*` set I'm proposing is a seventh. Consolidating to one Figma-named set is the real fix, and it is a site-wide job.
3. **`text/primary` and `surface/ink` are the same hex** (`#141317`) with different roles, and no existing token distinguishes them. The day ink stops being the text colour, every usage has to be re-read.
4. **`--color-primary-container` is declared twice** in `global.css` (`#ff6b00`, then `#daf66c` at line 136). The second wins silently, and because it's inside Tailwind `@theme` it regenerates utilities.
5. **No spacing, z-index or elevation scale exists.** Spacing is Tailwind utilities or per-file literals, z-index is hard-coded per rule, shadows are inline `box-shadow` literals. The z-index convention this project has agreed (50 / 1 / 0) has nowhere to live.
6. **`--color-brand-lime` becomes pink in dark mode** (`#db2777`), as does `--color-primary-container`. The retired lime CTA is still wired into the dark palette.
7. **`--font-label` is an alias of `--font-mono`**, which makes every label monospace by default — directly against the "no monospace for normal UI or metadata" rule.
8. **`guide-hub.css` and `home-desktop.css` are injected by `GlobalSiteHeader`** on every page, so `.guide-hub` / `.home-v2` tokens and rules leak everywhere. `.guide-hub__glow { display: none !important }` is already a patch for that leak.

---

## 12. What I have not done

- No CSS, no components, no tokens, no schema changes. Step 1 is this document.
- `feat/article-system-figma` is branched off `origin/main` (`2a38748`) and contains only `docs/article-system/`.
- Five Step-by-Step Workflow mobile variants were read in a follow-up pass after the Figma MCP seat hit its rate limit; `278:4435`, `278:4534` and `278:4732` are still marked inferred in `parts/30-process.md`. They share the Workflow Step atom, which is fully measured, so the risk is low — I'll confirm them while building step 4.
- I cannot push this branch yet: the git remote needs credentials that aren't available from this session. See the note in the chat.
