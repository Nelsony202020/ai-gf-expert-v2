# 50 — Article shell & navigation

Figma file key `iaUwrRvpkEq7RrBpPLxA6j`, page **02 · Article Components**. Source of truth for the article shell and the navigation family. Target stack: Astro + plain CSS.

**Measured vs inferred.** Everything in the spec tables below is read directly off the Figma nodes (`get_design_context` + `get_variable_defs`) or off the measured node geometry of the Comics article page frame (`get_metadata` on `318:4936`). Anything inferred is marked `(inferred)`.

## Tokens used by this family

| Token | Value | Notes |
|---|---|---|
| `text/primary` | `#141317` | body + active labels |
| `text/secondary` | `#55545b` | breadcrumb, meta, inactive TOC labels, FAQ answers |
| `text/muted` | `#8a8991` | resolves on Header + Related Guides; not emitted in code — almost certainly the chevron / arrow icon stroke `(inferred)` |
| `action/pink` | `#db2777` | TOC active indicator, TOC bottom link |
| `action/pink-press` | `#be185d` | Related Guides bottom link, Jump-to-section active item |
| `border/hairline` | `#e6e6e3` | every 1px rule in this family |
| `surface/card` | `#ffffff` | Jump to Section card |
| `surface/sunken` | `#efefed` | Content / Topic Tag (OFF on guide rows) |
| `Elevation/Float` | `0 4px 8px 0 #15111A1A, 0 24px 48px -8px #15111A29` | Jump to Section, expanded only |

Text styles (Figma letter-spacing is stored in **%**; px equivalents from the emitted code):

| Figma style | Family / weight | Size / line-height | Letter-spacing |
|---|---|---|---|
| `Heading/L` | Bricolage Grotesque Bold 700 | 40 / 44 | −2% → `-0.8px` |
| `Heading/M` | Bricolage Grotesque Bold 700 | 28 / 32 | −1.5% → `-0.42px` |
| `Heading/S` | Bricolage Grotesque SemiBold 600 | 21 / 26 | −1% → `-0.21px` |
| `Heading/XS` | Bricolage Grotesque SemiBold 600 | 17 / 22 | −0.5% → `-0.085px` |
| `Body/L` | Inter Regular 400 | 19 / 30 | −0.5% → `-0.095px` |
| `Body/M` | Inter Regular 400 | 16 / 26 | −0.3% → `-0.048px` |
| `Body/M Strong` | Inter Semi Bold 600 | 16 / 24 | −0.3% → `-0.048px` |
| `Body/S` | Inter Regular 400 | 14 / 22 | −0.2% → `-0.028px` |
| `Body/S Strong` | Inter Semi Bold 600 | 14 / 20 | −0.2% → `-0.028px` |

All Bricolage text carries `font-variation-settings: "opsz" 14, "wdth" 100`.
All Lucide icons: 24 grid, 1.5px stroke, round caps/joins; colour the stroke only.

---

## Article / Header

Nodes: desktop `158:2532`, mobile `158:2551`, component set `158:2570`.

**Purpose.** Simple guide article header: breadcrumb, title, one-sentence description, author + updated date + read time. Top of every guide article. Do NOT use serif decks, "tested" lab labels, mono metadata, or huge editorial intros.

**Anatomy**
- `Breadcrumb` (`158:2533` / `158:2552`) — Home › Guides › OurDream AI › **Prompt Guide**; 3 × `Icon / chevron-right` between crumbs. Crumb count is a slot.
- `Title` (`158:2544` / `158:2563`) — H1.
- `Description` (`158:2545` / `158:2564`) — one sentence.
- `Meta` (`158:2546` / `158:2565`)
  - `Brand / Avatar Herman` (`57:41`)
  - `Meta text` (`158:2548` / `158:2567`) → author name + `details` string

**Spec**

| | Desktop `158:2532` | Mobile `158:2551` |
|---|---|---|
| Width | 740 | 350 |
| Direction / gap | column, `20` | column, `16` |
| Padding | 0 | 0 |
| Breadcrumb | row, gap `6`, nowrap | row, **wrap**, gap `4` row / `6` column, full width |
| Title style | `Heading/L` 40/44 `-0.8px` | `Heading/M` 28/32 `-0.42px` |
| Description style | `Body/L` 19/30 `-0.095px` | `Body/M` 16/26 `-0.048px` |
| Meta row | row, gap `10`, align center | same; Meta text becomes a **column**, fixed height `44` |
| Avatar | 28 × 28, `border-radius: 999px`, `1.5px` border `text/primary` | identical |
| Measured instance height | `178` (in Comics article, `318:4963`) | not measured |

