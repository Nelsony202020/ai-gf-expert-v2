# AI Girlfriend Expert — Code → Figma Sync Handoff

## 00 — Source of Truth / Rules

- **Current rendered code is the source of truth.** This handoff describes what the implementation does *now*, not an older Figma file.
- Design AI must **SYNC**, not redesign.
- Homepage and OurDream hub have already been approved in code. Old Figma may be stale. **Screenshots supersede stale Figma.**
- Update **global components** (header, footer, buttons, cards, hex) before duplicating instances.
- Do not invent alternate homepage versions, extra boards, or a new visual system.
- Do **not** treat the pink mobile **bottom app bar** (Best Apps / Buying Guide / FAB / Reviews / More) as the footer. That bar still exists in current code (`MobileNavShell`) on many pages; it is **not** the footer design to preserve. The footer is `.site-footer`.

## 01 — Runtime / Routes

| Item | Value |
| --- | --- |
| Repo | `Nelsony202020/ai-gf-expert-v2` |
| Framework | Astro |
| Dev | `npm run dev` → **port 4321 only** |
| Audited routes | `/` and `/guides/ourdream-ai/` |
| Homepage implementation | `src/components/home/desktop/HomeDesktop.astro` + `src/styles/home-desktop.css` |
| Hub implementation | `src/pages/guides/ourdream-ai.astro` + `src/components/guides/hub/OurDreamGuideHub.astro` + `src/styles/guide-hub.css` |
| Related agent | OURDREAM HUB (`bc-1d10a439-9ee8-45b1-aca4-3457cbe94959`, branch `cursor/ourdream-guides-hub-4959`) — hub is already present in this codebase; do not assume a second parallel hub. |

## 02 — Design Tokens

Homepage tokens live on `.home-v2` in `src/styles/home-desktop.css`. Hub tokens live on `.guide-hub` in `src/styles/guide-hub.css`. Content-page charcoal tokens live in `src/styles/dark-mode.css` / `global.css`.

### Marketing / homepage (light)

| Token | Value |
| --- | --- |
| `--home-ink` | `#101014` (marketing near-black) |
| `--home-ink-raised` | `#1c1c22` |
| `--home-ink-border` | `rgb(255 255 255 / 8%)` |
| `--home-page` | `#f7f7f6` |
| `--home-card` | `#ffffff` |
| `--home-sunken` | `#efefed` |
| `--home-hairline` | `#e6e6e3` |
| `--home-text` | `#141317` |
| `--home-secondary` | `#55545b` |
| `--home-muted` | `#8a8991` |
| `--home-on-ink` | `#f7f7f6` |
| `--home-on-ink-muted` | `#a4a3aa` |
| `--home-pink` | `#db2777` |
| `--home-high` | `#16a34a` |
| `--home-mid` | `#e8760a` |
| `--home-low` | `#dc2626` |
| `--home-track` | `#e7e7e4` |
| `--home-gutter` | `32px` (desktop); `28px` ≤1200; `20px` ≤720 |
| `--home-max` | `1120px` |
| `--home-ease` | `180ms ease` |
| `--home-ease-move` | `180ms cubic-bezier(0.22, 1, 0.36, 1)` |
| `--home-grid-size` / `--hex-size` | `48px` |
| `--hex-dark-opacity` | `0.07` |
| `--hex-light-opacity` | `0.04` |
| `--hex-muted-opacity` | `0.028` (AIGE score section) |
| `--hex-line-dark` | `rgb(255 255 255 / 0.07)` |
| `--hex-line-light` | `rgb(20 19 23 / 0.04)` |

### Homepage dark theme (`html[data-theme='dark'] .home-v2`)

| Token | Value |
| --- | --- |
| `--home-page` | `#121214` |
| `--home-card` | `#1b1b1f` |
| `--home-sunken` | `#161619` |
| `--home-hairline` | `#2a2a30` |
| `--home-text` | `#f5f5f5` |
| `--home-ink` | still `#101014` |
| `--hex-light-opacity` | `0.045` (white lines on charcoal page) |

### Hub

