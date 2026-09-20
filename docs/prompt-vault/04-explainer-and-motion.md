# Prompt Vault — motion, de-duplication, explainer rework

## 1. Detail animation
- Desktop: opens with fade + 12px rise + 0.98→1 scale (280ms, ease-out), scrim fades in;
  closes in reverse (200ms). Esc, ×, scrim click all animate — the dialog is closed only
  after the transition.
- Mobile: bottom sheet slides up from off-screen (340ms) and slides back down to close (260ms).
  Drag-to-close follows the finger, then slides away (>90px) or springs back.
- prefers-reduced-motion: no transitions.
- Measured (Chromium): desktop opacity 0.24 → 0.88 → 0.99 → 1 at 0/60/140/400ms;
  mobile translateY 820 → 267 → 62 → 0px.

## 2. Measurements

| | Before | After |
|---|---|---|
| .pv-explainer height, 1440 | 998px | **593px** |
| .pv-explainer height, 390 | 1468px | 1111px |
| Images in explainer | 0 | 2 |
| Bordered / filled boxes in explainer | 11 | 10 |
| Page height 1440 / 390 | 15,037 / 11,325 | 14,662 / 10,968 |

Explainer type scale after (1440):

| Selector | px | weight | family |
|---|---|---|---|
| h2.pv-explainer__title | 40 | 900 | Gabarito |
| p.pv-explainer__lede | 19 | 400 | Inter |
| h3.pv-explainer__card-title | 21 | 800 | Gabarito |
| h3.pv-basics__title | 19 | 800 | Gabarito |
| p.pv-explainer__card-body | 16 | 400 | Inter |
| p.pv-basics__body | 14 | 400 | Inter |
| a.pv-link | 13 | 600 | Inter |
| p.pv-explainer__example-label | 12 | 500 | Inter |
| code (examples) | 14 | 400 | Geist Mono |

390: 26/900 → 17/700 (card titles) → 16/800 (basics titles) → 14 body → 12.5 mono → 12 label.
No two heading levels share a size at either width.

Size tokens: the codebase has no font-size tokens at all (every stylesheet uses rem literals).
19px uses 1.1875rem, the same step already used for the hero lede. Weight uses the existing
ladder token `--wt-display-sub` (800).

## 3. Single instances
- Paste instruction ("…Custom Physical Details and Custom Face Details…"): once in the whole
  page HTML — the dialog footnote under Copy / Try in OurDream. Verified in rendered text at
  1440 and 390.
- Provenance (Realistic Album by carefulCrafter + test setup): once per viewport. Desktop: the
  hero test-rig row. Mobile: the hero row is desktop-only (as the footnote was), so the credit
  stays in "About this vault" on mobile only — the source credit has to appear on mobile too.
- The temporary prompt string still appears twice on desktop: in the hero rig and as the
  example code in the "Image prompt" compare card, which you asked to keep as it is.

## 4. Images reused (no new assets)
- **p098 Cat ears** in "Character prompt": a close portrait where the trait is part of who the
  character is — and cat_ears:1.2 is in the card's own example.
- **p114 Cinematic lighting** in "Image prompt": the full-body solo / standing / front-view
  framing every result uses, with one image-level change (the light) — exactly the
  "what happens in one image" point.
Fixed 7.5rem (5rem on 390) figure, 4:5 via aspect-ratio + object-fit: cover, real alt text.

## 5. Colour (two accents, existing tokens only)
- "Character prompt — this page": `--od-pink-tint` fill, `--od-pink-line` border.
- "Image prompt — a different guide": `--od-fun-sky` border + 3px top rule.
- Hero test-rig row: white surface with hairline (not an accent).

## 6. Strings removed or moved (for Figma 245:4 reconciliation)

Removed:
- Dialog 251:184 "How to use it"
- Dialog 251:185 "Paste the prompt into both Custom Physical Details and Custom Face Details when you create or edit your character."
- Dialog 251:186 "Result from the Realistic Album by carefulCrafter. Test setup: empty personality fields, temporary prompt (solo, standing, facing viewer, looking at viewer, front view)."
- Hero 818:8111 "Every prompt was tested on Dreamy, OurDream's realistic default generator. They also work on Vivid 1, 2 and 3 — the look will differ."
- Explainer labels 820:61024 "USING A PROMPT", 820:61030 "GOOD TO KNOW"
- Explainer numbers 820:61026 "01", 820:61027 "02", 820:61028 "03"
- Explainer 254:1253/1254 "Where to paste it" + "Put the prompt into both Custom Physical Details and Custom Face Details on your character, the same way every result here was made." (mobile 259:4177/4178 too)
- Explainer 254:1262/1263 "The generator matters" + "Almost every result was made with Dreamy (Realistic Default). Vivid 1, Vivid 2 and Vivid 3 are different generators, so each result shows the one it was made with." (mobile 259:4186/4187 too) — see note below
- Explainer 254:1268/1269 "How these were tested" + "Every result comes from the Realistic Album by carefulCrafter: similar settings, empty personality fields and the same temporary prompt." (mobile 259:4192/4193 too)
- About 254:1315/1316 "Test setup" / "Empty personality fields, same temporary prompt"

Moved:
- Dialog paste note 251:218 "Paste it into both Custom Physical Details and Custom Face Details on your character." — now under the Copy / Try buttons, and shown on desktop too (was mobile only).
- About "Source" row 254:1306/1307 — now mobile only.

Added (new, factual):
- Hero test-rig row: "Generator" "Dreamy" · "Personality fields" "empty" · "Temporary prompt" "(solo, standing, facing viewer, looking at viewer, front view)" · "Source" "Realistic Album by carefulCrafter".

Note: the brief counted three remaining basics items, but there were four after steps 1–2.
"The generator matters" was not on your keep list, so it was removed; the hero rig row now
states the generator. Say if you want it back.

## Follow-up: paste note removed, /go/ourdream-ai-generate added

- The sentence "Paste it into both Custom Physical Details and Custom Face Details on your
  character." is now removed everywhere. Its last copy was the note under Copy / Try in the
  prompt detail (and its CSS). A repo-wide search finds no other copy in `src/`. The Copy / Try
  bar stays pinned at the bottom of the mobile sheet.
- New redirect `/go/ourdream-ai-generate` → `https://www.ourdreamersai13.com/9776S5J/3QQG7/?uid=553&sub1=generate`.
  It is a row in the database (Admin → Affiliate links), linked to the OurDream AI product, type
  campaign, campaign "generate", rel "nofollow sponsored noopener" like the other OurDream links.
  Change the destination in /admin at any time; no code involved. Live on production
  already (the /go route reads the database), checked: 302 to the URL above.
  Created by `scripts/add-ourdream-generate-link.ts` (safe to re-run; updates instead of duplicating).
  Two fields in the old seed pattern (`lastCheckStatus`, `ageGate`) are not in the live schema,
  so the row is created without them; the schema was not touched.
- The vault's own buttons still go to `https://ourdream.ai/create` (plain links, per the brief).
  Pointing them at the new /go link is a one-line change in `src/lib/prompt-vault/links.ts`.
- **Update (Nelson: "yes do it"):** all vault OurDream buttons (hero, card paste link, detail
  "Try in OurDream", CTA boxes) now go to `/go/ourdream-ai-generate/`. `rel` is still plain
  `noopener` as the original brief said (no sponsored, no disclosure) — change
  `OURDREAM_LINK_REL` in `links.ts` if you want that.
