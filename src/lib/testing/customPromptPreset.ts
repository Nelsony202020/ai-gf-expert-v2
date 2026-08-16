/** Customization preset counts + optional "custom prompt available" flag. */

export const CUSTOM_PROMPT_PRESET_SLUGS = new Set([
  'outfits',
  'clothing',
  'creator-personalities',
  'traits',
  'interests',
  'relationship',
  'role',
  'kink-options',
  'voice',
]);

export function isCustomPromptPresetSlug(slug: string): boolean {
  return CUSTOM_PROMPT_PRESET_SLUGS.has(slug);
}

export function parseCustomPromptAvailable(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object' || !('detail' in raw)) return false;
  const detail = (raw as { detail?: Record<string, unknown> }).detail;
  return detail?.customPromptAvailable === true;
}

export function withCustomPromptAvailable(
  raw: { value: number; detail?: Record<string, unknown> } | undefined,
  available: boolean,
): { value: number; detail?: Record<string, unknown> } | undefined {
  if (!raw) return undefined;
  const detail = { ...(raw.detail ?? {}) };
  if (available) detail.customPromptAvailable = true;
  else delete detail.customPromptAvailable;
  const keys = Object.keys(detail);
  return keys.length > 0 ? { value: raw.value, detail } : { value: raw.value };
}

export function formatCustomPromptPresetSummary(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object' || !('value' in raw)) return null;
  const value = (raw as { value: unknown }).value;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const custom = parseCustomPromptAvailable(raw);
  const base = `${value} preset${value === 1 ? '' : 's'}`;
  return custom ? `${base} + custom prompt` : base;
}