| Token | Value |
| --- | --- |
| `--hub-ink` | `#101014` |
| `--hub-page` | `#f7f7f6` |
| `--hub-card` | `#ffffff` |
| `--hub-pink` | `#db2777` |
| `--hub-grid-line` | `rgb(20 19 23 / 0.035)` at layer `opacity: 0.45` |

### Typography

| Role | Stack |
| --- | --- |
| Sans | `'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif` |
| Display (homepage) | `'Bricolage Grotesque Variable', 'Bricolage Grotesque'` then `--font-display` (Hanken Grotesk Variable) |
| Italic accent | `'Instrument Serif'` via `em` |
| Mono | JetBrains Mono Variable |

### Radius / shadow (homepage)

- Cards / proof: `20px` radius
- Proof / float shadow: `0 4px 8px rgb(21 17 26 / 10%), 0 24px 48px -8px rgb(21 17 26 / 16%)`
- Pills / nav hover: `999px`
- Dropdown: `14px` panel, `10px` rows

### Breakpoints used by these pages

| Width | What changes |
| --- | --- |
| `1200px` | Homepage grids → 1 column; header wraps |
| `1024px` | `Header.astro` desktop nav shows; below that hamburger |
| `900px` | Footer brand+nav row; footer cols stop wrapping |
| `720px` | Homepage tighter type / 260px Herman |

### Three surface families

1. **Marketing dark** — `#101014` + white hex `7%` + optional pink glow. Hero, methodology, CTA, hub hero. **Does not follow content dark-mode wash.**
2. **Content light** — `#f7f7f6` page + `#ffffff` cards + faint dark hex `4%`. Rankings, selector, score, latest, tester, hub body.
3. **Content dark** (theme toggle on content pages / homepage light sections) — page `#121214`, cards `#1b1b1f`. Marketing ink stays `#101014`.

**Do not restore navy/sky** (`#020617`, `#0f172a`, `#1e293b`).

## 03 — Global Header

Two components, same family, **not** two unrelated headers:

| Surface | Component | File |
| --- | --- | --- |
| Homepage + OurDream hub | `HomeDesktopHeader` | `src/components/home/desktop/HomeDesktopHeader.astro` |
| Reviews, roundups, most content | `Header` | `src/components/Header.astro` |

Hub explicitly imports `HomeDesktopHeader` (same as homepage), variant default `hero` (transparent over ink).

### HomeDesktopHeader (audited pages)

- Height: **80px** desktop (`padding-block: 0`). ≤1200: `height: auto`, `padding-block: 16px`, nav wraps.
- Logo: `/brand/girlfriend-expert-logo-white.webp`, box **92×51**.
- Nav: Best apps ▾, Reviews ▾, **Brands ▾**, Guides, How we test.
- Nav gap: `24px`; left margin `40px`.
- Icons: search + theme, **40×40** circular hit target, icon **20px**, hover fill `rgb(255 255 255 / 8%)` via `::after` centered on the button (not the SVG).
- Dropdown: `.home-v2__drop-panel` — white/`--home-card`, 14px radius, 8px padding, row hover pink 8% mix.
- Brands panel kicker: “POPULAR BRANDS”; current hub link OurDream AI → `/guides/ourdream-ai/`; footer row “View all brands →” → `/ai-girlfriend-apps/`.
- Not sticky on homepage (in-flow at top of hero). z-index 4 inside hero.
- Border-bottom: `1px solid var(--home-ink-border)`.
- Mobile (homepage): **same header**, wrapped nav — not a separate mobile header component. A **deprecated-style bottom app bar** may still appear from `MobileNavShell`; ignore it when drawing the footer.

### Header.astro (content pages)

- Sticky `top: 0`, z-index 50, glass: light `rgb(248 250 243 / 78%)` blur 10px; dark `rgb(16 16 20 / 92%)`.
- Height: `--site-header-height` 3.5rem / 4.25rem ≥768.
- Desktop nav (≥1024): Explore mega, All Apps, Brands drop, How We Review.
- Mobile: hamburger sheet. Includes Brands section from the **same** `buildBrandNav()` data.

## 04 — Global Footer

File: `src/components/Footer.astro` + `src/styles/footer.css`. Used on homepage (inside `.home-v2`) and hub.

### Desktop (≥900px)

