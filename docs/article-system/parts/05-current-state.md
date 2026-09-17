# 05 · Current state — what is styled, what is wrong, what is missing

**Branch:** `feat/article-system-figma` · **Scope:** `/guides/*` only
**Question answered:** for each of the 21 authored block types in `spec.md` §5, is it **(a)** styled correctly, **(b)** styled but wrong vs Figma, or **(c)** not styled at all.

**Sources of truth.** Targets come from `parts/10-callouts.md`, `20-prompts.md`, `30-process.md`, `40-evidence.md`, `50-shell-and-nav.md`, `60-reference-and-sources.md`. Current state is read off `src/styles/ourdream-article.css` (1440 lines), the four files in `src/content/guides/`, and `src/components/guides/ourdream/*`.

Letter codes are used exactly as defined above: **(a)** styled correctly · **(b)** styled but wrong vs Figma · **(c)** not styled at all.

---

## Verdict

**(a) 2 · (b) 14 · (c) 5.** Only five of the twenty-one block types have no CSS at all, so the stylesheet is not the bottleneck — it already declares 53 distinct `.od-*` selectors and the shell geometry is pixel-correct against Figma. The CSS job is real but bounded: five new patterns plus correction passes on fourteen, of which roughly half are single-property fixes (a background, a mobile padding step, a hardcoded hex) and only four are structural rebuilds — `stepWorkflow`, `aigeTest`, `comparisonAB` and `whatILearned` are each missing most of their designed anatomy.

**The much bigger job is content conversion, and it is almost entirely the Comics article.** The Comics page (77 KB, 644 `<p>`) contains exactly **one** pattern block — a single `od-block od-block--important` — against an estimated **~63** the prose actually wants. The Prompt Guide is the only well-marked-up article, carrying ~26 instances across 26 distinct `od-*` classes; the Image Generator guide uses one class (`od-steps`), the Image Prompt guide one (`od-block--key-takeaway`). So "the Comics page looks 10–20% done" is a **markup** verdict, not a CSS verdict: the styles are there and the HTML never calls them. Worse, the Comics HTML actively fights the system — 19 prompt strings, 8 cost calculations and 10 FAQ questions are all authored as `<h3>`, which is why the page reads as 121 headings of undifferentiated prose.

**Icons are the third axis and are at zero.** There are no `<svg>` elements anywhere inside the Comics prose; every icon on that page belongs to site chrome. The stylesheet does ship 8 icon glyphs, but as inline CSS `mask:` data-URIs with hand-written path data that does not match the Lucide-on-24-grid geometry the specs require — and one of them (`.od-structure__label::before`, meant to be `Icon / list`) is a single horizontal line, i.e. a placeholder. **19 distinct icons** are called for across the specs and **none exist as exported assets**. Any pattern whose Figma spec includes an icon is incomplete for that reason alone, which is why several otherwise-close patterns below are (b) rather than (a).

---

## Inventory

