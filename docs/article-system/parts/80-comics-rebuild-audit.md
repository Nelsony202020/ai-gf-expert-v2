# 80 — Comics rebuild: inspection report (Step 1)

**Scope:** `/guides/ourdream-ai-comics/` only. URL unchanged.
**Figma:** desktop `318:4936` · mobile `320:6822` · section `Article · OurDream AI Comics` (`325:7678`) on page `40 · OurDream AI Guides` (`87:9`). Patterns on `02 · Article Components` (`87:8`).
**Code:** `src/pages/guides/ourdream-ai-comics.astro` → `OurDreamArticlePage.astro` → `src/content/guides/ourdream-ai-comics.html` (`?raw`) + `src/styles/ourdream-article.css` (1,797 lines).
**Status:** inspection only. Nothing built, nothing changed.

This file supersedes nothing. It builds on `parts/05-current-state.md` (written before steps 3 and 4 landed) and records what is true today, measured against the actual Comics frame rather than the pattern library in isolation.

---

## 1. Verdict

The CSS is in better shape than the brief assumes and the **content markup is the bottleneck**, exactly as `05-current-state.md` predicted — but the numbers have moved.

- Steps 1–4 are on `feat/article-system-figma`, merged into the current working branch. Callouts, the prompt family, tokens, Bricolage, Geist Mono and the 20px vertical grid are done and measured.
- A later content pass (`fix/comics-content-cleanup`) converted 34 prompt strings into `od-prompt` blocks and removed the escaped-markdown artefacts. **There are now zero backslashes in the file** — `parts/05-current-state.md`'s `\=` / `\+` / `\×` finding is stale and closed.
- What remains is: **6 patterns with no CSS at all**, **3 partially built**, **~99 pattern instances the Figma page wants vs 35 the HTML carries**, and **7 images that exist in Figma but not in the repo**.

The Comics frame uses **18 distinct block types**. Three of them (`Reference Cheat Sheet` ×9, `External Example Link` ×5, `Calculation` ×2) have no CSS whatsoever and together account for 16 instances — this is the single biggest visual gap on the page.

Figma's own count, taken off the frame:

| Pattern | Figma instances | In the HTML today |
|---|---:|---:|
| Article / Prompt | 22 | 34 `od-prompt` (see §4.6) |
| Article / My Take | 13 | 0 |
| Article / Important | 12 | **1** |
| Article / Prompt Comparison | 11 | 0 |
| Article / FAQ Item | 10 | 0 (10 `<h3>` + `<p>`) |
| Article / Reference Cheat Sheet | 9 | 0 |
| Article / Tip | 6 | 0 |
| Article / External Example Link | 5 | 0 (5 bare links) |
| Article / Key Takeaway | 5 | 0 |
| Article / Comparison A/B | 4 | 0 |
| Article / Prompt Structure | 3 | 0 |
| Article / What I Learned | 2 | 0 |
| Article / Image + Caption | 2 | 0 (2 bare `<img>`) |
| Article / Step-by-Step Workflow | 2 (12 steps) | 0 (12 `<h3>`) |
| Calculation | 2 | 0 |
| Image grid (2-up figures) | 1 | 0 |
| Article / Horizontal Process (breakout 900px) | 1 | 0 |
| Article / Sources | 1 | 0 |
| Article / Related Guides | 1 | shell component ✅ |
| **Total body patterns** | **~99** | **35** |

---

## 2. Pattern inventory — what exists in code

Read off `src/styles/ourdream-article.css` as it stands on `fix/external-links-new-tab` (which contains the step 1–4 merge).

### 2.1 Built and corrected against Figma (step 4) — 9

| Pattern | Selector | Notes |
|---|---|---|
| Tip | `.od-block--tip` | padding 20/24 → 16/20 mobile, Lucide `lightbulb` |
| Important | `.od-block--important` | dark-mode hardcode fixed, `#ffedd5`, no border |
| Quick answer | `.od-block--quick-answer` | added in step 4, unused by any article |
| What I learned | `.od-block--what-i-learned` | rebuilt as the rung-4 white card, 32px ringed avatar |
| Key takeaway | `.od-block--key-takeaway` | Bricolage 21/26 → 17/22, absolute accent bar |
| My take | `.od-block--my-take` | added in step 4, hairline top+bottom, 36px avatar |
| Prompt (Text + Code) | `.od-prompt*`, `.od-copy` | face split, copy button, 320/240 collapse + 80px fade |
| Prompt Comparison | `.od-prompt-compare`, `.od-prompt-card*` | side A on `#f9f9f9`, arrow kept on mobile |
| Prompt Structure | `.od-structure`, `.od-chip*` | real Lucide `list` + `arrow-right` |