- Background `#0d0d10`, text `#f7f7f6`, top border `#1c1c22`.
- Container max-width `80rem`; padding-top `5.5rem`, padding-bottom `2rem`.
- Top row: brand column **25rem** + nav `space-between` **nowrap** (Explore, Testing, Resources, Company).
- Logo: same white wordmark, height `2.75rem`.
- Channels & Community under brand (YouTube ×2, TikTok, Reddit muted).
- Bottom: copyright, legal links, appearance/theme control.

### Mobile (<900px) — two-column groups

**This is the footer to reproduce.**

`.site-footer__nav` is `display: flex; flex-wrap: wrap; gap: 2rem 1.5rem`.

Each `.site-footer__col` is `flex: 1; min-width: 7.5rem`.

On ~390px this **wraps into two columns**, not a single long stack of every group:

| Row | Left | Right |
| --- | --- | --- |
| 1 | Explore | Testing |
| 2 | Resources | Company |

Brand/logo/description and Channels & Community sit **above** this wrap (full width). Tagline + legal sit **below**.

Do **not** document the pink bottom nav as part of this footer.

## 05 — Shared Components

### Score ring — `HomeScore.astro`

- SVG viewBox `0 0 36 36`, circle r `15.9155`, `pathLength="100"`.
- Group `rotate(-90 18 18)` so progress starts at 12 o’clock, clockwise.
- Track: `--home-track`. Value stroke by tone: high `#16a34a`, mid `#e8760a`, low `#dc2626`.
- `stroke-dasharray: 100`. Before viewport: `stroke-dashoffset: 100`. After `[data-home-reveal].is-inview`: `calc(100 - var(--home-ring))` where `--home-ring` = score×10.
- Ranked duration **1.45s**; score section **1.65s**; easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- Triggers once when reveal IO adds `is-inview` (does not replay on re-enter unless class is removed).
- Reduced motion: jump to final offset, no transition.

### Product ranking card — `.home-v2__product-card`

- Padding 24px, radius 20px, **opaque** `--home-card`, 1px `--home-hairline`.
- Grid: 3 columns / 24px gap desktop; 1 column ≤1200.

### Buttons — `.home-v2__btn--primary` pink fill; `--on-ink` white outline on dark; `--secondary` light.

### Hex / grid

See Homepage backgrounds. **Cards are opaque** — grid does not show through cards.

### Search

Homepage header search expands inline. Hub search is a dedicated field in the hub hero (see §07).

## 06 — Homepage

Page wrapper: `.home-v2`. Order of sections is the source of truth.

### 06.1 Header / hero

**Purpose:** Rankings entry + brand promise.

**Files:** `HomeDesktopHero.astro`, `HomeDesktopHeader.astro`, `home-desktop.css`.

**Desktop:** Hero `min-height: 100svh` at ≥1201px (flex + `.home-v2__hero-fill`). Background `--home-ink` + `--hex-canvas-dark` (`background-attachment: fixed`, size 48px, origin `0 0`). Pink glow image `/home/v2/pink-glow.svg` (620×620, right -40px, top 80px) plus cursor glow (`mix-blend-mode: screen`). Copy left, Herman circle right (`380×380`, left 28px, top 56px in a 540px art well). Display headline Bricolage; `you` is Instrument Serif `#db2777`. Primary CTA `/best/ai-girlfriend/`; secondary `/reviews/`. Finalist stack of 28px logos.

**Mobile:** Art stacks below copy; header wraps; Herman 260×260 ≤720.

**Screenshot:** `homepage-desktop-hero.png`, `homepage-mobile-hero.png`.

### 06.2 Herman interactive circle

**Files:** `HomeHermanBadge.astro`, `HomeMotion.astro` (`initHermanBadge`), CSS `.home-v2__badge*`.

