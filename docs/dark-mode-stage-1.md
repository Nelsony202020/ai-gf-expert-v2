# Dark mode — stage 1 of 3 (tokens + base layer)

Branch: `feat/dark-mode-tokens`. Measured 19 Sep 2026 on a local build, dark mode, at 1440 and 390 wide.

## What changed

- The ten dark colours now live in one place: the dark section of `src/styles/global.css` (`--dk-page`, `--dk-card`, `--dk-raise`, `--dk-line`, `--dk-line-strong`, `--dk-ink`, `--dk-dim`, `--dk-faint`, `--dk-pink`, `--dk-pink-ink`). No other file defines them.
- The base layer reads from them: the page background, html, body, the card/panel/raised surfaces, primary and secondary text, the accent and the CTA fill. The values were already blue slate, so the base layer looks the same — it is now wired, not hand-typed.
- html and body are forced to `--dk-page` in dark mode. Before, the guides-hub stylesheet painted html warm (#141317) on every page (the site header contains a guide-hub element), and the glossary page painted html and body warm too.
- The three "invisible" items now sit on solid token colours:
  - `/best/ai-girlfriend/` pillar icons (the `.material-symbols-outlined` inside "How we select the winners") — pink-ink icon on a raised circle.
  - `/test/` tooltips callout link — pink-ink link on a card panel.
  - `/test/characters/` calc chips — ink text and pink-ink percentages on a raised chip.
  Note: in real pixels these were faint, not fully invisible. The 1:1 readings came from treating a see-through pink tint as solid pink. They are fixed either way — they no longer depend on transparency.
- Other dark-only text that was below 3:1, fixed with tokens (dark mode only):
  - meta-row "·" separators on `/best/` and `/test/` (1.26–1.38 → `--dk-faint`)
  - "At a glance" / "Real-world pricing" headings on `/best/` (1.67 → `--dk-dim`)
  - "+2" more-values links on `/best/` (2.76 → `--dk-pink-ink`)
  - "+" and "→" in the calc flow on `/test/characters/` (1.93 → `--dk-faint`)
  - pipeline icons and the green "you are here" label on `/test/characters/` (2.09 / 2.21 → `--dk-dim` / `--dk-ink`)
  - disabled A–Z letters on `/glossary/` (1.35 → `--dk-faint`)
  - active List/Grid switch on `/ai-girlfriend-apps/` (2.92 → pink-ink on raise)
  - review page tab bar: "Overview" was dark text on the dark strip (1.09) → dim/ink labels
  - review page Share button: white on the light hero (1.04) → the hero's own muted grey
- No `prefers-color-scheme` was added (stage 3).

## NOT done — needs a decision: the red score chip (step 3)

The brief says red chips are white on #ef4444 (3.76:1) and green/amber already use dark text. The live site does not match that:

| Chip | Fill | Text | Contrast |
|---|---|---|---|
| Red (low) | #dc2626 | white / #f7f7f6 | 4.83 / 4.51 — passes |
| Green (high) | #16a34a | white / #f7f7f6 | 3.30 / 3.07 — below 4.5 |
| Amber (mid) | #f97316 / #e8760a | white / #f7f7f6 | 2.80 / 2.79 — below 3 |

No chip on the 12 pages uses #ef4444. Switching red to dark text on #ef4444 would make red the only chip with dark text and change a chip that already passes. The chip that actually fails is amber (and green is weak). Any chip fix changes light mode too, so I stopped here. Options: (a) dark text on all three fills, (b) keep white text and darken amber/green fills, (c) leave as is until stage 2.

## a. Large-surface backgrounds in dark mode

Method: every visible element at least 40% of the viewport wide (max 600px) and 150px tall with a solid background, at 1440 and 390.

- html and body are #020617 on all 12 pages. #141317 is gone from both. Before: html was #141317 on 11 of 12 pages, body too on /glossary/.
- Distinct large-surface colours across the 12 pages: 14 before, 14 after (the per-component patches still paint the same blocks). Eleven are dark: #020617 #0f172a #1e293b #141317 #141414 #121214 #101014 #1b1b1f #161619 #0a0a0c #0a0c0a. Three are light islands that stay light in dark mode: #f9f9f9 #efefed #ffffff (review page body, sitemap).
- #141317 is still a large surface on every page — it is the footer, plus the guides hub, glossary page and review hero blocks. That is stage 2.

| Page | Large surfaces after |
|---|---|
| / | #0a0a0c #101014 #121214 #141317 #161619 #1b1b1f |
| /best/ai-girlfriend/ | #020617 #0a0c0a #0f172a #141317 #141414 #1e293b |
| /reviews/ourdream-ai/ | #141317 #efefed #f9f9f9 #ffffff |
| /reviews/ | #141317 |
| /guides/ | #141317 |
| /guides/ourdream-ai/ | #141317 |
| /test/ | #0f172a #141317 |
| /test/characters/ | #141317 |
| /glossary/ | #141317 |
| /sitemap/ | #101014 #141317 #f9f9f9 |
| /ai-girlfriend-apps/ | #0f172a #141317 #1e293b |
| /legal/ | #141317 |

## b. Worst text contrast per page (dark, text over photos excluded)

| Page | Before | After |
|---|---|---|
| / | 2.79 amber chip "7.8" | 2.79 amber chip (blocked — see step 3) |
| /best/ai-girlfriend/ | 1.38 "·" separator | 2.80 amber score chip "6.9" (blocked) |
| /reviews/ourdream-ai/ | 1.04 Share button | 2.79 amber score badge "6.8" (blocked) |
| /reviews/ | 3.64 pink star icon | 3.64 same |
| /guides/ | 4.02 pink "not hyped." | 4.02 same |
| /guides/ourdream-ai/ | 4.02 pink "not hyped." | 4.02 same |
| /test/ | 1.26 "·" separator | 2.80 amber score chip "5.9" (blocked) |
| /test/characters/ | 1.93 calc "+" | 3.13 green pipeline icon on mint |
| /glossary/ | 1.35 disabled letter | 3.54 active filter chip |
| /sitemap/ | 3.29 stat label on light panel | 3.29 same |
| /ai-girlfriend-apps/ | 2.92 active List switch | 3.52 active page number |
| /legal/ | 3.88 active contents link | 3.88 same |

Everything below 3:1 now is an amber score chip, and the same chip is below 3:1 in light mode too.

## c. Light mode

Two full builds (before and after) were diffed file by file, with every stylesheet split into single rules.

- 9 rules removed, 21 added. Every one of them only applies when the page is in dark mode. Zero light-mode rules changed. The red chip was not touched.
- Outside the stylesheets, the only HTML differences are hashed file names and data that failed to load because the database rate-limited the build (glossary terms, pricing stats). Two back-to-back builds of the untouched code show the same kind of differences.
- A second check in the browser (every element's colours, borders and shadows in light mode, all 12 pages, both widths) matched before and after, apart from an animation frame and content that failed to load.

## Found along the way (not changed)

- Light mode: html is #141317 on almost every page (the guides-hub rule). It only shows in the overscroll bounce. Fixing it changes light mode, so it waits.
- The review page and the sitemap panel stay light in dark mode. Stage 2.
- The guides hub and brand hub pages set the browser toolbar colour to #141317 in dark mode.
