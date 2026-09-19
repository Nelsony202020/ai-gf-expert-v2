# Dark mode — stage 2 (the light islands)

Branch `feat/dark-mode-stage-2`, off `feat/dark-mode-tokens`.
Measured on a local build, dark mode, 1440 wide.

## Why the review page was ~10% converted

`src/styles/review-shell.css` is 1,741 lines and had **zero** dark-mode rules.
So did `sitemap.css` (1,571 lines). Stage 1 said as much — "The review page and
the sitemap panel stay light in dark mode. Stage 2."

The review shell already routes nearly everything through its own `--rs-*`
tokens, so this was a remap onto the site's `--dk-*` set, not 1,741 lines of
overrides. Nine rules cover the whole page: the token block plus the handful of
surfaces that set a colour directly (`.rs-method-pop`, `.rs-meta-sep`,
`.rs-gallery`, the story avatars, `.rs-score-card`, `.rs-facts`).

One catch: `.review-page` is set on `<html>`, the same element that carries
`data-theme`, so `[data-theme='dark'] .review-page` never matched. Both the
compound and descendant forms are listed now.

## Light surfaces in dark mode, before → after

| Page | Before | After |
|---|---|---|
| /reviews/ourdream-ai/ | 4 (incl. the 2.1M px² page body) | **0** |
| / | 0 | 0 |
| /reviews/, /guides/, /test/characters/, /ai-girlfriend-apps/ | 0 | 0 |
| /sitemap/ | 5 | 5 — out of scope this round |

The three remaining hits elsewhere are translucent tints (`rgba(255,255,255,.02)`,
`.05`, `rgba(34,197,94,.08)`) sitting on dark, not light surfaces.

## The pricing tab: why 212 dark rules were not enough

`pricing-tab.css` already carried 212 dark rules, yet six blocks still rendered
white with near-white text. The light rules for those live in PricingTab.astro's
**scoped** `<style>` block (4,926 lines, zero dark rules). Astro scopes them as
`.pt-x[data-astro-cid]` — specificity (0,2,0), the same as an unscoped
`[data-theme='dark'] .pt-x`. A tie is decided by source order, and the light
rule was winning.

Adding the dark rules to the scoped block is not enough either: Astro appends
the scope attribute to **every** bare selector, ancestors included, so
`[data-theme='dark'] .pt-x` compiles to
`[data-astro-cid-x][data-theme=dark] .pt-x[data-astro-cid-x]` — which asks
`<html>` to carry the component's scope id, and therefore never matches. The
theme selector has to be `:global([data-theme='dark'])`.

Fixed: the billing switch and its active pill, the "Choose a plan" callout, the
calculator skeleton, the menu trigger, the usage detail card and the usage math
panel — plus the text inside them.

## Text under 3:1 in dark mode

| Page | Before | After |
|---|---|---|
| /reviews/ourdream-ai/ | 2 | 1 |
| /reviews/ourdream-ai/#pricing | 10 | 8 |

Everything that remains is the amber score chip (2.79–2.80) that stage 1 flagged
as blocked — it fails in light mode too and any fix changes light mode — plus
decorative `material-symbols` icons at 2.67.

## The header dropdown: two separate bugs

**1. It was painted over and swallowed clicks (on /guides/ and /reviews/).**
`guide-hub.css` had:

```
.guide-hub--expert-glow .guide-hub__hero > .home-v2__header,
.guide-hub--expert-glow .guide-hub__hero > .guide-hub__hero-body { z-index: 2 }
```

That selector (0,3,0) outranks `[data-site-header].home-v2__header` (0,2,0), so
it silently dropped the site header from z-50 to z-2 on every glow page. The
header then tied with the hero body, the body won on DOM order, and
`elementFromPoint` over the open panel returned `.guide-hub__hero-body` — the
page content was on top of the menu. Introduced by the hero-glow work in #58.

**2. The gap between the trigger and the panel.**

| Page | button bottom | panel top | gap | dead zone |
|---|---|---|---|---|
| / (before & after) | 56 | 64 | 8px | 8px, bridged |
| /reviews/ before | 56 | 87 | **32px** | 8px |
| /reviews/ after | 56 | **79** | 24px | **0** |

On the homepage the drop wrapper is only as tall as the 32px trigger, so
`top: calc(100% + 8px)` lands 8px under the button. On every other header the
wrapper is stretched to the full 80px band, so the same rule opened the panel
32px below the button. Anchoring to the band's bottom edge (`top: 100%`) closes
the dead zone completely — the wrapper ends at y=79 and the panel starts at
y=79, so the pointer never crosses a non-hover surface. The `::before` bridge is
then bridging nothing and, at panel width, would sit over the neighbouring
trigger's lower edge, so it is switched off on those headers.

## The header in dark mode

The band was `--hub-ink` (#141317, warm near-black) while dark pages are
#020617 (blue slate) — two different blacks meeting at a hard edge. In dark mode
the band now joins the page's own slate and is separated by a hairline
(`--dk-line`) instead of a colour step. Scoped to `.guide-hub--site-chrome`, so
the five brand hubs keep their warm canvas by design.

## Not done

- `sitemap.css` — 1,571 lines, zero dark rules; `/sitemap/` is still a light
  page in dark mode.
- The amber and green score chips, which fail in both themes.

## Follow-up: the sitemap page and the score chips

Both items listed under "Not done" above are now done.

**`/sitemap/`** — `sitemap.css` had zero dark rules across 1,571 lines, so the
page was a 4.1M px² `#f9f9f9` slab. Same shape of fix as the review shell: the
`--si-*` token block is remapped onto `--dk-*`, plus the three surfaces that set
a colour directly (the translucent sticky search bar, the open category header's
pink wash, and the chip dot). `--si-hero` (#101014) is the dark hero band and is
deliberately left alone. Light surfaces in dark mode: 5 → 0.

**Score chips** — these carry white text, and stage 1 was right that they fail
in both themes:

| Fill | Before | After | With white text |
|---|---|---|---|
| green | #16a34a | #15803d | 3.07 → **4.68** |
| orange | #f97316 / #e8760a | #c2410c | 2.61 / 2.79 → **4.83** |
| red | #dc2626 | unchanged | 4.51 |

One shade down keeps the hue and the white text and clears AA. Four places set
these fills and all four had to move:

- `.rt-score-chip--good` / `--fair` in `ratings-tooltips.css`
- `--rs-green` / `--rs-orange` in `review-shell.css` (used only as badge fills)
- `.home-v2__chip--high` / `--mid` in `home-desktop.css` — as literal values,
  because `--home-high` / `--home-mid` are also used as text colour and ring
  stroke, where darkening is neither needed nor wanted
- `getScoreBadgeColor()` in `src/lib/review-shell.ts` — the review page paints
  `.rs-score-banner` and `.rs-badge` with an **inline style**, so no stylesheet
  could reach them and the values had to change at the source

Measured after, white-on-fill: 4.51–5.18 everywhere, and 0 light surfaces on
`/`, `/guides/`, `/reviews/`, `/reviews/ourdream-ai/` and `/sitemap/`.
