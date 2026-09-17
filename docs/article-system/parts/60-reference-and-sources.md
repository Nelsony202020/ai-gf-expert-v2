# 60 · Reference, links and sources

Source: Figma file `iaUwrRvpkEq7RrBpPLxA6j`, page **02 · Article Components**.
Target: Astro + plain CSS. Reading column **740px desktop / 350px mobile**. Page background `#f9f9f9`, 1px hairline `#e6e6e3`, no third grey level, monospace only in real code / copyable prompt text.

Letter-spacing in Figma is stored as a **percentage**; both the % and the computed px are given (px is what CSS needs).

---

## Article / Reference Cheat Sheet

Nodes: desktop `309:4842`, mobile `309:4866`, component set `309:4890`.

### Purpose
Scannable reference block for terms and keywords the reader looks up (camera and pose terms, hair lengths, style names) — "find the term I need in 3 seconds". Typography and dividers only: **no bullets, no cards, no background**. Do not use for steps, pros/cons or explanatory sentences.

### Anatomy
```
Reference Cheat Sheet (root, column)
├─ Head (row)  309:4843 / 309:4867
│  ├─ Icon / library  14×14  309:4844 / 309:4868  (instance of 120:568)
│  └─ Label text "Cheat sheet"  309:4846 / 309:4870
└─ Groups  309:4847 (desktop, wrap) / 309:4871 (mobile, column)
   └─ Article / Cheat Sheet Group ×2–6   (groups 3–6 optional)
```

### Desktop
| Property | Value |
|---|---|
| Root width | 740px, flex column, gap 16px, align start |
| Root padding / bg / border / radius | none / none / none / none |
| Head | flex row, gap 6px, align center, `overflow: clip` |
| Icon | 14 × 14px, stroke only (`text/secondary` tone) |
| Groups container | `flex-wrap`, row-gap **20px**, column-gap **32px**, align start, width 100% |
| Columns | **2** — child width fixed 354px (354 + 32 + 354 = 740) |
| Group divider | 1px solid `border/hairline` #e6e6e3, **top edge of each group** |
| Group padding | `padding-top: 14px` only |

### Mobile
| Property | Value |
|---|---|
| Root width | 350px, flex column, gap 16px |
| Groups container | flex **column**, gap 16px, width 100% |
| Columns | **1** — each group width 100% |
| Divider / padding | identical: 1px top hairline, `padding-top: 14px` |

### Type
| Element | Family / weight | Size / LH | Letter-spacing | Colour | Figma style |
|---|---|---|---|---|---|
| Head label `309:4846` | Inter Medium 500 | 12 / 16 | 0 | `text/secondary` #55545b | **Label/Sans S** |
| Group title `309:4640` | Inter Semi Bold 600 | 14 / 20 | −0.2% → −0.028px | `text/primary` #141317 | **Body/S Strong** |
| Term lines `309:4641` | Inter Regular 400 | 16 / 28 | −0.3% → −0.048px | `text/secondary` #55545b | *unnamed (no Figma style bound)* |

Terms are one `<p>` per line inside the terms block — no list markers, no `::before`.

### Copy (verbatim)
- Head label: `Cheat sheet`
- Group 1 `Front view` — `front view` / `front shot` / `from the front`
- Group 2 `View from behind` — `rear view` / `from behind`
- Group 3 `Full body` — `full shot` / `far shot`
- Group 4 `Other camera terms` — `close-up` / `medium shot`
- Groups 5 / 6 placeholders: `Group 5` / `Group 6`, term `term`

### Tokens
`border/hairline` #e6e6e3 · `text/primary` #141317 · `text/secondary` #55545b · type: `Label/Sans S`, `Body/S Strong`.

### Variants & states
- `viewport` = Desktop | Mobile.
- `showGroup3` **true**, `showGroup4` **true**, `showGroup5` false, `showGroup6` false → 2–6 groups.
- No hover, focus, active or link states — this block contains no interactive elements.

