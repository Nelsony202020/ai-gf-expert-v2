# Content diff — Figma `318:4961` ("Main") vs `src/content/guides/ourdream-ai-comics.html`

**Sources**
- **A (Figma)** — file `iaUwrRvpkEq7RrBpPLxA6j`, page `87:9`, frame `318:4936` → `318:4961` ("Main"), 652 direct children (565 of them carry text).
- **B (HTML)** — `/Users/evandernelson/Desktop/AI GF Expert V2/src/content/guides/ourdream-ai-comics.html` (82,267 bytes), 979 visible text blocks extracted.

**Method** — every Figma child's TEXT descendants were concatenated, then both sides were split into comparable units (Figma composites split on ` | ` and newlines; HTML split per block element). Both sides were normalised: HTML entities unescaped, whitespace collapsed, curly quotes/dashes folded to ASCII, superscripts stripped, leading/trailing punctuation and bullets removed, lowercased. 1,145 Figma units (995 unique) vs 979 HTML units (904 unique).

**Headline:** the *prose* is essentially identical. Every body paragraph, heading, list item, FAQ answer and prompt example in the Figma design is present in the HTML with the same wording. All the differences are (a) Figma design chrome the HTML content partial does not carry, (b) Figma component *labels* that the HTML folds into the sentence, and (c) a handful of HTML connector lines that the Figma comparison components replace with a label.

---

## 1. Text in FIGMA but NOT in the HTML

59 normalised strings exist in Figma and appear nowhere in the raw HTML file. None of them are body prose — all are design chrome, captions or component labels.

### 1a. Whole Figma components with no HTML counterpart (18 strings)

These live in the page template / layout, not in the content partial, so this is likely expected.

**`Article / Header` (child 0)**
- `Home`
- `Guides`
- `OurDream AI Comics`
- `OurDream AI Comics: How to Use the Comic Generator`
- `Herman Carter`
- `· August 25, 2026`

**`Article / Sources` (child 649)**
- `Sources`
- `References used for research, testing and factual information in this guide.`
- `01`
- `MrGeekStar's OurDream Comic Studio Field Guide ↗`
- `MrGeekStar · Community field guide (v1.8, updated August 2026)`
- `docs.google.com`

**`Article / Related Guides` (child 651)**
- `Related OurDream guides`
- `How to Use OurDream AI Image Generator`
- `Images, Video & Comics`
- `OurDream AI Image Prompt Guide`
- `Prompts & Characters`
- `OurDream AI Prompt Guide`
- `Explore all OurDream AI guides`

### 1b. Image captions (9 strings) — the HTML has `alt` text on `<img>` but no visible caption

- child 66 `Article / Image + Caption` — `A model sheet: front, side and back views plus a row of expressions.`
- child 59 `Article / Step-by-Step Workflow` — `The Comics hub — “Create a new comic” starts a new project.`
- child 59 — `A new comic starts empty and asks you to pick its cast.`
- child 59 — `Model sheets generate in the background once characters are added.`
- child 59 — `The cover page in the editor, with its own prompt panel.`
- child 59 — `Panel count and layout are chosen per page.`
- child 59 — `Speech balloons are dragged onto the page, then aimed and typed.`
- child 22 `Image grid` — `Anime art styles`
- child 22 `Image grid` — `Realistic camera styles`

### 1c. Callout kickers and bylines (9 strings)

- child 47 `Article / What I Learned` — `What I learned`
- child 47 `Article / What I Learned` — `Herman Carter · Lead Reviewer` *(this byline appears on every `My Take` / `What I Learned` block in Figma — 16 instances — and never in the HTML)*
- child 54 `Article / My Take` — `My take`
- child 60 `Article / Key Takeaway` — `Key takeaway`
- child 12 `Article / Comparison A/B` — `Good to know`
- child 36 `Article / Important` — `Not allowed`
- child 447 `Article / Comparison A/B` — `In other words`