| # | Block type | Figma node (desktop / mobile) | CSS selector(s) today | State | What is wrong | Used in Comics? | Used in any article? |
|---|---|---|---|---|---|---|---|
| 1 | `paragraph` | `Article/Body Desktop` 18/31 · Mobile 17/28 | `.ourdream-article-prose`, `> * + *` | **b** | Block rhythm is 16px, measured Figma is 20px; letter-spacing −0.096px on both viewports vs −0.072 / −0.051 | yes — 644 `<p>` | all 4 |
| 2 | `h2` | `Article/H2 Desktop` 32/40 · Mobile 26/32 | `.ourdream-article-prose h2` | **b** | Sizes correct; top margin 44px desktop / 36px mobile vs measured **68px**; h2→next 16px vs 20px | yes — 16 | all 4 |
| 3 | `h3` | `Heading/XS` 17/22 | `.ourdream-article-prose h3` | **b** | Ships **22/30** desktop, **19/26** mobile vs `Heading/XS` 17/22; top margin 28px vs measured **48px** | yes — 121 | all 4 |
| 4 | `bulletList` | — (no node measured) | `.ourdream-article-prose ul > li(::before)` | **a** | Nothing to check against — `spec.md` §5 leaves the node cell empty. Pink 6px dot, 20px indent. Unverifiable, assumed correct | yes — 33 `<ul>` / 173 `<li>` | all 4 |
| 5 | `numberedList` | — (no node measured) | `.ourdream-article-prose ol:not(.od-steps)` | **a** | Same — no Figma node. Pink-ink `counter()`. Unverifiable, assumed correct | no (0 `<ol>`) | image-generator, prompt-guide |
| 6 | `figure` | `154:2491` / `154:2494` | `.ourdream-article-prose figure/img/figcaption`, `.od-media--portrait` | **b** | `background:#efefed` hardcoded (breaks dark mode); no centring for the 380–480 portrait case; only one width in the 380/440/480/740 ladder; no `breakout` | no — 2 bare `<img>`, 0 `<figure>` | generator (15), image-prompt (10), prompt-guide (8) |
| 7 | `tip` | `151:2101` / `151:2108` | `.od-block--tip` (+ `.od-block` base) | **b** | Mobile padding never steps 20/24 → 16/20; bulb icon is a hand-drawn mask, not the exported Lucide `Icon / bulb` | no | prompt-guide (1) |
| 8 | `important` | `151:2116` / `151:2124` | `.od-block--important` | **b** | `color:#141317` hardcoded twice → unreadable in dark mode on the tinted card; no mobile padding step; alert icon hand-drawn | **yes — 1 (the only block on the page)** | comics (1), prompt-guide (1) |
| 9 | `quickAnswer` | `151:2133` / `151:2140` | — none | **c** | No `.od-block--quick-answer`. Authoring it today renders a solid black 18px square from the unmasked `.od-block__kicker::before` | no | none |
| 10 | `whatILearned` | `151:2148` / `151:2156` | `.od-block--what-i-learned` | **b** | Built as the **AIGE-nested slot**, not the rung-4 callout: transparent, border-top only, radius 0, 28px avatar, body 16/26 secondary — target is a white card, hairline, radius 16, padding 20/24, 32px avatar, body 19/30 primary | no | prompt-guide (2) |
| 11 | `keyTakeaway` | `151:2165` / `151:2174` | `.od-block--key-takeaway` | **b** | Mobile body 18/24 vs `Heading/XS` 17/22; no `font-variation-settings` anywhere in the sheet; badge-check icon hand-drawn | no | prompt-guide (3), image-prompt (1) |
| 12 | `myTake` | `309:5185` / `309:5192` | — none | **c** | No `.od-block--my-take`. 31 "I would" + 3 "Personally" in Comics have nowhere to go | no | none |
| 13 | `prompt` | Text `154:2295`/`154:2307` · Code `154:2319`/`154:2332` | `.od-prompt`, `__bar`, `__label`, `--collapsed`, `__expand`, `.od-copy` | **b** | `font-family: var(--od-mono)` on the **whole block** — `Kind=Text` must be Inter 16/26; root gap fixed at 10 (Text wants 4); no wand icon, no copy icon; expand pill is invented (Figma has no expand row) | no — but 2 `<blockquote>` are prompts | prompt-guide (2 roots) |
| 14 | `promptComparison` | `308:4204` / `308:4227` | `.od-prompt-compare`, `.od-prompt-card(--yes)`, `__bar/__label/__text`, `__arrow`, `__note` | **b** | Side A is `#fff`; target is `surface/page #f9f9f9`. Label carries `letter-spacing:.02em`; target tracking is 0. Mobile arrow is `display:none`; target keeps it rotated 90° | no | prompt-guide (1) |
| 15 | `promptStructure` | `308:4251` / `308:4295` | `.od-structure`, `__label`, `__chips`, `.od-chip(-wrap/-arrow)` | **b** | Geometry is exact (radius 12, padding 14/16/16/16, chips 5/10 radius 999, gaps 8/6). **Icon only**: `Icon / list` is a placeholder single-line mask | no | prompt-guide (2) |
| 16 | `promptResult` | `309:4222` · `309:4238` / `309:4253` | — none | **c** | No side-by-side or stacked prompt+media layout | no | none |
| 17 | `stepWorkflow` | set `278:4831` · atom `277:3838` / `277:3852` | `.od-steps`, `> li(::before/::after)`, `__title`, `__body` | **b** | Only the **atom's title + description**. Missing: eyebrow, section title, intro, Example slot, in-step Media slot, and the whole Key-takeaway divider block. Step gap is a single 28px vs 32 desktop / 24 mobile; marker stays 32/20-gap on mobile vs 28/14; mobile title 18/24 vs 17/22 | no | prompt-guide (2), generator (1) |
| 18 | `aigeTest` | `153:2115` `153:2161` `153:2218` `153:2286` / `153:2365` `153:2410` `153:2466` `153:2533` | `.od-block--aige-test`, `.od-setup*`, `.od-result-label` | **b** | **No Result Tile at all** — no results grid, no letter badge, no "Better result" pill. Setup panel has a hairline border and no fill; target is `surface/page` fill and no border. Mobile card 24/20 padding + radius 24 vs 20/20; mobile title 26/32 vs `Heading/S` 21/26; shadow is a literal, not `--od-shadow-card` | no | prompt-guide (1) |
| 19 | `comparisonAB` | `154:2450` / `154:2470` | `.od-ab`, `--framed`, `__card`, `__head`, `__badge`, `__body` | **b** | Option panels are `#fff` + hairline; target is `surface/page #f9f9f9`, **no border**. Missing the Title (`Heading/S`), the "Best for …" line and the required **Verdict** block | no | prompt-guide (2) |
| 20 | `cheatSheet` | `309:4842` / `309:4866` · atom `309:4639` | — none | **c** | No `.od-cheat-sheet` / group. No 2-column wrap, no per-group top hairline | no | none |
| 21 | `externalExamples` | `348:4279` / `348:4287` | — none | **c** | No card, no thumbnail slot, no `Open … ↗` action. Comics prints **5 bare `comic-studio` URLs**, 4 of them inside nested `<a><a>` — the exact thing rule 12 forbids | no (5 raw URLs) | none |

---

## (b) Styled but wrong — detail

Targets cited by `parts/` file. Deltas are measured off `src/styles/ourdream-article.css` unless noted.