Text styles: crumbs (inactive) `Body/S` / `text/secondary`; current crumb `Body/S Strong` / `text/primary`; author name `Body/S Strong` / `text/primary`; details `Body/S` / `text/secondary`.

Icons: `Icon / chevron-right` (`53:26`), **14 × 14**, no rotation. Stroke `text/muted` `(inferred)`.

**Verbatim copy** — `Home` · `Guides` · `OurDream AI` · `Prompt Guide` · title `OurDream AI Prompt Guide: How to Write Better Prompts` · description `Learn how OurDream prompts work and how to get better results with characters, images and video.` · `Herman Carter` · details `· Updated Sep 10, 2026 · 12 min read` (note the leading `· ` — the separator lives in the details string, **not** as a gap).

---

## Article / In This Guide (TOC)

Node: `158:2580`. Instance in page: `320:6658` inside `Aside — sticky TOC` `318:4962`.

**Purpose.** Sticky desktop table of contents in the right rail (220–260 wide). Highlights the section in view. Desktop only — mobile uses Article / Jump to Section. Never terminal styling.

**Anatomy**
1. `In this guide` label (`158:2581`)
2. `Items` (`158:2582`) — n × `Article / TOC Item`, vertical, **no gap**, `max-height: 420px`, `overflow-y: auto`, `overflow-x: clip`
3. `Divider` (`347:4270`) — 1px
4. `Explore all …` link (`347:4271`)

**Spec (desktop only)**

| Property | Value |
|---|---|
| Width | `240` (rail is 240; component doc allows 220–260) |
| Direction / gap | column, `12` |
| Padding | `0`; the rail adds `8` top padding (measured: inner frame at `y=8` in `318:4962`) |
| Items max-height | `420` exactly, internal scroll |
| Divider | `height: 1px`, full width, `border/hairline` `#e6e6e3` (a filled rect, not a border) |
| Measured heights | Aside `240 × 507`; inner `240 × 499`; label `y=0 h=20`; Items `y=32 h=420`; Divider `y=464`; link `y=477 h=22` |
| Sticky | `position: sticky`, offset **not encoded in Figma** — frame is a scroll-0 snapshot. Global header is `80` tall; rail content sits `144` from page top (`80 + 56 + 8`). Recommend `top: 104px` = header 80 + 24 `(inferred)` |

Text styles: label `Body/S Strong` / `text/primary`; bottom link `Body/S` / **`action/pink` `#db2777`**, regular weight, arrow is a literal `→` glyph in the string (no icon node).

**Verbatim copy** — heading `In this guide`; link `Explore all OurDream AI guides →`; sample items `How prompting works`, `Types of prompts`, `JSON prompts`, `Common mistakes`, `My workflow`, `FAQ`.

---

## Article / TOC Item

Nodes: Default `158:2571`, Active `158:2575`, component set `158:2579`.

**Purpose.** One entry in the desktop "In this guide" list. Active = pink indicator + stronger label. No numbers, no mono, no uppercase.

**Anatomy** → `Indicator` (bar) + `Text` (label)

**Spec (desktop only — item does not exist on mobile)**

| Property | Default `158:2571` | Active `158:2575` |
|---|---|---|
| Width | `240` (stretches to rail) | `240` |
| Direction / gap | row, `12`, align start | same |
| Indicator | `3` wide, `align-self: stretch` (full item height), `border-radius: 1px`, fill `border/hairline` `#e6e6e3` | same geometry, fill **`action/pink` `#db2777`** |
| Text block | `flex: 1`, column, padding `7px 0` | same |
| Label style | `Body/S` 14/22 `-0.028px` / `text/secondary` | `Body/S Strong` 14/20 `-0.028px` / `text/primary` |
| Measured heights | `36` one line, `58` two lines | `34` one line, `58` two lines |

No icons. No radius/border/background on the item itself.

---

## Article / Jump to Section

Nodes: Collapsed `158:2607`, Expanded `158:2614`, component set `158:2635`.

**Purpose.** Mobile table of contents that sticks under the header, replacing the permanent rail. Mobile only; no mono/uppercase labels.

