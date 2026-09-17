# 07 — Step 2 verification: tokens, fonts, page weight

Branch `feat/article-system-figma`. Everything here was measured from real builds of this repo, not estimated.

---

## What changed

| File | Change |
|---|---|
| `src/styles/ourdream-article.css` | Added `--od-display` / `--od-body` / `--od-mono`; added `--od-sunken`, `--od-on-ink`, `--od-green-ink/-soft`, `--od-red-ink/-soft`, `--od-shadow-card`, `--od-shadow-float`, `--od-breakout`; dark values for all of them; replaced 7 `var(--font-display, …)` fallbacks, 2 `var(--font-mono, …)` fallbacks and 4 literal `Inter, system-ui` declarations with the scoped tokens; tokenised 3 hardcoded values |
| `src/layouts/BaseLayout.astro` | New `displayFont?: 'hanken' \| 'bricolage'` prop (default `hanken`) selecting which woff2 is preloaded |
| the 4 OurDream article routes | `theme="core" displayFont="bricolage"`, plus explicit `glossary-tooltips.css` and `@fontsource-variable/geist-mono/wght.css` imports |
| `package.json` / lock | `+ @fontsource-variable/geist-mono@^5.3.0` |

Nothing existing was renamed or removed. Every addition is inside `.ourdream-article-page` or behind the new opt-in prop.

---

## Q4 — the font was the actual bug

`ourdream-article.css` asked for `var(--font-display, 'Bricolage Grotesque', …)`. `--font-display` is defined globally as Hanken Grotesk, so it always resolved and **Bricolage was never reached** — it was loaded on every page in the site and applied to nothing.

Measured `font-family` on the built Comics page:

| Element | Before | After |
|---|---|---|
| `h1` | Hanken Grotesk Variable | **Bricolage Grotesque Variable** |
| first prose `h2` | Hanken Grotesk Variable | **Bricolage Grotesque Variable** |
| prose `p` | Inter Variable | Inter Variable (unchanged) |

Preload: `displayFont="bricolage"` swaps the preloaded file to `bricolage-grotesque-latin-standard-normal.woff2` on those four routes only. Every other page still preloads the Hanken file, byte for byte.

Geist Mono is imported **per article route**, not in `BaseLayout`. Importing it globally cost every page on the site 1,807 bytes of inlined `@font-face` for a face only `/guides/*` uses; scoping it puts that cost only where it is used.

---

## Q9 — page weight, theme="core"

The earlier audit assumed `page-full.css` was inlined. It is not — it arrives as an external `<link>`, so the real saving is in linked bytes, and switching to `core` slightly *increases* the inline portion while removing far more from the linked portion.

Comics page, total CSS the browser must fetch on a cold visit:

| Build | Inline | Linked | **Total** | `<link>` count |
|---|---|---|---|---|
| baseline (`origin/main`) | 110,187 | 464,294 | **574,481** | 5 |
| step 2, still `theme="full"` | 112,438 | 464,294 | **576,732** | 5 |
| step 2 + `theme="core"` | 116,971 | 192,555 | **309,526** | 4 |

**−265 KB, a 46% cut**, on all four article routes.

Homepage for comparison — unchanged in every build: 12,842 inline + 238,623 linked = **251,465**, 3 links.

`glossary-tooltips.css` is imported explicitly on the article routes because it used to arrive via `page-full.css`, and the article prose carries `data-glossary-decorate`.

---

## Proof that nothing else changed

Full production build, before and after, diffed file by file:

```
prerendered pages: 65 -> 65
added: none    removed: none
changed: 4
  guides/ourdream-ai-comics/index.html
  guides/ourdream-ai-prompt/index.html
  guides/ourdream-ai-image-prompt/index.html
  guides/how-to-use-ourdream-ai-image-generator/index.html
```

The other 61 prerendered pages — homepage, roundups, directory, test hub, glossary, legal, author pages — are **byte-identical**. Homepage HTML: 107,786 bytes before, 107,786 after.

Screenshots at 1440 and 390 of the homepage and the Comics article, before and after, are in `/home/claude/cmp/` in the working session (not committed — binaries don't belong in the repo). The homepage pair is identical by construction, since its HTML did not change.

**Review pages are not in this comparison**, because they are SSR (`prerender = false`) and produce no static HTML to diff. The only change reaching them is `BaseLayout`'s new preload line:

```
const headingPreloadUrl = displayFont === 'bricolage' ? bricolageFontUrl : headingFontUrl;
```

With the default `displayFont = 'hanken'` this resolves to exactly the URL the old line used. No other BaseLayout output changed, and Geist Mono is no longer imported there. The Vercel preview will confirm it visually.

---

## Q7 — mobile header height, measured

Measured on the live site, not guessed: the site header (`header.home-v2__header`) is **80px at 1440 and also 80px at 390** — it does not shrink on mobile. `position: relative`, `z-index: 4`, transparent background. The sticky TOC currently offsets against it with `top: 88px`.

So the mobile sticky offset is the same 80px as desktop.

---

## Two fixes taken while tokenising

1. **Dark-mode bug, live today.** `.od-block--important` set `color: #141317` three times. That is the only pattern block on the Comics page, so in dark mode it rendered near-black text on a dark tinted card. Now `var(--od-ink)`, which inverts.
2. `.ourdream-article-prose img { background: #efefed }` → `var(--od-sunken)`, so it inverts too. Per decision C1/C2 this placeholder fill is **removed entirely** when the figure block is rebuilt in step 4 — noted in the CSS.

The `box-shadow` literal on `.od-block--aige-test` now uses `--od-shadow-card`, which carries the Figma `-4px` spread the literal was missing.

---

## Still outstanding

- **Icons.** The Figma MCP connection needs re-authorising before any icon can be exported. 19 distinct icons are required and none exist; 8 are currently approximated by hand-written CSS `mask:` data-URIs that do not match the Figma geometry. Nothing is redrawn by hand — this waits for the connector.
- **Push.** The remote still refuses the credential. Both commits are local.
