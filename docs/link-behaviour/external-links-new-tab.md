# External and affiliate links: new-tab behaviour

Status: fixed on `fix/external-links-new-tab` (Sep 17 2026).

## The rule

| Link kind | Example | Opens | `rel` |
|---|---|---|---|
| Affiliate (cloaked) | `/go/ourdream-ai` | new tab | `sponsored nofollow noopener` |
| Ordinary external | `https://youtube.com/...` | new tab | `noopener noreferrer` |
| Internal | `/reviews/ourdream-ai/` | same tab | — |
| Anchor / mail / tel | `#pricing`, `mailto:` | same tab | — |
| Explicit opt-out | `target="_self"` | same tab | untouched |

**Affiliate links deliberately do not get `noreferrer`.** It strips the
referrer header, which can break affiliate attribution and cost commissions.
This is enforced in `src/lib/affiliate/rel.ts` (`goAffiliateRel`) and mirrored
in the runtime script. Do not "tidy" it by adding `noreferrer`.

## What broke, and when

`src/components/ui/ExternalLinksInit.astro` is the site-wide script that stamps
`target="_blank"` on external links. Commit `147159a` (Sep 11 2026, *"Stop
crawlers from following /go/ affiliate redirects"*) added an early return for
affiliate hrefs:

```js
if (isGoAffiliateHref(href)) {
  anchor.rel = goAffiliateRel(anchor.target === '_blank');
  return;                      // never reaches anchor.target = '_blank'
}
```

Affiliate links are `/go/<slug>` — same-origin paths — so they also never
reached the "is this external?" branch further down. Net effect: an affiliate
link opened in a new tab **only if its own markup hardcoded `target="_blank"`**.

Commit `682ffcd` an hour later moved public CTAs onto the shared
`<AffiliateLink>` component, which passed `target` through only when the caller
supplied it. Most call sites kept it; the review "Visit {product}" CTA and the
mobile sticky CTA did not.

## The fix — three central layers

1. **`src/components/ui/AffiliateLink.astro`** defaults to `target="_blank"`.
   Call sites no longer have to remember it. Opt out with `target="_self"`.
2. **`src/components/ui/ExternalLinksInit.astro`** sets `target` as well as
   `rel` on `/go/` links. Runtime net for CTAs rendered from InstantDB or the
   CMS that never pass through the component.
3. **`rehypeAffiliateLinks`** in `src/lib/affiliate/rel.ts` stamps `target` at
   build time, so markdown affiliate links are correct without JavaScript.

Layer 1 is the one to rely on. Layers 2 and 3 exist because affiliate hrefs
also arrive from data and markdown, where no component wraps them.

## Adding links in future

- Affiliate CTA → use `<AffiliateLink href={product.affiliateUrl}>`. Nothing else.
- Outbound link in a component → set `target="_blank"` and
  `rel="noopener noreferrer"` explicitly; the runtime net is a safety net, not
  the plan (it can't help before hydration).
- Internal link → plain `<a href="/...">`. Do not add a target.

## Verified

- 35 of 38 affiliate anchors in the built HTML server-render `target="_blank"`.
  The remaining 3 are on `/dev/home-v3/`, an untracked page owned by another
  agent, and are covered by the runtime net.
- 0 of 82 internal anchors on the built homepage gained a `target`.
- The minified runtime script in every built page contains the `/go/` branch
  setting `target` and `sponsored nofollow noopener`.
- `astro check`: 501 → 495 errors (six pre-existing type errors in
  `ExternalLinksInit.astro` fixed while editing it; none added).

## Known gap

`@astrojs/markdown-remark` is in `package.json` but was missing from the local
`node_modules`, which disables the markdown rehype pipeline with a warning.
`npm install` fixes it locally; CI installs from the lockfile so production is
unaffected. Astro also now reports `markdown.rehypePlugins` as deprecated in
favour of passing plugins to `unified({...})` — worth migrating separately.
