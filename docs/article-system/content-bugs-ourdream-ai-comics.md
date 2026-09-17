# Content bugs — OurDream AI Comics

Source: `src/content/guides/ourdream-ai-comics.html` (819 lines, hand-authored HTML imported with `?raw`). Edit the HTML directly — nothing here is a CSS or renderer bug. Block type names are from `docs/article-system/spec.md` §5.

## Summary

| # | Bug class | Instances | Lines affected |
|---|---|---|---|
| 1 | Fake `<h3>` (not a heading) | 29 | 29 |
| 2 | Markdown escapes leaking (`\=` `\+` `\.`) | 13 | 13 |
| 3a | Literal `###` inside `<li>` | 88 | 17 |
| 3b | Duplicated heading text + duplicated `id` | 7 elements / 3 texts | 7 |
| 3c | Paragraph that is entirely `<strong>` | 21 | 21 |
| 3d | Heading rendered as a plain `<p>` | 3 | 3 |
| 3e | `<p>` that is really a list item | 20 | 20 |
| 3f | `<blockquote>` used for a prompt, not a quote | 2 | 2 |
| 3g | Nested `<a>` inside `<a>` (invalid HTML) | 4 | 4 |
| 3h | Raw URL printed as link text | 5 | 5 |
| 3i | Stray markdown horizontal rule `<p>---</p>` | 1 | 1 |

Not found, no action needed: `<h1>`/`<h4>`+ (only `h2`/`h3` are used), out-of-order or skipped heading levels, empty elements, stray `<br>` runs, double-encoded entities, images with missing or placeholder `alt`.

## 1. Fake headings

121 `<h3>` elements; 29 of them are not headings. The recurring damage is the pattern "Don't write:" → `<h3>` bad prompt → "Instead write:" → `<p><strong>` good prompt. Both halves are prompt text, so almost every pair is one `promptComparison`.

### Prompt strings (19)

| Line | Current text | Should be |
|---|---|---|
| 274 | `A romantic bedroom.` | `promptComparison` — weak side; strong side is the `<p><strong>` at 277 |
| 289 | `No text, no speech bubbles.` | `prompt` (text variant) |
| 323 | `Panel 03: Sarah opens the door.` | `promptComparison` — weak side; strong side is 326 |
| 340 | `Sarah is still sitting on the bed, wearing her black dress without the jacket.` | `prompt` (text variant) |
| 386 | `Panel 01: Sarah sits at the bar looking slightly annoyed.` | `promptComparison` — strong side; weak side is 384 |
| 396 | `"You waited here this whole time?"` | `promptComparison` — strong side; weak side is 394 |
| 404 | `No text, no speech bubbles.` | `promptComparison` — strong side; weak side is 408 |
| 408 | `No dialogue, no bubbles, no text, no letters, no words, no captions, no signs...` | `promptComparison` — weak side (pair with 404) |
| 431 | `Remove the weird object on the table.` | `promptComparison` — weak side; strong side is 433 |
| 433 | `Wooden table with a glass of red wine on top.` | `promptComparison` — strong side (pair with 431) |
| 435 | `Delete the speech bubble.` | `promptComparison` — weak side; strong side is 437 |
| 437 | `Warm bedroom wall with soft amber lighting.` | `promptComparison` — strong side (pair with 435) |
| 452 | `Panel 01: Change her dress to black.` | one `prompt` (code variant) spanning 452–456 |
| 454 | `Panel 02: Add a glass of wine to the table.` | same `prompt` block, line 2 |
| 456 | `Panel 03: Change his shirt to white.` | same `prompt` block, line 3 |
| 480 | `Champagne bottle inside a silver ice bucket.` | `prompt` (text variant) |
| 533 | `"Where have you been?"` | `prompt` (text variant) — example speech-bubble text |
| 628 | `No text, no speech bubbles.` | `prompt` (text variant) |
| 691 | `Nice apartment with romantic lighting.` | `promptComparison` — weak side; strong side is 694 |

### DreamCoin calculations (7)

