// InstantDB schema — single source of truth for all structured product data.
// Push with: npx instant-cli@latest push schema
// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    // ------------------------------------------------------------------
    // Built-in namespaces
    // ------------------------------------------------------------------
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),

    // ------------------------------------------------------------------
    // Administration
    // ------------------------------------------------------------------
    adminUsers: i.entity({
      email: i.string().unique().indexed(),
      name: i.string(),
      // owner | admin | editor | tester | fact_checker | viewer
      role: i.string().indexed(),
      active: i.boolean(),
      createdAt: i.date(),
    }),

    auditLog: i.entity({
      actorEmail: i.string().indexed(),
      // e.g. create | update | delete | publish | unpublish | override | restore
      action: i.string().indexed(),
      recordType: i.string().indexed(),
      recordId: i.string().indexed(),
      oldValue: i.json().optional(),
      newValue: i.json().optional(),
      reason: i.string().optional(),
      scoreImpact: i.json().optional(),
      createdAt: i.date().indexed(),
    }),

    siteSettings: i.entity({
      key: i.string().unique().indexed(),
      value: i.json(),
      updatedAt: i.date(),
      updatedBy: i.string().optional(),
    }),

    // Content authors / bylines (Herman Carter etc.) — distinct from adminUsers.
    authors: i.entity({
      slug: i.string().unique().indexed(),
      name: i.string(),
      role: i.string().optional(),
      avatarUrl: i.string().optional(),
      bio: i.string().optional(),
      verified: i.boolean().optional(),
      active: i.boolean(),
      sortOrder: i.number().optional(),
    }),

    // ------------------------------------------------------------------
    // Products
    // ------------------------------------------------------------------
    products: i.entity({
      // Identity
      name: i.string(),
      slug: i.string().unique().indexed(),
      // draft | in_review | scheduled | published | archived
      status: i.string().indexed(),
      tagline: i.string().optional(),
      websiteUrl: i.string().optional(),
      youtubeReviewUrl: i.string().optional(),
      dateAdded: i.date(),
      lastTestedAt: i.date().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
      publishedAt: i.date().optional(),
      scheduledAt: i.date().optional(),
      deletedAt: i.date().optional(),

      // Editorial
      oneLineVerdict: i.string().optional(),
      ourTake: i.string().optional(),
      directoryDescription: i.string().optional(),
      mainStrength: i.string().optional(),
      mainLimitation: i.string().optional(),
      pros: i.json().optional(), // string[]
      cons: i.json().optional(), // string[]
      bestForLabel: i.string().optional(), // legacy free-text award label (superseded by `award`)
      recommendedFor: i.string().optional(), // legacy newline text (superseded by `bestFor`)
      notRecommendedFor: i.string().optional(), // legacy newline text (superseded by `notIdealFor`)
      bestFor: i.json().optional(), // string[] — structured "Best for" audience list
      notIdealFor: i.json().optional(), // string[] — structured "Not ideal for" list
      // Structured optional award: { kind, customLabel?, active, startAt?, endAt?, reason? }
      award: i.json().optional(),
      expertOpinion: i.string().optional(),
      // Structured per-category verdicts keyed by category slug:
      // { [slug]: { verdict, mainStrength, mainWeakness, pros[], cons[], expertOpinion, evidenceRefs[] } }
      categoryVerdicts: i.json().optional(),
      verified: i.boolean().optional(),
      editorsPick: i.boolean().optional(),
      homepageFeatured: i.boolean().optional(),
      displayOrder: i.number().optional(),
      revisionNotes: i.string().optional(),

      // Capabilities (undefined = unknown; power directory filters)
      capFreePlan: i.boolean().optional(),
      capNsfw: i.boolean().optional(),
      capRealisticCharacters: i.boolean().optional(),
      capAnimeCharacters: i.boolean().optional(),
      capFemaleCharacters: i.boolean().optional(),
      capMaleCharacters: i.boolean().optional(),
      capLgbtqOptions: i.boolean().optional(),
      capCustomCharacters: i.boolean().optional(),
      capImageGeneration: i.boolean().optional(),
      capVideoGeneration: i.boolean().optional(),
      capVoiceMessages: i.boolean().optional(),
      capVoiceCalls: i.boolean().optional(),
      capGroupChat: i.boolean().optional(),
      capLongTermMemory: i.boolean().optional(),
      capMemoryInjection: i.boolean().optional(),
      capCustomScenarios: i.boolean().optional(),
      capDiscreetBilling: i.boolean().optional(),
      capE2eEncryption: i.boolean().optional(),
      capInChatImages: i.boolean().optional(),
      capDedicatedImageGenerator: i.boolean().optional(),
      capDedicatedVideoGenerator: i.boolean().optional(),
      capTokenSystem: i.boolean().optional(),

      // SEO (per-page)
      seoTitle: i.string().optional(),
      seoDescription: i.string().optional(),
      h1Override: i.string().optional(),
      canonicalUrl: i.string().optional(),
      noindex: i.boolean().optional(),
      nofollow: i.boolean().optional(),
      ogTitle: i.string().optional(),
      ogDescription: i.string().optional(),
      ogImageUrl: i.string().optional(),
      socialImageUrl: i.string().optional(),
      breadcrumbLabel: i.string().optional(),
      searchExcerpt: i.string().optional(),
      structuredDataOverride: i.json().optional(),

      // Directory / cached metrics (popularity is never the editorial score)
      publishedInDirectory: i.boolean().optional(),
      saveCount: i.number().optional(),
      upvoteCount: i.number().optional(),
      popularityScore: i.number().optional(),
      trendingScore: i.number().optional(),
      minMonthlyPrice: i.number().optional(),
      typicalMonthlyCost: i.number().optional(),
      priceCurrency: i.string().optional(),

      // Character platform links (Candy AI etc.) — referral suffix appended to every character destination URL.
      characterPlatformUrl: i.string().optional(),
      referralSuffix: i.string().optional(),
    }),

    // One canonical review page per product (/reviews/[slug]).
    reviews: i.entity({
      intro: i.string().optional(),
      ourTake: i.string().optional(),
      sections: i.json().optional(), // legacy ordered editorial sections
      // Structured block document: [{ id, type, data }] with a server-validated
      // whitelist of block types (no raw HTML / scripts / arbitrary styling).
      blocks: i.json().optional(),
      lastEditedBy: i.string().optional(),
      lastEditedAt: i.date().optional(),
      // Bounded recent revision history: [{ savedAt, savedBy, blocks }]
      revisions: i.json().optional(),
      testingSummary: i.string().optional(),
      versionChangeSummary: i.string().optional(),
      pricingExplanation: i.string().optional(),
      publishedAt: i.date().optional(),
      updatedAt: i.date().optional(),
    }),

    // ------------------------------------------------------------------
    // Media (originals never destroyed; crops stored as metadata)
    // ------------------------------------------------------------------
    media: i.entity({
      url: i.string().optional(), // cached file URL (or external URL during migration)
      mediaType: i.string(), // image | video
      width: i.number().optional(),
      height: i.number().optional(),
      fileSize: i.number().optional(),
      altText: i.string().optional(),
      caption: i.string().optional(),
      credit: i.string().optional(),
      adult: i.boolean(), // safe vs 18+
      ageGated: i.boolean().optional(),
      focalPoint: i.json().optional(), // { x: 0-1, y: 0-1 }
      crop: i.json().optional(), // { x, y, width, height } in source pixels
      sortOrder: i.number().optional(),
      // Primary placement: gallery (public Photos & Videos) or proof (testing proof tab)
      role: i.string().optional().indexed(),
      // Optional tags: character | chat | image_generator | hero (combinable with gallery or proof)
      mediaTags: i.json().optional(),
      heroSortOrder: i.number().optional(),
      // For testing-evidence media: rating category slug (characters, chat…)
      testCategory: i.string().optional(),
      uploadedBy: i.string().optional(),
      approved: i.boolean().optional(),
      createdAt: i.date(),
      deletedAt: i.date().optional(),
    }),

    // ------------------------------------------------------------------
    // Pricing & payments
    // ------------------------------------------------------------------
    paymentProfiles: i.entity({
      creditCard: i.boolean().optional(),
      debitCard: i.boolean().optional(),
      paypal: i.boolean().optional(),
      crypto: i.boolean().optional(),
      cryptoOnly: i.boolean().optional(), // stored separately: important restriction
      applePay: i.boolean().optional(),
      googlePay: i.boolean().optional(),
      wechatPay: i.boolean().optional(),
      alipay: i.boolean().optional(),
      discoverPay: i.boolean().optional(),
      discreetBilling: i.boolean().optional(),
      billingDescriptor: i.string().optional(),
      notes: i.string().optional(),
      lastVerifiedAt: i.date().optional(),
      bankTransfer: i.boolean().optional(),
      otherMethods: i.string().optional(),
      refundPolicy: i.string().optional(),
      cancellationMethod: i.string().optional(),
      // easy | moderate | difficult
      cancellationDifficulty: i.string().optional(),
      evidenceMediaIds: i.json().optional(), // string[] of media ids
    }),

    subscriptionPlans: i.entity({
      name: i.string(),
      // Legacy single-price fields (superseded by billingOptions; kept as a
      // fallback reader for pre-tier records).
      // monthly | quarterly | yearly | lifetime | weekly
      billingInterval: i.string(),
      price: i.number(),
      currency: i.string(),
      introPrice: i.number().optional(),
      freeTrial: i.boolean().optional(),
      trialNotes: i.string().optional(),
      includedFeatures: i.json().optional(), // string[]
      includedTokens: i.number().optional(),
      includedImages: i.number().optional(),
      includedVideos: i.number().optional(),
      includedVoiceMinutes: i.number().optional(),
      active: i.boolean(),
      sortOrder: i.number().optional(),
      lastVerifiedAt: i.date().optional(),
      // --- Plan-tier fields: one row = one tier (Basic, Premium…) with all
      // billing intervals nested as options. See billingOptionSchema.
      // [{ interval, price, currency, introPrice?, introDuration?, renewalPrice?,
      //    freeTrial?, trialLength?, active }]
      billingOptions: i.json().optional(),
      // Plan entitlements: [{ id, featureKey, sourceLabel, accessType, quantity?,
      //   unit?, resetInterval?, notes?, evidenceMediaIds? }]
      allowances: i.json().optional(),
      description: i.string().optional(),
      // once | weekly | monthly | per_billing_cycle | yearly | none | custom
      creditRefresh: i.string().optional(),
      creditsRollOver: i.boolean().optional(),
      unlimitedFeatures: i.json().optional(), // string[]
      restrictions: i.string().optional(),
      internalNotes: i.string().optional(),
      evidenceMediaIds: i.json().optional(), // string[] of media ids
    }),

    creditPackages: i.entity({
      name: i.string(),
      price: i.number(),
      currency: i.string(),
      tokenAmount: i.number().optional(), // legacy total; superseded by baseCredits+bonusCredits
      estImages: i.number().optional(), // legacy manual estimates (now calculated)
      estVideos: i.number().optional(),
      estMessages: i.number().optional(),
      estCostPerImage: i.number().optional(),
      estCostPerVideo: i.number().optional(),
      active: i.boolean(),
      lastVerifiedAt: i.date().optional(),
      baseCredits: i.number().optional(),
      bonusCredits: i.number().optional(),
      sortOrder: i.number().optional(),
      subscriberOnly: i.boolean().optional(),
      requiredPlanName: i.string().optional(),
      internalNotes: i.string().optional(),
      evidenceMediaIds: i.json().optional(), // string[] of media ids
    }),

    // ------------------------------------------------------------------
    // Pricing snapshots: versioned, immutable-after-approval pricing records.
    // At most one `active` snapshot per product (enforced in the data layer).
    // ------------------------------------------------------------------
    pricingSnapshots: i.entity({
      // draft | pending_review | approved | active | historical | rejected
      status: i.string().indexed(),
      // subscription_only | subscription_credits | credits_only | free_plus_credits | mixed | custom
      pricingModel: i.string().optional(),
      // { displayName, singular, plural, icon?, resetsMonthly?, rollsOver?,
      //   expires?, expirationPeriod?, expirationNotes?, purchasable?, earnable?, freeCreditNotes? }
      creditCurrency: i.json().optional(),
      // Optional plan name used for autofill / normalized pricing metrics
      referencePlanName: i.string().optional(),
      effectiveFrom: i.date().optional(),
      effectiveUntil: i.date().optional(),
      verifiedAt: i.date().optional(),
      verifiedBy: i.string().optional(), // admin email
      sourceUrl: i.string().optional(),
      internalNotes: i.string().optional(),
      publicNote: i.string().optional(),
      changeSummary: i.string().optional(),
      previousSnapshotId: i.string().optional(),
      // Immutable copy of plans/packages/featureCosts/promotions captured when
      // the snapshot is superseded — live rows always reflect current pricing.
      frozenData: i.json().optional(),
      evidenceMediaIds: i.json().optional(), // pricing-page / checkout screenshots
      // Editor-defined usage personas for real-world spend estimates
      usageScenarios: i.json().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
      deletedAt: i.date().optional(),
    }),

    // How much internal currency each action consumes (per snapshot).
    featureCosts: i.entity({
      // standard_image | premium_image | hd_image | image_regeneration | image_unlock |
      // in_chat_image | standard_video | premium_video | text_to_video | image_to_video |
      // live_cam_video | voice_message | voice_call | premium_message | character_creation |
      // character_edit | content_unlock | scenario_unlock | custom
      featureType: i.string(),
      customLabel: i.string().optional(),
      creditCost: i.number().optional(), // single value; use min/max for ranges
      minCost: i.number().optional(),
      maxCost: i.number().optional(),
      // fixed | range | variable
      costType: i.string().optional(),
      // per_image | per_batch | per_video | per_second | per_minute | per_message |
      // per_generation | per_unlock | per_request | per_character | custom
      unit: i.string(),
      quantityProduced: i.number().optional(),
      durationProduced: i.number().optional(), // seconds
      qualityTier: i.string().optional(),
      availablePlanNames: i.json().optional(), // string[]; empty = all plans
      freeAllowance: i.number().optional(),
      notes: i.string().optional(),
      active: i.boolean(),
      sortOrder: i.number().optional(),
      lastVerifiedAt: i.date().optional(),
      evidenceMediaIds: i.json().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
      deletedAt: i.date().optional(),
    }),

    // Temporary promotions — never overwrite standard prices.
    pricingPromotions: i.entity({
      name: i.string(),
      // plan_discount | package_discount | bonus_credits | free_trial | holiday | coupon | custom
      promotionType: i.string(),
      // draft | scheduled | active | expired | cancelled (derived from dates where approved)
      status: i.string(),
      startAt: i.date().optional(),
      endAt: i.date().optional(),
      discountPercent: i.number().optional(),
      discountFixed: i.number().optional(),
      bonusCredits: i.number().optional(),
      couponCode: i.string().optional(),
      appliesToPlanNames: i.json().optional(), // string[]
      appliesToPackageNames: i.json().optional(), // string[]
      promotionUrl: i.string().optional(),
      internalNote: i.string().optional(),
      publicNote: i.string().optional(),
      evidenceMediaIds: i.json().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
      deletedAt: i.date().optional(),
    }),

    // ------------------------------------------------------------------
    // Admin notifications (system-generated; deduped by dedupKey)
    // ------------------------------------------------------------------
    notifications: i.entity({
      dedupKey: i.string().indexed(),
      // pricing | testing | publishing | affiliates | seo | system
      category: i.string().indexed(),
      type: i.string(),
      // info | success | warning | critical
      severity: i.string(),
      title: i.string(),
      message: i.string().optional(),
      productId: i.string().optional(),
      relatedEntityType: i.string().optional(),
      relatedEntityId: i.string().optional(),
      actionUrl: i.string().optional(),
      secondaryActionUrl: i.string().optional(),
      // Per-admin read/dismiss state: { [adminUserId]: timestampMs }
      readBy: i.json().optional(),
      dismissedBy: i.json().optional(),
      occurrenceCount: i.number().optional(),
      metadata: i.json().optional(),
      expiresAt: i.date().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),

    // ------------------------------------------------------------------
    // Characters (unlimited per product; homepage limits are presentation rules)
    // ------------------------------------------------------------------
    characters: i.entity({
      name: i.string(),
      slug: i.string().indexed(), // unique per product (enforced in data layer)
      shortDescription: i.string().optional(),
      personalityTags: i.json().optional(), // string[]
      // realistic | anime | fantasy | other
      characterStyle: i.string().optional(),
      genderPresentation: i.string().optional(),
      adult: i.boolean().optional(),
      active: i.boolean(),
      featured: i.boolean().optional(),
      featuredStartAt: i.date().optional(),
      featuredEndAt: i.date().optional(),
      homepageOrder: i.number().optional(),
      // Direct outbound URL for this character (referral suffix from product is appended at render time
      // unless skipReferralSuffix is set — use that for networks that need a unique full URL per character).
      destinationUrl: i.string().optional(),
      /** When true, use destinationUrl as-is and do not append the product referral suffix. */
      skipReferralSuffix: i.boolean().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
      deletedAt: i.date().optional(),
    }),

    // Ordered story slides shown in the public character story viewer.
    // Media lives in the media entity — slides only hold presentation data.
    characterStorySlides: i.entity({
      caption: i.string().optional(),
      duration: i.number().optional(), // ms; viewer default applies when absent
      adult: i.boolean().optional(),
      active: i.boolean(),
      sortOrder: i.number(),
      internalNote: i.string().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
      deletedAt: i.date().optional(),
    }),

    // ------------------------------------------------------------------
    // Affiliate links (centralized; raw URLs never scattered across records)
    // ------------------------------------------------------------------
    affiliateLinks: i.entity({
      destinationUrl: i.string(),
      cloakedSlug: i.string().unique().indexed(), // /go/[cloakedSlug]
      linkType: i.string().optional(), // product | character | campaign
      campaign: i.string().optional(),
      active: i.boolean(),
      startAt: i.date().optional(),
      endAt: i.date().optional(),
      lastVerifiedAt: i.date().optional(),
      lastCheckStatus: i.string().optional(), // ok | broken | redirect | unchecked
      notes: i.string().optional(),
      clickCount: i.number().optional(),
      /** Space-separated rel tokens on public CTAs — default applied when empty. */
      relTags: i.string().optional(),
      createdAt: i.date(),
    }),

    affiliateLinkHistory: i.entity({
      previousUrl: i.string(),
      newUrl: i.string(),
      changedBy: i.string(),
      changedAt: i.date(),
      reason: i.string().optional(),
    }),

    // ------------------------------------------------------------------
    // Methodology: versions -> categories -> subscores -> evidence definitions
    // ------------------------------------------------------------------
    methodologyVersions: i.entity({
      version: i.string().unique().indexed(), // e.g. v3.1
      name: i.string().optional(),
      description: i.string().optional(),
      // draft | active | retired
      status: i.string().indexed(),
      createdAt: i.date(),
      activatedAt: i.date().optional(),
    }),

    categories: i.entity({
      slug: i.string().indexed(), // characters | customization | chat | ...
      name: i.string(),
      description: i.string().optional(),
      weight: i.number(), // % of overall
      displayOrder: i.number(),
      methodologyUrl: i.string().optional(), // /test/[slug]/
      active: i.boolean(),
    }),

    subscores: i.entity({
      slug: i.string().indexed(),
      name: i.string(),
      description: i.string().optional(),
      weight: i.number(), // % within category
      displayOrder: i.number(),
      methodologyUrl: i.string().optional(),
      active: i.boolean(),
    }),

    evidenceDefinitions: i.entity({
      slug: i.string().indexed(),
      name: i.string(),
      publicDescription: i.string().optional(),
      internalInstructions: i.string().optional(),
      resultFormat: i.string().optional(),
      // boolean | yes_limited_no | count | percentage | seconds | currency | scale | enum | structured
      measurementType: i.string(),
      unit: i.string().optional(),
      thresholds: i.json().optional(),
      scoringRule: i.json(), // see src/lib/scoring/rules.ts
      weight: i.number(), // % within subscore
      required: i.boolean(),
      displayOrder: i.number(),
      methodologyUrl: i.string().optional(),
      active: i.boolean(),
      // --- Tester-facing methodology fields (all optional; UI falls back to
      // name/internalInstructions when absent). None of these affect scoring.
      questionLabel: i.string().optional(), // plain-English question shown to testers
      shortDescription: i.string().optional(), // what exactly is being measured
      whyItMatters: i.string().optional(),
      testInstructions: i.string().optional(), // step-by-step; one step per line
      // presentation hint: '' (derive from measurementType) | ratio | checklist | rubric | multi_select
      inputType: i.string().optional(),
      options: i.json().optional(), // [{ value, label, description? }] for enum/rubric/multi_select
      sampleSize: i.number().optional(), // e.g. review 20 profiles
      calculationMethod: i.json().optional(), // { kind:'ratio', numeratorLabel, denominatorLabel } | { kind:'checklist', items:string[] }
      evidenceRequirements: i.json().optional(), // [{ type:'screenshot'|'recording'|'video'|'document', description }]
      exampleAnswer: i.string().optional(),
      helpText: i.string().optional(),
      publicResultTemplate: i.string().optional(), // e.g. "{value} seconds"
      allowUnableToVerify: i.boolean().optional(), // default true
    }),

    // ------------------------------------------------------------------
    // Test runs & evidence results (versioned; history preserved)
    // ------------------------------------------------------------------
    testRuns: i.entity({
      name: i.string(),
      // not_started | in_progress | ready_for_review | approved | published | superseded
      status: i.string().indexed(),
      testerEmail: i.string().optional(),
      factCheckerEmail: i.string().optional(),
      startedAt: i.date().optional(),
      completedAt: i.date().optional(),
      publishedAt: i.date().optional(),
      notes: i.string().optional(),
      changeSummary: i.string().optional(),
      isCurrentPublished: i.boolean().indexed(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),

    evidenceResults: i.entity({
      rawValue: i.json().optional(), // { value } | { status: 'yes'|'limited'|'no'|'unknown'|'na' } | structured
      normalizedScore: i.number().optional(), // 0-10
      publicResult: i.string().optional(), // e.g. "4.2 seconds", "84%"
      publicExplanation: i.string().optional(),
      internalNotes: i.string().optional(),
      testDate: i.date().optional(),
      testerEmail: i.string().optional(),
      // unverified | verified
      verificationStatus: i.string().optional(),
      // low | medium | high
      confidence: i.string().optional(),
      passFail: i.string().optional(), // pass | fail
      notApplicable: i.boolean().optional(),
      isUnknown: i.boolean().optional(),
      calculationDetails: i.json().optional(),
      // Restricted manual override (audited, reason required)
      manualOverrideScore: i.number().optional(),
      manualOverrideReason: i.string().optional(),
      // Reference URLs attached alongside screenshot proof (policy pages, settings links).
      proofLinks: i.json().optional(),
      updatedAt: i.date(),
    }),

    // Immutable calculated output per published run (what public pages render).
    scoreSnapshots: i.entity({
      // overall | category | subscore
      kind: i.string().indexed(),
      refSlug: i.string().indexed(), // 'overall' or category/subscore slug
      parentSlug: i.string().optional(), // category slug for subscore snapshots
      score: i.number(),
      weight: i.number().optional(),
      calculationVersion: i.string(),
      methodologyVersion: i.string(),
      detail: i.json().optional(),
      createdAt: i.date(),
    }),

    // AI privacy policy analysis — documents + structured proposals for a test run.
    aiPrivacyAnalyses: i.entity({
      promptVersion: i.string().optional(),
      model: i.string().optional(),
      inputHash: i.string().optional().indexed(),
      // draft | applied | failed
      status: i.string().indexed(),
      documents: i.json().optional(),
      structuredOutput: i.json().optional(),
      error: i.string().optional(),
      tokenUsage: i.json().optional(),
      generatedBy: i.string().optional(),
      generatedAt: i.date().optional(),
      updatedAt: i.date(),
    }),

    // AI editorial suggestions — stored separately from published verdict copy.
    aiEditorialSuggestions: i.entity({
      scope: i.string().indexed(), // overall | category | field | outline
      categorySlug: i.string().optional(),
      targetField: i.string().optional(),
      promptVersion: i.string(),
      model: i.string(),
      modelSnapshot: i.string().optional(),
      evidenceIds: i.json().optional(), // string[]
      inputHash: i.string().indexed(),
      structuredOutput: i.json().optional(),
      keyFindings: i.json().optional(),
      // generated | partially_inserted | inserted | edited | rejected | failed | stale
      status: i.string().indexed(),
      error: i.string().optional(),
      tokenUsage: i.json().optional(),
      openaiRequestId: i.string().optional(),
      generatedBy: i.string().optional(),
      generatedAt: i.date(),
      insertedAt: i.date().optional(),
      insertedBy: i.string().optional(),
      rejectedAt: i.date().optional(),
      rejectedBy: i.string().optional(),
      finalEditedValue: i.string().optional(),
    }),

    // Saved AI notes & suggestions per verdict section (reopenable, not regenerated on open).
    aiVerdictNotes: i.entity({
      sectionKey: i.string().indexed(), // step:overall | step:decision | category:chat-features
      scope: i.string().indexed(), // overall | category | outline
      categorySlug: i.string().optional(),
      promptVersion: i.string(),
      model: i.string(),
      evidenceIds: i.json().optional(), // string[]
      inputHash: i.string().indexed(),
      keyFindings: i.json().optional(),
      fieldSuggestions: i.json().optional(), // section-scoped field suggestions
      // generated | stale
      status: i.string().indexed(),
      tokenUsage: i.json().optional(),
      openaiRequestId: i.string().optional(),
      generatedBy: i.string().optional(),
      generatedAt: i.date(),
      updatedAt: i.date(),
    }),

    // Product-scoped "What this means" copy per public evidence group (review drawer).
    evidenceExplanations: i.entity({
      groupKey: i.string().indexed(), // characters/variety/amount
      categorySlug: i.string().indexed(),
      subscoreSlug: i.string().indexed(),
      groupSlug: i.string().indexed(),
      groupName: i.string(),
      whatThisMeans: i.string().optional(),
      // not_generated | draft | needs_review | approved | outdated | error
      explanationStatus: i.string().indexed(),
      inputHash: i.string().optional().indexed(),
      generatedFromMethodologyVersion: i.string().optional(),
      reviewerNote: i.string().optional(),
      generationError: i.string().optional(),
      promptVersion: i.string().optional(),
      model: i.string().optional(),
      tokenUsage: i.json().optional(),
      generatedAt: i.date().optional(),
      generatedBy: i.string().optional(),
      approvedAt: i.date().optional(),
      approvedBy: i.string().optional(),
      updatedAt: i.date(),
    }),

    // Product-scoped "Key takeaway" copy per subscore calculation drawer.
    subscoreTakeaways: i.entity({
      subscoreKey: i.string().indexed(), // characters/variety
      categorySlug: i.string().indexed(),
      subscoreSlug: i.string().indexed(),
      categoryName: i.string(),
      subscoreName: i.string(),
      keyTakeaway: i.string().optional(),
      // not_generated | draft | needs_review | approved | outdated | error
      takeawayStatus: i.string().indexed(),
      inputHash: i.string().optional().indexed(),
      reviewerNote: i.string().optional(),
      generationError: i.string().optional(),
      promptVersion: i.string().optional(),
      model: i.string().optional(),
      tokenUsage: i.json().optional(),
      generatedAt: i.date().optional(),
      generatedBy: i.string().optional(),
      approvedAt: i.date().optional(),
      approvedBy: i.string().optional(),
      updatedAt: i.date(),
    }),

    // ------------------------------------------------------------------
    // Roundups & rankings
    // ------------------------------------------------------------------
    roundups: i.entity({
      slug: i.string().unique().indexed(), // /best/[slug]
      title: i.string(),
      h1: i.string().optional(),
      intro: i.string().optional(),
      // draft | in_review | scheduled | published | archived
      status: i.string().indexed(),
      methodologyNote: i.string().optional(),
      faqs: i.json().optional(), // { question, answer }[]
      rankingFormula: i.json().optional(), // { metrics: [{ kind, key, weight }] }
      publishedAt: i.date().optional(),
      updatedAt: i.date(),
      createdAt: i.date(),
      deletedAt: i.date().optional(),

      // SEO
      seoTitle: i.string().optional(),
      seoDescription: i.string().optional(),
      canonicalUrl: i.string().optional(),
      noindex: i.boolean().optional(),
      ogTitle: i.string().optional(),
      ogDescription: i.string().optional(),
      ogImageUrl: i.string().optional(),
      breadcrumbLabel: i.string().optional(),
    }),

    roundupEntries: i.entity({
      calculatedPosition: i.number().optional(),
      publishedPosition: i.number().optional(),
      awardLabel: i.string().optional(),
      reason: i.string().optional(),
      mainStrength: i.string().optional(),
      mainLimitation: i.string().optional(),
      included: i.boolean(),
      editorialOverride: i.boolean().optional(),
      overrideReason: i.string().optional(), // required when editorialOverride (data layer)
      updatedAt: i.date(),
    }),

    // ------------------------------------------------------------------
    // Homepage management (presentation limits live here, not on records)
    // ------------------------------------------------------------------
    homepageSlots: i.entity({
      // top_pick | featured_character | topic
      kind: i.string().indexed(),
      position: i.number(),
      label: i.string().optional(),
      startAt: i.date().optional(),
      endAt: i.date().optional(),
      active: i.boolean(),
      updatedAt: i.date(),
    }),

    // ------------------------------------------------------------------
    // Redirects (one centralized system for the whole site)
    // ------------------------------------------------------------------
    redirects: i.entity({
      sourcePath: i.string().unique().indexed(),
      destinationPath: i.string(),
      redirectType: i.number(), // 301 | 302 | 410
      active: i.boolean(),
      createdBy: i.string().optional(),
      notes: i.string().optional(),
      hitCount: i.number().optional(),
      createdAt: i.date(),
    }),

    // ------------------------------------------------------------------
    // Glossary (public /glossary/ + review auto-tooltips)
    // ------------------------------------------------------------------
    glossaryEntries: i.entity({
      term: i.string().indexed(),
      anchor: i.string().unique().indexed(),
      tooltipDefinition: i.string(),
      ctaLabel: i.string().optional(), // Tooltip link text; fallback "Read full definition →"
      fullDefinition: i.json(), // TipTap JSONDoc
      aliases: i.json(), // string[] — matching phrases for auto-tooltips
      displayAliases: i.json().optional(), // string[] — public "Also called" labels only
      category: i.string().indexed(),
      status: i.string().indexed(), // draft | published
      autoTooltip: i.boolean(),
      scope: i.string().optional(), // V1: "reviews"
      publishedAt: i.date().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
  },

  links: {
    // adminUsers <-> $users (established at first login by email)
    adminUserUser: {
      forward: { on: 'adminUsers', has: 'one', label: 'user' },
      reverse: { on: '$users', has: 'one', label: 'adminUser' },
    },

    // Product one-to-one
    productReview: {
      forward: { on: 'reviews', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'one', label: 'review' },
    },
    productPaymentProfile: {
      forward: { on: 'paymentProfiles', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'one', label: 'paymentProfile' },
    },

    // Product one-to-many
    productPlans: {
      forward: { on: 'subscriptionPlans', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'subscriptionPlans' },
    },
    productCreditPackages: {
      forward: { on: 'creditPackages', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'creditPackages' },
    },
    productPricingSnapshots: {
      forward: { on: 'pricingSnapshots', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'pricingSnapshots' },
    },
    pricingSnapshotPlans: {
      forward: { on: 'subscriptionPlans', has: 'one', label: 'snapshot' },
      reverse: { on: 'pricingSnapshots', has: 'many', label: 'plans' },
    },
    pricingSnapshotPackages: {
      forward: { on: 'creditPackages', has: 'one', label: 'snapshot' },
      reverse: { on: 'pricingSnapshots', has: 'many', label: 'packages' },
    },
    productFeatureCosts: {
      forward: { on: 'featureCosts', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'featureCosts' },
    },
    pricingSnapshotFeatureCosts: {
      forward: { on: 'featureCosts', has: 'one', label: 'snapshot' },
      reverse: { on: 'pricingSnapshots', has: 'many', label: 'featureCosts' },
    },
    productPricingPromotions: {
      forward: { on: 'pricingPromotions', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'pricingPromotions' },
    },
    pricingSnapshotPromotions: {
      forward: { on: 'pricingPromotions', has: 'one', label: 'snapshot' },
      reverse: { on: 'pricingSnapshots', has: 'many', label: 'promotions' },
    },
    productCharacters: {
      forward: { on: 'characters', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'characters' },
    },
    productMedia: {
      forward: { on: 'media', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'media' },
    },
    productAffiliateLinks: {
      forward: { on: 'affiliateLinks', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'affiliateLinks' },
    },
    productTestRuns: {
      forward: { on: 'testRuns', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'testRuns' },
    },

    // Product authorship
    productAuthor: {
      forward: { on: 'products', has: 'one', label: 'author' },
      reverse: { on: 'authors', has: 'many', label: 'authoredProducts' },
    },
    productFactChecker: {
      forward: { on: 'products', has: 'one', label: 'factChecker' },
      reverse: { on: 'authors', has: 'many', label: 'factCheckedProducts' },
    },

    // Media file + evidence/character attachment
    mediaFile: {
      forward: { on: 'media', has: 'one', label: 'file' },
      reverse: { on: '$files', has: 'one', label: 'media' },
    },
    mediaEvidenceResult: {
      forward: { on: 'media', has: 'one', label: 'evidenceResult' },
      reverse: { on: 'evidenceResults', has: 'many', label: 'attachments' },
    },
    characterImage: {
      forward: { on: 'characters', has: 'one', label: 'image' },
      reverse: { on: 'media', has: 'one', label: 'characterUsingImage' },
    },
    characterStorySlideCharacter: {
      forward: { on: 'characterStorySlides', has: 'one', label: 'character' },
      reverse: { on: 'characters', has: 'many', label: 'storySlides' },
    },
    characterStorySlideMedia: {
      forward: { on: 'characterStorySlides', has: 'one', label: 'media' },
      reverse: { on: 'media', has: 'many', label: 'storySlides' },
    },
    characterStorySlideAffiliateLink: {
      forward: { on: 'characterStorySlides', has: 'one', label: 'affiliateLink' },
      reverse: { on: 'affiliateLinks', has: 'many', label: 'storySlides' },
    },
    productLogo: {
      forward: { on: 'products', has: 'one', label: 'logo' },
      reverse: { on: 'media', has: 'one', label: 'logoOfProduct' },
    },
    productFeaturedImage: {
      forward: { on: 'products', has: 'one', label: 'featuredImage' },
      reverse: { on: 'media', has: 'one', label: 'featuredImageOfProduct' },
    },
    productSecondaryLogo: {
      forward: { on: 'products', has: 'one', label: 'secondaryLogo' },
      reverse: { on: 'media', has: 'one', label: 'secondaryLogoOfProduct' },
    },
    productFeaturedIcon: {
      forward: { on: 'products', has: 'one', label: 'featuredIcon' },
      reverse: { on: 'media', has: 'one', label: 'featuredIconOfProduct' },
    },

    // Characters -> affiliate link
    characterAffiliateLink: {
      forward: { on: 'characters', has: 'one', label: 'affiliateLink' },
      reverse: { on: 'affiliateLinks', has: 'many', label: 'characters' },
    },
    affiliateLinkChanges: {
      forward: { on: 'affiliateLinkHistory', has: 'one', label: 'affiliateLink' },
      reverse: { on: 'affiliateLinks', has: 'many', label: 'history' },
    },

    // Methodology tree
    methodologyCategories: {
      forward: { on: 'categories', has: 'one', label: 'methodologyVersion' },
      reverse: { on: 'methodologyVersions', has: 'many', label: 'categories' },
    },
    categorySubscores: {
      forward: { on: 'subscores', has: 'one', label: 'category' },
      reverse: { on: 'categories', has: 'many', label: 'subscores' },
    },
    subscoreEvidenceDefinitions: {
      forward: { on: 'evidenceDefinitions', has: 'one', label: 'subscore' },
      reverse: { on: 'subscores', has: 'many', label: 'evidenceDefinitions' },
    },

    // Test runs
    testRunMethodologyVersion: {
      forward: { on: 'testRuns', has: 'one', label: 'methodologyVersion' },
      reverse: { on: 'methodologyVersions', has: 'many', label: 'testRuns' },
    },
    testRunPrevious: {
      forward: { on: 'testRuns', has: 'one', label: 'previousRun' },
      reverse: { on: 'testRuns', has: 'many', label: 'supersededBy' },
    },
    testRunEvidenceResults: {
      forward: { on: 'evidenceResults', has: 'one', label: 'testRun' },
      reverse: { on: 'testRuns', has: 'many', label: 'evidenceResults' },
    },
    evidenceResultDefinition: {
      forward: { on: 'evidenceResults', has: 'one', label: 'evidenceDefinition' },
      reverse: { on: 'evidenceDefinitions', has: 'many', label: 'results' },
    },
    evidenceResultProduct: {
      forward: { on: 'evidenceResults', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'evidenceResults' },
    },
    testRunSnapshots: {
      forward: { on: 'scoreSnapshots', has: 'one', label: 'testRun' },
      reverse: { on: 'testRuns', has: 'many', label: 'scoreSnapshots' },
    },
    snapshotProduct: {
      forward: { on: 'scoreSnapshots', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'scoreSnapshots' },
    },
    aiPrivacyAnalysisProduct: {
      forward: { on: 'aiPrivacyAnalyses', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'aiPrivacyAnalyses' },
    },
    aiPrivacyAnalysisTestRun: {
      forward: { on: 'aiPrivacyAnalyses', has: 'one', label: 'testRun' },
      reverse: { on: 'testRuns', has: 'many', label: 'aiPrivacyAnalyses' },
    },
    aiSuggestionProduct: {
      forward: { on: 'aiEditorialSuggestions', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'aiEditorialSuggestions' },
    },
    aiSuggestionTestRun: {
      forward: { on: 'aiEditorialSuggestions', has: 'one', label: 'testRun' },
      reverse: { on: 'testRuns', has: 'many', label: 'aiEditorialSuggestions' },
    },
    aiVerdictNotesProduct: {
      forward: { on: 'aiVerdictNotes', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'aiVerdictNotes' },
    },
    aiVerdictNotesTestRun: {
      forward: { on: 'aiVerdictNotes', has: 'one', label: 'testRun' },
      reverse: { on: 'testRuns', has: 'many', label: 'aiVerdictNotes' },
    },
    evidenceExplanationProduct: {
      forward: { on: 'evidenceExplanations', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'evidenceExplanations' },
    },
    subscoreTakeawayProduct: {
      forward: { on: 'subscoreTakeaways', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'subscoreTakeaways' },
    },

    // Roundups
    roundupEntriesLink: {
      forward: { on: 'roundupEntries', has: 'one', label: 'roundup' },
      reverse: { on: 'roundups', has: 'many', label: 'entries' },
    },
    roundupEntryProduct: {
      forward: { on: 'roundupEntries', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'roundupEntries' },
    },
    roundupEntryAffiliateOverride: {
      forward: { on: 'roundupEntries', has: 'one', label: 'affiliateOverride' },
      reverse: { on: 'affiliateLinks', has: 'many', label: 'roundupEntryOverrides' },
    },
    roundupHeroImage: {
      forward: { on: 'roundups', has: 'one', label: 'heroImage' },
      reverse: { on: 'media', has: 'many', label: 'roundupsUsingImage' },
    },
    roundupAuthor: {
      forward: { on: 'roundups', has: 'one', label: 'author' },
      reverse: { on: 'authors', has: 'many', label: 'authoredRoundups' },
    },
    roundupFactChecker: {
      forward: { on: 'roundups', has: 'one', label: 'factChecker' },
      reverse: { on: 'authors', has: 'many', label: 'factCheckedRoundups' },
    },

    // Reviews authorship
    reviewAuthor: {
      forward: { on: 'reviews', has: 'one', label: 'author' },
      reverse: { on: 'authors', has: 'many', label: 'authoredReviews' },
    },
    reviewFactChecker: {
      forward: { on: 'reviews', has: 'one', label: 'factChecker' },
      reverse: { on: 'authors', has: 'many', label: 'factCheckedReviews' },
    },

    // Homepage slots
    homepageSlotProduct: {
      forward: { on: 'homepageSlots', has: 'one', label: 'product' },
      reverse: { on: 'products', has: 'many', label: 'homepageSlots' },
    },
    homepageSlotCharacter: {
      forward: { on: 'homepageSlots', has: 'one', label: 'character' },
      reverse: { on: 'characters', has: 'many', label: 'homepageSlots' },
    },
  },

  rooms: {},
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
