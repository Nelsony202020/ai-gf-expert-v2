// Client-side "answered enough to publish" checks aligned with the scoring engine.

import type { RawValue } from '../scoring/engine';

const MODE_RATING_SCORES = new Set(['good', 'partial', 'poor']);

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
  if (rawValue == null) return Boolean(hasAutofillSuggestion);

  if (slug === 'chat-modes') {
    const modeTypesRaw = relatedAnswers?.['mode-types'];
    const raw = repairChatModesRaw(rawValue, modeTypesRaw) as
      | { status?: string; detail?: { count?: number } }
      | undefined;
    if (!raw) return false;
    if (raw.status === 'no') return true;
    if (raw.status === 'yes') return typeof raw.detail?.count === 'number';
    return false;
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
  definitions: { id: string; active?: boolean; required?: boolean; name?: unknown; questionLabel?: unknown }[],
  sessionDefIds: Set<string>,
  hasValue: (defId: string) => boolean,
): { count: number; labels: string[] } {
  const labels: string[] = [];
  for (const def of definitions) {
    if (def.active === false || !def.required) continue;
    if (sessionDefIds.has(def.id)) continue;
    if (hasValue(def.id)) continue;
    labels.push(String(def.questionLabel ?? def.name ?? def.id));
  }
  return { count: labels.length, labels };
}
