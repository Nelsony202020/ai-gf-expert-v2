# 10 · Callouts

Figma file `iaUwrRvpkEq7RrBpPLxA6j` · page **02 · Article Components**.

Six callout components. Target rebuild: Astro + plain CSS. Page background `#f9f9f9`; cards `#ffffff` with a 1px hairline. No third grey level — do not invent one.

**Global conventions (true for all six)**

| Thing | Value |
|---|---|
| Desktop width | `740px` fixed = the full reading column (callouts are flush, never inset) |
| Mobile width | `350px` fixed inside a `390` screen → `20px` gutter each side |
| Card radius | `16px` (My Take: none) |
| Hairline border | `1px solid var(--border-hairline) #e6e6e3` |
| Icon box | `18 × 18px`, Lucide geometry on a 24 grid, 1.5px stroke, round caps/joins |
| Body font | Inter (Key Takeaway body is the only Bricolage Grotesque) |
| Variants | `Viewport = Desktop | Mobile` only. No size, tone, state or icon variants. |

**Letter-spacing note.** Figma style values are **percentages**; the px values below are the resolved CSS. `-0.2% @14px = -0.028px`, `-0.3% @16px = -0.048px`, `-0.3% @17px = -0.051px`, `-0.5% @19px = -0.095px`, `-1% @21px = -0.21px`, `-0.5% @17px = -0.085px`.

**Icon stroke colours are inferred.** Icons come back as flattened exported SVGs, so stroke colour is not in the generated markup. Each component's `get_variable_defs` returns exactly one colour variable that appears nowhere in its visible text or fills — that is the icon stroke. Marked `(inferred)` throughout; verify in Figma before shipping.

---

## Article / Tip

Component set `151:2115` · Desktop `151:2101` · Mobile `151:2108`

### Purpose

- **Rung 1 of 6 — lightest.** A light, optional hint that saves the reader time.
- USE: practical shortcuts inside a section. Max 1–2 per section.
- DO NOT USE: warnings, rules, or the main answer. Never stack two callouts.
- Sans only (no retro UI).
- Heaviest-making devices: **none beyond the baseline card.** This is the reference weight — white card, hairline, no tint, no accent, neutral label.

### Anatomy

```
Article / Tip                      (card, row, items-start)
└── Content                        (col, gap 8)              151:2102
    ├── Label row                  (row, gap 8, items-center) 151:2103
    │   ├── Icon / bulb  18×18                                151:2104  (→ 87:135)
    │   └── Label text  "Tip"                                 151:2106
    └── Body text                                             151:2107
```

All parts present; nothing marked optional. No accent bar.

### Desktop

| Property | Value |
|---|---|
| Width | `740px` |
| Padding | `20px` top / `24px` right / `20px` bottom / `24px` left |
| Content gap | `8px` |
| Label row gap | `8px` |
| Radius | `16px` |
| Border | `1px solid #e6e6e3` (`border/hairline`) |
| Background | `#ffffff` (`surface/card`) |
| Accent bar | none |
| Icon | `Icon / bulb`, 18×18, stroke `#55545b` `text/secondary` (inferred) |
| Height (as drawn) | `120px` |

### Mobile

| Property | Value |
|---|---|
| Width | `350px` |
| Padding | `16px` top / `20px` right / `16px` bottom / `20px` left |
| Content gap | `8px` |
| Label row gap | `8px` |
| Radius | `16px` |
| Border | `1px solid #e6e6e3` |
| Background | `#ffffff` |
| Accent bar | none |
| Icon | same, 18×18 (does not shrink) |
| Height (as drawn) | `138px` |

### Type

| Slot | Figma style | Family | Size | Weight | Line-height | Letter-spacing | Colour |
|---|---|---|---|---|---|---|---|
| Label (D+M) | `Body/S Strong` | Inter Semi Bold | 14 | 600 | 20 | `-0.028px` | `#141317` `text/primary` |
| Body (D) | `Body/M` | Inter Regular | 16 | 400 | 26 | `-0.048px` | `#141317` `text/primary` |
| Body (M) | `Body/M` | Inter Regular | 16 | 400 | 26 | `-0.048px` | `#141317` `text/primary` |

Label copy, verbatim: **`Tip`**
Body copy in the component: `If only one part of the generation is wrong, change that part instead of rewriting the whole prompt.`

