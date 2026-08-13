# Girlfriend Expert — Pricing system (current state)

Use this as context for redesigning pricing so products like **Aura AI** (Pro / Premium / Ultimate with different included images, videos, unlimited vs tokens) can be modeled correctly.

---

## Goal of the Pricing tab

Editors capture structured pricing facts for a product so that:

1. The public review can show plans, typical monthly spend, and cost-per-feature.
2. Testing evidence for pricing (monthly price, image cost, video cost, etc.) is **auto-filled** instead of typed by hand.
3. AI can import plans/packages/feature costs from screenshots.

Everything is built around one assumption today:

> **Money ≈ subscription price + top-up credits for usage beyond a single shared credit pool.**

That works for Candy-style “subscription includes N tokens; images/videos burn tokens.” It breaks when each tier has different media allowances (unlimited images on Ultimate, video tokens on Premium, etc.).

---

## Admin UI layout (Pricing tab)

**Main file:** `src/components/admin/workspace/tabs/PricingTab.tsx`

Sections in order:

1. **Snapshot / status**
   - Pricing lives under a `pricingSnapshots` row (status `active`, etc.).
   - “Start pricing” creates a snapshot (default model `subscription_credits`) and links existing plans/packages/feature costs to it.
   - Verification badge + screenshot evidence on the snapshot.

2. **AI import** (`src/components/admin/ai-pricing/PricingImportCard.tsx`)
   - Upload pricing screenshots → vision extract → review modal → apply to DB.
   - Does not delete existing rows; upserts by name / variant key.

3. **Pricing model** (radio on the snapshot)
   - UI options:
     - `subscription_only` — plans only
     - `subscription_credits` — plans + token packages + feature costs
     - `free_plus_credits` — tokens + feature costs (no required plans)
   - Schema also allows `credits_only` | `mixed` | `custom` (not shown in this radio).

4. **Subscription tiers** (`TierTable` + plan modal)
   - Per tier: name, monthly / 3-month total / annual total, currency, **included tokens** (only when model is `subscription_credits`), active.
   - Nested `billingOptions` (interval + price). Legacy flat `billingInterval` / `price` still supported as fallback.

5. **Tokens section** (if model uses credits)
   - Token display name on snapshot (`creditCurrency`).
   - Sitewide assumption: tokens expire in **30 days**, no rollover (`src/lib/pricing/credit-currency.ts`).
   - **Packages:** name, price, currency, `baseCredits`, `bonusCredits`, subscriber-only, active, evidence.
   - **Feature costs** (`SimpleFeatureCosts`): families
     - Standard image
     - Voice message
     - Phone call
     - Video generation  
     Variants per family: model → `qualityTier`, duration → `durationProduced` (seconds), `creditCost`, unit. Empty families auto-bootstrap placeholder rows.

6. **Promotions** — shown if `pricingPromotions` exist (mostly from AI import; limited edit UI).

7. **Usage scenarios** (`UsageScenariosPanel`)
   - Personas: casual / regular / power with msgs / images / videos / voice-min per day.
   - Stored on `pricingSnapshots.usageScenarios`.
   - Estimates monthly cost; can sync “regular” total → product `typicalMonthlyCost`.

8. **Quick summary**
   - Lowest plain monthly price; can sync → product `minMonthlyPrice`.

9. **Payment and billing** (`paymentProfiles`)
   - Methods, crypto-only, discreet billing, billing descriptor, refund/cancellation, evidence.

### Fields that exist in the schema but are NOT filled in the Pricing tab UI

These matter for Aura-style products but are ignored by the guided tab / calc / public builder:

- `subscriptionPlans.includedImages`
- `subscriptionPlans.includedVideos`
- `subscriptionPlans.includedVoiceMinutes`
- `subscriptionPlans.unlimitedFeatures`
- `subscriptionPlans.creditRefresh` / `creditsRollOver`
- `featureCosts.availablePlanNames` (plan-scoped costs)
- `featureCosts.freeAllowance`

---

## Data model (InstantDB)

### Entities & links

- `products` → 1 `paymentProfile`
- `products` → many `subscriptionPlans`, `creditPackages`, `featureCosts`, `pricingSnapshots`, `pricingPromotions`
- Plans / packages / feature costs / promotions optionally link to a `pricingSnapshots` row

### `pricingSnapshots`

- `status`, `pricingModel`
- `creditCurrency` (JSON: displayName, singular, plural, expires, expirationPeriod, …)
- `verifiedAt` / `verifiedBy`, `sourceUrl`, notes
- `evidenceMediaIds`
- `usageScenarios`: `{ id, title, description, messagesPerDay, imagesPerDay, videosPerDay, voiceMinutesPerDay }[]`
- `frozenData` for historical snapshots

