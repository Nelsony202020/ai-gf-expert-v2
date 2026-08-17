// Zod validation schemas for every admin-managed entity.
// Server-side validation happens on EVERY mutation — never trust the client.

import { z } from 'zod';

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case (a-z, 0-9, hyphens)');

const httpUrl = z.string().url().refine((u) => /^https?:\/\//.test(u), 'Must be an http(s) URL');

const pathString = z
  .string()
  .min(1)
  .regex(/^\/[^\s]*$/, 'Must be an absolute path starting with /');

const dateMs = z.number().int().nonnegative();

export const productStatus = z.enum(['draft', 'in_review', 'scheduled', 'published', 'archived']);
export const testRunStatus = z.enum([
  'not_started',
  'in_progress',
  'ready_for_review',
  'approved',
  'published',
  'superseded',
]);

const seoFields = {
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  h1Override: z.string().max(120).optional(),
  canonicalUrl: httpUrl.optional(),
  noindex: z.boolean().optional(),
  nofollow: z.boolean().optional(),
  ogTitle: z.string().max(90).optional(),
  ogDescription: z.string().max(200).optional(),
  ogImageUrl: httpUrl.optional(),
  socialImageUrl: httpUrl.optional(),
  breadcrumbLabel: z.string().max(60).optional(),
  searchExcerpt: z.string().max(300).optional(),
  structuredDataOverride: z.unknown().optional(),
};

const capabilityFields = {
  capFreePlan: z.boolean().optional(),
  capNsfw: z.boolean().optional(),
  capRealisticCharacters: z.boolean().optional(),
  capAnimeCharacters: z.boolean().optional(),
  capFemaleCharacters: z.boolean().optional(),
  capMaleCharacters: z.boolean().optional(),
  capLgbtqOptions: z.boolean().optional(),
  capCustomCharacters: z.boolean().optional(),
  capImageGeneration: z.boolean().optional(),
  capVideoGeneration: z.boolean().optional(),
  capVoiceMessages: z.boolean().optional(),
  capVoiceCalls: z.boolean().optional(),
  capGroupChat: z.boolean().optional(),
  capLongTermMemory: z.boolean().optional(),
  capMemoryInjection: z.boolean().optional(),
  capCustomScenarios: z.boolean().optional(),
  capDiscreetBilling: z.boolean().optional(),
  capE2eEncryption: z.boolean().optional(),
  capInChatImages: z.boolean().optional(),
  capDedicatedImageGenerator: z.boolean().optional(),
  capDedicatedVideoGenerator: z.boolean().optional(),
  capTokenSystem: z.boolean().optional(),
};

/** Structured verdict for one rating category (keyed by category slug). */
export const categoryVerdictSchema = z.object({
  headline: z.string().max(120).optional(),
  verdict: z.string().max(800).optional(),
  mainStrength: z.string().max(300).optional(),
  mainWeakness: z.string().max(300).optional(),
  pros: z.array(z.string().min(1)).optional(),
  cons: z.array(z.string().min(1)).optional(),
  expertOpinion: z.string().optional(),
  /** Optional linked evidence references (evidence-definition slugs). */
  evidenceRefs: z.array(z.string()).optional(),
});

export const productSchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  status: productStatus,
  tagline: z.string().max(200).optional(),
  websiteUrl: httpUrl.optional(),
  youtubeReviewUrl: httpUrl.optional(),
  dateAdded: dateMs.optional(),
  lastTestedAt: dateMs.optional(),
  scheduledAt: dateMs.optional(),

  oneLineVerdict: z.string().max(300).optional(),
  ourTake: z.string().optional(),
  directoryDescription: z.string().max(400).optional(),
  mainStrength: z.string().max(200).optional(),
  mainLimitation: z.string().max(200).optional(),
  pros: z.array(z.string().min(1)).optional(),
  cons: z.array(z.string().min(1)).optional(),
  bestForLabel: z.string().max(80).optional(), // legacy — superseded by `award`
  recommendedFor: z.string().max(400).optional(), // legacy — superseded by `bestFor`
  notRecommendedFor: z.string().max(400).optional(), // legacy — superseded by `notIdealFor`
  bestFor: z.array(z.string().min(1).max(200)).optional(),
  notIdealFor: z.array(z.string().min(1).max(200)).optional(),
  award: z
    .object({
      kind: z.enum([
        'none',
        'best_overall',
        'best_ai_girlfriend',
        'best_chat',
        'best_images',
        'best_video',
        'best_media',
        'best_roleplay',
        'best_voice',
        'best_memory',
        'best_value',
        'best_free',
        'custom',
      ]),
      customLabel: z.string().max(80).optional(),
      active: z.boolean().optional(),
      startAt: z.number().optional(),
      endAt: z.number().optional(),
      reason: z.string().max(400).optional(),
    })
    .optional(),
  expertOpinion: z.string().optional(),
  categoryVerdicts: z.record(z.string(), categoryVerdictSchema).optional(),
  verified: z.boolean().optional(),
  editorsPick: z.boolean().optional(),
  homepageFeatured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  revisionNotes: z.string().optional(),

  ...capabilityFields,
  ...seoFields,

  publishedInDirectory: z.boolean().optional(),
  minMonthlyPrice: z.number().nonnegative().optional(),
  typicalMonthlyCost: z.number().nonnegative().optional(),
  priceCurrency: z.string().length(3).optional(),
  characterPlatformUrl: z.string().max(500).optional(),
  referralSuffix: z.string().max(200).optional(),
});

