# Usage notes (transcribed from Figma)

Verbatim transcription of the `Doc / Usage Note` annotation cards that sit beside the
article-system components in Figma file `iaUwrRvpkEq7RrBpPLxA6j`, plus the one standalone
usage annotation frame.

Source boards:

- `162:2559` — Showcase — Article components (Desktop)
- `164:3234` — Showcase — Article components (Mobile)
- `279:4131` — Usage — Article / Step-by-Step Workflow (standalone annotation frame)
- `158:2712` — `Doc / Usage Note` (the annotation card component itself)

Every heading below is the component name exactly as the note writes it, which is not always
the name of the live component it sits next to — see **Notes on coverage**. Text is copied
verbatim, including typography, em dashes and curly quotes; nothing is shortened or corrected.

---

## Guide / Article Header

Note node `162:2607` (desktop board). Sits beside live component `Guide / Article Header` (`162:2587`).

> Simple guide article header: breadcrumb, title, one-sentence description, author + updated date + read time.

- **Use**
  - Top of every guide article.
- **Don’t use**
  - Serif decks, “tested” lab labels, mono metadata or huge editorial intros.

---

## Guide / In This Guide

Note node `162:2647` (desktop board). Sits beside live component `Article / In This Guide (TOC)` (`162:2619`).

> Sticky desktop table of contents (right column, 220–260 wide).

- **Use**
  - Guide articles on desktop only; highlight the section in view.
- **Don’t use**
  - On mobile (use Guide / Jump to Section) or with terminal styling.

---

## Guide / Tip

Note node `162:2668` (desktop board). Sits beside live component `Article / Tip` (`162:2660`).

> A light, optional hint that saves the reader time.

- **Use**
  - Practical shortcuts inside a section. Max 1–2 per section.
- **Don’t use**
  - Warnings, rules or the main answer. Never stack two callouts.

---

## Guide / Important

Note node `162:2689` (desktop board). Sits beside live component `Guide / Important` (`162:2680`).

> A restrained warning about a mistake that costs coins or ruins results.

- **Use**
  - Rules the reader must follow to avoid a bad outcome.
- **Don’t use**
  - General tips or marketing. Don’t use for every caveat.

---

## Guide / Quick Answer

Note node `162:2709` (desktop board). Sits beside live component `Guide / Quick Answer` (`162:2701`).

> The short answer to the question the article is about.

- **Use**
  - Once, near the top of an article, right after the intro.
- **Don’t use**
  - Mid-article summaries (use Key takeaway) or long paragraphs.

---

## Guide / What I Learned

Note node `162:2730` (desktop board). Sits beside live component `Guide / What I Learned` (`162:2721`).

> A personal finding from Herman’s own testing.

- **Use**
  - After a test or experience, to state what it taught us.
- **Don’t use**
  - Opinions without testing, quotes or serif pull-quote styling.

---

## Guide / Key Takeaway

Note node `162:2752` (desktop board). Sits beside live component `Guide / Key Takeaway` (`162:2742`).

> A one-sentence summary of a section.

- **Use**
  - At the end of a long section, max once per section.
- **Don’t use**
  - The article’s main answer (use Quick answer) or lists.

---

## Guide / Example Prompt

Note node `162:2863` (desktop board). Sits beside live components `Article / Prompt` (`162:2837`, `162:2849`).

> A prompt the reader can copy.

- **Use**
  - Paragraph = normal readable sans (default). JSON = only when the prompt really is JSON — the code block is the ONLY place monospace is allowed.
- **Don’t use**
  - Monospace for normal prompts, dark terminal bars, or long code dumps.

---

## Guide / Image + Caption

Note node `162:2881` (desktop board). Sits beside live component `Article / Image + Caption` (`162:2877`).

> A real screenshot with a short caption.

- **Use**
  - Show where something is in the product.
- **Don’t use**
  - Decorative images or captions in mono/uppercase.

---

## Guide / Comparison A/B

Note node `162:2914` (desktop board). Sits beside live component `Article / Comparison A/B` (`162:2893`).

> Two options side by side with a clear verdict (text comparison).

- **Use**
  - Explaining two approaches or settings. For image evidence use Guide / AIGE Test.
- **Don’t use**
  - More than two options, or tables with old-school styling.

---

## Guide / AIGE Test

Note node `162:3069` (desktop board). Sits beside live components `Article / AIGE Test` (`162:2926`, `162:2980`).

> The strongest article component — a modern product test result with real evidence.

- **Use**
  - When we ran an actual test: title, one-line setup, test setup, 1–4 result images (evidence is the focus), result, optional What I learned.
