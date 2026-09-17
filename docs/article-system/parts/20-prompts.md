# 20 · Prompt components

Source: Figma file `iaUwrRvpkEq7RrBpPLxA6j`, page **02 · Article Components**.
Four separate components. Shared frame rules: page background `#f9f9f9`, card `#ffffff`, 1px hairline `#e6e6e3` **drawn inside** the width (Figma inside stroke — a 740px node is 740px border-box, content box 706px). Desktop reading column 740px, mobile 350px.

Global note: all `Copy` affordances in this family are icon+label, no fill, no border. No component set contains a `Copied`, hover, focus or pressed variant.

---

## Article / Prompt

Component set `154:2345` — variants `Kind` × `Viewport`.

| Variant | Node | Measured |
|---|---|---|
| Kind=Text, Desktop | `154:2295` | 740 × 78 |
| Kind=Text, Mobile | `154:2307` | 350 × 104 |
| Kind=Code, Desktop | `154:2319` | 740 × 173 |
| Kind=Code, Mobile | `154:2332` | 350 × 219 |

### Purpose
Lightweight, copyable prompt utility (formerly `Guide / Example Prompt`). The reader is meant to copy an exact prompt string. `Kind=Text` = natural-language / tag prompts. `Kind=Code` = JSON or structured prompts; monospace is allowed **only** here.

### When to use / not
- Use: one exact prompt the reader should copy.
- Not: a formula or ordering of parts → `Article / Prompt Structure`.
- Not: weak vs better prompt → `Article / Prompt Comparison`.
- Not: a prompt shown with the image it produced → `Article / Prompt + Result`.
- Not: monospace for ordinary prose prompts — `Kind=Text` is Inter, not mono.

### Anatomy
```
Prompt (card, flex column, gap 4 Text / 10 Code)
└─ Header (row, space-between, full width, height 24)
   ├─ Label row (row, gap 6)
   │  ├─ Icon / wand  14×14  (53:99)
   │  └─ Label text — "Example prompt"
   └─ Copy button (row, gap 4)     ← always present, top-right
      ├─ Icon / copy  13×13  (87:128)
      └─ "Copy"
└─ Body — ONE of:
   ├─ Prompt text (Kind=Text)  — single text node, wraps
   └─ Code (Kind=Code) — column wrapper → mono text node, 5 hard lines
```
No optional parts. There is no footer, no collapse row, no "Show full prompt" layer in any variant.

### Desktop
| Property | Value |
|---|---|
| Width | 740 (content box 706) |
| Padding | top 10, right 16, bottom 14, left 16 |
| Gap (root) | 4 (Kind=Text) / 10 (Kind=Code) |
| Header | full width, `space-between`, `align-items:center`, effective height 24 |
| Label row gap | 6 |
| Copy button | gap 4, padding 6px horizontal / 4px vertical, radius 6, no fill, no border |
| Border | 1px solid `#e6e6e3` (`border/hairline`) |
| Radius | 10 |
| Background | `#ffffff` (`surface/card`) |
| Height math | Text 10+24+4+26+14 = 78 · Code 10+24+10+(5×23)+14 = 173 |

### Mobile
Identical box model; only width changes.
| Property | Value |
|---|---|
| Width | 350 (content box 316) |
| Padding / gap / radius / border | same as desktop |
| Text body | wraps to 2 lines (52) → 104 total |
| Code body | wraps to 7 lines (161) → 219 total; wrapping, **no horizontal scroll and no overflow rule shown** |

### Type
| Slot | Figma style | Family / size / weight / LH / tracking | Colour |
|---|---|---|---|
| Label ("Example prompt") | `Label/Sans S` | Inter Medium 12 / 16 / 0 | `text/secondary` #55545b |
| Copy label ("Copy") | `Label/Sans S` | Inter Medium 12 / 16 / 0 | `text/secondary` #55545b |
| Prompt text (Kind=Text) | `Body/M` | Inter Regular 16 / 26 / −0.3% (−0.048px) | `text/primary` #141317 |
| Code (Kind=Code) | `Article/Code` | Geist Mono Regular 14 / 23 / 0 | `text/primary` #141317 |