### Open questions
- Odd number of entries: `flex-wrap` leaves the last group at 354px in column 1 (not stretched to 740). Confirm intended, vs. full-width last row.
- More than 6 groups is not represented in the variant set.
- No tablet frame: the 2 → 1 column breakpoint is undefined. Fixed 354px children will wrap on their own below ~740px; pick and record an explicit breakpoint.
- Group title 14px is *smaller* than the 16px terms it labels. Confirm this inversion is deliberate.
- Terms style is not bound to a named Figma text style — needs a token/style name before build.

---

## Article / Cheat Sheet Group

Node: `309:4639` (children: title `309:4640`, terms `309:4641`).

### Purpose
The nested atom inside Reference Cheat Sheet: one short group title plus its terms, one per line. No bullets, no card — a hairline rule on top separates it from the previous group.

### Anatomy
```
Cheat Sheet Group (column, border-top)
├─ Title (Body/S Strong)
└─ Terms block  (one <p> per term line)
```

### Desktop
| Property | Value |
|---|---|
| Width | 354px (fixed; 2-up inside 740px) |
| Layout | flex column, gap 8px, align start |
| Padding | top 14px; right/bottom/left 0 |
| Border | `border-top: 1px solid #e6e6e3` (`border/hairline`) |
| Background / radius / shadow | none / none / none |
| Word break | `word-break: break-word` |

### Mobile
Width 100% (350px column). Everything else identical: gap 8px, `padding-top: 14px`, 1px top hairline.

### Type
| Element | Family / weight | Size / LH | Letter-spacing | Colour | Figma style |
|---|---|---|---|---|---|
| Title | Inter Semi Bold 600 | 14 / 20 | −0.2% → −0.028px | #141317 `text/primary` | Body/S Strong |
| Terms | Inter Regular 400 | 16 / 28 | −0.3% → −0.048px | #55545b `text/secondary` | *unnamed* |

### Tokens
`text/primary`, `text/secondary`, `border/hairline`, `Body/S Strong`.

### Variants & states
Props `title`, `terms` (newline-separated). No states.

### Open questions
- Terms are a single newline-separated text node in Figma. Decide the semantic markup (`<dl>` title/definition vs. `<p>` stack) — the design implies no list semantics at all.
- Behaviour when a term wraps at 354px is not shown (indent on wrap? none?).

---

## Article / External Example Link

Nodes: desktop `348:4279`, mobile `348:4287`.

### Purpose
Link out to an external example without ever showing a naked URL. Optional category label, title, optional one-line description, an explicit "Open … ↗" action, optional thumbnail. Never scrape or hotlink an external page's image — the thumbnail is a locally supplied asset or an empty placeholder.

### Anatomy
```
External Example Link (card)
├─ Thumbnail  56×40  348:4273 / 348:4281        [optional — default OFF]
└─ Text  348:4274 / 348:4282
│  ├─ Category  348:4275 / 348:4283             [optional — default ON]
│  ├─ Title     348:4276 / 348:4284
│  └─ Description 348:4277 / 348:4285           [optional — default OFF]
└─ Action "Open comic ↗"  348:4278 / 348:4286
```
Desktop order: thumbnail · text (flex-1) · action, on one row. Mobile: thumbnail, text, action stacked.

### Desktop
| Property | Value |
|---|---|
| Card width | 360px (2-up inside 740px) |
| Layout | flex row, gap 12px, `align-items: center`, `overflow: clip` |
| Padding | 14px top/bottom, 16px left/right |
| Background | `surface/page` **#f9f9f9** |
| Border | 1px solid `border/hairline` #e6e6e3 |
| Radius | 12px |
| Shadow | none |
| Text block | `flex: 1 0 0`, `min-width: 0`, column, gap 2px |
| Action | `flex-shrink: 0`, `white-space: nowrap` |
| Thumbnail | 56 × 40px, radius 8px, bg `surface/sunken` #efefed, 1px hairline border, `flex-shrink: 0` |
| Grid (2 columns) | column gap **20px inferred** (740 − 2×360); the parent grid is not one of the documented nodes |

