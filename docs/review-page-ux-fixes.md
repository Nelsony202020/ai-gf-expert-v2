# Review page UX fixes — overlays, tab bar, lightbox, links

Branch: `fix/review-page-ux`. Scope: the product review page only. The global
header, homepage, review data, scores, scoring maths, affiliate URLs and review
copy were not touched.

Figma source of truth: `AIGF-EX` → `01 · Components` → `04 · Reviews`
(`Review / Tab Bar` 196:1023, `Review / Tab` 196:962, `Review / Subscore Card`
199:1330, `Review / Ratings Category Row` 199:1287,
`Review / Video Review Modal` 418:1880).

---

## 1. The scroll jump — root cause

The evidence drawer used a `position: fixed` body lock:

```js
lockedScrollY = window.scrollY;
document.body.style.top = `-${lockedScrollY}px`;   // + body { position: fixed }
...
window.scrollTo({ top: lockedScrollY, behavior: 'auto' });  // on close
```

Two separate jumps came out of that, and both were visible:

1. **`position: fixed` on `<body>` takes the document out of flow.** Every
   `position: sticky` element then loses its scrollport and snaps back to its
   static position — that is the "background content moves" part.
2. **The close path had to put the scroll back.** While locked, the document
   scroll offset is genuinely `0`; unlocking returns the page to the top and
   `window.scrollTo()` then pulls it back down. `html { scroll-behavior: smooth }`
   is set globally in `global.css`, and in browsers that apply CSS smooth
   scrolling to a programmatic `behavior: 'auto'` call this restore *animates* —
   exactly the reported "jumps toward the top, then scrolls back".
   Worse, the restore ran inside `closeAnimatedDrawer`'s `onComplete`, i.e.
   360–520 ms *after* the drawer had already slid away, so it was completely
   exposed.

The video lightbox had a third variant of the same bug: it toggled
`document.body.classList.add('is-locked')`, for which **no CSS rule exists
anywhere in the project** — so it never locked at all — and it restored focus
with a bare `lastFocus.focus()`, which scrolls the trigger back into view.

### The fix — one shared primitive

`src/lib/ui/scrollLock.ts` + a block in `global.css`. Locking only flips
`overflow` on the scrolling element:

```css
html[data-overlay-scroll-lock]      { overflow: hidden; scroll-behavior: auto; }
html[data-overlay-scroll-lock] body { overflow: hidden; overscroll-behavior: none; }
```

The document keeps its scroll offset, nothing is repositioned, nothing is
restored, and `<body>` stays in flow so sticky elements keep working. There is
no jump left to hide. `scrollbar-gutter: stable` (off on coarse pointers, where
scrollbars are overlays) keeps the scrollbar's width reserved so hiding it does
not reflow the page; browsers without it fall back to measured padding.

Locks are reference counted, so overlapping overlays (image lightbox opened from
inside the drawer) release correctly.

Used by: `ratings-drawer.client.ts`, `VideoReviewLightbox.astro`,
`ImageLightbox.astro` — one mechanism, not three hacks.

### Measured result

120 sampled animation frames across open + close, per viewport:

| Case | viewport | scrollY before | min/max during | after |
|---|---|---|---|---|
| Evidence drawer | 1440×900 | 962 | 962 / 962 | 962 |
| Evidence drawer | 390×844 | 1670 | 1670 / 1670 | 1670 |
| Drawer, Esc, reduced motion | 1440×900 | 1016 | 1016 / 1016 | 1016 |
| Video lightbox | 1440×900 | 1430 | 1430 / 1430 | 1430 |

Zero pixels of movement in every case.

---

## 2–3. Review tab bar — Figma + sticky CTA

The brand underline was missing in production because
`initReviewTabIndicator()` **created the indicator element in JavaScript**. Astro
scopes component styles with a `data-astro-cid-*` attribute, and a
JS-constructed element never gets that attribute, so
`.review-tabbar__indicator` matched nothing and the element rendered with no
background and no height. It is now rendered in the template; the JS only
positions it.

Rebuilt to the Figma spec (`Review / Tab Bar`, `Review / Tab`):

| | Figma | Implemented |
|---|---|---|
| Bar height | 56 | 56 |
| Surface | `surface/page` #f9f9f9 | `--rs-canvas` |
| Borders | hairline #e6e6e3 top + bottom | `--rs-line` top + bottom |
| Tab label | Inter 16 / 600 / lh 24 / ls −0.048 | same, both states |
| Inactive / active | `text/secondary` #55545b / `text/primary` #141317 | `--rs-muted` / `--rs-ink` |
| Active underline | 2px `action/pink`, radius 1, full tab width | same |
| Tab gap | 32 desktop, 24 mobile | 2rem / 1.5rem |
| CTA | pink pill, h40, r999, pad 18, gap 8, Inter 14/600, arrow 16 | same |
| Mobile | scroll viewport + edge fade + 1px divider + pinned `Visit ↗` | same |

Only weight 600 is used for both tab states — the old code shipped 500/600,
which is why the bar read as "not clean enough".

**Sticky.** The bar was already `position: sticky; top: var(--site-header-offset)`,
which is the correct mechanism (it cannot move the page). What was missing was
the CTA. A zero-height sentinel sits in flow above the bar and an
`IntersectionObserver` with `rootMargin: -<header offset>px` flips
`[data-stuck]` — no scroll listener, nothing to jitter.

In the stuck state only the CTA changes: opacity 0→1 and `translateX(8px)→0`
over 180 ms, plus a `0 1px 3px rgb(20 19 23 / 6%)` shadow on the bar. No resize,
no bounce, no second bar.

