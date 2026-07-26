/** Join structured admin list fields for compact single-line display. */
export function formatAudienceList(items: unknown, fallback = ''): string {
  if (!Array.isArray(items)) return fallback;
  const lines = items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines.join(' · ') : fallback;
}

/** Split legacy newline-separated admin text into list items. */
export function splitLegacyLines(text: unknown): string[] {
  if (typeof text !== 'string' || !text.trim()) return [];
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean);
}
