# AI Girlfriend Expert — CURRENT Code → Figma Handoff

> **This file supersedes every previous Figma sync document**, including `docs/figma-sync/FIGMA-SYNC-HANDOFF.md` and earlier drafts of this same path.
>
> **Source of truth:** the **current localhost render** + PNGs in `docs/figma-sync-current/screenshots/`.
>
> **This is a SYNC task, not a redesign.** Update the **existing** Figma file. Do not create a new Figma file. Do not invent alternate layouts. When prose and a screenshot disagree, **the screenshot wins**. When a screenshot is missing or flagged as a dev overlay, **current code wins** over old Figma.

---

## 00 — Rules

1. Sync the **existing** Figma file to match **current code**. Do not start a new file.
2. Do not “improve”, restyle, or re-theme anything.
3. Do not merge page families into one global “boxed editorial sheet.”
4. Do not merge the two header implementations into one component unless Figma already has two variants that map 1:1.
5. The pink **mobile bottom app bar** (`MobileNavShell`, ≤767px) is **not** the footer. The footer is always `.site-footer`.
6. Screenshots in `docs/figma-sync-current/screenshots/` are the visual spec. Filenames are listed in `SCREENSHOT-INDEX.generated.md`.
7. Capture date: **2026-09-14**. Runtime: Astro `npm run dev` at `http://127.0.0.1:4321`.

---

## 01 — Runtime / routes

| Item | Value |
| --- | --- |
| Repo | `Nelsony202020/ai-gf-expert-v2` |
| Framework | Astro + Tailwind v4 (`src/styles/global.css`) |
| Screenshot folder | `docs/figma-sync-current/screenshots/` (**218 PNGs**) |
| Index | `docs/figma-sync-current/SCREENSHOT-INDEX.generated.md` |
| Computed (light, `/` and `/about/`) | `--color-background: #f9f9f9`, `--color-accent: #db2777`, `--site-header-height: 4.25rem` desktop |

### Audited public routes (current implementation)

| Route | Family | Header | Layout |
| --- | --- | --- | --- |
| `/` | Homepage | **A** `HomeDesktopHeader.astro` | Full-bleed section stack + hex |
| `/guides/ourdream-ai/` | OurDream hub | **A** `HomeDesktopHeader.astro` | Full-width ink hero + light hub body |
| `/guides/ourdream-ai-prompt/` | Editorial guide | **B** `Header.astro` | Narrow `max-w-3xl` article |
| `/guides/ourdream-ai-image-prompt/` | Editorial guide | **B** | Same article shell |
| `/guides/how-to-use-ourdream-ai-image-generator/` | Editorial guide | **B** | Same article shell |
| `/guides/ourdream-ai-comics/` | Editorial guide | **B** | Same article shell |
| `/guides/` | Guides index | **B** | `max-w-5xl` card grid |
| `/best/ai-girlfriend/` | Roundup / comparison | **B** (fixed over hero) | **Boxed raised sheet** over dark hero |
| `/reviews/` | Reviews index | **B** | `max-w-4xl` hub cards |
| `/reviews/[slug]/` | Review | **B** `theme="review"` | Full-width tabs, not boxed sheet |
| `/reviews/ratings-panel/[slug]/` | Ratings fragment | none (fragment layout) | Lazy-loaded into Ratings tab |
| `/ai-girlfriend-apps/` | App directory | **B** `theme="directory"` | Filterable directory |
| `/glossary/` | Glossary | **B** | `max-w-3xl` |
| `/about/` | About | **B** | `max-w-3xl` |
| `/test/` | How we test / methodology hub | **B** | `StandardContentLayout` hero + TOC + body |
| `/test/[category]/` | Category methodology | **B** | Same standard content grid |
| `/test/all/` | All tests | **B** | Same |
| `/test/market-data/` | Market data methodology | **B** | Same |
| `/sitemap/` | Site index | **B** | Card grid on page background |
| `/editorial-guidelines/` | Company | **B** | Standard content |

