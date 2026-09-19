# 96 — Guide video: data, schema, and the two triggers

Steps 2 and 3. Step 1 (the rename) is `95-video-lightbox-rename.md`.

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

**It is switched off right now, on purpose.** The comics video is real
(`jt2DvEU3KZU`, "this AI girlfriend app Now Makes UNFILTERED comics", AI
Girlfriend Expert), but YouTube rate-limited the fetch for its runtime and
publish date, so `durationSeconds` and `uploadDate` are unset in the registry.
Emitting a VideoObject without them would be exactly the placeholder schema the
brief forbids. Filling in those two values turns it on; nothing else changes.

The built page confirms it: `VideoObject` appears zero times, `Article` and
`FAQPage` as before.

## The two triggers

**A — header link.** A real `<button>` under the author/date row, pink, inline,
no border or background. It opens the dialog, so it is a button rather than a
link. Hover underlines, focus-visible draws a pink ring, active dims. The copy
reads "Prefer to watch? Video guide" today and becomes "4-min video guide" the
moment `durationSeconds` is set — the length is derived, never typed twice.

**B — the block.** The brief says: after the opening paragraph, before the first
H2, and explicitly not at the very top. On the comics guide those three cannot
all hold. Its standfirst lives in the hero, so the body opens *straight onto*
`<h2>What Is OurDream AI Comics?</h2>` — there is no paragraph before the first
H2, and splitting there drops the block above a single word of prose, which is
the one placement the brief rules out.

So `videoSlotIndex()` takes the deciding rule to be "after the opening prose":

- Prose exists before the first H2 (the brief's case) → split at the first H2.
- Nothing before the first H2 → split at the end of that first section's opening
  paragraph instead. Same "read a little, then watch", one heading later.

On the comics page that renders: H2 → opening paragraph → video block → rest.
**Flagged for review** — it is a deliberate departure from the literal wording,
forced by this article's shape, and it reverts to one line if the call is wrong.

The split index is always a boundary between two *direct children* of the prose
container; the function tracks tag depth to guarantee it. Anchoring inside a
nested block is how a figure once ended up as a stray grid item inside a
two-column card.

Full 740 column, 16:9, poster cropped with `object-fit: cover`, dark scrim,
centred pink play button, Herman's avatar bottom-left, title underneath.

Both are `data-video-lightbox-open`, so both open the same shared lightbox.

## The facade

No YouTube player loads until someone clicks. The block is an image and a
button; the lightbox's iframe ships as `src="about:blank"` with the real URL in
`data-src`, and the open handler assigns it with `autoplay=1` so the first click
plays. Closing sets it back to `about:blank`, which is what actually stops the
audio.

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

## Accessibility and behaviour

All verified in a headless browser, both triggers:

- Escape closes, backdrop closes, close button closes.
- Scroll locks through the shared `lockScroll()` — `overflow: hidden` on
  `<html>`, not `position: fixed` on `<body>`. Measured scroll drift on
  open-and-close: **0px**.
- Focus moves into the dialog on open and returns to the trigger on close, with
  `preventScroll` so the browser does not scroll the trigger into view.
- Both triggers are real buttons with hover, focus-visible and active states.

**A bug fixed on the way:** the open handler focused
`[data-video-lightbox-close]`, and the backdrop carries that same attribute and
is the first match — so focus landed on a non-focusable `<div>` and stayed
outside the dialog. Now `button[data-video-lightbox-close]`.

## TOC

Untouched. It is generated from the article's H2s. It does list "How to Turn an
OurDream AI Comic Into a Video" — that is a real H2 that was already in the
article, not an entry for this feature.

## Geometry

Measured against the brief: desktop panel **880**, player **824×464**; mobile
panel **358**, the YouTube link dropping under the identity row. Order is player,
then meta row, with the close button on the panel.

## A correction to what step 1 reported

Step 1 said the rename made the stylesheet's selectors match the component's
markup for the first time. That was based on an incomplete read. The component
carries its **own scoped `<style>` block** — it was never unstyled. The separate
stylesheet was a leftover from a modal that no longer exists: of its thirteen
selectors, eight were used by nothing at all, and the five that survived only
matched by coincidence of naming.

Renaming it therefore did something worse than nothing — it pointed dead global
rules at the live component's class names, where they would leak any property
the scoped block does not set. **The stylesheet is deleted in this commit**, and
its two `@import`s with it. The modal keeps its own scoped styles, which is what
was drawing it all along.
