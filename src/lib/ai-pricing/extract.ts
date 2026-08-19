// AI pricing extraction: takes uploaded pricing screenshots (media ids),
// sends them to an OpenAI vision model in one call, and returns a validated
// draft (plans / token packages / feature costs / promotions). Never writes
// pricing data itself — the editor reviews and applies the draft client-side.

import { z } from 'zod';
import { env } from '../env';
import { getDb } from '../db/server';
import { HttpError, type AdminIdentity } from '../db/auth';
import { getOpenAIClient } from '../ai-verdict/openaiClient';
import { assertRateLimit } from '../ai-verdict/rateLimit';

import { EXTRACT_FEATURE_CATEGORIES, normalizeExtractedVariant } from '../pricing/featureCostGroups';
import { refineAllowanceFields } from '../pricing/planAllowances';

export const PRICING_PROMPT_VERSION = 'v4';

export function aiPricingConfig() {
  return {
    enabled: env('AI_PRICING_ENABLED') !== 'false',
    model: env('OPENAI_PRICING_MODEL') ?? env('OPENAI_VERDICT_MODEL') ?? 'gpt-4o-mini',
    maxOutputTokens: Number(env('AI_PRICING_MAX_OUTPUT_TOKENS') ?? 4000),
    maxImages: Number(env('AI_PRICING_MAX_IMAGES') ?? 12),
  };
}

// ---------------------------------------------------------------------------
// Output schema (field shapes mirror src/lib/validation/schemas.ts)
// ---------------------------------------------------------------------------

const nullableNumber = z.number().nonnegative().nullish();

const extractedAllowanceSchema = z.object({
  sourceLabel: z.string().min(1).max(120),
  featureKey: z.string().max(60).nullish(),
  accessType: z
    .enum([
      'unlimited',
      'included_quantity',
      'included_credits',
      'pay_as_you_go',
      'not_included',
      'included_unspecified',
    ])
    .default('included_unspecified'),
  quantity: nullableNumber,
  unit: z.string().max(40).nullish(),
  resetInterval: z.enum(['day', 'month', 'billing_cycle', 'one_time', 'none']).nullish(),
  notes: z.string().max(300).nullish(),
});

const extractedPlanSchema = z.object({
  name: z.string().min(1).max(120),
  monthlyPrice: nullableNumber,
  /** Total charged every 3 months, if shown. */
  quarterlyTotalPrice: nullableNumber,
  /** Per-month price when billed annually (e.g. "$5.99/mo billed yearly"). */
  annualMonthlyPrice: nullableNumber,
  /** Total charged per year, if shown. */
  annualTotalPrice: nullableNumber,
  currency: z.string().max(8).nullish(),
  includedTokensPerMonth: nullableNumber,
  freeTrial: z.boolean().nullish(),
  trialLength: z.string().max(80).nullish(),
  /** Per-tier entitlements (quantities / unlimited / unspecified) — NOT invent token costs. */
  allowances: z.array(extractedAllowanceSchema).max(40).default([]),
});

const extractedPackageSchema = z.object({
  name: z.string().max(120).nullish(),
  price: z.number().nonnegative(),
  currency: z.string().max(8).nullish(),
  baseCredits: nullableNumber,
  bonusCredits: nullableNumber,
});

export const EXTRACT_FEATURE_TYPES = [
  'standard_image',
  'premium_image',
  'hd_image',
  'in_chat_image',
  'standard_video',
  'premium_video',
  'text_to_video',
  'image_to_video',
  'voice_message',
  'voice_call',
  'premium_message',
  'character_creation',
  'custom_character',
  'custom_ai',
  'custom',
] as const;

export const EXTRACT_UNITS = [
  'per_image',
  'per_message',
  'per_minute',
  'per_second',
  'per_video',
  'per_generation',
  'per_request',
  'per_character',
  'custom',
] as const;

const extractedFeatureCostSchema = z.object({
  featureType: z.enum(EXTRACT_FEATURE_TYPES),
  customLabel: z.string().max(120).nullish(),
  tokenCost: z.number().nonnegative(),
  unit: z.enum(EXTRACT_UNITS).default('per_generation'),
  model: z.string().max(60).nullish(),
  durationSeconds: z.number().positive().nullish(),
});