### Mobile
| Property | Value |
|---|---|
| Card width | 350px |
| Layout | flex **column**, gap 12px, align start |
| Padding / bg / border / radius | identical: 14/16, #f9f9f9, 1px #e6e6e3, 12px |
| Text block | width 100%, column, gap 2px |
| Action | below the text block, nowrap |
| Columns | 1 (stacked) |

### Type
| Element | Family / weight | Size / LH | Letter-spacing | Colour | Figma style |
|---|---|---|---|---|---|
| Category | Inter Medium 500 | 12 / 16 | 0 | `text/muted` #8a8991 | **Label/Sans S** |
| Title | Inter Semi Bold 600 | 16 / 24 | −0.3% → −0.048px | `text/primary` #141317 | **Body/M Strong** |
| Description | Inter Regular 400 | 14 / 22 | −0.2% → −0.028px | `text/secondary` #55545b | **Body/S** |
| Action | Inter Regular 400 | 14 / 22 | −0.2% → −0.028px | `action/pink` #db2777 | **Body/S** |

### Copy (verbatim)
- Category: `ANIME` (all caps, entered as caps — no CSS `text-transform` in the design)
- Title: `Example 1`
- Description: `Short note about this example.`
- Action: `Open comic ↗` (pattern: `Open <noun> ↗`; `↗` is a literal character, not an icon)

### Tokens
`surface/page` #f9f9f9 · `surface/sunken` #efefed · `border/hairline` #e6e6e3 · `text/primary` #141317 · `text/secondary` #55545b · `text/muted` #8a8991 · `action/pink` #db2777 · type `Label/Sans S`, `Body/M Strong`, `Body/S`.

### Variants & states
- `view` = Desktop | Mobile.
- `showCategory` **true**, `showDescription` **false**, `showThumbnail` **false**.
- No hover, focus-visible, active or visited state in the design.

### Open questions
- **No hover / focus-visible / active state** for the whole card or for the "Open … ↗" action. Whole card clickable or action only? Needs a keyboard-visible focus ring — no focus token exists in this family.
- Card fill is `surface/page` #f9f9f9 — the **same value as the page background**, not the #ffffff card colour in the rules. Intentional (hairline-only definition), or should it be `#ffffff`?
- Thumbnail placeholder uses `surface/sunken` #efefed — a **third grey level**, which the rules forbid. Confirm or replace.
- Thumbnail is an empty 56×40 box in the design: no image, no aspect-ratio rule, no alt-text guidance, no behaviour when the supplied asset is a different aspect ratio.
- Desktop column gap (20px) and the 2 → 1 collapse breakpoint are inferred, not measured.
- With description ON at 360px the card grows; no max-lines / truncation rule is given for title or description.
- No rule for `rel`/`target` (expected `target="_blank" rel="noopener"`), and no visual affordance distinguishing external from internal links other than `↗`.

---

## Article / Source Row

Nodes: desktop `358:4288`, mobile `358:4297`.

### Purpose
One numbered entry in Sources. The descriptive source title is the link (`Title ↗`); author/publisher and source type sit underneath, then the bare domain. Never print a raw URL.

### Anatomy
```
Source Row
├─ Number  "01"  358:4281 / 358:4290
└─ Text  358:4282 / 358:4291
   ├─ Title "Source title ↗"       358:4283 / 358:4292
   ├─ Meta  "Author · Source type" 358:4284 / 358:4293   [optional — default ON]
   ├─ Domain "domain.com"          358:4285 / 358:4294   [optional — default ON]
   └─ "Back to citation ↑"         358:4286 / 358:4295   [optional — default OFF]
```

### Desktop
| Property | Value |
|---|---|
| Width | 740px |
| Layout | flex **row**, gap 20px, `align-items: flex-start`, `overflow: clip` |
| Padding | 18px top and bottom; 0 left/right |
| Divider | `border-bottom: 1px solid #e6e6e3` (`border/hairline`) — on every row |
| Background / radius | none / none (not a card) |
| Number column | fixed width **28px**, `flex-shrink: 0` |
| Text column | `flex: 1 0 0`, `min-width: 0`, column, gap 4px |