- **Don’t use**
  - Without real screenshots. Never add test numbers, fake dates, IDs, black title bars or monospace.

---

## Guide / FAQ Item

Note node `162:3096` (desktop board). Sits beside live components `Guide / FAQ Item` (`162:3083`, `162:3089`).

> One accordion question.

- **Use**
  - FAQ block at the end of an article (4–8 items).
- **Don’t use**
  - For main content that everyone needs.

---

## Guide / Related Guides

Note node `162:3134` (desktop board). Sits beside live component `Article / Related Guides` (`162:3108`).

> 3 related article rows + link back to the hub.

- **Use**
  - End of every guide article, before the footer.
- **Don’t use**
  - Cards or thumbnails for related links.

---

## Guide / Search

Note node `162:3156` (desktop board). Sits beside live component `Guide / Search` (`162:3148`).

> The main functional element of a guide hub.

- **Use**
  - Centered in Guide / Hero on the dark background.
- **Don’t use**
  - Keyboard-shortcut chips in mono, or extra metadata under it.

---

## Guide / Start Here Row

Note node `162:3176` (desktop board). Sits beside live component `Guide / Start Here Row` (`162:3168`).

> A slightly richer navigation row for the 3 best starting points.

- **Use**
  - Only in the Start here block at the top of a guide hub (max 3–4 rows). Optional small thumbnail.
- **Don’t use**
  - As big promo cards, or for every article (use Guide / Article Row).

---

## Guide / Article Row

Note node `162:3201` (desktop board). Sits beside live components `Guide / Article Row` (`162:3188`, `162:3194`).

> The primary, scalable navigation pattern for guides.

- **Use**
  - Category lists, related guides, search results. Title + optional tiny meta (read time) + arrow + hairline divider. Resize width freely.
- **Don’t use**
  - Cards for every article, badges, icons or mono metadata.

---

## Guide / Category

Note node `162:3258` (desktop board). Sits beside live component `Guide / Category` (`162:3213`).

> A topic module: small icon, title, one-line description, guide count, the first 4 guides and “View all N guides”.

- **Use**
  - Desktop 2-column grid built from horizontal rows, so paired modules start at the same Y. Mobile uses Guide / Category Accordion.
- **Don’t use**
  - Large colorful cards, gradients, big illustrations or mono counts.

---

## Guide / Score Chip

Note node `162:3308` (desktop board). Sits beside live components `Guide / Score Chip` (`162:3298`, `162:3301`, `162:3304`).

> Sans score chip for guide pages (no mono). High ≥ 8.0 green, Mid 5.0–7.9 orange, Low < 5.0 red.

- **Use**
  - Related review rows inside guides. For sticky headers and brand CTAs use Score / Compact ('8.8', no /10).
- **Don’t use**
  - For anything that is not a score.

---

## Guide / Hero

Note node `162:3322` (desktop board). Sits beside live component `Guide / Hero` (`162:3333`).

> The dark, centered guide-hub hero. The site header is part of it (Nav Ink, no divider) so header + hero read as one section.

- **Use**
  - Top of every product guide hub: title, one line, search, optional 4 popular shortcuts.
- **Don’t use**
  - Breadcrumbs, logos, counts, “tested on paid accounts”, library labels or a white header above.

---

## Guide / Jump to Section

Note node `164:3300` (mobile board). Sits beside live components `Guide / Jump to Section` (`164:3271`, `164:3278`).

> Mobile table of contents that sticks under the header.

- **Use**
  - Guide articles on mobile instead of the permanent TOC.
- **Don’t use**
  - On desktop, or with mono/uppercase labels.

---

## Guide / Category Accordion

Note node `164:3905` (mobile board). Sits beside live components `Guide / Category Accordion` (`173:3884`, `173:3893`).

> Mobile topic accordion: name, one-line description, guide count, chevron.

- **Use**
  - Browse by topic on mobile. Tap to expand; one open at a time.
- **Don’t use**
  - On desktop, or with all guides listed open by default.

---

## Article / Step-by-Step Workflow

Standalone annotation frame `279:4131`, titled “Usage — Article / Step-by-Step Workflow”. This note
is not a `Doc / Usage Note` instance: it is a card with its own, richer set of labelled groups
(USE FOR, DO NOT USE FOR, COPY RULE, HOW TO BUILD IT, CANONICAL RULE).

> The canonical AIGE pattern for anything where order matters: numbered soft-pink markers joined by one thin connector, a short action title and one short explanation per step.