| State | Behavior |
| --- | --- |
| Default | Herman photo `/home/v2/herman-scientist.png`, front face. |
| Desktop hover (`hover: hover` + `pointer: fine`) | Scene `rotate(-1.6deg) scale(1.02)`, 240ms `cubic-bezier(0.22, 1, 0.36, 1)`, pink drop-shadow. **No flip on hover. No navigation.** |
| Desktop click | Flip `rotateY(180deg)`, 520ms same easing, perspective 1200px. |
| Back | Live `#1` from homepage data (name, logo, overall, Images/Characters/Chat). Copy “Current #1 · {award}”. Link **View ranking** → `/best/ai-girlfriend/`. |
| Pointer stays inside circle | Back stays. |
| Pointer leaves circular footprint | Flip back to Herman (mousemove / pointermove / leave / pointerover outside). |
| Mobile | No hover. Tap toggles. Tap View ranking navigates. Tap outside / second tap returns. If hero `intersectionRatio < 0.2`, reset to Herman. One-time nudge animation if coarse pointer (~45% visible). |
| Reduced motion | Crossfade opacity; no 3D; no hover tilt; no nudge. |

Hit target: 380×380 box; visual is a circle. Toggle remains clickable under the ranking link (`scene` z-index 4 when flipped).

### 06.3 Proof / stats bridge

**File:** `HomeDesktopHero.astro` (`.home-v2__proof-bridge`), CSS ~`.home-v2__proof*`.

- Bridge `padding-block: 0`. Top 50% ink + dark hex (`::before`); bottom 50% page + light hex. **Same 48px fixed origin** as hero.
- Card: opaque white, radius 20px, padding `32px 48px` (mobile `24px`), flex 5 metrics: 24+ / 8 / 100% / 30+ days / Weekly (from `src/data/home-proof.ts`).
- Overlaps the ink→light transition; **do not change position/shadow**. Hex continues behind, not through the card.

**Screenshot:** use rankings/proof captures if present; otherwise hero file plus rankings.

### 06.4 Homepage backgrounds (critical)

**Architecture (current):**

```
.home-v2
  └── .home-v2__world-grid     z-index 0, light hex, attachment fixed
  └── sections z-index 1
        ├── dark sections paint --hex-canvas-dark on --home-ink (fixed, 48px, 0 0)
        ├── light sections paint --hex-canvas-light on --home-page (fixed, 48px, 0 0)
        └── cards/proof/selector: opaque --home-card  (no grid through them)
```

- **One coordinate system:** `background-size: 48px 48px; background-attachment: fixed; background-position: 0 0`.
- Not a mix-blend overlay on top of the whole page (that was reverted because it showed through cards).
- `#home-score` uses `--hex-muted-opacity: 0.028` (fainter than other light sections).
- CTA: pink radial at 78% 30% **plus** the same dark hex, attachment `scroll, fixed, fixed`.
- Proof-bridge `::before` covers only the **top 50%** with ink hex so the seam is a surface change, not a missing pattern.
- Decorative full-width borders were removed from Latest, tester row, and CTA top so they do not double the 48px grid lines. List/header borders remain.

**Figma note:** Recreate as one world grid, then opaque cards. Do not restart the grid per section. Do not draw grid on card fills.

### 06.5 Rankings

`HomeDesktopRanked.astro`. Section padding `88px 96px`. 3 opaque cards. Score rings as above. Category bars 6px tracks.

### 06.6 Selector (“Pick what matters”)

`HomeDesktopSelector.astro`. Opaque card `24px` radius, left tab list 280px.

### 06.7 Methodology

`HomeDesktopMethod.astro`. Dark ink + hex. Padding-block 120px. Steps 01–04 with hairline separators (functional, keep). Video 16:9 radius 20px.

### 06.8 AIGE score (“One number. Eight tests.”)

`HomeDesktopScore.astro`. Light reading surface, **weaker hex**. Left editorial + legend chips. Right: overall dial + eight bars.

### 06.9 Latest

`HomeDesktopLatest.astro`. Padding-block 120px. Slightly mixed card/page fill + light hex. Featured + list.

### 06.10 Tester (Herman Carter)

`HomeDesktopTester.astro`. Light section, avatar 220px circle, facts row with a **functional** top border on the facts block only.

### 06.11 Closing CTA

`HomeDesktopCta.astro`. Ink + hex + pink radial. Headline “Stop guessing. Start with the rankings.”

### 06.12 Footer

See §04. Then `MobileNavShell` may paint a bottom pill — **not footer**.

## 07 — OurDream AI Guides Hub