### Copy affordance
- Position: top-right of the header row, on the same baseline as the label; pushed right by `space-between`.
- Label text: exactly `Copy`. Icon `Icon / copy` 13×13, stroke `#55545B`, 1.5px, Lucide, **left** of the label, gap 4.
- Box: 6/4 padding, radius 6, transparent — total hit box ≈ 24px tall.
- Copied state: **not designed** (no variant, no property).

### Collapse behaviour (Kind=Code)
- The Figma component description states: long code prompts are shown collapsed at **~520px** with a **fade + "Show full prompt"**.
- The drawn `Kind=Code` variants are **173px (desktop) / 219px (mobile)** — far under 520 — and contain **no fade layer, no gradient, no expand row, no collapsed/expanded variant**. Collapse exists only as prose, not as design.
- Implementation contract to assume until the designer supplies it: `max-height: 520px` on the code region, bottom fade from `surface/card` transparent→opaque, text button labelled `Show full prompt` (same `Label/Sans S` / `text/secondary` as the header), toggling to full height. Every one of those specifics is unconfirmed.

### Tokens
`surface/card` #ffffff · `border/hairline` #e6e6e3 · `text/primary` #141317 · `text/secondary` #55545b · `action/pink` #db2777 (wand icon stroke) · type: `Label/Sans S`, `Body/M`, `Article/Code`.

### Variants & states
| Axis | Values |
|---|---|
| Kind | Text, Code |
| Viewport | Desktop, Mobile |
| Text props | `label` (default "Example prompt"), `prompt` |
| States | none — no hover, focus-visible, active, copied, collapsed/expanded |

### Open questions
1. No `Copied` state anywhere: what replaces the label, for how long, and does the icon swap to `Icon / check`?
2. No hover / focus-visible / active styling for the Copy button. It is the only interactive element in the family and has a 24px hit box — under the 44px touch minimum on mobile.
3. Collapse for `Kind=Code` is undesigned (see above): 520px unconfirmed, fade colour/height unspecified, expand label never drawn, and there is no "Show less" counterpart.
4. Long unbroken code lines: mobile wraps in the mock, but no `overflow-x` / `white-space` decision is recorded.
5. Rule check — the brief expects a "subtle neutral or light pink-neutral surface". The drawn card is `surface/card` **#ffffff**, i.e. the same fill as every other article card; only the padding (10/16/14/16) and radius (10) make it read as lighter. Distinction from a full card rests on padding + radius alone, not surface.

---

## Article / Prompt Comparison

Component set `308:4250` — variant `Viewport`.

| Variant | Node | Measured |
|---|---|---|
| Desktop | `308:4204` | 740 × 158 |
| Mobile | `308:4227` | 350 × 286 |

### Purpose
Two prompts side by side to explain **why** one is better: a weaker "before" (muted, ×, not copyable) → a better version (pink outline, ✓, copyable), plus a one-line conclusion.

### When to use / not
- Use: bad vs better, natural sentence vs tags, Dreamy vs Vivid wording, before/after edits.
- Not: two unrelated prompts.
- Not: comparing *results/images* → `Article / AIGE Test`.
- Not: a single prompt → `Article / Prompt`.

### Anatomy
```
Prompt Comparison (transparent wrapper, column, gap 10, no border, no fill)
├─ Pair (desktop: row, gap 10 · mobile: column, gap 6)
│  ├─ Side A  "negative"
│  │  ├─ Head (row, gap 6)
│  │  │  ├─ Icon / x 13×13 (53:14)
│  │  │  └─ labelA
│  │  └─ promptA text
│  ├─ Arrow — Icon / arrow-right 16×16 (53:5); mobile rotated 90°
│  └─ Side B  "positive"
│     ├─ Head (row, space-between)
│     │  ├─ Label group (gap 6): Icon / check 13×13 (53:11) + labelB
│     │  └─ Copy button (gap 4): Icon / copy 13 + "Copy"
│     └─ promptB text
└─ Conclusion (optional — `showConclusion`, default true)
```
Optional: `Conclusion` only. Side A has **no** Copy action.

