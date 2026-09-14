# AI Girlfriend Expert — CURRENT Code → Figma Handoff

> **IMPORTANT:** This handoff **supersedes all previous Figma sync handoffs** (including `docs/figma-sync/FIGMA-SYNC-HANDOFF.md`). **Current localhost render + the screenshots in `docs/figma-sync-current/screenshots/` are the visual source of truth.** Do not use old Figma frames or older written specs when they disagree with these screenshots or with the live code paths cited below.

## 00 — Rules

- **SYNC only** — do not redesign, re-theme, or “improve” layouts.
- **Screenshots win** over prose when they disagree.
- **Code wins** over old Figma when screenshots are missing or blocked (see § Limitations).
- Capture **page families separately** — do not assume one global “boxed editorial sheet” applies site-wide.
- The pink **mobile bottom app bar** (`MobileNavShell`) is **not** the footer. The footer is `.site-footer`.

## 01 — Runtime / audited routes

| Item | Value |
| --- | --- |
| Repo | `Nelsony202020/ai-gf-expert-v2` |
| Dev | `npm run dev` → **http://127.0.0.1:4321** |
| Capture date | 2026-09-14 (headless Chrome, localhost) |
| Screenshot folder | `docs/figma-sync-current/screenshots/` (**84 PNGs**) |
| Full screenshot index | `docs/figma-sync-current/SCREENSHOT-INDEX.generated.md` |

| Route | Purpose |
| --- | --- |
| `/` | Homepage (`HomeDesktop.astro`, `home-desktop.css`) |
| `/best/ai-girlfriend/` | Main roundup (boxed sheet over hero — **unique layout**) |
| `/reviews/ourdream-ai/` | OurDream review (**see § Limitations — dev overlay**) |
| `/guides/ourdream-ai/` | OurDream guides hub |
| `/glossary/` | Glossary (**empty state in this environment**) |
| `/sitemap/` | HTML site index |
| `/test/` | How we test hub |

---

## 02 — Page architecture (by family)

### Homepage (`/`)

- **NOT** a single boxed white page on a dark canvas.
- **Full-width section stack** inside `.home-v2` with `--home-max: 1120px` content gutters (`padding-inline: max(32px, (100% - 1120px) / 2)` on major blocks).
- **Marketing dark bands** (`--home-ink: #101014`) on hero, methodology, closing CTA — each paints **its own fixed 48px grid** (`--hex-canvas-dark`), not a site-wide blend overlay.
- **Light bands** (`--home-page: #f7f7f6`) on rankings, selector, score, latest, tester — fixed **light grid** (`--hex-canvas-light`, opacity `0.04` light / `0.045` dark page).
- **Cards/proof/metrics** use **opaque** `--home-card: #ffffff` (no grid visible through card fills).
- **Proof metrics bridge** overlaps ink→light seam (see `homepage-desktop-1440-light-proof-metrics.png`).
- **Footer**: shared `.site-footer`, full width, **no hex**.

**Screenshots:** `homepage-desktop-1440-light-*`, `homepage-desktop-1440-dark-*`, `homepage-mobile-390-light-*`.

### Roundup — Best AI Girlfriend (`/best/ai-girlfriend/`)

- **Distinct “boxed sheet” pattern** (do **not** apply to homepage, hub, glossary, or site index):
  - Fixed **dark hero stage** behind header (`roundup-hero-stage`, `#141414` + banner art).
  - Main editorial surface: `.roundup-page--covers-hero` — **raised light sheet** with **top radius** `var(--radius-xl)`, shadow `0 -10px 40px rgb(0 0 0 / 8%)`, `margin-top` tuck under hero.
  - **Sticky glass header** over hero (`body:has(.roundup-hero-stage) .site-header { position: fixed }`).
  - Inner content max ~`48rem` editorial column + sidebar TOC (`roundup.css` tokens).
- **No homepage-style hex grid** on this page family.

**Screenshots:** `roundup-desktop-1440-light-hero-intro.png`, `roundup-desktop-1440-light-viewport-mid.png`, `roundup-desktop-1440-light-full.png`, mobile equivalents.

