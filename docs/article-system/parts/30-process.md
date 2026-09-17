# 30 · PROCESS family

Figma file `iaUwrRvpkEq7RrBpPLxA6j` · page **02 · Article Components**.
Target: Astro + plain CSS. No Tailwind, no framework components.

Components in this part:

| Component | Node IDs |
|---|---|
| Article / Workflow Step (nested atom) | `277:3838` desktop · `277:3852` mobile · component set `277:3866` |
| Article / Step-by-Step Workflow | set `278:4831`; desktop `278:3837` `278:3938` `278:4037` `278:4136` `278:4235`; mobile `278:4334` `278:4435` `278:4534` `278:4633` `278:4732` |
| Article / Horizontal Process | `349:15054` |
| Usage annotation frame (Step-by-Step) | `279:4131` |

**Global frame facts.** Desktop reading column **740px**, mobile **350px**. Page background `#f9f9f9`. None of the three components draws a card: they sit directly on the page background with no border, no padding, no radius. The only filled surfaces inside them are the Example slot (`surface/sunken #efefed`) and the media image (`#ffffff` behind the photo + 1px `border/hairline`).

---

## Verbatim: usage annotation frame `279:4131`

Frame itself: `surface/card #ffffff`, 1px `border/hairline #e6e6e3`, radius 16, padding 28, flex column, gap 20.

**Title** (`279:4132`) — Article / Step-by-Step Workflow

**WHAT** (`279:4133`)
> The canonical AIGE pattern for anything where order matters: numbered soft-pink markers joined by one thin connector, a short action title and one short explanation per step.

**USE FOR** (`279:4134`)
> • 2–6 sequential steps
> • Workflows, setup instructions and how-to sequences
> • Testing, prompting, generation and editing processes
> • Any process where order matters

**DO NOT USE FOR** (`279:4140`, heading in `score/low #dc2626`)
> • Unrelated tips or normal bullet lists
> • Pros / cons or feature lists
> • FAQ
> • Categories where order does not matter

**COPY RULE** (`279:4146`)
> Each step = SHORT ACTION TITLE + ONE SHORT EXPLANATION.
> Good: “Generate two images” + “Look for what is already right before adding detail.”
> Bad: “Initial image generation and analysis” followed by a long paragraph.

**HOW TO BUILD IT** (`279:4151`)
> • Pick a Type: Simple, With examples, With media, With takeaway or Full. All five share one layout.
> • 2–6 steps: turn on Show step 4, 5 or 6. Turn Show connector OFF on the last visible step and ON on every step above it.
> • Example = short plain example text. For a real prompt or JSON, swap in Guide / Example Prompt. Never use mono for explanations.
> • Media = Guide / Image + Caption inside the step. Keep it secondary to the instruction.
> • Key takeaway: one per workflow, one sentence, after the last step.

**CANONICAL RULE** (`279:4158`)
> This is the only step-by-step layout for AIGE articles. When an article has ordered steps, use this pattern and change its content. Do not design a new step layout. Do not force it onto content that is not sequential.

---

## Article / Workflow Step

Nodes: desktop `277:3838`, mobile `277:3852`, set `277:3866`.

### Purpose

One step inside Article / Step-by-Step Workflow. Soft-pink numbered marker plus a thin vertical connector on the left; short action title and one short explanation on the right. It is **never** a standalone block — always a nested instance.

### Use for / Do not use for

From the Figma component description on `277:3866`:

| | |
|---|---|
| **Use for** | Only as a nested instance of Article / Step-by-Step Workflow. Optional Example (plain example text; swap in Guide / Example Prompt for real prompts or JSON) and Media (Guide / Image + Caption). |
| **Rule** | Turn Show connector off on the last visible step. The connector stretches with the step, so long steps and media never break the line. |
| **Do not use for** | As a standalone card; for unordered tips; for lists where order does not matter. |

### Anatomy

```
Step (row, align-items:start)
├─ Rail (column, align-items:center, align-self:stretch)
│  ├─ Marker (circle)
│  │  └─ Number (text)
│  └─ Connector (vertical bar)          ← optional · Show connector
└─ Content (column, flex:1, min-width:0)
   ├─ Title (text)                      ← always
   ├─ Description (text)                ← optional · Show description (default ON)
   ├─ Example (sunken box)              ← optional · Show example (default OFF)
   │  ├─ "Example" label
   │  └─ Example body
   └─ Media (column)                    ← optional · Show media (default OFF)
      ├─ Image (16:10-ish, bordered)
      └─ Caption (text)
```