| Line | Current text | Should be |
|---|---|---|
| 561 | `10 × 20 DC \= 200 DreamCoins.` | `paragraph` (or `keyTakeaway`); also fix the `\=` |
| 585 | `3 characters \= 60 DC` | `bulletList` item — one list spanning 585–587; also fix `\=` |
| 586 | `10 pages \= 200 DC` | same `bulletList`, item 2 |
| 587 | `Total \= 260 DreamCoins` | same `bulletList`, total row |
| 590 | `\+100 DC` | `paragraph` (or a row of the same cost `bulletList`); fix `\+` |
| 592 | `\+160 DC` | `paragraph` / list row; fix `\+` |
| 594 | `\+500 DC` | `paragraph` / list row; fix `\+` |

### Other (3)

| Line | Current text | Should be |
|---|---|---|
| 453 | `BREAK` | literal separator line inside the 452–456 `prompt` block, not its own element |
| 455 | `BREAK` | same — second separator line in that `prompt` block |
| 526 | `Camera movement \+ character movement.` | `paragraph` (or `tip`); also fix the `\+` |

## 2. Markdown escapes leaking

| Line | Renders now | Should say |
|---|---|---|
| 338 | `…don't assume the AI remembers that in Panel 02\.` | `…in Panel 02.` |
| 526 | `Camera movement \+ character movement.` | `Camera movement + character movement.` |
| 561 | `10 × 20 DC \= 200 DreamCoins.` | `10 × 20 DC = 200 DreamCoins.` |
| 578 | `Generating a comic page \= <strong>20 DC</strong>` | `Generating a comic page = 20 DC` |
| 579 | `Generating a video \= <strong>500 DC</strong>` | `Generating a video = 500 DC` |
| 585 | `3 characters \= 60 DC` | `3 characters = 60 DC` |
| 586 | `10 pages \= 200 DC` | `10 pages = 200 DC` |
| 587 | `Total \= 260 DreamCoins` | `Total = 260 DreamCoins` |
| 590 | `\+100 DC` | `+100 DC` |
| 592 | `\+160 DC` | `+160 DC` |
| 594 | `\+500 DC` | `+500 DC` |
| 661 | `…checking the Model Sheet before generating Page 1\. If something…` | `…before generating Page 1. If something…` |
| 674 | `Remove the bar reference before generating Page 3\.` | `…before generating Page 3.` |

## 3. Other authoring issues

### 3a. Literal `###` inside list items (88 occurrences, 17 lines)

Every `<li>` in these `<ul>`s starts with a literal `### ` that renders as text. Delete the `### ` prefix from each item; the list stays a `bulletList`.

| Line | First item, verbatim | Items on line |
|---|---|---|
| 54 | `<li>### Sexual content involving anyone under 18 or who appears under 18</li>` | 8 |
| 280 | `<li>### Who is in the panel?</li>` | 5 |
| 301 | `<li>### A specific location</li>` | 4 |
| 316 | `<li>### Location</li>` | 5 |
| 375 | `<li>### <strong>Speech</strong> — normal character dialogue</li>` | 5 |
| 442 | `<li>### Wrong character</li>` | 8 |
| 466 | `<li>### Character</li>` | 6 |
| 468 | `<li>### Move them</li>` | 6 |
| 487 | `<li>### Wrong hair</li>` | 5 |
| 490 | `<li>### Move a character</li>` | 6 |
| 499 | `<li>### <strong>Original image:</strong> Best quality</li>` | 4 |
| 510 | `<li>### 10 seconds long</li>` | 5 |
| 623 | `<li>### Shorten your sentence</li>` | 4 |
| 633 | `<li>### 1–2 edits usually work well</li>` | 3 |
| 650 | `<li>### More regenerations</li>` | 3 |
| 659 | `<li>### Accessories</li>` | 4 |
| 726 | `<li>### Does the character actually look right?</li>` | 6 |

### 3b. Duplicated heading text and duplicated `id`

Duplicate `id` values break TOC anchors and in-page jumps — each surviving heading needs a unique `id`.

