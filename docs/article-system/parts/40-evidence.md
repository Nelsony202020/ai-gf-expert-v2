# 40 · Evidence family

Figma file `iaUwrRvpkEq7RrBpPLxA6j`, page `02 · Article Components`. Target: Astro + plain CSS.

Shared frame: desktop reading column **740px**, mobile **350px**. Page `#f9f9f9`, cards `#ffffff`, hairline border `1px #e6e6e3`. No third grey level is allowed in the article ladder — see Open questions, the media atoms break this.

Letter-spacing in Figma text styles is stored as a **percentage**; the px value below is the computed value at that size (e.g. Heading/M `-1.5%` → `-0.42px` at 28px).

| Figma style | Family | Size | Weight | Line-height | Letter-spacing | CSS |
|---|---|---|---|---|---|---|
| Heading/M | Bricolage Grotesque | 28 | 700 Bold | 32 | -1.5% / -0.42px | `font-variation-settings:"opsz" 14,"wdth" 100` |
| Heading/S | Bricolage Grotesque | 21 | 600 SemiBold | 26 | -1% / -0.21px | same |
| Heading/XS | Bricolage Grotesque | 17 | 600 SemiBold | 22 | -0.5% / -0.085px | same |
| Body/L | Inter | 19 | 400 | 30 | -0.5% / -0.095px | |
| Body/M | Inter | 16 | 400 | 26 | -0.3% / -0.048px | |
| Body/M Strong | Inter | 16 | 600 | 24 | -0.3% / -0.048px | |
| Body/S | Inter | 14 | 400 | 22 | -0.2% / -0.028px | |
| Body/S Strong | Inter | 14 | 600 | 20 | -0.2% / -0.028px | |
| Label/Sans S | Inter | 12 | 500 Medium | 16 | 0 | |

| Token | Value |
|---|---|
| `surface/page` | `#f9f9f9` |
| `surface/card` | `#ffffff` |
| `surface/sunken` | `#efefed` |
| `border/hairline` | `#e6e6e3` |
| `text/primary` | `#141317` |
| `text/secondary` | `#55545b` |
| `text/muted` | `#8a8991` |
| `text/on-ink` | `#f7f7f6` |
| `action/pink` | `#db2777` |
| `action/pink-soft` | `#fce7f3` |
| `action/pink-press` | `#be185d` |
| `Elevation/Card` | `0 1px 2px rgba(59,42,30,.06), 0 8px 24px -4px rgba(59,42,30,.06)` |

---

## Article / AIGE Test

Component set `153:2611`. Variants `Viewport` × `Results` (One–Four).
Desktop: One `153:2115`, Two `153:2161`, Three `153:2218`, Four `153:2286`.
Mobile: One `153:2365`, Two `153:2410`, Three `153:2466`, Four `153:2533`.

### Purpose
- Strongest block in the intensity ladder and the signature pattern: we ran a real test and the media is the evidence.
- Use when there are real generation screenshots, 1–4 of them, plus a one-line setup and a result sentence.
- Versus **Comparison A/B**: that one compares two options in words only, no media, no test setup, and is a much quieter card (no shadow).
- Versus **Image + Caption**: that is a single supporting picture with no claim attached; it never carries an eyebrow, setup block or result line.
- Never: test numbers, IDs, fake dates, a black title bar, monospace anywhere, or the block without real screenshots.

### Anatomy
```
Article / AIGE Test                     card, white, hairline, Elevation/Card
├── Header
│   ├── AIGE test label                 pink-soft pill + Icon/badge-check 14 + "AIGE test"
│   ├── Title                           Heading/M desktop · Heading/S mobile
│   └── Summary                         one line, secondary
├── Test setup                    [opt] surface/page panel, radius 16
│   ├── "Test setup"                    Body/S Strong, primary
│   └── Setup grid
│       └── Column ×2 desktop / ×1 mobile
│           └── Row — <key>             key (secondary, flex 1) + value (Body/S Strong, primary)
├── Results                             flex-wrap, holds 1–4 Article / Result Tile
├── Result
│   ├── "Result"                        pink-press eyebrow, Body/S Strong
│   └── Result text                     Body/L desktop · Body/M mobile, primary
└── What I learned                [opt] top hairline + Brand/Avatar Herman 28 + text
```
Optional slots: `showTestSetup`, `showWhatILearned`. Text props: `title`, `summary`, `result`, `learned`.