### `subscriptionPlans` (one row = one named tier, e.g. Pro)

- `name`, `active`, `sortOrder`
- `billingOptions[]`: `{ interval, price, currency, intro*, freeTrial*, active }`
- Legacy: `billingInterval`, `price`, `currency`
- `includedTokens` ← **the only inclusion used by math/UI today**
- Unused by math: `includedImages`, `includedVideos`, `includedVoiceMinutes`, `unlimitedFeatures`, `includedFeatures`, `restrictions`, …

### `creditPackages`

- `name`, `price`, `currency`
- `baseCredits`, `bonusCredits` (preferred) / legacy `tokenAmount`
- `subscriberOnly`, `requiredPlanName`, `active`, `sortOrder`, evidence

### `featureCosts`

- `featureType`: images / videos / voice / messages / character / unlock / custom (UI maps to families like standard image, voice message, phone call, video)
- `creditCost` or `minCost`/`maxCost`, `costType` (`fixed` | `range` | `variable`)
- `unit`, `quantityProduced`, `durationProduced` (seconds), `qualityTier` (model name)
- `availablePlanNames`, `freeAllowance` ← stored but **not used in calc**
- `active`, `sortOrder`, evidence, soft-delete

### `paymentProfiles`

- Payment method flags, `cryptoOnly`, `discreetBilling`, `billingDescriptor`, refund/cancellation fields, evidence

### Product cache fields

- `minMonthlyPrice`, `typicalMonthlyCost`, `priceCurrency`

Schemas: `instant.schema.ts`, Zod in `src/lib/validation/schemas.ts`, registry in `src/lib/db/registry.ts`.

---

## How cost math works today

**Core file:** `src/lib/pricing/calc.ts`

Pipeline:

1. **Feature use → credits** via `featureCostRange` (`creditCost` or min/max).
2. **Credits → money** via best top-up package: lowest `$ / credit` among active packages (`bestValuePackage` / `pricePerCredit`).
3. **Monthly spend** ≈  
   `cheapest matching plan price (monthly-equivalent)`  
   + `top-up for max(0, creditsNeeded − includedTokens)`.
4. Range feature costs use the **max** credit cost (conservative).
5. Autofill normalizes voice/video money to **per 10 seconds**; calls to **per minute**.

### What “included” means today

- Only **`includedTokens` on the subscription tier** reduces credit shortfall.
- There is **no** path for:
  - “Ultimate includes unlimited images”
  - “Premium includes 100 images + 20 video tokens”
  - Different image prices per plan
  - Media that doesn’t burn the shared credit pool

### Feature variants

Same family can have many rows (e.g. video Lite 5s vs Pro 10s) via `qualityTier` + `durationProduced`. Autofill/spend typically pick the **cheapest** matching type (`src/lib/pricing/featureCostGroups.ts`).

---

## Testing autofill (hidden from testers)

**Slugs** (`src/lib/testing/pricingEvidenceSlugs.ts` → `PRICING_AUTOFILL_SLUGS`):

| Slug | Rough derivation |
|------|------------------|
| `monthly-price` | Lowest plain monthly plan price |
| `annual-price` | Cheapest yearly, monthly-equivalent |
| `annual-discount` | vs plain monthly |
| `included-credits` | `includedTokens` on cheapest tier |
| `image-cost` | Cheapest image feature × best package rate |
| `video-cost` | Cheapest video feature → $/10s |
| `voice-cost` | Voice message → $/10s |
| `call-cost` | Voice call → $/min |
| `top-up-value` | Package size / rate text |
| `monthly-spend` | Fixed “regular” use: 500 msgs, 20 images, 4 videos, 30 voice min |
| `payment-privacy` | From `discreetBilling` (+ descriptor) |

**Logic:** `src/lib/testing/pricingAutofill.ts` → `computePricingSuggestions`  
**Persisted on score calc:** `syncPricingEvidence` in `src/lib/scoring/testRuns.ts`

Implication: scoring always assumes **one cheapest tier + one global credit matrix**. It cannot say “on Ultimate images are free; on Pro they cost tokens.”

---

## AI pricing import

| Step | Where |
|------|--------|
| Upload screenshots | `PricingImportCard` → `/api/admin/media/upload` |
| Extract (no DB write) | `POST /api/admin/ai-pricing/extract` → `src/lib/ai-pricing/extract.ts` |
| Review + apply | `PricingReviewModal.tsx` |

Extracts: plan prices (monthly/quarterly/annual), `includedTokensPerMonth`, packages (base/bonus credits), feature cost variants (category, model, durationSeconds, tokenCost), promotions, `usesTokens`, token name.