**Anatomy**
1. `Bar` (`158:2608` / `158:2615`) — `Icon / list` + `Jump to section` label + `Icon / chevron-down` (rotated 180° when expanded)
2. `Items` (`158:2621`, expanded only) — n × `Item`; first item is the active one, prefixed with a `6px` `Ellipse` bullet

**Spec (mobile only)**

| Property | Collapsed `158:2607` | Expanded `158:2614` |
|---|---|---|
| Width | `350` | `350` |
| Background | `surface/card` `#ffffff` | same |
| Border | `1px` solid `border/hairline` `#e6e6e3` (all sides) | same |
| Radius | `14` | `14` |
| Shadow | none | `Elevation/Float` — `0 4px 8px 0 #15111A1A, 0 24px 48px -8px #15111A29` |
| Overflow | `clip` | `clip` |
| Bar padding | `14px 16px` | `14px 16px` |
| Bar gap | `10` | `10` |
| Items container | — | `border-top: 1px solid #e6e6e3`, `padding-bottom: 8`, column, no gap |
| Item padding | — | `11px 16px` |
| Item gap | — | `10` (active item only; plain items have no gap, no bullet) |
| Sticky | sticks under the global header; offset not encoded in Figma `(inferred)` | same |

Text styles: bar label `Body/S Strong` 14/20 / `text/primary`. Active item label `Body/M Strong` 16/24 `-0.048px` / **`action/pink-press` `#be185d`**. Inactive item labels `Body/M` 16/26 `-0.048px` / `text/primary`.

Icons: `Icon / list` (`87:142`) `16 × 16`, left of label. `Icon / chevron-down` (`53:23`) `16 × 16`, right — **rotation `0deg` collapsed, `180deg` expanded**. `Ellipse` bullet `6 × 6` on the active item only.

**Verbatim copy** — bar `Jump to section`; items `How prompting works`, `Types of prompts`, `JSON prompts`, `Common mistakes`, `My workflow`, `FAQ`.

---

## Article / FAQ Item

Nodes: Collapsed desktop `158:2636`, Collapsed mobile `158:2642`, Expanded desktop `158:2648`, Expanded mobile `158:2654`, component set `158:2660`.

**Purpose.** One accordion question. FAQ block at the end of an article, 4–8 items. Never for main content everyone needs.

**Anatomy** → `Question` row (question text + `Icon / plus` | `Icon / minus`) + `Answer` paragraph (expanded only, optional slot)

**Spec**

| Property | Desktop `158:2636` / `158:2648` | Mobile `158:2642` / `158:2654` |
|---|---|---|
| Width | `740` | `350` |
| Padding | `20px 0` | `16px 0` |
| Direction / gap | column, `10` | column, `10` |
| Border | `border-bottom: 1px solid border/hairline #e6e6e3` only | same |
| Radius / background | none / none — **not a card** | same |
| Question row | row, gap `16`, align center; text `flex: 1` | same |
| Question style | `Heading/XS` — Bricolage Grotesque SemiBold 17/22 `-0.085px` / `text/primary` | `Body/M Strong` — Inter Semi Bold 16/24 `-0.048px` / `text/primary` |
| Answer style | `Body/M` 16/26 `-0.048px` / `text/secondary` | identical |
| Measured heights | in-page items range `202`–`384` (`320:6597`) | not measured |

Icons: collapsed `Icon / plus` (`53:17`) `18 × 18`; expanded `Icon / minus` (`53:20`) `18 × 18`. **The glyph swaps — it is not a rotated plus.** Stroke `text/primary` `(inferred)`. Note: the desktop question switches font *family* (Bricolage) vs mobile (Inter) — not just size.

**Verbatim copy** — question `Are JSON prompts better than normal prompts in OurDream AI?`; answer `Not always. In our tests JSON gave more control with Vivid 2, but Dreamy produced better images from a normal paragraph.`

In-page FAQ items stack with **zero gap** — the per-item bottom border is the only separator (measured: `320:6598`…`320:6652` are contiguous).

---

## Article / Related Guides

Nodes: desktop `158:2661`, mobile `158:2686`, component set `158:2711`. Row component `Guide / Article Row` (`155:2377`; desktop `155:2359`, mobile `155:2371`).

