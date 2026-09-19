# Review page UX pass — Sep 17 2026

Branch `fix/review-page-ux`. Covers items 1–5 and 7–9 of the brief (item 6,
external links, shipped separately in `docs/link-behaviour/`).

Figma source: `AIGE-EX` file, page `30 · Review System`. The written spec is the
frame **"Review navigation — source of truth"** (node `530:24242`); the visual
states are `01E`/`01F` desktop, `01H`/`01I` mobile, `01K`/`01L` lightbox, and
`DOC — Drawer behaviour` (`410:17174`).

---

## 1 + 8 — The scroll jump, and one freeze for every overlay

**Root cause.** Two independent faults, both in the drawer's own scroll lock.

`ratings-drawer.client.ts` froze the page with `position: fixed` on `<body>`
plus `top: -<scrollY>px`, and restored it on close with `window.scrollTo()`:

```js
lockedScrollY = window.scrollY;
document.body.style.top = `-${lockedScrollY}px`;   // open
…
window.scrollTo({ top: lockedScrollY });           // close
```

1. `position: fixed` collapses the document scroll to 0. Every `position:
   sticky` element loses its sticky context for as long as the drawer is open —
   including the review tab bar — and the page *must* then be scrolled back on
   close. That restore is the jump.
2. The "View results" path in `reviews/[slug].astro` started a **smooth** scroll
   and opened the drawer on the next animation frame. `window.scrollY` was
   therefore sampled mid-animation, so the restore landed on a position the
   reader had never been at. That is the "jumps to the top, then jumps back".

There was also no scrollbar-width compensation anywhere, so hiding the scrollbar
reflowed the page sideways on every open.

**Fix.** A single shared utility, `src/lib/ui/scrollLock.ts`:

- `overflow: hidden` on `<html>` instead of `position: fixed` on `<body>`. The
  scroll offset is never touched, so there is nothing to restore and nothing to
  get wrong. Sticky elements keep working.
- iOS/iPadOS ignores `overflow: hidden` for touch, so the fixed-body technique
  is kept *only* there, with the restore done synchronously in the same frame
  the styles are cleared.
- `padding-right` compensation equal to the scrollbar width — no sideways shift.
- Reference counted, because the image lightbox opens from **inside** the
  evidence drawer. Previously it reset `body.style.overflow` on close and
  unfroze the page while the drawer was still open.

Adopted by: the evidence drawer, the video lightbox, the image lightbox and the
Photos & Videos NSFW gate. The pre-drawer smooth scroll is gone — Figma: *"the
page behind does not shift and keeps its scroll position."*

## 2 + 3 — Tab bar

Rebuilt to the Figma numbers. Measured in a headless render at 1440:

| | Figma | Built |
|---|---|---|
| Row height | 56 | 56 (incl. both hairlines) |
| Content width | 1200, 120px side padding | 1200 at x=120 |
| Tab label | 16px | 16px / 600 |
| Inactive / active | `#55545b` / `#141317` | `#55545b` / `#141317` |
| Active underline | 2px pink | 2px `#db2777` |
| CTA | 179 × 40 pink pill | 178.3 × 40, `#db2777`, r999 |
| CTA label | 14px | 14px / 600 |
| Hairline | 1px | 1px `#e6e6e3` |

At 390: row 56, tabs scroll, CTA pinned at 90 × 40 with the short "Visit ↗"
label, 28px edge fade, hairline divider. No horizontal page overflow.

**Deviation from the written brief — the CTA is in the row from the top of the
page, not only once the bar sticks.** The Figma spec frame is explicit:

> There is exactly one review navigation component… The row sits in normal
> document flow… Once it reaches the top of the viewport it becomes
> `position: sticky; top: 0`… **No replacement component ever appears and
> nothing is swapped in or out — it is literally the same element.**

and frame `01E` is named *"Top of page (tabs + CTA in normal position)"*. To get
the brief's behaviour instead, change one line in `TabBar.astro`:

```ts
const ctaMode: 'always' | 'stuck' = 'always';   // -> 'stuck'
```

`'stuck'` reveals the CTA on stick with an 180ms fade and a 6px slide, in the
same element, with the wrap holding its width so the tabs never reflow.

The separate mobile floating product CTA (`ReviewStickyCta`) is **removed from
review pages** — Figma lists it under *"RETIRED — DO NOT IMPLEMENT"* for
reviews. The component itself stays, because Brand Guide Hubs still use it.

## 4 — In-article TOC is no longer sticky

`position: sticky` removed from `.review-jump` (mobile) and `.review-toc`
(desktop) in `full-review-article.css`. Figma: *"Nothing else in the review
shell is sticky… If a second navigation system appears, the implementation is
wrong."*

## 5 — Video lightbox

The component was rendering **completely unstyled**: its markup uses
`.video-review-lightbox`, but the only stylesheet for a video modal
(`styles/video-review-modal.css`) targets `.video-review-modal`, which belongs
to the Photos & Videos tab. `body.is-locked`, which it used to freeze the page,
has no CSS rule anywhere in the repo, so it never locked anything either.

Rewritten against Figma `01K`/`01L`: dimmed backdrop, centred white panel
(880 max, 24px radius, 28px padding), 16:9 frame, round close X top-right,
avatar + title + byline, and a pink **"Watch on YouTube ↗"** link using the
existing `videoReview.channelUrl`. Focus is trapped, both `focus()` calls now
pass `preventScroll` (they were the direct cause of the lightbox moving the
page), and it uses the shared scroll lock.

## 7 — Score cards

The cards were already restrained; what made selection feel wrong was
`border: 1px` → `border: 1.5px`, which **reflowed every card by half a pixel on
click**. The second pixel is now drawn with `box-shadow: inset 0 0 0 1px`, which
costs no layout. Hover gains a very soft shadow, selection a 4% brand tint.

## Also fixed along the way

`getScrollOffset()` added the global header's full 80px to every in-page jump,
but that header is **not** sticky (`--site-header-offset: 0px`). Every tab
switch and deep link therefore overshot by a header's height. It now counts only
what actually pins. The same wrong sum was in `ratings-body.css` sticky offsets
and scroll margins.

`reviews/preview/[slug].astro` is a near-clone of the live review page; every
change here was mirrored onto it so the two do not drift.

## Verified

- `astro build` passes.
- Headless render at 1440 and 390 matches the Figma numbers in the table above.
- No horizontal overflow at 390 — the underline indicator could previously
  escape its rail mid-scroll and widen the document; the rail now clips.
- Affiliate links still open in a new tab (5/5 on the review page).
- Untouched: the global header, the homepage, `home-v3/`, `pages/dev/`, review
  data, scores, scoring, affiliate URLs and review copy.