### Mobile
| Property | Value |
|---|---|
| Width | 350px |
| Layout | flex **column**, gap 6px, align start |
| Number | own line above the text block, `white-space: nowrap`, no fixed width |
| Text block | width 100%, column, gap 4px |
| Padding / divider | identical: 18px top/bottom, 1px bottom hairline |

### Type
| Element | Family / weight | Size / LH | Letter-spacing | Colour | Figma style |
|---|---|---|---|---|---|
| Number | Inter Semi Bold 600 | 16 / 24 | −0.3% → −0.048px | `action/pink` #db2777 | **Body/M Strong** |
| Title (link) | Inter Semi Bold 600 | 16 / 24 | −0.3% → −0.048px | `text/primary` #141317 | **Body/M Strong** |
| Meta | Inter Regular 400 | 14 / 22 | −0.2% → −0.028px | `text/secondary` #55545b | **Body/S** |
| Domain | Inter Medium 500 | 12 / 16 | 0 | `text/muted` #8a8991 | **Label/Sans S** |
| Back to citation | Inter Regular 400 | 14 / 22 | −0.2% → −0.028px | `action/pink` #db2777 | **Body/S** |

The linked title is `text/primary`, **not** pink, and carries no underline in the design — only the trailing `↗` marks it as a link.

### Copy (verbatim)
- Number: `01` (zero-padded two digits)
- Title: `Source title ↗`
- Meta: `Author · Source type` (middle dot `·` with spaces as the separator)
- Domain: `domain.com` (bare domain, no scheme, no path, no `www.`)
- Back link: `Back to citation ↑`

### Tokens
`action/pink` #db2777 · `text/primary` · `text/secondary` · `text/muted` · `border/hairline` · type `Body/M Strong`, `Body/S`, `Label/Sans S`.

### Variants & states
- `view` = Desktop | Mobile.
- `showMeta` **true**, `showDomain` **true**, `showBackLink` **false**.
- No hover / focus-visible / active on the title link or the back link; no "target highlight" state for the row the citation jumps to.

### Open questions
- **No author / no date:** meta is one flat string. With no author, does it render `Source type` alone, or is the separator kept? There is **no date field at all** in the component, so "no date" is not representable — if publication dates are needed the component must change.
- No visited state, no underline; with the title in `text/primary` the only link signal is `↗`. Confirm accessibility is acceptable.
- Every row has a bottom hairline, so the **last row in Sources also ends with a divider**. Confirm, or drop `:last-child`.
- Numbering above 9: `01` format implies `10`, `11` — but what about ≥100 and does the 28px desktop column still fit three digits?
- No wrap rule for long titles or long meta strings.
- `Back to citation ↑` exists as a real (default-off) layer, but the design does not say which occurrence it targets — per the rules it must return to the **first** occurrence only.

---

## Article / Sources

Nodes: desktop `358:4352`, mobile `358:4406`.

### Purpose
Editorial source list for the article — **not navigation**. Sits directly after the FAQ. Order: article content → FAQ → **Sources** → Related guides → "Explore all OurDream AI guides →" → footer.

### Anatomy
```
Sources (root, column, gap 0)
├─ Head  358:4300 / 358:4354
│  ├─ H2 "Sources"                358:4301 / 358:4355
│  └─ Intro paragraph             358:4302 / 358:4356
└─ Rows  358:4303 / 358:4357  (column, gap 0)
   ├─ Source Row 01  (always)
   └─ Source Row 02–06            [optional — all default OFF]
      desktop 358:4312 · 4320 · 4328 · 4336 · 4344
      mobile  358:4366 · 4374 · 4382 · 4390 · 4398
```

### Desktop
| Property | Value |
|---|---|
| Width | 740px, flex column, **gap 0**, align start, `overflow: clip` |
| Root padding / bg / border / radius | none |
| Head | flex column, gap 8px, `padding-bottom: 10px`, width 100% |
| Rows container | flex column, **gap 0**, width 100% — rows are separated only by each row's own bottom hairline |
| Row rhythm | 18px + 18px padding between adjacent titles, 1px #e6e6e3 divider |