Apply upserts plans (`billingOptions` + `includedTokens`), packages, feature costs (`costType: 'fixed'`), promotions; patches snapshot evidence / sometimes `pricingModel` and token display name.

---

## Public review Pricing tab

- Loader: `src/lib/pricing-tab/loadPricingTab.ts` → `PricingTabViewModel`
- Aura can merge/fallback draft data: `src/lib/pricing-tab/aura-ai-draft.ts`
- Astro UI: `src/components/review/tabs/PricingTab.astro`

Public sections (typical order):

1. Hero (pricing score, advertised monthly, vs category avg)
2. **Plans & what you get** — built from tiers
3. **What you'll actually pay** — casual / regular / power
4. **Cost per feature** — money at best package rate
5. Comparison rows

**Public plan matrix quirk:** with multiple billing options, columns often become **Monthly / Annual**, not **Pro / Premium / Ultimate**. Feature cells tend to hardcode Chat = Included and Images/Video/Voice = “Credits” if `includedTokens > 0`. Per-tier image/video allowances and unlimited are not rendered from structured data.

---

## Concrete example of the gap (Aura AI)

Aura has something like:

| Plan | Subscription | Images | Videos |
|------|--------------|--------|--------|
| Pro | $X/mo | Limited / token-priced | Token-priced |
| Premium | $Y/mo | More included | Some included / tokens |
| Ultimate | $Z/mo | Unlimited (or very high) | Different allowance |

### What we can store today

- Three named tiers with different prices and different **included token** counts.
- One global “image costs N credits” and “video costs M credits” table.
- Top-up packages shared across the product.

### What we cannot represent correctly

1. **Per-plan media allowances** (counts vs unlimited) — schema fields exist on plans but Pricing tab, calc, autofill, and public builder ignore them.
2. **Unlimited** as a real billing mode — spend math always burns credits; no `unlimited` sentinel in feature costs.
3. **Plan-scoped feature prices** — `availablePlanNames` unused.
4. **Mixed economies** — e.g. free included images then overage tokens on one tier; unlimited on another; shared credit pool on a third.
5. Autofill/score that reflects “the plan users actually buy” instead of cheapest tier × flat credit price.
6. Public columns that show **per tier name** what you get for images/videos.

---

## Redesign direction (for discussion)

To support Aura-like products, the model likely needs:

1. **Per-tier allowance object** for each capability (chat / images / video / voice), each value being one of:
   - `unlimited`
   - `included_count` (e.g. 100 images/month)
   - `included_credits` (shared or capability-specific pool)
   - `not_included` / pay-as-you-go only
2. **Optional per-tier (or per-plan) overage costs** when allowance is exhausted.
3. **Spend logic** that: pick a reference tier → subtract allowances → then apply credits/top-ups (or $0 for unlimited).
4. **Public plan matrix columns = tier names** (Pro / Premium / Ultimate), with cells from those allowances.
5. **Autofill** that either:
   - uses a declared “reference tier” for scoring, or
   - reports a range / “depends on plan”,  
   instead of always cheapest-tier × global credit price.
6. Admin UI that exposes allowances (not only “included tokens”).

---

## Key file index

| Area | Path |
|------|------|
| Admin Pricing tab | `src/components/admin/workspace/tabs/PricingTab.tsx` |
| Feature costs UI | `src/components/admin/workspace/tabs/SimpleFeatureCosts.tsx` |
| Usage scenarios | `src/components/admin/workspace/tabs/UsageScenariosPanel.tsx` |
| AI import card | `src/components/admin/ai-pricing/PricingImportCard.tsx` |
| AI extract | `src/lib/ai-pricing/extract.ts` |
| Cost math | `src/lib/pricing/calc.ts` |
| Feature cost grouping | `src/lib/pricing/featureCostGroups.ts` |
| Token currency defaults | `src/lib/pricing/credit-currency.ts` |
| Testing autofill | `src/lib/testing/pricingAutofill.ts` |
| Autofill slug set | `src/lib/testing/pricingEvidenceSlugs.ts` |
| Public VM loader | `src/lib/pricing-tab/loadPricingTab.ts` |
| Aura draft public data | `src/lib/pricing-tab/aura-ai-draft.ts` |
| Validation schemas | `src/lib/validation/schemas.ts` |
| InstantDB schema | `instant.schema.ts` |

---

## One-sentence summary

**Today’s pricing system is a subscription + shared credit economy with flat global feature costs; it cannot truthfully model per-plan included/unlimited media without a redesign of allowances, spend math, autofill, and the public plan matrix.**