/**
 * Approved review content blocks. Server-enforced whitelist: editors cannot
 * inject arbitrary HTML, scripts, fonts, colors, or layouts. Dynamic blocks
 * (scores, pricing, galleries, evidence) render from structured records at
 * page-build time — the data itself is never duplicated into the document.
 */
export const REVIEW_BLOCK_TYPES = [
  'paragraph',
  'h2',
  'h3',
  'bulletList',
  'numberedList',
  'image',
  'video',
  'table',
  'quote',
  'callout',
  'prosCons',
  'faq',
  'relatedGuide',
  'cta',
  'scoreOverall',
  'scoreCategory',
  'pricingTable',
  'characterGallery',
  'publicGallery',
  'evidenceSummary',
  'methodologyLink',
] as const;

export const reviewBlockSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.enum(REVIEW_BLOCK_TYPES),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const reviewSchema = z.object({
  intro: z.string().optional(),
  ourTake: z.string().optional(),
  sections: z
    .array(
      z.object({
        id: z.string(),
        heading: z.string(),
        body: z.string(),
        level: z.union([z.literal(2), z.literal(3)]).optional(),
      }),
    )
    .optional(),
  blocks: z.array(reviewBlockSchema).max(300).optional(),
  lastEditedBy: z.string().max(200).optional(),
  lastEditedAt: dateMs.optional(),
  revisions: z
    .array(
      z.object({
        savedAt: dateMs,
        savedBy: z.string().max(200).optional(),
        blocks: z.array(reviewBlockSchema),
      }),
    )
    .max(20)
    .optional(),
  testingSummary: z.string().optional(),
  versionChangeSummary: z.string().optional(),
  pricingExplanation: z.string().optional(),
});