### Desktop
| Property | Value |
|---|---|
| Root | 740 wide, transparent, column, gap 10 |
| Pair | row, gap 10, `align-items:center`; sides `flex:1`, `align-self:stretch` (equal heights) |
| Side width | (740 − 16 arrow − 20 gaps) / 2 = **352** each (content box 318) |
| Side A | bg `surface/page` #f9f9f9 · 1px `border/hairline` #e6e6e3 · radius 10 · padding 12/16/14/16 · gap 6 |
| Side B | bg `surface/card` #ffffff · **1px `action/pink` #db2777** · radius 10 · padding 12/16/14/16 · gap 6 |
| Arrow | 16×16, stroke `#8A8991`, horizontal, vertically centred |
| Conclusion | full width, sits 10 below the pair |
| Height math | side 12+16+(3×26)+14 = 120… pair 126 (tallest side) + 10 + 22 = 158 |

### Mobile
| Property | Value |
|---|---|
| Root | 350 wide, column, gap 10 |
| Pair | column, gap **6**, `align-items:center`; sides full width |
| Side A / Side B | same fills, borders, radius 10, padding 12/16/14/16, gap 6 |
| Arrow | same 16×16 icon, **rotated 90°** (points down), between the two sides |
| Order | Side A → arrow → Side B → conclusion |

### Type
| Slot | Figma style | Spec | Colour |
|---|---|---|---|
| labelA (negative) | `Label/Sans S` | Inter Medium 12 / 16 / 0 | `text/muted` **#8a8991** |
| labelB (positive) | `Label/Sans S` | Inter Medium 12 / 16 / 0 | `action/pink-press` **#be185d** |
| promptA | `Body/M` | Inter Regular 16 / 26 / −0.3% | `text/secondary` **#55545b** (dimmed) |
| promptB | `Body/M` | Inter Regular 16 / 26 / −0.3% | `text/primary` **#141317** |
| Copy label | `Label/Sans S` | Inter Medium 12 / 16 / 0 | `text/secondary` #55545b |
| Conclusion | `Body/S` | Inter Regular 14 / 22 / −0.2% (−0.028px) | `text/secondary` #55545b |

### Label styling (both sides)
| | Negative (Side A) | Positive (Side B) |
|---|---|---|
| Default text | `Before` | `Better for Dreamy` |
| Case | **Sentence case as authored** — not uppercased | Sentence case |
| Tracking | 0 (`Label/Sans S`) | 0 |
| Colour | #8a8991 `text/muted` | #be185d `action/pink-press` |
| Background / chip | **none** — plain text on the card | **none** |
| Icon | `Icon / x`, stroke #8A8991 | `Icon / check`, stroke #BE185D |
| Row | gap 6, no `space-between` (nothing on the right) | `space-between` — label group left, Copy right |

Brief vs design: the brief asks for SHORT labels (`TOO VAGUE / BE SPECIFIC`, `BEFORE / BETTER`, `DON'T / DO`, `NATURAL SENTENCE / DREAMY TAGS`). The design ships sentence-case labels with **no uppercase, no letter-spacing and no background**, and the default `labelB` is the 17-character "Better for Dreamy". Longer wording belongs in the conclusion line.

### Copy affordance
- Present on **Side B only**, top-right of its head row.
- `Icon / copy` 13×13 stroke #55545B + label `Copy`, gap 4.
- **No padding, no radius, no background** here — unlike `Article / Prompt`, whose Copy button has 6/4 padding and radius 6. Hit box ≈ 16px tall.
- Collision headroom on desktop: label group ≈ 124px + Copy ≈ 48px inside a 318px content box. Fits at the default label, tight for anything longer.
- No copied state.

### Tokens
`surface/page` #f9f9f9 · `surface/card` #ffffff · `border/hairline` #e6e6e3 · `action/pink` #db2777 · `action/pink-press` #be185d · `text/primary` #141317 · `text/secondary` #55545b · `text/muted` #8a8991 · type: `Label/Sans S`, `Body/M`, `Body/S`.