**1 · `paragraph`** — target `parts/50-shell-and-nav.md` (Page shell, vertical rhythm) and `spec.md` §5
- Block gap: `.ourdream-article-prose > * + * { margin-top: 1rem }` = **16px**. The measured child-gap histogram over all 653 children of `Main` is `{20px: 651}` — the base gap is **20px**, uniform. Every vertical relationship on the page inherits this error.
- Letter-spacing `-0.006rem` = −0.096px on both viewports; targets are −0.072px desktop (`Article/Body Desktop`) and −0.051px mobile (`Article/Body Mobile`).
- Sizes themselves are right: 18/31 desktop, 17/28 mobile.

**2 · `h2`** — target `parts/50-shell-and-nav.md`
- `margin-top: 2.75rem` (44px) desktop, `2.25rem` (36px) mobile. Measured target is **68px** (`20 + Section space 28 + 20`).
- `h2 + *` is 16px; measured H2-bottom is 20px.
- Type is correct: 32/40 −0.496px desktop, 26/32 −0.304px mobile (target −0.48 / −0.26).

**3 · `h3`** — target `spec.md` §5 row 3 (`Heading/XS` 17/22)
- Ships **22/30** desktop (`1.375rem/1.875rem`) and **19/26** mobile. `Heading/XS` is 17/22 on both viewports per `parts/10-callouts.md` and `parts/50-shell-and-nav.md`.
- `margin-top: 1.75rem` (28px) vs measured **48px** (`20 + Section space 8 + 20`).
- Conflict to resolve before fixing: `parts/50-shell-and-nav.md` records a measured in-page **H3 height of 30px**, which cannot come from a 22px line-height. Either the in-page H3s are not `Heading/XS` or the height is a two-slot measurement. Flag to the designer rather than guessing.

**6 · `figure`** — target `parts/40-evidence.md` (Article / Image + Caption)
- `.ourdream-article-prose img { background: #efefed }` is a literal. `--od-sunken` exists and has a dark value (`#17161a`); the literal ignores it, so every figure keeps a light-grey backdrop in dark mode.
- Radius 12 ✅, 1px hairline ✅, caption `Label/Sans S` 12/16 `text/muted` ✅, figure gap 8 ✅.
- Width ladder incomplete: only `.od-media--portrait { max-width: 23.75rem }` = 380px exists, and it does not centre (`margin-inline: auto` absent). Targets are 380–480 portrait (centred), ~480 square, ~440 supporting, up to 740 interface.
- No `breakout` (960px) support at all; `--od-breakout: 60rem` is declared and referenced **zero times**.

**7 · `tip`** — target `parts/10-callouts.md`
- Desktop is correct: 740 column, padding 20/24, radius 16, 1px hairline, `#fff`, label `Body/S Strong` 14/20 primary, body `Body/M` 16/26, content gap 8, label-row gap 8.
- **Mobile padding is never stepped down.** There is no `max-width` rule anywhere in the sheet (0 `@media (max-width:)` blocks) and no mobile override, so mobile keeps 20/24 instead of 16/20.
- Icon: `Icon / bulb` 18×18, Lucide 24-grid 1.5px round caps. What ships is a hand-written 18×18 mask path. Colour `--od-muted` #55545b matches the inferred stroke.

**8 · `important`** — target `parts/10-callouts.md`
- Background `--od-orange-soft` ✅, border removed ✅, radius 16 ✅, padding 20/24 ✅.
- **`color: #141317` is hardcoded on `.od-block--important` and again on its `__kicker`/`__body`.** In dark mode `--od-orange-soft` becomes `rgb(232 118 10 / 18%)` over a `#0f0f12` page while the text stays near-black. This is the single clearest live bug in the sheet.
- Mobile padding: same 16/20 miss as Tip.
- Icon: `Icon / alert` hand-drawn; stroke `--od-orange-ink` #e8760a matches the inferred value.

**10 · `whatILearned`** — target `parts/10-callouts.md` (rung 4) vs `parts/40-evidence.md` (AIGE nested slot)
- The CSS implements the **AIGE Test nested slot**, not the standalone callout: `border: none; border-top: 1px solid hairline; border-radius: 0; padding: 1.25rem 0 0; background: transparent`, avatar `1.75rem` (28px), body `16/26` in `--od-muted`.
- Rung-4 target is a **white card**, 1px hairline, radius 16, padding 20/24 desktop · 16/20 mobile, **32px** avatar with a 1.5px `#141317` ring, content gap 12, label-row gap 12, body `Body/L` **19/30 desktop / 17/28 mobile** in `text/primary`, attribution `Body/S` 14/22 `text/secondary`.
- `.od-block--what-i-learned .od-block__role` is 14/22 `--od-muted` — correct for the standalone attribution, wrong for the nested slot it is otherwise built as. The two cases need two selectors.
- Avatar comes from `--od-author-avatar` set inline in `OurDreamArticlePage.astro`; fallback is `#ccc`, a grey that is in no token set.

**11 · `keyTakeaway`** — target `parts/10-callouts.md`
- Accent bar correct: 4px, radius 2, `--od-pink`, inset inside the 24px padding, `grid-row: 1 / span 8` standing in for `align-self: stretch`.
- Card correct: white, hairline, radius 16, padding 20/24, root gap 16, content gap 8.
- Body type: desktop `1.3125rem/1.625rem` = **21/26 ✅**; mobile `1.125rem/1.5rem` = **18/24**, target `Heading/XS` **17/22**.
- `font-variation-settings: "opsz" 14, "wdth" 100` is required on every Bricolage run in the spec and appears **0 times** in the sheet.
- Icon: `Icon / badge-check` hand-drawn; its stroke colour is the one genuinely ambiguous value in the family (`#db2777` vs `#141317`) — CSS picked `--od-pink`, unconfirmed.