export const mediaSchema = z.object({
  url: httpUrl.optional(),
  mediaType: z.enum(['image', 'video']),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fileSize: z.number().int().positive().optional(),
  altText: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
  credit: z.string().max(200).optional(),
  adult: z.boolean(),
  ageGated: z.boolean().optional(),
  focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  crop: z
    .object({
      x: z.number().nonnegative(),
      y: z.number().nonnegative(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  sortOrder: z.number().int().nullish(),
  heroSortOrder: z.number().int().nullish(),
  mediaTags: z.array(z.enum(['character', 'chat', 'image_generator', 'hero'])).optional(),
  role: z
    .enum(['gallery', 'logo', 'featured', 'proof', 'character', 'hero', 'chat', 'image_generator'])
    .optional(),
  testCategory: z.string().max(80).optional(),
  approved: z.boolean().optional(),
});

export const paymentProfileSchema = z.object({
  creditCard: z.boolean().optional(),
  debitCard: z.boolean().optional(),
  paypal: z.boolean().optional(),
  crypto: z.boolean().optional(),
  cryptoOnly: z.boolean().optional(),
  applePay: z.boolean().optional(),
  googlePay: z.boolean().optional(),
  wechatPay: z.boolean().optional(),
  alipay: z.boolean().optional(),
  discoverPay: z.boolean().optional(),
  discreetBilling: z.boolean().optional(),
  billingDescriptor: z.string().max(120).optional(),
  notes: z.string().optional(),
  lastVerifiedAt: dateMs.optional(),
  bankTransfer: z.boolean().optional(),
  otherMethods: z.string().max(200).optional(),
  refundPolicy: z.string().max(1000).optional(),
  cancellationMethod: z.string().max(500).optional(),
  cancellationDifficulty: z.enum(['easy', 'moderate', 'difficult']).optional(),
  evidenceMediaIds: z.array(z.string()).optional(),
});

/** One billing option nested under a plan tier (monthly, annual, …). */
export const billingOptionSchema = z.object({
  interval: z.enum(['weekly', 'monthly', 'quarterly', 'six_months', 'yearly', 'lifetime', 'custom']),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  introPrice: z.number().nonnegative().optional(),
  introDuration: z.string().max(60).optional(), // e.g. "first month"
  renewalPrice: z.number().nonnegative().optional(),
  freeTrial: z.boolean().optional(),
  trialLength: z.string().max(60).optional(),
  active: z.boolean(),
});
export type BillingOption = z.infer<typeof billingOptionSchema>;

/** Plan-level entitlement (what this tier includes before feature costs apply). */
export const planAllowanceSchema = z.object({
  id: z.string().min(1).max(80),
  featureKey: z.string().min(1).max(60),
  sourceLabel: z.string().min(1).max(120),
  accessType: z.enum([
    'unlimited',
    'included_quantity',
    'included_credits',
    'pay_as_you_go',
    'not_included',
    'included_unspecified',
  ]),
  quantity: z.number().nonnegative().optional(),
  unit: z.string().max(40).optional(),
  resetInterval: z.enum(['day', 'month', 'billing_cycle', 'one_time', 'none']).optional(),
  notes: z.string().max(300).optional(),
  evidenceMediaIds: z.array(z.string()).optional(),
});
export type PlanAllowanceInput = z.infer<typeof planAllowanceSchema>;

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1).max(120),
  // Legacy single-price fields (fallback for pre-tier records)
  billingInterval: z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'lifetime']),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  introPrice: z.number().nonnegative().optional(),
  freeTrial: z.boolean().optional(),
  trialNotes: z.string().max(300).optional(),
  includedFeatures: z.array(z.string()).optional(),
  includedTokens: z.number().int().nonnegative().optional(),
  includedImages: z.number().int().nonnegative().optional(),
  includedVideos: z.number().int().nonnegative().optional(),
  includedVoiceMinutes: z.number().int().nonnegative().optional(),
  active: z.boolean(),
  sortOrder: z.number().int().optional(),
  lastVerifiedAt: dateMs.optional(),
  // Plan-tier fields
  billingOptions: z.array(billingOptionSchema).optional(),
  /** Generalized plan entitlements (source of truth when present). */
  allowances: z.array(planAllowanceSchema).max(80).optional(),
  description: z.string().max(500).optional(),
  creditRefresh: z
    .enum(['once', 'weekly', 'monthly', 'per_billing_cycle', 'yearly', 'none', 'custom'])
    .optional(),
  creditsRollOver: z.boolean().optional(),
  unlimitedFeatures: z.array(z.string()).optional(),
  restrictions: z.string().max(500).optional(),
  internalNotes: z.string().max(1000).optional(),
  evidenceMediaIds: z.array(z.string()).optional(),
});

export const creditPackageSchema = z
  .object({
    name: z.string().min(1).max(120),
    price: z.number().nonnegative(),
    currency: z.string().length(3),
    tokenAmount: z.number().int().nonnegative().optional(), // legacy total
    estImages: z.number().nonnegative().optional(),
    estVideos: z.number().nonnegative().optional(),
    estMessages: z.number().nonnegative().optional(),
    estCostPerImage: z.number().nonnegative().optional(),
    estCostPerVideo: z.number().nonnegative().optional(),
    active: z.boolean(),
    lastVerifiedAt: dateMs.optional(),
    baseCredits: z.number().int().nonnegative().optional(),
    bonusCredits: z.number().int().nonnegative().optional(),
    sortOrder: z.number().int().optional(),
    subscriberOnly: z.boolean().optional(),
    requiredPlanName: z.string().max(120).optional(),
    internalNotes: z.string().max(1000).optional(),
    evidenceMediaIds: z.array(z.string()).optional(),
  });