Slot order inside Content is fixed: Title → Description → Example → Media. Media is always last.

### Desktop — `277:3838`

| Property | Value |
|---|---|
| Total width | 740 (fills reading column; in the parent it is `width:100%`) |
| Row gap (rail → content) | 20 |
| Rail width | 32, `align-self: stretch`, `padding-bottom: 4`, internal gap 4, items centred |
| Marker | 32 × 32, `border-radius: 16` (full), fill `action/pink-soft #fce7f3`, **no border**, flex centred |
| Marker number | `Body/S Strong` — Inter SemiBold 14 / 20, ls −0.2% (−0.028px), `action/pink-press #be185d`, centred |
| Connector width | **1.5px**, `border-radius: 1px`, fill `border/strong #d2d2ce` |
| Connector x offset | rail is 32 wide and centres it → connector centre at **x = 16** from the step's left edge (same axis as the marker centre); left edge at x = 15.25 |
| Connector start | 4px below the marker's bottom edge (rail gap 4) → y = 36 |
| Connector end | 4px above the step's bottom edge (rail `padding-bottom: 4`); it is `flex: 1 0 0` so it **stretches to whatever the step's content height is** |
| Left inset of text column | **52** (= 32 rail + 20 gap) |
| Content padding | `padding-top: 3`, `padding-bottom: 32`, no horizontal padding |
| Content width | 688 (= 740 − 52) |
| Content internal gap | 8 |
| Vertical gap between steps | **32px, and it comes from each step's `padding-bottom: 32` — the Steps container has gap 0.** Steps butt directly (metadata: step 1 y=0 h=100, step 2 y=100). This is what keeps the connector unbroken. |
| Height, title + description only | 100 (3 + 26 + 8 + 31 + 32) |

**Example slot (desktop)**

| Property | Value |
|---|---|
| Width | 688 (100%) |
| Fill / radius / border | `surface/sunken #efefed` · radius 10 · no border |
| Padding | 14 horizontal, 10 vertical |
| Internal gap | 2 |
| Label | "Example" — `Label/Sans S` Inter Medium 12 / 16, ls 0, `text/muted #8a8991` |
| Body | `Body/M` Inter Regular 16 / 26, ls −0.3% (−0.048px), `text/primary #141317` |
| Rendered height | 64 (10 + 16 + 2 + 26 + 10) → step height becomes 172 |

**Media slot (desktop)**

| Property | Value |
|---|---|
| Container | column, gap 8, width 100% |
| Image width | 688 (100% of the text column — it is **inset with the text, not full-bleed**) |
| Image height | **440** |
| Aspect ratio | 688 : 440 = **1.5636 : 1** (≈ 16 : 10.23 — *not* exactly 16:10, see Open questions) |
| Radius | 12 |
| Border | 1px solid `border/hairline #e6e6e3` |
| Fit | `object-fit: cover` |
| Caption | `Label/Sans S` Inter Medium 12 / 16, ls 0, `text/muted #8a8991`, width 100%, one line |
| Rendered height | 464 (440 + 8 + 16) → step height becomes 572 |

### Mobile — `277:3852`

| Property | Value |
|---|---|
| Total width | 350 |
| Row gap | 14 |
| Rail width | 28, `align-self: stretch`, `padding-bottom: 4`, internal gap 4 |
| Marker | 28 × 28, radius 14 (full), fill `action/pink-soft #fce7f3`, no border |
| Marker number | `Label/Sans` — Inter SemiBold 13 / 18, ls 0, `action/pink-press #be185d`, centred |
| Connector | **1.5px** wide (unchanged), radius 1, `border/strong #d2d2ce`, `flex: 1 0 0` — **the connector is kept on mobile** |
| Connector x offset | centre at **x = 14**; left edge x = 13.25; starts 4px below the marker (y = 32), ends 4px above the step bottom |
| Left inset of text column | **42** (= 28 + 14) |
| Content padding | `padding-top: 3`, `padding-bottom: 24` |
| Content width | 308 (= 350 − 42) |
| Content internal gap | 6 |
| Vertical gap between steps | **24px**, again from `padding-bottom: 24`; Steps container gap 0 |
| Height, title + description only | 83 (3 + 22 + 6 + 28 + 24) |