**13 · `prompt`** — target `parts/20-prompts.md`
- Box is exact: padding 10/16/14/16, radius 10, 1px hairline, `#fff`.
- **`font-family: var(--od-mono)` sits on `.od-prompt` itself.** `Kind=Text` must be Inter `Body/M` 16/26; only `Kind=Code` is `Article/Code` Geist Mono 14/23. There is no `--text` / `--code` split, so every prompt renders as code. This also means the "monospace only in code or copyable prompt text" rule is broken in the one place it is enforceable.
- `.od-prompt__bar { margin-bottom: .625rem }` = 10, correct for Code, wrong for Text (gap 4).
- Label row has **no wand icon** (`Icon / wand` 14×14 `#db2777`) and `.od-copy` has **no copy icon** (`Icon / copy` 13×13 `#55545B`). Copy box geometry is right: padding 4/6, radius 6, transparent, `Label/Sans S` `text/secondary`.
- Collapse: `max-height: 32.5rem` = **520px**, matching the component description exactly. The fade is 160px (`10rem`); nothing in Figma specifies one. `.od-prompt__expand` is a 40px pill with a 1.5px `--od-ink` border — **invented**; Figma has no fade layer, no expand row and no collapsed/expanded variant in any of the four drawn variants.
- `.ourdream-article-prose blockquote` is styled as a mono card with the same radius/border/padding as `.od-prompt`. That is an **invented pattern with no Figma node**, and it matters because blockquotes are being used as de-facto prompts (25 in the Image Prompt guide, 6 in the Image Generator guide, 2 in Comics).

**14 · `promptComparison`** — target `parts/20-prompts.md`
- Root gap 10 ✅, both sides radius 10 ✅, padding 12/16/14/16 ✅, side B border `--od-pink` ✅, labels 12/16 Medium with A `text/muted` / B `action/pink-press` ✅, prompt text 16/26 with A secondary / B primary ✅, conclusion 14/22 secondary ✅.
- **Side A background is `--od-white`.** Target is `surface/page #f9f9f9` with the hairline doing the panel definition.
- `.od-prompt-card__label { letter-spacing: 0.02em }` — `Label/Sans S` tracking is **0**. (The brief wants uppercase micro-labels; `parts/20-prompts.md` C4 records that the drawn component is sentence-case with no tracking and that the stated rule has not been resolved. The CSS has half-applied the brief.)
- `.od-prompt-compare__arrow { display: none }` below 800px. The mobile design keeps the arrow, rotated 90°, between the two sides.
- No Copy affordance on side B in CSS — the markup has to supply `.od-copy` by hand.
- Breakpoint is 800px, outside the sheet's 1100px system.

**15 · `promptStructure`** — target `parts/20-prompts.md` · **icon-only delta**
- Everything measurable matches: card radius 12, padding 14/16/16/16, 1px hairline, `#fff`, root gap 10; chips padding 5/10, radius 999, 1px hairline, `#fff`, `Body/S Strong` 14/20 primary; items row-gap 8 / column-gap 6; arrow 13px `--od-dim` #8a8991; label `Label/Sans S` 12/16 `text/secondary`; correctly **no copy affordance**.
- `.od-structure__label::before` should be `Icon / list` 13×13 stroked `#db2777`. The shipped mask path is `M3 10h9` — one horizontal line. It renders as a pink dash.

**17 · `stepWorkflow`** — target `parts/30-process.md`
- What exists is the **Workflow Step atom, partially**: marker 32×32 radius 16 `--od-pink-soft` / `--od-pink-ink` at `Body/S Strong` 14/20 ✅; connector 1.5px `--od-rail` #d2d2ce at `left: .9375rem` starting `top: 2.25rem` (36) ending `bottom: .25rem` (4) ✅; rail→content column-gap 20 ✅; title→body gap 8 ✅; description `Article/Body` 18/31 desktop / 17/28 mobile in `text/secondary` ✅.
- **Missing from the parent block entirely:** eyebrow (6×6 `action/pink` mark + `Label/Sans` 13/18), section Title (`Article/H2`), intro (`Article/Body`, `text/primary`), the **Example slot** (`surface/sunken #efefed`, radius 10, padding 14/10 desktop · 12/8 mobile, "Example" label `Label/Sans S` `text/muted`), the **in-step Media slot** (688×440 / 308×197, radius 12, 1px hairline, caption `Label/Sans S` muted), and the **Key takeaway** block (40×2 pink accent + 1px hairline rule, 6px spacer, `KEY TAKEAWAY` at `Label/Sans` +0.78px tracking `action/pink-press`, conclusion `Heading/S`).
- Step separation is `padding-bottom: 1.75rem` = **28px** on both viewports; targets are **32px desktop / 24px mobile**, and that padding is what keeps the connector unbroken, so it cannot be a guess.
- Mobile never steps down: marker stays 32 (target 28), rail gap stays 20 (target 14), marker number stays 14/20 (target `Label/Sans` 13/18), content gap stays 8 (target 6), title stays 18/24 (target `Heading/XS` 17/22).
- Horizontal Process (`349:15054`, the `display: 'horizontal'` case) has no CSS of any kind.

