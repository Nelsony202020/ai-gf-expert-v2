# 83 — Fidelity audit: built page vs Figma

**Method:** every value measured, nothing judged by eye. Computed styles pulled from the
rendered page with a headless browser at 1440 and 390; Figma values read off the frames
(`318:4936` desktop, `320:6822` mobile) with the plugin API. Gaps measured as a histogram over
all 653 children of the reading column, not sampled.

**Why now:** the page is 37% converted (41 of 112 blocks). Before converting the remaining 71,
anything systematic had to be found — a 4px rhythm error would otherwise be multiplied 71 times
and then have to be unpicked.

---

## 1. Verdict

Type is exact on both viewports. Desktop rhythm was already exact. **Three systematic faults
were found and fixed**, one of which was silently breaking a pattern I had already shipped.

| # | Fault | Scope | Status |
|---|---|---|---|
| 1 | Reading column 730, not 740 | every block, desktop | fixed |
| 2 | Cheat sheet collapsed 2 columns → 1 | 9 instances, desktop | fixed (consequence of 1) |
| 3 | Mobile rhythm 4–12px out on every gap | ~700 gaps, mobile | fixed |
| 4 | Letter-spacing wrong on body and H2/H3 | every paragraph and heading | fixed |

---

## 2. The column, and the pattern it was breaking

`d51dc16` added `scrollbar-gutter: stable` to `html` in `global.css` — correct, and it stops
overlay open/close shifting the page. The side effect: on any platform with classic scrollbars
the usable width at a 1440 window is ~1430.

The article layout asked for `minmax(0, 740)`, a *flexible* track, so it absorbed the loss:
**740 → 730**. Ten pixels, invisible on its own.

Except `Article / Reference Cheat Sheet` puts its groups at a fixed **354** with a **32** gap —
354 + 32 + 354 = **740 exactly**. At 730 the second group no longer fits, `flex-wrap` sent it to
a new line, and all nine cheat sheets silently rendered as **one column instead of two** on
Windows and Linux Chrome. The screenshots in `82-batch-a.md` were taken before that commit
landed, so they show it working, which is exactly how this stayed hidden.

Two changes, both about not letting the measure move:

- The content track is now **fixed** (`var(--od-content)`), and the side margin absorbs
  instead — `padding-inline: max(1.25rem, calc((100% - 66.25rem) / 2))`. The 1060 band
  (740 + 80 + 240) stays centred: margins are 190 at 1440, 185 at 1430, and the column is 740
  at both.
- The cheat sheet's group width is derived, `calc((100% - 2rem) / 2)`, not hardcoded. It is
  still 354 at a 740 column, but a narrower column now gives two narrower columns rather than
  collapsing to one.

The figure grid benefits too: children are now **362 + 16 + 362 = 740**, matching Figma's
intent, where they were 357 before.

`global.css` was not touched. The gutter is the right call and the article should survive it.

---

## 3. Mobile rhythm

The 390 frame had never been measured — `parts/08` and the CSS both say "inferred". Measured
now: the mobile column is one auto-layout stack with a uniform **16px** gap (653 of 653
children), with 8px spacers before H3 and 28px before H2.

| | Figma mobile | was | now |
|---|---:|---:|---:|
| Base sibling gap | 16 | 20 | 16 |
| H2 top (16 + 28 + 16) | 60 | 48 | 60 |
| H3 top (16 + 8 + 16) | 40 | 36 | 40 |
| H4 top | 16 | 20 | 16 |

Desktop is unchanged and was already right: 20 / 68 / 48 / 20.

Rather than scatter mobile overrides across a dozen rules, the base gap is now a token —
`--od-flow`, 1rem mobile and 1.25rem desktop — read by the sibling rule, the pattern-block
rule, the heading-follows rule, lists and figures. The two viewports now move together by
construction instead of per rule.

---

## 4. Letter-spacing

Figma stores tracking as a percentage; the CSS carried a single rounded value everywhere.

| Element | Figma | was | now |
|---|---|---|---|
| Body + list items, desktop | −0.4% of 18 = **−0.072px** | −0.096px | −0.072px |
| Body + list items, mobile | −0.3% of 17 = **−0.051px** | −0.096px | −0.051px |
| H2 desktop | −1.5% of 32 = **−0.48px** | −0.496px | −0.48px |
| H2 mobile | −1% of 26 = **−0.26px** | −0.304px | −0.26px |
| H3 desktop | −0.5% of 22 = **−0.11px** | −0.096px | −0.11px |
| H3 mobile | −0.5% of 19 = **−0.095px** | −0.096px | −0.095px |
| H4 both | −0.5% of 17 = **−0.085px** | −0.085px | unchanged |

Body was the one that mattered: 574 paragraphs, each slightly over-tightened, and the mobile
value was carrying the desktop number.

---

## 5. Checked and correct — no change needed

- **Type**: every family, size, line-height, weight and colour matches on both viewports —
  H2 32/40 and 26/32, H3 22/30 and 19/26, H4 17/22, body 18/31 and 17/28, and every part of
  the three patterns built in batch A.
- **Desktop rhythm**: 20 base, 68 before H2, 48 before H3, 20 before H4 — measured across all
  653 children, single-valued.
- **Shell**: rail 240, gutter 80, column 740, side margin 190 at 1440.
- **Mobile column**: 350 on a touch device. The 340 that appears in a desktop window resized
  to 390 is correct behaviour, not a bug — `global.css` already disables the gutter under
  `(hover: none) and (pointer: coarse)`, so real phones get 350.
- **Cheat sheet, example cards, image grid, figure**: padding, radius, borders, fills, gaps and
  grid structure all match the frames.

---

## 6. Still open, unchanged by this audit

Carried from `82-batch-a.md` §5 — neither is a fault, both want a decision:

1. The mobile external-example card is drawn `#ffffff` in Figma while the desktop frame and the
   component definition both say `#f9f9f9`. Built as `#f9f9f9` on both.
2. Example card 3 is three lines tall against Figma's 52px, because Figma's cards carry
   placeholder titles and the real one wraps.

---

## 7. What this means for the remaining 71 blocks

The vocabulary is now measured rather than inferred on both viewports, so the markup sweep can
proceed against a known-correct grid. The patterns it will call — Important, Tip, My Take, Key
Takeaway, What I Learned, Prompt Comparison, Prompt Structure — were built and corrected in
step 4 and are unused, not missing.
