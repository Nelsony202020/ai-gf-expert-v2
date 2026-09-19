# Prompt Vault — full build (stages 2–5)

Built in one pass at Nelson's request ("just build the whole thing"). Route unchanged:
`/guides/ourdream-ai-character-prompts/`. Figma file `iaUwrRvpkEq7RrBpPLxA6j`, page `245:4`.

## What is on the page

| Area | Figma | Code |
|---|---|---|
| Hero: breadcrumb, label, H1, lede, facts, footnote, CTA, 3 example cards | 252:194 / mobile 257:3263 | `ourdream-ai-character-prompts.astro` |
| Search (Large / Compact / Mobile) | Search Field 247:19497 | `components/ui/SearchField.astro` (shared) |
| Filter chips | Filter Chip 486:2084 | `components/ui/FilterChip.astro` (shared; the Glossary now uses it too) |
| Sticky toolbar | 250:190 | same page, `.pv-sticky` |
| Groups + category previews (3 desktop, shelf picks on mobile) | 253:264 / 257:3320 | `.pv-group`, `.pv-cat` |
| Prompt card: default, hover, copied + "Paste it in OurDream →" | 248:95 | `VaultPromptCard.astro` |
| Category view (View all / chip) | 488:52130 / 488:54663 | `.pv-focus-head` + same cards |
| Search results + No Results | 256:1300, 249:106 | `.pv-search-head`, `.pv-empty` |
| Prompt detail (modal desktop, bottom sheet mobile) | 251:229, 256:21608, 488:53011, 259:23663 | `VaultPromptDetail.astro` |
| Affiliate CTA (plain link) | 249:92 | `VaultAffiliateCta.astro` |
| Explainer | 254:1230 / 259:4157 | `.pv-explainer` |
| Related guides + About this vault | 254:1270 / 259:4194 | `.pv-related`, `.pv-about` |

Every prompt (all 94) is real HTML text in the prerendered page. Preview rows only hide
the extra cards visually, so View all / search / chips reuse the same cards.

## Behaviour (all tested in headless Chromium at 1440 and 390 — 58/58 checks pass)

- Copy: clicking a card (anything but the image) or its Copy button copies the exact prompt,
  shows Copied for 2s with the pink "Paste it in OurDream →" (desktop) / "Open OurDream →"
  (mobile) link in place of the model tag. Uses the shared `bindCopyButtons`, now in
  `src/lib/ui/copyButtons.ts` (moved out of the article script unchanged; the article uses it
  from there).
- Search: live, token-AND over name, prompt text and category names ("red eyes" finds Red iris
  eyes; "hair" finds 39, as Figma DOC 261:5355 #04). Chip counts show matches per chip; chips
  with 0 fade to 40% and cannot be picked. "/" focuses search. Esc clears.
- Chips: one at a time, All when nothing is filtered. A chip opens the category view.
- View all N: category view on the same page (?category=<category>), its chip selected, back
  link and "× Clear category" return to the vault at the same scroll position.
- Detail: image click opens it; URL does not change. Thumbnails switch results (2px pink
  border, "Result N of M"). Previous/Next (and ←/→) move through the category or the current
  search/category set only. Esc, ×, or the dark area close it and return to the same scroll.
  Mobile: bottom sheet, drag the header down to close, Copy/Try pinned at the bottom.
- URL: ?category= / ?q= are UI state. Back/forward restore state and scroll; reload keeps it;
  unknown category dropped; canonical always the clean URL.

## Tokens — added (you asked me to tell you)

The OurDream colour tokens lived inside `ourdream-article.css`. I moved that block, unchanged,
to `src/styles/od-tokens.css` (the article @imports it; computed values checked identical) so the
vault reads the same tokens without loading the whole article stylesheet. Tokens I had to ADD
because the article system never needed them — values are the Figma variable values:

| Token | Figma variable | Light | Dark (my choice) |
|---|---|---|---|
| `--od-pink-line` | action/pink-line | #f9a8d4 | rgb(244 114 182 / 45%) |
| `--od-pink-tint` | action/pink-tint | #fdf2f8 | rgb(219 39 119 / 10%) |
| `--od-border-ink` | border/ink | #333239 | #d2d2ce |
| `--od-ink-raised` | surface/ink-raised (Vivid 3 dot) | #212026 | #f7f7f6 |
| `--od-fun-lilac` | fun/lilac (Dreamy dot) | #c9b8ff | same |
| `--od-fun-sky` | fun/sky (Vivid 1 dot) | #bfe1ff | same |
| `--od-fun-butter` | fun/butter (Vivid 2 dot) | #ffe07a | same |

Also: `--pv-scrim` (rgb 20 19 23 / 72%) for the "2 results" badge and the detail backdrop, and
the shared chip's `--filter-chip-line` / `--filter-chip-tint` (same pink-line/pink-tint values,
because the chip is sitewide and cannot rely on the --od scope). The Glossary already hard-coded
#f9a8d4 for the same purpose. If you want these in `global.css` as site tokens, say so.