### Desktop
| Part | Spec |
|---|---|
| Card | `width 740` · `padding 32` all sides · `gap 24` column · `radius 24` · `border 1px #e6e6e3` · `background #ffffff` · `box-shadow Elevation/Card` |
| Content width | 676 (740 − 2×32) — every inner row is `width: 100%` of this |
| Header | `gap 10` column, full width |
| Eyebrow pill | `padding 4px 10px 4px 8px` · `gap 6` · `radius 999` · bg `action/pink-soft` · icon 14×14 |
| Test setup | `padding 16px 20px` (16 top/bottom, 20 left/right) · `gap 8` · `radius 16` · bg `surface/page` · no border |
| Setup grid | 2 equal columns, `column-gap 32`, each column `flex: 1 0 0; min-width: 0` |
| Setup row | `padding 8px 0` · `gap 12` · key `flex: 1 0 0`, value `flex-shrink: 0`, right-aligned by layout · no dividers |
| Results | `display:flex; flex-wrap:wrap` · `gap 20` (One: row-gap 20 only, single item) |
| Result block | `gap 6` column |
| What I learned | `border-top 1px #e6e6e3` · `padding-top 20` · `gap 12` row · avatar 28×28, radius 999, `border 1.5px #141317` · text column `gap 2`, `flex: 1 0 0` |

### Mobile
| Part | Spec |
|---|---|
| Card | `width 350` · `padding 20` all sides · `gap 20` column · `radius 20` · `border 1px #e6e6e3` · bg `#ffffff` · `box-shadow Elevation/Card` |
| Content width | 310 |
| Header | `gap 10`, eyebrow pill identical to desktop (`4px 10px 4px 8px`, icon 14) |
| Test setup | `padding 16` all sides · `gap 8` · `radius 16` · bg `surface/page` |
| Setup grid | **single column**, all key/value rows stacked; row `padding 8px 0`, `gap 12` |
| Results | `flex-wrap` · `row-gap 16` · `column-gap 12` (One: row-gap 16 only) |
| Result block | `gap 6` |
| What I learned | `border-top 1px` · `padding-top 16` · `gap 12` · avatar 28×28 |

### Layout matrix
Results row (desktop content 676, mobile content 310):

| Results | Desktop tile size | Tile px | Grid | Mobile tile size | Tile px | Grid |
|---|---|---|---|---|---|---|
| One | `Size=Full` | 676 × 450 image (3:2) | 1 column, full bleed of content box | `Size=Mobile full` | 310 × 413 image (3:4) | 1 column |
| Two | `Size=Large` | 328 × 437 (3:4) | 2 × 1, gap 20 → `(676 − 20)/2` | `Size=Mobile half` | 149 × 199 (3:4) | 2 × 1, col-gap 12 → `(310 − 12)/2` |
| Three | `Size=Medium` | 212 × 283 (3:4) | 3 × 1, gap 20 → `(676 − 40)/3` | `Size=Mobile half` | 149 × 199 | wraps 2 + 1 (orphan left-aligned) |
| Four | `Size=Large` | 328 × 437 (3:4) | wraps **2 × 2**, gap 20 both axes | `Size=Mobile half` | 149 × 199 | wraps 2 × 2, row 16 / col 12 |

- Four does **not** use a 4-up row on desktop; it reuses the 328 Large tile and wraps.
- Implement as `flex-wrap` with explicit tile widths (as designed), or as `grid-template-columns: repeat(N, 1fr)` with the same gaps — the computed widths match.

### Test-setup key/value block
- Desktop: two columns, first column takes rows 1–2, second column rows 3–4 (column-major fill: Generator / Aspect ratio | Images / Character).
- Mobile: one column, rows in the same reading order (Generator, Aspect ratio, Images, Character).
- Key: Body/S (`14/22`, `text/secondary`), `flex: 1 0 0`. Value: Body/S Strong (`14/20`, `text/primary`), `white-space: nowrap`.
- Row separation is `padding: 8px 0` only — no rules, no zebra, no borders.
- Panel label "Test setup" is Body/S Strong `text/primary` — not pink, not uppercase.

