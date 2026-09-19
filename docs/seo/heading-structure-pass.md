# Heading structure pass — measured results

Branch `fix/seo-heading-structure`, off `main` at `d031b9a`.
All numbers below come from parsing the built HTML of all 71 built pages
(69 sitemap URLs + 5 ratings-panel fragments + 1 redirect stub, minus overlap),
with `<script>` bodies stripped so inlined JS selector strings are not counted
as markup.

## Verification checks

| # | Check | Before | After |
|---|---|---|---|
| 1 | `<h2>` "On this page" site-wide | 106 | **0** |
| 2 | Nav sheets in DOM, /reviews/ourdream-ai/ | 2 | **1** |
| 2 | Nav sheets in DOM, /test/characters/quality/ | 2 | **1** |
| 2 | Nav sheets in DOM, /best/ai-girlfriend/ | 2 | **1** |
| 3 | Chrome headings on /reviews/ourdream-ai/ | 9 | **1** |
| 3 | Total headings on /reviews/ourdream-ai/ | 38 | **29** |
| 5 | H1s on /ai-girlfriend-apps/ | 2 | **1** |
| 5 | `<h3>`s on /ai-girlfriend-apps/ | 10 | **5** |
| 6 | `id="app-directory-title"` occurrences | 1 | **1** |
| 7 | Pages with an empty heading | 2 | **0** |
| 7 | Duplicated H1 texts | 2 sets | **none** |

The brief counted 112 "On this page" headings and 23 chrome headings; this pass
measured 106 and 9 on the same pages. The difference is classification, not
disagreement — the brief's tooling counted a wider set of elements as chrome.
Both reach zero / one respectively.

### Check 4 — H1 innerText

| Page | After |
|---|---|
| /test/characters/quality/ | `Characters: Quality` |
| /test/images/quality/ | `Images: Quality` |
| /test/video/quality/ | `Video: Quality` |
| /best/ai-girlfriend/ | `Best AI Girlfriend Apps — September 2026` |

### Check 7 — pages without exactly one H1

Six remain, none of them indexable and none in the sitemap:

- `/guides/girlfriend-gpt/` — a `noindex` meta-refresh redirect stub to `/guides/girlfriendgpt/`
- `/reviews/ratings-panel/{candy-ai,girlfriendgpt,juicychat-ai,nectar-ai,ourdream-ai}/` — embeddable panel fragments, not pages

### Check 3 — what remains on /reviews/ourdream-ai/

One heading is still arguably chrome: `<h2 class="review-tab-title">Photos & Videos</h2>`,
the title of a tab panel. It is left alone because it labels a real content region.
Everything else in that page's outline is now content: the H1, the verdict heading,
the seven article section headings, the media overview cards, and the pricing sections.

## What changed, by fix

**Fix 1a** — `<h2>` to `<p>` in all seven nav sheets (`Page`, `Review`, `Default`,
`TestHub`, `TestCategory`, `BuyingGuide`, `Roundup`). The dialogs already carried
`aria-labelledby` pointing at the same id, and each `<nav>` already had its own
`aria-label`, so no accessible name was lost. The brief suggested adding
`aria-labelledby` to the `<nav>`; that was not done, because two of the navs are
named "Table of contents" and `aria-labelledby` would have overridden that with
"On this page".

**Fix 1b** — root cause: `BaseLayout` renders `MobileNavShell`, which rendered
`DefaultMobileNavSheet` unconditionally on every page. Only its *JavaScript* opted
out when a page sheet was present; the markup always shipped. `BaseLayout` now takes
`hasPageNavSheet`, passed by the nine pages that render their own sheet
(`dev/home-full`, `reviews/[slug]`, `reviews/preview/[slug]`, `test/index`,
`test/tooltips/index`, `test/[category]/index`, `test/[category]/[subscore]/index`,
`guides/how-to-choose-an-ai-girlfriend-app`, `best/ai-girlfriend`).

Pages that were getting both: every review, every /test/ page, the roundup hub and
the buying guide — 41 of the built pages by direct count.

**Fix 1c / 1d** — mobile menu group kickers and footer column labels demoted.
Each footer `<ul>` now takes `aria-labelledby` pointing at its label.

**Fix 2a** — `TestMethodologyTitle` now renders a wrapper carrying the type and
layout classes, with the `<h1>` and the eyebrow as inline siblings inside it.
Rendering is unchanged because Tailwind preflight already zeroes an `h1`'s own
font and margin, and the wrapper holds what the `<h1>` used to hold.

**Fix 2b** — the roundup H1's `::before { content: ' ' }` was generated content,
invisible to `innerText`. Replaced with a real ` — ` text node, hidden below 768px
where the two spans already stack onto separate lines.

**Fix 3** — subscore H1s now carry the parent category (`Characters: Quality`).
Category pages were already unique and are untouched.

**Fix 4** — `/ai-girlfriend-apps/` renders its own visible H1; `AppDirectory`'s
screen-reader-only twin is now a `<p>` that keeps the id so the section is still
named. Both product layouts must stay in the DOM for the list/cards view switch,
so the heading lives on the row (the default view) and the card name is a `<p>`.

**Fix 5** — the sitemap results heading is now created when results appear and
removed when they go away, rather than shipping as an empty hidden `<h2>`.