### Review (`/reviews/[slug]/`)

- **NOT** the roundup boxed sheet. Uses **`Header.astro`** + **`theme="review"`** + standard **`section-container`** (`max-width: 1280px`) rows on **`--color-background`** (computed light ~`rgb(249, 249, 249)`).
- **Hero**: `ReviewHero.astro` — breadcrumbs, display H1, meta row, gallery + ratings (gallery hidden on mobile ≤767px).
- **Sticky tab bar**: `TabBar.astro` / `.review-tabbar` — pins under header when scrolling (`review-page.css`).
- **Tab panels**: Overview (default), Ratings (lazy iframe panel), Review article, Media, Pricing (`PricingTab.astro` — plans, benchmark, calculator/mixer when plan selected).
- **Draft banner** on localhost for unpublished products (amber bar).
- **Desktop vs mobile**: mobile hides hero gallery; tab bar scrolls horizontally; **no roundup-style side gutters on a raised sheet**.

**Code refs:** `src/pages/reviews/[slug].astro`, `src/styles/page-review.css`, `src/styles/review-page.css`.

**Screenshots:** Intended set `review-*-*.png` — **currently show Astro dev error overlay** (§ Limitations). Use code + partial pricing filenames only after re-capture.

### OurDream guides hub (`/guides/ourdream-ai/`)

- **Full-width hub** (`.guide-hub`), **not** a boxed roundup sheet.
- **Hero band**: `--hub-ink: #101014`, centered glow SVG, **`HomeDesktopHeader`** (marketing header family).
- **Page body**: `--hub-page: #f7f7f6` with subtle **48px grid** on `::before` (opacity `0.45` on layer).
- **Start here** + **Browse by topic** (`<details>` cards) on light surface.
- **Search**: inline panel under field (`data-hub-guide-input`, `data-hub-guide-hits`).

**Screenshots:** `ourdream-hub-desktop-1440-light-*`, `ourdream-hub-mobile-390-light-*`.

### Glossary (`/glossary/`)

- **Standard content page**: `Header.astro` + `section-container` + **`max-w-3xl`** narrow column — **not** a raised boxed sheet.
- **In this localhost environment**: **no published glossary entries** — UI shows `.glossary-page__empty` only (no search/A–Z UI). When entries exist, controls live in `glossary.css` (`#glossary-search`, chips, A–Z nav).

**Screenshots:** `glossary-*-default.png`, `glossary-*-full.png` (empty state).

### Site index (`/sitemap/`)

- **Full-width** `section-container` page background `var(--color-background)`.
- **Card grid** layout (`.sitemap-card`, 4-col top row desktop → 2-col → 1-col). **Not** homepage hex, **not** roundup boxed sheet.

**Screenshots:** `sitemap-desktop-1440-light-*`, `sitemap-mobile-390-light-*`.

### Test hub (`/test/`)

- Standard content layout + test-hub sections (`test-hub.css`). Documented for methodology cross-linking; see `test-desktop-1440-light-full.png`.

---

## 03 — Header variants (do not merge)

### A — Marketing header (`HomeDesktopHeader.astro`)

**Used on:** `/`, `/guides/ourdream-ai/` (hub hero).

| Aspect | Light | Dark |
| --- | --- | --- |
| Background | Transparent on ink hero (`rgba(0,0,0,0)`) | Same on `#101014` hero |
| Hex/grid in header | **No** — hex is on **section** backgrounds behind header |
| Nav | **Best apps ▾ · Reviews ▾ · Brands ▾ · Guides · How we test** | Same |
| Logo | CSS `/brand/...` via `.home-v2__logo` | Theme-swapped assets |
| Icons | Search + theme toggle (40×40 hover circle) | Same |
| Height | ~80px desktop (computed 1440: **80px**, padding-inline **160px** at full bleed) | Same |
| Dropdowns | `.home-v2__drop-panel` — Brands kicker “Popular brands”, view-all → `/ai-girlfriend-apps/` | Same structure |

**Screenshots:** `homepage-desktop-1440-light-hero.png`, `homepage-desktop-1440-light-brands-dropdown.png`, `ourdream-hub-desktop-1440-light-hero-default.png`.