### Pink accent inventory (exact)
| Where | Size | Colour |
|---|---|---|
| Eyebrow pill background | auto-width, `padding 4px 10px 4px 8px`, `radius 999` | `action/pink-soft #fce7f3` |
| Eyebrow icon `Icon / badge-check` | 14 × 14 (24-grid Lucide, 1.5px stroke, round caps) | stroke `action/pink-press #be185d` |
| Eyebrow text "AIGE test" | Body/S Strong 14/20 | `action/pink-press #be185d` |
| "Result" eyebrow | Body/S Strong 14/20 | `action/pink-press #be185d` |
| "Better result" badge (inside the winning tile) | see Result Tile | fill `action/pink #db2777`, text `text/on-ink` |

That is the whole accent budget: two small pink-press words, one pink-soft pill, one solid pink badge. Everything else is neutral.

### Heading / eyebrow type
| Element | Desktop | Mobile |
|---|---|---|
| Eyebrow | Body/S Strong, `#be185d` | identical |
| Title | Heading/M · Bricolage Grotesque **Bold 700** 28/32, -0.42px, `#141317` | Heading/S · Bricolage Grotesque **SemiBold 600** 21/26, -0.21px |
| Summary | Body/M 16/26, `#55545b` | Body/S 14/22, `#55545b` |
| "Result" label | Body/S Strong, `#be185d` | identical |
| Result text | Body/L 19/30, `#141317` | Body/M 16/26, `#141317` |
| "What I learned" label | Body/S Strong, `#141317` | identical |
| Learned text | Body/M 16/26, `#55545b` | identical |

### What I Learned slot
- Rendered **inside** the card as the last child, never as a separate card.
- Separated only by a `border-top: 1px #e6e6e3` on the slot itself plus `padding-top` 20 (desktop) / 16 (mobile). No background change.
- Row: avatar `Brand / Avatar Herman` (`57:41`) at 28×28, `radius 999`, `border 1.5px #141317`, then a text column (`gap 2`, `flex: 1 0 0`) with the label and the body.
- The label is the literal string "What I learned" in `text/primary`; the body is `text/secondary`.

### Variants & states
- `Viewport`: Desktop | Mobile. `Results`: One | Two | Three | Four.
- Booleans: `showTestSetup`, `showWhatILearned`.
- No interactive states are designed on the card or on any tile.

### Open questions
- Each tile paints a `surface/sunken #efefed` rectangle under the media and crops the image to a fixed box. That is a grey container and a third grey level, both of which the article rules forbid. Decide: drop the sunken fill and let the image set its own height, or accept the fill only as a load-time placeholder.
- The One-result case changes aspect ratio across viewports: desktop `Size=Full` is 3:2 landscape, mobile `Size=Mobile full` is 3:4 portrait. The same source image cannot satisfy both without cropping.
- Desktop One sets a row-gap only (20) with no column-gap; Two–Four set 20 on both axes. Mobile One is row-gap 16, Two–Four are 16/12. Pick one gap pair per viewport.
- Three on mobile leaves an orphan tile in row 2, left-aligned. Centre it, stretch it full width, or forbid Three on mobile.
- Test setup is authored with exactly four key/value pairs. Undefined: 1, 3, 5+ pairs, values that wrap to two lines, and whether the desktop fill stays column-major or becomes row-major.
- No hover, focus-visible or active state anywhere; no lightbox or zoom, although full-bleed evidence images strongly imply one. If tiles become buttons they need a focus ring that reads on both `#ffffff` and `#efefed`.
- Title weight changes with viewport (Bold 28 → SemiBold 21). Confirm this is intentional and not just a style pick.
- Missing image behaviour undefined: the sunken rectangle would show as a bare grey box with a letter badge on it.

---

## Article / Result Tile

Component set `152:2165`. Variants by `Size`: Large `152:2110`, Medium `152:2121`, Full `152:2132`, Mobile half `152:2143`, Mobile full `152:2154`.

### Purpose
- The media atom of the evidence family: one real generation screenshot with a letter, an optional winner badge and a two-line caption.
- Only ever appears inside **AIGE Test** (and, per the Figma note, a Comparison A/B that carries images — the shipped Comparison A/B does not).
- Letter is A/B/C/D in result order. `Better result` goes on exactly one tile.
- Never stock imagery, decorative art, or a tile without a real test behind it.

### Anatomy
```
Article / Result Tile
├── Evidence image                      hairline border, radius, overflow hidden
│   ├── (sunken fill + image, object-cover)
│   ├── Letter                          white circle, top-left
│   └── Better result               [opt] solid pink pill, top-right
└── Caption
    ├── Name                            strong
    └── Note                       [opt] secondary
```
Props: `letter`, `name`, `note`, `showNote`, `betterResult`, `size`.