**Example slot (mobile)** — padding 12 / 8, radius 10, fill `#efefed`, gap 2. Label unchanged (`Label/Sans S`). Body drops to `Body/S` Inter Regular 14 / 22, ls −0.2% (−0.028px), `text/primary`.

**Media slot (mobile)** — container gap 8. Image width **308** (100%), height **197**, ratio 308 : 197 = **1.5635 : 1** (identical to desktop), radius 12, 1px `border/hairline`, `object-fit: cover`. Caption unchanged.

### Variant matrix

The atom's variants are boolean props, not a Type enum.

| Prop | Default | Effect |
|---|---|---|
| `Show connector` | ON | renders the 1.5px bar. **OFF on the last visible step only.** |
| `Show description` | ON | one-line explanation |
| `Show example` | OFF | sunken Example box |
| `Show media` | OFF | image + caption |
| `Number` | "1" | text property — see Open questions |
| `Viewport` | Desktop / Mobile | switches every measurement above |

### Type

| Element | Figma style | Family / size / weight / line-height / letter-spacing | Colour |
|---|---|---|---|
| Marker number, desktop | `Body/S Strong` | Inter · 14 · 600 · 20 · −0.2% (−0.028px) | `action/pink-press #be185d` |
| Marker number, mobile | `Label/Sans` | Inter · 13 · 600 · 18 · 0 | `action/pink-press #be185d` |
| Step title, desktop | `Heading/S` | Bricolage Grotesque · 21 · 600 · 26 · −1% (−0.21px) | `text/primary #141317` |
| Step title, mobile | `Heading/XS` | Bricolage Grotesque · 17 · 600 · 22 · −0.5% (−0.085px) | `text/primary #141317` |
| Explanation, desktop | `Article/Body Desktop` | Inter · 18 · 400 · 31 · −0.4% (−0.072px) | `text/secondary #55545b` |
| Explanation, mobile | `Article/Body Mobile` | Inter · 17 · 400 · 28 · −0.3% (−0.051px) | `text/secondary #55545b` |
| "Example" label | `Label/Sans S` | Inter · 12 · 500 · 16 · 0 | `text/muted #8a8991` |
| Example body, desktop | `Body/M` | Inter · 16 · 400 · 26 · −0.3% (−0.048px) | `text/primary #141317` |
| Example body, mobile | `Body/S` | Inter · 14 · 400 · 22 · −0.2% (−0.028px) | `text/primary #141317` |
| Media caption | `Label/Sans S` | Inter · 12 · 500 · 16 · 0 | `text/muted #8a8991` |

Every Bricolage Grotesque run carries `font-variation-settings: "opsz" 14, "wdth" 100`. Figma reports letter-spacing as a **percentage of font size**; the px value in brackets is what to ship.

### Tokens

`action/pink-soft #fce7f3` · `action/pink-press #be185d` · `border/strong #d2d2ce` · `border/hairline #e6e6e3` · `surface/sunken #efefed` · `text/primary #141317` · `text/secondary #55545b` · `text/muted #8a8991`

### Variants & states

Static content. No hover, focus, active, visited or disabled state is defined anywhere in the atom — the step is not interactive and contains no link or button node.

### Open questions

- **No interaction states at all.** If a step title ever becomes a deep link (`#step-3`), there is no designed `:hover`, `:focus-visible` or `:active`. Default: don't make it a link; if you must, add a `:focus-visible` ring from the global focus token rather than inventing one here.
- **Aspect ratio is not exactly 16:10.** Both viewports agree on 1.5636 : 1 (688×440, 308×197), which is 16 : 10.23, not 16 : 10 (1.6). Decide which is authoritative: ship `aspect-ratio: 688 / 440` to match Figma pixel-for-pixel, or `16 / 10` to match the written rule and accept a 10px height difference on desktop.
- **Numbering source.** `Number` is a plain text property per instance and the step order is authored by hand (step 1..6 are six separate pre-numbered instances). In code this should almost certainly become an `<ol>` with generated counters — but then hiding an intermediate step would renumber, whereas Figma would not. Confirm: automatic.
- **Single step.** With one step the connector must be OFF, leaving a lone 32px circle with 32px of dead padding below it. Nothing in the design covers this; the annotation says 2–6 steps, so treat one step as invalid input.
- **Very tall step.** The connector is `flex: 1`, so it stretches indefinitely — verified up to the 572px media step. No max length or dashed/fade treatment is specified.
- **Third grey.** The Example slot uses `surface/sunken #efefed`, which is a third surface grey on top of `#f9f9f9` page and `#ffffff` card, contradicting the "no third grey level" rule. Confirm `#efefed` is sanctioned for this slot specifically.