- **USE FOR**
  - • 2–6 sequential steps
  - • Workflows, setup instructions and how-to sequences
  - • Testing, prompting, generation and editing processes
  - • Any process where order matters
- **DO NOT USE FOR**
  - • Unrelated tips or normal bullet lists
  - • Pros / cons or feature lists
  - • FAQ
  - • Categories where order does not matter
- **COPY RULE**
  - Each step = SHORT ACTION TITLE + ONE SHORT EXPLANATION.
  - Good: “Generate two images” + “Look for what is already right before adding detail.”
  - Bad: “Initial image generation and analysis” followed by a long paragraph.
- **HOW TO BUILD IT**
  - • Pick a Type: Simple, With examples, With media, With takeaway or Full. All five share one layout.
  - • 2–6 steps: turn on Show step 4, 5 or 6. Turn Show connector OFF on the last visible step and ON on every step above it.
  - • Example = short plain example text. For a real prompt or JSON, swap in Guide / Example Prompt. Never use mono for explanations.
  - • Media = Guide / Image + Caption inside the step. Keep it secondary to the instruction.
  - • Key takeaway: one per workflow, one sentence, after the last step.
- **CANONICAL RULE**
  - This is the only step-by-step layout for AIGE articles. When an article has ordered steps, use this pattern and change its content. Do not design a new step layout. Do not force it onto content that is not sequential.

---

## Doc / Usage Note (the annotation card itself)

Base component `158:2712`. Its Figma component description reads, verbatim:

> Documentation only — sits beside components on boards. Sans, no mono.

Anatomy — four text slots, in this order, each label verbatim as it appears on the card:

1. **Component name** (`158:2713`) — Heading/XS, Bricolage Grotesque SemiBold 17/22, `text/primary`.
2. **What** (group `158:2714`; label `158:2715`, body `158:2716`) — label Body/S Strong in `text/primary`, body Body/S in `text/secondary`.
3. **Use** (group `158:2717`; label `158:2718`, body `158:2719`) — same styling as What.
4. **Don’t use** (group `158:2720`; label `158:2721`, body `158:2722`) — label in `score/low` (`#dc2626`), body in `text/secondary`.

Layout: vertical stack, 12px gap between groups, 2px gap between a label and its body, default
width 340. Fonts: Heading/XS (Bricolage Grotesque SemiBold 17/22, tracking −0.5), Body/S Strong
(Inter Semi Bold 14/20), Body/S (Inter Regular 14/22). No monospace anywhere.

Default (unoverridden) content of the component, verbatim:

- Component name: `Guide / Tip`
- **What**
  - A light, optional hint that saves the reader time.
- **Use**
  - Practical shortcuts inside a section.
- **Don’t use**
  - Warnings or the main answer.

Note that the standalone `279:4131` card uses a different, larger format: a bordered
`surface/card` panel with 28px padding, a 16px radius, and `Label/Sans` (Inter Semi Bold 13/18)
group labels in all caps, plus three groups the `Doc / Usage Note` component does not have
(COPY RULE, HOW TO BUILD IT, CANONICAL RULE).

---

## Notes on coverage

### Transcription completeness

All 22 requested nodes were read and transcribed in full. No note text came back truncated,
clipped or unreadable, so nothing below is a guess. Two details worth recording exactly as the
API returned them: the Score Chip note contains a literal `<` (`Low < 5.0 red`), and the same
note writes the cross-reference with straight single quotes — `Score / Compact ('8.8', no /10)`.

### Components that have a usage note

Desktop showcase board (`162:2559`) — one `Doc / Usage Note` per row, 19 rows, all present:

| Usage note | Live component it annotates |
| --- | --- |
| Guide / Article Header | Guide / Article Header |
| Guide / In This Guide | Article / In This Guide (TOC) |
| Guide / Tip | Article / Tip |
| Guide / Important | Guide / Important |
| Guide / Quick Answer | Guide / Quick Answer |
| Guide / What I Learned | Guide / What I Learned |
| Guide / Key Takeaway | Guide / Key Takeaway |
| Guide / Example Prompt | Article / Prompt |
| Guide / Image + Caption | Article / Image + Caption |
| Guide / Comparison A/B | Article / Comparison A/B |
| Guide / AIGE Test | Article / AIGE Test |
| Guide / FAQ Item | Guide / FAQ Item |
| Guide / Related Guides | Article / Related Guides |
| Guide / Search | Guide / Search |
| Guide / Start Here Row | Guide / Start Here Row |
| Guide / Article Row | Guide / Article Row |
| Guide / Category | Guide / Category |
| Guide / Score Chip | Guide / Score Chip |
| Guide / Hero | Guide / Hero |