### Dimensions per size
| Size | Node | Tile width | Image box | Ratio | Media radius | Frame height (incl. caption) | Used by |
|---|---|---|---|---|---|---|---|
| Full | `152:2132` | 676 | 676 × 450 | 3:2 | 14 | 508 | Desktop · One |
| Large | `152:2110` | 328 | 328 × 437 | 3:4 | 14 | 495 | Desktop · Two, Four |
| Medium | `152:2121` | 212 | 212 × 283 | 3:4 | 14 | 337 | Desktop · Three |
| Mobile full | `152:2154` | 310 | 310 × 413 | 3:4 | 14 | 471 | Mobile · One |
| Mobile half | `152:2143` | 149 | 149 × 199 | 3:4 | 12 | 275 | Mobile · Two, Three, Four |

Every size: tile is a column with `gap 10` between media and caption. Media `border 1px #e6e6e3`, `overflow: hidden`, backdrop `surface/sunken #efefed`, image `object-fit: cover`. The tile itself has no background, no padding and no outer radius.

### Letter badge
| Size group | Diameter | Inset | Background | Text |
|---|---|---|---|---|
| Full, Large, Medium, Mobile full | 28 | `top 11 / left 11` | `surface/card #ffffff` | Body/S Strong 14/20, `#141317` |
| Mobile half | 24 | `top 7 / left 7` | `surface/card #ffffff` | Body/S Strong 14/20, `#141317` |

`radius 999`, centred, no border, no shadow.

### Better result badge
| Size group | Inset | Icon | Label | Padding | Fill | Text |
|---|---|---|---|---|---|---|
| Full, Large, Medium, Mobile full | `top 11 / right 11` | `Icon / check` 14 × 14 | "Better result" | `4px 10px 4px 8px`, `gap 4` | `action/pink #db2777` | Body/S Strong 14/20, `text/on-ink #f7f7f6` |
| Mobile half | `top 7 / right 7` | `Icon / check` 12 × 12 | **"Better"** | `4px 10px 4px 8px`, `gap 4` | `action/pink` | same |

`radius 999`. Icon is Lucide on a 24 grid, 1.5px stroke, round caps/joins — colour the stroke only.

### Caption
| Size | Name style | Note style |
|---|---|---|
| Full, Large, Mobile full | Body/M Strong 16/24, `#141317` | Body/S 14/22, `#55545b` |
| Medium, Mobile half | Body/S Strong 14/20, `#141317` | Body/S 14/22, `#55545b` |

Caption column `gap 2`, full tile width, left-aligned. `showNote` hides the second line only.

### Variants & states
- `Size` (5 values), `betterResult` boolean, `showNote` boolean, text props for `letter`, `name`, `note`.
- No hover, focus or pressed state. The letter badge is decorative, not a control.

### Open questions
- The fixed image box plus `object-fit: cover` means every portrait is cropped to 3:4 and every screenshot to 3:2. This directly contradicts the real-aspect-ratio rule that governs Image + Caption. Either the tile should accept the image's own ratio, or the rule needs an explicit tile exemption.
- Caption scale switches at an undocumented threshold (16px at ≥310 wide, 14px at ≤212). State it as a rule or unify.
- On Mobile half (149px) the letter badge (24 + 7) and the "Better" pill can nearly meet. Define the minimum gap or let the pill drop to a second position.
- No focus-visible ring, and no zoom affordance, although these are the most zoom-worthy images on the page.
- Missing or still-loading image: undefined. Currently the `#efefed` fill shows through with the badges floating on it.

---

## Article / Image + Caption

Component set `154:2497`. Desktop `154:2491`, mobile `154:2494`.

### Purpose
- A single real image at its **true aspect ratio**, with an optional small muted caption. No card, no border radius on a wrapper, no grey canvas.
- Use for a supporting screenshot, one portrait or square result, or an interface shot.
- Versus **Result Tile**: no letter, no badge, no test behind it. Versus **AIGE Test**: no claim, no setup, no result line.
- Caption only when it adds information — model, settings, "Generated with the prompt above". Hide it when it would repeat the heading.

### Anatomy
```
Article / Image + Caption               plain column, no card
├── Image                               border 1px hairline, radius 12, image = FILL
└── Caption                        [opt in guidance, no variant] Label/Sans S, muted
```