**Purpose.** Up to **3** contextually related guides, then a link back to the brand hub. End of every OurDream guide article, before the footer. Each row = guide title + its ONE primary hub category + arrow. Categories are only `Prompts & Characters` and `Images, Video & Comics` — never per-topic tags (Prompts / Images / Generator). The category is quiet metadata, not a chip and not a filter; the row + arrow is the destination.

Selection rule (build later, design for it now): same brand → exclude current article → rank by shared topics → same primary category as an extra signal → hard max 3. Fewer than 3 is fine; rows are dynamic. Do NOT list every guide, repeat hub navigation, use cards or thumbnails, or grow past 3 rows.

**Anatomy**
1. Heading (`158:2662` / `158:2687`)
2. `Rows` (`158:2663` / `158:2688`) — 1–3 × `Guide / Article Row`, no gap
3. `All guides link` (`158:2682` / `158:2707`) — label + `Icon / arrow-right`

**Spec**

| Property | Desktop `158:2661` | Mobile `158:2686` |
|---|---|---|
| Width | `740` | `350` |
| Direction / gap | column, `16` | column, `16` |
| Padding | 0 | 0 |
| Heading style | `Heading/S` 21/26 `-0.21px` / `text/primary` | `Heading/XS` 17/22 `-0.085px` / `text/primary` |
| Rows container | `border-top: 1px solid #e6e6e3`, column, no gap, `overflow: clip` | same |
| Row | `height: 56` fixed, `min-height: 56`, padding `14px 0`, gap `16`, align center, `border-bottom: 1px solid #e6e6e3` | same, width `350` |
| Row text block | column, gap `2`, `flex: 1` | same |
| Row title | `Body/M Strong` 16/24 `-0.048px` / `text/primary` | same |
| Row meta row | row, gap `8`; topic-tag slots **OFF** | same |
| Row meta text | `Body/S` 14/22 `-0.028px` / `text/secondary` | same |
| Row arrow | `Icon / arrow-right` (`53:5`) `16 × 16` | same |
| Bottom link | row, gap `6`; `Body/S Strong` 14/20 / **`action/pink-press` `#be185d`** + `Icon / arrow-right` `14 × 14` | identical |
| Measured instance | `740 × 246` (`320:6726`) | not measured |

Row hover (specified in `155:2377` description, not drawn as a variant): 4% `action/pink` tint bleeding `12px` past the text, title **and** arrow in `action/pink`, arrow nudged `5px` right. No solid pink rectangle, no scaling. `120ms ease-out` on colour, `160ms` on arrow offset.

**Verbatim copy** — heading is always `Related OurDream guides`. Bottom link label `Explore all OurDream AI guides` (arrow is a separate 14px icon node — **no `→` glyph in the string**, unlike the TOC rail). Sample rows: `OurDream AI Prompt Guide` / `Prompts & Characters`; `OurDream AI Image Prompt Guide` / `Prompts & Characters`; `OurDream AI Comics` / `Images, Video & Comics`.

`Content / Topic Tag` (`591:2249`) exists — `surface/sunken` `#efefed`, `4px 10px`, radius `7`, Inter Medium 12/16 `-0.024px` / `text/secondary` — but all three tag slots are **off** on guide rows.

---

## Page shell

Measured from `318:4936` — `Article — OurDream AI Comics — Desktop`, `1440 × 63037`. All numbers below are **measured** unless marked `(inferred)`. The child-gap histogram over all 653 children of the `Main` frame is `{20px: 651}` — the reading column is one auto-layout stack with a **uniform 20px gap**, and extra separation is created by explicit `Section space` spacer frames.

### Frame tree

| Node | Name | x | y | w | h |
|---|---|---|---|---|---|
| `318:4937` | `Global Header / Desktop` | 0 | 0 | 1440 | **80** |
| `318:4960` | `Layout — article + TOC` | 0 | 80 | 1440 | 62245 |
| `318:4961` | `Main` | **190** | **56** | **740** | 62093 |
| `318:4962` | `Aside — sticky TOC` | **1010** | **56** | **240** | 507 |
| `320:6777` | `Global / Footer` | 0 | 62325 | 1440 | 712 |

### Column geometry (desktop, 1440)

```
|  190  |      740      |  80  |  240  |  190  |
  margin   reading col   gutter   rail   margin
```

