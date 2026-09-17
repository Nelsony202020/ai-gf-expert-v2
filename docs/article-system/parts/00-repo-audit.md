# 00 — Repo audit (factual, as of branch `feat/article-system-figma`)

Scope: what exists today, for a spec of a new typed-block article system on `/guides/*`.
All paths absolute from repo root `/home/claude/repo`.

---

## 1. Build / output mode

| Fact | Value | Source |
|---|---|---|
| Astro version | `astro ^7.1.1` | `package.json` |
| `output` | `'static'` | `astro.config.mjs:47` |
| Adapter | `@astrojs/vercel` (`^11.0.3`), `vercel({ maxDuration: 120 })` | `astro.config.mjs:56` |
| `trailingSlash` | `'always'` on Vercel, `'ignore'` locally | `astro.config.mjs` |
| `build.inlineStylesheets` | `'always'` — every page stylesheet is inlined into the HTML | `astro.config.mjs:49-53` |
| Integrations | `canonicalGuard()` only (no React integration; Vite `@vitejs/plugin-react` instead) | `astro.config.mjs:60` |
| Vite plugins | `astroScriptTsPlugin()`, `@tailwindcss/vite`, `react()` | `astro.config.mjs:62` |
| Markdown | `rehypePlugins: [rehypeAffiliateLinks]` — **not used by any guide page** | `astro.config.mjs` |
| Build script | `npm run check:sitemap && astro build` | `package.json` |
| `vercel.json` | redirects (incl. `/guides/:slug` → `/guides/:slug/` 301, `/guides` → `/guides/`), `X-Robots-Tag` on `/go/*`, 3 env vars, 2 crons. **No CSP, no custom headers for `/guides/*`.** | `vercel.json` |

Default is prerendered; server routes opt out with `export const prerender = false`.

### SSR routes under `src/pages/guides/` (`prerender = false`)

| File | Route | Why |
|---|---|---|
| `src/pages/guides/candy-ai.astro:2` | `/guides/candy-ai/` | brand hub, reads InstantDB at request time |
| `src/pages/guides/girlfriendgpt.astro:2` | `/guides/girlfriendgpt/` | same |
| `src/pages/guides/juicychat-ai.astro:2` | `/guides/juicychat-ai/` | same |
| `src/pages/guides/nectar-ai.astro:2` | `/guides/nectar-ai/` | same |
| `src/pages/guides/preview.astro:4` | `/guides/preview/` | Sanity draft preview, `?secret=`, `Cache-Control: no-store`, 401 without secret |

All four brand hubs render `src/layouts/BrandGuideHubPage.astro` (a one-line page: `export const prerender = false; import BrandGuideHubPage …`).

---

## 2. Design tokens

Two distinct systems coexist:

**(a) Global Tailwind v4 `@theme` tokens** — `src/styles/global.css:51-136`. Generate utilities (`bg-background`, `text-on-surface`, …). Material-3-style naming, *not* Figma naming.

**(b) Page-scoped, class-prefixed token sets** — each newer Figma board ships its own `--<prefix>-*` block on a root class. These already use the exact Figma hex values. This is the established convention a new `/guides/*` system should follow.

### (a) `global.css` `@theme` — surfaces / borders / text

| Token | Value |
|---|---|
| `--color-background` | `#f9f9f9` |
| `--color-header-surface` | `#f8faf3` |
| `--color-on-background` | `#1b1b1b` |
| `--color-surface` | `#f9f9f9` |
| `--color-surface-dim` | `#dadada` |
| `--color-surface-bright` | `#f9f9f9` |
| `--color-surface-variant` | `#e2e2e2` |
| `--color-surface-container-lowest` | `#ffffff` |
| `--color-surface-container-low` | `#f3f3f3` |
| `--color-surface-container` | `#eeeeee` |
| `--color-surface-container-high` | `#e8e8e8` |
| `--color-surface-container-highest` | `#e2e2e2` |
| `--color-surface-tint` | `#a04100` |
| `--color-on-surface` | `#1b1b1b` |
| `--color-on-surface-variant` | `#5a4136` |
| `--color-inverse-surface` | `#303030` |
| `--color-inverse-on-surface` | `#f1f1f1` |
| `--color-outline` | `#8e7164` |
| `--color-outline-variant` | `#e2bfb0` |
| `--color-tertiary` | `#5f5e5e` (used as "muted text" across the site) |
| `--color-on-tertiary` | `#ffffff` |
| `--color-tertiary-container` | `#9a9898` |
| `--color-on-tertiary-container` | `#313131` |
| `--color-tertiary-fixed` | `#e5e2e1` |
| `--color-tertiary-fixed-dim` | `#c8c6c5` |
| `--color-on-tertiary-fixed` | `#1c1b1b` |
| `--color-on-tertiary-fixed-variant` | `#474746` |

Brand / accent:

| Token | Value |
|---|---|
| `--color-accent` | `#db2777` (brand pink) |
| `--color-accent-soft` | `#fce7f3` |
| `--color-brand-lime` | `#daf66c` |
| `--color-brand-lime-dark` | `#b8d44f` |
| `--color-on-brand-lime` | `#1b1b1b` |
| `--color-footer` | `#1a2418` |
| `--color-footer-muted` | `#9cab96` |
| `--color-primary` | `#a04100` |
| `--color-on-primary` | `#ffffff` |
| `--color-primary-container` | `#daf66c` (re-declared at `:136`, overrides the earlier `#ff6b00`) |
| `--color-on-primary-container` | `#1b1b1b` (re-declared) |
| `--color-inverse-primary` | `#ffb693` |
| `--color-primary-fixed` | `#ffdbcc` · `-dim` `#ffb693` · `--color-on-primary-fixed` `#351000` · `-variant` `#7a3000` |
| `--color-secondary` | `#7c5800` · `--color-on-secondary` `#ffffff` · `--color-secondary-container` `#feb700` · `--color-on-secondary-container` `#6b4b00` · `--color-secondary-fixed` `#ffdea8` · `-dim` `#ffba20` · `--color-on-secondary-fixed` `#271900` · `-variant` `#5e4200` |
| `--color-error` | `#ba1a1a` · `--color-on-error` `#ffffff` · `--color-error-container` `#ffdad6` · `--color-on-error-container` `#93000a` |

Radii (only two exist):

| Token | Value |
|---|---|
| `--radius-lg` | `0.75rem` |
| `--radius-xl` | `1rem` |

Link decoration:

| Token | Value |
|---|---|
| `--content-link-underline` | `rgb(219 39 119 / 35%)` (`global.css`, on `:root`) |