### Desktop
| Part | Spec |
|---|---|
| Figure | `width 740` (as built) · `gap 8` column · no padding · no background · no shadow |
| Image | `width 100%` · `height 440` as authored · `radius 12` · `border 1px #e6e6e3` · backdrop `surface/sunken #efefed` · `object-fit: cover` |
| Caption | full width, Label/Sans S 12/16, `text/muted #8a8991` |

### Mobile
| Part | Spec |
|---|---|
| Figure | `width 350` · `gap 8` · no padding, background or shadow |
| Image | `width 100%` · `height 197` as authored · `radius 12` · `border 1px #e6e6e3` · backdrop `surface/sunken` |
| Caption | Label/Sans S 12/16, `text/muted` — identical to desktop |

### Width variants
Not expressed as Figma variants. The component has only `Viewport`; width comes from resizing the instance. The documented ladder, from the component description:

| Intent | Width | Notes |
|---|---|---|
| Portrait result | 380–480 | centred in the 740 column |
| Square result | ~480 | centred |
| Supporting screenshot | ~440 | |
| Interface screenshot / comparison | up to 740 | full column |
| Mobile | 350 | always full column |

In code: `figure { width: min(var(--fig-w), 100%); margin-inline: auto; }` and set `--fig-w` per instance. Height must come from the image's own ratio (`aspect-ratio` or intrinsic `width/height`), not the authored 440/197. Vary widths between consecutive figures for rhythm.

### Type
| Element | Style | Colour |
|---|---|---|
| Caption | Label/Sans S · Inter Medium 500 · 12/16 · letter-spacing 0 | `text/muted #8a8991` |

Caption sits **below** the image, left-aligned, `gap 8` from it. It is the only place `text/muted` and `Label/Sans S` appear in this family.

### Tokens
`border/hairline`, `surface/sunken`, `text/muted`, `Label/Sans S`.

### Variants & states
- `Viewport`: Desktop | Mobile. `caption` text prop.
- No `showCaption` boolean exists even though the guidance says to hide the caption when it repeats the heading — hiding it is a code-side decision today.
- No hover, focus or pressed state.

### Open questions
- Yes, there **is** a figure border (1px `border/hairline`) and a 12px radius — reconcile with "no grey containers": the border is fine, the `surface/sunken` fill behind the image is the part that reads as a grey canvas.
- The authored nodes have fixed heights (440 desktop, 197 mobile) with `object-fit: cover`, which is exactly the fake-landscape-canvas problem the description forbids. Treat the heights as placeholder only and drive height from the real ratio.
- Centring for the 380–480 portrait case is described but not built — no centring wrapper or alignment property exists on the component.
- No `showCaption` variant; no designed empty/missing-image state; no lightbox or zoom, which a 740-wide interface screenshot most needs.
- Portrait dropped into a wide slot: undefined. Recommend capping by height and centring rather than cropping, but this needs a design decision.

---

## Article / Comparison A/B

Component set `154:2490`. Desktop `154:2450`, mobile `154:2470`.

### Purpose
- Two approaches, tools or settings compared **in words**, closed by a verdict. No images anywhere.
- Use for "paragraph vs JSON prompts", "Dreamy vs Vivid 2" style explanations.
- Versus **AIGE Test**: the moment there is image evidence or a real test run, use AIGE Test instead. This block sits lower in the intensity ladder — quieter card, no shadow, no eyebrow.
- Never more than two options, and never as an old-style table.

### Anatomy
```
Article / Comparison A/B                card, white, hairline, NO shadow
├── Title                               Heading/S desktop · Heading/XS mobile
├── Options
│   ├── Option A                        surface/page panel
│   │   ├── Head: Letter "A" + Name
│   │   ├── Body line                   secondary
│   │   └── "Best for …" line           strong primary
│   └── Option B                        identical structure, Letter "B"
└── Verdict
    ├── "Verdict"                       pink-press eyebrow
    └── Verdict text                    primary
```
Props: `title`, `verdict`. Option content is authored text, not props.