These nine are the ones I would treat as done, subject to a visual check against the frame.

### 2.2 Partially built — 4

| Pattern | Selector | What is missing |
|---|---|---|
| **Step-by-Step Workflow** | `.od-steps` | Only the step atom (marker, connector, title, body). No eyebrow, no section title, no intro, no **Example** slot, no **in-step media** slot (688×440 + caption), no closing **Key takeaway** divider. Mobile never steps down (marker 32→28, rail gap 20→14). Comics needs the media slot for 5 screenshots. |
| **Comparison A/B** | `.od-ab`, `--framed` | Option panels are white + hairline; target is `#f9f9f9`, no border. Missing the card **Title**, the `Best for …` line and the required **Verdict** block. Figma's four instances all carry a verdict kicker (`Good to know`, `In other words`). |
| **Image + Caption** | `.ourdream-article-prose figure/img/figcaption`, `.od-media--portrait` | `background:#efefed` hardcoded (breaks dark mode); only one width in the 380/440/480/688/740 ladder; no centring; no 2-up **Image grid**; no 960px breakout. |
| **FAQ Item** | `.od-faq`, `__item`, `__q`, `__a` | Exists, never verified against `Article / FAQ Item`. Figma swaps `plus` → `minus` glyphs; the sheet ships minus only. Unused by any article — the Comics FAQ is 10 raw `<h3>` + `<p>`. |

### 2.3 No CSS at all — 6 (all needed by Comics)

| Pattern | Figma node | Comics instances | Note |
|---|---|---:|---|
| **Reference Cheat Sheet** (+ Cheat Sheet Group) | `309:4842` / `309:4866` · atom `309:4639` | **9** | Typography + hairlines only, 2-column `flex-wrap` at 354px children, per-group `border-top`. Highest-value missing pattern. |
| **External Example Link** | `348:4279` / `348:4287` | **5** | 362×52 card in a 2-col grid (`Example cards`, gap 16/16), `#f9f9f9`, radius 12, `Open … ↗`. |
| **Calculation** | in-frame `320:5998`, `320:6049` | **2** | Not in `spec.md` §5 at all — a new block type. 740 wide, lines at 18px inset, 22px line boxes, 28px line pitch. Needs a node read before building. |
| **Horizontal Process** | `349:15054` | **1** | Renders at **900px inside a 740px column** (x = −110) — the only breakout on the page. `--od-breakout` is declared and used zero times. |
| **Sources / Source Row / Citation Marker** | `358:4352` / `358:4288` / `359:4297` | 1 block + **11 `¹` markers** | The HTML has no footnote markers and no sources block (§4.3). |
| **Image grid** | in-frame `318:5090` | **1** | 736 wide, two 360×264 figures, gap 16, x = 2 — a 2px breakout either side of the column. |

`Prompt + Result`, `Result Tile` and `AIGE Test` are still unbuilt but the Comics frame uses **none of them**, so they are out of scope for this page.

### 2.4 Architecture gap — no components exist

Nothing in `src/components/guides/` is a pattern. Every block is a CSS class applied to hand-authored HTML in `src/content/guides/*.html`, imported `?raw`. The shell (page, sidebar, mobile jump, related guides) is componentised; the body is not.

Your brief says "build each pattern as a reusable component, then compose the page from them". That is a real change to the content model and it needs a decision — see **Q1**.

---

## 3. What the page is made of — the Figma composition map

The desktop frame is `Global Header → Layout (Main 740 + TOC 240) → Footer`. `Main` has **652 direct children**. Full ordered map extracted to `docs/article-system/parts/80-comics-figma-map.txt`.

Section-level shape (16 H2s, matching the HTML exactly):

