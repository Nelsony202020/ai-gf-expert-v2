# AI Girlfriend Expert — Project Context for ChatGPT

**Generated:** 2026-08-15  
**Purpose:** Upload this file into ChatGPT so it understands the product, site structure, tech stack, and how content goes live.

---

## 1. What this is

**AI Girlfriend Expert** (`https://aigirlfriend.expert`) is an independent review site for AI companion / AI girlfriend apps.

Core promise:
- Hands-on testing with **paid accounts**
- Transparent, data-driven scores across fixed categories
- Editorial reviews (not sponsored rankings)
- Affiliate links for monetization (disclosed)

**Legal entity:** Nelson Digital FZ-LLC (Ras Al Khaimah, UAE)  
**Brand / site name:** AI Girlfriend Expert  
**Primary contact email (public):** hermanjcarter@gmail.com  
**Author persona on site:** Herman Carter (`/author/herman-carter`)

Tagline-style positioning: *Independent AI companion reviews based on objective test results.*

---

## 2. Live site URLs (canonical)

**Origin:** `https://aigirlfriend.expert`

### Main public pages

| Page | URL |
|------|-----|
| Homepage | https://aigirlfriend.expert/ |
| App directory | https://aigirlfriend.expert/ai-girlfriend-apps/ |
| Reviews hub | https://aigirlfriend.expert/reviews/ |
| Best AI girlfriend roundup | https://aigirlfriend.expert/best/ai-girlfriend/ |
| How we test / methodology | https://aigirlfriend.expert/test/ |
| Buying guide | https://aigirlfriend.expert/guides/how-to-choose-an-ai-girlfriend-app/ |
| About | https://aigirlfriend.expert/about/ |
| Contact | https://aigirlfriend.expert/contact/ |
| Editorial guidelines | https://aigirlfriend.expert/editorial-guidelines/ |
| Legal hub | https://aigirlfriend.expert/legal/ |

### Published product reviews (as of 2026-08-15)

| Product | Review URL | Status |
|---------|------------|--------|
| OurDream AI | https://aigirlfriend.expert/reviews/ourdream-ai/ | published |
| Candy AI | https://aigirlfriend.expert/reviews/candy-ai/ | published |
| GirlfriendGPT | https://aigirlfriend.expert/reviews/girlfriendgpt/ | published |
| Nectar AI | https://aigirlfriend.expert/reviews/nectar-ai/ | published |
| Aura AI | (draft in admin; not live) | draft |

### Admin & preview

| Area | URL pattern |
|------|-------------|
| Admin SPA | https://aigirlfriend.expert/admin/ |
| Product workspace | https://aigirlfriend.expert/admin/products/{productId}/{tab} |
| Live InstantDB preview of a review | https://aigirlfriend.expert/reviews/preview/{slug}/ |

Affiliate outbound cloaking uses `/go/{slug}` paths.

CDN for static/media assets: Bunny pull zone `https://aigirlfriendpull.b-cdn.net`

---

## 3. What a product review page contains

Each `/reviews/{slug}/` page is a long-form review with tabs / sections typically including:

1. **Overview / verdict** — one-line verdict, “Our Take”, pros/cons, scores
2. **Ratings** — category + subscore breakdown with evidence tooltips
3. **Review article** — TipTap-authored rich text (headings, images, video, tables)
4. **Pricing** — plans, allowances, credit packs, usage cost estimates
5. **Characters / media gallery** — screenshots, NSFW-gated gallery items
6. **Alternatives / comparisons** — related apps (market data / peers)

Scores are **0–10** editorial review ratings (not fake AggregateRating stars).

---

## 4. Scoring / testing methodology (high level)

Testing is structured as a **methodology tree** stored in InstantDB:

- **Categories** (examples): Characters, Customization, Chat, Chat Features, Images, Video, Privacy, Pricing (+ bonus features in some versions)
- **Subscores** under each category
- **Evidence definitions** (required questions) with weights
- Editors run a **test run** per product, fill evidence, calculate scores, then **publish the test run** to make scores live

Admin **Testing** tab drives this. Publishing a test run updates live scores and triggers a site rebuild.

Pricing testing is increasingly driven by structured Pricing-tab data (plans, allowances, feature credit costs) with autofill into usage-cost evidence.

---

## 5. Admin product workspace tabs

For each product in `/admin`, editors work in tabs:

| Tab | Responsibility |
|-----|----------------|
| **Setup** | Name, slug, logo, website, capabilities flags |
| **Pricing** | Plans, billing options, plan allowances, credit packs, feature costs, payment profile, AI screenshot extract |
| **Testing** | Methodology sessions, evidence answers, score calculate/publish |
| **Verdict** | oneLineVerdict, ourTake, pros/cons, best-for, category verdicts |
| **Review** | Long-form article editor (TipTap), autosave to InstantDB |
| **Media** | Uploads, alt text, adult/NSFW flags, gallery roles |
| **Characters** | Character library for the product |
| **SEO** | Title, meta, OG, canonical overrides |
| **Publish** | Validation checklist, publish/unpublish product |

Review editor features (recent):
- Google Docs–style **autosave** to InstantDB
- Local draft backup in `localStorage`
- **⌘K** link dialog with internal review/guide autocomplete
- Image settings (alt, caption, width, rounding, NSFW)
- Video URL + drag/drop upload (`/video` slash command)

---