**There is no standalone “OurDream AI Video Prompt Guide” route.** Video prompting is an **H3 section** inside `/guides/ourdream-ai-prompt/` (`#video-prompts`). Do not invent a fifth OurDream guide page in Figma.

301 redirect: `/guides/ourdream-ai-prompt-guide/` → `/guides/ourdream-ai-prompt/`.

---

## 02 — Page architecture (do not mix)

### Homepage — full-bleed bands (`/`)

- **Not** a boxed white page on a dark canvas.
- Root: `.home-v2`. Content gutter `--home-max: 1120px`, `--home-gutter: 32px` (20px ≤720px).
- **Marketing dark** (`--home-ink: #101014`): hero, methodology, closing CTA. Each paints its own **fixed 48px grid** (`--hex-canvas-dark`, line opacity **0.07**).
- **Light** (`--home-page: #f7f7f6`): rankings, selector, score, latest, tester. Fixed **light grid** (`--hex-canvas-light`, opacity **0.04**).
- Cards / proof / metrics: **opaque** `--home-card: #ffffff` (grid does **not** show through card fills).
- Proof metrics bridge overlaps the ink→light seam.
- Footer: shared `.site-footer`, **no hex**.

### OurDream hub — full-width (`/guides/ourdream-ai/`)

- Root: `.guide-hub` (often wrapped in `.home-v2` for footer/header family).
- Ink hero `--hub-ink: #101014` + centered glow SVG `/guides/hub/glow.svg`.
- Light body `--hub-page: #f7f7f6` with page-level `::before` 48px grid (`--hub-grid-line: rgb(20 19 23 / 0.035)`, layer opacity **0.45**).
- Main column max-width **1040px**.
- **Not** the roundup boxed sheet.

### Editorial guides — narrow article

- `Header` + `<article class="section-container … max-w-3xl">`.
- Page background `--color-background` (`#f9f9f9` light / `#121214` dark).
- Breadcrumbs → H1 (font-black, 3xl/4xl) → author row (36px avatar, name, date) → `.guide-prose`.
- Images: `border-radius: 0.75rem`. Links: accent pink, weight 700. Blockquote: 3px pink left bar. `pre`: max-height 28rem, 0.75rem radius.
- **No hex grid** on these pages.

### Roundup — boxed sheet (`/best/ai-girlfriend/`)

- Dark hero stage `.roundup-hero-stage` `#141414` + banner art.
- Main `.roundup-page--covers-hero`: raised light sheet, **top radius** `var(--radius-xl)` (16px), shadow `0 -10px 40px rgb(0 0 0 / 8%)`, tucked under hero.
- Header is **fixed** over the hero (`body:has(.roundup-hero-stage)`).
- Inner grid: sidebar TOC + content max **48rem**.
- Full-bleed `.roundup-affiliate-bar` (header-surface background, 11px fineprint). **Do not render the words “affiliate link”** unless they appear in the live screenshot.
- Comparison table lives in this family (`RoundupCompare.astro`).
- **Do not apply this boxed sheet to homepage, hub, glossary, sitemap, or guides.**

### Review — tabbed product page (`/reviews/[slug]/`)

- `Header` + `theme="review"`. Standard `section-container` (max **1280px**).
- Hero: `ReviewHero.astro` (breadcrumbs, H1, meta, gallery + ratings; gallery hidden ≤767px).
- Sticky `.review-tabbar` under header.
- Tabs: Overview · Ratings · Review · Media · Pricing · (dev/draft) Market Data · Alternatives.
- Ratings tab is a **lazy iframe/fetch panel** (`data-ratings-src=/reviews/ratings-panel/{slug}/`) with “Loading ratings…” placeholder.
- Localhost may show an amber **Draft — not published** banner.
- **Not** the roundup boxed sheet.

### Glossary / About / Reviews index / Sitemap / Directory

- Content header + `section-container` on `--color-background`.
- Glossary/About: **max-w-3xl**. Guides index: **max-w-5xl**. Reviews index: **max-w-4xl**. Sitemap: card grid. Directory: `AppDirectory`.
- **Not** boxed sheets. **No homepage hex.**