1. **What Is OurDream AI Comics?** — Important, Comparison A/B
2. **OurDream AI Comics Examples** — 3× H4, two `Example cards` grids (5 External Example Links), Reference Cheat Sheet, Image grid
3. **What Can You Generate…** — 4× Important, What I Learned, My Take
4. **How to Make a Comic** — Step-by-Step Workflow (12 steps, 5 with media), Key Takeaway
5. **How Model Sheets Work** — Image + Caption, Reference Cheat Sheet, 2× Prompt, Important, Tip
6. **OurDream AI Comic Layouts** — Reference Cheat Sheet, 3× Prompt, My Take
7. **How to Prompt OurDream AI Comics** — 6× Prompt Comparison, Horizontal Process breakout, 2× Prompt Structure, What I Learned, 7× Prompt, Tip, Important
8. **How to Add Text and Speech Bubbles** — Reference Cheat Sheet, 4× Prompt Comparison, My Take, Important, Tip
9. **How to Edit OurDream AI Comics** — 2× Prompt Comparison, Step-by-Step Workflow, 2× Comparison A/B, 3× My Take, Reference Cheat Sheet ×2
10. **How to Turn a Comic Into a Video** — Reference Cheat Sheet, 2× Prompt, Key Takeaway, Important, My Take
11. **What Does It Cost?** — Tip, 2× Calculation, Comparison A/B, Reference Cheat Sheet, Key Takeaway, My Take
12. **Limitations** — 3× Tip, My Take, 2× Prompt, 2× Important
13. **Tips** — Prompt Comparison, Reference Cheat Sheet, My Take, Prompt, Key Takeaway
14. **How to Publish** — Prompt, Prompt Structure, 3× Important
15. **Is It Worth Using?** — My Take, Prompt, Key Takeaway
16. **FAQ** — 10 FAQ Items → **Sources** → **Related Guides**

Two structural facts that matter for the build:

- **H4 is a heading level the system does not have.** Figma uses it for the three example sub-headings in §2 (`Anime Comic Examples`, `Realistic Comic Examples`, `Available Comic Art Styles`). The HTML has them as `<h3>`. No `Article/H4` spec exists in `parts/`. See **Q2**.
- **The 12 `Step N —` H3s disappear.** Figma turns them into workflow step titles inside two `Step-by-Step Workflow` blocks. They leave the TOC and stop being anchors. See **Q3**.

---

## 4. Content diff — Figma vs `ourdream-ai-comics.html`

Full diff at `docs/article-system/parts/81-comics-content-diff.md`. Method: all 652 Figma children paged out (1,145 text units), HTML parsed block by block (979 units), both normalised (entities, whitespace, curly quotes, punctuation) and compared.

**The body prose is identical.** Every paragraph, heading, list item, FAQ answer and prompt example in the design exists in the HTML with the same wording. There is no editing job here. Every difference below is design chrome, a component label, or a paragraph boundary.

### 4.1 One genuine wording difference

| | |
|---|---|
| Figma (child 284) | `Add it at the end of your page prompt.` |
| HTML (block 492) | `Add this at the end of your page prompt:` |

That is the whole list. **Q4.**

### 4.2 Component labels that exist only in Figma (~40)

Callout kickers (`My take`, `What I learned`, `Key takeaway`, `Tip`, `Not allowed`, `Limit`, `Good to know`, `In other words`), the `Herman Carter · Lead Reviewer` byline on all 16 My Take / What I Learned blocks, 13 cheat-sheet titles (`Comic style cheat sheet`, `Layout cheat sheet`, `Speech bubble cheat sheet`, `Edit reliability`, `Comic video specs`, `What can still drift`, `What the Brush Editor can fix`, `Real-world extras`, …), 11 prompt / comparison labels (`Pose lock`, `Outfit lock`, `BREAK technique`, `One-page override`, `New layer prompt`, `Motion Notes`, `Speech bubble`, `DON'T`/`DO`, `TOO VAGUE`/`BE SPECIFIC`, `GIANT LIST`/`SHORT VERSION`, …).

These are **not** prose. They are the labels the components carry, and adding them is part of applying the pattern — not an edit to your copy. I read them as in-scope and will take them verbatim from Figma unless told otherwise.

