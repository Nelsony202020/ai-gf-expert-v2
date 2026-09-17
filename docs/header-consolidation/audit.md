# Canonical content header — audit (Step 1, no code changes)

Branch: `fix/canonical-content-header` (off `main`, commit `2a38748`)
Method: repo read + live production measurement with headless Chromium at 1440px and 390px
(`/reviews/ourdream-ai/`, `/reviews/candy-ai/`, `/guides/ourdream-ai/`, `/glossary/`, `/`).

**Headline:** the shared header component is already used almost everywhere. Nothing needs to be
recreated. Every reported bug traces to **three** defects plus dead legacy CSS.

---

## 1. Every header implementation that exists

### Live chain (one component, four wrappers)

| File | Lines | Role |
|---|---|---|
| `src/components/home/desktop/HomeDesktopHeader.astro` | 277 | **The canonical header.** Markup + dropdown/search JS. Props: `variant: 'hero' \| 'standard'`, `registerAsSiteHeader`. |
| `src/components/layout/ContentPageHeader.astro` | 6 | Thin wrapper → `HomeDesktopHeader variant="hero" registerAsSiteHeader` |
| `src/components/layout/GlobalSiteHeader.astro` | 50 | Wraps header in `.guide-hub > .guide-hub__hero`, links `home-desktop.css` + `guide-hub.css`, optionally renders `.guide-hub__hero-body` |
| `src/components/Header.astro` | 8 | Public entry for content pages → `GlobalSiteHeader` |

There is **no** review-specific header component and **no** separate mobile header component.
Mobile is the same `<header>` with `.home-v2__nav` / `.home-v2__theme` hidden below 1024px and
`.home-v2__menu-toggle` shown; the burger opens the global drawer
`src/components/mobile/SiteMobileMenu.astro` (rendered once in `BaseLayout`).

Supporting: `src/components/home/desktop/HomeIcon.astro` (icon set),
`src/components/ui/ThemeToggle.astro` → `ThemeModeIcons.astro` → `src/lib/ui/lucideIconPaths.ts`,
`src/data/brand-nav.ts` (Brands dropdown data), `src/data/site-search.ts` (search index).

### Stylesheets that style the header

| File | Lines | Loaded by | Status |
|---|---|---|---|
| `src/styles/home-desktop.css` | 2674 | `<link>` from `GlobalSiteHeader` (every content page) + homepage bundle | **LIVE — authoritative.** Header rules at 77–110, 170–500, 2166–2200; dark mode 2551–2570 |
| `src/styles/guide-hub.css` | ~1150 | `<link>` from `GlobalSiteHeader` | **LIVE** — hero band, `.guide-hub--site-chrome`, `.guide-hub__hero-body` |
| `src/styles/home-chrome-header.css` | 494 | **nothing** | **DEAD.** Not `@import`ed, not `<link>`ed, not referenced in `astro.config.mjs`. Near-duplicate of the header block in `home-desktop.css`, and the only place `--home-*` vars were scoped to `.home-v2__header` — i.e. the file that would have fixed bug #2 |
| `src/styles/header.css` | 1122 | `@import` in `global.css` (all pages) | **LEGACY.** 64 of its 66 `site-header*` classes have no markup anywhere. Only live parts: the `:root` tokens at 3–29 and `.site-header__menu-icon--bars/--close` (used by `HomeDesktopHeader` + `SiteMobileMenu`) |
| `src/styles/review-page.css` | 122 | via `page-review.css` (review theme) | **LIVE** — `--site-header-height: 5rem`, tab-bar sticky offset, `site-header--joined-tabs` |
| `src/styles/glossary.css` 3–7 | — | glossary | forces `[data-site-header] { position: relative !important }` |
| `src/styles/roundup.css` 34–53 | — | roundup | legacy `position: fixed` branch for pages without `.guide-hub--site-chrome` |
| `src/styles/dark-mode.css` 17–25 | — | all | `!important` dark chrome for the dead `.site-header` |
| `src/styles/mobile-nav.css`, `site-mobile-menu.css`, `nav-sheet.css` | — | all | **LIVE** — burger drawer / bottom nav, not the header bar |

---

## 2. Which pages use which header

**`Header.astro` → `GlobalSiteHeader` (`wrapGuideHub=true`)** — reviews `/reviews/[slug]` and
`/reviews/preview/[slug]`, `/reviews/`, `/guides/` index, all individual guides
(`/guides/[slug]`, `ourdream-ai-prompt`, `ourdream-ai-comics`, `ourdream-ai-image-prompt`,
`how-to-*`), `/glossary/`, `/sitemap`, `/about`, `/contact`, `/editorial-guidelines`,
`/author/[slug]`, `/ai-girlfriend-apps/`, `/best/ai-girlfriend/`, `/legal/*` (via `LegalPage`),
all `/test/*` pages, `/dev/home-full`.

**`GlobalSiteHeader` directly (`wrapGuideHub=false`)** — `BrandGuideHub.astro`,
`OurDreamGuideHub.astro`, i.e. `/guides/ourdream-ai/` (and `BrandGuideHubPage` layout).
**These are the pages Nelson says are correct** — and the only difference is that
`/guides/ourdream-ai/` and `BrandGuideHubPage` wrap their content in `<div class="home-v2">`.