Dark overrides (`[data-theme='dark']`, `global.css:300-331`):
`--color-background #020617` · `--color-header-surface #0f172a` · `--color-on-background #f1f5f9` · `--color-surface #020617` · `--color-surface-variant #1e293b` · `--color-surface-container-lowest/-low #0f172a` · `--color-surface-container #1e293b` · `-high #334155` · `-highest #475569` · `--color-on-surface #f1f5f9` · `--color-on-surface-variant #94a3b8` · `--color-tertiary #94a3b8` · `--color-accent #db2777` · `--color-accent-soft rgb(219 39 119 / 14%)` · `--color-footer #0f172a` · `--color-footer-muted #94a3b8` · `--dark-elevated #0f172a` · `--dark-raised #1e293b` · `--dark-border #334155` · `--dark-border-subtle #1e293b` · `--dark-muted #94a3b8` · `--dark-hover rgb(219 39 119 / 12%)` · `--dark-hover-strong rgb(219 39 119 / 18%)` · `--dark-accent-text #f472b6` · `--color-brand-lime #db2777` · `--color-brand-lime-dark #be185d` · `--color-on-brand-lime #ffffff` · `--color-primary-container #db2777` · `--color-on-primary-container #ffffff`

**Not present anywhere as tokens:** a spacing scale, a z-index scale, an elevation/shadow scale. Spacing comes from Tailwind utilities or per-file literals; `z-index` is hard-coded per rule; shadows are inline `box-shadow` literals. The only shadow-ish tokens are `--hub-float` (`guide-hub.css:19`) and `--mobile-nav-glass-shadow` (`mobile-nav.css:12`).

### (b) Page-scoped Figma token sets (the relevant prior art)