---

## Article / Step-by-Step Workflow

Component set `278:4831`. Desktop: Simple `278:3837`, With examples `278:3938`, With media `278:4037`, With takeaway `278:4136`, Full `278:4235`. Mobile: Simple `278:4334`, With examples `278:4435`, With media `278:4534`, With takeaway `278:4633`, Full `278:4732`.

### Purpose

The canonical AIGE step-by-step article pattern: section title, optional eyebrow and intro, 2–6 Article / Workflow Step instances joined by **one** thin connector, and an optional Key takeaway. All five Types share one layout — they differ only in which optional slots are switched on.

### Use for / Do not use for

Exact lists from the annotation frame `279:4131` (see verbatim block above).

**USE FOR** — 2–6 sequential steps · Workflows, setup instructions and how-to sequences · Testing, prompting, generation and editing processes · Any process where order matters.

**DO NOT USE FOR** — Unrelated tips or normal bullet lists · Pros / cons or feature lists · FAQ · Categories where order does not matter.

Component description adds: *Do not put steps in separate cards. No retro UI.*

### Anatomy

```
Step-by-Step Workflow (column)
├─ Header (column)
│  ├─ Eyebrow (row)                     ← optional · Show eyebrow (default OFF)
│  │  ├─ Mark (6×6 square)
│  │  └─ Label text
│  ├─ Title (H2)                        ← always
│  └─ Intro (body)                      ← optional · Show intro (default ON)
├─ Steps (column, gap 0)
│  ├─ Step 1  (Article / Workflow Step) ← always
│  ├─ Step 2                            ← always
│  ├─ Step 3                            ← always
│  ├─ Step 4                            ← optional · Show step 4 (default OFF)
│  ├─ Step 5                            ← optional · Show step 5 (default OFF)
│  └─ Step 6                            ← optional · Show step 6 (default OFF)
└─ Key takeaway (column)                ← on in "With takeaway" and "Full"
   ├─ Divider (row)
   │  ├─ Accent (40 × 2, pink)
   │  └─ Rule (flex:1, 1px hairline)
   ├─ Space (10 × 6 spacer)
   ├─ Label "KEY TAKEAWAY"
   └─ Conclusion (one sentence)
```

Steps 1–3 are hard-visible; 4–6 are behind booleans. `Show connector` is ON on every step except the last visible one.

### Desktop

Root: `display:flex; flex-direction:column; gap:28px; width:740px`.

| Block | Spec |
|---|---|
| Header | column, gap 10, width 100%, height 81 with intro on |
| Eyebrow | row, gap 10. Mark 6 × 6, `border-radius: 1`, fill `action/pink #db2777`. Text `Label/Sans` Inter SemiBold 13 / 18, ls 0, `text/secondary #55545b`. Default copy "How-to". Total 64 × 18 |
| Title | `Article/H2 Desktop` — Bricolage Grotesque Bold 32 / 40, ls −1.5% (−0.48px), `text/primary #141317`, width 100% |
| Intro | `Article/Body Desktop` — Inter Regular 18 / 31, ls −0.4% (−0.072px), **`text/primary #141317`** (note: primary, unlike the per-step explanation which is secondary) |
| Header → Steps gap | 28 (metadata: header ends y=81, Steps starts y=109) |
| Steps container | column, **gap 0**, width 100%, `overflow: clip`. All step spacing comes from each step's `padding-bottom: 32` |
| Step geometry | see Article / Workflow Step · Desktop. Marker 32, connector 1.5px at x=16, text inset 52, step gap 32 |
| Steps → Key takeaway gap | 28 |
| Key takeaway | column, gap 10, width 100%, **height 108** |
| — Divider | row, `align-items: flex-end`, width 100%, height 2. Accent 40 × 2 fill `action/pink #db2777`; Rule `flex:1` height **1px** fill `border/hairline #e6e6e3` |
| — Space | 10 × 6 empty spacer (so the real gap Divider → Label is 10 + 6 + 10 = 26) |
| — Label | "KEY TAKEAWAY" `Label/Sans` Inter SemiBold 13 / 18 with a **local +6% letter-spacing override (0.78px)**, `action/pink-press #be185d` |
| — Conclusion | `Heading/S` Bricolage Grotesque SemiBold 21 / 26, ls −1% (−0.21px), `text/primary #141317`, width 100% |