### Variants & states
| Axis | Values |
|---|---|
| Viewport | Desktop, Mobile |
| Boolean | `showConclusion` (default **true**) |
| Text props | `labelA`, `labelB`, `promptA`, `promptB`, `conclusion` |
| States | none |

### Open questions
1. Copy button geometry differs from `Article / Prompt` (no padding/radius here). Intentional, or should both use the 6/4 + radius-6 box?
2. Labels are sentence case with no tracking, contradicting the uppercase micro-label convention in the brief. Which wins — and is there a max character count before the label collides with Copy on a 318px side?
3. No hover / focus-visible / active / copied state on Side B's Copy.
4. Side A is `surface/page` #f9f9f9 on a #f9f9f9 page background: the negative side is distinguished **only** by its hairline border. Verify it still reads as a panel.
5. Mobile arrow is a rotated `arrow-right`; no dedicated `arrow-down` icon — confirm rotation is acceptable to the icon rules ("swap via instance").
6. Sides stretch to equal height on desktop; nothing states which side wins when one prompt is far longer, or whether Side A should clamp.

---

## Article / Prompt Structure

Component set `308:4339` — variant `Viewport`.

| Variant | Node | Measured |
|---|---|---|
| Desktop | `308:4251` | 740 × 86 |
| Mobile | `308:4295` | 350 × 162 |

### Purpose
A **visual formula**: chips joined by arrows expressing the *order* of prompt parts (subject → pose → clothing → environment → lighting → camera angle). A pattern to understand, not a string to copy.

### When to use / not
- Use: the article explains how to structure or order a prompt.
- Not: an actual example prompt → `Article / Prompt`.
- Not: comparing two orderings → `Article / Prompt Comparison`.
- Not copyable — see below.

### Anatomy
```
Prompt Structure (card, column, gap 10)
├─ Head (row, gap 6)            ← no Copy action on this row
│  ├─ Icon / list 13×13 (87:142)
│  └─ label — "Prompt structure"
└─ Items (flex-wrap row, gap 8 row / 6 column, content-center, full width)
   ├─ Item 1 — Chip only (no leading arrow)
   ├─ Item 2 — Arrow 13×13 + Chip
   ├─ Item 3 — Arrow + Chip
   ├─ Item 4 — Arrow + Chip
   ├─ Item 5 — Arrow + Chip   (optional, showItem5 default TRUE)
   ├─ Item 6 — Arrow + Chip   (optional, showItem6 default TRUE)
   ├─ Item 7 — Arrow + Chip   (optional, showItem7 default FALSE)
   └─ Item 8 — Arrow + Chip   (optional, showItem8 default FALSE)
```
**Confirmed: no Copy button, no copy icon, and no interactive layer anywhere in either variant.** The head row is a plain `gap:6` row, not `space-between`, so there is structurally no right-hand slot for an action.

### Desktop
| Property | Value |
|---|---|
| Width | 740 (content box 706) |
| Padding | top 14, right 16, bottom 16, left 16 — **more than `Article / Prompt`** |
| Root gap | 10 |
| Radius | **12** (vs 10 on Prompt / Comparison) |
| Border | 1px solid `#e6e6e3` |
| Background | `#ffffff` (`surface/card`) |
| Items container | `flex-wrap`, row-gap 8, column-gap 6, `align-content:center`, full width |
| Chip | bg `surface/card` #ffffff · 1px `border/hairline` #e6e6e3 · radius **999** (pill) · padding 10 horizontal / 5 vertical · height 30 |
| Separator | `Icon / arrow-right` re-used as layer "Arrow", 13×13, stroke `#8A8991`, 1.5px, round caps — sits **inside** each Item, before its chip, gap 6 |
| Height math | 14 + 16 + 10 + 30 + 16 = 86 (chips fit one row) |

### Mobile
| Property | Value |
|---|---|
| Width | 350 (content box 316) |
| Padding / gap / radius / border / chip / arrow | identical to desktop |
| Wrapping | the 6 default items wrap to **3 rows** → items block 3×30 + 2×8 = 106 |
| Height math | 14 + 16 + 10 + 106 + 16 = 162 |

Wrap behaviour: because each arrow is bound to the chip that follows it, a wrapped row **begins with an arrow**. There is no orphan-arrow suppression.