`src/styles/ourdream-article.css:3-21` — `.ourdream-article-page` (today's guide-article system):

| Token | Value | Dark (`:1391`) |
|---|---|---|
| `--od-ink` | `#141317` | `#f7f7f6` |
| `--od-muted` | `#55545b` | `#a8a7ae` |
| `--od-dim` | `#8a8991` | `#8a8991` |
| `--od-hairline` | `#e6e6e3` | `#333239` |
| `--od-rail` | `#d2d2ce` | `#4a4950` |
| `--od-pink` | `#db2777` | — |
| `--od-pink-soft` | `#fce7f3` | — |
| `--od-pink-ink` | `#be185d` | — |
| `--od-orange-soft` | `#ffedd5` | — |
| `--od-orange-ink` | `#e8760a` | — |
| `--od-page` | `#f9f9f9` | `#0f0f12` |
| `--od-white` | `#fff` | `#141317` |
| `--od-sidebar` | `15rem` | — |
| `--od-content` | `46.25rem` | — |
| `--od-layout-gap` | `5rem` | — |
| `--od-author-avatar` | set inline per page | — |

`src/styles/guide-hub.css:3-23` — `.guide-hub` (loaded on **every** page that uses `Header.astro`):
`--hub-ink #141317` · `--hub-on-ink #f7f7f6` · `--hub-on-ink-muted #a4a3aa` · `--hub-ink-raised #212026` · `--hub-border-ink #333239` · `--hub-page #f7f7f6` · `--hub-card #ffffff` · `--hub-primary #141317` · `--hub-secondary #55545b` · `--hub-muted #8a8991` · `--hub-hairline #e6e6e3` · `--hub-pink #db2777` · `--hub-pink-press #be185d` · `--hub-pink-soft #fce7f3` · `--hub-row-hover rgb(219 39 119 / 6%)` · `--hub-float 0 4px 8px rgb(21 17 26 / 10%), 0 24px 48px -8px rgb(21 17 26 / 16%)`
Dark (`:1129`): `--hub-page #141317` · `--hub-card #1c1b20` · `--hub-primary #f7f7f6` · `--hub-secondary #a4a3aa` · `--hub-muted #8a8991` · `--hub-hairline #333239` · `--hub-row-hover rgb(219 39 119 / 8%)`

`src/styles/home-desktop.css:1-25` — `.home-v2` (also loaded on every `Header.astro` page). Only place with a **complete score palette**:
`--home-ink #101014` · `--home-ink-raised #1c1c22` · `--home-ink-border rgb(255 255 255 / 8%)` · `--home-page #f7f7f6` · `--home-card #ffffff` · `--home-sunken #efefed` · `--home-hairline #e6e6e3` · `--home-text #141317` · `--home-secondary #55545b` · `--home-muted #8a8991` · `--home-on-ink #f7f7f6` · `--home-on-ink-muted #a4a3aa` · `--home-pink #db2777` · `--home-high #16a34a` · `--home-high-soft #dcfce7` · `--home-mid #e8760a` · `--home-mid-soft #ffedd5` · `--home-low #dc2626` · `--home-track #e7e7e4` · `--home-display 'Bricolage Grotesque Variable', …` · `--home-gutter 32px` · `--home-max 1120px` · `--home-ease 180ms ease` · `--home-ease-move 180ms cubic-bezier(0.22,1,0.36,1)` · `--home-grid-size 48px` (+ hex-grid vars)
Dark (`:2555`): `--home-page #121214` · `--home-card #1b1b1f` · `--home-sunken #161619` · `--home-hairline #2a2a30` · `--home-text #f5f5f5` · `--home-secondary #c5c5cc` · `--home-muted #a6a6af` · `--home-track #2a2a30` · `--home-high-soft #14351f` · `--home-mid-soft #3a2612`

Other sets with identical values (review pages, not guides): `src/styles/full-review-article.css:3-12` (`--fr-*`), `src/styles/review-shell.css:4-15` (`--rs-*`), `src/components/review/ratings-body.css:4-18` (`--rft-*`, incl. `--rft-score-high/-mid/-low`), `src/styles/sitemap.css:9-28` (`--si-*`), `src/styles/home-chrome-header.css:3-9` (`--home-chrome-*`), `src/components/admin/testing/testing-ui.css:4-9` (`--testing-*`).

`src/styles/standard-content.css:3-9` — layout-only tokens: `--roundup-sidebar-width 12.5rem` · `--roundup-layout-gap 2rem` · `--roundup-content-max 48rem` · `--roundup-header-bg #f8faf3` (dark `#0f172a`) · `--roundup-intro-offset 0`.

### Figma token collision check

| Figma name | Value | Exists today? | Where |
|---|---|---|---|
| `surface/page` | `#f9f9f9` | **value yes, name no** | `--color-background` / `--color-surface` / `--od-page` = `#f9f9f9`. Note `--hub-page` / `--home-page` use `#f7f7f6` instead — two competing "page" values. |
| `surface/card` | `#ffffff` | value yes, name no | `--color-surface-container-lowest`, `--hub-card`, `--home-card`, `--od-white` |
| `surface/sunken` | `#efefed` | value yes, name no | `--home-sunken` only |
| `surface/ink` | `#141317` | value yes, name no | `--hub-ink`, `--home-text`, `--od-ink`, `--fr-ink`, `--rs-ink`, `--rft-text`, `--si-ink` |
| `border/hairline` | `#e6e6e3` | value yes, name no | `--hub-hairline`, `--home-hairline`, `--od-hairline`, `--fr-hairline`, `--rs-line`, `--rft-hairline` |
| `border/strong` | `#d2d2ce` | value yes, name no | **`--od-rail` only** (3 occurrences repo-wide) |
| `text/primary` | `#141317` | value yes, name no | same as `surface/ink` above — **Figma reuses one hex for two roles; no existing token distinguishes them** |
| `text/secondary` | `#55545b` | value yes, name no | `--hub-secondary`, `--home-secondary`, `--od-muted`, `--fr-secondary`, `--rs-muted`, `--rft-secondary` |
| `text/muted` | `#8a8991` | value yes, name no | `--hub-muted`, `--home-muted`, `--od-dim`, `--fr-muted`, `--rs-subtle`, `--rft-muted` |
| `text/on-ink` | `#f7f7f6` | value yes, name no | `--hub-on-ink`, `--home-on-ink`, `--rft-on-ink` |
| `action/pink` | `#db2777` | value yes, name no | `--color-accent` (global) + `--hub-pink`, `--home-pink`, `--od-pink`, `--fr-pink`, `--rs-pink`, `--rft-pink` |
| `action/pink-press` | `#be185d` | value yes, name no | `--hub-pink-press`, `--od-pink-ink`, `--fr-pink-press`, `--rs-pink-deep`, `--color-brand-lime-dark` (dark mode) |
| `action/pink-soft` | `#fce7f3` | value yes, name no | `--color-accent-soft` (global), `--hub-pink-soft`, `--od-pink-soft`, `--rft-pink-soft` |
| `score/mid` | `#e8760a` | value yes, name no | `--home-mid`, `--od-orange-ink`, `--rs-orange`, `--rft-score-mid` |
| `score/mid-soft` | `#ffedd5` | value yes, name no | `--home-mid-soft`, `--od-orange-soft` |
| `score/low` | `#dc2626` | value yes, name no | `--home-low`, `--rft-score-low` |

**Missing entirely (no token, no consistent hex):** nothing from the list is absent by value. But:
- **No name collisions at all.** Nothing in the repo uses `surface/*`, `border/*`, `text/*`, `action/*`, `score/*` naming, or `--surface-page`-style flat names. A new `--art-*` (or similar) prefixed block can be introduced with zero rename risk.
- `score/high` and `score/high-soft` are not in the Figma list given, but exist in code as `#16a34a` / `#dcfce7` (`--home-high`, `--home-high-soft`, `--rft-score-high`, `--rs-green`). Score bands are computed in `src/lib/ratings/figmaScoreTone.ts`: `>=8 high`, `>=5 mid`, else `low`, `null → pending`.
- `surface/sunken #efefed` and `border/strong #d2d2ce` each exist in exactly one file today — the least-established values.
- `#f9f9f9` vs `#f7f7f6` is a real inconsistency: global/review/ourdream pages use `#f9f9f9` as page bg, hub/home use `#f7f7f6`.

---

## 3. Fonts

Self-hosted via `@fontsource*` npm packages, imported **in `src/layouts/BaseLayout.astro:23-28`** (so every page, including all of `/guides/*`). No `@font-face` blocks in `src/` or `public/`; no font files in `public/`.

| Import | Package | Variable? | Axis/style |
|---|---|---|---|
| `@fontsource-variable/hanken-grotesk/wght.css` | `^5.3.0` | **variable** | `wght` normal |
| `@fontsource-variable/bricolage-grotesque/standard.css` | `^5.3.0` | **variable** | standard axes |
| `@fontsource-variable/inter/standard.css` | `^5.3.0` | **variable** | standard axes |
| `@fontsource-variable/jetbrains-mono/wght.css` | `^5.3.0` | **variable** | `wght` normal |
| `@fontsource/instrument-serif/400.css` + `/400-italic.css` | `^5.3.0` | **static** | 400 + 400 italic |

Preload (`BaseLayout.astro:~150`): exactly one font is preloaded —
`import headingFontUrl from '@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2?url'` (`BaseLayout.astro:30`) →
`<link rel="preload" as="font" type="font/woff2" href={headingFontUrl} crossorigin />`.

Icon font is still remote: `MATERIAL_SYMBOLS_HREF` from `src/lib/ui/materialSymbols.ts`, loaded `media="print" onload="this.media='all'"` with a `<noscript>` fallback, plus `preconnect` to `fonts.googleapis.com` / `fonts.gstatic.com`. No other Google Fonts request. No Astro `experimental.fonts` integration.

Family stacks (`src/styles/global.css:56-61`):

| Token | Stack |
|---|---|
| `--font-sans` | `'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif` |
| `--font-display` | `'Hanken Grotesk Variable', 'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif` |
| `--font-serif` | `'Instrument Serif', ui-serif, Georgia, 'Times New Roman', serif` |
| `--font-mono` | `'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace` |
| `--font-label` | same as `--font-mono` |

**Hanken Grotesque for headings — confirmed.** `src/styles/global.css` `@layer base`: `h1,h2,h3,h4,h5,h6 { font-family: var(--font-display); }`, and `--font-display` is Hanken Grotesk. `body { font-family: var(--font-sans) }` (Inter).

**Bricolage Grotesque — present and used**, but never as `--font-display`. It is referenced as a per-scope override:
- `src/styles/home-desktop.css:21` `--home-display`
- `src/styles/full-review-article.css:11` `--fr-display`
- `src/styles/sitemap.css:28` `--si-display`
- `src/styles/footer.css:239`, `src/styles/site-mobile-menu.css:76,133`, `src/components/review/ratings-evidence.css:2218,2234` (direct `font-family`)
- `src/styles/ourdream-article.css` (7 places) uses `var(--font-display, 'Bricolage Grotesque', …)` — i.e. Bricolage is only the *fallback*, so guide article headings actually render in **Hanken Grotesk**, not Bricolage.

**Geist Mono — absent.** No occurrence in `package.json`, `src/`, or `public/`. Adding it means a new dependency (or self-hosted files) + a new preload decision.

---

## 4. Guides routes

Every file under `src/pages/guides/` (14):

| File | Route | Mode | Data source | Layout / components | Body rendering |
|---|---|---|---|---|---|
| `index.astro` | `/guides/` | static | `src/data/guides.ts` (→ Sanity) + a hard-coded `staticGuides` array + `src/data/buying-guide-content.ts` | `BaseLayout` (`theme` default `full`), `Header`, `Footer`, `Breadcrumbs`; Tailwind utility card grid | n/a (cards only) |
| `[slug].astro` | `/guides/<sanity-slug>/` | static (`getStaticPaths` over `guides`) | `getGuide(slug)` from `src/lib/sanity/guides.ts` | `BaseLayout`, `Header`, `Footer`, `GuideArticle` | portable text → HTML via `renderGuideBody`, injected with `set:html` |
| `preview.astro` | `/guides/preview/` | **SSR** | `getGuide(slug, true)` (drafts) + `SANITY_PREVIEW_SECRET` | same as `[slug]` | same |
| `ourdream-ai-comics.astro` | `/guides/ourdream-ai-comics/` | static | `src/content/guides/ourdream-ai-comics.html?raw` + `.faq.json`; author from `src/data/authors.ts` | `BaseLayout`, `Header`, `Footer`, `OurDreamArticlePage`; imports `styles/roundup.css` + `styles/ourdream-article.css` | **raw hand-authored HTML**, `set:html` |
| `how-to-use-ourdream-ai-image-generator.astro` | `/guides/how-to-use-ourdream-ai-image-generator/` | static | `content/guides/ourdream-ai-image-generator.html?raw` | same as above | raw HTML |
| `ourdream-ai-image-prompt.astro` | `/guides/ourdream-ai-image-prompt/` | static | `content/guides/ourdream-ai-image-prompt-guide.html?raw` | same | raw HTML |
| `ourdream-ai-prompt.astro` | `/guides/ourdream-ai-prompt/` | static | `content/guides/ourdream-ai-prompt-guide.html?raw` + `.faq.json` | same | raw HTML |
| `how-to-choose-an-ai-girlfriend-app.astro` | `/guides/how-to-choose-an-ai-girlfriend-app/` | static | `src/data/buying-guide-content.ts` + `enrichBuyingGuideUserTypes()` (InstantDB) | `BaseLayout`, `Header`, `Footer`, `TestCategoryHero`, 7 `BuyingGuide*` components, `ArticleUtilityRail`, `ArticleFeedbackLink`; imports `styles/test-hub.css` + `styles/buying-guide.css` | **hand-composed Astro components**, no HTML string |
| `ourdream-ai.astro` | `/guides/ourdream-ai/` | static | `loadComparisonProducts()` (InstantDB) + `src/data/ourdream-guide-hub.ts` | `BaseLayout`, `OurDreamGuideHub`, `Footer`, `AffiliateLink`, `HomeIcon` (no `Header.astro`) | n/a (hub) |
| `candy-ai.astro` | `/guides/candy-ai/` | **SSR** | `loadPublishedProductBySlug` + `getBrandGuideHubConfig` | `BrandGuideHubPage` → `BaseLayout` (`theme="core"`), `BrandGuideHub` | n/a (hub) |
| `girlfriendgpt.astro` | `/guides/girlfriendgpt/` | **SSR** | same | same | n/a |
| `juicychat-ai.astro` | `/guides/juicychat-ai/` | **SSR** | same | same | n/a |
| `nectar-ai.astro` | `/guides/nectar-ai/` | **SSR** | same | same | n/a |
| `girlfriend-gpt.astro` | `/guides/girlfriend-gpt/` | static | — | — | 301 `Astro.redirect('/guides/girlfriendgpt/', 301)` |

### `src/components/guides/GuideArticle.astro`
- Props: `{ guide: Guide }` (Sanity shape).
- Renders `Breadcrumbs`, `<h1>`, author avatar/name, `publishedAt`, hero `<img>`, then a single `<div class="guide-prose legal-prose prose prose-neutral … " data-glossary-decorate set:html={renderGuideBody(...)}>`.
- Body = **portable text compiled to an HTML string** by `renderGuideBody` in `src/lib/sanity/guides.ts`.
- Carries its own `<style is:global>` block (~130 lines) defining `.guide-prose h2/h3/blockquote`, `.guide-callout` (+ `--tip`, `--warning`), `.guide-product-card` (+ `__info/__name/__tagline/__meta/__score/__cta`), `.guide-faq__item`, `.guide-figure`. All styled with `--color-*` globals, **not** Figma tokens.
- Used by both `[slug].astro` and `preview.astro`.

### `src/components/article/*.astro` (3 files, all generic, not guide-specific)
| File | What it is |
|---|---|
| `ArticleUtilityRail.astro` | Floating right rail: optional nav-sheet button, back-to-top with SVG scroll-progress ring, `ShareMenu variant="fab"`. Client script deferred via `requestIdleCallback`, rebinds on `astro:page-load`, honours `prefers-reduced-motion`. Styles in `src/styles/article-utilities.css`. |
| `ArticleFeedbackLink.astro` | "Spot a mistake?" button; dispatches `article-feedback:open` CustomEvent. |
| `ArticleFeedbackPanel.astro` | 14 KB modal listening for that event: category chips, topic select, textarea + counter, success state. Posts to the contact/engage API. |

Only `how-to-choose-an-ai-girlfriend-app.astro` uses these under `/guides/*`.

### `src/components/guides/ourdream/` — today's real article system
| File | Role |
|---|---|
| `OurDreamArticlePage.astro` | The article shell. Props `{ title, breadcrumbLabel, bodyHtml, author, published, publishedShort?, publishedIso?, canonical, currentHref, hubHref? }`. Builds TOC with `extractOurDreamGuideToc(bodyHtml)` and read time with `estimateGuideReadMinutes(bodyHtml)`; renders `Breadcrumbs`, hero title, author meta, `OurDreamArticleMobileJump`, `<div class="ourdream-article-prose" data-glossary-decorate data-ourdream-prose set:html={bodyHtml}>`, `OurDreamArticleRelated`, `OurDreamArticleSidebar`. Loads `test-hub-toc.client.ts` + `ourdream-article.client.ts`. |
| `OurDreamArticleSidebar.astro` | Sticky desktop TOC rail (H2 only). |
| `OurDreamArticleMobileJump.astro` | `<details>`-based mobile jump menu. |
| `OurDreamArticleRelated.astro` | Related-guides list from `hubHref`/`currentHref`. |
| `ourdream-article.client.ts` | Three behaviours: (1) `wrapCompareFigures` — pairs adjacent `<figure>`s into `.od-compare-grid`; (2) `bindCopyButtons` — `[data-od-copy]` → `navigator.clipboard.writeText`, "Copied" for 1600 ms; (3) `bindPromptExpand` — `[data-od-expand]` adds `.is-expanded`. |

`src/lib/ourdream-guide-toc.ts`: regex `/<h2\s+[^>]*id="([^"]+)"[^>]*>…/gi` over the raw HTML string; read time = words / 220.

### `src/components/guides/` (other)
`BuyingGuideHeroIntro`, `BuyingGuideSidebar` (TOC + `<details>`), `BuyingGuideMobileNavSheet`, `BuyingGuideFigure` (figure+caption, 268 B), `BuyingGuideQuiz` + `buying-guide-quiz.client.ts`, `BuyingGuideUserTypeCard`, `BuyingGuideNarrowDown`, `BuyingGuideTestingHelps`; `hub/BrandGuideHub.astro`, `hub/OurDreamGuideHub.astro`.

---

## 5. Content sources

### `instant.schema.ts` — 35 entities. **No `guides`, `articles`, `blocks`, or `sections` entity exists.**

Relevant ones:

| Entity | Guide-relevant fields |
|---|---|
| `reviews` (`:166`) | `intro`, `ourTake`, `sections` (json, *legacy ordered editorial sections*), **`blocks` (json) — "Structured block document: `[{ id, type, data }]` with a server-validated whitelist of block types (no raw HTML / scripts / arbitrary styling)"**, `revisions` (json, `[{ savedAt, savedBy, blocks }]`), `lastEditedBy`, `lastEditedAt`, `testingSummary`, `versionChangeSummary`, `pricingExplanation`, `publishedAt`, `updatedAt` |
| `roundups` (`:731`) | `slug` (unique, `/best/[slug]`), `title`, `h1`, `intro`, `status`, `methodologyNote`, `faqs` (json `{question,answer}[]`), `rankingFormula`, `publishedAt`, `seoTitle`, `seoDescription`, `canonicalUrl`, `noindex`, `ogTitle`, `ogDescription`, `ogImageUrl`, `breadcrumbLabel` |
| `roundupEntries` (`:757`) | `calculatedPosition`, `publishedPosition`, `awardLabel`, `reason`, `mainStrength`, `mainLimitation`, `included`, `editorialOverride`, `overrideReason` |
| `products` (`:67`) | full product record (name/slug/scores/etc.) — the source guides reference by slug |
| `glossaryEntries` (`:801`) | `term`, `anchor` (unique), `tooltipDefinition`, `ctaLabel`, `fullDefinition` (TipTap JSONDoc), `aliases`, `displayAliases`, `category`, `status`, `autoTooltip`, `scope` (`"reviews"` in V1), `publishedAt` |
| `redirects` (`:787`) | `sourcePath` (unique), `destinationPath`, `redirectType` (301/302/410), `active`, `createdBy`, `notes`, `hitCount`, `createdAt` |
| `scoreSnapshots` (`:606`), `testRuns` (`:565`), `evidenceResults` (`:581`), `categories`, `subscores`, `evidenceDefinitions`, `methodologyVersions` | the score graph a guide block would read from |
| `authors` (`:53`), `media` (`:187`), `affiliateLinks` (`:468`) | bylines, images, CTA links |

### Existing block/section model worth copying

`src/lib/validation/schemas.ts:160-188`:

```
REVIEW_BLOCK_TYPES = [
  'paragraph','h2','h3','h4','bulletList','numberedList','image','video','table',
  'quote','callout','prosCons','faq','relatedGuide','cta',
  'scoreOverall','scoreCategory','pricingTable','characterGallery','publicGallery',
  'evidenceSummary','methodologyLink'
]
reviewBlockSchema = { id: string(1..60), type: enum(REVIEW_BLOCK_TYPES), data: record(unknown).optional() }
```

Renderer: `src/lib/review/renderReviewBlocks.ts` (605 lines) — a `switch` over block type emitting HTML strings with `escapeHtml`, glossary decoration, `.review-callout`, `.review-proscons`, `.review-faq` (`<details>`), `.review-table-wrap`/`.review-table`, `.content-link`. Dynamic/dashboard blocks are skipped in the article body (`SKIP_ARTICLE_DASHBOARDS`). Companion: `src/lib/review/renderReviewProse.ts` (35 lines). Editor: `src/components/admin/review/ReviewEditor.tsx` (TipTap).

**This is the closest existing analogue of the proposed typed-block article system, and it is InstantDB-backed, server-validated, and already shipping on `/reviews/*`.**

### Sanity usage for guides

- `src/lib/sanity/client.ts` — minimal GROQ-over-HTTP client, no SDK. `isSanityConfigured()` = `PUBLIC_SANITY_PROJECT_ID` present. `API_VERSION = '2025-02-19'`. `perspective` = `previewDrafts` when `drafts`, else `published`. Auth header from `SANITY_API_READ_TOKEN`.
- `src/lib/sanity/guides.ts` — `listGuides()`, `getGuide(slug, drafts)`, `renderGuideBody(body, slug)`, `extractGuideFaqs(body)`. Types `GuideAuthor`, `GuideSummary`, `Guide { …, body: unknown[] }`. `listGuides()` swallows errors and returns `[]`.
- `src/data/guides.ts` — top-level `await listGuides()` at module load; consumed by `[slug].astro`, `index.astro`, `src/lib/sitemap.ts`.
- `studio/` — `schemaTypes/guide.ts` (document), `guideAuthor.ts`, `objects.ts` (`productReference`, `callout`, `faqSection`, `guideImage`), `index.ts`, `sanity.config.ts`, `sanity.cli.ts`, `package.json`, `README.md`.
- `src/pages/api/webhooks/sanity.ts` — SSR webhook (`SANITY_WEBHOOK_SECRET`), triggers rebuild.

**Sanity guide `body` block set (already a restricted typed-block model):**

| Block | Fields |
|---|---|
| `block` | styles `normal`/`h2`/`h3`/`blockquote`; lists `bullet`/`number`; marks `strong`/`em`; annotation `link{href}` |
| `productReference` | `productSlug` (slug regex, required), `display` `card`\|`inline` |
| `callout` | `tone` `info`\|`tip`\|`warning`, `text` (required) |
| `faqSection` | `items[]{ question, answer }` (min 1) |
| `guideImage` | image + `alt` (required) + `caption` |

Guide doc fields: `title`, `slug`, `excerpt`, `heroImage`, `author` (ref, required), `body` (required, min 1), `publishedAt`, `seoTitle` (≤70), `seoDescription` (≤170), `noindex`.

### Where guide bodies actually live **today**

| Source | Which guides | Notes |
|---|---|---|
| **Hand-authored HTML files in the repo** — `src/content/guides/*.html` imported with `?raw` | the 4 OurDream articles | `ourdream-ai-comics.html` 77 KB, `ourdream-ai-prompt-guide.html` 36 KB, `ourdream-ai-image-generator.html` 29 KB, `ourdream-ai-image-prompt-guide.html` 16 KB; plus 2 `.faq.json` files |
| **Sanity portable text** | `/guides/[slug]` — but `listGuides()` returns `[]` unless Sanity is configured, and `index.astro` merges Sanity guides *after* a hard-coded static list | the only CMS path; `getStaticPaths` produces zero routes when Sanity is unconfigured |
| **TypeScript data modules** | `how-to-choose-an-ai-girlfriend-app` (`src/data/buying-guide-content.ts`), `ourdream-ai` hub (`src/data/ourdream-guide-hub.ts`), brand hubs (`src/lib/guides/brandGuideHub.ts`) | |
| **InstantDB** | **no guide bodies at all** | InstantDB supplies products/scores/affiliate data that guide pages read |

Markup vocabulary already in those raw HTML files (a de-facto block set — counts across the 4 files):
`od-block` ×10 with variants `--important` ×2, `--key-takeaway` ×4, `--what-i-learned` ×2, `--tip`, `--aige-test`, plus `od-block__kicker/__title/__subtitle/__body/__role`; `od-faq` + `od-faq__item/__q/__a` ×8; `od-steps` ×3 + `__title/__body`; `od-setup` + `__grid/__row/__label/__value/__title`; `od-ab` ×2 + `--framed` + `__card/__head/__body/__badge`; `od-prompt` ×2 (+`--collapsed`, `__bar/__label/__expand`), `od-prompt-card` ×2 (+`--yes`, `__bar/__label/__text`), `od-prompt-compare` (+`__arrow/__note`); `od-chip`/`od-chip-wrap`/`od-chip-arrow` ×13; `od-structure` + `__label/__chips`; `od-compare-grid`; `od-copy` ×3; `od-media--portrait`; `od-result-label`.
Raw tag census: 998 `<p>`, 243 `<li>`, 168 `<strong>`, 164 `<h3>`, 61 `<div>`, 58 `<span>`, 51 `<h2>`, 47 `<ul>`, 41 `<blockquote>`, 35 `<img>`, 33 `<figure>`, 33 `<figcaption>`, 26 `<a>`, 4 `<ol>`, 4 `<button>`, 3 `<code>`, 2 `<pre>`, 1 `<hr>`.

---

## 6. Build-time data access (InstantDB)

- **Single choke point:** `src/lib/db/server.ts` — "This is the ONLY module that may talk to InstantDB directly — all reads/writes flow through `src/lib/db/*`." Uses **`@instantdb/admin`** (`init({ appId, adminToken, schema })`), memoised in a module-level `_db`, with `resetDb()` and `isDbConfigured()`.
- **Env vars:** `PUBLIC_INSTANT_APP_ID` (client, public) + `INSTANT_APP_ADMIN_TOKEN` (server, secret). Declared in `astro.config.mjs` `env.schema`, both `optional: true`. Throws a clear error if either is missing. `USE_DB_CONTENT` still gates some editorial overlays (homepage slots).
- **Env reader:** `src/lib/env.ts` — `env(name)` reads `process.env` first, manually parsing `.env` once (because Astro 7 + Vercel adapter don't expose non-`PUBLIC_` vars through `import.meta.env`), then falls back to `import.meta.env`.
- **Public-page loader:** `src/lib/content/store.ts` (`loadPublishedProducts`, `loadPublishedProductBySlug`, roundups, characters, media). `src/lib/content/comparisonProducts.ts` wraps it with a 30 s in-process cache (`CACHE_TTL_MS = 30_000`).
- **Build-time vs request-time:** prerendered pages call the same admin-SDK loaders inside frontmatter, so on a static page the read happens at build. The **same code is request-time** on any `prerender = false` route — which includes the four `/guides/*` brand hubs and `/guides/preview/`, plus all of `/admin/*`, `/api/*`, `/go/*`.
- Other admin-only modules under `src/lib/db/`: `crud.ts`, `registry.ts`, `auth.ts`, `audit.ts`, `publish.ts` (Vercel deploy hook), `redirects.ts`, `ranking.ts`, `cascade-delete.ts`, `notifications.ts`, `loadProductWorkspace.ts`, `listTestRunsForProduct.ts`, `clearConflictingAwards.ts`. These are not on the public guide path.
- `instant.perms.ts` / `instant.email.ts` exist; schema push via `npm run db:push` (`instant-cli`).

---

## 7. Layouts and CSS entry points on a `/guides/*` page

### Layouts
- `src/layouts/BaseLayout.astro` — the only shell used by guides. Props: `title`, `description`, `image`, `lcpImage`, `robots`, `canonical`, `ogTitle`, `ogDescription`, `theme?: 'core'|'home'|'review'|'roundup'|'directory'|'full'` (**default `'full'`**), `browserThemeColor`. Emits head meta/OG/Twitter, canonical via `canonicalPublicUrl`, favicon + CDN `preconnect`, the Hanken preload, Material Symbols stylesheet, optional LCP image preload, then `global.css` and the theme stylesheet; body renders `<slot />`, `SiteMobileMenu`, `MobileNavShell`, `ThemeToggleInit`, `ComingSoonLayer`, `ExternalLinksInit`, plus an inline theme-restore script reading `localStorage.theme`.
- `src/layouts/BrandGuideHubPage.astro` — the 4 SSR brand hubs; passes `theme="core"`.
- `src/layouts/StandardContentLayout.astro` — imports `roundup.css` + `standard-content.css`; hero/sidebar/body slots with `data-glossary-decorate`. **Not used by any `/guides/*` page today** (only route-agnostic).
- `src/layouts/LegalPage.astro`, `src/layouts/FragmentLayout.astro` — not guides.

### What a typical prerendered `/guides/*` page loads, in order
1. `src/styles/global.css` (link, but inlined by `inlineStylesheets: 'always'`) — which itself `@import`s: `tailwindcss`, `header.css`, `footer.css`, **`article-utilities.css`**, `coming-soon.css`, `mobile-nav.css`, `site-mobile-menu.css`, `nav-sheet.css`, `scroll-fade.css`, `breadcrumbs.css`, `cms-fields.css`, `dark-mode.css`.
2. `src/styles/page-full.css` (theme default `full`) — `@import`s `homepage.css`, `review-page.css`, **`roundup.css` (91 KB)**, **`directory.css` (36 KB)**, **`ratings-tooltips.css` (46 KB)**, `glossary-tooltips.css`, `pricing-tab.css`, `video-review-modal.css`, `article-utilities.css`, `market-data.css`, **`alternatives.css` (35 KB)**, `product-logos.css`.
3. From `Header.astro` → `GlobalSiteHeader.astro`: two extra `<link rel="stylesheet">` tags for **`home-desktop.css` (58 KB)** and **`guide-hub.css` (22 KB)**.
4. Page-level `import '…css'` in frontmatter — e.g. `roundup.css` + `ourdream-article.css` (29 KB) for the OurDream articles; `test-hub.css` (127 KB) + `buying-guide.css` (32 KB) for the buying guide.

**Global vs page-scoped:**

| Sheet | Scope |
|---|---|
| `global.css` and everything it `@import`s (incl. `article-utilities.css`, `dark-mode.css`, `header.css`, `footer.css`, `breadcrumbs.css`) | **global, every page** |
| `home-desktop.css`, `guide-hub.css` | effectively global — injected by `GlobalSiteHeader` on every non-home page |
| `page-full.css` / `page-review.css` / `page-home.css` / `page-roundup.css` / `page-directory.css` | per-`theme` bundles selected in `BaseLayout` |
| `ourdream-article.css`, `buying-guide.css`, `test-hub.css`, `standard-content.css` | page-scoped, imported in page/layout frontmatter |

### High-level contents of the three named sheets

| File | Size | Contents |
|---|---|---|
| `src/styles/standard-content.css` | 2.3 KB | Layout only. `.standard-content-page` (5 layout tokens: `--roundup-sidebar-width 12.5rem`, `--roundup-layout-gap 2rem`, `--roundup-content-max 48rem`, `--roundup-header-bg`, `--roundup-intro-offset`), `.standard-content-grid` + `__hero`/`__sidebar`/`__body`, `.standard-content-hero`. Single-column under 1024 px; `sidebar | body` grid above. Dark override for `--roundup-header-bg`. **No colours, no typography.** |
| `src/styles/buying-guide.css` | 32 KB | Page-scoped overrides for `/guides/how-to-choose-an-ai-girlfriend-app/`, layered on `test-hub.css`. Reskins `.buying-guide-page .test-hub__*` (main max-width `48rem`, `scroll-margin-top: 5.5rem`, h3 rhythm), then component CSS for `.buying-guide-list`, `-note`, `-coming-soon`, `-subsection`, the quiz, user-type cards, narrow-down, "how testing helps", figures. Uses `--color-*` globals + `color-mix()`, plus `--radius-lg`. Has `[data-theme='dark']` branches. |
| `src/styles/article-utilities.css` | 26 KB | **Global** (imported by `global.css`). Three widget families: `.share-menu` (trigger, dropdown, items, social icons, `--fab`/`--inline`/`--title-mobile` variants), `.article-util-rail` (stack, `__btn--nav/--top/--feedback`, SVG progress ring, hint, Herman sticker), `.article-feedback` + `.article-feedback-link` (backdrop, panel, categories, fields, counter, submit, success), plus `.article-meta-row`, `.theme-toggle*`, `.sr-only`. `--color-*` globals throughout. |

---

## 8. Existing patterns worth reusing

| Need | Existing implementation | Path |
|---|---|---|
| **Typed-block schema + server validation** | `REVIEW_BLOCK_TYPES` (22 types) + `reviewBlockSchema` | `src/lib/validation/schemas.ts:160-188` |
| **Typed-block → HTML renderer** | `renderReviewBlocks` — switch over type, `escapeHtml`, glossary decoration, skips dashboard blocks in article body | `src/lib/review/renderReviewBlocks.ts` (605 lines) |
| Prose-only renderer | `renderReviewProse` | `src/lib/review/renderReviewProse.ts` |
| Restricted CMS block set (portable text) | `guide` + `productReference`/`callout`/`faqSection`/`guideImage` | `studio/schemaTypes/guide.ts`, `studio/schemaTypes/objects.ts` |
| Portable text → HTML | `renderGuideBody` | `src/lib/sanity/guides.ts` |
| **Callouts** | `.review-callout` with `CALLOUT_LABEL` + icon, `role="note"` | `src/lib/review/renderReviewBlocks.ts:499` |
| | `.guide-callout--info/tip/warning` | `src/lib/sanity/guides.ts` + `src/components/guides/GuideArticle.astro` `<style is:global>` |
| | `.od-block--important/--key-takeaway/--tip/--what-i-learned/--aige-test` | `src/styles/ourdream-article.css` |
| **FAQ accordion** | `<details class="review-faq__item">` | `src/lib/review/renderReviewBlocks.ts:520` |
| | `<details class="guide-faq__item">` | `src/lib/sanity/guides.ts` |
| | `.od-faq__item` / `__q` / `__a` | `src/styles/ourdream-article.css` |
| | `RoundupFaq.astro`, `TestHubFrameworkAccordion.astro` | `src/components/roundup/`, `src/components/test/` |
| **TOC (desktop rail)** | `OurDreamArticleSidebar.astro` + `extractOurDreamGuideToc` (H2 regex) | `src/components/guides/ourdream/`, `src/lib/ourdream-guide-toc.ts` |
| | `StandardContentToc.astro`, `TestHubSidebar.astro`, `RoundupSidebar.astro`, `LegalSidebar.astro`, `BuyingGuideSidebar.astro` | `src/components/content/`, `test/`, `roundup/`, `legal/`, `guides/` |
| TOC scroll-spy | `test-hub-toc.client.ts` (shared, reused by the OurDream article) | `src/components/test/test-hub-toc.client.ts` |
| TOC (mobile sheet) | `OurDreamArticleMobileJump.astro`, `BuyingGuideMobileNavSheet.astro`, `PageMobileNavSheet.astro` | `src/components/guides/ourdream/`, `guides/`, `mobile/` |
| **Copy to clipboard** | `bindCopyButtons` — `[data-od-copy]` / `[data-od-copy-root]` / `[data-od-copy-text]`, "Copied" 1600 ms | `src/components/guides/ourdream/ourdream-article.client.ts` |
| | `ShareMenu.astro` (copy link + socials, `variant="fab"`) | `src/components/ui/ShareMenu.astro` |
| **Figure + caption** | `<figure class="guide-figure">` + `<figcaption>` | `src/lib/sanity/guides.ts`, styles in `GuideArticle.astro` |
| | `BuyingGuideFigure.astro` | `src/components/guides/BuyingGuideFigure.astro` |
| | 33 `<figure>`/`<figcaption>` pairs + `.od-compare-grid` auto-pairing | `src/content/guides/*.html`, `ourdream-article.client.ts` |
| **Comparison tables** | `.review-table-wrap` / `.review-table` from the `table` block | `src/lib/review/renderReviewBlocks.ts:576` |
| | `EvidenceCategoryTable.astro` (ARIA `role="table"` grid, score tone pills) | `src/components/review/EvidenceCategoryTable.astro` |
| | `RoundupCompare.astro` (+ `roundup-compare.css`), `RoundupAtAGlance.astro`, `RoundupCategoryScores.astro` | `src/components/roundup/` |
| Score tone bands | `getFigmaScoreTone` (`>=8 high`, `>=5 mid`, else `low`, null `pending`), `figmaScoreBarWidth` | `src/lib/ratings/figmaScoreTone.ts` |
| Glossary auto-tooltips | `data-glossary-decorate` attribute contract | `GlossaryTooltipInit.astro`, `PublicGlossaryTooltips.astro`, `src/styles/glossary-tooltips.css` |
| Breadcrumbs | `Breadcrumbs.astro` + `src/styles/breadcrumbs.css` | `src/components/ui/` |
| Affiliate links | `AffiliateLink.astro`, `src/lib/affiliate/rel.ts` (`goAffiliateRel`, `isGoAffiliateHref`) | |
| Read time | `estimateGuideReadMinutes` (words / 220) | `src/lib/ourdream-guide-toc.ts` |
| Canonical URLs | `canonicalPublicUrl`, `resolveCanonicalUrl` | `src/lib/siteOrigin.ts` |
| CDN / image opt | `cdnAsset`, `getCdnBaseUrl`, `optimizedImageUrl`, `heroImageSrcSet` | `src/lib/media/cdn.ts`, `src/lib/media/optimize.ts` |

---

## 9. What would break if a new CSS file and a new font were added

**No CSP anywhere.** No `Content-Security-Policy` in `vercel.json`, `astro.config.mjs`, or `src/`. Adding an inline style block, a new stylesheet, or a new font origin will not be blocked.

**No separate critical-CSS step — but `build.inlineStylesheets: 'always'`** (`astro.config.mjs:49`) is functionally one: *every* stylesheet a page references is inlined into that page's HTML. A `/guides/*` page already inlines `global.css` + `page-full.css` (incl. `roundup.css` 91 KB, `ratings-tooltips.css` 46 KB, `directory.css` 36 KB, `alternatives.css` 35 KB) + `home-desktop.css` 58 KB + `guide-hub.css` 22 KB + its own page sheet. **A new article stylesheet adds its full byte weight to every guide HTML document**, with no caching across pages. Mitigation precedent exists: `theme="core"` in `BaseLayout` skips `page-full.css` entirely (used by `BrandGuideHubPage.astro`).

**Font preload list is exactly one entry** (`BaseLayout.astro:30` + the `<link rel="preload" as="font" …>`), chosen because "The LCP element on review pages is the `<h1>`, which renders in `--font-display`." Adding a second display font (e.g. Bricolage Grotesque or Geist Mono) without adding it to the preload gives it a swap flash; adding it to the preload competes for bandwidth with the LCP image preload (`fetchpriority="high"`) on guide pages that set `lcpImage`. Geist Mono is not a dependency at all — it needs a new npm package or self-hosted `woff2` (nothing is currently self-hosted in `public/`; all fonts come from `node_modules/@fontsource*`).

Other things that will bite:

| Risk | Detail |
|---|---|
| **Sitemap build gate** | `npm run build` runs `check:sitemap` first (`scripts/check-sitemap-coverage.ts`). Every new non-dynamic page under `src/pages/` must be registered in `getAllSitemapEntries` (`src/lib/sitemap.ts`) or the build fails. Exempt prefixes: `/api/`, `/admin`, `/go/`, `/recommends/`, `/dev/`; exempt exact routes listed in `IGNORED_ROUTES` (incl. `/guides/preview/`). |
| **canonical-guard post-build scan** | `integrations/canonical-guard.mjs` walks all built HTML and throws if a canonical / `og:url` / JSON-LD contains `localhost`/`127.0.0.1`, or if `example.com` appears as an affiliate href. Always use `canonicalPublicUrl`. |
| **`vercel.json` trailing-slash redirects** | `/guides/:slug` → `/guides/:slug/` is a hard 301. A new route must be linked with a trailing slash (note `index.astro` currently links `/guides/${slug}` *without* one, taking the redirect hop). |
| **Global cascade wins over scoped styles** | `dark-mode.css` is imported last in `global.css` "so it wins over scoped Astro component styles" and uses `!important` heavily. `global.css` also force-applies `.content-link`-style bold pink underlines to bare `a[href]` inside `.guide-prose`, `.legal-prose`, `.prose-review`, `.review-blocks`, `.review-section`, `.test-prose`, `.test-methodology-prose` — a new prose class will **not** inherit that and must be added to those selector lists. Site-wide `* { scrollbar-color: … }` and `:is(a,button):has(svg) { text-decoration: none }` rules also apply. |
| **`guide-hub.css` + `home-desktop.css` arrive via the header** | `GlobalSiteHeader.astro:19-20` emits two raw `<link rel="stylesheet">` tags. Any page using `Header.astro` inherits `.guide-hub`/`.home-v2` tokens and rules whether it wants them or not; `.guide-hub__glow { display: none !important }` is already a patch for that leakage. |
| **Tailwind v4 `@theme` is the token authority** | New CSS custom properties added outside `@theme` will not generate utilities, and a name clash inside `@theme` silently regenerates utilities site-wide (see `--color-primary-container` declared twice in `global.css`). |
| **Guide slugs are Sanity-driven** | `[slug].astro`'s `getStaticPaths` comes from `await listGuides()`, which returns `[]` when `PUBLIC_SANITY_PROJECT_ID` is unset. A new system keyed off `/guides/[slug]` would collide with this route unless the existing one is retired or namespaced. |
| **Redirect obligation on slug change** | `studio/schemaTypes/guide.ts` documents that changing a published guide's slug auto-creates a 301; the mechanism lives in `src/lib/db/redirects.ts` against the InstantDB `redirects` entity. Any new guide URL scheme must hook the same table. |
| **Dark mode is mandatory** | `ourdream-article.css`, `guide-hub.css`, `home-desktop.css`, `buying-guide.css`, `standard-content.css` all ship `[data-theme='dark']` token overrides; `BaseLayout` restores theme from `localStorage` before paint and swaps `meta[name=theme-color]`. A new sheet without a dark block will render light-on-dark. |

### Three biggest risks (summary)

1. **CSS payload.** `inlineStylesheets: 'always'` means a new article stylesheet is duplicated into every guide HTML file, on top of ~250 KB of already-inlined CSS from `page-full.css` + the header-injected sheets. Needs a `theme="core"`-style opt-out, not just a new import.
2. **Token fragmentation.** The Figma palette already exists five times over under five different prefixes (`--od-*`, `--hub-*`, `--home-*`, `--fr-*`, `--rs-*`, `--rft-*`) with no shared names, and two competing page backgrounds (`#f9f9f9` vs `#f7f7f6`). Introducing a sixth set is zero-collision but deepens the drift; promoting Figma names into `global.css` `@theme` risks silently regenerating Tailwind utilities.
3. **Content-source split.** Guide bodies live in three unrelated places (raw `?raw` HTML files, Sanity portable text, TS data modules) while the mature typed-block machinery (`REVIEW_BLOCK_TYPES` + `renderReviewBlocks` + TipTap editor + audit/publish workflow) is InstantDB-backed and review-only. A new `/guides/*` block system must pick one of those lineages; `src/pages/guides/[slug].astro` and the Sanity `guide` document both already own `/guides/<slug>`.