The HTML has exactly **one** `od-block` callout (`Important` / "One important thing to know…"). Figma has ~40 callout components (`Important`, `Tip`, `My Take`, `What I Learned`, `Key Takeaway`, `Limit`, `Not allowed`). Their *bodies* are all in the HTML as plain `<p>`; their *kickers* are not.

### 1d. Cheat-sheet / structure component titles (12 strings)

- child 21 — `Comic style cheat sheet`
- child 73 — `What can still drift`
- child 112 — `Layout cheat sheet`
- child 206 `Article / Prompt Structure` — `Remove the reference when you change`
- child 239 `Article / Prompt Structure` — `Outfit changes across a story`
- child 263 — `Speech bubble cheat sheet`
- child 311 — `What the Brush Editor can fix`
- child 311 — `Text & details`
- child 358 — `Edit reliability`
- child 371 — `Comic video specs`
- child 371 — `Input`
- child 455 — `Real-world extras`
- child 609 `Article / Prompt Structure` — `A good description`

### 1e. Prompt / comparison component labels (11 strings)

- child 89 `Article / Prompt` — `One-page override`
- child 342 `Article / Prompt` — `New layer prompt`
- child 606 `Article / Prompt` — `Example description`
- child 641 `Article / Prompt` — `Not how it works`
- child 168 `Article / Prompt Comparison` — `SIMPLER`
- child 172 `Article / Prompt Comparison` — `TOO VAGUE`
- child 183 `Article / Prompt Comparison` — `SHORT VERSION`
- child 271 `Article / Prompt Comparison` — `WITH DIALOGUE`
- child 271 `Article / Prompt Comparison` — `JUST THE SCENE`
- child 306 `Article / Prompt Comparison` — `DESCRIBE INSTEAD`
- child 174 `Breakout — Five things per panel` — `FIVE THINGS PER PANEL¹` *(the five numbered questions inside it are all present in the HTML)*

### 1f. Example-card placeholders (3 strings)

- child 16 `Example cards` — `Example 1`, `Example 2`, `Example 3`

See category 3 — the HTML carries real comic titles here instead.

### 1g. Additional Figma labels that survive in the HTML only as incidental substrings

About 40 further Figma component labels (`Pose lock`, `Outfit lock`, `Speech bubble`, `Motion Notes`, `BREAK technique`, `Brush Editor`, `Layers`, `Comic Page`, `Cover Page`, `People`, `Details`, `Format`, `Control`, `Original image`, `Best quality`, `Normal version`, `Date version`, `Fantasy version`, `1–2 edits`, `3 edits`, `4+ edits`, `Speech`, `Thought`, `Caption`, `Shout`, `Black Box`, `White Box`, `Limit`, `DON'T`, `DO`, `REMOVE`, `REPLACE`, `DELETE`, `SHORTER`, `TOO LONG`, `GIANT LIST`, `BE SPECIFIC`, `BY PANEL NUMBER`, `Example`, `Prompt`, `Copy`, `Tip`, `Model Sheet versions`) exist in the HTML only as words inside a longer sentence or heading, never as their own standalone label. These are reported under category 3 rather than here, because the content is present — it is just merged into the neighbouring line.

---

## 2. Text in the HTML but NOT in Figma

39 normalised strings. Grouped:

### 2a. Real example-comic data (7 strings) — Figma shows placeholders
- html 15 `<p>` `Anime`  ·  html 25 `<p>` `Realistic` (style badges; `Anime` appears 3×, `Realistic` 2×)
- html 17 `<p>` `Read the comic ↗`
- html 20 `<p>` `Ladyboy Trap ↗`
- html 23 `<p>` `The Defeated Elves City Part 2 ↗`
- html 26 `<p>` `The Maid ↗`
- html 28 `<p>` `The Erotic Photoshoot ↗`

(The per-card style names `OD Comics`, `Neon Comics`, `Manga BW Inks` do exist in Figma — but only inside the "Comic style cheat sheet", not on the cards.)

### 2b. Layout-section lead-in lines (4) — Figma puts these lists in one "Layout cheat sheet" component instead
- html 237 `<p>` `For two-panel pages, you can choose:`
- html 248 `<p>` `For three panels, you get:`
- html 259 `<p>` `For four panels, you can choose:`
- html 273 `<p>` `For five panels, you currently get:`