Measured totals (3 steps visible): Simple 740 × 409 · With examples 740 × 481 · With media 740 × 881.

### Mobile

Root: `display:flex; flex-direction:column; gap:20px; width:350px`.

| Block | Spec |
|---|---|
| Header | column, gap **8**, width 100% |
| Eyebrow | identical tokens to desktop (Mark 6 × 6 `action/pink`, `Label/Sans` `text/secondary`) |
| Title | `Article/H2 Mobile` — Bricolage Grotesque Bold 26 / 32, ls −1% (−0.26px), `text/primary #141317` |
| Intro | `Article/Body Mobile` — Inter Regular 17 / 28, ls −0.3% (−0.051px), `text/primary #141317` |
| Header → Steps gap | 20 |
| Steps container | column, **gap 0**, width 100%, `overflow: clip` |
| Step geometry | see Article / Workflow Step · Mobile. Marker 28, **connector kept** at 1.5px, x=14, text inset 42, step gap 24 |
| Steps → Key takeaway gap | 20 |
| Key takeaway | **not directly verified — Figma rate limit.** Expect the same tree (Accent 40 × 2 pink + 1px hairline rule, 10 × 6 spacer, `Label/Sans` +6% pink-press label) with the Conclusion dropping to `Heading/XS` 17 / 22 to match the mobile heading scale. Verify `278:4633` / `278:4732` before shipping. |

### Variant matrix

Verified desktop geometry (`278:3837`, `278:4235` via design context; `278:3938`, `278:4037` via metadata):

| Type | Eyebrow | Intro | Step example | Step media | Key takeaway | Height (3 steps) |
|---|---|---|---|---|---|---|
| Simple `278:3837` | off | on | — | — | — | 409 |
| With examples `278:3938` | off | on | **step 1** (h 172) | — | — | 481 |
| With media `278:4037` | off | on | — | **step 2** (h 572) | — | 881 |
| With takeaway `278:4136` | off | on | — | — | **on** | ~517 (inferred) |
| Full `278:4235` | off | on | **step 1** | **step 2** | **on** | — |

Mobile variants mirror this one-for-one (`4334` / `4435` / `4534` / `4633` / `4732`).

Independent booleans on every Type: `Show eyebrow` (default OFF), `Show intro` (default ON), `Show step 4` / `5` / `6` (all default OFF).

**Important:** *which* step carries the example or the media is authored per instance, not derived from the Type. The Type variants just demonstrate the convention — example on the first step, media on the second. In Astro this should be per-step data (`{ title, body, example?, media? }`), with a section-level `takeaway?`.

### Type

Adds to the atom's styles:

| Element | Figma style | Family / size / weight / line-height / letter-spacing | Colour |
|---|---|---|---|
| Section title, desktop | `Article/H2 Desktop` | Bricolage Grotesque · 32 · 700 · 40 · −1.5% (−0.48px) | `text/primary #141317` |
| Section title, mobile | `Article/H2 Mobile` | Bricolage Grotesque · 26 · 700 · 32 · −1% (−0.26px) | `text/primary #141317` |
| Intro, desktop | `Article/Body Desktop` | Inter · 18 · 400 · 31 · −0.4% (−0.072px) | `text/primary #141317` |
| Intro, mobile | `Article/Body Mobile` | Inter · 17 · 400 · 28 · −0.3% (−0.051px) | `text/primary #141317` |
| Eyebrow label | `Label/Sans` | Inter · 13 · 600 · 18 · 0 | `text/secondary #55545b` |
| "KEY TAKEAWAY" | `Label/Sans` + override | Inter · 13 · 600 · 18 · **+6% (0.78px)** | `action/pink-press #be185d` |
| Takeaway conclusion | `Heading/S` | Bricolage Grotesque · 21 · 600 · 26 · −1% (−0.21px) | `text/primary #141317` |

### Tokens

`action/pink #db2777` · `action/pink-soft #fce7f3` · `action/pink-press #be185d` · `border/hairline #e6e6e3` · `border/strong #d2d2ce` · `surface/sunken #efefed` · `text/primary #141317` · `text/secondary #55545b` · `text/muted #8a8991`