### Mobile
| Property | Value |
|---|---|
| Width | 350px, flex column, gap 0 |
| Head | column, gap 8px, `padding-bottom: 10px` |
| Rows | column, gap 0, width 100%; rows use the mobile Source Row (stacked number) |

### Type
| Element | Family / weight | Size / LH | Letter-spacing | Colour | Figma style |
|---|---|---|---|---|---|
| H2 desktop `358:4301` | Bricolage Grotesque Bold 700 | 32 / 40 | −1.5% → −0.48px | #141317 | **Article/H2 Desktop** |
| H2 mobile `358:4355` | Bricolage Grotesque Bold 700 | 26 / 32 | −1% → −0.26px | #141317 | **Article/H2 Mobile** |
| Intro desktop `358:4302` | Inter Regular 400 | 18 / 31 | −0.4% → −0.072px | #55545b | **Article/Body Desktop** |
| Intro mobile `358:4356` | Inter Regular 400 | 17 / 28 | −0.3% → −0.051px | #55545b | **Article/Body Mobile** |

Both H2s carry `font-variation-settings: "opsz" 14, "wdth" 100`.

### Copy (verbatim)
- Heading: `Sources`
- Intro: `References used for research, testing and factual information in this guide.`

### Tokens
`text/primary` · `text/secondary` · `text/muted` · `action/pink` · `border/hairline` · type `Article/H2 Desktop`, `Article/H2 Mobile`, `Article/Body Desktop`, `Article/Body Mobile`, `Body/M Strong`, `Body/S`, `Label/Sans S`.

### Variants & states
- `view` = Desktop | Mobile.
- `showSource2`…`showSource6` all **false** by default → 1–6 rows in the variant set.
- No state for "row targeted by a citation jump" (no highlight, flash or `:target` style).

### Open questions
- Maximum rows in the design is 6; behaviour beyond that is undefined.
- No `:target` / scroll-margin treatment is designed, yet citation clicks jump here — a landing highlight and `scroll-margin-top` must be specified.
- Section spacing above/below Sources (gap from FAQ, gap to Related guides) is not part of this node.
- Heading level is visually H2; confirm it is an `<h2>` and whether the list should be an `<ol>` (numbers are text, not list markers, in the design).
- Last row's trailing hairline (see Source Row) — keep or drop.

---

## Article / Citation Marker

Nodes: State=Default `359:4297`, State=Hover `359:4303`.

### Purpose
The inline superscript reference in running text. A small pink superscript number sitting just above the baseline — **no circle, pill, badge or brackets**. Clicking jumps to the matching row in Sources.

### Anatomy
```
Citation Marker (column, align start)
├─ Hit area (20×20)   359:4295 (default) / 359:4299 (hover)
│  └─ Number "¹"      359:4296 (default) / 359:4300 (hover)
└─ Tooltip            359:4301                     [Hover state only]
   └─ Label "1 · Source title"  359:4302
```

### Desktop
| Property | Value |
|---|---|
| Hit area | **20 × 20px**, flex, `align-items: flex-start`, `justify-content: center`, `overflow: clip` |
| Marker glyph | Inter **Medium 500**, **15px**, line-height 16px, letter-spacing 0, colour `action/pink` **#db2777**, `white-space: nowrap` |
| Baseline offset | Not a numeric offset in the design: the glyph is the **superscript character `¹` (U+00B9)** top-aligned in the 20px box. In CSS reproduce with `vertical-align: super` (or `top: -0.35em` on a relative inline), never with `<sup>` default sizing that shrinks the glyph further |
| Marker background / border / radius | **none** — no circle, pill, badge or bracket |
| Root | flex column, align start; gap **0** (Default) / **6px** (Hover, between hit area and tooltip) |
| Tooltip geometry | hug width, padding **12px left/right, 8px top/bottom**, radius **8px**, flex row, `align-items: flex-start`, `overflow: clip` |
| Tooltip fill | `surface/ink` **#141317** |
| Tooltip shadow / border / arrow | **none defined in the design** |
| Tooltip placement | **below** the marker, left-aligned to it, 6px gap |
| Tooltip text | Inter Regular 400, 14 / 22, −0.2% → −0.028px, `text/on-ink` **#f7f7f6**, `white-space: nowrap` — **Body/S** |