const extractedFeatureCostVariantSchema = z.object({
  category: z.enum(EXTRACT_FEATURE_CATEGORIES),
  model: z.string().max(60).nullish(),
  durationSeconds: z.number().positive().nullish(),
  label: z.string().max(120).nullish(),
  tokenCost: z.number().nonnegative(),
  unit: z.enum(EXTRACT_UNITS).default('per_generation'),
});

const extractedPromotionSchema = z.object({
  name: z.string().min(1).max(160),
  promotionType: z
    .enum(['plan_discount', 'package_discount', 'bonus_credits', 'free_trial', 'holiday', 'coupon', 'custom'])
    .nullish(),
  discountPercent: z.number().min(0).max(100).nullish(),
  couponCode: z.string().max(80).nullish(),
  /** ISO dates (YYYY-MM-DD) when visible in the screenshot. */
  startAt: z.string().max(20).nullish(),
  endAt: z.string().max(20).nullish(),
  publicNote: z.string().max(500).nullish(),
});

const imageClassificationSchema = z.object({
  /** 1-based index of the image in the order it was provided. */
  index: z.number().int().positive(),
  classification: z.enum(['plans', 'packages', 'feature_costs', 'promotion', 'unknown']),
});

export const aiPricingExtractionSchema = z.object({
  images: z.array(imageClassificationSchema).default([]),
  plans: z.array(extractedPlanSchema).default([]),
  packages: z.array(extractedPackageSchema).default([]),
  featureCosts: z.array(extractedFeatureCostSchema).default([]),
  featureCostVariants: z.array(extractedFeatureCostVariantSchema).default([]),
  promotions: z.array(extractedPromotionSchema).default([]),
  /** True when the app clearly uses a token/credit system. */
  usesTokens: z.boolean().nullish(),
  /** What the app calls its tokens, if visible (e.g. "Gems", "Coins"). */
  tokenName: z.string().max(60).nullish(),
  notes: z.string().max(1000).nullish(),
});

export type AiPricingExtraction = z.infer<typeof aiPricingExtractionSchema>;

export interface PricingDraft extends AiPricingExtraction {
  mediaIds: string[];
  /** mediaId → classification, resolved from the per-index output. */
  imageClassifications: Record<string, string>;
  model: string;
  promptVersion: string;
  tokenUsage: { input: number; output: number };
}

export const extractRequestSchema = z.object({
  productId: z.string().min(1),
  mediaIds: z.array(z.string().min(1)).min(1).max(20),
});

export type ExtractRequest = z.infer<typeof extractRequestSchema>;

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a meticulous pricing analyst for a review site that documents AI companion apps.
You are given one or more screenshots of an app's pricing pages. Extract structured pricing facts ONLY from what is visible — never guess or invent values. If a value is not visible, use null.

For EACH image (in the order provided, 1-based index) classify it as one of:
- "plans": subscription plan tiers (monthly/annual prices)
- "packages": one-time token/credit/gem top-up packages
- "feature_costs": how many tokens each feature costs (images, voice, video...)
- "promotion": a discount, coupon, or limited-time offer
- "unknown": not pricing related

Then extract, merging data across images and de-duplicating:
- plans: each subscription tier with name, monthlyPrice (price per month when billed monthly), quarterlyTotalPrice (total charged every 3 months), annualMonthlyPrice (per-month price when billed annually), annualTotalPrice (total charged per year), currency (ISO code like USD), includedTokensPerMonth, freeTrial, trialLength, and allowances[]. One tier per subscription level — billing intervals are fields on the same plan, not separate plan names like "3 months".
  * allowances: plan-specific benefits listed under that tier. Extract FACTS only:
    - "600 Photo Messages" / "9000 Messages/Mo" → accessType "included_quantity", quantity + resetInterval ("month" or "day")
    - "Unlimited HD Generations" / "Unlimited Custom Companions" → accessType "unlimited"
    - "2500 Advanced Credits Every Month" → accessType "included_credits", quantity 2500, resetInterval "month"
    - "HD Generations", "Video Generation", "Faster Messaging", "16K Context", "95+ customizations" (listed with NO numeric quota and NOT saying unavailable) → accessType "included_unspecified" (NEVER "not_included")
    - Put non-quantity display text in notes when helpful (e.g. notes "16K context", "95+", "Faster")
    - Use "not_included" ONLY when the screenshot explicitly marks the feature as unavailable / not included / locked for that tier
    - NEVER invent a tokenCost for a bullet that only says a feature exists
    - Keep sourceLabel as shown; featureKey optional (snake_case hint ok)
  * featureCosts / featureCostVariants: ONLY when the screenshot shows an explicit credit/coin PRICE (e.g. "84 credits per image"). Never invent costs from plan bullets.