- Reading column `740` at `x = 190`.
- Rail `240` at `x = 1010` → gutter = `1010 − (190 + 740)` = **80**.
- Rail right edge `1250` → right margin `190`, symmetric with left.
- Content band = `740 + 80 + 240` = **1060**, centred in 1440 → `(1440 − 1060) / 2 = 190`. Matches the 740 + 80 + 240 rule exactly.
- CSS equivalent `(inferred)`: `max-width: 1060px; margin-inline: auto; display: grid; grid-template-columns: 740px 240px; column-gap: 80px;`

### Mobile equivalent

- Reading column `350` in a `390` screen → `20px` side gutters (`(390 − 350) / 2 = 20`). Confirmed by every mobile component measuring `350`; the 390 frame itself was not measured in this pass `(inferred)`.
- Single column; the rail is replaced by `Article / Jump to Section` (`350` wide) sticking under the header.

### Vertical rhythm (all measured)

| Distance | Value |
|---|---|
| Global header height | `80` |
| Page top padding (header bottom → article header top) | `56` |
| Rail top padding (header bottom → TOC content top) | `56 + 8 = 64`; `144` from page top |
| Article header block height (in page) | `178` (`318:4963`) |
| Header block internal spacing | `20` between all four parts (breadcrumb / title / description / meta) |
| Header → first H2 | `20` (no spacer; the H2 is the very next sibling) |
| Base gap between every main-column sibling | `20` (uniform, 651/651) |
| H2 height | `40` (one line; one two-line H2 measured `80`) |
| H3 height | `30` |
| H4 height | `22` |
| H2 top margin (new major section) | `20 + Section space 28 + 20` = **68** |
| H2 bottom margin | `20` |
| H3 top margin | `20 + Section space 8 + 20` = **48** |
| H3 bottom margin | `20` |
| H4 top / bottom margin | `20` / `20` (no spacer) |
| Paragraph → paragraph | `20` |
| Paragraph line box | `31` per line (1 line 31, 2 lines 62, 3 lines 93, 4 lines 124) |
| Above a pattern block (Important / Prompt / Comparison / Cheat Sheet…) | `20` |
| Below a pattern block | `20`, or `20 + spacer + 20` when the next thing is a heading |
| Before FAQ | `Section space 28` → `68` to the `FAQ` H2; then `20` from H2 to first FAQ item |
| FAQ item → FAQ item | `0` (bottom border only) |
| Before Sources | `Section space 28` → **68** from FAQ end |
| Before Related guides | `Section space 28` → **68** from Sources end |
| Related guides → footer | Main ends `62149`, layout ends `62245` → `96` bottom padding, footer starts immediately at `62325` with **no** extra gap |

`Section space` spacer inventory across the article: `70 × 8px` (one before each of the 70 H3s) and `17 × 28px` (one before each of the 15 H2s + Sources + Related Guides). Effective section gaps are therefore **48px before an H3** and **68px before an H2-level section**.

### Canonical article ending (verified in `318:4961`)

```
… Article / Key Takeaway (320:6587)
  ↓ 20 + spacer 28 + 20
H2 "FAQ" (320:6596)
  ↓ 20
FAQ (320:6597) — 10 × Article / FAQ Item
  ↓ 20 + spacer 28 + 20
Article / Sources (361:7619)          ← optional
  ↓ 20 + spacer 28 + 20
Article / Related Guides (320:6726)   ← contains the "Explore all OurDream AI guides" link
  ↓ 96 bottom padding
Global / Footer (320:6777)
```

**Nothing commercial sits between Related Guides and the footer.** `Related Guides` is the last child of `Main`; no score, Visit or Read-review block exists at the bottom of the article. The end-of-article product CTA block is **DEPRECATED** — do not reintroduce it. The `Explore all OurDream AI guides →` link is *inside* the Related Guides component, not a separate sibling.

### Layering (from the design rules, not measured in this pass)

| Layer | z-index |
|---|---|
| Sticky global header | `50` |
| Decorative background layers | `0`, `pointer-events: none` |
| Content | `1` |

Page background `#f9f9f9`, cards `#ffffff`, `1px` hairline `#e6e6e3`. No third grey level. The page-background token name did not resolve on any node in this pass — only `surface/card` and `surface/sunken` did `(inferred that #f9f9f9 is surface/page)`.

---

## OPEN QUESTIONS

