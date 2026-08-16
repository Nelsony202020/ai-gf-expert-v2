/**
 * Human-facing evidence labels for AI prompts and public copy.
 * Prefer these over raw InstantDB definition names when talking to models or readers.
 */

const AI_EVIDENCE_DISPLAY_NAMES: Record<string, string> = {
  'images-received': 'In-chat images',
  'images-sent': 'Images you can send',
  'chat-video': 'In-chat video',
  'voice-received': 'Voice message generation',
  'voice-sent': 'Voice messages you can send',
  'voice-calls': 'AI phone calls',
  'live-cam': 'Live cam',
};

/** Prefer mapped public label; fall back to DB name/slug. */
export function evidenceDisplayName(slug: string, fallback?: string | null): string {
  const mapped = AI_EVIDENCE_DISPLAY_NAMES[slug];
  if (mapped) return mapped;
  const fb = (fallback ?? '').trim();
  return fb || slug;
}

export function isAvailabilityMeasurement(measurementType: string | null | undefined): boolean {
  const mt = String(measurementType ?? '').toLowerCase();
  return mt === 'boolean' || mt === 'yes_limited_no' || mt === 'ynl';
}