**18 · `aigeTest`** — target `parts/40-evidence.md`
- Card desktop: padding 32 ✅, radius 24 ✅, 1px hairline ✅, `#fff` ✅, shadow values match `Elevation/Card` ✅ — but written as a literal `box-shadow` rather than `var(--od-shadow-card)`, which is declared and used **zero times**.
- Card mobile: padding `1.5rem 1.25rem` (24/20) and radius 24. Targets are **20 all sides** and **radius 20**.
- Eyebrow pill exact: padding 4/10/4/8, radius 999, `--od-pink-soft`, icon 14, text `--od-pink-ink` ✅.
- Title mobile `1.625rem/2rem` = 26/32; target `Heading/S` **21/26**. Desktop 28/32 Bold ✅.
- **Test setup panel is inverted**: `.od-setup` ships `border: 1px solid hairline` and **no background**. Target is `background: surface/page #f9f9f9`, **no border**, padding 16/20 desktop · 16 mobile, radius 16. Grid, column-gap 32, row padding 8/0 and the key/value type all ✅ — but the 2-column switch fires at 640px, outside the 1100px system, and column fill order is not column-major as measured.
- Result text mobile `1.0625rem/1.75rem` (17/28); target `Body/M` **16/26**. Desktop 19/30 ✅. `.od-result-label` `Body/S Strong` `--od-pink-ink` ✅.
- **`Article / Result Tile` does not exist in any form.** No results wrapper, no `flex-wrap` grid, none of the five `Size` variants (676×450 Full, 328×437 Large, 212×283 Medium, 310×413 Mobile full, 149×199 Mobile half), no 28/24px white letter badge, no solid-pink "Better result" pill, no two-line caption. The signature block currently cannot show evidence.

**19 · `comparisonAB`** — target `parts/40-evidence.md`
- Card: radius 20 ✅, padding 24 desktop ✅ (`1.25rem 1rem` mobile vs target `20px 16px` — 20/16 vs 20/16, ✅), no shadow ✅, 1px hairline ✅, `#fff` ✅, options gap 16 desktop / 12 mobile ✅.
- **Option panels are `--od-white` with a 1px hairline.** Target is `surface/page #f9f9f9` and **no border** — the whole divider strategy of this card is two `#f9f9f9` panels on a `#fff` card, and the CSS has inverted it.
- Letter chip 24×24 radius 999 `--od-pink-soft` / `--od-pink-ink` at 14/600 ✅. Option name 16/24 SemiBold primary ✅. Option body 14/22 secondary ✅.
- **Missing:** the card Title (`Heading/S` desktop / `Heading/XS` mobile), the `"Best for …"` line (`Body/S Strong`, `text/primary`), and the **required Verdict block** (eyebrow `Body/S Strong` `action/pink-press` + text `Body/M` primary, gap 4, gap 20 from the options row).
- Breakpoint is 720px.

---

## (c) Not styled at all

| Block type | Figma node (desktop / mobile) | Note |
|---|---|---|
| `quickAnswer` | `151:2133` / `151:2140` | Rung 3. Needs `action/pink-soft #fce7f3` fill, no border, radius 16, padding 24/28 desktop · **20 uniform** mobile, pink-press label, body `Body/L` 19/30 · `Article/Body Mobile` 17/28, `Icon / sparkle` 18px. Authoring it today would render a solid black square from the unmasked default `.od-block__kicker::before` |
| `myTake` | `309:5185` / `309:5192` | Not a card: transparent, radius 0, 1px hairline **top and bottom only**, padding 18/0, 36px avatar, horizontal head (label + attribution side by side), body `Body/L` 19/30 · `Body/M` 16/26 |
| `promptResult` | side-by-side `309:4222` · stacked `309:4238` / `309:4253` | Transparent wrapper; side-by-side is a 300px image + 412px content column with gap 28 and `padding-top: 4`; stacked is column gap 12. Nests an `Article / Prompt` instance labelled "Exact prompt" |
| `cheatSheet` (+ `Cheat Sheet Group` `309:4639`) | `309:4842` / `309:4866` | Typography and hairlines only — no card, no fill, no bullets. 2-column `flex-wrap` at 354px children, row-gap 20 / column-gap 32; each group `border-top: 1px hairline` + `padding-top: 14`; title `Body/S Strong`, terms 16/28 `text/secondary`. `Icon / library` 14px |
| `externalExamples` | `348:4279` / `348:4287` | 360px card, `surface/page #f9f9f9`, 1px hairline, radius 12, padding 14/16, gap 12; optional 56×40 `surface/sunken` thumbnail; category `Label/Sans S` muted, title `Body/M Strong`, description `Body/S`, action `Open <noun> ↗` in `action/pink` |

Also unstyled, though outside the 21 authored types: `Article / Sources` + `Source Row` (`358:4352` / `358:4288`), `Article / Citation Marker` (`359:4297`), and the `Article / Header` **Description / dek** slot — `OurDreamArticlePage.astro` renders breadcrumb → h1 → meta with no description node.

---

## Content markup gap