import { withDefaultTokenExpiration } from '../pricing/credit-currency';

export const creditCurrencySchema = z
  .object({
    displayName: z.string().max(60).optional(), // e.g. "Gems"
    singular: z.string().max(60).optional(),
    plural: z.string().max(60).optional(),
    icon: z.string().max(60).optional(),
    resetsMonthly: z.boolean().optional(),
    rollsOver: z.boolean().optional(),
    expires: z.boolean().optional(),
    expirationPeriod: z.string().max(120).optional(),
    expirationNotes: z.string().max(300).optional(),
    purchasable: z.boolean().optional(),
    earnable: z.boolean().optional(),
    freeCreditNotes: z.string().max(300).optional(),
  })
  .transform(withDefaultTokenExpiration);
export type CreditCurrency = z.infer<typeof creditCurrencySchema>;

export const PRICING_MODELS = [
  'subscription_only',
  'subscription_credits',
  'credits_only',
  'free_plus_credits',
  'mixed',
  'custom',
] as const;

export const PRICING_SNAPSHOT_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'active',
  'historical',
  'rejected',
] as const;

export const pricingSnapshotSchema = z.object({
  status: z.enum(PRICING_SNAPSHOT_STATUSES),
  pricingModel: z.enum(PRICING_MODELS).optional(),
  creditCurrency: creditCurrencySchema.optional(),
  /** Plan name used for autofill / normalized metrics (optional). */
  referencePlanName: z.string().max(120).optional(),
  effectiveFrom: dateMs.optional(),
  effectiveUntil: dateMs.optional(),
  verifiedAt: dateMs.optional(),
  verifiedBy: z.string().max(200).optional(),
  sourceUrl: z.string().url().max(500).optional().or(z.literal('')),
  internalNotes: z.string().max(2000).optional(),
  publicNote: z.string().max(500).optional(),
  changeSummary: z.string().max(1000).optional(),
  previousSnapshotId: z.string().optional(),
  frozenData: z.unknown().optional(),
  evidenceMediaIds: z.array(z.string()).optional(),
  usageScenarios: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().max(120),
        description: z.string().max(400),
        messagesPerDay: z.number().nonnegative(),
        imagesPerDay: z.number().nonnegative(),
        videosPerDay: z.number().nonnegative(),
        voiceMinutesPerDay: z.number().nonnegative(),
      }),
    )
    .optional(),
});

export const FEATURE_TYPES = [
  'standard_image',
  'premium_image',
  'hd_image',
  'image_regeneration',
  'image_unlock',
  'in_chat_image',
  'standard_video',
  'premium_video',
  'text_to_video',
  'image_to_video',
  'live_cam_video',
  'voice_message',
  'voice_call',
  'chat_message',
  'text_message',
  'message',
  'premium_message',
  'character_creation',
  'character_edit',
  'content_unlock',
  'scenario_unlock',
  'custom',
] as const;

export const FEATURE_UNITS = [
  'per_image',
  'per_batch',
  'per_video',
  'per_second',
  'per_minute',
  'per_message',
  'per_generation',
  'per_unlock',
  'per_request',
  'per_character',
  'custom',
] as const;

export const featureCostSchema = z
  .object({
    featureType: z.enum(FEATURE_TYPES),
    customLabel: z.string().max(120).optional(),
    creditCost: z.number().nonnegative().optional(),
    minCost: z.number().nonnegative().optional(),
    maxCost: z.number().nonnegative().optional(),
    costType: z
      .enum([
        'fixed',
        'range',
        'variable',
        'included',
        'unlimited',
        'pay_as_you_go',
        'not_available',
        'unknown',
      ])
      .optional(),
    unit: z.enum(FEATURE_UNITS),
    quantityProduced: z.number().positive().optional(),
    durationProduced: z.number().positive().optional(),
    qualityTier: z.string().max(60).optional(),
    availablePlanNames: z.array(z.string()).optional(),
    freeAllowance: z.number().nonnegative().optional(),
    notes: z.string().max(500).optional(),
    active: z.boolean(),
    sortOrder: z.number().int().optional(),
    lastVerifiedAt: dateMs.optional(),
    evidenceMediaIds: z.array(z.string()).optional(),
  })
  .refine(
    (v) =>
      v.minCost === undefined || v.maxCost === undefined ? true : v.minCost <= v.maxCost,
    { message: 'minCost must be less than or equal to maxCost' },
  );