### Desktop
| Part | Spec |
|---|---|
| Card | `width 740` · `padding 24` all sides · `gap 20` column · `radius 20` · `border 1px #e6e6e3` · bg `#ffffff` · **no box-shadow** |
| Options row | `display:flex` · `gap 16` · `align-items: flex-start` |
| Option panel | `flex: 1 0 0; min-width: 0` · `padding 16` all sides · `gap 8` column · `radius 16` · bg `surface/page #f9f9f9` · **no border** |
| Head | `gap 10` row, `align-items: center` |
| Letter chip | 24 × 24 · `radius 999` · bg `action/pink-soft #fce7f3` · text `action/pink-press #be185d` |
| Verdict | `gap 4` column, full width |

Panel width works out to `(740 − 48 − 16)/2 = 338`.

### Mobile
| Part | Spec |
|---|---|
| Card | `width 350` · `padding 20px 16px` (20 top/bottom, 16 left/right) · `gap 20` column · `radius 20` · `border 1px #e6e6e3` · bg `#ffffff` · no shadow |
| Options | `flex-direction: column` · `gap 12` · each panel `width 100%` |
| Stacking order | **A then B**, unchanged from desktop left→right |
| Option panel | `padding 16` · `gap 8` · `radius 16` · bg `surface/page` |
| Letter chip | 24 × 24, same as desktop |
| Verdict | `gap 4` |

Panel width: `350 − 32 = 318`.

### Divider treatment
- There is no divider rule, no vertical hairline, no column border. Separation is done entirely by the two `#f9f9f9` panels sitting on the `#ffffff` card, plus the 16 (desktop) / 12 (mobile) gap.
- The Verdict block has no top rule either — unlike AIGE Test's What I Learned slot, which does.

### Label styling, side A and side B
| Element | Style | Colour |
|---|---|---|
| Letter A / B | Body/S Strong 14/20, centred in a 24px `radius 999` chip | text `#be185d` on `#fce7f3` |
| Option name | Body/M Strong 16/24 | `text/primary #141317` |
| Option body line | Body/S 14/22 | `text/secondary #55545b` |
| "Best for …" line | Body/S Strong 14/20 | `text/primary #141317` |

A and B are styled identically — neither side is marked as the winner inside the panels. The winner is expressed only in the verdict sentence.

### Conclusion line
Yes. A required `Verdict` block closes the card:
- Eyebrow "Verdict" — Body/S Strong 14/20, `action/pink-press #be185d`.
- Text — Body/M 16/26, `text/primary`, on both viewports (this does not scale down like AIGE Test's Result does).
- `gap 4` between eyebrow and text, `gap 20` from the options row.

### Type
| Element | Desktop | Mobile |
|---|---|---|
| Title | Heading/S · Bricolage SemiBold 21/26, -0.21px, `#141317` | Heading/XS · Bricolage SemiBold 17/22, -0.085px, `#141317` |
| Option name | Body/M Strong 16/24, `#141317` | identical |
| Option body | Body/S 14/22, `#55545b` | identical |
| "Best for" | Body/S Strong 14/20, `#141317` | identical |
| Verdict label | Body/S Strong 14/20, `#be185d` | identical |
| Verdict text | Body/M 16/26, `#141317` | identical |

### Tokens
`surface/card`, `surface/page`, `border/hairline`, `text/primary`, `text/secondary`, `action/pink-soft`, `action/pink-press`, `Heading/S`, `Heading/XS`, `Body/M`, `Body/M Strong`, `Body/S`, `Body/S Strong`.

### Variants & states
- `Viewport`: Desktop | Mobile. Text props `title`, `verdict`.
- Option content has no props — it is authored text in the variant, so the code component needs slots for name / body / "best for" per side.
- No hover, focus or active state; the panels are not interactive.

### Open questions
- No shadow here but `Elevation/Card` on AIGE Test, and radius 20 vs 24 on desktop. Confirm the elevation ladder across article cards rather than treating it as drift.
- The "Best for …" line has no label and no icon; its role versus the body line is implied only by weight. Give it a name in the code API (`bestFor`) and decide whether it should be visually distinguished.
- Option panels are `#f9f9f9` on a `#ffffff` card, which is the same pairing the AIGE Test setup panel uses — fine, but it means the article has two nested surfaces; do not add a third.
- No focus-visible treatment, and no designed behaviour if one option's text is far longer than the other (panels stretch to equal height on desktop via `align-items: flex-start` — they currently do not stretch, so they end at different heights).
- Mobile stacking order is A then B with no "vs" affordance between them; a divider or a small "vs" marker is implied by the pattern but undesigned.
