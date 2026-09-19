# 94 — Placing the 13 guide images

Worked from `93-guide-images.md`. All 13 placed, markup copied as written: a bare
`<figure>`, explicit width/height, `loading="lazy"`, `decoding="async"`, figcaption.
None wrapped in `.od-steps__media`; none sits inside a Step. No CSS changed, so no
image has a height set anywhere.

## Overlap check on the prompt guide — asked for before adding

`public/guides/ourdream-ai-prompt-guide/` already held four images. They are the four
result tiles of the **Prompt detail test** under "Does Prompt Structure Actually
Matter?" — one subject (blonde woman, sundress, Paris cafe) at four levels of
detail: Basic, Specific, Structured, Very Long. The point they make is whether *more*
detail buys *more accuracy*, and the article's own answer is that it mostly does not.

The two new files do not repeat that:

- `prompt-vague-vs-specific` uses the **beach** prompt, not the cafe one, and lands
  under "Making Your Prompt Too Vague" where the copy already says *"If you care
  about a detail, include it in your prompt. You do not need to describe everything,
  only the things you actually want control over."* The image is about who decides
  the parts you did not describe — a different claim from the detail test, and the
  one the surrounding sentence makes.
- `prompt-dreamy-vs-vivid` has no counterpart at all. That section carries an A/B
  text block about Dreamy vs Vivid with no picture.

**No duplication. Both placed.** One thing to know: the image generator guide has
`model-dreamy` / `model-vivid` / `model-vivid-2` in a 3-up grid making a similar
same-prompt-different-generator point. Different guide, so not an in-page repeat,
but the two are now near-siblings across the set.

## The two "facts to add" are already in the guides

Neither needed adding, and adding them would have duplicated existing copy:

1. **500 DreamCoins for 10 seconds** — already stated three times in the comics
   guide: as a sentence under "How Much Do Comic Videos Cost", inside the A/B cost
   comparison (`Generating a video = 500 DC`), in the coin cheat sheet (`+500 DC`),
   and again in the FAQ. The new figcaption repeats it a fourth time, which is fine
   as a caption.
2. **Layout options change with the panel count** — the Layout cheat sheet already
   lists them per count, and in more detail than the note: it covers 2 and 5 panels
   as well as 3 and 4, and the numbers match exactly (3 → Diagonal, Rows, Tall Left,
   Splash Top; 4 → Diagonal, Grid, Stagger, Strip Top). The section's opening
   sentence already says the layouts depend on the panel count.

So no sentence was added to any guide. This is additions of markup only.

## Placement

Comics: community examples under "What Can You Generate"; layouts-compared above the
Layout cheat sheet; layout-picker before "Which Layout Should You Use?"; page-prompt
under the "How to Prompt" intro; speech-balloons under the speech bubble intro;
edit-layers under "How to Use Layers" (the h3 the picture actually shows, inside the
"How to Edit" section the note names); animate-page under the video intro;
pages-overview under the publish intro.

Image generator: create panel under "How to Generate an Image"; model picker under
"Choose Your Image Generator"; remix panel under "How Remix Works".

Prompt guide: vague-vs-specific under "Making Your Prompt Too Vague";
dreamy-vs-vivid under "Using the Same Prompt Style for Every Generator".

## Verified

- Declared width/height in the note checked against every file on disk — all 13
  match their real aspect exactly.
- Rendered aspect compared to natural aspect for all 13 at 1440 and 390: no
  distortion. The only flag was `comic-community-examples` at 3.339 vs 3.361, which
  is sub-pixel rounding on a very wide image, not a squash.
- All 13 carry `data-lightbox-open` at runtime and open in the lightbox.
- No 4xx on any guide at either width.
- `<ImageLightbox />` and `<GlossaryTooltipInit terms autoDecorate />` confirmed
  mounted on all four guide pages.
- Text diff against the previous commit: comics 1233 → 1241 runs, image generator
  266 → 269, prompt guide 247 → 249. **Nothing lost in any of the three.** Every new
  run is a figcaption or alt text from the note.

## One judgement call

`image-generator-create.webp` renders 740 × 1085 — the tallest thing on that page.
It is an annotated panel with a numbered legend down the left, so constraining the
figure's width would make the annotations unreadable. Left at full column width.

---

# Second pass — the workflow set, plus two corrections

## A bug from the first pass

`prompt-dreamy-vs-vivid` was anchored on a sentence that lives inside an
`.od-ab__card`, so the figure was emitted inside `.od-ab__options` — a two-column
grid. It became a third grid item and painted over both cards. Moved outside the
`.od-ab` block entirely, where it now follows the comparison. Verified at runtime:
`img.closest('.od-ab')` is null at both widths.

The lesson for next time: anchoring an insert on a sentence is only safe when that
sentence is a direct child of the prose. Check what encloses it first.

## Splash, not Cover Page — a copy correction, approved before making it

"How to Make a Full-Page Comic Panel" told readers to use a **Cover Page** for a
full page in the middle of a story. The live UI has a separate **Splash** page type
for exactly that, which the `comic-layout-picker` screenshot shows in its page-type
tabs. The word "Splash" appeared nowhere in the guide except as "Splash Top", a
3-panel *layout*, which is a different thing entirely.

This needed a wording change, so it was raised rather than made. Approved, then two
sentences changed and nothing else:

- "…use a **Cover Page**." → "…use a **Splash Page**."
- "You are not limited to using Cover Pages for the actual cover of the comic." →
  "A Splash Page is its own page type, separate from the Cover Page you put at the
  front of the comic."

The other seven "Cover Page" mentions in the guide are about the actual cover and
were left alone. The image stays where it was — that section is the only place the
page types are discussed.

## The three workflow images

All in "My OurDream AI Prompting Workflow", markup copied from 93 as written.

- `prompt-workflow-loop` — a bare `<figure>` above the `<ol class="od-steps">`, so
  the diagram of the loop is read before the linear list of steps.
- `workflow-chatgpt-prompt` — `class="od-steps__media"`, last child of step 2's
  `.od-steps__body`.
- `workflow-ourdream-result` — same, in step 4.

Steps 1, 5 and 6 left without images, as specified.

Placement inside the `<li>` follows the comics guide's working examples from
`92-block-markup-contract.md`: the figure is the final child of `.od-steps__body`,
not a sibling of it, so it sits inside the step's indent rather than breaking out of
the numbered list.

## Verified

- Declared width/height matched against the real files: all three correct.
- Rendered aspect matches the declared aspect at 1440 and 390 — loop 1.363 vs 1.364,
  chatgpt 1.745 vs 1.748, result 1.621 vs 1.624. No squashing.
- Both step figures report `closest('.od-steps__media')` truthy and sit at a 0px
  horizontal offset from their step's body text at both widths — inside the indent,
  aligned with the paragraphs above them.
- All three carry `data-lightbox-open` and open in the lightbox, including the two
  inside steps.
- No 4xx, no console errors on either guide at either width.
- `<ImageLightbox />` and `<GlossaryTooltipInit terms autoDecorate />` still mounted
  on the prompt guide page.
- Text diff: prompt guide 249 → 252 runs, nothing lost, the three new runs are the
  three figcaptions. Comics 1241 → 1241, with only the approved Splash correction.

The two "facts to add" in 93 were not added, for the reason recorded above — both
were already in the guides, and that check was not revisited.
