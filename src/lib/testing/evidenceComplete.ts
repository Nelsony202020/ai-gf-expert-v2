// Client-side "answered enough to publish" checks aligned with the scoring engine.

import type { RawValue } from '../scoring/engine';
import { isSecurityIncidentsComplete } from './securityIncidents';

const MODE_RATING_SCORES = new Set(['good', 'partial', 'poor']);

type ResultLike = { rawValue?: unknown; notApplicable?: boolean };

/** Raw answer for related-question lookups — includes N/A from the notApplicable flag. */
export function relatedAnswerFromResult(row?: ResultLike): RawValue | undefined {
  if (row?.rawValue != null) return row.rawValue as RawValue;
  if (row?.notApplicable) return { status: 'na' };
  return undefined;
}

/** Build slug → answer map for conditional completion / scoring (chat-modes repair included). */
export function buildRelatedAnswersBySlug(
  entries: Iterable<{ defId: string; row?: ResultLike }>,
  slugByDefId: Map<string, string>,
): Record<string, RawValue | undefined> {
  const out: Record<string, RawValue | undefined> = {};
  for (const { defId, row } of entries) {
    if (!row) continue;
    const slug = slugByDefId.get(defId);
    if (!slug) continue;
    const val = relatedAnswerFromResult(row);
    if (val !== undefined) out[slug] = val;
  }
  if (out['chat-modes'] != null || out['mode-types'] != null) {
    out['chat-modes'] = repairChatModesRaw(out['chat-modes'], out['mode-types']);
  }
  return out;
}

/** True when chat modes were marked N/A — mode-types is excluded from score and progress. */
export function chatModesExcluded(related?: Record<string, RawValue | undefined>): boolean {
  const chatRaw = related?.['chat-modes'];
  return Boolean(
    chatRaw && typeof chatRaw === 'object' && 'status' in chatRaw && chatRaw.status === 'na',
  );
}

/** Infer chat-modes count from rated mode-types when legacy saves omitted detail.count. */
export function repairChatModesRaw(
  chatRaw: unknown,
  modeTypesRaw: unknown,
): RawValue | undefined {
  if (!chatRaw || typeof chatRaw !== 'object' || !('status' in chatRaw)) {
    return chatRaw as RawValue | undefined;
  }
  const chat = chatRaw as { status?: string; detail?: { count?: number } };
  if (chat.status !== 'yes') return chat as RawValue;
  if (typeof chat.detail?.count === 'number') return chat as RawValue;

  const structured =
    modeTypesRaw &&
    typeof modeTypesRaw === 'object' &&
    'structured' in modeTypesRaw
      ? (modeTypesRaw.structured as { modes?: unknown[] })
      : undefined;
  const modes = structured?.modes;
  if (!Array.isArray(modes) || modes.length === 0) return chat as RawValue;

  return { status: 'yes', detail: { count: Math.max(modes.length, 2) } };
}

export function chatModesCount(related?: Record<string, RawValue | undefined>): number | null {
  const chatRaw = related?.['chat-modes'];
  if (!chatRaw || typeof chatRaw !== 'object' || !('status' in chatRaw)) return null;
  if (chatRaw.status === 'no') return 0;
  if (chatRaw.status !== 'yes') return null;
  const detail = 'detail' in chatRaw ? (chatRaw.detail as Record<string, unknown> | undefined) : undefined;
  return typeof detail?.count === 'number' ? detail.count : null;
}

/** Whether a required evidence item counts as answered for testing progress / publish. */
export function isEvidenceAnswerComplete(opts: {
  slug: string;
  rawValue?: unknown;
  notApplicable?: boolean;
  isUnknown?: boolean;
  relatedAnswers?: Record<string, RawValue | undefined>;
  /** Pricing-tab autofill will write this on calculate/publish. */
  hasAutofillSuggestion?: boolean;
}): boolean {
  const { slug, rawValue, notApplicable, isUnknown, relatedAnswers, hasAutofillSuggestion } = opts;

  if (notApplicable || isUnknown) return true;

  if (slug === 'mode-types' && chatModesExcluded(relatedAnswers)) return true;

  if (slug === 'mode-types') {
    const chatRaw = relatedAnswers?.['chat-modes'];
    if (chatRaw && typeof chatRaw === 'object' && 'status' in chatRaw) {
      const chatStatus = String((chatRaw as { status?: string }).status ?? '');
      if (chatStatus === 'no' || chatStatus === 'na') return true;
    }
  }

  if (slug === 'chat-modes') {
    const modeTypesRaw = relatedAnswers?.['mode-types'];
    const raw = repairChatModesRaw(rawValue, modeTypesRaw) as
      | { status?: string; detail?: { count?: number } }
      | undefined;
    if (!raw) return false;
    if (raw.status === 'no' || raw.status === 'na') return true;
    if (raw.status === 'yes') return typeof raw.detail?.count === 'number';
    return false;
  }

  if (rawValue == null) return Boolean(hasAutofillSuggestion);

  if (
    rawValue &&
    typeof rawValue === 'object' &&
    'detail' in rawValue &&
    (rawValue as { detail?: Record<string, unknown> }).detail?.notPossible === true
  ) {
    return true;
  }

  if (slug === 'security-incidents') {
    return isSecurityIncidentsComplete(rawValue as RawValue | undefined);
  }

  if (slug === 'mode-types') {
    const related = { ...relatedAnswers };
    if (related['chat-modes']) {
      related['chat-modes'] = repairChatModesRaw(
        related['chat-modes'],
        rawValue,
      ) as RawValue;
    }
    const modeCount = chatModesCount(related);
    if (modeCount !== null && modeCount <= 1) return true;
    if (modeCount === null) return false;
    const raw = rawValue as { structured?: { modes?: Array<{ rating?: string }> } };
    const modes = raw.structured?.modes;
    if (!Array.isArray(modes) || modes.length === 0) return false;
    return modes.some((m) => MODE_RATING_SCORES.has(String(m.rating ?? '').toLowerCase()));
  }

  return true;
}

/** Required defs not shown in any testing session (e.g. pricing autofill). */
export function supplementalRequiredMissing(
  definitions: { id: string; active?: boolean; required?: boolean; name?: unknown; questionLabel?: unknown; slug?: unknown }[],
  sessionDefIds: Set<string>,
  hasValue: (defId: string) => boolean,
): { count: number; labels: string[]; items: { defId: string; label: string }[] } {
  const COMBINED = new Set(['mode-types', 'live-cam', 'support-channels']);
  const items: { defId: string; label: string }[] = [];
  for (const def of definitions) {
    if (def.active === false || !def.required) continue;
    if (COMBINED.has(String(def.slug ?? ''))) continue;
    if (sessionDefIds.has(def.id)) continue;
    if (hasValue(def.id)) continue;
    items.push({ defId: def.id, label: String(def.questionLabel ?? def.name ?? def.id) });
  }
  return { count: items.length, labels: items.map((i) => i.label), items };
}