### B — Content header (`Header.astro`)

**Used on:** reviews, roundups, glossary, sitemap, test, most inner pages.

| Aspect | Light | Dark |
| --- | --- | --- |
| Background | `--site-header-glass-bg: rgb(248 250 243 / 78%)` + blur | `rgb(16 16 20 / 92%)` |
| Hex/grid | **Absent** from header surface |
| Nav | **Explore ▾ (mega) · All Apps · Brands ▾ · How We Review** | Same |
| Sticky | `position: sticky; top: 0; z-index: 50` | Same |
| Mobile | Hamburger → sheet with Brands block (shared `buildBrandNav`) | Same |

**Note:** Nav **labels differ** from marketing header — this is **intentional in code**, not a Figma simplification.

---

## 04 — Footer (global)

**Component:** `Footer.astro` + `footer.css`

| Aspect | Value |
| --- | --- |
| Background | **`#0d0d10`** — **no hex/grid** |
| Border top | `#1c1c22` |
| Container max | `80rem` (`section-container`) |
| Logo | White WebP, **height ~2.75rem**, max-width **8rem** |
| Sign-off | “Tested, **not hyped.**” — second phrase pink (`#db2777`) |
| Desktop columns | Brand + Channels, then Explore / Testing / Resources / Company |
| Mobile | **Two-column wrap** on link groups: `.site-footer__nav { flex-wrap; gap: 2rem 1.5rem }`, `.site-footer__col { min-width: 7.5rem; flex: 1 }` — **not** one long single column |
| Legal row | Copyright + Privacy / Terms / Accessibility + theme toggle |

**Screenshots:** `homepage-desktop-1440-light-footer.png`, `homepage-mobile-390-light-footer.png`, hub/roundup `*-footer.png`.

---

## 05 — Visual tokens (extracted — verify on screenshots)

### Global content (light)

| Token | Typical value |
| --- | --- |
| `--color-background` | `#f9f9f9` (body computed) |
| `--color-surface-container-lowest` | cards/chips |
| `--color-accent` / brand pink | `#db2777` |
| `.section-container` max-width | **1280px** |

### Global dark (`html[data-theme='dark']`)

| Token | Value |
| --- | --- |
| `--color-background` | `#121214` |
| `--color-surface-container` | `#1b1b1f` |
| `--color-header-surface` | `#101014` |
| `--color-footer` | `#0d0d10` |

### Homepage only (`.home-v2`)

| Token | Value |
| --- | --- |
| `--home-ink` | `#101014` |
| `--home-page` | `#f7f7f6` |
| `--home-card` | `#ffffff` |
| `--home-pink` | `#db2777` |
| `--home-max` | **1120px** |
| Grid | **48px**, fixed attachment, dark opacity **0.07**, light **0.04** |

### Hub (`.guide-hub`)

| Token | Value |
| --- | --- |
| `--hub-ink` | `#101014` |
| `--hub-page` | `#f7f7f6` |
| Grid | 48px, low-contrast lines, layer opacity **0.45** |

---

## 06 — Components & interaction states (implemented)

| Interaction | Where | Screenshot hints |
| --- | --- | --- |
| Brands dropdown (marketing) | Home / hub header | `*-brands-dropdown.png` |
| Herman badge flip | Homepage desktop | `*-herman-flipped.png` |
| Hub search results / empty | OurDream hub | `*-search-results.png`, `*-search-empty.png` |
| Hub topic open | Browse by topic | `*-topics-open.png` |
| Roundup boxed sheet + fixed hero | Best AI GF | `roundup-desktop-1440-light-hero-intro.png` |
| Review tabs / pricing | Review | **Re-capture needed** (§ Limitations) |
| Score rings | Homepage rankings | `homepage-*-rankings.png` |
| Mobile footer 2-col | All pages | `*-footer.png` (element crop) |

---

## 07 — STALE / DO NOT USE

Do **not** carry forward from old Figma or old handoffs:

- **Navy / sky-blue** marketing dark (`#020617`, `#0f172a`, `#1e293b`).
- **Lime** as primary brand/action on marketing surfaces.
- **Single global header** — there are **two** implementations (§03).
- **Boxed roundup sheet** applied to homepage, hub, glossary, or site index.
- **Footer hex/grid** — current footer is flat `#0d0d10`.
- **Old oversized “Tested, not hyped.”** — current sign-off is compact (`footer.css`).
- **Deprecated mobile bottom app bar** as footer (Best Apps / Buying Guide / FAB / Reviews / More).
- **“Our brands”** nav label — must be **Brands**.
- **Glossary search/A–Z** mockups when localhost has **zero published entries** (empty state is truth here).

---

## 08 — Screenshot index

**84 files** in `docs/figma-sync-current/screenshots/`.

The complete table (filename, route, viewport, device, theme, state, section) is in:

**`docs/figma-sync-current/SCREENSHOT-INDEX.generated.md`**

Naming pattern: `{page}-{desktop|mobile}-{1440|390}-{light|dark}-{section}.png`

---

## 09 — Limitations & localhost inconsistencies

### Review pages — **critical**

Automated captures of `/reviews/ourdream-ai/` (and `candy-ai`) show the **Astro dev error overlay**:

`TypeError: Cannot read properties of undefined (reading 'id')` at `OverviewTab.astro` (~line 710, `defaultVerdict.id`).

- **Do not use** `review-*-hero-overview.png`, `review-*-tab-pricing.png`, etc., for Figma parity until the page renders without the overlay.
- **Architecture** in §02 Review is from **source code**, not from those PNGs.
- **Action for design sync:** Re-run capture after product/verdict data renders in dev, or capture from a production preview build.

### Glossary

- **No published entries** in this environment → empty state only. Search/sticky A–Z **not** visible on localhost.

### Header nav copy

- Marketing vs content headers use **different nav items** (§03). Figma must show both variants on the correct page families.

### Draft reviews

- Localhost shows amber **Draft — not published** banner on review pages.

### Mobile bottom nav

- Still present on many routes via `MobileNavShell` — document as separate chrome, not footer.

---

## 10 — Major differences from `docs/figma-sync/FIGMA-SYNC-HANDOFF.md`

| Topic | Previous handoff | This handoff |
| --- | --- | --- |
| Scope | Homepage + OurDream hub only | **7 route families** + test hub |
| Screenshots | 16–26, some with browser chrome | **84** headless viewport captures |
| Page layout model | Risk of implying one global pattern | **Explicit per-family** (homepage full-bleed vs roundup boxed sheet vs content pages) |
| Headers | Often treated as one | **Two documented variants** with different nav labels |
| Roundup / review / glossary / sitemap | Minimal or absent | Documented + screenshots (except review overlay) |
| Glossary / review | Assumed full UI | **Empty glossary** + **review dev error** called out |
| Supersedes | — | **Explicitly replaces** all prior sync docs |

---

## 11 — Figma sync instructions (short)

1. Read this file and **every screenshot** in `docs/figma-sync-current/screenshots/`.
2. Update **components** (headers, footer, homepage sections, hub, roundup sheet) before page frames.
3. Match **page family** architecture — do not paste roundup sheet onto hub/homepage.
4. Use **marketing header** on home + OurDream hub only; **content header** elsewhere.
5. Footer: **no hex**; mobile **two-column** link wrap.
6. Put review frames on hold until review screenshots re-captured without error overlay.

---

## 12 — QA checklist

- [ ] Homepage full-bleed sections + hex only on section backgrounds (not through cards)
- [ ] Roundup boxed sheet + fixed hero (only on `/best/…`)
- [ ] Hub full-width light body + ink hero
- [ ] Glossary narrow column / empty state acknowledged
- [ ] Site index card grid (not boxed sheet)
- [ ] Two header variants
- [ ] Footer `#0d0d10`, no hex, mobile 2-col groups
- [ ] Bottom app bar excluded from footer component
- [ ] Review pages **blocked** until overlay fixed
- [ ] All 84 screenshot filenames listed in `SCREENSHOT-INDEX.generated.md`