Route: `/guides/ourdream-ai/`.

**Header:** `HomeDesktopHeader` (hero / white logo on ink). Same Brands dropdown as homepage.

**Hero:** `--hub-ink`, glow `/guides/hub/glow.svg` centered. Title “OurDream AI Guides”. Search pill: white field + pink Search. Popular chips: Prompts, Images, Video, DreamCoins. Product row: logo + Visit OurDream AI (affiliate, **no “affiliate” label**) + Read review → `/reviews/ourdream-ai/`.

**Search:** Results panel `.guide-hub__search-panel` opens under the field (`is-open`). Matches guides JSON from `ourdream-guide-hub.ts`. Empty: “No matching OurDream guides.” Keyboard arrows + Enter. Overlay/panel — content below stays; panel is positioned on the search wrap.

**Start here:** numbered rows 01–03; hover lifts title to pink, arrow translates.

**Browse by topic:** two cards, radius ~20px, hairline, icon in pale pink container. Open topic uses `details`. Article rows: hover **does not** paint a full-row pink flood or a pink vertical bar against the title; arrow stays inside the row (`translateX` ~4px). Count “2 guides”.

**Body hex:** `.guide-hub::before` 48px grid, line `rgb(20 19 23 / 0.035)`, layer opacity 0.45, attachment fixed. Hero is opaque ink so this layer is for the light body.

**Footer:** same global footer.

**Screenshot:** `ourdream-hub-desktop-default-hero.png`, `ourdream-hub-mobile-390-full.png`.

## 08 — Interaction & Motion Specification

| Interaction | Trigger | Start | End | Duration | Easing | Mobile |
| --- | --- | --- | --- | --- | --- | --- |
| Herman hover | pointer enter circle | rotate 0 / scale 1 | -1.6deg / 1.02 | 240ms | cubic-bezier(0.22, 1, 0.36, 1) | none |
| Herman flip | click/tap | rotateY(0) | rotateY(180) | 520ms | same | tap toggle |
| Herman flip back | leave circle / second tap | 180 | 0 | 520ms | same | tap / leave viewport |
| Herman nudge | IO ~45% once | 0 | small wobble keyframes | 620ms | same | coarse only, once |
| Score ring | reveal IO | dashoffset 100 | 100−score×10 | 1.45–1.65s | same | same |
| Score bars | reveal IO | width 0 | `--bar` | 1.25–1.35s | same | same |
| Header icon hover | hover | transparent | 8% white circle | 180ms | ease | same if hover exists |
| Nav drop | hover/click | opacity 0 / -6px | 1 / 0 | 180ms move ease | — | wrap + tap |
| Product card / start-row hover | hover | rest | color pink; arrow +4px | 180ms | — | tap |
| Hub search panel | query | closed | `.is-open` | see `guide-hub.css` (~180–200ms) | — | same |
| Topic row hover | hover | rest | border/shadow, not full pink fill | — | — | tap summary |
| Cursor glow | mouse on hero/CTA | opacity 0 | 1 / 0.38 CTA | 0.55s | ease | off |
| Reduced motion | media | skip 3D/glow/nudge | instant finals | 0 | — | — |

## 09 — Responsive Rules

| Component | Desktop 1440 | ~1200 / tablet | Mobile 390 |
| --- | --- | --- | --- |
| Home header | 80px row | wraps | wraps; How we test may drop a line |
| Hero | 2 col, 100svh min | 1 col | stack; CTAs full width |
| Herman | 380 | 320 at mid | 260 |
| Proof | 5 metrics + dividers | wrap | no vertical dividers |
| Rankings | 3 cards | 1 col | 1 col |
| Method / score / latest | 2 col | 1 col | 1 col |
| Footer nav | 4 cols nowrap | 4 cols | **2-col wrap** |
| Hub topics | 2 cards | — | stack |
| `Header.astro` | full nav ≥1024 | hamburger | sheet + Brands list |
| Bottom app bar | hidden on large | often visible | visible — **not footer** |

## 10 — Assets