### Variants & states

Five Types × two Viewports = 10 variants, all static. No hover / focus / active / disabled states defined. Nothing is interactive.

### Open questions

- **The media-below-step rule is a code-only rule.** Figma only ever renders media *inside* the step at 100% of the text column and the fixed 1.5636 ratio. The "wider or portrait screenshot goes BELOW the step as its own figure, aligned with the step text" case has **no Figma node** — decide: (a) does "below the step" mean after the step's `padding-bottom: 32`, i.e. between two steps, and if so does the connector run past it? (b) does "aligned with the step text" mean left edge at 52px desktop / 42px mobile (so the figure is 688 / 308 wide, same as in-step media — which makes the two cases visually identical), or does it mean full 740px breakout with only the *caption* aligned at 52? The second reading is the only one that makes the rule mean anything. Needs a designed example.
- **Which widths trigger media-below.** "Wider or portrait" is not a number. Proposed threshold: move the figure below the step when the source aspect ratio is < 1.3 (portrait/square) or when the intended display width exceeds the 688px text column. Confirm.
- **Key takeaway on mobile is unverified** (`278:4633`, `278:4732`) — rate limit. Confirm the Conclusion type ramp and the 40 × 2 accent width at 350px.
- **"With takeaway" desktop (`278:4136`) was not fetched** — rate limit. Its slot set is inferred from the set naming plus the Full variant. Confirm it has no example and no media.
- **Connector ownership.** Today the connector is a per-step child, so the "one thin connector" the docs describe is really N segments that abut at exactly 0 gap only because the last one ends 4px above the step edge and the next starts 4px below its marker — leaving an **8px real gap plus the 32px marker** between segments. A CSS implementation could instead draw one absolutely-positioned line on the `<ol>` and punch the circles over it. Confirm which the designer intends; they are not pixel-identical.
- **Eyebrow copy** defaults to "How-to" and is off in all five Types. Is it ever on in production articles?
- **Intro colour** is `text/primary` while the per-step explanation is `text/secondary`. Confirm this is deliberate rather than a leftover.

---

## Article / Horizontal Process

Node `349:15054`. **Single node, no variants, no Viewport property — desktop only.**

### Purpose

A compact one-line summary of an ordered checklist at breakout width: small numbered markers with light arrows between them. It is a *glanceable* restatement, not an instruction set — it carries one short line per node and nothing else (no titles, no bodies, no media).

### Use for / Do not use for

No annotation frame exists for this component, and it carries no Figma component description. Derived from the design and the system rules:

| | |
|---|---|
| **Use for** | A 5-item ordered checklist that must read as one horizontal line at breakout width; a recap of a sequence already explained; question-style prompts ("Who is in the panel?" → "What are they doing?" → …). |
| **Do not use for** | Steps that need an explanation, an example, media or a takeaway — that is Step-by-Step Workflow. Any mobile rendering. Anything other than exactly 5 nodes without reworking the component. Unordered categories. |

### Anatomy

```
Horizontal Process (column, gap 14, width 960)
├─ Label (text, muted, uppercase copy)
└─ Row (row, gap 0, align-items:start)
   ├─ Node 1 (column, flex:1, padding-right:12)
   │  ├─ Marker (24 circle) → Number
   │  └─ Text (one line)
   ├─ Arrow (28 × 24)
   ├─ Node 2 … Arrow … Node 3 … Arrow … Node 4 … Arrow … Node 5
```

No optional slots. All five node texts and the label are required text properties (`label`, `item1`…`item5`). The last node has no trailing arrow.

### Desktop

