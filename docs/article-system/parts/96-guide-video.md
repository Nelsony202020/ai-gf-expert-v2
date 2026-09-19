# 96 — Guide video: data, schema, and the block

Step 1 (the rename) is `95-video-lightbox-rename.md`.

**Revised after review.** The first cut shipped two triggers and played in the
shared modal; Nelson cut it back to one trigger that plays in place. What the
review changed is marked below.

## Where the data lives, and why not InstantDB

The brief said InstantDB. **There is no guides entity in InstantDB.** The schema
has 37 entities — products, reviews, media, glossary and so on — and guides are
not among them: the guide registry is `src/data/guides.ts`, a TypeScript file
that its own header calls "THE guide registry … nothing else on the site may
hardcode a guide title, slug or description".

So the video sits on the registry entry, as `Guide.video`. That satisfies the
real requirement — it is per-article data, not hardcoded in a template — without
inventing a database table. Putting it in InstantDB would mean adding an entity
to `instant.schema.ts` and pushing a schema migration, which also collides with
the standing "do not touch the database" rule.

Every read goes through `getGuideVideo(slug)` in `src/lib/guides/video.ts`, so
if the data does move to InstantDB later, that one function changes and no
component is touched.

**Pre-rendered, confirmed.** The guide routes are static. `getGuideVideo` is
called in the page frontmatter, which runs once at build time — there is no
request-time read and nothing in the video path touches `window`. The built
`index.html` carries the finished markup.

**No video means nothing.** `video` absent → no header link, no block, no
lightbox in the DOM, no schema, no empty container. The three other guides are
unchanged on this branch and render exactly as before.

## VideoObject

`videoObjectSchema()` returns `null` unless `description`, `uploadDate` and a
derivable `duration` are all present, and the page spreads the result into its
JSON-LD array only when it is non-null.

It stayed off through most of this build: YouTube rate-limited every scripted
fetch for the video's runtime and publish date, and emitting a VideoObject
without them would have been exactly the placeholder schema the brief forbids.
Both values were finally read off the video itself in a real browser — runtime
**5:36**, published **16 Sept 2026** — so the registry now carries
`durationSeconds: 336` and `uploadDate: '2026-09-16'` and the schema is live.

The built page emits, once:

```json
{ "@type": "VideoObject", "name": "Watch: How to use OurDream AI Comics",
  "description": "…", "thumbnailUrl": ["…/maxresdefault.jpg"],
  "uploadDate": "2026-09-16", "duration": "PT5M36S",
  "embedUrl": "https://www.youtube-nocookie.com/embed/jt2DvEU3KZU?…",
  "contentUrl": "…", "url": "https://aigirlfriend.expert/guides/ourdream-ai-comics/" }
```

