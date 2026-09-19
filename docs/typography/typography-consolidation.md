# Typography consolidation — one face, one weight ladder, one tracking value

Branch: `feat/typography-consolidation` (off `main` @ `1dc65f1`). **Not committed** — this
report exists because step 5 disagreed with the brief in six places; see *Disagreements*.

## What changed

**Face.** `@fontsource-variable/gabarito@5.3.0` installed. `BaseLayout.astro` now imports
`@fontsource-variable/gabarito/wght.css` in place of the Hanken and Bricolage imports, and
preloads `gabarito-latin-wght-normal.woff2`. The `displayFont` prop, the `DisplayFont` type,
the `headingPreloadUrl` ternary and the `bricolageFontUrl` import are gone, along with
`displayFont="bricolage"` on the four OurDream guide routes. `--font-display` in the
`@theme` block is `'Gabarito Variable', Gabarito, ui-sans-serif, system-ui, sans-serif`.
`--font-sans` (Inter) and `--font-mono` are untouched; body copy does not change.

**Scoped face tokens** keep their names and now resolve to the one global face:
`--home-display`, `--fr-display`, `--od-display`, `--si-display` → `var(--font-display)`.

**Dead / missing references fixed.**

| Reference | Was | Now |
|---|---|---|
| `.rdv-title`, `.rdv-score` (ratings-evidence.css) | `'Bricolage Grotesque'` — only the *Variable* family was installed, so this fell through to `system-ui` on every review page's ratings drawer | `var(--font-display)` |
| `--si-display` (sitemap.css) | `"Bricolage Grotesque", system-ui` — same bug; all six sitemap heading rules rendered in `system-ui` | `var(--font-display)` |
| `.site-footer__signoff` (footer.css) | hardcoded `'Bricolage Grotesque Variable', …, var(--font-display, inherit)` — resolved, but off-token | `var(--font-display)` |
| `.site-mobile-menu__brand`, `.site-mobile-menu__link` | hardcoded `'Bricolage Grotesque Variable'` — resolved, but off-token | `var(--font-display)` |
| `var(--font-body)` × 4 (review-shell.css) | never defined anywhere → `font-family` fell back to inherit | `var(--font-sans)` |

`@fontsource-variable/bricolage-grotesque` **and** `@fontsource-variable/hanken-grotesk` are
removed from `package.json` (nothing imports Hanken any more either).

**Weight ladder.** Added to `@theme` in `global.css`:

```
--wt-display: 900;
--wt-display-sub: 800;
--wt-display-min: 700;
--ls-display: -0.025em;
```

Applied across the 13 listed files, 82 declaration blocks:

- `>= 26px` → `--wt-display`
- `18–25px` → `--wt-display-sub`
- `<= 17px` → `--wt-display-min`
- any numeral / score readout → `--wt-display-sub` regardless of size
- `letter-spacing: var(--ls-display)` on everything `>= 18px`; below that, left alone
- `clamp()` banded on the max value
- both `!important` rules keep the `!important`: `.rft-cat__name` 600 → 700, `.home-v2__proof-value` stays 800

`src/styles/roundup.css` and `src/components/roundup/*` were not touched.

## Verification

Full production build before and after, from the same checkout, same environment.

**(a) Weights below 400.** Gabarito's `wght` axis is **400–900** (Hanken's was 100–900).
No display-face rule anywhere in `src/` sets a weight below 400, before or after. Nothing to fix.

**(b) Italic.** Gabarito ships `styles: ['normal']` only. No display-face rule sets
`font-style: italic` or `oblique`. Nothing to fix.

**(c) Build diff.** 69 prerendered pages before, 69 after. None added, none removed.
After normalising asset hashes, every page differs, and the differences are:

- the `<link rel=preload>` href (Hanken → Gabarito), and
- the inlined critical `<style>` block: the Bricolage and Hanken `@font-face` sets replaced
  by Gabarito's, plus the `font-family` / `font-weight` / `letter-spacing` substitutions.

`/best/ai-girlfriend/` diffs in exactly **two chunks** — the preload href and that style
block. Zero markup changes.

Three `/reviews/ratings-panel/*` pages show extra diffs (subscore 9.4 → 9.7, evidence-item
counts). Those are **live InstantDB content edits between the two build runs**, not this
change; `candy-ai`, `girlfriendgpt` and `nectar-ai` each show a single 119-byte CSS chunk,
which is the ladder.

Roundup heading CSS: all 349 `.roundup-*` type rules in the built bundles hash **identically**
before and after (`289447bc13b3fbe3`). Byte-identical, as required.

`astro check`: 487 errors, all pre-existing, all in `scripts/` and `instant.perms.ts`.
Zero errors in `src/`. Removing the exported `DisplayFont` type broke nothing.

**(d) Computed font-family + font-weight**, measured in Chromium at 1280×900 on the built
CSS (review-page selectors in a harness carrying `global` + `page-review` + the PricingTab
style block; `.ourdream-article-prose h2` and `.roundup-quick__heading` on their real
built pages).