Mobile showcase board (`164:3234`) — 19 items, each with its own `Doc / Usage Note`. Seventeen
cover the same components as the desktop notes; the two mobile-only patterns are
**Guide / Jump to Section** (`164:3300`) and **Guide / Category Accordion** (`164:3905`),
transcribed above. The mobile board also carries a second AIGE Test item,
“Guide / AIGE Test (4 results)” (`164:3727`); its note (`164:3728`) was outside the requested set
and has not been read, so whether its text differs from the desktop Guide / AIGE Test note is
unverified.

Documented, but not by a `Doc / Usage Note` card:

- **Article / Step-by-Step Workflow** — documented only by the standalone annotation frame
  `279:4131`, in the richer USE FOR / DO NOT USE FOR / COPY RULE / HOW TO BUILD IT /
  CANONICAL RULE format. It has no row on either showcase board and no `Doc / Usage Note`
  instance anywhere.

### Components that do not have a usage note

- **Article / Step-by-Step Workflow** has no `Doc / Usage Note` card (see above). Its standalone
  annotation covers it, but it is absent from both showcase boards, so a reader working through
  the boards will never meet it.
- **Doc / Usage Note** itself (`158:2712`) has only a Figma component description; no usage-note
  card documents the annotation card.
- Desktop-only patterns (Guide / In This Guide, Guide / Category, Guide / Score Chip) have no
  note on the mobile board, and mobile-only patterns (Guide / Jump to Section, Guide / Category
  Accordion) have no note on the desktop board. This looks deliberate rather than a gap: each
  note already states which viewport it belongs to.

Inventory caveat: the master `Article / …` components are **not** on page `01 · Components`
(`50:4`). A section note on that page says “Guide hub and navigation components. Article patterns
live on 02 · Article Components.”, but the file's page listing exposes only three pages
(`◆ Cover`, `01 · Components`, `04 · Archive / Old — DO NOT USE`), and the Archive page contains
only `ARCHIVE / OLD — Article components v1`. The live-component inventory above is therefore
derived from the component instances placed on the two showcase boards plus the standalone
annotation — it is accurate for everything on those boards, but it cannot rule out further
`Article / …` masters on the unlisted article-components page that have no usage note at all.
Confirmed masters on `01 · Components` § `06 · Guides & hubs` (`373:31850`) are Guide / Hero
(`158:2531`), Guide / Search (`155:2405`), Guide / Start Here Row (`155:2392`), Guide / Article Row
(`155:2377`), Guide / Category (`155:2520`), Guide / Category Accordion (`171:3926`) and
Guide / Score Chip (`156:2447`) — all seven have a usage note.

### Notes whose component name no longer matches the live component

Seven notes are still labelled `Guide / …` (or otherwise stale) while the component they sit
beside has been renamed to `Article / …`:

| Note says | Live component is | Nature of the mismatch |
| --- | --- | --- |
| Guide / In This Guide | Article / In This Guide (TOC) | prefix + `(TOC)` suffix dropped |
| Guide / Tip | Article / Tip | prefix only |
| Guide / Example Prompt | Article / Prompt | prefix **and** the name shortened to `Prompt` |
| Guide / Image + Caption | Article / Image + Caption | prefix only |
| Guide / Comparison A/B | Article / Comparison A/B | prefix only |
| Guide / AIGE Test | Article / AIGE Test | prefix only |
| Guide / Related Guides | Article / Related Guides | prefix only |

Both showcase boards repeat these stale names: the desktop row frames are named
`Row — Guide / Tip`, `Row — Guide / AIGE Test` and so on, and the mobile items likewise
(`Item — Guide / Example Prompt`), so the mismatch is in the board and note layers rather than in
one stray card. `Guide / Example Prompt` is the one to watch, because the note's name does not
merely carry an old prefix — there is no component called `Example Prompt` at all, and the
Step-by-Step Workflow annotation (`279:4131`) cross-references `Guide / Example Prompt` by that
non-existent name twice.

Cross-references inside note text use the same stale names and will not resolve against the live
component list: `Guide / Jump to Section` (fine), `Guide / AIGE Test` → `Article / AIGE Test`,
`Guide / Category Accordion` (fine), `Guide / Article Row` (fine), `Guide / Image + Caption` →
`Article / Image + Caption`, `Guide / Example Prompt` → `Article / Prompt`, and
`Score / Compact` (a component outside the article system, not verified here).

The nineteen note-to-component pairs marked as matching above were checked against the instance
names reported by Figma for the two showcase boards, so the twelve that match do so exactly.