| Lines | Text | `id` | Fix |
|---|---|---|---|
| 289, 404, 628 | `No text, no speech bubbles.` | `no-text-no-speech-bubbles` ×3 | all three are fake headings (see §1) — becoming `prompt` blocks removes the ids entirely |
| 453, 455 | `BREAK` | `break` ×2 | fold into the 452–456 `prompt` block (see §1) |
| 67, 789 | `Can You Use Copyrighted Characters?` | `can-you-use-copyrighted-characters` ×2 | 67 is a body section, 789 is the FAQ entry — keep both but give the FAQ one a distinct `id` (e.g. `faq-copyrighted-characters`) |

### 3c. Paragraph that is entirely `<strong>` (21)

Lines 18–33 are labels inside the examples block. Lines 170–769 are prompt text bolded instead of being put in a prompt block — most are the "strong side" of a `promptComparison` whose "weak side" is a fake `<h3>` listed in §1.

| Line | Current text (truncated) | Should be |
|---|---|---|
| 18 | `<strong>Anime</strong>` | `externalExamples` — style field, not a paragraph |
| 21 | `<strong>Anime</strong>` | `externalExamples` — style field |
| 25 | `<strong>Anime</strong>` | `externalExamples` — style field |
| 30 | `<strong>Realistic</strong>` | `externalExamples` — style field |
| 33 | `<strong>Realistic</strong>` | `externalExamples` — style field |
| 170 | `POSE LOCK: Sarah stays sitting on the couch unless a panel specifically says…` | `prompt` |
| 178 | `Sarah is wearing a red evening dress.` | `prompt` |
| 277 | `Small hotel bedroom, white bed sheets, warm bedside lamps, dark wooden furnit…` | `promptComparison` strong side (weak side: 274) |
| 293 | `No text, no speech bubbles, no weird hands, no extra people, no bad anatomy,…` | `promptComparison` weak side (anti-example) |
| 326 | `Panel 03: Sarah opens the apartment door. Behind her is the same indoor hallw…` | `promptComparison` strong side (weak side: 323) |
| 347 | `Panel 01: Sarah is wearing a tight red evening dress and sits at the restaura…` | `prompt` |
| 359 | `POSE LOCK: Sarah stays sitting on the bed. James stays standing next to the w…` | `prompt` |
| 362 | `OUTFIT LOCK: Sarah wears the black dress in every panel on this page. She is…` | `prompt` |
| 366 | `Sarah is wearing the black dress without the jacket. The jacket is lying on t…` | `prompt` |
| 384 | `Panel 01: Sarah sits at the bar. Dialogue: "I've been waiting here for almost…` | `promptComparison` weak side (strong side: 386) |
| 394 | `"I can't believe you've been sitting here this entire time waiting for me and…` | `promptComparison` weak side (strong side: 396) |
| 445 | `Sarah, long red hair, wearing a black evening dress, sitting at the bar holdi…` | `prompt` |
| 523 | `Start on Panel 01 with a slow push toward Sarah. Cut to Panel 02 and hold on…` | `prompt` |
| 694 | `Small modern apartment, dark wooden floor, cream walls, warm amber light from…` | `promptComparison` strong side (weak side: 691) |
| 738 | `Sarah meets a stranger at a bar and decides to go home with him. What starts…` | `prompt` — example comic description |
| 769 | `"Make me an amazing 20-page hentai."` | `prompt` or `paragraph` — quoted example, not emphasis |

### 3d. Heading rendered as a plain `<p>`

The inverse of §1: real section headings that were flattened to paragraphs.

| Line | Current text | Should be |
|---|---|---|
| 17 | `<p>Anime Comic Examples</p>` | `h3` |
| 29 | `<p>Realistic Comic Examples</p>` | `h3` |
| 36 | `<p>Available Comic Art Styles</p>` | `h3` |

### 3e. `<p>` that is really a list item (20)

Consecutive one-line `<p>` runs that are enumerations. Each run should be one `bulletList` (or `numberedList` where the panels/pages are sequential).