### Mobile
No mobile variant exists. The marker itself is viewport-independent (same 20×20 hit area and 15px glyph). The tooltip is a **quiet desktop-only** affordance and has no touch counterpart in the design.

### Type
| Element | Family / weight | Size / LH | Letter-spacing | Colour | Figma style |
|---|---|---|---|---|---|
| Marker number | Inter Medium 500 | 15 / 16 | 0 | `action/pink` #db2777 | *unnamed (no style bound)* |
| Tooltip label | Inter Regular 400 | 14 / 22 | −0.2% → −0.028px | `text/on-ink` #f7f7f6 | **Body/S** |

### Copy (verbatim)
- Marker: `¹` (superscript character)
- Tooltip: `1 · Source title` — pattern `<n> · <Source title>`, plain number, middle dot separator

### Tokens
`action/pink` #db2777 · `surface/ink` #141317 · `text/on-ink` #f7f7f6 · type `Body/S`.

### Variants & states
- `state` = **Default** | **Hover**. Hover adds the tooltip; the marker itself does not change colour, weight or decoration between states.
- No focus-visible, active, or "current/visited" state.

### Open questions
- **Weight and size conflict:** the component marker is Inter **Medium 15px**, but the in-paragraph example (`360:4294`) renders the marker as Inter **Semi Bold 18px** (inherited body size). The rules say semi-bold. Decide one: fixed 15px Medium, or `em`-relative Semi Bold that scales with the paragraph.
- **No numeric baseline offset** is specified anywhere — must be chosen (e.g. `vertical-align: super` vs. `position: relative; top: -0.35em`) and must not alter the paragraph's 31px line-height.
- Hit area is **20×20**, below the 24×24 minimum target size; and it is `overflow: clip`, so a larger tap target has to be added via a pseudo-element without disturbing inline layout. Confirm 20px is accepted.
- **Touch devices:** no touch behaviour for the tooltip — no tap-to-preview, no dismissal, no long-press. Recommend suppressing it under `@media (hover: none)` and relying on the jump to Sources; needs sign-off.
- **No focus-visible state**, although the marker is a link. A focus treatment and a tooltip-on-focus rule are both missing.
- Tooltip has **no shadow and no arrow** in the design despite the rules mentioning a shadow; confirm flat, or define the shadow token.
- Tooltip is below the marker: no collision/flip rule near the viewport edge or at the top of the reading column, and no delay/duration for the reveal.
- Marker number format across surfaces is inconsistent by design: `¹` in prose, `1` in the tooltip, `01` in Sources. Confirm, and define markers for numbers above 9 (`¹⁰` superscript characters vs. styled `<sup>`).

---

## Example — citation inside a paragraph

Node: `360:4294`. Documentation specimen, not a shipping component.

### Purpose
Shows how the marker reads inside real body copy: appended to the end of the sentence, immediately after the full stop, with no preceding space.

### Anatomy
```
Demo frame (column, gap 10)
├─ Label "INLINE CITATION — HOW IT READS"  360:4295
└─ Paragraph  360:4296
   ├─ span: body sentence
   └─ span: "¹"  (pink, semi-bold, inherits 18/31)
```

### Desktop
| Property | Value |
|---|---|
| Frame | width 100% of the reading column, flex column, gap 10px |
| Frame padding | **28px** on all sides |
| Frame background | `surface/page` #f9f9f9 |
| Frame border / radius | 1px solid `border/hairline` #e6e6e3 / **14px** |
| Marker inside text | inline `<span>`, no hit-area box, no wrapper padding |

### Mobile
No mobile variant of the specimen. In shipping mobile copy the paragraph style becomes `Article/Body Mobile` (17 / 28); the marker rule follows whatever the Citation Marker decision is.