| Asset | Path |
| --- | --- |
| Wordmark white | `/brand/girlfriend-expert-logo-white.webp` |
| Herman hero | `/home/v2/herman-scientist.png` |
| Herman tester | `/home/v2/herman-tester.png` |
| Pink glow | `/home/v2/pink-glow.svg` |
| Hub glow | `/guides/hub/glow.svg` |
| Hub search icon | `/guides/hub/icon-search.svg` |
| Hub topic icons | `/guides/hub/icon-sliders.svg`, `/guides/hub/icon-images.svg` |
| Product logos | comparison product `logo` fields / `src/lib/home/brandLogos.ts` |

Do not substitute different Herman or logo files.

## 11 — Current Code vs Likely Stale Figma

Verify Figma matches this current implementation:

- Header includes **Brands** dropdown (not “Our brands”).
- Homepage hex is a **shared 48px fixed canvas** under **opaque** cards (not graph paper through content).
- Hero marketing surface is **#101014**, not translucent charcoal and not navy.
- Herman **flip** (hover ≠ flip; leave restores Herman).
- Score rings start at **12 o’clock**, animate dashoffset only.
- Theme icon hover is a **40×40 circle** centered on the button.
- Footer mobile groups are **two-column wrap**, not an app tab bar.
- Hub topic hover is **restrained** (no pink flood, arrow inside card).
- Hub uses `HomeDesktopHeader`, not a second header design.
- Pink glow remains on hero/CTA/hub hero.

## 12 — Figma Sync Instructions

1. This is a **SYNC** task, not a redesign.
2. Read this entire handoff first.
3. Inspect all files in `docs/figma-sync/screenshots/`.
4. Update Figma **components** before instances.
5. Preserve current Figma file organization where possible.
6. Do not create 50 duplicate boards or alternate homepages.
7. Do not reinterpret tokens (no navy, no lime marketing dark).
8. Do not alter approved copy.
9. Use the exact assets in §10.
10. Match screenshots visually.
11. Desktop Figma = current desktop code; mobile Figma = current mobile code.
12. Missing mobile states only after parity.
13. Put code-vs-Figma diffs in a `99 — SYNC QA` page.
14. Ignore deprecated bottom app bar when drawing **footer**.

## 13 — QA Checklist

- [ ] Header (Best apps / Reviews / Brands / Guides / How we test)
- [ ] Brands → OurDream hub URL
- [ ] Hero height / glow / hex
- [ ] Herman default / hover / flip / leave
- [ ] Proof card opaque on ink→light seam
- [ ] Grid continuity, no double bars
- [ ] Opaque ranking cards
- [ ] Score rings 12 o’clock
- [ ] Methodology dark
- [ ] AIGE score faint hex
- [ ] Tester section
- [ ] Closing CTA
- [ ] Hub search / Start here / topics hover
- [ ] Footer desktop
- [ ] Footer mobile two-column groups
- [ ] Bottom app bar **not** drawn as footer
- [ ] Light mode
- [ ] Dark mode (content charcoal; marketing still #101014)
- [ ] 1440 desktop
- [ ] 390 mobile

## Screenshot index

| File | What |
| --- | --- |
| `homepage-desktop-hero.png` | 1440 hero + header (includes Brands) |
| `homepage-desktop-1440-full.png` | 1440 tall viewport |
| `homepage-desktop-rankings.png` | Rankings + proof |
| `homepage-desktop-methodology.png` | Methodology |
| `homepage-desktop-score.png` | One number / eight tests |
| `homepage-desktop-tester-cta.png` | Tester / CTA / footer start |
| `homepage-desktop-brands-dropdown.png` | Brands menu open |
| `homepage-desktop-herman-result.png` | Herman flipped (if present) |
| `homepage-mobile-hero.png` | 390 hero |
| `homepage-mobile-390-full.png` | 390 taller viewport |
| `homepage-mobile-footer.png` | Mobile site footer |
| `ourdream-hub-desktop-default-hero.png` | Hub hero + Start here + topics |
| `ourdream-hub-desktop-search-results.png` | Hub search “prompt” |
| `ourdream-hub-desktop-search-empty.png` | Hub search no-results |
| `ourdream-hub-mobile-390-full.png` | Hub 390 |
| `ourdream-hub-mobile-footer.png` | Hub mobile footer |
