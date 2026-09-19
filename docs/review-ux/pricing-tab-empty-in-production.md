# Pricing tab renders empty in production — investigation

Reported Sep 19 2026: the Pricing tab on the Candy AI and OurDream AI reviews
shows headings with nothing under them, "lots of empty spaces", even though the
pricing data exists.

**This is not caused by the review UX branch.** It reproduces on production,
which is deployed from `1dc65f1` — the exact commit that branch is based on.

## What is actually happening

`loadPricingTabViewModel()` (`src/lib/pricing-tab/loadPricingTab.ts:1161`) has
three outcomes: live data, an Aura-specific draft, or a hard-coded **empty
shell**. Production is getting the empty shell:

```
data-pt-plan-count="0"
data-pt-plans-payload="{"plans":[],"freePlanKey":null,"limitRows":[],…}"
<p class="pt-empty">Plan details are still being verified.</p>
<p class="pt-empty">Not enough data to estimate</p>
```

That shell is returned when `loadLivePricing()` returns `null` **or throws** —
and the throw is swallowed:

```ts
} catch (error) {
  console.error('[pricing-tab] live pricing load failed — using draft/empty shell', …);
}
```

## What was ruled out

| Hypothesis | Result |
|---|---|
| Caused by the review UX branch | **No** — production is on `1dc65f1`, the branch's own base |
| Stale production deploy | **No** — last prod deploy `1dc65f1` = current `origin/main` |
| InstantDB not configured in production | **No** — `candy-ai` is not in any static data file, yet production renders its DB-backed scores and verdict |
| Production points at a different InstantDB app | **No** — production and a local render return byte-identical product data (scores `8.5 7.1 8.4 7.9 8.8 5.9 7.6 7.9`, same verdict headline, same "Updated Aug 24, 2026") |
| The data is missing from the database | **No** — see below |
| The linked query is too slow and times out | **Unlikely** — 884 ms locally |

The pricing entities are present and the exact query the loader runs returns
them, using the credentials in the local `.env`:

```
candy-ai   -> plans:1 packages:6 costs:15 snapshots:1
ourdream-ai-> plans:2 packages:3 costs:15 snapshots:1
```

Rendering that same code locally against that same app produces a **100 KB**
pricing panel with real plans, credit values, feature costs and the comparison
table. Production's panel for the same product is **3.8 KB**.

## Where this stands

Same commit, same InstantDB app, same data, same query — full render locally,
empty shell in production. The remaining difference is the Vercel *runtime*
environment, and the failure is being logged rather than surfaced.

**Next step: read the Vercel function logs for a review page request and look
for `[pricing-tab] live pricing load failed`.** The error object logged there
names the cause. That needs Vercel access, which this session does not have.

Two things worth checking at the same time:

- `PUBLIC_INSTANT_APP_ID` and `INSTANT_APP_ADMIN_TOKEN` in the Vercel project —
  specifically whether they are set for **all** environments (Production,
  Preview) and whether the admin token is the same one in the local `.env`
  (that app id starts `ae65ab62`). Note the product query works in production,
  so if this is the cause it would have to be something subtler than the vars
  being absent outright.
- Whether the failure is intermittent. `loadPricingTabViewModel` degrades
  silently by design, so a transient InstantDB error during SSR looks identical
  to missing data.

## Suggested follow-up (not done here)

The silent catch is what makes this hard to see. A small change — rendering a
visible "pricing temporarily unavailable" state rather than a shell that reads
as "we never collected this data", or re-throwing in non-production — would
turn a silent content bug into an obvious one. Left alone because it is a
behaviour change that was not requested.
