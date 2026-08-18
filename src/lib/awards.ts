/** Shared product award / directory label helpers. */

export {
  PUBLIC_AWARD_DEFS,
  AWARD_PRIORITY,
  computeProductAwardIndex,
  getPrimaryAward,
  getSecondaryAwards,
  getContextualAward,
  getAwardsForSlug,
  attachAwardsToPicks,
  type PublicAwardKind,
  type ProductAwardBadge,
} from './awards/compute';

export const AWARD_KIND_OPTIONS = [
  { value: 'none', label: 'No label' },
  { value: 'best_overall', label: 'Best Overall' },
  { value: 'best_images', label: 'Best Images' },
  { value: 'best_videos', label: 'Best Videos' },
  { value: 'best_roleplay', label: 'Best Roleplay' },
  { value: 'best_price', label: 'Best Price' },
  { value: 'custom', label: 'Custom label' },
  // Legacy kinds kept for existing DB records
  { value: 'best_ai_girlfriend', label: 'Best AI Girlfriend (legacy)' },
  { value: 'best_chat', label: 'Best for Chat (legacy)' },
  { value: 'best_video', label: 'Best for Video (legacy)' },
  { value: 'best_media', label: 'Best for Media (legacy)' },
  { value: 'best_voice', label: 'Best for Voice (legacy)' },
  { value: 'best_memory', label: 'Best for Memory (legacy)' },
  { value: 'best_value', label: 'Best Value (legacy)' },
  { value: 'best_free', label: 'Best Free Option (legacy)' },
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

/** Map award kind → sort / ribbon key. */
const AWARD_RIBBON_KEYS: Record<string, string> = {
  best_overall: 'overall',
  best_ai_girlfriend: 'overall',
  best_images: 'images',
  best_videos: 'videos',
  best_video: 'videos',
  best_media: 'videos',
  best_roleplay: 'roleplay',
  best_price: 'price',
  best_value: 'price',
  best_chat: 'roleplay',
  best_voice: 'roleplay',
  best_memory: 'roleplay',
  best_free: 'price',
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
