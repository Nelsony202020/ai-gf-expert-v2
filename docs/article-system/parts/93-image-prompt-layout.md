# Prompt + image layout on the Image Prompt Guide

The article paired a ~600px portrait image with a ~120px prompt card side by side.
No alignment rescues that ratio: top-aligned it leaves a hole underneath, centred it
leaves one above and below. The fix is to stop pairing them sideways.

## What changed

**The don't/do pair in "Start With Visual Descriptions"** was two consecutive
`--side` blocks with a paragraph between them, read as two unrelated examples. It is
now one two-up comparison: `.od-prompt-result-grid--2`, 358 + 24 + 358 inside the 740
column, columns top-aligned and running their own height. Each column is a column
label, the image, the prompt card with its Copy button, then the muted explanation.
The lead-in sentence moved above the comparison. "A better prompt would be:" is
deleted — the layout does that job now.

**The three gallery examples** (Pool, Church, City) are stacked: prompt card across
the full column, then the image it produced at 400px left-aligned, then the caption.
Prompt first, then result, which is the order the reader needs.

`--side` now has no instances in any guide. It is kept, top-aligned, in case a future
article pairs a short card with a short image.

## New CSS

- `.od-prompt-result--stacked` — prompt, image (max 25rem), caption.
- `.od-prompt-result-grid--2` — the two-up grid, 1.5rem gap.
- `.od-prompt-result__label` — column label above the image.
- `.od-prompt-result__media > img` — 4:5, `object-fit: cover`, top anchored. Width is
  set and height follows; no height is hardcoded anywhere.
- `.od-prompt__bar:has(> .od-copy:only-child)` — with the label moved above the
  image the bar holds only the Copy button, which `space-between` parked on the left.

## Measured

| | before | after | |
|---|---|---|---|
| 1440 | 14,467px | 14,811px | +344 (+2.4%) |
| 390 | 19,930px | 19,292px | −638 (−3.2%) |

Desktop is slightly taller, which is the honest cost of stacking: a full-width prompt
above a 400px image uses more vertical space than a 300px image beside a card. The
dead space is gone; the height it was occupying is now content. Mobile is shorter
because the two-up comparison replaces two full stacked blocks.

Image aspect verified as 0.8 on every `.od-prompt-result__media > img` at both widths
— no distortion. Copy buttons still bound by `bindCopyButtons`; no new clipboard code.
Text diff against the previous version: one line lost, one gained, both the specified
deletion of "A better prompt would be:".
