import {
  pricingPageCopyPrivateNotesSchema,
  pricingPageCopySchema,
  type PricingPageCopy,
  type PricingPageCopyPrivateNotes,
} from '../validation/schemas';

export type { PricingPageCopy, PricingPageCopyPrivateNotes };

const PUBLIC_KEYS = [
  'introduction',
  'marketPositionCommentary',
  'plansNote',
  'realWorldCostCommentary',
  'comparisonCommentary',
  'expertOpinion',
] as const;

/** Normalize raw InstantDB JSON into a typed pageCopy object. */
export function parsePricingPageCopy(raw: unknown): PricingPageCopy {
  if (!raw || typeof raw !== 'object') return {};
  const parsed = pricingPageCopySchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

function trimOrEmpty(value: unknown): string {
  return String(value ?? '').trim();
}

function mergePrivateNotes(
  existing: PricingPageCopyPrivateNotes | undefined,
  patch: PricingPageCopyPrivateNotes | undefined,
): PricingPageCopyPrivateNotes | undefined {
  if (!patch) return existing;
  const next: PricingPageCopyPrivateNotes = { ...(existing ?? {}) };
  for (const key of PUBLIC_KEYS) {
    if (!(key in patch)) continue;
    const trimmed = trimOrEmpty(patch[key]);
    if (!trimmed) delete next[key];
    else next[key] = trimmed;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

/** Merge a patch into existing pageCopy, dropping empty strings. */
export function mergePricingPageCopy(
  existing: unknown,
  patch: Partial<PricingPageCopy>,
): PricingPageCopy {
  const base = parsePricingPageCopy(existing);
  const next: PricingPageCopy = { ...base };

  for (const key of PUBLIC_KEYS) {
    if (!(key in patch)) continue;
    const trimmed = trimOrEmpty(patch[key]);
    if (!trimmed) delete next[key];
    else next[key] = trimmed;
  }

  if ('privateNotes' in patch) {
    const merged = mergePrivateNotes(base.privateNotes, patch.privateNotes);
    if (merged) next.privateNotes = merged;
    else delete next.privateNotes;
  }

  return next;
}

export function parsePrivateNotes(raw: unknown): PricingPageCopyPrivateNotes {
  if (!raw || typeof raw !== 'object') return {};
  const parsed = pricingPageCopyPrivateNotesSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}
