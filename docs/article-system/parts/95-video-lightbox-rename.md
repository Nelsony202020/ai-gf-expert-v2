# 95 — `Review / Video Review Modal` → `Media / Video Lightbox`

Step 1 of the guide-video work. The modal is about to serve guides as well as
reviews, so it leaves the review namespace. Rename only, in its own commit.

Branched off `main` at `3cd719b`.

## What moved

| before | after |
|---|---|
| `components/review/VideoReviewLightbox.astro` | `components/media/VideoLightbox.astro` |
| `styles/video-review-modal.css` | `styles/media-video-lightbox.css` |
| `.video-review-lightbox*` (markup) | `.media-video-lightbox*` |
| `.video-review-modal*` (stylesheet) | `.media-video-lightbox*` |
| `data-video-review-{open,close,iframe}` | `data-video-lightbox-*` |
| `#video-review-title` | `#media-video-lightbox-title` |
| `VideoReviewLightbox`, `initVideoReviewLightbox` | `VideoLightbox`, `initVideoLightbox` |

Both review routes, `page-full.css`, `page-review.css`, `Gallery.astro`'s data
hook and the repo audit doc follow.

Verified name-only: every changed file compared against its `origin/main` version
with all old and new identifiers normalised to one token. All eight identical —
not one line of logic, markup or style rule changed.

## The one behavioural consequence

`main` is half-renamed. The component's markup uses `.video-review-lightbox*`;
the only stylesheet defines `.video-review-modal*`, which nothing uses. The
stylesheet is dead and the modal renders unstyled. `docs/review-ux/review-shell-pass.md`
records the same finding independently — that doc is left as-is, since it is a
record of what was true at the time.

Bringing both sides to one name makes the selectors match the markup for the first
time. That was raised and agreed before the work started. If the styling that now
applies is wrong, fix `media-video-lightbox.css` rather than reverting the rename.

## Not renamed, on purpose

`.video-review-trigger*` in `Gallery.astro` and `review-shell.css` is the review
page's own "Watch full video review" button, not the modal. Guides get their own
triggers in step 3. Only its `data-` hook moved, because that is its contract with
the modal.

Nothing marked "OLD — DO NOT IMPLEMENT" or `ARCHIVE / Review / Media Lightbox`
exists in the codebase; searching for those markers returns nothing.

## A mistake worth recording

The first attempt at this commit branched off a stale `origin/main` (`0c90b74`)
because the sandbox's remote-tracking ref had not been fetched, while `main` had
since moved 21 commits forward — including the merge of the review-page work
(PR #58). The rename was therefore applied to a 108-line version of a component
that is now 388 lines, and pushing it would have reverted that work.

Caught by reading the commit's own diffstat: 108 insertions against 388 deletions
for a file that should have changed by nothing but its name. Redone against
`3cd719b`.

**Fetch `origin/main` immediately before branching, and read the diffstat of a
rename commit — the line counts on both sides of a rename should match.**

## What could not be checked locally

Review pages are DB-driven and do not emit in the sandbox without InstantDB
credentials; the build produces only `reviews/index.html` and
`reviews/ratings-panel`. The rename is verified by the name-only proof and a clean
production build; the rendered pages need the Vercel preview.

The only product carrying a `videoReview` in `products.ts` is the Aura AI fixture,
whose `embedUrl` is a placeholder. No published review slug has one, so the modal
renders on no live review page today.