| Lines | First item, verbatim | Items | Should be |
|---|---|---|---|
| 205–206 | `Panel 01: She opens the hotel room door.` | 2 | `numberedList` |
| 222–225 | `Panel 01: Two characters are talking.` | 4 | `numberedList` |
| 311–313 | `Page 1: Sarah and the man are inside a bar.` | 3 | `numberedList` |
| 334–335 | `Panel 01: Sarah is sitting on the bed.` | 2 | `numberedList` |
| 351–354 | `Page 1: Casual clothes.` | 4 | `bulletList` (pages 1/3/6/8, non-sequential) |
| 614–615 | `Panel 01: Sarah is sitting on the bed.` | 2 | `numberedList` |
| 671–673 | `Page 1: Bar.` | 3 | `numberedList` |

Also in the examples block, lines 19, 22, 23, 26, 27, 31, 34 are bare `<p>` style names and comic titles that belong in `externalExamples` fields rather than loose paragraphs. Entry 1 (17–20) has no comic title and entry 4 (30–32) has no style name — the field sets are inconsistent across the five entries.

### 3f. `<blockquote>` used for something that is not a quote

| Line | Current text | Should be |
|---|---|---|
| 110 | `<blockquote><p>Top panel: The woman enters the bar.</p></blockquote>` | `promptComparison` weak side (pair with 112) |
| 112 | `<blockquote><p>Panel 01: The woman enters the bar.</p></blockquote>` | `promptComparison` strong side (pair with 110) |

### 3g. Nested `<a>` inside `<a>` (invalid HTML)

The same `href` is wrapped twice: `<a href="…"><a href="…">…</a></a>`. Browsers unnest this, producing a stray empty link. Remove the outer `<a>`.

| Line | Duplicated href |
|---|---|
| 20 | `https://ourdream.ai/comic-studio/a6dfef4e-b313-48d6-9a2a-78e7d37e923a/read` |
| 24 | `https://ourdream.ai/comic-studio/a267e2c2-46a5-4f2f-9a00-4118b84a2df2/read` |
| 32 | `https://ourdream.ai/comic-studio/049e6b55-49de-434e-b6f2-bffdb39a62bd/read` |
| 35 | `https://ourdream.ai/comic-studio/79015038-f399-4183-988f-3ffd607d9428/read` |

### 3h. Raw URL printed as link text

Link text is the bare URL including the UUID. Replace with the comic title (the `<p>` immediately above each) or move the whole entry into an `externalExamples` block.

| Line | Link text as rendered | Suggested label |
|---|---|---|
| 20 | `https://ourdream.ai/comic-studio/a6dfef4e-b313-48d6-9a2a-78e7d37e923a/read` | (title missing — needs one) |
| 24 | `https://ourdream.ai/comic-studio/a267e2c2-46a5-4f2f-9a00-4118b84a2df2/read` | `Ladyboy Trap` |
| 28 | `https://ourdream.ai/comic-studio/1716335c-2643-4fd8-8703-49b10a058c92/read` | `The Defeated Elves City Part 2` |
| 32 | `https://ourdream.ai/comic-studio/049e6b55-49de-434e-b6f2-bffdb39a62bd/read` | `The Maid` |
| 35 | `https://ourdream.ai/comic-studio/79015038-f399-4183-988f-3ffd607d9428/read` | `The Erotic Photoshoot` |

### 3i. Stray markdown horizontal rule

| Line | Current text | Should be |
|---|---|---|
| 418 | `<p>---</p>` | delete — leftover markdown `---` before the `<h2>` on line 419 |

## How to verify a fix

Run from the repo root; `F=src/content/guides/ourdream-ai-comics.html`.

```
grep -c '<h3' $F                              # 121 now → should drop to 92 (29 fake h3s removed)
grep -o '\\[=+.*_#-]' $F | wc -l              # 13 now → must be 0
grep -o '<li>###' $F | wc -l                  # 88 now → must be 0
grep -c '<a [^>]*><a ' $F                     # 4 now → must be 0
grep -cE '^<p><strong>[^<]*</strong></p>$' $F # 21 now → must be 0
grep -cE '^<p>(Panel|Page) [0-9]+:' $F        # 20 now → must be 0
grep -c '<blockquote' $F; grep -c '>https\?://' $F; grep -c '^<p>---</p>$' $F   # 2 / 5 / 1 now → all 0
grep -o 'id="[^"]*"' $F | sort | uniq -d      # must print nothing (no duplicate anchors)
```
