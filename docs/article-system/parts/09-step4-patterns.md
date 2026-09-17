# 09 — Step 4: the pattern blocks

Pilot article: **`/guides/ourdream-ai-prompt/`** — the only guide whose body is properly marked up, so it exercises the whole vocabulary. Everything below is measured on the built page with a headless browser, not judged by eye.

The blocks are corrected in `src/styles/ourdream-article.css` against the existing `.od-*` markup. They are **not** rebuilt as `src/components/guides/article/blocks/*.astro` yet: article bodies are still hand-authored HTML imported `?raw`, so a component per block type would have nothing to render until the typed-block model lands in step 5. The CSS written here is what those components will carry.

---

## Decisions taken

The five questions that gated this step, answered 2026-09-17.

| Q | Decision |
|---|---|
| Q10 | The TOC pilot treatment is the family rule: hover → `action/pink-press` label with a `border/strong` indicator, active → `action/pink-press`, focus-visible → 2px `action/pink` outline at 2px offset, 4px radius. Applies to FAQ triggers, related-guide rows, Copy buttons, external example cards and the jump bar. |
| Q11 | **One Copy component everywhere** — 6/4 padding, radius 6, ≥32px hit box — reusing the existing `bindCopyButtons` 1600ms "Copied" swap. Prompt Comparison's borderless box is treated as drift, consistent with the C9 call. |
| Q12 | Code prompts collapse at **320px desktop / 240px mobile with an 80px fade**, expand row below the fade. Roughly 10 and 7 lines of Geist Mono 14/23. |
| Q13 | Media below a step renders at the **full 740px reading column with the caption inset to the step text**. Threshold: anything under 16:10, plus every portrait image. |
| Q14 | **Lightbox is in, scoped to evidence images** — AIGE Test results and article figures only, not step media or external example thumbnails. |

---

## The 20px grid, finally applied to blocks

Step 3 put the prose stack on Figma's uniform 20px gap but left the pattern blocks at 4px, because each block carries its own `margin-top` and at equal specificity the later component rule won.

The blocks keep that margin — they need it when nested, e.g. a What I learned inside an AIGE Test — and one `(0,2,0)` rule now claims the direct-child case:

```css
.ourdream-article-prose > * + :is(.od-block, .od-ab, .od-prompt, …, blockquote, pre) {
  margin-top: 1.25rem;
}
```

Specificity matters here in both directions. A first attempt doubled the prose class instead, which also outranked `.ourdream-article-prose h2` `(0,1,1)` and silently flattened the heading rhythm from 68/48 back to 20. Measured before and after:

| | Before | After |
|---|---|---|
| Blocks (`.od-block`, `.od-ab`, `.od-prompt`, `blockquote`, …) | 4 | **20** |
| `.od-prompt-compare__note` | 10 | **20** |
| H2 / H3 desktop | 68 / 48 | 68 / 48 (unchanged) |
| H2 / H3 mobile | 48 / 36 | 48 / 36 (unchanged) |

Full histogram on the built page is now `{P: 20×55, H2: 68×7, H3: 48×14, OL: 20×2, UL: 20, BLOCKQUOTE: 20×8, FIGURE: 20×6, every .od-* block: 20}` — nothing off-grid except the headings, which is the design.

---

## Callouts

Built against `parts/10-callouts.md`. Measured on the built page at 1440 and 390:

| | Width | Padding D | Padding M | Radius | Border | Background | Body D | Body M |
|---|---|---|---|---|---|---|---|---|
| Tip | 740 / 350 | 20/24 | 16/20 | 16 | 1px hairline | `#ffffff` | Inter 16/26 | Inter 16/26 |
| Important | 740 / 350 | 20/24 | 16/20 | 16 | **none** | `#ffedd5` | Inter 16/26 | Inter 16/26 |
| Quick answer | 740 / 350 | 24/28 | **20 uniform** | 16 | **none** | `#fce7f3` | Inter 19/30 | Inter 17/28 |
| What I learned | 740 / 350 | 20/24 | 16/20 | 16 | 1px hairline | `#ffffff` | Inter 19/30 | Inter 17/28 |
| Key takeaway | 740 / 350 | 20/24 | 16/20 | 16 | 1px hairline | `#ffffff` | **Bricolage 21/26 600** | **Bricolage 17/22 600** |
| My take | 740 / 350 | 18/0 | 18/0 | **0** | **top + bottom only** | transparent | Inter 19/30 | Inter 16/26 |

Every label is `Body/S Strong` 14/20 600 at `-0.028px`; Quick answer's and My take's are `action/pink-press`, the rest `text/primary`. All six verification checks in `parts/10-callouts.md` hold.

**What changed beyond spacing:**

- **Quick answer and My take did not exist in code.** Both added. Neither is used by any article yet — they are waiting for content.
- **What I learned was drawn as My take.** It rendered as a transparent hairline-top rule with a 28px avatar and `text/secondary` body. Figma has it as a white card with a hairline, radius 16, a **32px** ringed avatar, gaps stepped 8 → 12, and the body in `text/primary` at the stepped-up size. Corrected; the rule treatment moved to My take where it belongs, with its own 36px avatar, 14px root gap and horizontal label row.
- **Key takeaway's accent bar is absolutely positioned**, inset 24px from the card edge (20px mobile) and stretched to the content box top and bottom. It was a grid track spanning 8 rows, which invented phantom rows and trailed roughly 150px below the text. Same bug, smaller, on both avatars.
- **Mobile padding was desktop padding.** The family steps 20/24 → 16/20 on mobile; the code used 20/24 at every width.
- **Key takeaway's mobile body was 18/24**; `Heading/XS` is 17/22 at `-0.085px`. Both viewports now carry `font-variation-settings: 'opsz' 14, 'wdth' 100`.
- **The AIGE Test's kicker, title and subtitle rules were descendant selectors**, so they also restyled the What I learned nested inside it — its label rendered as a pink pill with a sparkle. Scoped to direct children.

**Icons.** The four callout icons were hand-approximated data-URI masks and the badge-check in particular rendered as a squiggle. They now use genuine Lucide geometry on the 24 grid at 1.5px with round caps, which is what `parts/10-callouts.md` says the family is: `lightbulb`, `triangle-alert`, `sparkles`, `badge-check`. Stroke colours are still the inferred ones — `text/secondary` on Tip, `score/mid` on Important, `action/pink` on Quick answer and Key takeaway — and Key takeaway's remains genuinely ambiguous in the file. Confirm all four in Figma.

**Flagged, built as drawn:**

- My take's attribution is 12/16 Medium `text/muted` `#8a8991` where What I learned's is 14/22 Regular `text/secondary` for the identical string — and `text/muted` is the "third grey" the family rules say not to invent.
- Quick answer's mobile padding is 20/20 where the rest of the family is 16/20.
- My take's avatar is 36px, off the documented 32/40/48/64 avatar scale.