Headings use `var(--od-display)` with the weight ladder (`--wt-display` ≥26px,
`--wt-display-sub` 18–25px, `--wt-display-min` ≤17px) and `--ls-display` — no fixed weights.

## Icons

Downloaded from Figma and committed: copy, arrow-left, chevron-left, search, images
(public/icons/aige). Reused the existing aige set for x, check, info, library, arrow-right,
arrow-up-right, chevron-right. None redrawn.

## Where I did not follow the drawing, and why

1. **Headings are Gabarito, not Bricolage Grotesque.** The site moved to one display face
   (typography consolidation, #59). Figma still carries Bricolage.
2. **Body & creature shows "View all 4"** on desktop. Figma hides View all there (a leftover
   from the 4-column layout) — with 3 previews that would make Jawline unreachable from browse.
   Desktop rule: View all when a category has more than 3. Mobile follows Figma: View all from 3.
3. **Category view is 3 columns, not 4.** Your brief (3 × 384); DOC 488:56195 #05 still says 4.
4. **Links are plain** (brief). DOC 261:5399 #05 asks for affiliate rel + label on "Try in
   OurDream". One-line switch in `src/lib/prompt-vault/links.ts`.
5. **Link target:** "Open the character creator", "Paste it in OurDream", "Try in OurDream" all
   go to `https://ourdream.ai/create` (OurDream's own Create page). Tell me if the creator has a
   more exact URL.
6. **Chip = bucket, View all = category.** Figma chips are 7 buckets (Hair = styles + colours +
   accessories). A multi-category chip opens a category view titled "Hair prompts" with the three
   categories as sub-sections, description "Hair styles · Hair colors · Hair accessories" — Figma
   has no frame for this; it is my interpretation.
7. **Category view hides the site header** while it is open — the vault toolbar replaces the site
   nav, as in frame 488:52130 and DOC 261:5355 #01. Only on this page, only in that view.
8. **"Want a hairstyle for one image only…"** (search frame) shows only when the search contains
   "hair" — the line is hair-specific.
9. **Related guide "How to Create a Character in OurDream AI — Coming soon"** is built as drawn,
   not clickable. The house rules say roadmap notes don't ship; drop it if you prefer.
10. **"8.8/10 after 3+ months of testing"** is the Figma text, typed. It will not follow the live
   review score.
11. **Hero examples** are Freckles, Glitter makeup, Blue gradient hair (DOC 261:5243 #04), set in
   the page file.
12. **Search matches categories too** (Figma), not only title + text (brief) — you confirmed in chat.
13. **Mobile header is the site's 80px header**, Figma draws 64px. Not touched (global header).
14. **Tablet 768–1099** has no Figma frame: hero examples hide, filters stack, grid stays 3-up.

## Figma issues found (for the design agent)

- Group headers carry "Makeup, lips, cheeks and face markings." as Description on all five
  groups (not rendered by the Group variant, so harmless).
- DOC notes still describe a 4-column grid and affiliate CTA rules that the brief overrides.
- Category preview picks differ between desktop and mobile; both are now stored per prompt
  (`previewDesktop`, `previewMobile`), so they can be changed in the database.

## Not done / needs you

- **Images.** Cards and the detail view show grey 4:5 placeholders. Spec (unchanged from
  stage 1, path updated): WebP (or PNG/JPEG masters), 4:5, 1200 × 1500, named by album id —
  p008.webp … plus p046, p048, p050 for the second results (97 files). Upload to Bunny under
  `/prompt-vault/` and set `imagePath` = `/prompt-vault/p008.webp` on each result row. They are
  then served as WebP through Bunny Optimizer with width/height set and lazy loading.
  Full uncropped images: DOC 261:5243 #12 warns two album images show nudity — decide before
  supplying any.
- **Links from the two prompt-guide articles** — still waiting on `fix/guide-images`.
- The Glossary's search field is not yet on the shared Search Field (its chips are).

## Database

Two new optional fields on `promptVaultPrompts` (`previewDesktop`, `previewMobile`) and
`shortTitle` filled on all 15 categories. Pushed additively like stage 1 (live schema + new
attributes only) and re-seeded.