**Homepage** — `/` → `HomeDesktop` → `HomeDesktopHero` → `HomeDesktopHeader registerAsSiteHeader={false}`,
inside `<div class="home-v2">`. **Out of scope, untouched.**

Only three files in the repo emit `class="home-v2"`:
`HomeDesktop.astro:20`, `BrandGuideHubPage.astro:47`, `pages/guides/ourdream-ai.astro:31`.

---

## 3. Root causes (measured on production)

### Bug A — "header becomes far too tall" + "huge empty dark area" on mobile
`GlobalSiteHeader` decides whether to render the dark hero body with
`const hasBodySlot = Astro.slots.has('default')`. But `Header.astro` **unconditionally** passes
`<slot />` to `GlobalSiteHeader`, so `hasBodySlot` is **always true** — even when a page renders
`<Header />` with no children. Result: an **empty** `.guide-hub__hero-body` is rendered on every
content page, and it keeps its padding.

Measured (`/reviews/ourdream-ai/`):

| | desktop 1440 | mobile 390 |
|---|---|---|
| `.guide-hub__hero` height | **168px** | **144px** |
| header height | 80px | 80px |
| empty `.guide-hub__hero-body` | **88px** (padding `40px 48px`, innerHTML `""`) | **64px** (padding `28px 36px`) |

`/guides/ourdream-ai/` renders the same node with real content (h1 + lede + search), so the band
looks intentional there. That 88/64px of empty `var(--hub-ink)` **is** the "far too tall header"
and the "huge empty dark block".

### Bug B — transparent dropdown, wrong border colour, header not aligned to the content grid
All `--home-*` custom properties are declared on **`.home-v2`** (`home-desktop.css:1–45`, dark at
2551). Content pages have no `.home-v2` ancestor, so on those pages every `var(--home-*)` in the
header resolves to *invalid at computed-value time*:

| property | guides hub / homepage | review, glossary, guides index, everything else |
|---|---|---|
| `--home-card` | `#fff` | **(empty)** |
| `.home-v2__drop-panel` background | `rgb(255,255,255)` | **`rgba(0,0,0,0)` — transparent** |
| `.home-v2__drop-panel` border-color | `rgb(230,230,227)` | `rgb(247,247,246)` (falls back to `currentColor`, near-white) |
| `--home-gutter` / `--home-max` | `32px` / `1120px` | **(empty)** → `padding-inline` invalid → **0px** |
| header padding-inline | `160px` | **0px** — logo/nav flush to the viewport edge while page content sits in the 1120px container |

`position: absolute`, `z-index: 20` and the outside-click/Escape handlers are already correct —
the panel really is an overlay, it is just see-through and unreadable. This is the whole of
"dropdown sometimes renders transparent" and of "old styles conflicting".

Note: `home-chrome-header.css` (dead file) **does** scope these vars to `.home-v2__header`.
Whoever wrote it fixed this bug in a file that was never wired up.

### Bug C — "opening a dropdown expands the header vertically and pushes content down"
**Not reproducible on production today.** Measured with the panel open: header stays `80px`,
hero stays `168px`, panel is `position: absolute; z-index: 20`, rect `y=64 h=156` — out of flow.
What is real and reads the same way: the panel opens at `top: calc(100% + 8px)` relative to the
**32px-tall trigger**, so it starts at y≈64 and overlaps the header's own bottom edge (80px) by
16px, on a transparent surface. Once the surface is opaque the overlap will look like the header
grew. Fix = anchor the panel to the header's bottom edge, not the button's.

### Bug D — header scrolls away while the tab bar sticks at 80px
`.home-v2__header--hero` is `position: relative; z-index: 4` — **the content header is not sticky
at all**. `review-page.css` still sets the tab bar to `position: sticky; top: var(--site-header-height)`
(`5rem`), so after scrolling there is an **80px empty gap above the tab bar**
(measured: `headerTop: -900`, `tabbarTop: 80`). Only the dead `.site-header` / `.home-v2__header--standard`
rules carry `position: sticky; z-index: 50`.
**Decision needed from Nelson** — the brief's z-index rule says "sticky header 50", but the Guides
Hub (declared correct) is also non-sticky. Either make the canonical header sticky at z-index 50,
or keep it static and set the tab-bar offset to 0.

### Bug E — token collision on `--site-header-height`
`header.css:4` `:root { --site-header-height: 3.5rem }` (768px → `4.25rem`) vs
`review-page.css:5` `5rem` vs `roundup.css:30` `5rem`. The real header is 80px = 5rem.
Whichever `<link>` lands last wins; today review pages resolve to `5rem` by luck of link order.

### Bug F — Brands dropdown lists 3 brands
`src/data/brand-nav.ts:28` `POPULAR_BRAND_SLUGS = ['candy-ai','ourdream-ai','spicychat','girlfriendgpt']`,
filtered through `BRAND_HUB_BY_SLUG` (5 entries). Live menu renders **Candy AI, OurDream AI,
GirlfriendGPT**. `buildBrandNav()` feeds **both** the desktop dropdown (`HomeDesktopHeader:64`)
and the mobile burger menu (`SiteMobileMenu.astro:10`).
`BRAND_HUB_BY_SLUG` also defines the brand-hub routes and must not be touched.