### Type
| Slot | Figma style | Spec | Colour |
|---|---|---|---|
| label ("Prompt structure") | `Label/Sans S` | Inter Medium 12 / 16 / 0 | `text/secondary` #55545b |
| Chip text | `Body/S Strong` | Inter **Semi Bold** 14 / 20 / −0.2% (−0.028px) | `text/primary` #141317 |

No monospace anywhere — correct, since nothing here is copyable code.

### Tokens
`surface/card` #ffffff · `border/hairline` #e6e6e3 · `text/primary` #141317 · `text/secondary` #55545b · `text/muted` #8a8991 (arrow stroke) · `action/pink` #db2777 (`Icon / list` stroke, measured #DB2777) · type: `Label/Sans S`, `Body/S Strong`.

### Variants & states
| Axis | Values |
|---|---|
| Viewport | Desktop, Mobile |
| Booleans | `showItem5` true, `showItem6` true, `showItem7` false, `showItem8` false |
| Text props | `label`, `item1`–`item8` |
| States | none; component is non-interactive by design |

### Open questions
1. Chips are `surface/card` #ffffff on a `surface/card` #ffffff card — invisible except for their hairline border. On a white card a white pill is a weak formula mark; should chips use `surface/page`/`surface/sunken`?
2. Minimum item count is not stated: items 1–4 are mandatory (no `showItem1–4`), so a 2- or 3-part formula cannot be expressed.
3. Wrapped rows start with an arrow (no leading-arrow suppression). Confirm that is intended on mobile, where 3 rows each begin mid-formula.
4. Chip text is Semi Bold 14 while the label is Medium 12 — no emphasis variant for a highlighted step (e.g. the part the article is about).
5. Radius 12 + padding 14/16/16/16 makes this the **heaviest** of the four prompt contexts, which is defensible (it is a diagram, not a utility), but it is also the one the brief calls "not a big grey card" territory — worth a designer sign-off.

---

## Article / Prompt + Result

Component set `309:4268` — variants `Layout` × `Viewport`.

| Variant | Node | Measured | Image slot |
|---|---|---|---|
| Layout=Side by side, Desktop | `309:4222` | 740 × 533 | 300 × 533 (≈ 9:16 portrait) |
| Layout=Stacked, Desktop | `309:4238` | **480** × 754 | 480 × 600 (4:5 portrait) |
| Layout=Stacked, Mobile | `309:4253` | 350 × 618 | 350 × 438 (4:5 portrait) |

*(Layout=Side by side / Mobile does not exist — mobile is always stacked.)*

### Purpose
One composed unit = the exact prompt **plus** the image it produced. The image is the evidence; the prompt stays copyable. This is the "evidence" prompt context.

### When to use / not
- Use: example galleries ("Pool / Church / City example"), a prompt shown with its output.
- Side by side: desktop with a portrait or square result.
- Stacked: landscape results, galleries, and **all** mobile.
- Not: prompt without a result → `Article / Prompt`.
- Not: two prompts compared → `Article / Prompt Comparison`.
- Do **not** split into a prompt card plus a separate grey image box, and do not add a caption that repeats the title.

### Anatomy
```
Prompt + Result (transparent wrapper, no border, no fill)
Side by side (row, gap 28, items-start)
├─ Result image  300 × H, radius 12, 1px hairline
└─ Content (column, flex:1, gap 12, padding-top 4)
   ├─ Title (optional, showTitle default TRUE)
   ├─ Article / Prompt instance  ← full width of the column, label "Exact prompt"
   └─ Meta (optional, showMeta default FALSE)

Stacked (column, gap 12, items-start)
├─ Title (optional, showTitle default TRUE)
├─ Result image  full width × H, radius 12, 1px hairline
├─ Article / Prompt instance  ← full width
└─ Meta (optional, showMeta default FALSE)
```
Optional parts: `Title`, `Meta`. The prompt is a nested `Article / Prompt` instance (`Kind=Text`), so it keeps its own Copy button.

