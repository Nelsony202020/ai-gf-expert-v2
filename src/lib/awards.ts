/** Shared product award / directory label helpers. */

export const AWARD_KIND_OPTIONS = [
  { value: 'none', label: 'No label' },
  { value: 'best_overall', label: 'Best Overall' },
  { value: 'best_ai_girlfriend', label: 'Best AI Girlfriend' },
  { value: 'best_chat', label: 'Best for Chat' },
  { value: 'best_images', label: 'Best for Images' },
  { value: 'best_video', label: 'Best for Video' },
  { value: 'best_media', label: 'Best for Media' },
  { value: 'best_roleplay', label: 'Best for Roleplay' },
  { value: 'best_voice', label: 'Best for Voice' },
  { value: 'best_memory', label: 'Best for Memory' },
  { value: 'best_value', label: 'Best Value' },
  { value: 'best_free', label: 'Best Free Option' },
  { value: 'custom', label: 'Custom label' },
] as const;

export type AwardKind = (typeof AWARD_KIND_OPTIONS)[number]['value'];

export type ProductAward = {
  kind: AwardKind | string;
  customLabel?: string;
  active?: boolean;
  startAt?: number;
  endAt?: number;
  reason?: string;
};

const AWARD_LABELS: Record<string, string> = Object.fromEntries(
  AWARD_KIND_OPTIONS.filter((o) => o.value !== 'none' && o.value !== 'custom').map((o) => [
    o.value,
    o.label,
  ]),
);

/** Map award kind → directory ribbon CSS key. */
const AWARD_RIBBON_KEYS: Record<string, string> = {
  best_overall: 'overall',
  best_ai_girlfriend: 'overall',
  best_chat: 'chat',
  best_images: 'images',
  best_video: 'video',
  best_media: 'video',
  best_roleplay: 'roleplay',
  best_voice: 'voice',
  best_memory: 'memory',
  best_value: 'value',
  best_free: 'free',
  custom: 'overall',
};

export function resolveAwardLabel(product: {
  award?: ProductAward | null;
  bestForLabel?: string | null;
}): string | null {
  const a = product.award;
  if (a) {
    if (a.kind === 'none' || a.active === false) return null;
    const now = Date.now();
    if (typeof a.startAt === 'number' && now < a.startAt) return null;
    if (typeof a.endAt === 'number' && now > a.endAt) return null;
    if (a.kind === 'custom') return a.customLabel?.trim() || null;
    return AWARD_LABELS[a.kind] ?? null;
  }
  const legacy = String(product.bestForLabel ?? '').trim();
  return legacy || null;
}

export function awardRibbonKey(award: ProductAward | null | undefined): string | null {
  if (!award || award.kind === 'none' || award.active === false) return null;
  return AWARD_RIBBON_KEYS[award.kind] ?? 'overall';
}

/** Unique key for uniqueness checks (kind, or custom:label). */
export function awardUniquenessKey(award: ProductAward | null | undefined): string | null {
  if (!award || award.kind === 'none' || award.active === false) return null;
  if (award.kind === 'custom') {
    const label = award.customLabel?.trim().toLowerCase();
    return label ? `custom:${label}` : null;
  }
  return `kind:${award.kind}`;
}

export function awardsConflict(
  a: ProductAward | null | undefined,
  b: ProductAward | null | undefined,
): boolean {
  const ka = awardUniquenessKey(a);
  const kb = awardUniquenessKey(b);
  return Boolean(ka && kb && ka === kb);
}
