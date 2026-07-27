/** Confirm append/replace when inserting AI text into a non-empty field. */
export type InsertConflictChoice = 'append' | 'replace' | 'cancel';

export function confirmInsertConflict(fieldLabel: string): InsertConflictChoice {
  const replace = window.confirm(
    `${fieldLabel} already contains content.\n\nClick OK to replace it, or Cancel to choose append instead.`,
  );
  if (replace) return 'replace';
  const append = window.confirm('Append the suggestion to the existing content?');
  if (append) return 'append';
  return 'cancel';
}

export function applyTextInsert(
  existing: string,
  suggestion: string,
  choice: InsertConflictChoice,
): string | null {
  if (choice === 'cancel') return null;
  const next = suggestion.trim();
  if (!next) return null;
  if (choice === 'replace' || !existing.trim()) return next;
  return `${existing.trim()}\n\n${next}`;
}

export function applyListInsert(
  existing: string[],
  items: string[],
  choice: InsertConflictChoice,
): string[] | null {
  if (choice === 'cancel') return null;
  const next = items.map((s) => s.trim()).filter(Boolean);
  if (next.length === 0) return null;
  if (choice === 'replace' || existing.length === 0) return next;
  const seen = new Set(existing.map((s) => s.toLowerCase()));
  const merged = [...existing];
  for (const item of next) {
    if (!seen.has(item.toLowerCase())) merged.push(item);
  }
  return merged;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function blockText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return String((value as { text: string }).text ?? '').trim();
  }
  return '';
}

export function listItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item : blockText(item)))
    .map((s) => s.trim())
    .filter(Boolean);
}

export { blockText };