**Interaction states — none are drawn as Figma variants.**
1. `Article / TOC Item` has only Default and Active. No **hover**, **focus-visible** or **visited** state. Does hover promote the label to `text/primary`, tint the indicator, or both? Is there a `:focus-visible` ring, and what colour/offset?
2. `Article / FAQ Item` trigger has no hover / focus-visible / active state. The whole question row should be a `<button>`; needs a focus ring spec and a press state.
3. `Guide / Article Row` hover is described in prose only (4% pink tint, 12px bleed, 5px arrow nudge, 120/160ms) — no variant, no focus-visible spec, and "4% `action/pink`" needs a resolved value (`rgba(219,39,119,0.04)`? or over `#f9f9f9`?).
4. `Article / Jump to Section` has no hover / focus / pressed state on the bar or on the items, and no spec for the expand/collapse transition (duration, easing, whether height animates).
5. Breadcrumb crumbs have no hover/focus state and no colour for a hovered crumb.

**Scroll-spy — implied, undesigned.**
6. Only one Active TOC item is shown. The activation rule is unspecified: which section counts as "in view" (top-of-viewport threshold? IntersectionObserver rootMargin?), behaviour when two headings share the viewport, behaviour at the very top (is the first item active before any heading is passed?) and at the very bottom (does the last item pin active?).
7. Does the TOC rail auto-scroll its 420px internal scroller to keep the active item visible? The Comics article has **17** TOC items totalling `786px` of content in a `420px` scroller, so this matters — undesigned.
8. Does the mobile `Jump to section` bar update its label or active bullet as you scroll, and does tapping an item collapse the panel? Undesigned.
9. Anchor scroll offset: with an 80px sticky header, jump targets need `scroll-margin-top`. No value in Figma. Recommend `104px` `(inferred)`, to match the rail's sticky offset.

**Content edge cases.**
10. **Minimum sections for a TOC.** At what count does the rail (or the mobile bar) disappear — fewer than 3? fewer than 4? Not specified.
11. **No FAQ.** If an article has no FAQ, does the `FAQ` H2 + 68px spacer vanish entirely and Sources/Related Guides move up? Presumed yes, unconfirmed.
12. **No Sources.** Confirmed optional by the component doc but only the with-Sources layout is drawn. The 68px gap collapses to a single 68px between FAQ and Related Guides — presumed, unconfirmed.
13. **Related Guides with 1 or 2 rows.** The `Rows` container has `border-top` plus per-row `border-bottom`, so 1 row renders 2 hairlines. Is that intended, or does the last row drop its border? Undrawn.
14. **Zero related guides.** Does the whole module disappear, or does the `Explore all OurDream AI guides` link survive on its own? Undesigned.
15. TOC items wrap to 2 lines (`58px` measured). Is there a hard cap — truncate at 2 lines, or allow 3?

**Breakpoints & shell.**
16. **At what viewport does the TOC rail disappear?** Only `1440` desktop and `390` mobile frames exist. The `1060` content band plus any minimum margin means the rail cannot survive much below ~`1100`. No tablet frame, no declared breakpoint, and no spec for what the 391–1099 range looks like (does the reading column fluidly grow from 350 to 740? does `Jump to section` appear as soon as the rail goes?).
17. **Is the global site header height known?** Measured `80px` for `Global Header / Desktop` (`318:4937`) in this frame. **Mobile header height is unknown** — no mobile page frame was measured, so the mobile `Jump to section` sticky offset cannot be derived. Also unknown: whether the header shrinks or hides on scroll, which would break any fixed `top` on the rail.

**Token / consistency inconsistencies worth a designer decision.**
18. The two "Explore all OurDream AI guides" links differ: the **TOC rail** uses `Body/S` regular in `action/pink` `#db2777` with a literal `→` in the string; **Related Guides** uses `Body/S Strong` in `action/pink-press` `#be185d` with a separate 14px `Icon / arrow-right`. Same copy, three differences. Intentional?
19. Active emphasis differs between the two TOCs: the rail uses a pink **indicator** with a `text/primary` label; the mobile bar uses a pink **label** (`action/pink-press`) plus a bullet. Intentional?
20. `action/pink-press` is used for a resting link colour in two places. Is `pink-press` really the default link colour, or should these be `action/pink`?
21. `text/muted` `#8a8991` resolves on Header and Related Guides but is not emitted in any code output — confirm it is the chevron / arrow icon stroke.
22. The FAQ question changes font **family** between viewports (Bricolage `Heading/XS` desktop → Inter `Body/M Strong` mobile). Confirm this is deliberate and not a variant built from the wrong style.
