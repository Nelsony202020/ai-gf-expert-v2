// Product category for usage benchmarks and admin labeling.

export type ProductType = 'ai_girlfriend_app' | 'nsfw_chatbot';

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'ai_girlfriend_app' as const, label: 'AI girlfriend app' },
  { value: 'nsfw_chatbot' as const, label: 'NSFW chatbot' },
];

const SLUG_DEFAULTS: Record<string, ProductType> = {
  'candy-ai': 'ai_girlfriend_app',
  'ourdream-ai': 'ai_girlfriend_app',
  'nectar-ai': 'ai_girlfriend_app',
  'juicychat-ai': 'nsfw_chatbot',
  girlfriendgpt: 'nsfw_chatbot',
};

export function resolveProductType(slug: string, stored?: unknown): ProductType {
  const raw = stored != null ? String(stored).trim() : '';
  if (raw === 'ai_girlfriend_app' || raw === 'nsfw_chatbot') return raw;
  return SLUG_DEFAULTS[slug] ?? 'ai_girlfriend_app';
}

export function productTypeLabel(type: ProductType): string {
  return PRODUCT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? 'AI girlfriend app';
}