### 2c. Prompt lead-in connector lines (17) — replaced in Figma by the `Prompt Comparison` label chips
- html 315 `Don’t write things like:`
- html 324 `Instead of this:`
- html 326 `Keep it simple:`
- html 331 `Don’t just say:`
- html 334 `What does that mean?`
- html 335 `Instead, say something like:`
- html 468 `So instead of prompting:`
- html 471 `Just generate:`
- html 480 `Instead of:`
- html 483 `You could use:`
- html 492 `Add this at the end of your page prompt:`
- html 495 `That's it.`
- html 520 `For example, instead of:`
- html 523 `Try:`
- html 526 `Or instead of:`
- html 833 `Write:`
- html 475 `Much easier.`

### 2d. Sentence-split residue (3) — same content, different paragraph boundary (see 3d)
- html 532 `<p>` `The AI is much better at creating something than understanding a command like "erase this."`
- html 836 `<p>` `The guide found that literal descriptions work better than vague words like "cozy," "beautiful," or "modern."`
- html 357 `<p>` `The guide recommends using only one or two negative instructions. A giant list like:`

### 2e. Prefix/joining variants — covered by category 3, not genuinely new content (7)
- html 102 / 154 / 162 `<h3>` `Step 5 — Create Your Cover`, `Step 10 — Edit Any Mistakes`, `Step 11 — Add More Pages`
- html 456 `<li>` `Thought — for thoughts`
- html 618 `<li>` `Original image: Best quality`
- html 845 / 846 `<p>` `Normal version — casual clothes.`, `Date version — evening outfit.`

### 2f. Extraction artefact (1)
- html 125 `Prompt Copy` — the `od-prompt__label` + `od-copy` button run together; matches Figma `Prompt | Copy`.

---

## 3. Present in both but WORDED DIFFERENTLY

### 3a. The 12 step headings carry a `Step N — ` prefix in the HTML

| Figma (child 59, `Article / Step-by-Step Workflow`) | HTML |
|---|---|
| `Open the Comic Generator` | `Step 1 — Open the Comic Generator` (h3 84) |
| `Create a New Comic` | `Step 2 — Create a New Comic` (h3 87) |
| `Add Your Characters` | `Step 3 — Add Your Characters` (h3 91) |
| `Generate Your Character Model Sheets` | `Step 4 — Generate Your Character Model Sheets` (h3 96) |
| `Create Your Cover` | `Step 5 — Create Your Cover` (h3 102) |
| `Choose Your Comic Layout` | `Step 6 — Choose Your Comic Layout` (h3 110) |
| `Write Your Page Prompt` | `Step 7 — Write Your Page Prompt` (h3 121) |
| `Generate Your Comic Page` | `Step 8 — Generate Your Comic Page` (h3 135) |
| `Add Dialogue and Speech Bubbles` | `Step 9 — Add Dialogue and Speech Bubbles` (h3 147) |
| `Edit Any Mistakes` | `Step 10 — Edit Any Mistakes` (h3 154) |
| `Add More Pages` | `Step 11 — Add More Pages` (h3 162) |
| `Organize and Publish Your Comic` | `Step 12 — Organize and Publish Your Comic` (h3 168) |

In Figma the number is a separate numeral element (`1`, `2`, … `12`) beside the title.

### 3b. Cheat-sheet rows: two Figma cells vs one joined HTML line

**Speech bubble cheat sheet** (Figma child 263 vs HTML `<li>` 455–460)

| Figma | HTML |
|---|---|
| `Speech` / `normal character dialogue` | `Speech — normal character dialogue` |
| `Thought` / `for thoughts` | `Thought — for thoughts` |
| `Caption` / `useful for narration or things like “Three hours later...”` | `Caption — useful for narration or things like “Three hours later...”` |
| `Shout` / `spiky bubble for yelling` | `Shout — spiky bubble for yelling` |
| `Black Box` / `good for darker narration or inner thoughts` | `Black Box — good for darker narration or inner thoughts` |
| `White Box` / `simple text box without a normal speech bubble` | `White Box — simple text box without a normal speech bubble` |