### How we test / methodology (`/test/` and children)

- `StandardContentLayout`: hero + sticky sidebar TOC (`--roundup-sidebar-width: 12.5rem`) + body (`--roundup-content-max: 48rem`).
- Light hero tint `--roundup-header-bg: #f8faf3` (dark: `#161619`).
- This is the **methodology** surface (not the homepage `#home-method` band). Homepage methodology is a marketing dark section; `/test/` is editorial content.

---

## 03 — Design tokens (extracted from code)

Screenshots still win if a computed pixel disagrees.

### Marketing / hub (`.home-v2` / `.guide-hub`)

| Token | Value |
| --- | --- |
| `--home-ink` / `--hub-ink` | `#101014` |
| `--home-ink-raised` | `#1c1c22` |
| `--home-page` / `--hub-page` | `#f7f7f6` |
| `--home-card` / `--hub-card` | `#ffffff` |
| `--home-text` / `--hub-primary` | `#141317` |
| `--home-secondary` | `#55545b` |
| `--home-muted` | `#8a8991` |
| `--home-on-ink` | `#f7f7f6` |
| `--home-pink` / `--hub-pink` | `#db2777` |
| `--hub-pink-press` | `#be185d` |
| `--hub-pink-soft` | `#fce7f3` |
| Score green / orange / red | `#16a34a` / `#e8760a` / `#dc2626` |
| `--home-max` | `1120px` |
| Grid size | `48px`, `background-attachment: fixed` |
| Dark grid line | `rgb(255 255 255 / 0.07)` |
| Light grid line | `rgb(20 19 23 / 0.04)` |
| Hub grid line | `rgb(20 19 23 / 0.035)` at layer opacity `0.45` |
| Display font (home) | Bricolage Grotesque Variable |
| Italic accent | Instrument Serif italic, pink |

### Global content (`src/styles/global.css` + dark)

| Token | Light | Dark |
| --- | --- | --- |
| `--color-background` | `#f9f9f9` | `#121214` |
| `--color-on-surface` | `#1b1b1b` | `#f5f5f5` |
| `--color-on-surface-variant` | `#5a4136` | `#a6a6af` |
| `--color-surface-container-lowest` | `#ffffff` | `#161619` |
| `--color-surface-container` | `#eeeeee` | `#1b1b1f` |
| `--color-accent` | `#db2777` | `#db2777` |
| `--color-accent-soft` | `#fce7f3` | `rgb(219 39 119 / 12%)` |
| `--color-header-surface` | `#f8faf3` | `#101014` |
| Footer **rendered** | `#0d0d10` (hardcoded in `footer.css`; ignore stale `--color-footer: #1a2418` light token) | `#0d0d10` |
| `--color-brand-lime` | `#daf66c` | **Do not use as marketing CTA on charcoal surfaces** — dark mode maps lime CTAs to pink |

### Type

| Role | Family |
| --- | --- |
| UI / body | Inter Variable |
| Display headings (content) | Hanken Grotesk Variable |
| Home display | Bricolage Grotesque Variable |
| Serif italic | Instrument Serif |
| Labels / mono | JetBrains Mono Variable |

### Layout / chrome

| Item | Value |
| --- | --- |
| `.section-container` max | **1280px** (`80rem`) |
| Content header height | `--site-header-height`: **3.5rem** mobile, **4.25rem** ≥768px |
| Marketing header height | **80px** desktop |
| Header glass light | `rgb(248 250 243 / 78%)`, blur **10px**, saturate **140%** |
| Header glass dark | `rgb(16 16 20 / 92%)` |
| Header z-index | `50` (content) / marketing header `z-index: 4` inside home stack |
| Radius | lg `0.75rem`, xl `1rem` |
| Footer container | `80rem`, padding-top **5.5rem** |
| Footer logo | white WebP, height **2.75rem**, max-width **8rem** |
| Mobile bottom nav height | `--mobile-nav-bar-height: 4rem` (≤767px only; **not footer**) |

---

## 04 — Global header (two implementations)

