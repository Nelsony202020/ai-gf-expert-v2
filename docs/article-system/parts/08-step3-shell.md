# 08 — Step 3: the article shell, corrected against Figma

Pilot article: **`/guides/ourdream-ai-prompt/`** (the Prompt Guide) — the only article whose content is properly marked up, so it exercises the real system.

The shell was **not rebuilt**. `ourdream-article.css`, `OurDreamArticlePage.astro`, `OurDreamArticleSidebar.astro`, `OurDreamArticleMobileJump.astro` and `ourdream-article.client.ts` all stay, with every working behaviour intact: copy buttons, prompt expand, compare-figure pairing, mobile jump menu, TOC scroll-spy.

---

## What was already right

Measured on the built page, not assumed:

| | Target (Figma `318:4936`) | Built page |
|---|---|---|
| Reading column | 740 at x=190 | **740 at x=190** |
| TOC rail | 240 at x=1010 | **240 at x=1010** |
| Gutter | 80 | **80** |
| Side margins | 190 / 190 | **190 / 190** |
| Rail breakpoint | 1100 (decision Q8) | **1100** |
| TOC items max-height | 420 + internal scroll | `26.25rem` + `overflow: auto` |
| TOC item indicator | 3px, hairline → `action/pink` active | already correct |
| TOC item label | `Body/S` secondary → `Body/S Strong` primary | already correct |
| Scroll-spy | required (Q15) | already wired via `test-hub-toc.client.ts` |
| `scroll-margin-top` | must clear the header (Q15) | `5.5rem` on h2/h3 |

So the shell's geometry was never the problem.

---

## What was wrong — vertical rhythm

The Figma reading column is one auto-layout stack with a **uniform 20px gap** (651 of 651 children measured), and separation before a heading comes from explicit spacer frames. Everything in code was tighter than that.

| Distance | Figma | Before | After |
|---|---|---|---|
| Base sibling gap | 20 | 16 | **20** |
| Paragraph → paragraph | 20 | 16 | **20** |
| H2 top (20 + 28 spacer + 20) | 68 | 44 | **68** |
| H3 top (20 + 8 spacer + 20) | 48 | 28 | **48** |
| Heading → next element | 20 | 16 | **20** |
| List top | 20 | 12 | **20** |
| Figure | 20 | 20 | 20 |

Measured by walking the rendered children of `.ourdream-article-prose` on the built page and taking the gap histogram: `{P: 20×55, H2: 68×7, H3: 48×14, OL: 20, UL: 20, FIGURE: 20×6}`.

Mobile H2 (48) and H3 (36) are **inferred** — Figma's 390 frame was never measured for rhythm, only its component widths.

One rule had to be moved rather than added: a desktop `h3` margin block sat *before* the base `h3` rule, so at equal specificity the base rule won and the desktop value never applied. It now lives in the existing `@media (min-width: 1100px)` block after the base rule.

---

## Still off, and deliberately left for step 4

Two gaps in the histogram are still 4px instead of 20: `DIV × 10` and `BLOCKQUOTE × 8`. Those are the pattern blocks (`.od-block`, `.od-prompt` and friends) carrying their own margins. They are rebuilt in step 4, so changing their spacing now would just be undone.

---

## Added

**Dek slot.** Figma `Article / Header` (`158:2532`) is breadcrumb → title → **description** → meta. The code had no description. `OurDreamArticlePage.astro` now takes an optional `dek` prop, styled `Body/L` 19/30 desktop and `Body/M` 16/26 mobile in `text/secondary`. **No route populates it yet** — what the sentence says is a content decision, not a shell one.

**Active TOC item follows the scroller.** The list is capped at 420px, so on a long guide the scroll-spy could mark an item scrolled out of view. `bindTocFollow()` in `ourdream-article.client.ts` mirrors the active item into the scroller with a `MutationObserver` on the link classes. Scoped to the article page — the shared `test-hub-toc.client.ts` is untouched, because the test hub uses it too.

**Interaction states (Q10), piloted on the TOC item** as agreed — one component first:

| State | Treatment |
|---|---|
| hover | label → `action/pink-press`, indicator → `border/strong` |
| active | label → `action/pink-press` |
| focus-visible | 2px `action/pink` outline, 2px offset, 4px radius |

Same treatment on the "Explore all OurDream AI guides →" link. If this reads right, it applies to FAQ triggers, related-guide rows, copy buttons, external example cards and the jump-to-section bar in step 4.

---

## Not done, and why

- **No comparison against the Prompt Guide's own Figma frames** (`316:3506` desktop / `316:4531` mobile). The Figma connector is disconnected, so those nodes could not be read this pass. Every number above comes from `parts/50-shell-and-nav.md`, measured from the Comics frame `318:4936` — the shell is shared between the two articles, but the Prompt Guide frames have not been checked directly. This wants doing before step 4 is signed off.
- **Sticky rail offset left at 76px.** Figma's recommendation of 104px assumes a sticky global header; the real header is `position: relative` and scrolls away, and the frame is a scroll-0 snapshot so it cannot settle the number. The header is also being changed on `fix/canonical-content-header` right now. Left alone deliberately.
- **Icons.** Still blocked on the Figma connector. Nothing redrawn by hand.