export const pricingPromotionSchema = z
  .object({
    name: z.string().min(1).max(160),
    promotionType: z.enum([
      'plan_discount',
      'package_discount',
      'bonus_credits',
      'free_trial',
      'holiday',
      'coupon',
      'custom',
    ]),
    status: z.enum(['draft', 'scheduled', 'active', 'expired', 'cancelled']),
    startAt: dateMs.optional(),
    endAt: dateMs.optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    discountFixed: z.number().nonnegative().optional(),
    bonusCredits: z.number().int().nonnegative().optional(),
    couponCode: z.string().max(80).optional(),
    appliesToPlanNames: z.array(z.string()).optional(),
    appliesToPackageNames: z.array(z.string()).optional(),
    promotionUrl: z.string().url().max(500).optional().or(z.literal('')),
    internalNote: z.string().max(1000).optional(),
    publicNote: z.string().max(500).optional(),
    evidenceMediaIds: z.array(z.string()).optional(),
  })
  .refine((v) => (v.startAt && v.endAt ? v.startAt <= v.endAt : true), {
    message: 'Promotion end date must be after the start date',
  });

export const notificationSchema = z.object({
  dedupKey: z.string().min(1).max(200),
  category: z.enum(['pricing', 'testing', 'publishing', 'affiliates', 'seo', 'system']),
  type: z.string().max(80),
  severity: z.enum(['info', 'success', 'warning', 'critical']),
  title: z.string().min(1).max(200),
  message: z.string().max(1000).optional(),
  productId: z.string().optional(),
  relatedEntityType: z.string().max(80).optional(),
  relatedEntityId: z.string().optional(),
  actionUrl: z.string().max(500).optional(),
  secondaryActionUrl: z.string().max(500).optional(),
  readBy: z.record(z.string(), z.number()).optional(),
  dismissedBy: z.record(z.string(), z.number()).optional(),
  occurrenceCount: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: dateMs.optional(),
});

export const characterSchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  shortDescription: z.string().max(400).optional(),
  personalityTags: z.array(z.string()).optional(),
  characterStyle: z.enum(['realistic', 'anime', 'fantasy', 'other']).optional(),
  genderPresentation: z.string().max(60).optional(),
  adult: z.boolean().optional(),
  active: z.boolean(),
  featured: z.boolean().optional(),
  featuredStartAt: dateMs.optional(),
  featuredEndAt: dateMs.optional(),
  homepageOrder: z.number().int().optional(),
  destinationUrl: z.string().max(500).optional(),
});

export const characterStorySlideSchema = z.object({
  caption: z.string().max(200).optional(),
  duration: z.number().int().positive().max(60_000).optional(), // ms
  adult: z.boolean().optional(),
  active: z.boolean(),
  sortOrder: z.number().int(),
  internalNote: z.string().max(500).optional(),
});

export const affiliateLinkSchema = z.object({
  destinationUrl: httpUrl,
  cloakedSlug: slugSchema,
  linkType: z.enum(['product', 'character', 'campaign']).optional(),
  campaign: z.string().max(120).optional(),
  active: z.boolean(),
  startAt: dateMs.optional(),
  endAt: dateMs.optional(),
  lastVerifiedAt: dateMs.optional(),
  notes: z.string().optional(),
  relTags: z.string().max(120).optional(),
});

export const methodologyVersionSchema = z.object({
  version: z.string().min(1).max(20),
  name: z.string().max(120).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'retired']),
});

export const categorySchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(80),
  description: z.string().optional(),
  weight: z.number().min(0).max(100),
  displayOrder: z.number().int(),
  methodologyUrl: pathString.optional(),
  active: z.boolean(),
});

export const subscoreSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(80),
  description: z.string().optional(),
  weight: z.number().min(0).max(100),
  displayOrder: z.number().int(),
  methodologyUrl: pathString.optional(),
  active: z.boolean(),
});