**Edit reliability** (Figma child 358 vs HTML `<li>` 618–621)

| Figma | HTML |
|---|---|
| `Original image` / `Best quality` | `Original image: Best quality` |
| `1–2 edits` / `Usually works well` | `1–2 edits: Usually works well` |
| `3 edits` / `Still okay, but reliability starts dropping` | `3 edits: Still okay, but reliability starts dropping` |
| `4+ edits` / `Can become unreliable` | `4+ edits: Can become unreliable` |

**Model Sheet versions** (Figma child 572 vs HTML `<p>` 845–847)

| Figma | HTML |
|---|---|
| `Normal version` / `casual clothes.` | `Normal version — casual clothes.` |
| `Date version` / `evening outfit.` | `Date version — evening outfit.` |
| `Fantasy version` / `armor or special equipment.` | `Fantasy version — armor or special equipment.` |

### 3c. Footnote markers — 11 Figma strings carry a `¹`, the HTML has none

The HTML file contains **zero** footnote reference markers (no `¹`, no `<sup>`, no `footnote` class) and no Sources block, so these 11 citations are unlinked in the HTML:

1. child 78 — `…poses and outfits can drift even between panels on the same page.¹`
2. child 160 — `Always tell OurDream AI what should happen in each panel by using the panel number.¹`
3. child 166 — `…or giving the wrong details more importance.¹`
4. child 174 — `FIVE THINGS PER PANEL¹`
5. child 214 — `…backgrounds that are outside the current panel.¹`
6. child 270 — `…because you type the final text yourself.¹`
7. child 351 — `…fail to create proper layers or miss smaller details.¹`
8. child 399 — `…The generator looks at the speech bubbles instead.¹`
9. child 418 — `Adding a new character costs 20 DreamCoins.¹`
10. child 516 — `…than OurDream AI's normal image generator.¹`
11. child 630 — `…before sending your comic for public review.¹`

### 3d. Same sentence, different paragraph boundary / trailing clause

| Figma | HTML |
|---|---|
| child 284 `Article / Prompt Comparison`: `Add it at the end of your page prompt. That's it. The beta guide found that this worked better than throwing a giant list of negative instructions at the AI. Keep it simple.` | split across html 492 `Add this at the end of your page prompt:`, 495 `That's it.`, 496 `The beta guide found that this worked better than throwing a giant list of negative instructions at the AI.`, 326 `Keep it simple:` — note **"Add it"** (Figma) vs **"Add this"** (HTML) |
| child 562 `Article / Prompt Comparison`: `That gives the AI way too much freedom. The guide found that literal descriptions work better than vague words like "cozy," "beautiful," or "modern."` | html 832 `That gives the AI way too much freedom.` + html 836 `The guide found that literal descriptions work better than vague words like "cozy," "beautiful," or "modern."` |
| child 306 `Article / Prompt Comparison`: `Tell it what should actually be behind the bubble. The AI is much better at creating something than understanding a command like "erase this."` | html 529 `Tell it what should actually be behind the bubble:` + html 532 `The AI is much better at creating something than understanding a command like "erase this."` |
| child 184 `Article / Tip`: `Keep negative prompts short. The guide recommends using only one or two negative instructions. A giant list can actually make the results worse.` | html 357 `The guide recommends using only one or two negative instructions. A giant list like:` + html 360 `can actually make the results worse.` (the HTML interposes the example prompt block, so the sentence reads across the code block) |
| child 271 `Article / Prompt Comparison`: `Then add the exact dialogue afterward. Much easier.` | html 474 `Then add the exact dialogue afterward.` + html 475 `Much easier.` |
| child 322 `Article / Prompt` (3 lines, `BREAK` on its own lines) | html 555 `<pre>` — one block: `Panel 01: Change her dress to black. BREAK Panel 02: Add a glass of wine to the table. BREAK Panel 03: Change his shirt to white.` (identical content, line breaks preserved in the file) |

### 3e. Example cards — placeholders vs real data