- packages: each token top-up package with name (if any), price, currency, baseCredits (tokens included before bonus), bonusCredits (extra/bonus tokens)
- featureCostVariants: PREFERRED for tiered or table-based pricing. Extract EVERY distinct price point as its own variant row — do not collapse to one row per feature. category must be one of: ${EXTRACT_FEATURE_CATEGORIES.join(', ')}.
  * For video pricing TABLES (e.g. Lite Model 5s = 30, Pro Model 10s = 60): one variant per cell/row. Use model = exact model name from UI (e.g. "Lite", "Pro"). Use durationSeconds when clip length is shown (5, 10). unit = "per_generation" when a flat coin/token cost is shown per clip (most common).
  * For single popups (e.g. "Video with audio costs 80 coins for 5 seconds"): one variant with label = short description, durationSeconds if shown, no model.
  * Apps may have 1 model or 6+ models — extract however many rows the screenshot shows.
  * Preserve exact model names from the UI; do not normalize to Lite/Pro unless that is what the screenshot says.
- featureCosts: use ONLY for simple single-price features with no model/duration table (e.g. "5 coins per image", "2 coins per message", "10 tokens per custom character"). Each entry MUST include tokenCost as a number. featureType must be one of: ${EXTRACT_FEATURE_TYPES.join(', ')}. unit must be one of: ${EXTRACT_UNITS.join(', ')}. Do NOT use featureCosts for video model×duration matrices — use featureCostVariants instead.
  * Always look for explicit costs for: image generation, voice messages, phone/voice calls, and custom character / custom AI creation (featureType "character_creation", unit "per_character" when shown as a flat token price to create a companion).
  * Synonyms for character creation: "custom character", "custom AI", "create companion", "create character", "custom girlfriend" — map those to character_creation when a token/credit price is shown.
- promotions: name, promotionType (plan_discount | package_discount | bonus_credits | free_trial | holiday | coupon | custom), discountPercent, couponCode, startAt/endAt as YYYY-MM-DD only if dates are visible, publicNote (short description)
- usesTokens: true if the app clearly has a token/credit system
- tokenName: what the app calls tokens (e.g. "Gems", "Tokens", "Coins") if visible