| File | Size | Distinct `od-*` classes | Pattern blocks | Images | Estimated blocks it should have |
|---|---|---|---|---|---|
| `ourdream-ai-comics.html` | 77 KB (819 lines) | **4** (`od-block`, `od-block--important`, `__kicker`, `__body`) | **1** | 2 `<img>`, 0 `<figure>` | **≈63** (estimate, see below) |
| `ourdream-ai-prompt-guide.html` | 36 KB (695 lines) | **57** tokens / 26 distinct patterns | **26** | 8 `<figure>` | ≈30 — broadly complete |
| `ourdream-ai-image-generator.html` | 29 KB (292 lines) | **1** (`od-steps`) | **1** | 15 `<figure>` | ≈18 (estimate) — 6 `<blockquote>` are prompts, 12 H2 sections want takeaways |
| `ourdream-ai-image-prompt-guide.html` | 16 KB (208 lines) | **4** (`od-block`, `--key-takeaway`, `__kicker`, `__title`) | **1** | 10 `<figure>` | ≈35 (estimate) — **25 `<blockquote>`** are all prompts |

### Comics — estimated blocks per pattern

Counted by skimming the prose for passages that clearly want a pattern. **These are estimates, deliberately conservative**: where a passage could be two blocks it is counted as one, and no pattern is proposed that would need media the repo does not have.

| Pattern | Est. | Evidence in the prose |
|---|---|---|
| `prompt` | **19** | 19 distinct prompt strings authored as `<h3>` ("A romantic bedroom.", "Panel 03: Sarah opens the door.", "No text, no speech bubbles.", …) — 21 occurrences, 2 repeats |
| `tip` | **8** | The `OurDream AI Comics Tips` H2 alone has 9 H3 sub-tips; capped at the "max 1–2 per section" rule |
| `keyTakeaway` | **8** | 16 H2 sections, max one per section — assumed half the sections end on a real conclusion |
| `important` | **7** (1 exists) | Moderation/blocked prompts, desktop-only editor, copyrighted characters, DreamCoin waste, over-editing, speech-bubble limits, NSFW limits |
| `stepWorkflow` | **3** | One 12-step sequence (`Step 1 —` … `Step 12 —`); the validator caps steps at 2–6, so it must split into 3 workflows |
| `promptComparison` | **3** | The two `<blockquote>`s are a before/after pair ("Top panel:" → "Panel 01:"); plus vague-vs-specific passages under "Keep Your Prompts Short" and "Describe Exactly What You Want to See" |
| `comparisonAB` | **3** | "Comic Pages vs Cover Pages", "Brush Editor vs Layers: Which Should You Use?", "Which Layout Should You Use?" |
| `myTake` | **3** | 31 × "I would" and 3 × "Personally" in the prose; capped at the spec's "1–3 per long article" |
| `whatILearned` | **2** | Weak signal — the article has **no** first-person testing language ("I tested" 0, "in my testing" 0). Two at most, and they may not be justifiable |
| `cheatSheet` | **2** | Layout/camera/art-style term lists (2-, 3-, 4-, 5-panel groups; 8 anime styles; 5 realistic camera styles) and the DreamCoin cost table currently rendered as 8 `<h3>` calculations |
| `figure` | **2** | The two existing `<img>` are bare — no `<figure>`, no caption |
| `quickAnswer` | **1** | Once, after the intro — the article opens with a 2-paragraph definition that is exactly this |
| `promptStructure` | **1** | "Write Prompts by Panel Number" describes the panel-order formula |
| `externalExamples` | **1 block, 5 links** | 5 bare `ourdream.ai/comic-studio/…/read` URLs, 4 inside nested `<a><a>` |
| `aigeTest` | **0** | No real test with screenshots exists in this article |
| `promptResult` | **0** | Would require paired prompt + result assets that are not in the repo |
| **Total** | **≈63** | vs **1** today |

Plus the fixed sections: the 10 FAQ questions at the end are authored as `<h3>` + `<p>` and need the FAQ component; 1 article header dek; 0 sources (the article cites nothing).

**Two structural problems that make the conversion mechanical rather than editorial.** First, **27 of the 121 `<h3>`s are not headings** — 19 are prompt strings, 8 are cost calculations (`3 characters \= 60 DC`, `Total \= 260 DreamCoins`). They pollute the TOC and are the main reason the page reads as flat. Second, the escaped markdown artefacts (`\=`, `\+`, `\×`) are visible in the rendered text. Both are find-and-replaceable. The remaining ~94 `<h3>`s are genuine section headings.

---

## Orphan CSS

**No `.od-*` selector in `ourdream-article.css` is unused repo-wide** — all 53 appear in `ourdream-ai-prompt-guide.html`. The real orphan problem is one level up: **tokens and rules that nothing references**, and **classes in content that no CSS matches**.

### Declared tokens with zero `var()` references in the sheet