### Type
| Element | Family / weight | Size / LH | Letter-spacing | Colour | Figma style |
|---|---|---|---|---|---|
| Label `360:4295` | Inter Medium 500 | 12 / 16 | 0 | `text/muted` #8a8991 | **Label/Sans S** |
| Body sentence | Inter Regular 400 | 18 / 31 | −0.4% → −0.072px | `text/primary` #141317 | **Article/Body Desktop** |
| Marker span | Inter **Semi Bold 600** | 18 / 31 | inherits | **#db2777 (raw hex, not token-bound)** | none |

### Copy (verbatim)
- Label: `INLINE CITATION — HOW IT READS`
- Paragraph: `Comic Studio reads panels by number rather than by position, so a page prompt should open with Panel 01, Panel 02 and Panel 03 instead of describing where each panel sits.` followed immediately by `¹`

### Tokens
`surface/page` · `border/hairline` · `text/primary` · `text/muted` · `action/pink` (marker uses the raw hex `#db2777`, not the variable) · type `Article/Body Desktop`, `Label/Sans S`.

### Variants & states
None. Static specimen.

### Open questions
- The marker span is **not token-bound** (raw `#db2777`) and is **Semi Bold 18px**, contradicting the Citation Marker component (Medium 15px). Resolve before build.
- The specimen has no 20×20 hit area at all — the shipping implementation must add the tap target without changing the 31px line-height or causing the line to jump.
- Marker placement after the full stop is shown once; no rule for a marker mid-sentence, after a comma, or two markers adjacent.

---

## Citation and source rules

Implementation requirements. These are binding, not guidance.

**Numbering**
1. One document / page / study = **exactly one source number**, reused for every mention in the article. Never allocate a second number to the same source.
2. Numbers are assigned by **first appearance** in the article body, ascending, with no gaps.
3. Render as `¹` (superscript) in prose, `1` in the tooltip, `01` (zero-padded two digits) in the Sources row. Keep these three renderings of the same number in sync from one data field.

**Marker**
4. Small pink superscript number, `action/pink` #db2777, semi-bold, sitting just above the baseline. **No circle, no pill, no badge, no brackets, no parentheses, no underline.**
5. Tap/click target at least **20×20px** (design value), delivered without changing line-height — use a pseudo-element, not padding on the inline span.
6. Each marker is a link to the matching Sources row (`href="#source-<n>"`). Every marker for the same source points at the same row.
7. Desktop hover may show the quiet tooltip: `#141317` fill, 8px radius, 12/8 padding, `#f7f7f6` Body/S text, content `<n> · <Source title>`, 6px below the marker, no arrow, no shadow. It is optional and must never be the only way to identify a source.
8. On touch (`hover: none`) the tooltip is suppressed; the jump to Sources is the whole interaction.

**Placement**
9. Sources sits **directly after the FAQ**: article content → FAQ → **Sources** → Related guides → "Explore all OurDream AI guides →" → footer.
10. Sources is **editorial content, not navigation**: it is inside the article body, uses the article H2 style, and is not a nav landmark or a sidebar.
11. Sources rows are jump targets — give each row a stable `id` and a `scroll-margin-top` so it is not hidden under any sticky header.

**Links**
12. **Never print a raw URL** — not in the body, not in Sources, not in the external-link card.
13. The **descriptive source title is the link**: `Title ↗`, in `text/primary` #141317, Body/M Strong, with the `↗` character as the external signal.
14. Under the title: author / publisher and source type as `Author · Source type` (Body/S, `text/secondary`), then the **bare domain** (`domain.com` — no scheme, no `www.`, no path) in Label/Sans S, `text/muted`.
15. External links open in a new tab with `rel="noopener noreferrer"`, and the action copy always names the destination: `Open <noun> ↗`.
16. `Back to citation ↑` is **optional**, defaults off, and returns to the **first occurrence only** — never to a list of occurrences.
17. Never scrape, hotlink or generate an external page's image. A thumbnail is either a locally supplied asset or the empty 56×40 placeholder.

**Surfaces**
18. Reading column 740px desktop / 350px mobile. Page background #f9f9f9, hairline #e6e6e3 at 1px. Reference Cheat Sheet uses typography and hairlines only — no card, no fill, no bullets.
19. Monospace is reserved for real code and copyable prompt text; nothing in this family uses it.