Prices: numbers only, no currency symbols (e.g. 9.99). Respond with a single JSON object:
{"images":[{"index":1,"classification":"plans"}],"plans":[{"name":"Premium","monthlyPrice":9.99,"allowances":[{"sourceLabel":"600 Photo Messages","accessType":"included_quantity","quantity":600,"resetInterval":"month"}]}],"packages":[],"featureCosts":[],"featureCostVariants":[],"promotions":[],"usesTokens":false,"tokenName":null,"notes":null}`;

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

function parseCostNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^\d.]/g, ''));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
}

const IMAGE_CLASSIFICATIONS = ['plans', 'packages', 'feature_costs', 'promotion', 'unknown'] as const;
type ImageClassification = (typeof IMAGE_CLASSIFICATIONS)[number];

function slugifyKey(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function coerceImageClassification(raw: unknown): ImageClassification {
  const s = slugifyKey(raw);
  if (!s) return 'unknown';
  if (IMAGE_CLASSIFICATIONS.includes(s as ImageClassification)) return s as ImageClassification;
  if (s.includes('plan') || s.includes('subscription') || s.includes('tier')) return 'plans';
  if (
    s.includes('package') ||
    s.includes('coin') ||
    s.includes('credit') ||
    s.includes('token') ||
    s.includes('top_up') ||
    s.includes('topup') ||
    s.includes('buy')
  ) {
    return 'packages';
  }
  if (s.includes('promo') || s.includes('discount') || s.includes('coupon') || s.includes('sale')) {
    return 'promotion';
  }
  if (
    s.includes('feature') ||
    s.includes('cost') ||
    s.includes('video') ||
    s.includes('pricing') ||
    s.includes('generation') ||
    s.includes('popup') ||
    s.includes('modal')
  ) {
    return 'feature_costs';
  }
  return 'unknown';
}

function coerceFeatureCategory(raw: unknown): (typeof EXTRACT_FEATURE_CATEGORIES)[number] {
  const s = slugifyKey(raw);
  if (EXTRACT_FEATURE_CATEGORIES.includes(s as (typeof EXTRACT_FEATURE_CATEGORIES)[number])) {
    return s as (typeof EXTRACT_FEATURE_CATEGORIES)[number];
  }
  if (s.includes('video')) return 'video_generation';
  if (s.includes('image')) return 'standard_image';
  if (s.includes('voice') && s.includes('call')) return 'voice_call';
  if (s.includes('phone') && s.includes('call')) return 'voice_call';
  if (s.includes('voice')) return 'voice_message';
  if (s.includes('character') || s.includes('custom_ai') || s.includes('companion')) {
    return 'character_creation';
  }
  return 'custom';
}

function coerceFeatureType(raw: unknown): (typeof EXTRACT_FEATURE_TYPES)[number] {
  const s = slugifyKey(raw);
  if (EXTRACT_FEATURE_TYPES.includes(s as (typeof EXTRACT_FEATURE_TYPES)[number])) {
    return s as (typeof EXTRACT_FEATURE_TYPES)[number];
  }
  if (s === 'video_generation' || s === 'video' || s.includes('video')) return 'standard_video';
  if (s.includes('image')) return 'standard_image';
  if (s.includes('voice') && s.includes('call')) return 'voice_call';
  if (s.includes('phone') && s.includes('call')) return 'voice_call';
  if (s.includes('voice')) return 'voice_message';
  if (
    s.includes('character') ||
    s.includes('custom_ai') ||
    s.includes('companion') ||
    (s.includes('custom') && (s.includes('girl') || s.includes('create')))
  ) {
    return 'character_creation';
  }
  return 'custom';
}

function coerceUnit(raw: unknown): (typeof EXTRACT_UNITS)[number] {
  const s = slugifyKey(raw);
  if (EXTRACT_UNITS.includes(s as (typeof EXTRACT_UNITS)[number])) {
    return s as (typeof EXTRACT_UNITS)[number];
  }
  if (s.includes('generation') || s.includes('clip')) return 'per_generation';
  if (s.includes('second')) return 'per_second';
  if (s.includes('minute')) return 'per_minute';
  if (s.includes('image')) return 'per_image';
  if (s.includes('message')) return 'per_message';
  if (s.includes('video')) return 'per_video';
  if (s.includes('character') || s.includes('creation') || s.includes('companion')) {
    return 'per_character';
  }
  return 'per_generation';
}

function featureCostRowToVariant(item: Record<string, unknown>): Record<string, unknown> | null {
  const tokenCost = parseCostNumber(variantCostSources(item));
  if (tokenCost == null) return null;
  const featureType = slugifyKey(item.featureType);
  const category =
    featureType === 'video_generation' || featureType.includes('video')
      ? 'video_generation'
      : featureType.includes('image')
        ? 'standard_image'
        : featureType.includes('voice') && featureType.includes('call')
          ? 'voice_call'
          : featureType.includes('voice')
            ? 'voice_message'
            : coerceFeatureCategory(item.category);
  return {
    category,
    model: (() => {
      const c = normalizeExtractedVariant({
        model: (item.model ?? item.qualityTier) as string | null,
        label: (item.label ?? item.customLabel) as string | null,
        durationSeconds:
          parseCostNumber(item.durationSeconds) ?? parseCostNumber(item.duration) ?? parseCostNumber(item.durationProduced),
      });
      return c.model || null;
    })(),
    durationSeconds:
      parseCostNumber(item.durationSeconds) ?? parseCostNumber(item.duration) ?? parseCostNumber(item.durationProduced),
    label: (() => {
      const c = normalizeExtractedVariant({
        model: (item.model ?? item.qualityTier) as string | null,
        label: (item.label ?? item.customLabel) as string | null,
        durationSeconds:
          parseCostNumber(item.durationSeconds) ?? parseCostNumber(item.duration) ?? parseCostNumber(item.durationProduced),
      });
      return c.label || null;
    })(),
    tokenCost,
    unit: coerceUnit(item.unit),
  };
}

function variantCostSources(item: Record<string, unknown>): unknown {
  return (
    item.tokenCost ??
    item.token_cost ??
    item.cost ??
    item.credits ??
    item.creditCost ??
    item.credit_cost ??
    item.tokens ??
    item.coins ??
    item.coinCost ??
    item.coin_cost ??
    item.price ??
    item.amount ??
    item.value
  );
}

/** Map common AI field aliases, coerce enums, and drop rows without a usable cost. */
function normalizeExtractionPayload(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== 'object') return parsed;
  const root = { ...(parsed as Record<string, unknown>) };

  if (Array.isArray(root.images)) {
    root.images = root.images
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const item = { ...(row as Record<string, unknown>) };
        item.classification = coerceImageClassification(item.classification);
        return item;
      })
      .filter(Boolean);
  }

  const variantRows: Record<string, unknown>[] = [];

  function normalizeVariantRow(row: unknown): Record<string, unknown> | null {
    if (!row || typeof row !== 'object') return null;
    const item = { ...(row as Record<string, unknown>) };
    const tokenCost = parseCostNumber(variantCostSources(item));
    if (tokenCost == null) return null;
    item.tokenCost = tokenCost;
    if (item.durationSeconds == null && item.duration != null) {
      item.durationSeconds = parseCostNumber(item.duration);
    }
    if (item.label == null && item.customLabel != null) item.label = item.customLabel;
    if (item.model == null && item.qualityTier != null) item.model = item.qualityTier;
    const cleaned = normalizeExtractedVariant({
      model: item.model as string | null,
      label: item.label as string | null,
      durationSeconds: parseCostNumber(item.durationSeconds) ?? null,
    });
    item.model = cleaned.model || null;
    item.label = cleaned.label || null;
    item.durationSeconds = cleaned.durationSeconds ? Number(cleaned.durationSeconds) : item.durationSeconds;
    item.category = coerceFeatureCategory(item.category);
    item.unit = coerceUnit(item.unit);
    return item;
  }

  if (Array.isArray(root.featureCostVariants)) {
    for (const row of root.featureCostVariants) {
      const normalized = normalizeVariantRow(row);
      if (normalized) variantRows.push(normalized);
    }
  }

  const keptFeatureCosts: Record<string, unknown>[] = [];

  if (Array.isArray(root.featureCosts)) {
    for (const row of root.featureCosts) {
      if (!row || typeof row !== 'object') continue;
      const item = { ...(row as Record<string, unknown>) };
      if (item.tokenCost == null) {
        const alt =
          item.cost ?? item.credits ?? item.creditCost ?? item.tokens ?? item.price ?? item.amount ?? item.value;
        const n = parseCostNumber(alt);
        if (n != null) item.tokenCost = n;
      } else {
        const n = parseCostNumber(item.tokenCost);
        if (n != null) item.tokenCost = n;
        else continue;
      }

      item.unit = coerceUnit(item.unit);
      if (item.durationSeconds == null && item.durationProduced != null) {
        item.durationSeconds = parseCostNumber(item.durationProduced);
      }
      if (item.model == null && item.qualityTier != null) item.model = item.qualityTier;

      const rawType = slugifyKey(item.featureType);
      const hasMatrixFields =
        Boolean(String(item.model ?? '').trim()) ||
        parseCostNumber(item.durationSeconds) != null ||
        Boolean(String(item.label ?? item.customLabel ?? '').trim());

      if (
        rawType === 'video_generation' ||
        rawType === 'video' ||
        (rawType.includes('video') && hasMatrixFields) ||
        (hasMatrixFields && (rawType.includes('video') || rawType.includes('generation')))
      ) {
        const variant = featureCostRowToVariant(item);
        if (variant) variantRows.push(variant);
        continue;
      }

      item.featureType = coerceFeatureType(item.featureType);
      if (item.featureType === 'custom' && !String(item.customLabel ?? '').trim()) {
        item.customLabel = 'Custom feature';
      }
      keptFeatureCosts.push(item);
    }
  }

  root.featureCosts = keptFeatureCosts;

  const seenVariants = new Set<string>();
  root.featureCostVariants = variantRows.filter((row) => {
    if (parseCostNumber(row.tokenCost) == null) return false;
    const key = [
      row.category,
      row.model ?? '',
      row.durationSeconds ?? '',
      row.label ?? '',
      row.tokenCost,
    ].join('|');
    if (seenVariants.has(key)) return false;
    seenVariants.add(key);
    return true;
  });

  // Repair plan allowances: listed benefits must not be tagged not_included.
  if (Array.isArray(root.plans)) {
    root.plans = root.plans.map((plan) => {
      if (!plan || typeof plan !== 'object') return plan;
      const p = { ...(plan as Record<string, unknown>) };
      if (!Array.isArray(p.allowances)) return p;
      p.allowances = p.allowances
        .map((row) => {
          if (!row || typeof row !== 'object') return null;
          const a = row as Record<string, unknown>;
          const refined = refineAllowanceFields({
            sourceLabel: String(a.sourceLabel ?? a.label ?? ''),
            featureKey: a.featureKey != null ? String(a.featureKey) : undefined,
            accessType: typeof a.accessType === 'string' ? a.accessType : undefined,
            quantity: parseCostNumber(a.quantity),
            unit: typeof a.unit === 'string' ? a.unit : undefined,
            resetInterval: typeof a.resetInterval === 'string' ? a.resetInterval : undefined,
            notes: typeof a.notes === 'string' ? a.notes : undefined,
          });
          if (!refined.sourceLabel.trim()) return null;
          return {
            sourceLabel: refined.sourceLabel,
            featureKey: refined.featureKey,
            accessType: refined.accessType,
            quantity: refined.quantity ?? null,
            unit: refined.unit ?? null,
            resetInterval: refined.resetInterval ?? null,
            notes: refined.notes ?? null,
          };
        })
        .filter(Boolean);
      return p;
    });
  }

  return root;
}

interface MediaImage {
  id: string;
  url: string;
}

async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new HttpError(502, `Failed to download image (${res.status})`);
  }
  const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

async function loadImages(productId: string, mediaIds: string[]): Promise<MediaImage[]> {
  const db = getDb();
  const { media } = await (db.query as any)({
    media: {
      $: { where: { id: { $in: mediaIds } } },
      product: {},
      file: {},
    },
  });
  const rows = (media ?? []) as any[];
  const byId = new Map(rows.map((r) => [r.id, r]));

  const images: MediaImage[] = [];
  for (const mid of mediaIds) {
    const row = byId.get(mid);
    if (!row) throw new HttpError(404, `Media ${mid} not found`);
    if (row.product?.id && row.product.id !== productId) {
      throw new HttpError(400, `Media ${mid} belongs to a different product`);
    }
    if (row.mediaType && row.mediaType !== 'image') {
      throw new HttpError(400, `Media ${mid} is not an image`);
    }
    const url = (row.file?.url as string | undefined) ?? (row.url as string | undefined);
    if (!url) throw new HttpError(422, `Media ${mid} has no accessible file URL`);
    images.push({ id: mid, url });
  }
  return images;
}

export async function extractPricingFromScreenshots(
  body: ExtractRequest,
  identity: AdminIdentity,
): Promise<PricingDraft> {
  const cfg = aiPricingConfig();
  if (!cfg.enabled) throw new HttpError(503, 'AI pricing import is disabled.');
  if (body.mediaIds.length > cfg.maxImages) {
    throw new HttpError(400, `Too many screenshots — max ${cfg.maxImages} per extraction.`);
  }

  assertRateLimit(identity.email, `pricing:${body.productId}`);

  const images = await loadImages(body.productId, body.mediaIds);
  const dataUrls = await Promise.all(images.map((img) => imageUrlToDataUrl(img.url)));

  const client = getOpenAIClient();
  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' } }
  > = [
    {
      type: 'text',
      text: `Here are ${images.length} pricing screenshot(s). Classify each and extract all pricing data.`,
    },
  ];
  images.forEach((img, i) => {
    userContent.push({ type: 'text', text: `Image ${i + 1}:` });
    userContent.push({ type: 'image_url', image_url: { url: dataUrls[i], detail: 'high' } });
  });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: cfg.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      max_tokens: cfg.maxOutputTokens,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'OpenAI request failed';
    throw new HttpError(502, `AI extraction failed: ${msg}`);
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new HttpError(502, 'Empty AI response');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpError(502, 'AI returned invalid JSON');
  }

  const result = aiPricingExtractionSchema.safeParse(normalizeExtractionPayload(parsed));
  if (!result.success) {
    const issues = result.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new HttpError(422, `AI output failed validation: ${issues.join('; ')}`);
  }

  const imageClassifications: Record<string, string> = {};
  for (const c of result.data.images) {
    const img = images[c.index - 1];
    if (img) imageClassifications[img.id] = c.classification;
  }

  return {
    ...result.data,
    mediaIds: body.mediaIds,
    imageClassifications,
    model: cfg.model,
    promptVersion: PRICING_PROMPT_VERSION,
    tokenUsage: {
      input: completion.usage?.prompt_tokens ?? 0,
      output: completion.usage?.completion_tokens ?? 0,
    },
  };
}