### A — Marketing header — `src/components/home/desktop/HomeDesktopHeader.astro`

**Used on:** `/`, `/guides/ourdream-ai/` only.

| | |
| --- | --- |
| Height | 80px desktop; wraps on small screens |
| Background | **Transparent** on ink hero; hex is on the **section**, not the header fill |
| Nav | **Best apps ▾ · Reviews ▾ · Brands ▾ · Guides · How we test** |
| Brands panel | Kicker “POPULAR BRANDS”. Current hubs only (`BRAND_HUB_BY_SLUG`). **`viewAll` is `null` — do not draw “View all brands”.** Live label is **OurDream Ai** (product `name` casing) → `/guides/ourdream-ai/`. |
| Actions | Search icon (expands field) + `ThemeToggle variant="header"` (20px moon/sun, 40×40 hover circle) |
| Logo | CSS background `.home-v2__logo` (theme-swapped brand assets) |

**Screenshots:** `homepage-desktop-1440-light-hero.png`, `homepage-desktop-1440-light-brands-dropdown.png`, `homepage-desktop-1440-light-header-search.png`, `ourdream-hub-desktop-1440-light-hero-default.png`.

### B — Content header — `src/components/Header.astro`

**Used on:** everything else in this audit.

| | |
| --- | --- |
| Position | `sticky; top: 0; z-index: 50` (fixed over roundup hero) |
| Fill | Frosted glass tokens above |
| Nav | **Explore ▾ (mega) · All Apps · Brands ▾ · How We Review** |
| Brands | Same `buildBrandNav()` data as marketing header. **No “View all brands”.** |
| Search | Icon toggle → rounded field + dropdown. Example query `prompt` lists OurDream prompt guides (`about-desktop-1440-light-header-search.png`). |
| Auth (desktop ≥768px) | **Sign In** text + **Join Now →** pill. Marketing header **does not** show these. |
| Theme | Header icon toggle (moon/sun) |
| Mobile | Hamburger sheet; Brands block uses the same data |

**Nav label differences vs marketing header are intentional.** Do not unify copy in Figma.

**Screenshots:** `about-desktop-1440-light-brands-dropdown.png`, `about-desktop-1440-light-header-search.png`, `about-desktop-1440-theme-toggle.png`, plus any content-page `*-default.png` showing the bar.

---

## 05 — Global footer

**File:** `src/components/Footer.astro` + `src/styles/footer.css`

| | |
| --- | --- |
| Background | `#0d0d10` — **no hex/grid** |
| Top border | `#1c1c22` |
| Sign-off | “Tested, **not hyped.**” — “not hyped.” is `#db2777` |
| Desktop ≥900px | Brand column (25rem) + four nav columns in a row |
| Mobile | `.site-footer__nav { flex-wrap: wrap; gap: 2rem 1.5rem }` with `.site-footer__col { min-width: 7.5rem; flex: 1 }` → **two-column wrap**, not a single stacked list |
| Channels | YouTube Expert `…/@ai-girlfriend-expert?sub_confirmation=1`, Help Desk `…/@ai-girlfriend-help-desk?sub_confirmation=1`, TikTok, Reddit (muted, no href) |
| Legal row | Copyright + Privacy / Terms / Accessibility + footer theme text toggle |
| Link hover | Pink `#db2777` + `translateX(2px)` |

**Screenshots:** `ourdream-hub-desktop-1440-light-topic-row-hover.png` (desktop footer in-frame), `glossary-mobile-390-light-full.png` (**mobile two-column groups** + deprecated bottom bar overlaying channels — bar is not the footer).

**STALE:** old oversized sign-off, footer hex, navy footer, lime footer, treating `MobileNavShell` as the footer.

---

## 06 — Shared components & interactions