### Desktop
| Property | Side by side (`309:4222`) | Stacked (`309:4238`) |
|---|---|---|
| Root width | 740 | **480** (gallery width, not the 740 column) |
| Root | row, gap **28**, `align-items:flex-start`, transparent | column, gap **12**, transparent |
| Order | image → content | title → image → prompt → meta |
| Image slot | fixed **300** wide × 533 tall, `flex:none` | full width 480 × 600 tall |
| Aspect ratio | 300:533 ≈ 9:16 | 4:5 |
| Image fill | `surface/sunken` **#efefed** placeholder · 1px `border/hairline` #e6e6e3 · radius **12** | same |
| Content column | `flex:1`, min-width 0, gap 12, **padding-top 4** (optical align to image top) | n/a |
| Prompt instance | width = 740 − 300 − 28 = **412**, padding 10/16/14/16, radius 10 | width 480, same padding/radius |
| Height math | 533 (image drives height) | 26 + 12 + 600 + 12 + 104 = 754 |

Per the component description the `Result image` layer is an image **fill** — the #efefed grey is placeholder only, and the instance is resized to the image's real ratio. No grey canvas ships.

### Mobile
| Property | Stacked (`309:4253`) |
|---|---|
| Root width | 350, column, gap 12, transparent |
| Order | title → image → prompt → meta |
| Image slot | 350 × 438, ratio 4:5, radius 12, 1px `border/hairline`, fill `surface/sunken` placeholder |
| Prompt instance | width 350, padding 10/16/14/16, radius 10, body wraps to 3 lines (130 tall) |
| Height math | 26 + 12 + 438 + 12 + 130 = 618 |

### Type
| Slot | Figma style | Spec | Colour |
|---|---|---|---|
| Title ("Pool Example") | `Heading/S` | **Bricolage Grotesque** SemiBold 21 / 26 / −1% (−0.21px); variable axes `opsz 14, wdth 100` | `text/primary` #141317 |
| Prompt label ("Exact prompt") | `Label/Sans S` | Inter Medium 12 / 16 / 0 | `text/secondary` #55545b |
| Prompt text | `Body/M` | Inter Regular 16 / 26 / −0.3% | `text/primary` #141317 |
| Copy label | `Label/Sans S` | Inter Medium 12 / 16 / 0 | `text/secondary` #55545b |
| Meta / caption | `Label/Sans S` | Inter Medium 12 / 16 / 0 | `text/muted` **#8a8991** |

Caption (`Meta`) default text: "Generated with the prompt above". Full width, 12/16, muted, **hidden by default**.

### How prompt and result are tied together
- One component, one transparent wrapper — no card around the pair, so the tie is proximity and the shared 12px (stacked) / 28px (side by side) rhythm, not a container.
- The prompt's label is overridden to **"Exact prompt"** (not "Example prompt"), naming the image's provenance.
- The result image and the prompt card share the same hairline `#e6e6e3`; the image radius is 12, the prompt card radius 10.
- Side by side: the content column gets `padding-top: 4` so the title's cap height lines up with the image's top edge.
- No connector line, arrow, bracket or shared background.

### Copy affordance
Inherited from the nested `Article / Prompt` instance, unchanged: top-right of the prompt card, `Icon / copy` 13×13 #55545B + `Copy`, gap 4, padding 6/4, radius 6, `Label/Sans S` #55545b. No copied state.

### Tokens
`surface/sunken` #efefed · `surface/card` #ffffff · `border/hairline` #e6e6e3 · `text/primary` #141317 · `text/secondary` #55545b · `text/muted` #8a8991 (via Meta) · `action/pink` #db2777 (wand icon in the nested prompt) · type: `Heading/S`, `Label/Sans S`, `Body/M`.

### Variants & states
| Axis | Values |
|---|---|
| Layout | Side by side (desktop only), Stacked |
| Viewport | Desktop, Mobile |
| Booleans | `showTitle` (default **true**), `showMeta` (default **false**) |
| Text props | `title`, `meta`; nested prompt's `label`, `prompt` |
| States | none — no image hover/zoom, no lightbox, no loading or error state for the media slot |