### Bug G — icons
- Moon: `src/lib/ui/lucideIconPaths.ts:2` = `M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z`.
  That is the **Feather** moon, not Lucide's; at `stroke-width:1.5` in a 20px box it reads as a
  broken partial circle. Canonical Lucide moon is `M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z`.
  One-line change, shared by header toggle, footer toggle and `HomeIcon`.
- Burger/close: `HomeDesktopHeader.astro:106–111` inlines two hand-written filled SVG paths
  (`fill="currentColor"`) instead of using `HomeIcon` (stroke, 1.5, 24-box) — the only icons in
  the header not from the canonical set. `HomeIcon` has no `menu`/`x` entry yet; both need adding.
- Search, chevrons, info are already `HomeIcon`. ✅

### Bug H — z-index map today
`.guide-hub__hero` `z-index:2` · header `z-index:4` · `.home-v2__header-actions` `6` ·
theme toggle `7` · drop panel `20` · search dropdown `30` · review tab bar `45`.
Target per brief: sticky header 50, decorative layers 0 + `pointer-events:none`, content 1.
`.guide-hub__glow` is already `display:none !important` and `pointer-events:none`. ✅

---

## 4. Files to delete vs keep

**Delete**
- `src/styles/home-chrome-header.css` — 494 lines, imported by nothing. Its var-scoping block is
  worth porting into `home-desktop.css` (fix for Bug B) before deleting.
- `src/styles/header.css` — 1122 lines, **after** moving out the two things still used:
  the `:root` `--site-header-*` / `--mobile-nav-*` tokens (→ `global.css`, with
  `--site-header-height` corrected to `5rem`) and `.site-header__menu-icon--bars/--close`
  (→ renamed into the canonical header CSS once the burger uses `HomeIcon`).
  Then drop its `@import` from `global.css:4`.
- `src/styles/dark-mode.css:17–25` — `!important` rules for the dead `.site-header`.
- `src/styles/roundup.css:34–41` — legacy `position: fixed` branch for the pre-guide-hub chrome.
- `src/styles/glossary.css:3–7` — `position: relative !important` override, once the canonical
  header has one positioning rule.

**Keep and fix**
- `HomeDesktopHeader.astro` — the one canonical header (gate the empty slot, fix panel anchor,
  swap burger to `HomeIcon`).
- `GlobalSiteHeader.astro` / `ContentPageHeader.astro` / `Header.astro` — keep the chain; fix the
  slot detection in `Header.astro` (`Astro.slots.has('default')` there, forward conditionally).
- `home-desktop.css` — add a `.home-v2__header { --home-*: … }` scope block (light + dark) and
  give the header its own gutter tokens so it no longer depends on `.home-v2`.
- `guide-hub.css` — keep; the hero band is correct when it has content.
- `review-page.css` — keep; only the `--site-header-height` / tab-bar offset line changes.
- `brand-nav.ts` — keep `BRAND_HUB_BY_SLUG` untouched; change only the header nav list.
- All `src/components/mobile/*` — unchanged, no review-specific mobile header exists.

**Not touched:** `HomeDesktop*` homepage path, `src/components/guides/article/*`,
`src/styles/aige-article.css`, routes, schema, DB, `/go/` logic, pricing, hub glow,
ratings logic, video lightbox.

---

## 5. Proposed build order (awaiting approval)

1. `Header.astro` + `GlobalSiteHeader.astro` — render `.guide-hub__hero-body` only when a page
   actually passes content. Kills the 88/64px dark block everywhere. *(Bugs A)*
2. `home-desktop.css` — scope `--home-*` (light + dark) to `.home-v2__header`; header gutter
   tokens independent of `.home-v2`. Opaque dropdowns + correct 1120px alignment sitewide. *(Bug B)*
3. Dropdown popover polish: anchor to header bottom, restrained radius, opaque dark surface in
   dark mode, shadow, `z-index` above the header. *(Bug C)*
4. `brand-nav.ts` — header menu lists OurDream AI only. *(Bug F)*
5. Icons: canonical Lucide moon; `menu` + `x` added to `HomeIcon`; burger uses them. *(Bug G)*
6. z-index + sticky decision, `--site-header-height` consolidated to one definition. *(Bugs D, E, H)*
7. Delete `home-chrome-header.css`, retire `header.css`, drop the dead overrides. *(§4)*

## 6. Open questions

1. **Sticky or not?** (Bug D) — make the content header sticky at z-index 50 per the brief, or
   keep the Guides-Hub behaviour (scrolls away) and zero the tab-bar offset?
2. **Brands in the mobile burger menu** — "header menu only" covers the mobile drawer too
   (same `buildBrandNav` call). Assume yes unless told otherwise.
3. The empty dark band is also what currently separates the dark header from light page content
   on review pages. Removing it puts the light page directly under the 80px dark bar — matching
   the Brand Guide Hub. Confirm that is the intended look.