| Piece | File | Notes |
| --- | --- | --- |
| Affiliate CTA | `AffiliateLink.astro` | External / `/go/` links get `rel="nofollow sponsored noopener"`. Hub visit button: `.guide-hub__visit` pink pill + arrow, label **Visit OurDream AI**. Secondary **Read review →**. No visible “affiliate” badge in the hub hero. |
| Theme toggle | `ThemeToggle.astro` | Header icon; footer text control; `html[data-theme]` + `localStorage.theme`. Transition ~120ms on colors. |
| Header search | both headers | Client filter of `buildSearchIndex`. Open field, type, dropdown list. Escape/clear closes. |
| Score rings | homepage rankings + review | SVG stroke animation when in view; green/orange/red thresholds. Reduced motion: skip. |
| Herman badge | homepage hero | Hover motion; click flips to #1 ranking face; mouseleave returns. Desktop interaction. |
| Hub search | `OurDreamGuideHub.astro` | Overlay panel under field. **Does not push Start here.** `z-index`: hero `2`, search wrap `30`, panel `40`, main `1`. Open: opacity 1, `translateY(0)`, 180ms ease. Empty query / no hits: empty panel copy. Popular chips fill the query. |
| Hub topic rows | `.guide-hub__article-row:hover` | **Pink wash** `color-mix(pink 6%, card)` (10% dark). Arrow `translateX(3px)` pink. **No inset left bar.** |
| Hub start rows | `.guide-hub__start-row:hover` | Pink 5% wash, lift `-2px`, hairline bottom only. |
| Ratings panel | `loadRatingsPanel.client.ts` | On Ratings tab: fetch fragment HTML, inject `[data-ratings-root]`, run fragment scripts. |
| Glossary filter | `glossary.astro` script | Only if published entries exist. Input filters `data-search`; chips filter category; empty: “No terms match your search.” |
| Roundup compare | `RoundupCompare.astro` | Multi-column feature/pricing/score table; picker; winner highlighting. |
| Review alternatives | `AlternativesTab.astro` | Compact cards + `AlternativesComparisonTable`. |

---

## 07 — Homepage (section order)

Component tree: `src/pages/index.astro` → `HomeDesktop.astro` + `home-desktop.css`.

| Section | Purpose | Desktop | Mobile | Screenshots |
| --- | --- | --- | --- | --- |
| Header + hero | Ranked-app marketing | Ink + Herman + dual CTAs + finalist icons | Stacked; header wraps | `homepage-*-hero.png` |
| Herman flip | Show current #1 | Click/hover as implemented | Limited / no flip emphasis | `*-herman-flipped.png` |
| Proof metrics | Trust strip overlapping seam | 5 stats in opaque card | Stack/wrap | `*-proof-metrics.png` |
| Rankings | Top 3 cards + rings | 3-up | Stack | `*-rankings.png` |
| Selector | Choose-by-need | Cards | Stack | `*-selector.png` |
| Methodology | Dark how-we-test teaser | Ink + grid | Stack | `*-methodology.png` |
| AIGE score | Editorial + 8 rows + ring | Split | Stack | `*-score.png` |
| Latest | Content cards | Grid | Stack | `*-latest.png` |
| Tester | Herman bio | Split + light grid | Stack | `*-tester.png` |
| CTA | Closing dark band | Dual buttons | Full width | `*-cta.png` |
| Footer | Global | See §05 | 2-col wrap | `*-footer.png` |

Also capture **dark** homepage set `homepage-desktop-1440-dark-*`.

---

## 08 — OurDream AI Guides hub

**Route:** `/guides/ourdream-ai/`  
**Files:** `OurDreamGuideHub.astro`, `guide-hub.css`, `ourdream-guide-hub.ts`

### Hero

- H1 34px/40px weight 700, tracking -0.68px, `#f7f7f6`.
- Lede 16/26, `#a4a3aa`, max 36rem.
- Search pill height **52px**, radius 999, white, float shadow, max-width **640px**.
- Popular chips: Prompts / Images / Video / DreamCoins.
- Product row: 28px app icon + name + **Visit OurDream AI** (affiliate) + **Read review →**.

### Search

- Typing filters `ourdreamHubGuides` client-side.
- Results **float over** Start here (fixed stacking). Match screenshots `*-search-results.png` / `*-search-empty.png`.

### Start here

