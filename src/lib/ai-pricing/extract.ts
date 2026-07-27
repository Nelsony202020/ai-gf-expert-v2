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

export const PRICING_PROMPT_VERSION = 'v1';

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

const extractedPlanSchema = z.object({
  name: z.string().min(1).max(120),
  monthlyPrice: nullableNumber,
  /** Per-month price when billed annually (e.g. "$5.99/mo billed yearly"). */
  annualMonthlyPrice: nullableNumber,
  /** Total charged per year, if shown. */
  annualTotalPrice: nullableNumber,
  currency: z.string().max(8).nullish(),
  includedTokensPerMonth: nullableNumber,
  freeTrial: z.boolean().nullish(),
  trialLength: z.string().max(80).nullish(),
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
  'custom',
] as const;

const extractedFeatureCostSchema = z.object({
  featureType: z.enum(EXTRACT_FEATURE_TYPES),
  customLabel: z.string().max(120).nullish(),
  tokenCost: z.number().nonnegative(),
  unit: z.enum(EXTRACT_UNITS),
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
- plans: each subscription tier with name, monthlyPrice (price per month when billed monthly), annualMonthlyPrice (per-month price when billed annually), annualTotalPrice (total charged per year), currency (ISO code like USD), includedTokensPerMonth, freeTrial, trialLength
- packages: each token top-up package with name (if any), price, currency, baseCredits (tokens included before bonus), bonusCredits (extra/bonus tokens)
- featureCosts: token cost per feature. featureType must be one of: ${EXTRACT_FEATURE_TYPES.join(', ')}. unit must be one of: ${EXTRACT_UNITS.join(', ')}. Use "custom" with customLabel when nothing fits.
- promotions: name, promotionType (plan_discount | package_discount | bonus_credits | free_trial | holiday | coupon | custom), discountPercent, couponCode, startAt/endAt as YYYY-MM-DD only if dates are visible, publicNote (short description)
- usesTokens: true if the app clearly has a token/credit system
- tokenName: what the app calls tokens (e.g. "Gems", "Tokens", "Coins") if visible

Prices: numbers only, no currency symbols (e.g. 9.99). Respond with a single JSON object:
{"images":[{"index":1,"classification":"plans"}],"plans":[],"packages":[],"featureCosts":[],"promotions":[],"usesTokens":false,"tokenName":null,"notes":null}`;

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

interface MediaImage {
  id: string;
  url: string;
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
    userContent.push({ type: 'image_url', image_url: { url: img.url, detail: 'high' } });
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

  const result = aiPricingExtractionSchema.safeParse(parsed);
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