`name` is the on-page title line, not the YouTube title ("this AI girlfriend app
Now Makes UNFILTERED comics") — the schema describes the video as this page
presents it. Worth a second opinion if that ever matters for rich results.

The three guides without a video emit zero VideoObject, zero lightbox markup and
zero block markup; the only `.od-video` string on those pages is the unused CSS
rule in the shared stylesheet.

## The block

One trigger, not two. The first cut also put a "Prefer to watch?" text link
under the byline — **removed on review**: it carried the same
`data-video-lightbox-open` as the block roughly 200px below it, so two controls
above the fold did one thing, and it was not a jump link. Its CSS
(`.ourdream-article-hero__video-link`, `…__video-caret`) went with it. The hero
meta row closes up on its own; nothing was left behind at 1440 or 390.

### Where it sits

The brief's original rule was "after the opening paragraph, before the first
H2". The comics guide keeps its standfirst in the hero, so its body opens
*straight onto* `<h2>What Is OurDream AI Comics?</h2>` — there is no paragraph
before the first H2 at all.

`videoSlotIndex()` therefore branches:

- Prose before the first H2 → split at the first H2, unchanged.
- Nothing before it → the slot is the END of that opening section: immediately
  before the next top-level `<h2>` or `<h3>`.

The intermediate version split after the section's *first* paragraph, which cut
a three-paragraph section in half and pushed the rest of its own argument below
a video. At the section's end the block reads as the recap of what was just
explained, and the next heading starts clean. On the comics page:

```
H2  What Is OurDream AI Comics?
P   OurDream AI Comics is a feature inside…
P   You don't need to know how to draw…
DIV .od-block--important
DIV .od-video          ← here
H3  How OurDream AI Comics Works
```

Two details the implementation has to get right, both of which bit once:

- The scan starts *inside* the first H2 (at depth 1, from after its `>`), or the
  first H2's own opening tag matches the "next heading" test and the slot comes
  back as index 0 — the block above the heading, which is what the first attempt
  shipped.
- The returned index is always a boundary between two **direct children** of the
  prose container; the function tracks tag depth to guarantee it. Anchoring
  inside a nested block is how a figure once ended up as a stray grid item
  inside a two-column card.

A first section with no following heading falls back to the old
end-of-first-paragraph position rather than dropping the video off the bottom.

### What it looks like

Full 740 reading column, 16:9, poster cropped with `object-fit: cover`, dark
scrim, centred pink play button, Herman's avatar bottom-left, duration pill
bottom-right, title underneath. On mobile it spans the content column at the
same ratio.

Markup is a `<div class="od-video">` holding a `<button class="od-video__trigger">`
and the caption — a `<div>` rather than a `<figure>` because
`.ourdream-article-prose figure` carries its own margins, borders and
figcaption rules, and this block wants none of them.

### The duration pill

`videoLengthLabel()` returns the exact runtime as `m:ss` (`5:36`), or `h:mm:ss`
past an hour. It used to round to `${minutes}-min`, which rendered a flatly
wrong "6-min" on a 5:36 video — and it sat in the header link, which is now
gone. The pill is where every video player puts the runtime.

It renders inside `.od-video__frame`, `aria-hidden` (the caption already names
the video; a bare "5:36" read on its own tells a screen reader nothing), and
disappears with the poster when the player swaps in. Nothing renders when
`durationSeconds` is absent.

**One colour is literal, deliberately:** `background: rgb(12 11 15 / 78%)`. The
pill sits on a photographic poster in both light and dark mode, and every ink
token in this file inverts under `[data-theme="dark"]` (`--od-ink` becomes
`#f7f7f6`), so a token would make the pill vanish in dark mode. It takes the
same literal over-media ink as `.od-video__scrim` two rules above. The text is
`var(--od-on-ink)`, which is `#f7f7f6` in both themes. No new token invented.

## Playing in place, not in a modal

**Changed on review.** The block used to open the shared
`Media / Video Lightbox`. It now plays where it sits.

On click the handler replaces the `<button>` with a `<div class="od-video__frame">`
carrying the iframe. Same class, same `aspect-ratio: 16 / 9`, same position in
the column, so the box is identical before and after — measured 740×416 either
side at 1440, 350×197 at 390, and the document height does not change by a
pixel.

The trigger is a real `<button>`, so Enter and Space come free; there is no
keydown handler to get wrong. Focus-visible draws the 2px pink ring at 4px
offset, hover scales the play button, active presses it. After the swap the
iframe takes focus, so a reader who pressed Enter is inside the player rather
than back at the top of the document.

The iframe carries `title`, `allow="accelerometer; autoplay; clipboard-write;
encrypted-media; gyroscope; picture-in-picture; web-share"` and
`allowfullscreen`.

Three consequences worth knowing:

- The guide uses its own `data-guide-video` attribute and handler, in
  `ourdream-article.client.ts`. `data-video-lightbox-open` still belongs to the
  review pages' shared modal and is untouched.
- `VideoLightbox.astro` is **not modified** — reviews keep using it exactly as
  before. Its mount was removed from `ourdream-ai-comics.astro`, because a
  hidden dialog with no trigger is dead markup. The comics page now ships zero
  `#media-video-lightbox`.
- The poster-fallback script moved with it, out of `VideoLightbox.astro` and
  into the article client. The copy inside `VideoLightbox.astro` was left in
  place rather than modifying that file; it matches nothing on a review page and
  can be deleted whenever reviews are next touched.

## The facade

No YouTube player loads until someone clicks — the part of the first cut that
survived review unchanged. The block ships as an image and a button; the page
contains **zero** iframes until someone activates it, and the handler then
builds one with `autoplay=1` so the first click plays.

Measured on the comics page:

| | YouTube bytes |
|---|---|
| Page load, facade | **59 KB** (the poster) |
| On click, player injected | **1,159 KB** |

A normal embed moves that 1,159 KB into page load for every visitor, whether or
not they press play. The facade costs 59 KB instead — about 20× less, on a page
that is already heavy. (With the 480-wide `hqdefault` poster it was 10 KB and
120× less, but the poster was visibly soft at 740 — see below.)

`youtube-nocookie.com` for the player, so nothing is set until playback.

**Bunny CDN: not used for the poster, deliberately.** The pull zone
(`aigirlfriendpull.b-cdn.net`) pulls from this site's own origin, so it cannot
proxy `i.ytimg.com` without a second pull zone pointed at YouTube. That is a
Bunny configuration change, not a code one, and the brief said "if that's
straightforward". It is not. The poster is served from YouTube's own CDN with
explicit `width`/`height` and `loading="lazy"`.

`maxresdefault` (1280×720) for the poster. `hqdefault` is 480×360 and was
visibly soft stretched across the 740 column, and being 4:3 it also had to be
cropped to fit 16:9. maxres only exists for videos uploaded above 1280 wide and
YouTube answers a missing one with a grey 120×90 placeholder rather than a 404,
so the failure is silent — the page therefore checks the decoded width on load
and swaps to `hqdefault` when it comes back under 300px. A guide can also pin
its own `thumbnail`.

**Verified, not assumed.** Pointing the comics guide at `jNQXAC9IVRw` (no
maxres; YouTube answers 404 with a 120×90 body) and rebuilding, the poster came
back as `…/jNQXAC9IVRw/hqdefault.jpg` at 480 wide with the
`data-poster-fallback` attribute cleared. Reverted immediately after. Nelson's
custom thumbnail will flow through the same path with no code change.

## Accessibility and behaviour

Measured in a headless browser at 1440 and 390:

- The trigger is a real `<button>`: Enter and Space both activate it, natively.
- Focus-visible: `2px solid rgb(219, 39, 119)` at `4px` offset — the pink ring,
  confirmed from computed style, not from the stylesheet.
- Hover scales the play button 1.06, active presses it 0.97.
- Focus lands in the player after the swap, so Enter does not dump the reader
  back at the top of the document.
- No scroll lock, no focus trap, no Escape handler — there is no dialog any
  more. Scroll drift on activation: **0px**.
- The duration pill is `aria-hidden`; the caption below the frame is the
  accessible name.

The modal's own accessibility work (Escape, backdrop, focus return, the shared
`lockScroll()`, and the `button[data-video-lightbox-close]` focus fix recorded
in an earlier revision of this doc) still stands — it just belongs to the review
pages now.

## TOC

Untouched. It is generated from the article's H2s. It does list "How to Turn an
OurDream AI Comic Into a Video" — that is a real H2 that was already in the
article, not an entry for this feature.

## Geometry

Measured on the built page:

| | 1440 | 390 |
|---|---|---|
| Block / frame | 740 × 416 | 350 × 197 |
| Aspect ratio | 1.778 | 1.778 |
| Same after the player swaps in | yes | yes |
| Document height change on swap | 0px | 0px |
| Pill ↔ avatar gap | 627px | 237px |

The pill takes the bottom-right corner because the avatar badge holds
bottom-left (`inset-inline-start`), and the two must never meet.