### 4.3 Citations — 11 `¹` markers and a Sources block, Figma only

Figma marks 11 sentences with a superscript `¹` and closes the article with `Article / Sources` citing *MrGeekStar's OurDream Comic Studio Field Guide* (community field guide v1.8, August 2026, docs.google.com). The HTML has no markers, no `<sup>`, no sources block. **Q5.**

### 4.4 Image captions — Figma only (9)

Seven step captions (`The Comics hub — "Create a new comic" starts a new project.`, `A new comic starts empty and asks you to pick its cast.`, `Model sheets generate in the background once characters are added.`, `The cover page in the editor, with its own prompt panel.`, `Panel count and layout are chosen per page.`, `Speech balloons are dragged onto the page, then aimed and typed.`), one model-sheet caption (`A model sheet: front, side and back views plus a row of expressions.`), and the two grid captions (`Anime art styles`, `Realistic camera styles`). The HTML carries the equivalent only as `alt` text. These come across as caption text.

### 4.5 Example cards — the HTML is ahead of Figma

Figma's five `External Example Link` cards are placeholders (`Example 1/2/3`, `Open comic ↗`) with no style badge. The HTML has the real data: `Anime · OD Comics · Read the comic ↗`, `Anime · Neon Comics · Ladyboy Trap ↗`, `Anime · Manga BW Inks · The Defeated Elves City Part 2 ↗`, `Realistic · The Maid ↗`, `Realistic · The Erotic Photoshoot ↗`. **I will build the card to Figma's geometry and fill it with the real HTML data, and add a style-badge slot Figma does not draw.** Flagging rather than asking — the alternative is shipping "Example 1". **Q6** covers the badge.

### 4.6 Prompt count: 34 in HTML vs 22 in Figma

