# 82 — Batch A: Reference Cheat Sheet · External Example Link · Image + Caption

**Branch:** `feat/comics-figma-rebuild` · **Page:** `/guides/ourdream-ai-comics/` (URL unchanged)
**Figma:** desktop `318:4936` / `318:4961` · mobile `320:6822`
**Verified:** screenshots at 1440 and 390 against the frames. Findings in §5.

Three patterns built as reusable CSS, then the Comics content converted onto them. Measurements
come from the instances on the Comics frames, not from the library defaults — where the two
disagree, §5 says so.

---

## 1. What was built

### `Article / Reference Cheat Sheet` + `Article / Cheat Sheet Group`
`.od-cheat`, `__head`, `__label`, `__groups` · `.od-cheat-group`, `__title`, `__terms`

Typography and hairlines only — no card, no fill, no bullets.

| | Desktop 1440 | Mobile 390 |
|---|---|---|
| Root | column, gap 16, align start | same |
| Head | row, gap 6, `Icon/library` 14 + label 12/16 `text/secondary` | same |
| Groups | `flex-wrap`, column-gap 32, row-gap 20, children fixed **354** (354+32+354 = 740) | column, gap 16, children 100% |
| Group | `border-top` 1px hairline, `padding-top` 14, gap 8 | same |
| Title | Inter 600 14/20, −0.028px, `text/primary` | same |
| Terms | Inter 400 16/28, −0.048px, `text/secondary` | same |

Terms stay a real `<ul>` for assistive tech; the prose bullet, indent and item rhythm are reset
so nothing renders a marker. Figma has no list semantics at all, so this is markup that reads
the same and announces better.

### `Article / External Example Link` + the Example cards grid
`.od-examples` · `.od-example`, `__text`, `__category`, `__title`, `__desc`, `__action`, `__thumb`

The whole card is the `<a>`. Card fill `surface/page` #f9f9f9, 1px hairline, radius 12,
padding 14/16, gap 12. Desktop: two-up grid (gap 16/16), row layout, action pinned right and
`nowrap`. Mobile: one column, card stacks with the action below the text block.

States (the Q10 family rule): hover → border `border/strong` + action `action/pink-press`;
active → `surface/sunken` fill; focus-visible → 2px `action/pink` outline at 2px offset.
Figma draws none of these — the component has no interactive states at all.

`__thumb` (56×40, radius 8) is built but unused: the design defaults it off and the rule is
that the asset is always local, never scraped from the linked page.

### `Article / Image + Caption` + Image grid
`.ourdream-article-prose figure` / `.od-figure`, `__caption`, width modifiers · `.od-figure-grid`