**Fix 6 — option (a) was chosen.** The article title stopped being a heading.
Option (b) was rejected: the article's section headings come from CMS `h2` blocks
rendered by `renderReviewBlocks.ts`, and demoting them would have changed the TOC
levels, the glossary section tracking and the nav sheet's heading query. The title
also repeated the page H1 word for word, so it carried no information that was lost.

**Beyond the brief** — `/guides/` shipped the same empty-heading bug as the sitemap:
an empty `<h2 data-guides-count aria-live>`. It has to stay in the DOM for the live
region to announce, so it became a `<p>`; the section is still named by it.

## The one thing that nearly broke, silently

`global.css` sets `h1,h2,h3,h4,h5,h6 { font-family: var(--font-display) }`.
Four of the demoted classes never set their own `font-family`, so changing the tag
silently switched them from Gabarito to Inter. This was caught by pixel-diffing
every page before and after, not by reading the CSS.

Pinned `font-family: var(--font-display)` on:

- `.roundup-nav-sheet__toc-title` (in both `roundup.css` and `nav-sheet.css`)
- `.site-footer__col-title`
- `.home-app-card__name`

`.site-mobile-menu__kicker`, `.review-article-title`, `.listing__section-title`
and `.si-results-title` already declared a face and were unaffected.

## Visual verification

Both trees were built, their SSR routes rendered to static files, served from
identical local servers and screenshotted full-page at 1440 and 390, then
pixel-diffed.

Pixel-identical: `/`, `/reviews/ourdream-ai/`, `/sitemap/`, `/guides/`,
`/best/ai-girlfriend/` at 390, `/ai-girlfriend-apps/` (the only diff there was a
48×48 brand logo that finished loading in one run and not the other — the text,
spacing and score rows line up exactly).

Intentionally different, each one sanctioned by the brief:

- `/test/characters/quality/` — the H1 text (fix 3); +33px at 390 where it now wraps
- `/best/ai-girlfriend/` — the separator (fix 2b); +48px at 1440, see below
- `/test/` and `/guides/how-to-choose-an-ai-girlfriend-app/` — the banner (task 2)

### The roundup title now wraps

With ` — ` added, `Best AI Girlfriend Apps — September 2026` no longer fits on one
line at 1440 and breaks to two, adding 48px. Left alone it broke between
"September" and "2026"; `white-space: nowrap` on the date span moves the break to
after the dash, so it reads:

```
Best AI Girlfriend Apps —
September 2026
```

## Task 2 — one opening shape for all three long-form pages

`/best/ai-girlfriend/`, `/test/` and `/guides/how-to-choose-an-ai-girlfriend-app/`
now all open header → fixed banner → rounded body → breadcrumbs → H1.

- The buying guide's banner was `https://picsum.photos/seed/buying-guide-hero/1600/640`,
  a placeholder service that was serving a random stock photo. That constant is deleted.
- All three read the banner from `loadRoundupForPublic('ai-girlfriend', …)`, the same
  source the roundup hub uses, so they cannot drift apart.
- `TestCategoryHero` gained a `scroll-under` variant matching `RoundupHero`.
- `.roundup-page--covers-hero` and a new `.standard-content-page--covers-hero` share
  one rule.
- The /test/ breadcrumb padding complaint is fixed by the same change: the covering
  body sets `--roundup-intro-offset: 1.5rem`, the value the roundup hub already used.

There are 12 other `picsum.photos` placeholders still in `src/data/` and `src/lib/`,
including `testHubFeaturedImage`. They are out of scope for this pass but worth a
separate sweep.

## Fix 7 — proposal, not applied

### The reported h2 → h5 skip is a measurement artifact

The actual document order on a subscore page is h1 → h2 → h3 → h4 → h5, with no
level skipped. The h3 (`test-evidence-group__name`) and h4
(`test-scored-test__title`) both sit inside `<header>` elements; a tool that treats
`<header>` contents as chrome would see h2 followed by the h5s and report a skip.
Nothing needs fixing here.

### The redundant nesting is real and bigger than reported

Across the 27 subscore pages there are **137** places where an evidence group's
`<h3>` is immediately followed by a scored test's `<h4>` with the same text or a
text that starts with it — `Filters` / `Filters`, `Profile Quality` / `Profile
Quality`, `Duplicate profiles` / `Duplicate profiles found`.

On **26 of the 27 pages the evidence group count equals the scored test count**,
so every group holds exactly one test and the group heading is pure duplication.

Three options:

1. **Collapse a single-test group into its test.** When a group has one scored test,
   render only the test's heading and drop the group's. Removes all 137 pairs,
   keeps the multi-test page intact. Needs a decision about the group's weight badge
   and test-count line, which would move onto the test's header.
2. **Keep both, demote the inner one.** Leave the group at h3 and make a single-test
   card's title a non-heading `<p>`. Smallest change, but leaves the same words on
   screen twice.
3. **Keep both, rename.** Keep the structure and make the group label and the test
   title read differently. A content change across 137 places, not a code change.

Option 1 is the recommendation: it is the only one that removes the duplication
rather than hiding it.

### The comics guide h2 → h4

On `/guides/ourdream-ai-comics/`, under the h2 "OurDream AI Comics Examples", three
headings are h4 and skip h3: "Anime Comic Examples", "Realistic Comic Examples",
"Available Comic Art Styles". These are CMS `h4` blocks — per the note in
`ourdream-article.css` this was a deliberate Figma demotion from h3 to h4. The fix
is to change those three blocks to `h3` in the CMS, not in code.
