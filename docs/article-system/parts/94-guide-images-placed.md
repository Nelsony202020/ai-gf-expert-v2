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