Note: `--site-header-offset` is `0px` site-wide because the global header is not
sticky, so the bar pins to the viewport top once the header has scrolled away —
which is what the Figma component description specifies. The code reads the
token, so if the header becomes sticky the bar follows automatically.

CTA data comes from `product.name` / `product.affiliateUrl` through the existing
`AffiliateLink` component. Verified per product: "Visit OurDream AI",
"Visit Candy AI", "Visit Nectar AI". Nothing hardcoded.

The floating mobile `ReviewStickyCta` is suppressed while the bar is stuck
(`body.review-tabbar-stuck`) so there is never a duplicate CTA. The component
itself is untouched.

---

## 4. Full Review "Jump to section"

`.review-jump` had `position: sticky; top: 6.75rem` under 1100px. Removed — it
now scrolls away with the article. The tab bar is the page's only sticky
navigation.

The desktop "In this review" side rail (`.review-toc`, 1100px+) stays sticky by
explicit decision; it sits in the margin and never overlays content. Its offset
is now token-derived (`--site-header-offset + --review-tabbar-height + 1rem`)
instead of a hardcoded 7.5rem, so it can no longer tuck under the tab bar.

---

## 5. Video lightbox

The component rendered `.video-review-lightbox__*` markup while the only
stylesheet in the project (`video-review-modal.css`) styled
`.video-review-modal__*` — a class family with **no markup anywhere**. The panel
was shipping completely unstyled. That stylesheet has been rewritten against the
classes the component actually uses; no second implementation was introduced.

Rebuilt to `Review / Video Review Modal`: white panel, radius 20, shadow
`0 18px 48px rgba(0,0,0,.22)`, 880 wide / 28 padding / 20 gap desktop and
358 / 20 / 16 mobile, 16:9 media at radius 14, 36px circular close inset 20
(16 mobile), and one meta row — 40px ringed avatar, title, "with Herman Carter",
and `▶ Watch on YouTube ↗` in brand pink. Nothing beyond what is in Figma.

"Watch on YouTube" points at `product.videoReview.channelUrl`, which for DB
products is the real `youtubeReviewUrl` — verified resolving to
`https://www.youtube.com/watch?v=793G-R0RsCA`, `target="_blank"`,
`rel="noopener noreferrer"`. Focus is trapped, Esc closes, and focus restoration
uses `{ preventScroll: true }`.

---

## 6. External links

The central helpers were already in place (`ExternalLinksInit` in `BaseLayout`,
`AffiliateLink`), but `externalizeLinks()` only ran **once at load**. Large parts
of the review page are injected afterwards — the lazily fetched ratings panel,
drawer panels cloned from `<template>`, lightbox content — so links inside them
kept opening in the same tab.

Added a `MutationObserver` on `document.body` (batched into one rAF) so any
markup added later is processed automatically. This is the central fix asked
for: future external links need no per-link patching.

Behaviour is unchanged for everything else — `#`, `mailto:`, `tel:`,
`target="_self"` opt-outs and same-origin links are left alone, and `/go/`
affiliate redirects keep `sponsored nofollow noopener` without `noreferrer`
(which would break attribution).

Audited across `/`, `/best/ai-girlfriend/`, `/reviews/`, `/ai-girlfriend-apps/`,
`/guides/`, `/test/`, `/reviews/candy-ai/`, `/reviews/ourdream-ai/`:
**0 external or `/go/` links without `target="_blank"`, 0 internal links wrongly
opening in a new tab.** Probe links injected into the DOM after load are
corrected within a frame.

---

## 7. Card interactions

Default and selected already matched Figma (`Review / Subscore Card`: white,
radius 14, 1px hairline → 1.5px pink border and chevron-down when selected; no
fill, no tint). The loud parts were the hover states:

- **Category row** hovered to the full `--rft-page` surface — the exact same
  treatment as the *expanded* state, so a hovered row looked selected. Now a
  55% blend of that tint, and only on rows that are not expanded.
- **Subscore card** hovered to a pink-blended border, borrowing the selected
  state's own signal. Now a neutral border darkening (14% ink into the hairline)
  plus `0 1px 2px rgb(20 19 23 / 5%)`.

Nothing scales, moves or gains a dramatic shadow in any state.

---

## 8. Dark mode

The tab bar's active colour is `text/primary` #141317, which on a dark surface
made the active tab the *dimmest* one (pre-existing). Added a dark-mode override
so active/hover use `--color-on-surface` and inactive uses `--dark-muted`.

---

## Testing

Headless Chromium against the dev server, desktop 1440×900 and mobile 390×844:

- drawer and lightbox open/close with zero scroll delta (table above)
- `[data-review-jump]` computes to `position: static`
- tab bar stuck at `top: 0`, height 58 (56 + 2 borders), CTA visible and not
  overflowing at either width
- no horizontal overflow on any tested page
- no page errors or console errors on 7 routes
- `astro build` compiles clean (`astro check` OOMs in this sandbox; the only
  build failure is the Vercel adapter's final copy step hitting a sandbox
  permission on `.vercel/output/`, unrelated to these changes)

## Files

```
new  src/lib/ui/scrollLock.ts
mod  src/components/review/TabBar.astro
mod  src/components/review/VideoReviewLightbox.astro
mod  src/components/review/ratings-body.css
mod  src/components/review/ratings-drawer.client.ts
mod  src/components/review/ratings-evidence.css
mod  src/components/ui/ExternalLinksInit.astro
mod  src/components/ui/ImageLightbox.astro
mod  src/pages/reviews/[slug].astro
mod  src/pages/reviews/preview/[slug].astro
mod  src/styles/full-review-article.css
mod  src/styles/global.css
mod  src/styles/review-page.css
mod  src/styles/review-shell.css
mod  src/styles/video-review-modal.css
```