| Property | Value |
|---|---|
| Total width | **960** — this is the exact breakout width (the brief's "900–1000px" band; ship 960) |
| Root | column, gap 14, `overflow: clip`, no background, no border, no padding |
| Label | `Label/Sans S` Inter Medium 12 / 16, ls 0, `text/muted #8a8991`, width 100%. Copy is authored in caps ("FIVE THINGS PER PANEL") — **no `text-transform`** in the design |
| Row | row, `align-items: flex-start`, gap 0, width 100%, `overflow: clip` |
| Node count | **5, fixed** |
| Node | `flex: 1 0 0; min-width: 0`, column, gap 10, `padding-right: 12` |
| Node width | 960 − (4 × 28 arrows) = 848 ÷ 5 = **169.6** per node; **157.6** usable text width after the 12px right padding |
| Node marker | 24 × 24, `border-radius: 12` (full), fill `action/pink-soft #fce7f3`, no border, flex centred |
| Marker number | `Label/Sans S` Inter Medium 12 / 16, ls 0, **`action/pink #db2777`** — note: `pink`, not `pink-press`, and Medium 500, not SemiBold. Deliberately lighter than the vertical step markers |
| Node text | `Body/S` Inter Regular 14 / 22, ls −0.2% (−0.028px), **`text/primary #141317`** (primary, not secondary) |
| Node background / border / radius | none — nodes are not cards |
| Arrow | 28 wide × 24 tall, flex, `justify-content: center`, `align-items: flex-start`, `padding-top: 4` |
| Arrow glyph | the literal character **`→` (U+2192)**, not an SVG or icon component. `Body/S` Inter Regular 14 / 22, ls −0.028px, colour **`border/strong #d2d2ce`** |
| Arrow vertical alignment | `padding-top: 4` inside a 24-tall box centres the 22px line box on the marker's centre line |
| Arrow count | 4 (between nodes only) |

### Mobile

**There is no mobile variant.** In practice:

- Below the desktop breakpoint, do not shrink or scroll this component — 157px per node is already at its floor, and the node text would wrap to 3+ lines.
- Render the same five items as **Article / Step-by-Step Workflow (Viewport = Mobile, Type = Simple)** instead: marker 28, connector kept, text inset 42, step gap 24.
- The Horizontal Process `label` becomes the workflow's section Title (title-cased, since `Article/H2 Mobile` is not an all-caps style); each `itemN` becomes a step. Because the workflow expects `title + one explanation` and Horizontal Process carries only one string per node, the fallback either uses the string as the step **title with `Show description` OFF**, or requires the author to supply five extra explanation lines. See Open questions.
- Implementation shape: author the content once as five items, render `<HorizontalProcess>` inside a `@media (min-width: …)` container and `<StepByStep type="simple">` below it — do **not** duplicate the copy.

### Variant matrix

| Type | Nodes | Arrows | Label | Takeaway | Media |
|---|---|---|---|---|---|
| (only variant) | 5 fixed | 4 | required | — | — |

### Type

| Element | Figma style | Family / size / weight / line-height / letter-spacing | Colour |
|---|---|---|---|
| Label | `Label/Sans S` | Inter · 12 · 500 · 16 · 0 | `text/muted #8a8991` |
| Marker number | `Label/Sans S` | Inter · 12 · 500 · 16 · 0 | `action/pink #db2777` |
| Node text | `Body/S` | Inter · 14 · 400 · 22 · −0.2% (−0.028px) | `text/primary #141317` |
| Arrow `→` | `Body/S` | Inter · 14 · 400 · 22 · −0.2% (−0.028px) | `border/strong #d2d2ce` |

No Bricolage Grotesque anywhere in this component — it is all Inter.

### Tokens

`text/muted #8a8991` · `action/pink #db2777` · `action/pink-soft #fce7f3` · `text/primary #141317` · `border/strong #d2d2ce` · styles `Label/Sans S`, `Body/S`

### Variants & states

One variant, static, no hover / focus / active / disabled. Not interactive.

### Open questions

- **Fewer or more than 5 nodes.** Hard-coded to 5 with no show/hide booleans. If a 3- or 4-node version is needed, decide whether nodes stay `flex: 1` (wider nodes) or keep a fixed 169.6px and left-align (leaving trailing whitespace). Same for 6+.
- **The mobile fallback loses information.** Horizontal Process nodes carry one string; Step-by-Step steps want title + explanation. Confirm the intended mapping: string → step title with description hidden (cleanest, and the questions read fine as titles), or require paired explanations in the content model.
- **Breakout width vs. the reading column.** 960 against a 740 column means −110px on each side. Confirm this is the system's single breakout width and that it is shared with the wide-image and comparison components, rather than being local to this node.
- **The arrow is a text glyph.** `→` renders differently across fonts and is announced by screen readers ("right arrow"). Recommend `aria-hidden` on the arrows, or replacing them with a 1px `border/strong` rule, or an inline SVG at the same 28 × 24 box. Confirm with the designer which is acceptable.
- **No focus target.** If these ever anchor-link down to the matching step, `:focus-visible` is undefined.
- **Uppercase is authored, not styled.** The label copy is typed in caps with `letter-spacing: 0`. Confirm whether to ship literal caps in the content (matching Figma) or `text-transform: uppercase` with tracking — the "KEY TAKEAWAY" label in Step-by-Step adds +6% tracking, so the two caps labels are inconsistent.

---

## Cross-component notes

- **Three markers, three treatments.** Desktop vertical step 32/`pink-soft`/`pink-press`/Inter 600 14; mobile vertical step 28/`pink-soft`/`pink-press`/Inter 600 13; horizontal 24/`pink-soft`/**`pink`**/Inter 500 12. The fill is the only shared value.
- **Two pinks with jobs.** `action/pink #db2777` = accents and light markers (eyebrow mark, takeaway accent rule, horizontal numbers). `action/pink-press #be185d` = numbers that must read against `pink-soft`, and the "KEY TAKEAWAY" label.
- **The connector is the identity of the pattern.** 1.5px `border/strong #d2d2ce`, kept on mobile, `flex: 1` so it stretches with any content height, and OFF on the last visible step. Do not substitute a 1px hairline (`#e6e6e3`) — the connector is deliberately the darker grey.
- **No per-step cards, confirmed in the design.** No step node has a background, border, radius or padding of its own.

### Unverified in this pass

Figma MCP rate limit was reached before these could be read. Everything attributed to them above is inference, marked as such:

| Node | What is missing |
|---|---|
| `278:4136` | With takeaway / Desktop — slot set and total height |
| `278:4435` `278:4534` `278:4633` `278:4732` | All four non-Simple mobile variants — confirm mobile Key takeaway type ramp and accent geometry |

---

## Follow-up pass — mobile `Type=With takeaway` verified (278:4633)

Read directly after the main pass; supersedes the inferred row for this variant.

| Part | Mobile value (350px) |
|---|---|
| Root | column, gap 20 |
| Header | column, gap 8 |
| Eyebrow (off by default) | 6×6 `action/pink` mark, radius 1, gap 10, then Label/Sans 13/18 SemiBold `text/secondary`, copy `How-to` |
| Title | Article/H2 Mobile — Bricolage Bold 26/32, tracking −0.26px, `text/primary` |
| Intro | Article/Body Mobile — Inter 17/28, tracking −0.051px, `text/primary` (note: **primary**, not secondary) |
| Steps container | column, gap **0** — separation comes from each step's `padding-bottom: 24` |
| Marker | 28×28, radius 14, fill `action/pink-soft`, number Inter SemiBold 13/18 `action/pink-press`, centred |
| Rail | width 28, column, gap 4, `padding-bottom: 4`, connector 1.5px × `flex:1`, radius 1, fill `border/strong` |
| Rail → content gap | 14 |
| Content | `flex:1`, column, gap 6, `padding-top: 3`, `padding-bottom: 24` |
| Step title | Heading/XS — Bricolage SemiBold 17/22, tracking −0.085px, `text/primary` |
| Step description | Article/Body Mobile — Inter 17/28, tracking −0.051px, `text/secondary` |
| Example slot | fill `surface/sunken #efefed`, radius 10, padding 12/8, gap 2; label Inter Medium 12/16 `text/muted` copy `Example`; body Inter 14/22 `text/primary` |
| Media slot | full width, height **197**, radius 12, 1px `border/hairline`, `object-cover`; caption Inter Medium 12/16 `text/muted`, gap 8 |
| Last visible step | connector off (`showConnector={false}` on step 3 here) |

**Key takeaway slot** (the part that was missing):

| Part | Value |
|---|---|
| Container | column, gap 8 |
| Divider | 40×2 `action/pink` accent, then 1px `border/hairline` rule filling the remainder, `align-items: flex-end` |
| Spacer | 4px |
| Eyebrow | `KEY TAKEAWAY`, Label/Sans — Inter SemiBold 13/18, tracking **+0.78px**, `action/pink-press`, uppercase as authored |
| Body | Heading/XS — Bricolage SemiBold 17/22, tracking −0.085px, `text/primary` |

Step count in this variant: 3 visible (`showStep4/5/6` all false); steps 4–6 are pre-numbered instances, confirming **numbering is authored, not automatic**.

Still inferred after this pass: `278:4435` (With examples / Mobile), `278:4534` (With media / Mobile), `278:4732` (Full / Mobile). All three compose the same fully-measured Workflow Step atom, so only their header/takeaway ramps are unconfirmed.
