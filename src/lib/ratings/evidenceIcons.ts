/** Material Symbols icon per evidence-definition slug (used in score calc + contributor rows). */
export const EVIDENCE_DEF_ICONS: Record<string, string> = {
  // Pricing — plan value
  'monthly-price': 'payments',
  'annual-price': 'calendar_month',
  'annual-discount': 'sell',
  'included-credits': 'toll',
  'included-features': 'checklist',
  'plan-limits': 'speed',
  // Pricing — usage costs
  'image-cost': 'image',
  'video-cost': 'movie',
  'voice-cost': 'mic',
  'call-cost': 'call',
  'top-up-value': 'add_shopping_cart',
  'monthly-spend': 'account_balance_wallet',
  // Pricing — free access
  'free-chat': 'chat',
  'free-images': 'photo',
  'free-video': 'videocam',
  'free-voice': 'record_voice_over',
  'free-characters': 'person_add',
  'free-value': 'card_giftcard',
  restrictions: 'event_busy',
  // Pricing — billing
  'pricing-clarity': 'info',
  paywalls: 'lock',
  'credit-expiry': 'schedule',
  refunds: 'currency_exchange',
  cancellation: 'cancel',
  'payment-privacy': 'visibility_off',
};

export function iconForEvidenceDef(slug: string, label?: string): string {
  if (EVIDENCE_DEF_ICONS[slug]) return EVIDENCE_DEF_ICONS[slug];
  const normalized = (label ?? slug).toLowerCase().replace(/\s+/g, '-');
  return EVIDENCE_DEF_ICONS[normalized] ?? 'analytics';
}

/** Single icon for all scored tests on methodology pages (subscore + category test hubs). */
export function iconForMethodologyScoredTest(): string {
  return 'analytics';
}

/** Products waiting on category benchmarks before pricing subscores are fully scored. */
export const PRICING_BENCHMARK_PENDING_SLUGS = new Set(['candy-ai']);

/** Subscores deferred until usage-cost and free-access benchmarks exist. */
export const PRICING_BENCHMARK_DEFER_SUBSCORES = new Set(['usage-costs', 'free-access']);

export const PRICING_BENCHMARK_PENDING_NOTE =
  'We need more reviews to establish benchmarks for usage costs and free access. Per-use cost and free tier scores will appear here once we have enough data — please check back later.';

export function deferPricingBenchmarkScores(productSlug: string, subscoreSlug: string): boolean {
  return (
    PRICING_BENCHMARK_PENDING_SLUGS.has(productSlug) &&
    PRICING_BENCHMARK_DEFER_SUBSCORES.has(subscoreSlug)
  );
}

/** @deprecated Use deferPricingBenchmarkScores */
export function deferUsageCostScores(productSlug: string, subscoreSlug: string): boolean {
  return deferPricingBenchmarkScores(productSlug, subscoreSlug);
}

/** @deprecated Use deferPricingBenchmarkScores */
export const deferPayAsYouGoScores = deferUsageCostScores;