| Token | Keep? | Why |
|---|---|---|
| `--od-sunken` `#efefed` | **keep** | Required by `figure`, `stepWorkflow` Example slot, `promptResult` image slot, `externalExamples` thumbnail, `aigeTest` Result Tile. `.ourdream-article-prose img` currently hardcodes `#efefed` instead — swap it |
| `--od-shadow-card` | **keep** | `.od-block--aige-test` already ships the identical literal — replace it |
| `--od-shadow-float` | **keep** | `Article / Jump to Section` expanded state (`parts/50-shell-and-nav.md`) — not yet applied to `.ourdream-article-jump[open]` |
| `--od-breakout` `60rem` | **keep** | The 960px breakout for `figure` and horizontal `stepWorkflow`. Nothing implements breakout yet |
| `--od-on-ink` `#f7f7f6` | **keep** | Citation Marker tooltip text and the "Better result" badge label |
| `--od-green-ink` / `--od-green-soft` | **keep, low priority** | `score/high` band. Only reachable from the hub score chip — nothing in the 21 block types uses it |
| `--od-red-ink` / `--od-red-soft` | **keep, low priority** | `score/low`. Same — plus the `DO NOT USE FOR` heading colour in the usage annotations, which is documentation, not a shipped block |

### Rules with no Figma node behind them

| Selector | Verdict |
|---|---|
| `.ourdream-article-prose blockquote` | **Invented.** Styled as a mono card that duplicates `.od-prompt`. 33 blockquotes across three articles are using it as a prompt block. Retire it in favour of `prompt`, or keep it only as a migration shim |
| `.od-compare-grid` | **Invented.** JS-paired adjacent `<figure>`s into a 2-up grid. `Article / Comparison A/B` is words-only and has no images, so this maps onto nothing in Figma. Either get a node for it or fold it into `figure` + `breakout` |
| `.od-prompt__expand` | **Invented.** No fade, no expand row and no collapsed/expanded variant exists in any of the four drawn Prompt variants; 520px comes from the component description only |
| `.od-ab` (unframed) | **Probably dead.** Both A/B instances in the repo are `od-ab--framed`; the bare 2-column grid has no Figma counterpart |

### Classes used in content with no CSS rule

- `od-block__kicker--aige` — in `ourdream-ai-prompt-guide.html`, matches nothing in the sheet.
- `.od-aige-test` — targeted by `ourdream-article.client.ts` (`closest('.od-aige-test, .od-block--aige-test')`) but defined in neither CSS nor content. Dead branch.

### Breakpoint drift

The sheet's system breakpoint is **1100px** (19 blocks). Four rules use stray breakpoints — `.od-setup__grid` at 640, `.od-ab` and `.od-compare-grid` at 720, `.od-prompt-compare` at 800 — so those four patterns change layout at widths where nothing else does. There are **zero `max-width` media queries**, which is why no callout ever steps down to its mobile padding.

---

## Icons required