| Selector | Before | After |
|---|---|---|
| `.rs-hero-title` | Hanken **700** / 40px / −0.8px | Gabarito **900** / 40px / −1px |
| `.rft-head__title` | Hanken **700** / 32px / −0.48px | Gabarito **900** / 32px / −0.8px |
| `.rdv-title` | *system-ui* **600** / 21px / −0.2px | Gabarito **800** / 21px / −0.525px |
| `.review-article-title` | Bricolage **700** / 32px / −0.48px | Gabarito **900** / 32px / −0.8px |
| `.pt-page-title` | Hanken **900** / 34px / −0.85px | Gabarito **900** / 34px / −0.85px |
| `.ourdream-article-prose h2` | Bricolage **700** / 32px / −0.496px | Gabarito **900** / 32px / −0.8px |
| `.roundup-quick__heading` | Hanken **900** / 40px / −1px | Gabarito **900** / 40px / −1px |

All seven report Gabarito. Five of the first six moved up. `.pt-page-title` did not — it was
already 900 / −0.025em before; it was one of the rules the ladder was derived from.

Spot checks on the numeral band: `.rdv-score` 800, `.rft-cat__score` 800,
`.rs-score-banner-num` 800, `.rft-cat__name` 600 → 700 (with `!important` kept).

**(e) Bytes.** Per page, linked CSS grows **+628 to +950** (`var()` references are longer than
literals) and the HTML shrinks **−3,976** (two `@font-face` sets replaced by one). The real
saving is the display face itself: every page previously pulled **both** Hanken and
Bricolage, because the footer sign-off and the mobile menu hardcoded Bricolage sitewide.

| | Before | After | Δ |
|---|---|---|---|
| display woff2, latin (fetched on every page) | 166,252 | 34,236 | **−132,016** |
| display woff2, latin-ext | 73,176 | 12,256 | −60,920 |
| display woff2, vietnamese | 31,348 | 0 | −31,348 |
| all fonts in the build | 832,844 | 608,560 | −224,284 |
| all CSS in the build | 1,041,507 | 1,043,347 | +1,840 |

**Net per page, HTML + linked CSS + display face (latin): −135,237 bytes.**
Net across the whole build: **−222,444 bytes.**

**(f) Distinct `font-weight` values on display-face rules.** Before: **4** — `{600, 700, 800,
900}`. After: **3** — `{700, 800, 900}`. Target met.

## Disagreements with the brief

1. **"Before is 5."** It is 4: `600` (24 rules), `700` (21), `800` (16), `900` (4). Three
   display-face rules set no weight at all (`global.css` `h1–h6`,
   `.home-v2__badge-score-inline b`, and — outside the listed files — `.glossary-tooltip__term`).
   Counting "no weight declared" as a fifth value would get to 5. After is 3 either way.
2. **`--font-display` is at `global.css:87`, not `:58`.** Several other line numbers in the
   brief are off by a few (`--si-display` is at `sitemap.css:23`, not `:28`), and the
   `PricingTab.astro` numbers are offsets inside its `<style>` block, which starts at line
   1926. Everything was located by content, not by line.
3. **`roundup.css` sets no `font-family` at all** — its only one is `font-family: inherit`.
   Roundup headings inherit the face from `global.css` `h1–h6` and declare only weight and
   tracking. So it *is* the reference the ladder was derived from (900 / −0.025em, confirmed
   by measurement), but there is no roundup face rule to preserve, and its headings change
   face via inheritance exactly as intended.
4. **`.pt-page-title` was already 900 / −0.025em**, so it does not "move up". Neither do
   `.pt-title`, `.pt-major__title`, `.pt-h2` or the two `review-page.css` rules — all five
   were already on the target ladder and only got tokenised.
5. **A fourth dead reference the brief did not flag**: `--si-display` had the same missing
   `Variable` bug as `.rdv-title`, so all six sitemap headings were rendering in `system-ui`.
   Fixed. Conversely, `footer.css` and `site-mobile-menu.css` were **not** dead — they named
   `'Bricolage Grotesque Variable'`, which was installed. They were off-token, not broken.
6. **Gabarito ships fewer subsets than Hanken**: latin and latin-ext only, no vietnamese.
   Vietnamese display text would fall back to `system-ui`. The site is English-only, so this
   is a note rather than a defect.

## Judgement calls

- Removed `@fontsource-variable/hanken-grotesk` from `package.json` as well as Bricolage.
  The brief only named Bricolage, but after this change nothing imports Hanken.
- Where a rule **owns** the display face and is `>= 18px` but declared no `letter-spacing`,
  one was added (`var(--ls-display)`). Without this, "one letter-spacing" would not hold for
  `.home-v2__rank`, `.home-v2__steps h3`, `.glossary-filters-sheet__title` and five others.
- `.home-v2__badge-score-inline b` declared no weight and relied on `<b>`'s browser default
  (700). It is a score readout at 22px, so it now sets `--wt-display-sub` explicitly.
- Media-query override blocks that declare their own `letter-spacing` were normalised too.
  Otherwise a px value from an override would defeat the em-relative token at the exact
  sizes where it matters most (e.g. `.rs-hero-title` at 40px).
- `src/styles/glossary-tooltips.css` (`.glossary-tooltip__term`, display face, 800 at 13px)
  is **not** in the brief's file list, so it was left alone. By the ladder it would be 700.
  It does not affect the distinct-weight count.
- `src/lib/affiliate/youtubeAgeGate.ts:104` names `"Hanken Grotesk"` in an inline **body**
  font stack, behind `Inter`. Not a display rule and not in the listed files, so left alone;
  it is now an unreachable fallback name.