Not a discrepancy. Figma's 11 `Prompt Comparison` blocks each swallow a prompt pair; 22 standalone + ~12 comparison sides ≈ 34. The conversion pairs existing `od-prompt` blocks into comparisons — no prompt text is added or removed. It does retire 17 connector lines (`Don't write things like:`, `Instead of this:`, `Try:`, `Or instead of:` …) that the Figma label chips replace. **Q7.**

### 4.7 Cheat-sheet rows: one line in HTML, two cells in Figma

13 rows split on `—` or `:` — `Speech — normal character dialogue` becomes term `Speech` + definition `normal character dialogue`. Same characters, different containers. Mechanical, no wording change.

---

## 5. Assets

### 5.1 Images — 7 missing from the repo

Figma's frame carries **9 real image fills** in the body. The repo has **2**.

| Image | Figma size | In repo |
|---|---|---|
| anime-art-styles | 360×240 | ✅ `public/guides/ourdream-ai-comics/anime-art-styles.webp` |
| realistic-camera-styles | 360×240 | ✅ `realistic-camera-styles.webp` |
| 5 × Step-by-Step Workflow screenshots | 688×440 | ❌ |
| Model sheet (Image + Caption) | 688×336 | ❌ |
| Image + Caption, §7 | 740×416 | ❌ |

All seven have real `imageHash` fills, so they can be exported from Figma. They are UI screenshots of Comic Studio, not decoration — without them five of the twelve workflow steps lose their evidence. **Q8** covers format and naming.

### 5.2 Icons — still zero exported assets

`ourdream-article.css` ships **11** inline `mask:` data-URIs. Steps 3–4 replaced the worst of them with genuine Lucide geometry drawn by hand into the stylesheet, which is better but is still not "download the real asset from Figma". The repo has an icon convention already: `public/icons/aige/*.svg`.

Icons this page needs that have no asset: `bulb`, `alert`, `sparkle`, `badge-check`, `wand`, `copy`, `list`, `arrow-right`, `chevron-right`, `plus`, `minus`, `library`, `external/arrow-up-right`, `check`, `x`. Four stroke colours are still marked *(inferred)* in `parts/10-callouts.md` and need confirming off the nodes during export.

Plus `Brand / Avatar Herman` at 28 / 32 / 36 — currently `--od-author-avatar` with a `#ccc` fallback.

---

## 6. Open questions

| # | Question | Why it blocks |
|---|---|---|
| **Q1** | Components or CSS classes? The brief asks for reusable components; the body is a raw HTML string. Options: **(a)** keep `?raw` HTML and treat the CSS classes as the reusable contract, documenting each pattern's markup — cheapest, no route changes, works for the other three guides today; **(b)** move article bodies to typed blocks (JSON/MDX) rendered by `.astro` components — genuinely reusable, but it is a content-model migration on four published URLs; **(c)** `.astro` components now, used only by new content, HTML left as-is — worst of both. I recommend **(a)** for this page and **(b)** as a separate job. | Decides everything built in steps 2–4 |
| **Q2** | `H4` — Figma demotes three §2 headings to H4; the HTML has them as H3. Change the markup (they leave the TOC, and it is a real heading-level change on an SEO page) or style H3 to look like Figma's H4? | Section 2 layout |
| **Q3** | The 12 `Step N —` H3s become workflow step titles. They leave the TOC and lose their anchors. Confirm — and confirm the titles drop the `Step N — ` prefix, since Figma puts the number in the marker. | Section 4, and the TOC |
| **Q4** | `Add it` (Figma) vs `Add this:` (HTML) — which is canonical? | One sentence |
| **Q5** | The 11 `¹` citations and the Sources block: ship them (I add markers + a Sources block citing MrGeekStar's field guide), or drop them and leave Figma ahead of the page? | Whether Sources / Citation Marker get built at all |
| **Q6** | Example cards: Figma has no style badge, the HTML has `Anime` / `Realistic` + a studio name. Add a badge slot to the component, or fold the style into the card title? | External Example Link shape |
| **Q7** | Retiring 17 connector lines (`Instead of this:`, `Try:`, …) when their prompts pair into comparisons. Strictly this is removing sentences — your rule says don't change wording. I read it as the design's intent, but I want it in writing. | 11 Prompt Comparisons |
| **Q8** | The 7 missing screenshots: export from Figma as WebP at 2× into `public/guides/ourdream-ai-comics/`? Or do you have the originals? Figma's copies may be recompressed. | 5 workflow steps + 2 figures |
| **Q10** | **I cannot push.** The branch `feat/comics-figma-rebuild` is committed on your Mac, but the sandbox my shell runs in has no GitHub credential — no `gh`, no credential helper, no token in `.env`. Fetch works (public read), push returns `could not read Username for 'https://github.com'`. Either drop a fine-grained PAT somewhere I can read, or switch `origin` to SSH with a key the sandbox can use, or push each branch yourself. Without it there is no Vercel preview and the review gate in your workflow cannot run. | Every batch after this one |
| **Q9** | Mobile (`320:6822`) has not been read yet — only its existence and height (79,075px) are confirmed. I will measure it per pattern as each batch is built, rather than in one pass. Confirm that's the right order. | Batch shape |

---

## 7. Proposed build order

Branch off `main` (not the current `fix/external-links-new-tab`, which carries unrelated affiliate-link work). Preview after every batch.

| Batch | Contents | Why this order |
|---|---|---|
| **A** (3) | Reference Cheat Sheet · External Example Link · Image + Caption / Image grid | 16 instances, all currently unstyled; fixes §2 and §5 outright, and §2 is the first thing below the fold |
| **B** (3) | Step-by-Step Workflow (full anatomy + media slot) · Calculation · Horizontal Process breakout | Unblocks §4 (12 steps) and §11; the breakout proves `--od-breakout` |
| **C** (3) | Comparison A/B (title, best-for, verdict) · FAQ Item · Sources + Citation Marker | Closes the last structural gaps; FAQ and Sources finish the page bottom |
| **D** | Icon export from Figma → `public/icons/aige/`, replacing all 11 inline masks; Herman avatar | Needs every pattern in place so each icon lands once |
| **E** | Content conversion: ~64 new pattern blocks into `ourdream-ai-comics.html` | Purely markup; the CSS must exist first or it cannot be verified |
| **F** | Mobile pass at 390 across all patterns, then screenshot comparison at 1440 and 390 | Per Q9 |

Every interactive element (copy buttons, FAQ triggers, external example cards, TOC items, jump bar) picks up the Q10 family rule from step 3: hover → `action/pink-press`, focus-visible → 2px `action/pink` outline at 2px offset, active state distinct.