export const scoringRuleSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('linear'),
    min: z.number(),
    max: z.number(),
    invert: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal('bands'),
    bands: z.array(z.object({ upTo: z.number(), score: z.number().min(0).max(10) })).min(1),
  }),
  z.object({
    kind: z.literal('ynl'),
    yes: z.number().min(0).max(10),
    limited: z.number().min(0).max(10),
    no: z.number().min(0).max(10),
    unknown: z.number().min(0).max(10),
  }),
  z.object({ kind: z.literal('manual') }),
]);

export const evidenceDefinitionSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
  publicDescription: z.string().optional(),
  internalInstructions: z.string().optional(),
  resultFormat: z.string().optional(),
  measurementType: z.enum([
    'boolean',
    'yes_limited_no',
    'count',
    'percentage',
    'seconds',
    'currency',
    'scale',
    'enum',
    'structured',
  ]),
  unit: z.string().max(30).optional(),
  thresholds: z.unknown().optional(),
  scoringRule: scoringRuleSchema,
  weight: z.number().min(0).max(100),
  required: z.boolean(),
  displayOrder: z.number().int(),
  methodologyUrl: pathString.optional(),
  active: z.boolean(),
  // Tester-facing methodology fields (presentation only — never affect scoring).
  questionLabel: z.string().max(200).optional(),
  shortDescription: z.string().max(500).optional(),
  whyItMatters: z.string().max(1000).optional(),
  testInstructions: z.string().optional(),
  inputType: z.enum(['', 'ratio', 'checklist', 'rubric', 'multi_select', 'yes_no', 'yes_no_unknown']).optional(),
  options: z
    .array(
      z.object({
        value: z.union([z.string(), z.number()]),
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  sampleSize: z.number().int().positive().optional(),
  calculationMethod: z
    .union([
      z.object({
        kind: z.literal('ratio'),
        numeratorLabel: z.string(),
        denominatorLabel: z.string(),
        invert: z.boolean().optional(), // e.g. duplicate rate: higher = worse
      }),
      z.object({ kind: z.literal('checklist'), items: z.array(z.string().min(1)).min(1) }),
    ])
    .optional(),
  evidenceRequirements: z
    .array(
      z.object({
        type: z.enum(['screenshot', 'recording', 'video', 'document']),
        description: z.string(),
      }),
    )
    .optional(),
  exampleAnswer: z.string().max(500).optional(),
  helpText: z.string().optional(),
  publicResultTemplate: z.string().max(200).optional(),
  allowUnableToVerify: z.boolean().optional(),
});

export const testRunSchema = z.object({
  name: z.string().min(1).max(160),
  status: testRunStatus,
  testerEmail: z.string().email().optional(),
  factCheckerEmail: z.string().email().optional(),
  startedAt: dateMs.optional(),
  completedAt: dateMs.optional(),
  notes: z.string().optional(),
  changeSummary: z.string().optional(),
});

export const evidenceRawValueSchema = z.union([
  z.object({ value: z.number(), detail: z.record(z.string(), z.unknown()).optional() }),
  z.object({
    status: z.enum(['yes', 'limited', 'optional', 'no', 'unknown', 'na']),
    detail: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({ text: z.string(), detail: z.record(z.string(), z.unknown()).optional() }),
  z.object({ structured: z.record(z.string(), z.unknown()) }),
]);

export const evidenceResultSchema = z.object({
  rawValue: evidenceRawValueSchema.optional(),
  publicResult: z.string().max(200).optional(),
  publicExplanation: z.string().optional(),
  internalNotes: z.string().optional(),
  testDate: dateMs.optional(),
  testerEmail: z.string().email().optional(),
  verificationStatus: z.enum(['unverified', 'verified']).optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  passFail: z.enum(['pass', 'fail']).optional(),
  notApplicable: z.boolean().optional(),
  isUnknown: z.boolean().optional(),
  manualOverrideScore: z.number().min(0).max(10).optional(),
  manualOverrideReason: z.string().optional(),
  proofLinks: z
    .array(
      z.object({
        url: z.string().url().max(500),
        label: z.string().max(200).optional(),
      }),
    )
    .optional(),
});

export const evidenceExplanationSchema = z.object({
  groupKey: z.string().min(1).max(120),
  categorySlug: z.string().min(1).max(80),
  subscoreSlug: z.string().min(1).max(80),
  groupSlug: z.string().min(1).max(80),
  groupName: z.string().min(1).max(200),
  whatThisMeans: z.string().max(2000).optional(),
  explanationStatus: z.enum([
    'not_generated',
    'draft',
    'needs_review',
    'approved',
    'outdated',
    'error',
  ]),
  inputHash: z.string().max(128).optional(),
  generatedFromMethodologyVersion: z.string().max(40).optional(),
  reviewerNote: z.string().max(2000).optional(),
  generationError: z.string().max(2000).optional(),
  promptVersion: z.string().max(40).optional(),
  model: z.string().max(80).optional(),
  tokenUsage: z.record(z.string(), z.unknown()).optional(),
  generatedAt: dateMs.optional(),
  generatedBy: z.string().email().optional(),
  approvedAt: dateMs.optional(),
  approvedBy: z.string().email().optional(),
});

export const rankingMetricSchema = z.object({
  // What to rank by: overall score, a category score, a subscore, or a
  // specific evidence result.
  kind: z.enum(['overall', 'category', 'subscore', 'evidence']),
  key: z.string(), // slug ('overall' for kind=overall)
  weight: z.number().positive(),
});

export const roundupSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(160),
  h1: z.string().max(160).optional(),
  intro: z.string().optional(),
  status: productStatus,
  methodologyNote: z.string().optional(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  rankingFormula: z.object({ metrics: z.array(rankingMetricSchema).min(1) }).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  canonicalUrl: httpUrl.optional(),
  noindex: z.boolean().optional(),
  ogTitle: z.string().max(90).optional(),
  ogDescription: z.string().max(200).optional(),
  ogImageUrl: httpUrl.optional(),
  breadcrumbLabel: z.string().max(60).optional(),
});

export const roundupEntrySchema = z.object({
  publishedPosition: z.number().int().positive().optional(),
  awardLabel: z.string().max(80).optional(),
  reason: z.string().max(400).optional(),
  mainStrength: z.string().max(200).optional(),
  mainLimitation: z.string().max(200).optional(),
  included: z.boolean(),
  editorialOverride: z.boolean().optional(),
  overrideReason: z.string().optional(),
});

export const homepageSlotSchema = z.object({
  kind: z.enum(['top_pick', 'featured_character', 'topic']),
  position: z.number().int().positive(),
  label: z.string().max(80).optional(),
  startAt: dateMs.optional(),
  endAt: dateMs.optional(),
  active: z.boolean(),
});

export const redirectSchema = z
  .object({
    sourcePath: pathString,
    destinationPath: z.union([pathString, httpUrl, z.literal('')]).optional(),
    redirectType: z.union([z.literal(301), z.literal(302), z.literal(410)]),
    active: z.boolean(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.redirectType === 410) return;
    if (!data.destinationPath?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Destination is required for 301/302 redirects.',
        path: ['destinationPath'],
      });
    }
  });

export const adminUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  role: z.enum(['owner', 'admin', 'editor', 'contributor', 'tester', 'fact_checker', 'viewer']),
  active: z.boolean(),
});

export const authorSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
  role: z.string().max(80).optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
  verified: z.boolean().optional(),
  active: z.boolean(),
  sortOrder: z.number().int().optional(),
});

export const GLOSSARY_CATEGORIES = [
  'General',
  'Characters',
  'Customization',
  'Chat',
  'Chat Features',
  'Images',
  'Video',
  'Privacy',
  'Pricing',
] as const;

export const glossaryEntrySchema = z.object({
  term: z.string().min(1).max(120),
  anchor: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only.'),
  tooltipDefinition: z.string().max(500).optional(),
  ctaLabel: z.string().max(80).optional(),
  fullDefinition: z.unknown().optional(),
  aliases: z.array(z.string().min(1).max(120)).max(40).optional(),
  displayAliases: z.array(z.string().min(1).max(120)).max(20).optional(),
  category: z.enum(GLOSSARY_CATEGORIES),
  status: z.enum(['draft', 'published']),
  autoTooltip: z.boolean(),
  scope: z.string().max(40).optional(),
  publishedAt: dateMs.optional(),
});

export const siteSettingSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.unknown(),
});