- Numbered rows to Review, Prompt Guide, Image Generator guide.

### Browse by topic

- `<details>` cards. Create & customize → Prompt Guide + Image Prompt Guide. Images, video & comics → Image Generator + Comics.
- Hover: **background wash only** (see §06). Screenshot: `ourdream-hub-desktop-1440-light-topic-row-hover.png`.

### Dark

- Hub dark recapture: `ourdream-hub-desktop-1440-dark-default.png`.

---

## 09 — OurDream editorial guides

Shared chrome: content header, breadcrumbs Home / Guides / {title}, Herman Carter + date, `.guide-prose`, global footer.

| Page | Route | H1 | Notes |
| --- | --- | --- | --- |
| Prompt Guide | `/guides/ourdream-ai-prompt/` | OurDream AI Prompt Guide | Includes **Video Prompts** `#video-prompts`. FAQ JSON-LD. `data-glossary-decorate`. |
| Image Prompt Guide | `/guides/ourdream-ai-image-prompt/` | OurDream AI Image Prompt Guide | Tags/weights examples. |
| Image Generator | `/guides/how-to-use-ourdream-ai-image-generator/` | How to Use OurDream AI Image Generator | Dreamy/Vivid walkthrough. |
| Comics | `/guides/ourdream-ai-comics/` | OurDream AI Comics: How to Use the Comic Generator | FAQ. |
| Guides index | `/guides/` | Guides | Hub teaser card + 3-col guide cards (`max-w-5xl`). |

**Screenshots:** `prompt-guide-*`, `image-prompt-guide-*`, `image-generator-guide-*`, `comics-guide-*`, `guides-index-*`, plus `prompt-guide-desktop-1440-dark-*`.

Figma: one **Guide article** component with instances; do not design four unrelated templates.

---

## 10 — Glossary

**Route:** `/glossary/` — `glossary.astro` + `glossary.css`.

**This localhost has zero published glossary rows** (`loadPublishedGlossaryEntries()` is empty without DB). Rendered UI is:

- Eyebrow “Reference” (accent, 11px, tracking 0.1em)
- H1 “AI Girlfriend Glossary”
- Intro
- Empty copy: “Glossary terms will appear here as we publish definitions. Check back soon.”

**When entries are published**, the same page also shows (implement in Figma as a **hidden/ready state**, not as localhost truth):

- Search `#glossary-search`, 8px radius, focus 2px pink ring
- Category chips
- A–Z jump nav
- Letter groups + term articles
- Client filter; no-results: “No terms match your search.”

Do **not** fake a populated glossary as the current localhost screenshot.

---

## 11 — Comparison surfaces

There is **no** standalone `/compare/` route.

1. **Roundup table** on `/best/ai-girlfriend/` (`RoundupCompare.astro`) — primary comparison UI. Screenshot `roundup-*-compare.png`.
2. **Review Alternatives tab** (`AlternativesTab.astro` + `AlternativesComparisonTable.astro`) — product vs peers. Screenshot `review-*-tab-alternatives.png` (skip if overlay).
3. **App directory** `/ai-girlfriend-apps/` — browse/filter tested apps. Screenshot `app-directory-*`.
4. **Homepage rankings** — 3 product cards, not a table.

Affiliate on roundup: `.roundup-affiliate-bar` full-bleed fineprint. Screenshot `roundup-desktop-1440-light-affiliate-bar.png`.

---

## 12 — Review pages

**Route:** `/reviews/ourdream-ai/` (representative). Files: `src/pages/reviews/[slug].astro`, `ReviewHero`, `TabBar`, tab components, `review-page.css` / `page-review.css`.

### Ratings (lazy)

- Tab click → `loadRatingsPanel` fetches `/reviews/ratings-panel/{slug}/`.
- Placeholder: “Loading ratings…”.
- Fragment uses `RatingsSpecsTab` inside `FragmentLayout` (no site header/footer on the fragment itself).
- Visiting `/reviews/ratings-panel/ourdream-ai/` **404s on this localhost** (fragment is not a public page here). **Do not use** `ratings-panel-*-default.png` (they are 404 screens). Specify Ratings from `RatingsSpecsTab.astro` + review tab wiring until the review page renders without overlay.