| Figma (child 16 / 18, `Example cards`) | HTML (blocks 15–28) |
|---|---|
| `Example 1` / `Open comic ↗` | `Anime` / `OD Comics` / `Read the comic ↗` |
| `Example 2` / `Open comic ↗` | `Anime` / `Neon Comics` / `Ladyboy Trap ↗` |
| `Example 3` / `Open comic ↗` | `Anime` / `Manga BW Inks` / `The Defeated Elves City Part 2 ↗` |
| `Example 1` / `Open comic ↗` (realistic) | `Realistic` / `The Maid ↗` |
| `Example 2` / `Open comic ↗` (realistic) | `Realistic` / `The Erotic Photoshoot ↗` |

The Figma cards are unfilled placeholders; the HTML has the shipped titles, style badges and links. Figma also has no style-badge element on the cards.

### 3f. Prompt block labels

The HTML has 34 `od-prompt` blocks and **every one** is labelled the generic `Prompt`. Figma uses 22 `Article / Prompt` components with descriptive labels — `Pose lock` (×2), `One-page override`, `Example` (×7), `Prompt` (×5), `Outfit lock`, `BREAK technique`, `New layer prompt`, `Motion Notes`, `Speech bubble`, `Example description`, `Not how it works` — plus 11 `Article / Prompt Comparison` components whose labels are `DON'T`/`DO`, `TOO LONG`/`SIMPLER`, `TOO VAGUE`/`BE SPECIFIC`, `GIANT LIST`/`SHORT VERSION`, `WITH DIALOGUE`/`JUST THE SCENE`, `TOO LONG`/`SHORTER`, `REMOVE`/`REPLACE`, `DELETE`/`DESCRIBE INSTEAD`.

### 3g. Image-grid captions

| Figma (child 22, `Image grid`) | HTML |
|---|---|
| `Anime art styles` | no visible caption — `<img alt="The eight anime art styles available in OurDream AI Comic Studio">` |
| `Realistic camera styles` | no visible caption — `<img alt="The five realistic camera styles available in OurDream AI Comic Studio">` |

---

## 4. Escaped-markdown artefacts in the HTML

**None. Zero occurrences.**

The file contains no backslash characters at all (`grep -c '\\'` → 0), so there are no `\=`, `\+`, `\×`, `\-`, `\*`, `\_` or `\#` artefacts. The arithmetic lines render cleanly:

- html 689 `<p>` — `10 × 20 DC = 200 DreamCoins.`
- html 706 / 707 `<p>` — `Generating a comic page = 20 DC`, `Generating a video = 500 DC`
- html 713–715 `<li>` — `3 characters = 60 DC`, `10 pages = 200 DC`, `Total = 260 DreamCoins`
- html 718 / 720 / 722 `<p>` — `+100 DC`, `+160 DC`, `+500 DC`
- html 653 `<p>` — `Camera movement + character movement.`
- html 621 `<li>` — `4+ edits: Can become unreliable`
- html 264 `<p>` — `The Grid is your classic 2×2 comic layout.`

All match their Figma counterparts exactly.

---

## Summary counts

| Category | Count |
|---|---|
| 1 — Figma only | **59** strings absent from the HTML entirely (0 body prose; 18 header/sources/related-guides, 9 image captions, 9 callout kickers/bylines, 13 cheat-sheet titles, 11 prompt-component labels, 3 example-card placeholders). A further ~40 Figma labels survive only as substrings of HTML sentences (reported under 3). |
| 2 — HTML only | **39** strings — 7 real example-card data, 4 layout lead-ins, 17 prompt connector lines, 3 sentence-split residue, 7 prefix variants (see 3), 1 extraction artefact. |
| 3 — Worded differently | **7 groups**: 12 `Step N —` headings; 13 cheat-sheet label/value rows; 11 footnote markers; 6 paragraph-boundary/trailing-clause splits (incl. one real word change, *Add it* → *Add this*); 5 example cards; 34 prompt labels; 2 image-grid captions. |
| 4 — Escaped markdown in HTML | **0** |