**None of these exist as exported assets.** There are **0 `<svg>` elements inside the Comics prose** (the 5 `<svg>`s in the repo's article code all belong to shell chrome: 2 in `OurDreamArticleMobileJump.astro`, 2 in `OurDreamArticleRelated.astro`, 1 in the Prompt Guide body). The stylesheet ships **8** icon glyphs as inline CSS `mask:` data-URIs with hand-written path data — approximations, not Lucide-on-24-grid geometry, and one (`Icon / list`) is a placeholder single line.

All icons: **Lucide geometry on a 24 grid, 1.5px stroke, round caps and joins, stroke coloured only.** Names are as the `parts/` files give them.

| Icon | Size | Stroke | Used by | Exists today |
|---|---|---|---|---|
| `Icon / bulb` (`87:135`) | 18 | `text/secondary` #55545b *(inferred)* | `tip` | hand-drawn mask |
| `Icon / alert` (`87:132`) | 18 | `score/mid` #e8760a *(inferred)* | `important` | hand-drawn mask |
| `Icon / sparkle` (`53:46`) | 18 | `action/pink` #db2777 *(inferred)* | `quickAnswer` | **no** |
| `Icon / badge-check` (`120:562`) | 18 | `action/pink` **or** `text/primary` — **ambiguous, must be confirmed in Figma** | `keyTakeaway` | hand-drawn mask |
| `Icon / badge-check` | 14 | `action/pink-press` #be185d | `aigeTest` eyebrow pill | hand-drawn mask |
| `Icon / check` (`53:11`) | 14 | `text/on-ink` #f7f7f6 | Result Tile "Better result" badge | **no** |
| `Icon / check` | 12 | `text/on-ink` | Result Tile, Mobile half | **no** |
| `Icon / check` | 13 | `action/pink-press` #be185d | `promptComparison` side B | **no** |
| `Icon / x` (`53:14`) | 13 | `text/muted` #8a8991 | `promptComparison` side A | **no** |
| `Icon / wand` (`53:99`) | 14 | `action/pink` #db2777 | `prompt` label row | **no** |
| `Icon / copy` (`87:128`) | 13 | `text/secondary` #55545b | `prompt`, `promptComparison`, `promptResult` | **no** |
| `Icon / list` (`87:142`) | 13 | `action/pink` #db2777 | `promptStructure` | placeholder mask (single line) |
| `Icon / list` | 16 | `text/primary` | Jump to Section bar | inline `<svg>` in component ✅ |
| `Icon / arrow-right` (`53:5`) | 16 | `text/muted` #8a8991 | `promptComparison` separator (rotated 90° on mobile) | **no** |
| `Icon / arrow-right` | 13 | `text/muted` #8a8991 | `promptStructure` chip separator | hand-drawn mask |
| `Icon / arrow-right` | 16 / 14 | `text/primary` / `action/pink-press` | Related Guides row + bottom link | inline `<svg>` in component ✅ |
| `Icon / library` (`120:568`) | 14 | `text/secondary` #55545b | `cheatSheet` head | **no** |
| `Icon / chevron-right` (`53:26`) | 14 | `text/muted` #8a8991 *(inferred)* | Article Header breadcrumb | hand-drawn mask |
| `Icon / chevron-down` (`53:23`) | 16 | `text/primary` | Jump to Section (0° / 180°) | inline `<svg>` in component ✅ |
| `Icon / plus` (`53:17`) | 18 | `text/primary` *(inferred)* | FAQ Item collapsed | **no** — CSS ships minus only |
| `Icon / minus` (`53:20`) | 18 | `text/primary` *(inferred)* | FAQ Item expanded. **The glyph swaps — it is not a rotated plus** | hand-drawn mask |
| `Brand / Avatar Herman` (`57:41`) | 28 / 32 / 36 | 1.5px `#141317` ring, `object-fit: cover` | Article Header 28 · `aigeTest` slot 28 · `whatILearned` 32 · `myTake` 36 | passed as `--od-author-avatar`; fallback `#ccc` |

**19 distinct icon requests, 11 of them not present in any form.** Six of the eight masked glyphs are hand-approximations that should be replaced by the exported asset even where they currently render. Note that four stroke colours are marked `(inferred)` in `parts/10-callouts.md` and `parts/50-shell-and-nav.md` — they were deduced from unused colour variables, not read off the node, so the export pass should confirm them. Two literal characters are **not** icons and must stay as text: `→` in the Horizontal Process separators and the TOC "Explore all" link, and `↗` in `externalExamples` / Source Row.

---

## Shell — do not touch

The shell is the one part of the system that is already correct, and it should be preserved intact through the pattern work.

**Column geometry — exact.** `.ourdream-article-page` declares `--od-content: 46.25rem` (**740px**), `--od-layout-gap: 5rem` (**80px**), `--od-sidebar: 15rem` (**240px**), and the grid at `@media (min-width: 1100px)` is `minmax(0, var(--od-content)) var(--od-sidebar)` with `column-gap: var(--od-layout-gap)`. Side padding is `clamp(1.25rem, 13.2vw, 11.875rem)` — 11.875rem = **190px** at 1440. That reproduces the measured Figma band `190 | 740 | 80 | 240 | 190` = 1060 centred in 1440, verified on the live site as exactly 740 / 80 / 240 with 190px margins.
File: `src/styles/ourdream-article.css:36-63`.

**Sticky TOC — matches `parts/50-shell-and-nav.md`.** `.ourdream-article-toc__list { max-height: 26.25rem }` is **420px** with internal scroll, exactly as measured. Items use a 3px left indicator (`--od-hairline` → `--od-pink` on `.is-active`), the label goes 14/22 regular `text/secondary` → 14/20 SemiBold `text/primary` when active, and the block ends with a 1px hairline divider above the `Explore all OurDream AI guides →` link in `action/pink` with the arrow as a glyph in the string. Sticky offset is `calc(var(--site-header-height, 4.25rem) + 0.5rem)`.
Files: `src/components/guides/ourdream/OurDreamArticleSidebar.astro`, `src/styles/ourdream-article.css:208-283`, TOC extraction in `src/lib/ourdream-guide-toc.ts`.

**Mobile jump menu.** A `<details>` card — 1px hairline, radius `0.875rem` (**14px**), `surface/card`, `overflow: hidden`, chevron rotating 180° on `[open]`, hidden above 1100px. Tapping an item closes the panel (`initOurDreamArticlePage`, the `[data-ourdream-jump]` loop).
Files: `src/components/guides/ourdream/OurDreamArticleMobileJump.astro`, `ourdream-article.client.ts:66-74`.

**Copy buttons.** `bindCopyButtons` resolves `[data-od-copy]` → `[data-od-copy-root]` → `[data-od-copy-text]` (falling back to `pre`, `.od-prompt-card__text`, `.od-prompt__body`), writes to the clipboard and shows **"Copied" for 1600 ms**. `parts/20-prompts.md` records that no `Copied` state exists in Figma — this behaviour is ahead of the design and should be kept and standardised, not reinvented.
File: `ourdream-article.client.ts:25-47`.

**Prompt expand.** `bindPromptExpand` adds `.is-expanded` to the nearest `.od-prompt` on `[data-od-expand]` click. The 520px clamp matches the component description; the button's visual design is invented (see Orphan CSS) but the mechanism is sound.
File: `ourdream-article.client.ts:49-58`.

**Compare-figure pairing.** `wrapCompareFigures` walks the prose children and wraps adjacent `<figure>` pairs in `.od-compare-grid`, skipping anything already wrapped or inside an AIGE test. It is idempotent (`root.dataset.compareBound`).
File: `ourdream-article.client.ts:1-23`.

All of the above rebinds on `astro:page-load`, so it survives view transitions. Also worth preserving: `data-glossary-decorate` on the prose container (`OurDreamArticlePage.astro`), which `spec.md` §6.3 keeps as an automatic decoration rather than an authored mark.

**The one shell gap:** `Article / Header` has no Description / dek slot in `OurDreamArticlePage.astro` — breadcrumb → `<h1>` → meta, with no one-sentence standfirst. That is an addition to the shell, not a change to it.