### Other tabs

- Overview: verdicts, scores, best-for. **If localhost shows an Astro overlay** (`defaultVerdict.id` when verdicts are empty), **do not copy the overlay into Figma.** Use `OverviewTab.astro` / `RatingsSpecsTab.astro` until a clean review render exists.
- Pricing: plans, market comparison, calculator/mixer.
- Alternatives: comparison table (§11).

Index: `/reviews/` card list — `reviews-index-*`.

---

## 13 — How we test / methodology / test pages

| Route | What it is |
| --- | --- |
| `/test/` | How We Test hub — hierarchy, score example, category cards, process, FAQ |
| `/test/chat/` | Example category methodology (Chat) |
| `/test/all/` | All tests by category |
| `/test/market-data/` | Market data methodology (does not affect scores) |
| Homepage `#home-method` | Marketing teaser only — different visual language |

Screenshots: `test-hub-*`, `test-chat-*`, `test-all-*`, `test-market-data-*`, `test-hub-desktop-1440-dark-*`.

---

## 14 — About / sitemap / other content

- **About** `/about/`: kicker, H1, updated date, lead, sections, team, timeline. `about-*` + dark + header interaction shots.
- **Sitemap** `/sitemap/`: section cards, 4→2→1 columns. `sitemap-*`.
- **Editorial guidelines** `/editorial-guidelines/`: `editorial-*`.

---

## 15 — Light / dark / responsive

| Mode | Where |
| --- | --- |
| Marketing dark | Home ink bands, hub hero — stay `#101014` even in “light” site theme |
| Content light | Guides, about, glossary, test, sitemap |
| Content dark | Same pages with `data-theme=dark` charcoal tokens |
| Footer | Always `#0d0d10` |

Breakpoints to match: **1440**, **1280**, **~900** (footer row), **768** (header height / hide bottom nav), **720** (home gutter), **390**, **375**.

Mobile ≤767px: `MobileNavShell` (Best Apps / Buying Guide / FAB / Reviews / More) may appear. **Document as app chrome, never as the footer.** Footer still uses two-column link groups above it.

---

## 16 — Assets (use these files)

| Asset | Path |
| --- | --- |
| Logo (header, theme-swapped) | `/brand/…` via `.home-v2__logo` / `.site-header__logo` |
| Footer logo | `/brand/girlfriend-expert-logo-white.webp` |
| Hub glow | `/guides/hub/glow.svg` |
| Hub icons | `/guides/hub/icon-search.svg`, `icon-sliders.svg`, `icon-images.svg` |
| OurDream app icon fallback | `/guides/hub/ourdream-app-icon.png` |
| Guide heroes | under `/guides/ourdream-ai-*` (CDN via `cdnAsset`) |
| Herman | homepage tester/hero artwork already in home components |

Do not substitute stock or old Figma logos.

---

## 17 — STALE / DO NOT USE

- Navy / sky marketing (`#020617`, `#0f172a`, `#1e293b`)
- Lime as the primary charcoal-surface CTA
- One global header / one boxed-sheet layout for the whole site
- Footer hex, green footer `#1a2418` as the painted footer
- “View all brands” in Brands dropdown
- Hub topic hover = **pink vertical bar through the O of “OurDream”**
- Hub search results slipping **under** Start here
- YouTube URLs **without** `?sub_confirmation=1`
- Populated glossary UI as current localhost
- Dev error overlay on review as a design
- Old mobile FAB bar as “the footer”
- Standalone Video Prompt Guide page
- “Our brands” label

---

## 18 — Interaction & motion (implemented only)