### Open questions
1. **Stacked is drawn with portrait 4:5 images in both variants**, while the description says stacked is for *landscape* results. No landscape example exists, so the landscape image height and whether the prompt card stays full width are unverified.
2. Stacked desktop root is **480px**, not the 740px reading column. Is 480 a fixed gallery width, a column in a multi-up grid, or just the instance size of this example? Nothing states how a full-width 740 stacked instance should look.
3. Side by side fixes the image at 300px wide; for a square result that yields a 300×300 image beside a 412px column — no guidance on whether the prompt card should then shrink or the gap change.
4. Image slot has no `object-fit`, alt-text, caption-vs-title, loading or aspect-ratio-clamp rule; the grey `surface/sunken` fill is explicitly a placeholder, so the shipped element needs its own empty/broken-image treatment.
5. `showMeta` is false by default and the caption sits **below** the prompt card, far from the image it describes. Confirm the caption is meta ("Generated with the prompt above") rather than an image caption.
6. Media slot and prompt card use different radii (12 vs 10) inside one unit — intentional hierarchy or drift?
7. No hover / focus-visible / active / copied state on the nested Copy button.

---

## The four prompt contexts — how they differ

| | **Prompt** (copy) | **Prompt Comparison** (before/after) | **Prompt Structure** (formula) | **Prompt + Result** (evidence) |
|---|---|---|---|---|
| Node (desktop) | `154:2295` / `154:2319` | `308:4204` | `308:4251` | `309:4222` / `309:4238` |
| Surface | `surface/card` #ffffff | A `surface/page` #f9f9f9 · B `surface/card` #ffffff | `surface/card` #ffffff, chips #ffffff pills | **none** (transparent wrapper); image slot `surface/sunken` #efefed placeholder |
| Border | 1px `border/hairline` #e6e6e3 | A 1px #e6e6e3 · **B 1px `action/pink` #db2777** | 1px #e6e6e3 (card **and** each chip) | none on wrapper; 1px #e6e6e3 on image + nested prompt card |
| Radius | 10 | 10 (both sides) | **12** card, **999** chips | **12** image, 10 nested prompt card |
| Padding | 10 / 16 / 14 / 16 | 12 / 16 / 14 / 16 per side | **14 / 16 / 16 / 16**; chips 5 / 10 | 0 (wrapper); nested prompt 10 / 16 / 14 / 16 |
| Internal gap | 4 (Text) / 10 (Code) | 10 root, 10 pair (desktop) / 6 (mobile), 6 per side | 10 root, 8×6 items | **28** (side by side) / 12 (stacked) |
| Mono? | **only** `Kind=Code` (`Article/Code`, Geist Mono 14/23) | no — `Body/M` both sides | no — `Body/S Strong` chips | no — `Body/M` |
| Copyable? | **yes** — Copy, header right, padded 6/4 + radius 6 | **Side B only** — Copy, head right, unpadded | **no Copy action at all** | **yes**, inherited from the nested prompt instance |
| Marker icon | `Icon / wand` 14, #DB2777 | `Icon / x` 13 #8A8991 → `Icon / check` 13 #BE185D | `Icon / list` 13 #DB2777 | none of its own (wand, via nested prompt) |
| Separator | — | `arrow-right` 16 #8A8991 (rotated 90° on mobile) | `arrow-right` 13 #8A8991 before each chip | — |
| Width (desktop / mobile) | 740 / 350 | 740 / 350 (sides 352 each on desktop) | 740 / 350 | 740 side-by-side · **480** stacked · 350 mobile |
| Heaviest signal | compact top row + tight padding | pink outline on the winner, dimmed loser | pill chips + arrows (diagram) | media next to text, no card |

Differentiation verdict: **Structure** (radius 12, pills, arrows, no Copy) and **Prompt + Result** (no card, media slot) are unmistakable. **Comparison** is distinct through the pink border, ×/✓ icons and dimmed loser. **Prompt** vs the nested prompt inside **Prompt + Result** are the same component and therefore identical by design — the difference there is the label ("Example prompt" vs "Exact prompt") and the presence of the image, not the box. The weakest differentiator overall is surface: three of the four use #ffffff, so padding, radius and border colour carry the whole distinction.
