# WordPress URL migration — redirects

Permanent record of the old **aigirlfriend.expert** WordPress → new Astro site URL plan.

## Source of truth

- Full mapping table: [`wordpress-url-migration-plan.md`](./wordpress-url-migration-plan.md)
- Live redirect records: **Admin → Redirects** (InstantDB `redirects` table)
- Runtime handler: [`src/pages/[...fallback].ts`](../src/pages/[...fallback].ts)

## Import status

Run:

```bash
npm run import:redirects          # upsert into InstantDB
npm run import:redirects -- --dry-run
```

**Imported (2026-08-03):** 207 active rules

| Type | Count |
|------|------:|
| 301 permanent | 127 |
| 410 Gone | 80 |
| KEEP (no rule) | 11 |

## Path adjustments (old plan → new site)

The import script maps destinations to routes that exist on the new codebase:

| WordPress / plan path | New site path |
|----------------------|---------------|
| `/best-ai-girlfriend/` | `/best/ai-girlfriend/` |
| `/terms-of-service/` | `/legal/terms/` |
| `/privacy-policy/` | `/legal/privacy/` |
| `/accessibility/` | `/legal/accessibility/` |
| `/affiliate-disclosure/` | `/legal/affiliate-disclosure/` |
| `/editorial-process/` | `/editorial-guidelines/` |
| `/ai-girlfriend-reviews/` | `/reviews/` |
| `#photos-and-videos` | `#photos` |
| `#privacy` on reviews | `#ratings--privacy` |
| `/reviews/kindroid-ai/` | `/reviews/kindroid/` |
| `/reviews/dreamgf-ai/` | `/reviews/dreamgf/` |

## KEEP URLs (no redirect)

These stay at the same path and return **200**:

- `/best-ai-girlfriend/` → `/best/ai-girlfriend/` (same content, new canonical path only if you add a redirect later)
- `/about/`, `/contact/`, `/sitemap/`
- `/tools/`, `/tools/nsfw-prompt-generator-tool/`
- `/our-partners/`, `/ai-girlfriend-quiz/`, `/careers/`
- `/author/herman-carter/`, `/author/evander/`

> Note: `/best-ai-girlfriend/` is listed as KEEP in the plan (WordPress path unchanged). On the new site the roundup lives at `/best/ai-girlfriend/`. Consider adding a 301 from `/best-ai-girlfriend/` → `/best/ai-girlfriend/` when you cut over DNS if that old path received traffic.

## Post-deploy validation checklist

1. **Redeploy production** after code changes (410 support in catch-all route).
2. Spot-check high-value URLs:
   - `/ai-girlfriend-reviews/candy-ai-review/` → 301 → `/reviews/candy-ai/`
   - `/guides/` → 410
   - `/best-ai-girlfriend/best-free-ai-girlfriend/` → 301 → `/best/ai-girlfriend/`
3. Confirm **one hop** (no chains) in Admin → Redirects → Issues column.
4. Remove 301/410 sources from sitemap (they should not appear — only live pages).
5. Submit updated sitemap in Google Search Console after DNS cutover.
6. Weekly GSC check for new 404s / redirect errors.

## Re-import after plan edits

1. Update `docs/wordpress-url-migration-plan.md`
2. `npm run import:redirects -- --dry-run`
3. `npm run import:redirects`

Existing rows with the same source path are updated; unchanged rows are skipped.