### Tokens

`surface/card` #ffffff · `border/hairline` #e6e6e3 · `text/primary` #141317 · `text/secondary` #55545b · type `Body/S Strong`, `Body/M`

### Variants & states

- `Viewport = Desktop | Mobile`.
- Props exposed: `label` (string), `body` (string), `viewport`.
- Non-interactive. No hover / focus-visible / active / pressed / disabled.

### Open questions

- `text/secondary` #55545b is returned by the variable defs but appears on no visible text node. Assumed to be the bulb stroke — confirm, or find the hidden slot it belongs to.
- Body is `Body/M` 16/26 on **both** viewports, while the heavier callouts step desktop up to 19/30. Confirm Tip is deliberately at running-body size on desktop.
- No hover / focus-visible / active defined. If body copy can contain inline links, link states are undefined.

---

## Article / Important

Component set `151:2132` · Desktop `151:2116` · Mobile `151:2124`

### Purpose

- **Rung 2 of 6.** A restrained warning about a mistake that costs coins or ruins results.
- USE: rules the reader must follow to avoid a bad outcome.
- DO NOT USE: general tips or marketing. Don't use for every caveat.
- Heaviest-making devices vs Tip: **background tint replaces the white card** (`score/mid-soft` #ffedd5) and the **hairline border is dropped**; the **icon turns warning-orange** (`score/mid` #e8760a, inferred). Padding, radius, gaps and type are identical to Tip.

### Anatomy

```
Article / Important                (tinted card, row, items-start)
└── Content                        (col, gap 8)              151:2117
    ├── Label row                  (row, gap 8, items-center) 151:2118
    │   ├── Icon / alert 18×18                                151:2119  (→ 87:132)
    │   └── Label text  "Important"                           151:2122
    └── Body text                                             151:2123
```

All parts present; nothing optional. No accent bar.

### Desktop

| Property | Value |
|---|---|
| Width | `740px` |
| Padding | `20px` / `24px` / `20px` / `24px` |
| Content gap | `8px` |
| Label row gap | `8px` |
| Radius | `16px` |
| Border | **none** (0 width) |
| Background | `#ffedd5` (`score/mid-soft`) |
| Accent bar | none |
| Icon | `Icon / alert`, 18×18, stroke `#e8760a` `score/mid` (inferred) |
| Height (as drawn) | `94px` |

### Mobile

| Property | Value |
|---|---|
| Width | `350px` |
| Padding | `16px` / `20px` / `16px` / `20px` |
| Content gap | `8px` |
| Label row gap | `8px` |
| Radius | `16px` |
| Border | **none** |
| Background | `#ffedd5` |
| Accent bar | none |
| Icon | same, 18×18 |
| Height (as drawn) | `112px` |

### Type

| Slot | Figma style | Family | Size | Weight | Line-height | Letter-spacing | Colour |
|---|---|---|---|---|---|---|---|
| Label (D+M) | `Body/S Strong` | Inter Semi Bold | 14 | 600 | 20 | `-0.028px` | `#141317` `text/primary` |
| Body (D) | `Body/M` | Inter Regular | 16 | 400 | 26 | `-0.048px` | `#141317` |
| Body (M) | `Body/M` | Inter Regular | 16 | 400 | 26 | `-0.048px` | `#141317` |

Label copy, verbatim: **`Important`**
Body copy in the component: `Character prompts should mainly contain permanent traits.`

### Tokens

`score/mid-soft` #ffedd5 · `score/mid` #e8760a · `text/primary` #141317 · type `Body/S Strong`, `Body/M`

### Variants & states

- `Viewport = Desktop | Mobile`.
- Props exposed: `label`, `body`, `viewport`.
- Non-interactive. No hover / focus-visible / active.

### Open questions

- The label stays `text/primary` #141317 while Quick Answer's label is tinted. Is a neutral label on a tinted card intentional, or should Important's label use `score/mid` for parity?
- Tinted callouts (Important, Quick Answer) carry **no border**; white callouts carry the hairline. Confirm this is the rule so the rebuild does not add a border to tinted cards for "consistency".
- `score/mid` #e8760a appears in the variable defs but on no visible fill — assumed alert-icon stroke. Confirm.
- #ffedd5 on #f9f9f9 page: contrast of `text/primary` on the tint is fine, but the tint's own edge against the page is low-contrast with no border. Confirm no shadow/ring is expected.

---

## Article / Quick Answer

Component set `151:2147` · Desktop `151:2133` · Mobile `151:2140`

### Purpose

- **Rung 3 of 6.** The short answer to the question the article is about.
- USE: once, near the top of an article, right after the intro.
- DO NOT USE: mid-article summaries (use Key Takeaway) or long paragraphs.
- Heaviest-making devices vs Important: **brand-pink tint** instead of warning-orange (`action/pink-soft` #fce7f3), **padding grows** (24/28 desktop, uniform 20 mobile), **body type steps up** to 19/30 desktop and 17/28 mobile, and the **label becomes coloured** (`action/pink-press` #be185d) — the first tinted label in the ladder.

### Anatomy

```
Article / Quick Answer             (tinted card, row, items-start)
└── Content                        (col, gap 8)              151:2134
    ├── Label row                  (row, gap 8, items-center) 151:2135
    │   ├── Icon / sparkle 18×18                              151:2136  (→ 53:46)
    │   └── Label text  "Quick answer"                        151:2138
    └── Body text                                             151:2139
```

All parts present; nothing optional. No accent bar.

### Desktop

| Property | Value |
|---|---|
| Width | `740px` |
| Padding | `24px` top / `28px` right / `24px` bottom / `28px` left |
| Content gap | `8px` |
| Label row gap | `8px` |
| Radius | `16px` |
| Border | **none** |
| Background | `#fce7f3` (`action/pink-soft`) |
| Accent bar | none |
| Icon | `Icon / sparkle`, 18×18, stroke `#db2777` `action/pink` (inferred) |
| Height (as drawn) | `136px` |

### Mobile

| Property | Value |
|---|---|
| Width | `350px` |
| Padding | `20px` on **all four sides** (uniform — unlike every other callout) |
| Content gap | `8px` |
| Label row gap | `8px` |
| Radius | `16px` |
| Border | **none** |
| Background | `#fce7f3` |
| Accent bar | none |
| Icon | same, 18×18 |
| Height (as drawn) | `152px` |

### Type

| Slot | Figma style | Family | Size | Weight | Line-height | Letter-spacing | Colour |
|---|---|---|---|---|---|---|---|
| Label (D+M) | `Body/S Strong` | Inter Semi Bold | 14 | 600 | 20 | `-0.028px` | `#be185d` `action/pink-press` |
| Body (D) | `Body/L` | Inter Regular | 19 | 400 | 30 | `-0.095px` | `#141317` `text/primary` |
| Body (M) | `Article/Body Mobile` | Inter Regular | 17 | 400 | 28 | `-0.051px` | `#141317` |

Label copy, verbatim: **`Quick answer`** (lowercase `a` — not "Quick Answer", which is only the component name)
Body copy in the component: `JSON prompts can give you more control, but they are not automatically better with every OurDream generator.`

### Tokens

`action/pink-soft` #fce7f3 · `action/pink-press` #be185d · `action/pink` #db2777 · `text/primary` #141317 · type `Body/S Strong`, `Body/L` (D), `Article/Body Mobile` (M)

### Variants & states

- `Viewport = Desktop | Mobile`.
- Props exposed: `label`, `body`, `viewport`.
- Non-interactive. No hover / focus-visible / active.

### Open questions

- **Mobile padding disagrees with the family.** Every other callout is `16/20` on mobile; Quick Answer is `20/20`. Decide: is the extra 4px vertical a deliberate weight signal for rung 3, or drift to normalise?
- **Label case.** Component name is "Quick Answer"; the text node says "Quick answer". Confirm the sentence-case label is the shipped string.
- `action/pink` #db2777 is in the variable defs but no visible fill uses it — assumed sparkle stroke, which would make the icon a lighter pink than the label (#be185d). Confirm the icon/label colours are deliberately different, or align them.
- Desktop body is `Body/L`, not `Article/Body Desktop`. Confirm `Article/Body Desktop` is not the intended style here (the mobile counterpart *does* use `Article/Body Mobile`), and that the desktop running-body style is not simply missing.
- No hover / focus-visible / active defined.

---

## Article / What I Learned

Component set `151:2164` · Desktop `151:2148` · Mobile `151:2156`

### Purpose

- **Rung 4 of 6.** A personal finding from Herman's own testing.
- USE: after a test or experience, to state what it taught us.
- DO NOT USE: opinions without testing, quotes, or serif pull-quote styling.
- Heaviest-making devices vs Quick Answer: **returns to the white card + hairline** but gains **human authority** — the 18px icon is replaced by a **32px bordered avatar**, and the label becomes a **two-line stacked identity block** (label + attribution). Gaps step 8 → 12. Body keeps the stepped-up 19/30 · 17/28.
- Note: this rung is heavier by *attribution*, not by colour. It is the only callout with no icon and no tint.

### Anatomy

```
Article / What I Learned           (white card, row, items-start)
└── Content                        (col, gap 12)             151:2149
    ├── Label row                  (row, gap 12, items-center) 151:2150
    │   ├── Brand / Avatar Herman  32×32                       (→ 57:41)
    │   └── Who                    (col, no gap)              151:2152
    │       ├── Label text  "What I learned"                  151:2153
    │       └── Attribution text                              151:2154
    └── Body text                                             151:2155
```

- `Who` is a two-line stack with **no gap** — the 20px and 22px line-heights do the spacing.
- Avatar is an instance (swappable); its component doc says scale to 32 / 40 / 48 / 64 — this component uses **32**.
- Nothing marked optional.

### Desktop

| Property | Value |
|---|---|
| Width | `740px` |
| Padding | `20px` / `24px` / `20px` / `24px` |
| Content gap | `12px` |
| Label row gap | `12px` |
| Radius | `16px` |
| Border | `1px solid #e6e6e3` (`border/hairline`) |
| Background | `#ffffff` (`surface/card`) |
| Accent bar | none |
| Icon | **none.** `Brand / Avatar Herman`, 32×32, `border-radius 999px`, `1.5px solid #141317` (`text/primary`), image `object-fit: cover` |
| Height (as drawn) | `124px` |

### Mobile

| Property | Value |
|---|---|
| Width | `350px` |
| Padding | `16px` / `20px` / `16px` / `20px` |
| Content gap | `12px` |
| Label row gap | `12px` |
| Radius | `16px` |
| Border | `1px solid #e6e6e3` |
| Background | `#ffffff` |
| Accent bar | none |
| Avatar | same, 32×32 (does not shrink) |
| Height (as drawn) | `142px` |

### Type

| Slot | Figma style | Family | Size | Weight | Line-height | Letter-spacing | Colour |
|---|---|---|---|---|---|---|---|
| Label (D+M) | `Body/S Strong` | Inter Semi Bold | 14 | 600 | 20 | `-0.028px` | `#141317` `text/primary` |
| Attribution (D+M) | `Body/S` | Inter Regular | 14 | 400 | 22 | `-0.028px` | `#55545b` `text/secondary` |
| Body (D) | `Body/L` | Inter Regular | 19 | 400 | 30 | `-0.095px` | `#141317` |
| Body (M) | `Article/Body Mobile` | Inter Regular | 17 | 400 | 28 | `-0.051px` | `#141317` |

Label copy, verbatim: **`What I learned`** (lowercase `l`)
Attribution copy, verbatim: **`Herman Carter · Lead Reviewer`** (middle dot `·` U+00B7, spaces either side)
Body copy in the component: `Vivid 2 followed my JSON prompt more accurately than Dreamy.`

### Tokens

`surface/card` #ffffff · `border/hairline` #e6e6e3 · `text/primary` #141317 · `text/secondary` #55545b · type `Body/S Strong`, `Body/S`, `Body/L` (D), `Article/Body Mobile` (M)

### Variants & states

- `Viewport = Desktop | Mobile`.
- Props exposed: `label`, `body`, `viewport`.
- Non-interactive. No hover / focus-visible / active.

### Open questions

- **The attribution line is not a prop.** `Herman Carter · Lead Reviewer` is a hardcoded text node, as is the avatar instance. Decide whether the Astro component takes `author` / `role` / `avatar` props or hardcodes Herman. Same question applies to My Take.
- **Optional attribution?** Nothing says the second line can be hidden. If a callout can ever be authorless, that slot needs an explicit optional state and the `Who` stack needs a single-line layout.
- Avatar `1.5px` border is `text/primary` #141317 — a near-black ring, which is visually heavier than the card's #e6e6e3 hairline. Confirm that is intended and not a third grey creeping in.
- No icon here breaks the icon+label pattern of rungs 1–3 and 5. Confirm the avatar is the intended substitute rather than avatar *plus* icon.
- No hover / focus-visible / active defined. Avatar is not a link; confirm it never becomes one (author page).

---

## Article / Key Takeaway

Component set `151:2183` · Desktop `151:2165` · Mobile `151:2174`

### Purpose

- **Rung 5 of 6 — the heaviest card.** A one-sentence summary of a section.
- USE: at the end of a long section, max once per section.
- DO NOT USE: the article's main answer (use Quick Answer) or lists.
- Heaviest-making devices vs What I Learned: gains a **4px pink left accent bar** (the only accent bar in the family) **and** switches the body to the **display face at heading weight** — Bricolage Grotesque SemiBold 21/26. It is the only callout whose body is not Inter and not weight 400. Icon returns (`badge-check`).

### Anatomy

```
Article / Key Takeaway             (white card, row, gap 16, items-start)
├── Accent                         4px wide, stretches full content height  151:2166
└── Content                        (col, gap 8)                             151:2167
    ├── Label row                  (row, gap 8, items-center)               151:2168
    │   ├── Icon / badge-check 18×18                                        151:2169  (→ 120:562)
    │   └── Label text  "Key takeaway"                                      151:2172
    └── Body text                                                           151:2173
```

- `Accent` is the **first child**, inside the card padding (not flush to the card edge) and separated from Content by the `16px` root gap.
- `Accent` uses `align-self: stretch` — its height equals the content box, not the card.
- Nothing marked optional.

### Desktop

| Property | Value |
|---|---|
| Width | `740px` |
| Padding | `20px` / `24px` / `20px` / `24px` |
| Root gap (accent → content) | `16px` |
| Content gap | `8px` |
| Label row gap | `8px` |
| Radius | `16px` |
| Border | `1px solid #e6e6e3` (`border/hairline`) |
| Background | `#ffffff` (`surface/card`) |
| **Accent bar** | **width `4px`, `border-radius 2px`, fill `#db2777` (`action/pink`), `align-self: stretch`** |
| Icon | `Icon / badge-check`, 18×18, stroke `#db2777` `action/pink` **or** `#141317` `text/primary` — ambiguous, see open questions |
| Height (as drawn) | `120px` |

### Mobile

| Property | Value |
|---|---|
| Width | `350px` |
| Padding | `16px` / `20px` / `16px` / `20px` |
| Root gap | `16px` (unchanged) |
| Content gap | `8px` |
| Label row gap | `8px` |
| Radius | `16px` |
| Border | `1px solid #e6e6e3` |
| Background | `#ffffff` |
| **Accent bar** | width `4px`, radius `2px`, `#db2777`, stretch (unchanged) |
| Icon | same, 18×18 |
| Height (as drawn) | `126px` |

### Type

| Slot | Figma style | Family | Size | Weight | Line-height | Letter-spacing | Colour |
|---|---|---|---|---|---|---|---|
| Label (D+M) | `Body/S Strong` | Inter Semi Bold | 14 | 600 | 20 | `-0.028px` | `#141317` `text/primary` |
| Body (D) | `Heading/S` | **Bricolage Grotesque** SemiBold | 21 | 600 | 26 | `-0.21px` | `#141317` |
| Body (M) | `Heading/XS` | **Bricolage Grotesque** SemiBold | 17 | 600 | 22 | `-0.085px` | `#141317` |

Body variable font settings (both viewports): `font-variation-settings: "opsz" 14, "wdth" 100`.

Label copy, verbatim: **`Key takeaway`** (lowercase `t`)
Body copy in the component: `More detail gives you more control, but it also gives the AI more things to get wrong.`

### Tokens

`surface/card` #ffffff · `border/hairline` #e6e6e3 · `action/pink` #db2777 · `text/primary` #141317 · type `Body/S Strong`, `Heading/S` (D), `Heading/XS` (M)

### Variants & states

- `Viewport = Desktop | Mobile`.
- Props exposed: `label`, `body`, `viewport`.
- Non-interactive. No hover / focus-visible / active.

### Open questions

- **Icon stroke colour is genuinely ambiguous here.** Unlike rungs 1–3, every colour variable returned (`action/pink`, `text/primary`, `surface/card`, `border/hairline`) is already consumed by a visible fill, so nothing identifies the `badge-check` stroke. It is either #db2777 (matching the accent) or #141317 (matching the label). Must be checked in Figma.
- **Accent bar is inset, not flush.** It sits inside the 24px/20px left padding, so the card's left edge is plain white with the accent floating 24px in. If the intent was a flush left rule, the padding and element order both need changing. Confirm before build.
- `Heading/S` → `Heading/XS` is a 21 → 17 drop on mobile, a larger relative step down than any other callout's body. At 17/22 SemiBold Bricolage the mobile body is nearly the same size as Quick Answer's 17/28 Inter Regular — the weight, not the size, carries the hierarchy on mobile. Confirm that is acceptable, since it compresses rung 3 vs rung 5 on small screens.
- Root gap stays `16px` on mobile while all padding shrinks. Confirm intentional.
- No hover / focus-visible / active defined.

---

## Article / My Take

Component set `309:5199` · Desktop `309:5185` · Mobile `309:5192`

### Purpose

- Herman's personal recommendation or opinion ("I would…", "I prefer…", "Personally…"). Avatar + "My take" + the sentence(s) verbatim; **hairline rules, no card.**
- USE: 1–3 times per long article, for genuine recommendations.
- Use What I Learned for a lesson from testing, **AIGE Test** for an actual test with results, Key Takeaway for a section conclusion.
- DO NOT: wrap generic information or every first-person sentence.
- **Rung: does not sit on the intensity ladder.** See open questions — this component's own Figma description does not place it on the light→strong scale, and structurally it is *lighter* than every card in this family: no fill, no border box, no radius, no icon, no accent bar. It is a different axis (attributed voice, like What I Learned), not rung 6.

### Anatomy

```
Article / My Take                  (NOT a card — row, gap 14, items-start,
                                    1px hairline top + bottom only)
├── Brand / Avatar Herman  36×36                              (→ 57:41)
└── Content                        (col, gap 6)              309:5187
    ├── Head                       (row, gap 8, items-center) 309:5188
    │   ├── Label text  "My take"                             309:5189
    │   └── Attribution text                                  309:5190
    └── Body text                                             309:5191
```

- `Head` is **horizontal** — label and attribution sit side by side. In What I Learned the equivalent block is **vertical**. This is the clearest structural difference between the two attributed callouts.
- Avatar is `36px` here vs `32px` in What I Learned — and 36 is **not** one of the documented avatar steps (32 / 40 / 48 / 64).
- Nothing marked optional.

### Desktop

| Property | Value |
|---|---|
| Width | `740px` |
| Padding | `18px` top / `0` right / `18px` bottom / `0` left |
| Root gap (avatar → content) | `14px` |
| Content gap | `6px` |
| Head gap | `8px` |
| Radius | **`0` — no radius** |
| Border | **`1px solid #e6e6e3` top and bottom only.** No left/right border. |
| Background | **none / transparent** (page `#f9f9f9` shows through) |
| Accent bar | none |
| Icon | **none.** `Brand / Avatar Herman`, 36×36, `border-radius 999px`, `1.5px solid #141317` (`text/primary`), image `object-fit: cover` |
| Height (as drawn) | `122px` |

### Mobile

| Property | Value |
|---|---|
| Width | `350px` |
| Padding | `18px` top / `0` right / `18px` bottom / `0` left (**vertical padding does not shrink**) |
| Root gap | `14px` |
| Content gap | `6px` |
| Head gap | `8px` |
| Radius | `0` |
| Border | `1px solid #e6e6e3` top and bottom only |
| Background | none / transparent |
| Accent bar | none |
| Avatar | same, 36×36 |
| Height (as drawn) | `140px` |

### Type

| Slot | Figma style | Family | Size | Weight | Line-height | Letter-spacing | Colour |
|---|---|---|---|---|---|---|---|
| Label (D+M) | `Body/S Strong` | Inter Semi Bold | 14 | 600 | 20 | `-0.028px` | `#be185d` `action/pink-press` |
| Attribution (D+M) | `Label/Sans S` | Inter Medium | 12 | 500 | 16 | `0` (none) | `#8a8991` `text/muted` |
| Body (D) | `Body/L` | Inter Regular | 19 | 400 | 30 | `-0.095px` | `#141317` `text/primary` |
| Body (M) | `Body/M` | Inter Regular | 16 | 400 | 26 | `-0.048px` | `#141317` |

Label copy, verbatim: **`My take`** (lowercase `t`)
Attribution copy, verbatim: **`Herman Carter · Lead Reviewer`**
Body copy in the component: `I would use the Brush Editor for quick fixes and only open Layers when I actually need the extra control.`

### Tokens

`border/hairline` #e6e6e3 · `action/pink-press` #be185d · `text/primary` #141317 · `text/muted` #8a8991 · type `Body/S Strong`, `Label/Sans S`, `Body/L` (D), `Body/M` (M)

### Open questions

- **The brief's rung 6 is "AIGE Test", but the node supplied (`309:5185`) is Article / My Take.** Rungs 1–5 all carry the identical hierarchy string ending `… → Key takeaway → AIGE test`; My Take's description instead *distinguishes* itself from AIGE Test, and never places itself on the ladder. So **`Article / AIGE Test` is a separate seventh component that was not in this batch and is still undocumented.** Needs a decision: document AIGE Test as rung 6 and move My Take to its own "attributed voice" group, or confirm My Take replaces it.
- **My Take introduces `text/muted` #8a8991 — a third grey.** The stated rule is "no third grey level" (page #f9f9f9, card #fff, hairline #e6e6e3, text #141317/#55545b). #8a8991 is a new text grey used by no other callout. Either the rule needs amending or the attribution should use `text/secondary` #55545b like What I Learned's.
- **Mobile body drops to `Body/M` 16/26.** Quick Answer and What I Learned — the other two `Body/L` desktop components — both drop to `Article/Body Mobile` 17/28. My Take drops one step further, to Tip/Important's size. Desktop and mobile disagree about how heavy this component is; pick 16/26 or 17/28.
- **Avatar is 36px, off the documented 32/40/48/64 scale**, and 4px larger than What I Learned's for a component that is otherwise lighter. Resolve to 32 or 40, or document 36 as an allowed step.
- **Attribution styling diverges from What I Learned** for the same string: 14/22 Regular `text/secondary` there vs 12/16 Medium `text/muted` here. Two treatments of one piece of content — pick one.
- **Horizontal `Head` row will wrap badly.** `My take` + `Herman Carter · Lead Reviewer` are both `white-space: nowrap` in the source with an 8px gap; at 350px minus a 36px avatar and 14px gap the line has ~300px. It fits the sample strings, but a longer role or a translated label will overflow. No wrapping behaviour is defined.
- **Transparent background on a card-based page.** The rules sit on #f9f9f9 with no fill; if My Take is ever placed inside a white card the hairlines will read differently. Confirm placement is always directly on the page background.
- **Vertical padding does not shrink on mobile** (18px both viewports) while every card in the family reduces 20 → 16. Confirm.
- No hover / focus-visible / active defined. Avatar and attribution are not links.

---

## Intensity ladder — side by side

Rungs 1–5 as defined by the Figma component descriptions. My Take is listed last but is **off-ladder** (see its open questions); `Article / AIGE Test`, the documented rung 6, is not yet specified.

| # | Component | Background | Border | Left accent | Icon | Label colour | Body type (D) | Body type (M) |
|---|---|---|---|---|---|---|---|---|
| 1 | **Tip** | `#ffffff` card | 1px `#e6e6e3` hairline | — | `bulb` 18px, `#55545b`* | `#141317` neutral | Inter Regular 16/26 (`Body/M`) | Inter Regular 16/26 (`Body/M`) |
| 2 | **Important** | `#ffedd5` orange tint | **none** | — | `alert` 18px, `#e8760a`* | `#141317` neutral | Inter Regular 16/26 (`Body/M`) | Inter Regular 16/26 (`Body/M`) |
| 3 | **Quick answer** | `#fce7f3` pink tint | **none** | — | `sparkle` 18px, `#db2777`* | **`#be185d` pink** | Inter Regular 19/30 (`Body/L`) | Inter Regular 17/28 (`Article/Body Mobile`) |
| 4 | **What I learned** | `#ffffff` card | 1px `#e6e6e3` hairline | — | **none** — 32px avatar, 1.5px `#141317` ring | `#141317` neutral + 14/22 `#55545b` attribution | Inter Regular 19/30 (`Body/L`) | Inter Regular 17/28 (`Article/Body Mobile`) |
| 5 | **Key takeaway** | `#ffffff` card | 1px `#e6e6e3` hairline | **4px `#db2777`, radius 2px, inset** | `badge-check` 18px, `#db2777` or `#141317`* | `#141317` neutral | **Bricolage Grotesque SemiBold 21/26** (`Heading/S`) | **Bricolage Grotesque SemiBold 17/22** (`Heading/XS`) |
| — | **My take** (off-ladder) | **none / transparent** | **1px `#e6e6e3` top + bottom only, no radius** | — | **none** — 36px avatar, 1.5px `#141317` ring | **`#be185d` pink** + 12/16 `#8a8991` attribution | Inter Regular 19/30 (`Body/L`) | Inter Regular 16/26 (`Body/M`) |

`*` icon stroke colours are inferred from unused colour variables, not read off the node — verify.

**How weight is actually built, in order of escalation**

1. **Tip → Important:** swap white card + hairline for an orange tint; drop the border; tint the icon. Geometry and type unchanged.
2. **Important → Quick answer:** switch tint to brand pink; grow padding (24/28 D, 20 uniform M); step body 16/26 → 19/30 D and 17/28 M; **tint the label** for the first time.
3. **Quick answer → What I learned:** drop the tint, return to white card + hairline, and buy weight with **human attribution** — 32px ringed avatar replaces the icon, label becomes a two-line identity stack, gaps 8 → 12. Body stays at the stepped-up size.
4. **What I learned → Key takeaway:** add the **only accent bar in the family** (4px pink) and switch the body to the **display face at SemiBold** — the single strongest typographic move available.

**Verification checks for the rebuild**

- Exactly two callouts have no border (Important, Quick answer) — both tinted.
- Exactly one callout has an accent bar (Key takeaway).
- Exactly one callout uses Bricolage Grotesque (Key takeaway body).
- Exactly two callouts have a pink label (Quick answer, My take).
- Exactly two callouts have an avatar instead of an icon (What I learned 32px, My take 36px).
- Exactly one callout is not a card (My take).
- No callout has any hover, focus-visible, active, pressed or disabled state defined anywhere in the family.

## Family-wide open questions

1. **Missing rung 6.** `Article / AIGE Test` is named by five of the six component descriptions as the strongest rung but was not supplied. Until it is documented, the ladder's top is unspecified and Key Takeaway's relative weight cannot be finalised.
2. **No interaction states anywhere.** Zero hover / focus-visible / active / pressed / disabled across all six. If any body copy can contain inline links, or if any callout ever becomes a link target or anchor, states must be specified — including a visible focus ring that works on #ffffff, #ffedd5, #fce7f3 and #f9f9f9.
3. **Third grey.** `text/muted` #8a8991 (My Take only) contradicts the "no third grey level" rule. Resolve globally.
4. **Icon stroke colours are inferred throughout.** Four icons, none read directly from the node. Confirm all four, and specifically resolve Key Takeaway's ambiguity.
5. **Desktop body style naming.** No callout uses `Article/Body Desktop`, yet mobile uses `Article/Body Mobile`. Confirm the desktop running-body style exists and whether Quick Answer / What I Learned / My Take should reference it instead of `Body/L`.
6. **No optional slots declared.** Every part of every callout is always present; only `label` and `body` are props. Attribution lines and avatars are hardcoded. Decide the real prop surface before building the Astro components.
7. **Fixed widths.** Both viewports are fixed-width frames (740 / 350). The rebuild needs the fluid rule: presumably `width: 100%` within the reading column, with the column itself capped at 740px and 20px page gutters on mobile. Not stated in Figma.
8. **Mobile padding is inconsistent by 4px** (Quick Answer 20/20, the rest 16/20, My Take 18/0). Normalise or document each as intentional.