| Interaction | Trigger | End | Duration | Mobile |
| --- | --- | --- | --- | --- |
| Hub search panel | Input with hits | Overlay visible, `translateY(0)` | 180ms ease | Same overlay |
| Hub topic row hover | Pointer | Pink wash, arrow +3px | CSS hover | No hover |
| Hub start row hover | Pointer | Pink 5% wash, -2px lift | CSS hover | No hover |
| Brands dropdown | Click/hover | Panel; **no view-all row** | existing header timing | Sheet |
| Header search | Icon then type | Dropdown results | ~180ms field | Same |
| Theme toggle | Click | `data-theme` swap | ~120ms colors | Same |
| Herman flip | Click | Back face #1 | existing home timing | Limited |
| Score ring | In-view | Stroke to score | existing | Same if visible |
| Ratings tab | Click | Fetch panel | network + inject | Same |
| Footer link hover | Pointer | Pink + 2px x | 180ms | No hover |
| Guide card hover | Pointer | Accent border/title | `transition-colors` | No hover |

---

## 19 — Figma sync instructions

1. Read this entire file and **every** PNG in `screenshots/`.
2. Update **existing** Figma components (Header A/B, Footer, Guide article, Hub, Home sections, Roundup sheet, Test layout) **before** page frames.
3. Do not create 50 duplicate boards. Do not create a new Figma file.
4. Match page-family architecture (§02).
5. Put code-vs-Figma diffs in a temporary `99 — SYNC QA` page in the **existing** file.
6. Skip review overlay pixels. Specify Ratings from `RatingsSpecsTab.astro` (fragment 404s on this localhost).
7. Desktop Figma ↔ 1440 code. Mobile Figma ↔ 390 code.

---

## 20 — QA checklist

- [ ] Homepage full-bleed + hex on sections, not through cards
- [ ] Hub ink hero + light body + search overlay above Start here
- [ ] Hub topic hover is wash, not left bar
- [ ] Brands dropdown has **no** View all brands
- [ ] Two headers with different labels
- [ ] Footer `#0d0d10`, no hex, mobile 2-column groups
- [ ] YouTube URLs include `?sub_confirmation=1` (spec only; not visible as text)
- [ ] Guide articles share one narrow template
- [ ] No fake Video Prompt Guide page
- [ ] Roundup boxed sheet only on `/best/…`
- [ ] Glossary empty state matches localhost
- [ ] Ratings documented as lazy panel + fragment shots
- [ ] Comparison = roundup table + alternatives + directory
- [ ] Test hub / category / market-data / all-tests
- [ ] About, sitemap, guides index
- [ ] Dark charcoal (not navy)
- [ ] Bottom app bar excluded from footer component
- [ ] All PNG filenames appear in `SCREENSHOT-INDEX.generated.md`

---

## 21 — Limitations

1. **Review Overview** may throw in this environment if `product.verdicts` is empty (`OverviewTab.astro` `defaultVerdict.id`). Overlay screenshots are **not** the design.
2. **Glossary** is empty without published DB entries. Search/A–Z are specified from code for the published state only.
3. **Video prompt guide** is a section, not a route.
4. Brands list currently contains **OurDream AI** only (only hub in `BRAND_HUB_BY_SLUG`).
5. Full-page PNGs of long guides are tall; prefer section crops for Figma frames, then check `*-full.png` for rhythm.
6. Automated `*-footer.png` element clips are **unreliable** (viewport-relative clip). Use these frames instead:
   - Desktop footer: `ourdream-hub-desktop-1440-light-topic-row-hover.png`, `glossary-desktop-1440-light-default.png`.
   - Mobile two-column footer: **`glossary-mobile-390-light-full.png`** (Explore|Testing and Resources|Company wrap). The pink bottom app bar overlays the channels block and is **not** part of `.site-footer`.
7. Roundup compare screenshot shows **em-dashes** for many Key Features / Real-world pricing cells in this data set — that is the current render, not a missing Figma component.
8. `--color-footer` computed token is still `#1a2418` on `<html>`; **painted footer is `#0d0d10`**. Sync the painted color.

---

## 22 — Screenshot index

Authoritative table: **`docs/figma-sync-current/SCREENSHOT-INDEX.generated.md`**.

Naming: `{page}-{desktop|mobile}-{1440|390}-{light|dark}-{section}.png`.