Root is a column with gap 8; image radius 12 + 1px hairline over a `--od-sunken` backdrop
(Figma paints #efefed behind the image fill); caption `Label/Sans S` 12/16 `text/muted`.

Width ladder, all centred: `--portrait` 380 · `--supporting` 440 · `--square` 480 ·
`--inset` 688 (media under a workflow step) · default 740 · `--breakout` 960.
`.od-media--portrait` is kept as an alias so existing content does not break.

**The breakout is now real.** `--od-breakout` was declared and referenced zero times; it is
960 centred on the 740 column, i.e. −110 each side — the same offset Figma uses for the
Horizontal Process at x = −110. That unblocks the batch-B breakout without further work.

**Image grid** stays two-up on both viewports: 740 with a 16 gap desktop, 350 with a 12 gap
mobile (= 169 + 12 + 169, exact), row-gap 20 if a third figure ever wraps.

### Also in this batch

- **`h4`** — a heading level the system did not have. Bricolage SemiBold **17/22** at −0.085px
  on both viewports, sitting on the base sibling gap with no extra spacer above or below
  (measured on children 15/17/19 desktop, 16/18/20 mobile). Figma demotes the three Examples
  sub-headings from H3 to H4.
- **`Icon / library`** exported from Figma (`120:568`) to `public/icons/aige/library.svg`,
  applied as a mask so CSS supplies the colour. Nothing was redrawn.
- **`character-model-sheet.webp`** exported from Figma (`345:29581`, 900×506) to
  `public/guides/ourdream-ai-comics/`. See §4.

---

## 2. Content converted

| Pattern | Instances | Where |
|---|---:|---|
| Reference Cheat Sheet | **9 / 9** | Comic style · What can still drift · Layout · Speech bubble · What the Brush Editor can fix · Edit reliability · Comic video specs · Real-world extras · Model Sheet versions |
| External Example Link | **5 / 5** | Anime Comic Examples (3), Realistic Comic Examples (2) |
| Image grid | **1 / 1** | Available Comic Art Styles |
| Image + Caption | **1 / 2** | How Model Sheets Work. The second instance is the 688 inset inside the Step-by-Step Workflow — batch B. |

The Layout cheat sheet is the one structural move: Figma hoists all four panel-count lists out
of their H3 sections into a single four-group sheet under the H2 intro. The four H3 sections
keep their headings, prose and examples.

---

## 3. Every string changed, added or removed

Per the standing rule that prose is not edited, here is the complete list.

### Removed (4) — connector lines replaced by a cheat-sheet group title

1. `For two-panel pages, you can choose:`
2. `For three panels, you get:`
3. `For four panels, you can choose:`
4. `For five panels, you currently get:`

Each introduced a list that is now a group inside the Layout cheat sheet, titled
`2-Panel Layouts` … `5-Panel Layouts`. **Note:** the written permission covers connectors
replaced by a *Prompt Comparison label chip*. These four are replaced by a *cheat-sheet group
title* instead — same function, different component. Flagged rather than assumed.

### Removed (1) — link label

`Read the comic ↗` on the first anime example, replaced by the component's own action label
`Open comic ↗`. The other four cards' link text was a comic name, which moved up into the
card title rather than being dropped.

### Added — component labels Figma carries and the HTML never had

- 9 cheat-sheet head labels: `Comic style cheat sheet`, `What can still drift`,
  `Layout cheat sheet`, `Speech bubble cheat sheet`, `What the Brush Editor can fix`,
  `Edit reliability`, `Comic video specs`, `Real-world extras`, `Model Sheet versions`
- 8 group titles Figma introduces to split a flat list: `Character` / `Details` ·
  `People` / `Scene` / `Text & details` · `Format` / `Input` / `Control`
- 3 captions: `Anime art styles`, `Realistic camera styles`,
  `A model sheet: front, side and back views plus a row of expressions.`
- `Open comic ↗` ×5

### Restructured — same words, different container

- **Example cards.** Card 1: `Anime` / `OD Comics` → category / title. Cards 2–3: the comic
  name becomes the title and the art style drops to the description line
  (`Ladyboy Trap` + `Neon Comics`; `The Defeated Elves City Part 2` + `Manga BW Inks`).
  Cards 4–5: `The Maid`, `The Erotic Photoshoot` become titles.
- **13 cheat-sheet rows** split on their `—` or `:` into title + term, so the joiner character
  disappears: `Speech — normal character dialogue` → `Speech` / `normal character dialogue`
  (×6), `Original image: Best quality` → `Original image` / `Best quality` (×4),
  `Normal version — casual clothes.` → `Normal version` / `casual clothes.` (×3).
- **16 `<strong>` pairs stripped inside cheat-sheet terms.** Figma's term text is a single
  Regular weight — confirmed with `getStyledTextSegments` on `318:5464`, which returns one
  unstyled run. No words removed; emphasis markup only.
- **3 headings `h3` → `h4`**: Anime Comic Examples, Realistic Comic Examples,
  Available Comic Art Styles.

### Anchors

**None disappear.** The three demoted headings keep their `id`s
(`#anime-comic-examples`, `#realistic-comic-examples`, `#available-comic-art-styles`), so any
existing deep link still resolves. Nothing in the repo links to them, and the sidebar TOC is
built from `h2` ids only (`src/lib/ourdream-guide-toc.ts`), so the rail is unchanged either way.

---

## 4. Assets

`character-model-sheet.webp` (900×506, 43 KB) is Figma's copy of the image, re-encoded from the
JPEG the file stores. If you have the original screenshot it will be sharper — swap the file,
the markup does not change. This is question Q8, still unanswered; the figure would otherwise
have been blank.

---

## 5. Differences from Figma that remain, and why

| # | Difference | Reason |
|---|---|---|
| 1 | Example card 3 is three lines tall, not Figma's 52px | Figma's cards are placeholders (`Example 1`). `The Defeated Elves City Part 2` wraps at 362px and card 2–3 carry a description line. The grid stretches the row, so paired cards stay level. |
| 2 | Image grid spans the full 740, not 736 at x=2 | Figma's frame hugs two 360 children with a 16 gap and lands 2px inset each side. Matching that would put a 2px asymmetry into the CSS for nothing visible. |
| 3 | External example card is `#f9f9f9` on mobile too | The mobile frame (`348:11563`) draws it `#ffffff`, contradicting both the component definition and the desktop frame. Treated as drift; one value across viewports. Say the word and I will follow the mobile frame. |
| 4 | Mobile block rhythm is 20px, Figma mobile is 16px | Measured on the H4 neighbours: the mobile frame's base sibling gap is 16, not 20. That is a page-wide rhythm change touching every block, so it belongs in the mobile pass (batch F), not here. |
| 5 | `Icon / library` renders ~13.6 × 14, not 14 × 14 | The Figma export's viewBox is the vector's own bounds (18.96 × 19.5), not a 24 grid. Scaled to fit the 14px box it keeps that aspect. Redrawing it on a 24 grid would mean hand-editing the asset. |
| 6 | Cheat-sheet head icon strokes `action/pink` | `parts/60-reference-and-sources.md` infers `text/secondary`. The instance on the Comics frame strokes `#db2777`. The frame wins. |

### One correction to an earlier finding

`parts/05-current-state.md` row 3 says `h3` ships 22/30 desktop / 19/26 mobile against a
`Heading/XS` 17/22 target, and flags the mismatch as unresolvable. Read off the frames, H3 is
**22/30 desktop and 19/26 mobile** — exactly what the code already ships. `Heading/XS` 17/22 is
**H4**, which is why the two never reconciled. Both rows are correct as built; no change needed.