## 6. Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Astro 7** (static public site) + React islands/admin |
| Hosting | **Vercel** |
| Database / realtime | **InstantDB** (products, reviews, testing, media metadata, pricing) |
| Admin auth | InstantDB magic-code auth; roles (owner/admin/editor) |
| Review editor | **TipTap** (ProseMirror) |
| Guides CMS | **Sanity** (studio in `/studio`) for guides content |
| Media CDN | **Bunny.net** storage + pull zone |
| AI features | **OpenAI** (verdict suggestions, pricing OCR/extract, alt text) |
| Market data | **Ahrefs** API (alternatives / competitors) |
| Email | **Resend** (contact form) |
| Validation | **Zod** |
| Styling | **Tailwind CSS 4** |

Repo name locally: `AI GF Expert V2` / npm package `ai-gf-expert`.

---

## 7. Critical architecture fact: static site vs InstantDB

**This is the most important operational detail.**

- Admin writes go to **InstantDB immediately**.
- Public pages like `/reviews/{slug}/` are **prerendered static HTML at build time**.
- Therefore InstantDB can be “correct” while the live URL still shows an old build until a **Vercel rebuild/deploy** runs.

Rebuilds are triggered by:
- Product publish / unpublish / slug change
- Test-run publish
- Sanity guide webhook
- (Recently added) debounced rebuild after review article / verdict saves on published products — requires `VERCEL_DEPLOY_HOOK_URL` in Vercel env

**Always-live preview (no rebuild needed):**  
`/reviews/preview/{slug}/` (admin session) reads InstantDB directly.

If ChatGPT is asked “why doesn’t my saved review show on the live site?”, the default answer is: **static rebuild lag / missing deploy hook**, not “data wasn’t saved.”

---

## 8. Content model (InstantDB entities, conceptual)

Key entities (not exhaustive):

- `products` — slug, status (`draft` / `published` / …), verdict fields, SEO, capabilities
- `reviews` — **one per product** (unique product link); `blocks[]` = article body; revisions history
- `testRuns` + `evidenceResults` + `scoreSnapshots` — testing & published scores
- `subscriptionPlans`, `creditPackages`, `featureCosts`, `pricingSnapshots`, `paymentProfiles`
- `media` — images/videos with `adult` / gallery tags
- `characters`
- `authors`, `affiliateLinks`, `redirects`, methodology tree (`methodologyVersions`, `categories`, `subscores`, `evidenceDefinitions`)

Public `Product` object is assembled in `src/lib/content/store.ts` by mapping InstantDB → frontend shape (`reviewBlocks`, `overallSummary` ← `oneLineVerdict`, etc.).

---

## 9. Scoring display rules (for UX / copy)

- Overall and category scores are weighted composites from evidence.
- Some answers can be **N/A** or **Unknown** (excluded / non-blocking for publish in many cases).
- Public score tooltips explain methodology + evidence.
- NSFW media on public pages is age-gated / blurred until confirmed.

---

## 10. Editorial voice & positioning (for writing help)

When helping write reviews or site copy:

- Independent, skeptical of marketing hype
- First-person tester voice is common in review articles (“First Impressions…”)
- Prefer concrete observations over vague praise
- Disclose affiliate relationships when relevant
- Adult/NSFW product category — be direct but not gratuitous
- Scores must stay consistent with the methodology narrative

Do **not** invent test results, prices, or features that weren’t provided.

---

## 11. Local development

```bash
npm run dev          # typically http://localhost:4321
npm run build        # static build (needs Instant admin token for DB content)
npm run db:push:yes  # push Instant schema
```

Admin: `http://localhost:4321/admin`

---

## 12. Repo areas (for coding help)

| Path | Role |
|------|------|
| `src/pages/` | Public routes + API |
| `src/pages/reviews/` | Review pages + preview |
| `src/pages/admin/` | Admin shell |
| `src/components/admin/` | Admin UI (workspace, testing, review editor) |
| `src/components/review/` | Public review UI |
| `src/lib/content/store.ts` | InstantDB → public Product mapping |
| `src/lib/scoring/` | Score engine + test-run publish |
| `src/lib/pricing/` | Pricing math, allowances, scenarios |
| `src/lib/db/` | Instant CRUD, publish, rebuild hook |
| `scripts/seed/` | Methodology seed data |
| `instant.schema.ts` | InstantDB schema |
| `studio/` | Sanity studio for guides |

---

## 13. Current product snapshot (Aug 2026)

Published reviews live: **OurDream AI, Candy AI, GirlfriendGPT, Nectar AI**.  
Aura AI exists as draft.  
Homepage highlights top picks, featured characters, recently updated reviews, and directory exploration filters (chat quality, images, video, price, etc.).

Nectar AI example verdict (stored on product):  
*“Fantastic NSFW roleplay but basic customzation.”*  
Long-form review article is stored as ~50 TipTap blocks on the linked `reviews` row.

---

## 14. How ChatGPT should help by default

1. Prefer **public URL + InstantDB + rebuild** mental model for “why isn’t it live?”
2. For content writing: match existing review structure (First Impressions → features → pricing → final take).
3. For product/admin features: don’t invent Instant schema fields; mirror existing Pricing / Testing / Review patterns.
4. Never ask for or echo API keys, Instant admin tokens, Bunny keys, or deploy hook secrets.
5. Affiliate / SEO changes should preserve disclosure and avoid black-hat tactics.

---

*End of context file. Safe to upload to ChatGPT.*
